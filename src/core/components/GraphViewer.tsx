/**
 * GraphViewer Component - React Flow Implementation
 * Renders a MetaModel using React Flow with custom nodes and edges
 */

import React, { useEffect, useState, useCallback } from 'react';
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
import { OverviewPanel, NodeWithLayerData } from './OverviewPanel';
import { getLayerColor } from '../utils/layerColors';
import { getEngine, LayoutEngineType } from '../layout/engines';

interface GraphViewerProps {
  model: MetaModel;
  onNodeClick?: (node: Node | null) => void;
  selectedLayerId?: string | null;
  layoutEngine?: LayoutEngineType; // Add layout engine selector
  layoutParameters?: Record<string, any>; // Add custom parameters
  onNodesEdgesChange?: (nodes: Node[], edges: any[]) => void; // Callback when nodes/edges change
}

/**
 * GraphViewerInner Component
 * Inner component that has access to React Flow instance via useReactFlow hook
 */
const GraphViewerInner: React.FC<GraphViewerProps> = ({ model, onNodeClick, selectedLayerId, layoutEngine, layoutParameters, onNodesEdgesChange }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);
  const { layers: layerStates } = useLayerStore();
  const [isRendering, setIsRendering] = useState(false);
  const reactFlowInstance = useReactFlow();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Handle React Flow initialization
  const handleInit = useCallback(() => {
    console.log('[GraphViewer] React Flow initialized');
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

    console.log('GraphViewer: Rendering model', model.version, 'with layout:', layoutEngine || 'default');
    renderModel(model);
  }, [model, layoutEngine, layoutParameters]);

  // Secondary effect: update node visibility when layer states change
  useEffect(() => {
    if (nodes.length === 0) return;

    console.log('GraphViewer: Updating layer visibility');
    updateLayerVisibility();
  }, [layerStates]);

  // Fit view after React Flow is initialized and nodes are loaded
  useEffect(() => {
    if (!isInitialized || !reactFlowInstance || nodes.length === 0) return;

    console.log('[GraphViewer] Fitting view after initialization');
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
      // Clear element store
      elementStore.clear();

      // Debug: Check model structure
      console.log('[GraphViewer] Model structure:');
      for (const [layerId, layer] of Object.entries(model.layers)) {
        console.log(`  ${layerId}: ${layer.elements?.length || 0} elements, ${layer.relationships?.length || 0} relationships`);
      }

      // Create layout engine and transformer
      let layoutEngineInstance;

      if (layoutEngine) {
        // Use specified layout engine from props
        console.log(`[GraphViewer] Using layout engine: ${layoutEngine}`);
        layoutEngineInstance = getEngine(layoutEngine);

        // Fallback if engine not found
        if (!layoutEngineInstance) {
          console.warn(`[GraphViewer] Layout engine "${layoutEngine}" not found, using default`);
          layoutEngineInstance = new VerticalLayerLayout();
        }
      } else {
        // Fallback to vertical layer layout for backward compatibility
        console.log('[GraphViewer] Using default VerticalLayerLayout');
        layoutEngineInstance = new VerticalLayerLayout();
      }

      const transformer = new NodeTransformer(layoutEngineInstance);

      // Transform the model into nodes and edges
      console.log('[GraphViewer] Transforming model to React Flow nodes and edges...');
      const result = await transformer.transformModel(model, layoutParameters);

      console.log(`[GraphViewer] Created ${result.nodes.length} nodes and ${result.edges.length} edges`);
      console.log('[GraphViewer] Layout:', result.layout);

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
      console.error('Error rendering model:', error);
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
      <div id="graph-content">
        <ReactFlow
        nodes={nodes}
        edges={edges}
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
        {/* Only render OverviewPanel after viewport is stable to prevent NaN in MiniMap SVG */}
        {showMiniMap && (
          <OverviewPanel
            nodeColor={(node: NodeWithLayerData) => {
              // Guard against invalid node data that can cause NaN in SVG
              if (!node || typeof node !== 'object') {
                return '#6B7280';
              }

              // Check for NaN dimensions
              if ((node.width !== undefined && (isNaN(node.width) || node.width === null)) ||
                  (node.height !== undefined && (isNaN(node.height) || node.height === null))) {
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
        )}
      </ReactFlow>

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
