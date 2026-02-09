/**
 * GraphViewer Component - React Flow Implementation
 * Renders a MetaModel using React Flow with custom nodes and edges
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  NodeMouseHandler,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './GraphViewer.css';

import { MetaModel } from '../types';
import { NodeTransformer } from '../services/nodeTransformer';
import { VerticalLayerLayout } from '../layout/verticalLayerLayout';
import { useLayerStore } from '../stores/layerStore';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { elementStore } from '../stores/elementStore';
import { AppNode, AppEdge } from '../types/reactflow';
import { SpaceMouseHandler } from './SpaceMouseHandler';
import { MiniMap } from '../../apps/embedded/components/MiniMap';
import { Panel } from '@xyflow/react';
import { getLayerColor } from '../utils/layerColors';
import { getEngine, LayoutEngineType } from '../layout/engines';
import { CrossLayerEdgeErrorBoundary } from './CrossLayerEdgeErrorBoundary';

interface GraphViewerProps {
  model: MetaModel;
  onNodeClick?: (node: Node | null) => void;
  selectedLayerId?: string | null;
  layoutEngine?: LayoutEngineType; // Add layout engine selector
  layoutParameters?: Record<string, any>; // Add custom parameters
  onNodesEdgesChange?: (nodes: Node[], edges: any[]) => void; // Callback when nodes/edges change
}

/**
 * Viewport Culling Component
 * Uses viewport hook to filter edges connected only to visible nodes
 */
const ViewportCullingLayer: React.FC<{
  nodes: AppNode[];
  edges: AppEdge[];
  onCulledEdgesChange?: (edges: AppEdge[]) => void;
}> = ({ nodes, edges, onCulledEdgesChange }) => {
  const viewport = useViewport();
  const VIEWPORT_MARGIN = 100; // Buffer around viewport for edge culling

  useMemo(() => {
    // Calculate visible node IDs based on viewport
    const visibleNodeIds = new Set<string>();

    nodes.forEach((node) => {
      const nodeWidth = (node.width || 180) * viewport.zoom;
      const nodeHeight = (node.height || 100) * viewport.zoom;

      // Calculate screen position
      const screenX = node.position.x * viewport.zoom + viewport.x;
      const screenY = node.position.y * viewport.zoom + viewport.y;

      // Check if node is in viewport with margin (FR-3)
      if (
        screenX + nodeWidth > -VIEWPORT_MARGIN &&
        screenX < window.innerWidth + VIEWPORT_MARGIN &&
        screenY + nodeHeight > -VIEWPORT_MARGIN &&
        screenY < window.innerHeight + VIEWPORT_MARGIN
      ) {
        visibleNodeIds.add(node.id);
      }
    });

    // Filter edges to only those connected to visible nodes (FR-3)
    const filtered = edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) || visibleNodeIds.has(edge.target)
    );

    onCulledEdgesChange?.(filtered);
    return filtered;
  }, [nodes, edges, viewport]);

  return null;
};

/**
 * GraphViewerInner Component
 * Inner component that has access to React Flow instance via useReactFlow hook
 */
const GraphViewerInner: React.FC<GraphViewerProps> = ({ model, onNodeClick, selectedLayerId, layoutEngine, layoutParameters, onNodesEdgesChange }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);
  const [culledEdges, setCulledEdges] = useState<AppEdge[]>([]);
  const { layers: layerStates } = useLayerStore();
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Handle React Flow initialization
  const handleInit = useCallback(() => {
    setIsInitialized(true);
  }, []);

  // Handle node click
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Main effect: render the model when model or layout engine changes
  useEffect(() => {
    if (!model || isRendering) return;

    renderModel(model);
  }, [model, layoutEngine, layoutParameters]);

  // Secondary effect: update node visibility when layer states change
  useEffect(() => {
    if (nodes.length === 0) return;

    updateLayerVisibility();
  }, [layerStates]);

  // Fit view after React Flow is initialized and nodes are loaded
  useEffect(() => {
    if (!isInitialized || !reactFlowInstance || nodes.length === 0) return;

    // Use setTimeout to ensure React Flow has completed its internal calculations
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.1, duration: 200 });

      // Enable MiniMap after fitView completes
      // Only show MiniMap for graphs with 30+ nodes (most useful for large graphs)
      if (nodes.length >= 30) {
        setShowMiniMap(true);
      }
    }, 100);
  }, [isInitialized, reactFlowInstance, nodes.length]);

  // Zoom to selected layer effect
  useEffect(() => {
    if (!selectedLayerId || !nodes.length || !reactFlowInstance) return;

    const layerNodes = nodes.filter(n => n.data.layerId === selectedLayerId);
    if (layerNodes.length === 0) return;

    reactFlowInstance.fitView({
      nodes: layerNodes,
      padding: 0.2,
      duration: 400
    });
  }, [selectedLayerId, nodes, reactFlowInstance]);

  /**
   * Render the complete model
   */
  const renderModel = async (model: MetaModel) => {
    setIsRendering(true);
    setIsInitialized(false); // Reset initialization flag for new model
    setShowMiniMap(false); // Reset MiniMap flag for new model

    try {
      setRenderError(null);

      // Clear element store
      elementStore.clear();

      // Create layout engine and transformer
      let layoutEngineInstance;

      if (layoutEngine) {
        // Use specified layout engine from props
        layoutEngineInstance = getEngine(layoutEngine);

        // Fallback if engine not found
        if (!layoutEngineInstance) {
          console.warn(`[GraphViewer] Layout engine "${layoutEngine}" not found, using default`);
          layoutEngineInstance = new VerticalLayerLayout();
        }
      } else {
        // Fallback to vertical layer layout for backward compatibility
        layoutEngineInstance = new VerticalLayerLayout();
      }

      const transformer = new NodeTransformer(layoutEngineInstance);

      // Transform the model into nodes and edges
      const result = await transformer.transformModel(model, layoutParameters);

      // Set nodes and edges
      setNodes(result.nodes);
      setEdges(result.edges);

      // Notify parent of nodes/edges change
      if (onNodesEdgesChange) {
        onNodesEdgesChange(result.nodes, result.edges);
      }

      // Apply initial layer visibility
      setTimeout(() => {
        updateLayerVisibilityWithNodes(result.nodes);
      }, 100);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown rendering error';
      console.error('Error rendering model:', error);
      setRenderError(message);
    } finally {
      setIsRendering(false);
    }
  };

  /**
   * Update node visibility based on layer states (uses current nodes from state)
   */
  const updateLayerVisibility = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const layerId = node.data.layerId;
        if (layerId && layerStates[layerId]) {
          const layerState = layerStates[layerId];
          return {
            ...node,
            hidden: !layerState.visible, // Use React Flow's hidden property
            style: {
              ...node.style,
              opacity: layerState.visible ? layerState.opacity : 0,
              transition: 'opacity 0.3s ease-in-out',
            },
          };
        }
        return node;
      })
    );
  }, [layerStates, setNodes]);

  /**
   * Update node visibility with a specific nodes array (for initial render)
   */
  const updateLayerVisibilityWithNodes = (nodesToUpdate: AppNode[]) => {
    setNodes(
      nodesToUpdate.map((node) => {
        const layerId = node.data.layerId;
        if (layerId && layerStates[layerId]) {
          const layerState = layerStates[layerId];
          return {
            ...node,
            hidden: !layerState.visible, // Use React Flow's hidden property
            style: {
              ...node.style,
              opacity: layerState.visible ? layerState.opacity : 0,
              transition: 'opacity 0.3s ease-in-out',
            },
          };
        }
        return node;
      })
    );
  };

  return (
    <div className="graph-viewer">
      {/* Accessibility Skip Links */}
      <a
        href="#cross-layer-edges"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-3 focus:py-2"
      >
        Skip to cross-layer edges
      </a>
      <a
        href="#graph-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-12 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-3 focus:py-2"
      >
        Skip cross-layer edges
      </a>
      <div id="graph-content" style={{ width: '100%', height: '100%' }}>
        <CrossLayerEdgeErrorBoundary>
          <ReactFlow
          nodes={nodes}
          edges={culledEdges.length > 0 ? culledEdges : edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onInit={handleInit}
          nodesDraggable={false}       // Read-only: no dragging
          nodesConnectable={false}     // Read-only: no new connections
          nodesFocusable={true}        // Allow keyboard navigation
          edgesFocusable={true}
          elementsSelectable={true}    // Allow selection
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}  // Explicit initial viewport
          minZoom={0.1}
          maxZoom={2}
        >
          <Background color="#E6E6E6" gap={16} />
          <Controls />
          <SpaceMouseHandler />

          {/* Viewport culling layer for cross-layer edges (FR-3) */}
          <ViewportCullingLayer
            nodes={nodes}
            edges={edges}
            onCulledEdgesChange={setCulledEdges}
          />
          {showMiniMap && (
            <Panel position="bottom-right" className="m-4">
              <div
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200
                           dark:border-gray-700 shadow-sm overflow-hidden"
                data-testid="overview-panel"
              >
                <div
                  className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400
                             border-b border-gray-200 dark:border-gray-700 bg-gray-50
                             dark:bg-gray-900"
                >
                  Overview
                </div>
                <div className="p-2">
                  <MiniMap
                    nodeColor={(node: any) => {
                      // Guard against invalid node data
                      if (!node || typeof node !== 'object') {
                        return '#6B7280';
                      }

                      // Color nodes based on their layer
                      const layer = node.data?.layer;
                      if (layer) {
                        return getLayerColor(layer, 'primary');
                      }
                      // Fallback to fill color
                      return node.data?.fill || '#ffffff';
                    }}
                  />
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
        </CrossLayerEdgeErrorBoundary>

        {renderError && (
          <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400 p-4">
            <div className="text-center">
              <p className="font-semibold">Failed to render graph</p>
              <p className="text-sm mt-1">{renderError}</p>
            </div>
          </div>
        )}

        {isRendering && (
          <div className="rendering-overlay">
            <div className="rendering-message">Rendering graph...</div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * GraphViewer Component
 * Wrapper that provides ReactFlowProvider context
 */
const GraphViewer: React.FC<GraphViewerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GraphViewerInner {...props} />
    </ReactFlowProvider>
  );
};

export default GraphViewer;
