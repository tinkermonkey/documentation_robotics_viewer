/**
 * SpecGraphViewWithRefinement Component
 * Spec graph viewer with full human-in-the-loop refinement system
 * Allows interactive parameter tuning with quality feedback
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Button, Card, Select, Badge, Tabs, Spinner } from 'flowbite-react';
import GraphViewer from '../../../core/components/GraphViewer';
import { DataLoader } from '../../../core/services/dataLoader';
import { GitHubService } from '../../../core/services/githubService';
import { LocalFileLoader } from '../../../core/services/localFileLoader';
import { SpecParser } from '../../../core/services/specParser';
import { MetaModel } from '../../../core/types';
import { SpecDataResponse } from '../services/embeddedDataLoader';
import { LoadingState, ErrorState, EmptyState } from './shared';
import { LayoutEngineType } from '@/core/layout/engines';
import { RefinementLoop } from '@/core/services/refinement/refinementLoop';
import { ParameterAdjustmentPanel } from './refinement/ParameterAdjustmentPanel';
import { RefinementFeedbackPanel } from './refinement/RefinementFeedbackPanel';
import { LayoutHistory } from './refinement/LayoutHistory';
import { calculateMetrics } from '@/core/services/metrics/graphReadabilityService';
import { useLayoutPreferencesStore } from '@/core/stores/layoutPreferencesStore';
import { Node, Edge } from '@xyflow/react';

export interface SpecGraphViewWithRefinementProps {
  specData: SpecDataResponse;
  selectedSchemaId?: string | null;
}

interface LayoutIteration {
  id: number;
  parameters: Record<string, any>;
  qualityScore: number;
  timestamp: Date;
  screenshot?: string;
}

const SpecGraphViewWithRefinement: React.FC<SpecGraphViewWithRefinementProps> = ({
  specData,
  selectedSchemaId
}) => {
  const [model, setModel] = useState<MetaModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Layout state
  const [layoutEngine, setLayoutEngine] = useState<LayoutEngineType>('d3-force');
  const [layoutParameters, setLayoutParameters] = useState<Record<string, any>>({
    strength: -300,
    distance: 150,
    iterations: 300,
  });

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

  // Layout parameter presets
  const layoutPresets = {
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
    }
  };

  // Create DataLoader
  const dataLoader = useMemo(() => {
    return new DataLoader(
      new GitHubService(),
      new LocalFileLoader(),
      new SpecParser()
    );
  }, []);

  /**
   * Convert spec data to MetaModel
   */
  useEffect(() => {
    const convertSpecToModel = () => {
      try {
        setLoading(true);
        setError('');

        if (!specData || !specData.schemas) {
          throw new Error('Invalid spec data: missing schemas');
        }

        const cleanedSchemas: Record<string, any> = {};
        for (const [filename, schema] of Object.entries(specData.schemas)) {
          const layerName = filename
            .replace(/^\d+-/, '')
            .replace(/-layer.*$/, '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
          cleanedSchemas[layerName] = schema;
        }

        const metamodel = dataLoader.parseSchemaDefinitions(
          cleanedSchemas,
          specData.version || '0.1.0'
        );

        if (specData.linkRegistry) {
          addCrossLayerLinks(metamodel, specData.linkRegistry.linkTypes);
        }

        setModel(metamodel);

        // Calculate initial quality score
        calculateQualityScore(metamodel);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to convert spec to model';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    convertSpecToModel();
  }, [specData, dataLoader]);

  /**
   * Add cross-layer links
   */
  const addCrossLayerLinks = (metamodel: MetaModel, linkTypes: any[]) => {
    const linksBySourceLayer = new Map<string, any[]>();
    for (const linkType of linkTypes) {
      for (const sourceLayer of linkType.sourceLayers) {
        const layerName = normalizeLayerName(sourceLayer);
        if (!linksBySourceLayer.has(layerName)) {
          linksBySourceLayer.set(layerName, []);
        }
        linksBySourceLayer.get(layerName)!.push(linkType);
      }
    }

    for (const [layerName, layer] of Object.entries(metamodel.layers)) {
      const layerLinks = linksBySourceLayer.get(layerName) || [];
      if (!layer.relationships) {
        layer.relationships = [];
      }
      for (const linkType of layerLinks) {
        const targetLayerName = normalizeLayerName(linkType.targetLayer);
        layer.relationships.push({
          id: `link-${linkType.id}`,
          type: linkType.category,
          sourceId: layerName,
          targetId: targetLayerName,
          properties: {
            name: linkType.name,
            description: linkType.description,
          }
        });
      }
    }
  };

  const normalizeLayerName = (layerRef: string): string => {
    return layerRef
      .replace(/^\d+-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  /**
   * Calculate quality score for current layout
   */
  const calculateQualityScore = useCallback(async (currentModel: MetaModel) => {
    setIsCalculatingQuality(true);
    try {
      // Mock nodes/edges for quality calculation
      // In production, extract from GraphViewer
      const mockNodes: Node[] = [];
      const mockEdges: Edge[] = [];

      // Calculate metrics
      const metrics = calculateMetrics(mockNodes, mockEdges, 'spec-viewer');
      const score = metrics.overallScore || 0;

      setQualityScore(score);
      return score;
    } catch (err) {
      console.error('Error calculating quality:', err);
      return 0;
    } finally {
      setIsCalculatingQuality(false);
    }
  }, []);

  /**
   * Handle layout engine change
   */
  const handleEngineChange = useCallback((newEngine: LayoutEngineType) => {
    setLayoutEngine(newEngine);
    setLayoutParameters(layoutPresets[newEngine] || {});

    // Reset refinement
    setRefinementActive(false);
    setIterationHistory([]);
    refinementLoopRef.current = null;
  }, [layoutPresets]);

  /**
   * Handle parameter change from adjustment panel
   */
  const handleParameterChange = useCallback((newParams: Record<string, any>) => {
    setLayoutParameters(newParams);

    // Create new iteration
    const iteration: LayoutIteration = {
      id: iterationIdRef.current++,
      parameters: newParams,
      qualityScore: qualityScore,
      timestamp: new Date(),
    };

    setCurrentIteration(iteration);
    setIterationHistory(prev => [...prev, iteration]);

    // Recalculate quality score
    if (model) {
      calculateQualityScore(model);
    }
  }, [qualityScore, model, calculateQualityScore]);

  /**
   * Start automated refinement
   */
  const handleStartAutoRefinement = useCallback(async () => {
    if (!model) return;

    setRefinementActive(true);

    // Create refinement loop
    const loop = new RefinementLoop(
      { nodes: [], edges: [] }, // Mock graph data
      'spec-viewer',
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
  }, [model, layoutParameters]);

  /**
   * Accept current parameters
   */
  const handleAccept = useCallback(() => {
    if (!currentIteration) return;

    // Save session
    saveSession({
      id: `spec-refinement-${Date.now()}`,
      name: `Spec Layout - ${layoutEngine}`,
      diagramType: 'spec-viewer',
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
  }, [currentIteration, layoutEngine, layoutParameters, iterationHistory, saveSession]);

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

  // Loading/error/empty states
  if (loading) {
    return <LoadingState variant="panel" message="Converting schema to graph..." />;
  }

  if (error) {
    return <ErrorState variant="panel" message={error} />;
  }

  if (!model) {
    return <EmptyState variant="model" title="No Schema Data" description="No schema data available to display" />;
  }

  const normalizedSchemaId = selectedSchemaId
    ? selectedSchemaId
        .replace(/^\d+-/, '')
        .replace(/-layer.*$/, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    : null;

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Main Graph View */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Layout Controls */}
        <Card>
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

            <RefinementFeedbackPanel
              onAccept={handleAccept}
              onReject={handleReject}
              onRefine={handleRefine}
              onAuto={handleStartAutoRefinement}
              disabled={!currentIteration || refinementActive}
            />
          </div>
        </Card>

        {/* Graph */}
        <div className="flex-1 min-h-0">
          <GraphViewer
            model={model}
            selectedLayerId={normalizedSchemaId}
            layoutEngine={layoutEngine}
            layoutParameters={layoutParameters}
          />
        </div>
      </div>

      {/* Right Sidebar - Refinement Controls */}
      <div className="w-96 flex flex-col gap-4">
        <Tabs.Group style="underline">
          <Tabs.Item title="Parameters" active>
            <ParameterAdjustmentPanel
              parameters={layoutParameters}
              onChange={handleParameterChange}
              onQualityScoreChange={setQualityScore}
              qualityScore={qualityScore}
              debounceMs={500}
            />
          </Tabs.Item>

          <Tabs.Item title="History">
            <LayoutHistory
              iterations={iterationHistory.map(iter => ({
                iteration: iter.id,
                score: iter.qualityScore,
                parameters: iter.parameters,
                isBest: iter.id === currentIteration?.id,
                isCurrent: iter.id === currentIteration?.id,
              }))}
              onPreview={(iter) => {
                const iteration = iterationHistory.find(i => i.id === iter.iteration);
                if (iteration) handlePreviewIteration(iteration);
              }}
              onRevert={(iter) => {
                const iteration = iterationHistory.find(i => i.id === iter.iteration);
                if (iteration) handleRevertToIteration(iteration);
              }}
            />
          </Tabs.Item>
        </Tabs.Group>
      </div>
    </div>
  );
};

export default SpecGraphViewWithRefinement;
