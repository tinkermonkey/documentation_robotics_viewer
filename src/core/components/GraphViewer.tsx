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

interface GraphViewerProps {
  model: MetaModel;
  onNodeClick?: (node: Node | null) => void;
  selectedLayerId?: string | null;
}

/**
 * GraphViewerInner Component
 * Inner component that has access to React Flow instance via useReactFlow hook
 */
const GraphViewerInner: React.FC<GraphViewerProps> = ({ model, onNodeClick, selectedLayerId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);
  const { layers: layerStates } = useLayerStore();
  const [isRendering, setIsRendering] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Handle node click
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Main effect: render the model when model changes
  useEffect(() => {
    if (!model || isRendering) return;

    console.log('GraphViewer: Rendering model', model.version);
    renderModel(model);
  }, [model]);

  // Secondary effect: update node visibility when layer states change
  useEffect(() => {
    if (nodes.length === 0) return;

    console.log('GraphViewer: Updating layer visibility');
    updateLayerVisibility();
  }, [layerStates]);

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

    try {
      // Clear element store
      elementStore.clear();

      // Create layout engine and transformer
      const layoutEngine = new VerticalLayerLayout();
      const transformer = new NodeTransformer(layoutEngine);

      // Transform the model into nodes and edges
      console.log('Transforming model to React Flow nodes and edges...');
      const result = await transformer.transformModel(model);

      console.log(`Created ${result.nodes.length} nodes and ${result.edges.length} edges`);
      console.log('Layout:', result.layout);

      // Set nodes and edges
      setNodes(result.nodes);
      setEdges(result.edges);

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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodesDraggable={false}       // Read-only: no dragging
        nodesConnectable={false}     // Read-only: no new connections
        nodesFocusable={true}        // Allow keyboard navigation
        edgesFocusable={true}
        elementsSelectable={true}    // Allow selection
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#E6E6E6" gap={16} />
        <Controls />
        <SpaceMouseHandler />
        <OverviewPanel
          nodeColor={(node: NodeWithLayerData) => {
            // Color nodes based on their layer
            const layer = node.data.layer;
            if (layer) {
              return getLayerColor(layer, 'primary');
            }
            // Fallback to fill color
            return node.data.fill || '#ffffff';
          }}
        />
      </ReactFlow>

      {isRendering && (
        <div className="rendering-overlay">
          <div className="rendering-message">Rendering graph...</div>
        </div>
      )}
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
