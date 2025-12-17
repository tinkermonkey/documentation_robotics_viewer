/**
 * MotivationGraphView Component
 * Displays motivation layer elements as an interactive graph using ReactFlow
 * Renders ontology diagram with multiple layout algorithms, filtering, and interactive controls
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
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
  LayoutAlgorithm,
} from './MotivationControlPanel';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import {
  MotivationElementType,
  MotivationRelationshipType,
  MotivationGraph,
} from '../types/motivationGraph';
import { SpaceMouseHandler } from '../../../core/components/SpaceMouseHandler';

export interface MotivationGraphViewProps {
  model: MetaModel;
  selectedElementTypes: Set<MotivationElementType>;
  selectedRelationshipTypes: Set<MotivationRelationshipType>;
  layout: LayoutAlgorithm;
}

export interface MotivationGraphViewRef {
  fitView: () => void;
}

/**
 * MotivationGraphView Component
 * Renders motivation layer as interactive ontology diagram
 */
const MotivationGraphView = forwardRef<MotivationGraphViewRef, MotivationGraphViewProps>((
  {
    model,
    selectedElementTypes,
    selectedRelationshipTypes,
    layout,
  },
  ref
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isLayouting, setIsLayouting] = useState(false);

  // Store reference to the full graph (before filtering)
  const fullGraphRef = useRef<MotivationGraph | null>(null);

  // Get ReactFlow instance for fitView
  const reactFlowInstance = useReactFlow();

  // Expose fitView method to parent via ref
  useImperativeHandle(ref, () => ({
    fitView: () => {
      reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
    },
  }));

  // Get preferences from store
  const {
    motivationPreferences,
    setManualPositions,
    setPathTracing,
    setSelectedNodeId,
    setInspectorPanelVisible,
  } = useViewPreferenceStore();

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

        console.log('[MotivationGraphView] Transforming graph with layout:', layout);

        // Prepare transformer options
        const transformerOptions: TransformerOptions = {
          layoutAlgorithm: layout,
          selectedElementTypes,
          selectedRelationshipTypes,
          centerNodeId: motivationPreferences.centerNodeId,
          existingPositions:
            layout === 'manual' ? motivationPreferences.manualPositions : undefined,
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
    layout,
    selectedElementTypes,
    selectedRelationshipTypes,
    motivationPreferences.centerNodeId,
    motivationPreferences.manualPositions,
    motivationPreferences.pathTracing,
    motivationPreferences.focusContextEnabled,
  ]);

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
   * Save manual positions when nodes are dragged
   */
  const onNodeDragStop = useCallback(
    (_event: any, _node: any) => {
      if (layout === 'manual') {
        const positions = new Map<string, { x: number; y: number }>();
        nodes.forEach((n) => {
          positions.set(n.id, { x: n.position.x, y: n.position.y });
        });
        setManualPositions(positions);
        console.log('[MotivationGraphView] Saved manual positions for', positions.size, 'nodes');
      }
    },
    [layout, nodes, setManualPositions]
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
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Use the Filters panel in the sidebar to adjust your filters
          </p>
        </div>
      </div>
    );
  }

  // Render ReactFlow with motivation nodes and edges
  return (
    <ErrorBoundary>
      <div className="w-full h-full relative">
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
    </ErrorBoundary>
  );
});

MotivationGraphView.displayName = 'MotivationGraphView';

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
