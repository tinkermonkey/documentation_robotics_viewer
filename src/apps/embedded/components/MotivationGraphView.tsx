/**
 * MotivationGraphView Component
 * Displays motivation layer elements as an interactive graph using ReactFlow
 * Renders ontology diagram with multiple layout algorithms, filtering, and interactive controls
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import '@xyflow/react/dist/style.css';
import '../../../core/components/GraphViewer.css';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
} from '@xyflow/react';

import { MetaModel } from '../../../core/types';
import { nodeTypes } from '../../../core/nodes';
import { edgeTypes } from '../../../core/edges';
import { MotivationGraphBuilder } from '../services/motivationGraphBuilder';
import {
  MotivationGraphTransformer,
  TransformerOptions,
} from '../services/motivationGraphTransformer';
import { ErrorBoundary } from './ErrorBoundary';
import {
  MotivationFilterPanel,
  FilterCounts,
} from './MotivationFilterPanel';
import {
  MotivationControlPanel,
  LayoutAlgorithm,
} from './MotivationControlPanel';
import { MotivationInspectorPanel } from './MotivationInspectorPanel';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import {
  MotivationElementType,
  MotivationRelationshipType,
  MotivationGraph,
} from '../types/motivationGraph';
import {
  exportAsPNG,
  exportAsSVG,
  exportGraphDataAsJSON,
  exportTraceabilityReport,
} from '../services/motivationExportService';
import { SpaceMouseHandler } from '../../../core/components/SpaceMouseHandler';

export interface MotivationGraphViewProps {
  model: MetaModel;
}

/**
 * MotivationGraphView Component
 * Renders motivation layer as interactive ontology diagram
 */
const MotivationGraphView: React.FC<MotivationGraphViewProps> = ({ model }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isLayouting, setIsLayouting] = useState(false);

  // Store reference to the full graph (before filtering)
  const fullGraphRef = useRef<MotivationGraph | null>(null);

  // Get ReactFlow instance for fitView
  const reactFlowInstance = useReactFlow();

  // Get preferences from store
  const {
    motivationPreferences,
    setMotivationLayout,
    setVisibleElementTypes,
    setVisibleRelationshipTypes,
    setFocusContextEnabled,
    setManualPositions,
    setPathTracing,
    setSelectedNodeId,
    setInspectorPanelVisible,
  } = useViewPreferenceStore();

  // Local state for filters (synced with store)
  const [selectedElementTypes, setSelectedElementTypes] = useState<Set<MotivationElementType>>(
    motivationPreferences.visibleElementTypes
  );
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<
    Set<MotivationRelationshipType>
  >(motivationPreferences.visibleRelationshipTypes);

  // Local state for layout
  const [selectedLayout, setSelectedLayout] = useState<LayoutAlgorithm>(
    motivationPreferences.selectedLayout
  );

  // Create services
  const motivationGraphBuilder = useMemo(() => new MotivationGraphBuilder(), []);

  /**
   * Build the full motivation graph from model
   */
  useEffect(() => {
    const buildGraph = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('[MotivationGraphView] Building motivation graph from model');

        // Build intermediate motivation graph
        const motivationGraph = motivationGraphBuilder.build(model);

        console.log('[MotivationGraphView] Motivation graph built:', {
          nodes: motivationGraph.nodes.size,
          edges: motivationGraph.edges.size,
        });

        // Check if motivation layer exists and has elements
        if (motivationGraph.nodes.size === 0) {
          console.warn('[MotivationGraphView] No motivation elements found in model');
          setError('No motivation layer elements found in this model');
          setLoading(false);
          return;
        }

        // Store the full graph
        fullGraphRef.current = motivationGraph;

        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to build motivation graph';
        console.error('[MotivationGraphView] Error:', err);
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (model) {
      buildGraph();
    }
  }, [model, motivationGraphBuilder]);

  /**
   * Transform graph to ReactFlow format whenever filters or layout changes
   */
  useEffect(() => {
    if (!fullGraphRef.current) return;

    const transformGraph = async () => {
      try {
        setIsLayouting(true);

        console.log('[MotivationGraphView] Transforming graph with layout:', selectedLayout);

        // Prepare transformer options
        const transformerOptions: TransformerOptions = {
          layoutAlgorithm: selectedLayout,
          selectedElementTypes,
          selectedRelationshipTypes,
          centerNodeId: motivationPreferences.centerNodeId,
          existingPositions:
            selectedLayout === 'manual' ? motivationPreferences.manualPositions : undefined,
          pathHighlighting: {
            mode: motivationPreferences.pathTracing.mode,
            highlightedNodeIds: motivationPreferences.pathTracing.highlightedNodeIds,
            highlightedEdgeIds: motivationPreferences.pathTracing.highlightedEdgeIds,
            selectedNodeIds: motivationPreferences.pathTracing.selectedNodeIds,
          },
          focusContextEnabled: motivationPreferences.focusContextEnabled,
        };

        const transformer = new MotivationGraphTransformer(transformerOptions);

        // Transform with animation delay for smooth transitions
        await new Promise((resolve) => setTimeout(resolve, 50));

        const transformResult = transformer.transform(fullGraphRef.current!);

        console.log('[MotivationGraphView] Transformation complete:', {
          nodes: transformResult.nodes.length,
          edges: transformResult.edges.length,
          bounds: transformResult.bounds,
        });

        // Apply animated transitions if layout changed
        if (nodes.length > 0 && transformResult.nodes.length > 0) {
          await animateLayoutTransition(nodes, transformResult.nodes, setNodes, setIsLayouting);
        } else {
          setNodes(transformResult.nodes);
        }

        setEdges(transformResult.edges);

        // Fit view after layout
        setTimeout(() => {
          reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
        }, 100);

        setIsLayouting(false);
      } catch (err) {
        console.error('[MotivationGraphView] Transform error:', err);
        console.warn('[MotivationGraphView] Layout transition failed, restoring normal state');
        setIsLayouting(false);
      }
    };

    transformGraph();
  }, [
    fullGraphRef.current,
    selectedLayout,
    selectedElementTypes,
    selectedRelationshipTypes,
    motivationPreferences.centerNodeId,
    motivationPreferences.manualPositions,
    motivationPreferences.pathTracing,
    motivationPreferences.focusContextEnabled,
  ]);

  /**
   * Calculate filter counts for display (memoized for performance)
   */
  const filterCounts = useMemo((): FilterCounts => {
    if (!fullGraphRef.current) {
      return {
        elements: {} as any,
        relationships: {} as any,
      };
    }

    const graph = fullGraphRef.current;

    // Count elements by type
    const elementCounts: Record<MotivationElementType, { visible: number; total: number }> = {} as any;
    for (const elementType of Object.values(MotivationElementType)) {
      const total = Array.from(graph.nodes.values()).filter(
        (n) => n.element.type === elementType
      ).length;
      const visible = selectedElementTypes.has(elementType) ? total : 0;
      elementCounts[elementType] = { visible, total };
    }

    // Count relationships by type
    const relationshipCounts: Record<
      MotivationRelationshipType,
      { visible: number; total: number }
    > = {} as any;
    for (const relationshipType of Object.values(MotivationRelationshipType)) {
      const total = Array.from(graph.edges.values()).filter((e) => e.type === relationshipType).length;
      const visible = selectedRelationshipTypes.has(relationshipType) ? total : 0;
      relationshipCounts[relationshipType] = { visible, total };
    }

    return {
      elements: elementCounts,
      relationships: relationshipCounts,
    };
  }, [fullGraphRef.current, selectedElementTypes, selectedRelationshipTypes]);

  /**
   * Handle element type filter change
   */
  const handleElementTypeChange = useCallback(
    (elementType: MotivationElementType, selected: boolean) => {
      const newTypes = new Set(selectedElementTypes);
      if (selected) {
        newTypes.add(elementType);
      } else {
        newTypes.delete(elementType);
      }
      setSelectedElementTypes(newTypes);
      setVisibleElementTypes(newTypes);
    },
    [selectedElementTypes, setVisibleElementTypes]
  );

  /**
   * Handle relationship type filter change
   */
  const handleRelationshipTypeChange = useCallback(
    (relationshipType: MotivationRelationshipType, selected: boolean) => {
      const newTypes = new Set(selectedRelationshipTypes);
      if (selected) {
        newTypes.add(relationshipType);
      } else {
        newTypes.delete(relationshipType);
      }
      setSelectedRelationshipTypes(newTypes);
      setVisibleRelationshipTypes(newTypes);
    },
    [selectedRelationshipTypes, setVisibleRelationshipTypes]
  );

  /**
   * Handle clear all filters
   */
  const handleClearAllFilters = useCallback(() => {
    const allElementTypes = new Set(Object.values(MotivationElementType));
    const allRelationshipTypes = new Set(Object.values(MotivationRelationshipType));
    setSelectedElementTypes(allElementTypes);
    setSelectedRelationshipTypes(allRelationshipTypes);
    setVisibleElementTypes(allElementTypes);
    setVisibleRelationshipTypes(allRelationshipTypes);
  }, [setVisibleElementTypes, setVisibleRelationshipTypes]);

  /**
   * Handle layout change
   */
  const handleLayoutChange = useCallback(
    (layout: LayoutAlgorithm) => {
      setSelectedLayout(layout);
      setMotivationLayout(layout);
    },
    [setMotivationLayout]
  );

  /**
   * Handle fit to view
   */
  const handleFitToView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
  }, [reactFlowInstance]);

  /**
   * Handle focus mode toggle (Phase 4)
   */
  const handleFocusModeToggle = useCallback(
    (enabled: boolean) => {
      setFocusContextEnabled(enabled);
    },
    [setFocusContextEnabled]
  );

  /**
   * Handle node selection - Click for direct relationships, Shift+Click for path tracing
   */
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.log('[MotivationGraphView] Node clicked:', node.id);

      if (!fullGraphRef.current) return;

      const pathTracing = motivationPreferences.pathTracing;

      // Shift+Click: Path tracing between two nodes
      if (event.shiftKey && pathTracing.selectedNodeIds.length === 1) {
        const sourceId = pathTracing.selectedNodeIds[0];
        const targetId = node.id;

        console.log('[MotivationGraphView] Tracing paths between:', sourceId, '->', targetId);

        // Find paths between nodes
        const paths = motivationGraphBuilder.findPathsBetween(
          sourceId,
          targetId,
          fullGraphRef.current,
          10
        );

        if (paths.length > 0) {
          // Collect all nodes and edges in paths
          const highlightedNodeIds = new Set<string>();
          const highlightedEdgeIds = new Set<string>();

          paths.forEach((path) => {
            path.path.forEach((nodeId) => highlightedNodeIds.add(nodeId));
            path.edges.forEach((edgeId) => highlightedEdgeIds.add(edgeId));
          });

          setPathTracing({
            mode: 'between',
            selectedNodeIds: [sourceId, targetId],
            highlightedNodeIds,
            highlightedEdgeIds,
          });

          console.log(`[MotivationGraphView] Found ${paths.length} paths`);
        } else {
          console.log('[MotivationGraphView] No paths found between nodes');
        }
      }
      // Regular click: Highlight direct relationships
      else {
        const directRelationships = motivationGraphBuilder.getDirectRelationships(
          node.id,
          fullGraphRef.current
        );

        const highlightedEdgeIds = new Set(directRelationships.map((r) => r.id));
        const highlightedNodeIds = new Set<string>();

        // Add connected nodes
        directRelationships.forEach((rel) => {
          highlightedNodeIds.add(rel.sourceId);
          highlightedNodeIds.add(rel.targetId);
        });

        setPathTracing({
          mode: 'direct',
          selectedNodeIds: [node.id],
          highlightedNodeIds,
          highlightedEdgeIds,
        });

        // Open inspector panel
        setSelectedNodeId(node.id);
        setInspectorPanelVisible(true);

        console.log(`[MotivationGraphView] Highlighted ${directRelationships.length} direct relationships`);
      }
    },
    [
      motivationPreferences.pathTracing,
      motivationGraphBuilder,
      setPathTracing,
      setSelectedNodeId,
      setInspectorPanelVisible,
    ]
  );

  /**
   * Handle trace upstream influences (context menu action)
   */
  const handleTraceUpstream = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;

      console.log('[MotivationGraphView] Tracing upstream influences from:', nodeId);

      const result = motivationGraphBuilder.traceUpstreamInfluences(
        nodeId,
        fullGraphRef.current,
        10
      );

      setPathTracing({
        mode: 'upstream',
        selectedNodeIds: [nodeId],
        highlightedNodeIds: result.nodeIds,
        highlightedEdgeIds: result.edgeIds,
      });

      console.log(`[MotivationGraphView] Traced ${result.nodeIds.size} upstream nodes`);
    },
    [motivationGraphBuilder, setPathTracing]
  );

  /**
   * Handle trace downstream impacts (context menu action)
   */
  const handleTraceDownstream = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;

      console.log('[MotivationGraphView] Tracing downstream impacts from:', nodeId);

      const result = motivationGraphBuilder.traceDownstreamImpacts(
        nodeId,
        fullGraphRef.current,
        10
      );

      setPathTracing({
        mode: 'downstream',
        selectedNodeIds: [nodeId],
        highlightedNodeIds: result.nodeIds,
        highlightedEdgeIds: result.edgeIds,
      });

      console.log(`[MotivationGraphView] Traced ${result.nodeIds.size} downstream nodes`);
    },
    [motivationGraphBuilder, setPathTracing]
  );

  /**
   * Handle clear path highlighting
   */
  const handleClearPathHighlighting = useCallback(() => {
    console.log('[MotivationGraphView] Clearing path highlighting');
    setPathTracing({
      mode: 'none',
      selectedNodeIds: [],
      highlightedNodeIds: new Set(),
      highlightedEdgeIds: new Set(),
    });
  }, [setPathTracing]);

  /**
   * Handle show stakeholder network (switch to radial layout)
   */
  const handleShowNetwork = useCallback(
    (nodeId: string) => {
      console.log('[MotivationGraphView] Showing stakeholder network for:', nodeId);

      // Set as center node and switch to radial layout
      useViewPreferenceStore.getState().setCenterNodeId(nodeId);
      setSelectedLayout('radial');
      setMotivationLayout('radial');
    },
    [setSelectedLayout, setMotivationLayout]
  );

  /**
   * Handle focus on element
   */
  const handleFocusOnElement = useCallback(
    (nodeId: string) => {
      console.log('[MotivationGraphView] Focusing on element:', nodeId);

      if (!fullGraphRef.current) return;

      // Get direct relationships for this element
      const directRelationships = motivationGraphBuilder.getDirectRelationships(
        nodeId,
        fullGraphRef.current
      );

      const highlightedEdgeIds = new Set(directRelationships.map((r) => r.id));
      const highlightedNodeIds = new Set<string>();

      // Add the focused node and connected nodes
      highlightedNodeIds.add(nodeId);
      directRelationships.forEach((rel) => {
        highlightedNodeIds.add(rel.sourceId);
        highlightedNodeIds.add(rel.targetId);
      });

      setPathTracing({
        mode: 'direct',
        selectedNodeIds: [nodeId],
        highlightedNodeIds,
        highlightedEdgeIds,
      });

      // Enable focus context mode
      setFocusContextEnabled(true);
    },
    [motivationGraphBuilder, setPathTracing, setFocusContextEnabled]
  );

  /**
   * Handle close inspector panel
   */
  const handleCloseInspector = useCallback(() => {
    console.log('[MotivationGraphView] Closing inspector panel');
    setInspectorPanelVisible(false);
    setSelectedNodeId(undefined);
  }, [setInspectorPanelVisible, setSelectedNodeId]);

  /**
   * Export handlers (Phase 6)
   */
  const handleExportPNG = useCallback(async () => {
    try {
      console.log('[MotivationGraphView] Exporting as PNG');
      const reactFlowContainer = document.querySelector('.graph-viewer') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await exportAsPNG(reactFlowContainer, 'motivation-graph.png');
      console.log('[MotivationGraphView] PNG export successful');
    } catch (error) {
      console.error('[MotivationGraphView] PNG export failed:', error);
      alert('Failed to export PNG: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, []);

  const handleExportSVG = useCallback(async () => {
    try {
      console.log('[MotivationGraphView] Exporting as SVG');
      const reactFlowContainer = document.querySelector('.graph-viewer') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await exportAsSVG(reactFlowContainer, 'motivation-graph.svg');
      console.log('[MotivationGraphView] SVG export successful');
    } catch (error) {
      console.error('[MotivationGraphView] SVG export failed:', error);
      alert('Failed to export SVG: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, []);

  const handleExportGraphData = useCallback(() => {
    try {
      console.log('[MotivationGraphView] Exporting graph data');
      if (!fullGraphRef.current) {
        throw new Error('No graph data available');
      }
      exportGraphDataAsJSON(nodes, edges, fullGraphRef.current, 'motivation-graph-data.json');
      console.log('[MotivationGraphView] Graph data export successful');
    } catch (error) {
      console.error('[MotivationGraphView] Graph data export failed:', error);
      alert('Failed to export graph data: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [nodes, edges]);

  const handleExportTraceabilityReport = useCallback(() => {
    try {
      console.log('[MotivationGraphView] Exporting traceability report');
      if (!fullGraphRef.current) {
        throw new Error('No graph data available');
      }
      exportTraceabilityReport(fullGraphRef.current, 'traceability-report.json');
      console.log('[MotivationGraphView] Traceability report export successful');
    } catch (error) {
      console.error('[MotivationGraphView] Traceability report export failed:', error);
      alert('Failed to export traceability report: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, []);

  /**
   * Save manual positions when nodes are dragged
   */
  const onNodeDragStop = useCallback(
    (_event: any, _node: any) => {
      if (selectedLayout === 'manual') {
        const positions = new Map<string, { x: number; y: number }>();
        nodes.forEach((n) => {
          positions.set(n.id, { x: n.position.x, y: n.position.y });
        });
        setManualPositions(positions);
        console.log('[MotivationGraphView] Saved manual positions for', positions.size, 'nodes');
      }
    },
    [selectedLayout, nodes, setManualPositions]
  );

  // Loading state
  if (loading) {
    return (
      <div className="message-overlay">
        <div className="message-box">
          <div className="spinner"></div>
          <p>Loading motivation graph...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="message-overlay">
        <div className="message-box error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (nodes.length === 0 && !isLayouting) {
    return (
      <div className="message-overlay">
        <div className="message-box">
          <p>No motivation elements match the current filters</p>
          <button onClick={handleClearAllFilters} className="mt-4 px-5 py-2.5 bg-blue-600 dark:bg-blue-700 text-white border-0 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-700 dark:hover:bg-blue-800">
            Clear All Filters
          </button>
        </div>
      </div>
    );
  }

  // Render ReactFlow with motivation nodes and edges
  return (
    <ErrorBoundary>
      <div className="flex flex-col lg:flex-row w-full h-full relative bg-gray-50 dark:bg-gray-950">
        {/* Filter Panel */}
        <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r-2 border-gray-200 dark:border-gray-700 overflow-y-auto z-10 max-h-48 lg:max-h-none lg:max-w-[350px] lg:min-w-[280px] xl:min-w-[300px]">
          <MotivationFilterPanel
            selectedElementTypes={selectedElementTypes}
            selectedRelationshipTypes={selectedRelationshipTypes}
            filterCounts={filterCounts}
            onElementTypeChange={handleElementTypeChange}
            onRelationshipTypeChange={handleRelationshipTypeChange}
            onClearAllFilters={handleClearAllFilters}
          />
        </div>

        {/* Main Graph View */}
        <div className="flex-1 min-w-0 h-full relative">
          {isLayouting && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-[1000] pointer-events-none animate-in fade-in duration-200" role="status" aria-live="polite">
              <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md text-sm font-medium text-gray-700 dark:text-gray-300 animate-in zoom-in-95 duration-300">
                <div className="w-5 h-5 border-[3px] border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Computing layout...</span>
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            fitView
            fitViewOptions={{
              padding: 0.2,
              includeHiddenNodes: false,
            }}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
              animated: false,
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls />
            <SpaceMouseHandler />
            <MiniMap
              nodeColor={(node) => {
                // Color minimap nodes based on their stroke color
                return (node.data.stroke as string) || '#6b7280';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
              style={{
                backgroundColor: '#f9fafb',
              }}
            />
          </ReactFlow>
        </div>

        {/* Control Panel */}
        <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-l-2 border-gray-200 dark:border-gray-700 overflow-y-auto z-10 max-h-48 lg:max-h-none lg:max-w-[350px] lg:min-w-[280px] xl:min-w-[300px]">
          <MotivationControlPanel
            selectedLayout={selectedLayout}
            onLayoutChange={handleLayoutChange}
            onFitToView={handleFitToView}
            focusModeEnabled={motivationPreferences.focusContextEnabled}
            onFocusModeToggle={handleFocusModeToggle}
            onClearHighlighting={handleClearPathHighlighting}
            isHighlightingActive={motivationPreferences.pathTracing.mode !== 'none'}
            isLayouting={isLayouting}
            onExportPNG={handleExportPNG}
            onExportSVG={handleExportSVG}
            onExportGraphData={handleExportGraphData}
            onExportTraceabilityReport={handleExportTraceabilityReport}
          />
        </div>

        {/* Inspector Panel */}
        {motivationPreferences.inspectorPanelVisible &&
          motivationPreferences.selectedNodeId &&
          fullGraphRef.current && (
            <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-y-auto fixed lg:absolute bottom-0 lg:right-[370px] xl:right-[380px] left-0 lg:left-auto lg:top-4 lg:bottom-4 h-1/2 lg:h-auto w-full lg:w-[320px] xl:w-[360px] lg:max-w-[360px] shadow-lg z-20 rounded-t-xl lg:rounded-none transition-transform duration-300 ease-out animate-in slide-in-from-bottom lg:slide-in-from-right">
              <MotivationInspectorPanel
                selectedNodeId={motivationPreferences.selectedNodeId}
                graph={fullGraphRef.current}
                onTraceUpstream={handleTraceUpstream}
                onTraceDownstream={handleTraceDownstream}
                onShowNetwork={handleShowNetwork}
                onFocusOnElement={handleFocusOnElement}
                onClose={handleCloseInspector}
              />
            </div>
          )}
      </div>
    </ErrorBoundary>
  );
};

/**
 * Animate layout transitions using position interpolation
 * Target: 800ms smooth transition
 * Enhanced with error handling and loading state management
 */
async function animateLayoutTransition(
  oldNodes: Node[],
  newNodes: Node[],
  setNodes: (nodes: Node[]) => void,
  setIsLayouting: (loading: boolean) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const duration = 800; // ms
      const startTime = Date.now();

      // Create map of old positions
      const oldPositions = new Map<string, { x: number; y: number }>();
      oldNodes.forEach((node) => {
        oldPositions.set(node.id, { x: node.position.x, y: node.position.y });
      });

      // Ease-in-out function
      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      // Animation loop
      const animate = () => {
        try {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeInOutCubic(progress);

          const interpolatedNodes = newNodes.map((newNode) => {
            const oldPos = oldPositions.get(newNode.id);
            if (!oldPos) {
              // New node, just use new position
              return newNode;
            }

            // Interpolate position
            const x = oldPos.x + (newNode.position.x - oldPos.x) * easedProgress;
            const y = oldPos.y + (newNode.position.y - oldPos.y) * easedProgress;

            return {
              ...newNode,
              position: { x, y },
            };
          });

          setNodes(interpolatedNodes);

          // Continue animation if not complete
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        } catch (err) {
          console.error('[MotivationGraphView] Animation frame error:', err);
          setIsLayouting(false);
          reject(err);
        }
      };

      // Start animation
      requestAnimationFrame(animate);
    } catch (err) {
      console.error('[MotivationGraphView] Animation setup error:', err);
      setIsLayouting(false);
      reject(err);
    }
  });
}

export default MotivationGraphView;
