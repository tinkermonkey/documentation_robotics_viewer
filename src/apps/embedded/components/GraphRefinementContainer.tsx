/**
 * GraphRefinementContainer Component
 * Generic application container for layout refinement workflow
 * Works with ANY graph type (spec, model, layer-specific, etc.)
 *
 * Usage:
 *   <GraphRefinementContainer
 *     diagramType="spec-viewer"
 *     renderGraph={(layoutEngine, layoutParameters) => (
 *       <GraphViewer model={model} layoutEngine={layoutEngine} layoutParameters={layoutParameters} />
 *     )}
 *   />
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Card, Select, Badge, Spinner, Tabs, TabItem } from 'flowbite-react';
import { LayoutEngineType } from '@/core/layout/engines';
import { RefinementLoop } from '@/core/services/refinement/refinementLoop';
import { ParameterAdjustmentPanel } from './refinement/ParameterAdjustmentPanel';
import { RefinementActionButtons } from './refinement/RefinementActionButtons';
import { LayoutHistory } from './refinement/LayoutHistory';
import { calculateLayoutQuality, LayoutType } from '@/core/services/metrics/graphReadabilityService';
import { useLayoutPreferencesStore } from '@/core/stores/layoutPreferencesStore';
import { Node, Edge } from '@xyflow/react';

export interface GraphRefinementContainerProps {
  /** Type of diagram being refined (for quality metrics and session storage) */
  diagramType: 'spec-viewer' | 'model-viewer' | 'motivation' | 'business' | 'c4' | 'layer-specific';

  /** Render function for the graph viewer - receives layout engine and parameters */
  renderGraph: (layoutEngine: LayoutEngineType, layoutParameters: Record<string, any>) => React.ReactNode;

  /** Optional callback to extract current nodes/edges for quality calculation */
  onExtractGraphData?: () => { nodes: Node[]; edges: Edge[] };

  /** Optional initial layout engine */
  initialLayoutEngine?: LayoutEngineType;

  /** Optional initial parameters */
  initialParameters?: Record<string, any>;

  /** Optional left sidebar content to show alongside refinement UI */
  leftSidebarContent?: React.ReactNode;
}

interface LayoutIteration {
  id: number;
  parameters: Record<string, any>;
  qualityScore: number;
  timestamp: Date;
  screenshot?: string;
}

// Default parameters for each layout engine
const DEFAULT_PARAMETERS: Record<LayoutEngineType, Record<string, any>> = {
  'd3-force': {
    strength: -300,
    distance: 150,
    iterations: 300,
  },
  'elk': {
    algorithm: 'layered',
    direction: 'RIGHT',
    orthogonalRouting: true,
    nodeSpacing: 100,
    layerSpacing: 150,
    edgeSpacing: 30,
  },
  'graphviz': {
    algorithm: 'dot',
    rankdir: 'TB',
    nodesep: 1.0,
    ranksep: 1.5,
  },
  'dagre': {
    rankdir: 'TB',
    nodesep: 50,
    ranksep: 50,
  },
};

const GraphRefinementContainer: React.FC<GraphRefinementContainerProps> = ({
  diagramType,
  renderGraph,
  onExtractGraphData,
  initialLayoutEngine = 'd3-force',
  initialParameters,
  leftSidebarContent,
}) => {
  // Layout state
  const [layoutEngine, setLayoutEngine] = useState<LayoutEngineType>(initialLayoutEngine);
  const [layoutParameters, setLayoutParameters] = useState<Record<string, any>>(
    initialParameters || DEFAULT_PARAMETERS[initialLayoutEngine]
  );

  // Refinement state
  const [refinementActive, setRefinementActive] = useState(false);
  const [currentIteration, setCurrentIteration] = useState<LayoutIteration | null>(null);
  const [iterationHistory, setIterationHistory] = useState<LayoutIteration[]>([]);
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [isCalculatingQuality, setIsCalculatingQuality] = useState(false);
  const refinementLoopRef = useRef<RefinementLoop | null>(null);
  const iterationIdRef = useRef(0);

  // Preferences store
  const { saveSession } = useLayoutPreferencesStore();

  /**
   * Map layout engine to layout type for quality metrics
   */
  const getLayoutType = (engine: LayoutEngineType): LayoutType => {
    switch (engine) {
      case 'd3-force':
        return 'force-directed';
      case 'dagre':
      case 'elk':
      case 'graphviz':
        return 'hierarchical';
      default:
        return 'force-directed';
    }
  };

  /**
   * Calculate quality score for current layout
   */
  const calculateQualityScore = useCallback(async () => {
    setIsCalculatingQuality(true);
    try {
      let nodes: Node[] = [];
      let edges: Edge[] = [];

      // Extract graph data if callback provided
      if (onExtractGraphData) {
        const graphData = onExtractGraphData();
        nodes = graphData.nodes;
        edges = graphData.edges;
      }

      // Calculate metrics
      const layoutType = getLayoutType(layoutEngine);
      const report = calculateLayoutQuality(nodes, edges, layoutType, diagramType);
      const score = report.overallScore || 0;

      setQualityScore(score);
      return score;
    } catch (err) {
      console.error('Error calculating quality:', err);
      return 0;
    } finally {
      setIsCalculatingQuality(false);
    }
  }, [onExtractGraphData, diagramType, layoutEngine]);

  /**
   * Handle layout engine change
   */
  const handleEngineChange = useCallback((newEngine: LayoutEngineType) => {
    setLayoutEngine(newEngine);
    setLayoutParameters(DEFAULT_PARAMETERS[newEngine]);

    // Reset refinement
    setRefinementActive(false);
    setIterationHistory([]);
    refinementLoopRef.current = null;
  }, []);

  /**
   * Handle parameter change from adjustment panel
   */
  const handleParameterChange = useCallback((newParams: Record<string, any>) => {
    // Validate parameters - ensure no NaN or undefined values
    const validatedParams: Record<string, any> = {};
    let hasInvalidValue = false;

    for (const [key, value] of Object.entries(newParams)) {
      if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
        console.warn(`[GraphRefinementContainer] Invalid parameter value for ${key}: ${value}`);
        hasInvalidValue = true;
        break;
      }
      validatedParams[key] = value;
    }

    // Only update if all parameters are valid
    if (!hasInvalidValue) {
      setLayoutParameters(validatedParams);

      // Create new iteration
      const iteration: LayoutIteration = {
        id: iterationIdRef.current++,
        parameters: validatedParams,
        qualityScore: qualityScore,
        timestamp: new Date(),
      };

      setCurrentIteration(iteration);
      setIterationHistory(prev => [...prev, iteration]);

      // Recalculate quality score
      calculateQualityScore();
    }
  }, [qualityScore, calculateQualityScore]);

  /**
   * Start automated refinement
   */
  const handleStartAutoRefinement = useCallback(async () => {
    setRefinementActive(true);

    // Get current graph data
    let graphData = { nodes: [], edges: [] };
    if (onExtractGraphData) {
      graphData = onExtractGraphData();
    }

    // Create refinement loop
    const loop = new RefinementLoop(
      graphData,
      diagramType,
      layoutParameters,
      'random'
    );

    refinementLoopRef.current = loop;

    // Start refinement iterations
    await loop.start((iteration) => {
      const newIteration: LayoutIteration = {
        id: iterationIdRef.current++,
        parameters: iteration.parameters,
        qualityScore: iteration.score,
        timestamp: new Date(),
      };

      setCurrentIteration(newIteration);
      setIterationHistory(prev => [...prev, newIteration]);
      setLayoutParameters(iteration.parameters);
      setQualityScore(iteration.score);

      // Stop if quality is excellent
      if (iteration.score > 0.9) {
        loop.pause();
        setRefinementActive(false);
      }
    });
  }, [layoutParameters, diagramType, onExtractGraphData]);

  /**
   * Accept current parameters
   */
  const handleAccept = useCallback(() => {
    if (!currentIteration) return;

    // Save session
    saveSession({
      id: `${diagramType}-refinement-${Date.now()}`,
      name: `${diagramType} Layout - ${layoutEngine}`,
      diagramType: diagramType,
      layoutEngine: layoutEngine,
      parameters: layoutParameters,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'completed',
      history: iterationHistory.map(iter => ({
        iteration: iter.id,
        score: iter.qualityScore,
        parameters: iter.parameters,
      })),
    });

    setRefinementActive(false);
    alert('Layout parameters saved!');
  }, [currentIteration, layoutEngine, layoutParameters, iterationHistory, saveSession, diagramType]);

  /**
   * Reject and revert to previous parameters
   */
  const handleReject = useCallback(() => {
    if (iterationHistory.length < 2) return;

    // Revert to second-to-last iteration
    const previousIteration = iterationHistory[iterationHistory.length - 2];
    setLayoutParameters(previousIteration.parameters);
    setCurrentIteration(previousIteration);
    setQualityScore(previousIteration.qualityScore);

    // Remove last iteration
    setIterationHistory(prev => prev.slice(0, -1));
  }, [iterationHistory]);

  /**
   * Continue refinement
   */
  const handleRefine = useCallback(() => {
    setRefinementActive(true);
  }, []);

  /**
   * Preview iteration from history
   */
  const handlePreviewIteration = useCallback((iteration: LayoutIteration) => {
    setLayoutParameters(iteration.parameters);
    setQualityScore(iteration.qualityScore);
  }, []);

  /**
   * Revert to iteration from history
   */
  const handleRevertToIteration = useCallback((iteration: LayoutIteration) => {
    setLayoutParameters(iteration.parameters);
    setCurrentIteration(iteration);
    setQualityScore(iteration.qualityScore);
  }, []);

  // Calculate initial quality score
  useEffect(() => {
    calculateQualityScore();
  }, []);

  return (
    <div className="flex h-full gap-4 p-4" data-testid="graph-refinement-container">
      {/* Optional Left Sidebar */}
      {leftSidebarContent && (
        <div className="w-64 flex-shrink-0">
          {leftSidebarContent}
        </div>
      )}

      {/* Main Refinement Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Layout Controls */}
        <Card data-testid="layout-controls-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Layout Engine
                </label>
                <Select
                  value={layoutEngine}
                  onChange={(e) => handleEngineChange(e.target.value as LayoutEngineType)}
                  sizing="sm"
                  disabled={refinementActive}
                >
                  <option value="d3-force">Force-Directed (Organic)</option>
                  <option value="elk">ELK Orthogonal (Circuit-Style)</option>
                  <option value="graphviz">Graphviz DOT</option>
                  <option value="dagre">Dagre Hierarchical</option>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Quality Score
                </label>
                <div className="flex items-center gap-2">
                  <Badge color={qualityScore > 0.8 ? 'success' : qualityScore > 0.6 ? 'warning' : 'failure'}>
                    {isCalculatingQuality ? (
                      <Spinner size="sm" />
                    ) : (
                      `${(qualityScore * 100).toFixed(1)}%`
                    )}
                  </Badge>
                  {refinementActive && (
                    <Badge color="info">Refining...</Badge>
                  )}
                </div>
              </div>
            </div>

            <RefinementActionButtons
              onAccept={handleAccept}
              onReject={handleReject}
              onRefine={handleRefine}
              onAuto={handleStartAutoRefinement}
              disabled={!currentIteration || refinementActive}
            />
          </div>
        </Card>

        {/* Graph Viewer */}
        <div className="flex-1 min-h-0">
          {renderGraph(layoutEngine, layoutParameters)}
        </div>
      </div>

      {/* Right Sidebar - Refinement Controls */}
      <div className="w-96 flex-shrink-0 flex flex-col gap-4">
        <Tabs>
          <TabItem title="Parameters" active>
            <ParameterAdjustmentPanel
              diagramType={diagramType}
              layoutEngine={layoutEngine}
              currentParameters={layoutParameters}
              currentScore={qualityScore}
              onParametersChange={handleParameterChange}
              debounceMs={500}
            />
          </TabItem>

          <TabItem title="History">
            <LayoutHistory
              iterations={iterationHistory.map(iter => ({
                iterationNumber: iter.id,
                qualityScore: {
                  combinedScore: iter.qualityScore,
                  readabilityScore: iter.qualityScore,
                  aestheticScore: iter.qualityScore,
                  layoutScore: iter.qualityScore,
                  similarityScore: iter.qualityScore, // Add missing property
                },
                score: iter.qualityScore,
                screenshotUrl: iter.screenshot || '',
                improved: false,
                improvementDelta: 0,
                parameters: iter.parameters as any,
                timestamp: iter.timestamp.toISOString(),
                durationMs: 0,
              }))}
              currentIterationNumber={currentIteration?.id || 0}
              onPreview={(iterationNumber) => {
                const iteration = iterationHistory.find(i => i.id === iterationNumber);
                if (iteration) handlePreviewIteration(iteration);
              }}
              onRevert={(iterationNumber) => {
                const iteration = iterationHistory.find(i => i.id === iterationNumber);
                if (iteration) handleRevertToIteration(iteration);
              }}
            />
          </TabItem>
        </Tabs>
      </div>
    </div>
  );
};

export default GraphRefinementContainer;
