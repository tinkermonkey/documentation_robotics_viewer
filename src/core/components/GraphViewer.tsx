/**
 * GraphViewer Component - React Flow Implementation
 * Renders a MetaModel using React Flow with custom nodes and edges
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  NodeMouseHandler,
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

interface GraphViewerProps {
  model: MetaModel;
  onNodeClick?: (node: Node | null) => void;
}

/**
 * GraphViewer Component
 * Renders a MetaModel using React Flow with custom nodes and vertical layer layout
 */
const GraphViewer: React.FC<GraphViewerProps> = ({ model, onNodeClick }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);
  const { layers: layerStates } = useLayerStore();
  const [isRendering, setIsRendering] = useState(false);

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
        <MiniMap
          nodeColor={(node) => {
            // Color nodes based on their fill color
            return (node.data as any).fill || '#ffffff';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
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

export default GraphViewer;
