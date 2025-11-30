/**
 * MotivationGraphView Component
 * Displays motivation layer elements as an interactive graph using ReactFlow
 * Renders ontology diagram with force-directed layout
 */

import { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../../core/components/GraphViewer.css';

import { MetaModel } from '../../../core/types';
import { nodeTypes } from '../../../core/nodes';
import { edgeTypes } from '../../../core/edges';
import { MotivationGraphBuilder } from '../services/motivationGraphBuilder';
import { MotivationGraphTransformer } from '../services/motivationGraphTransformer';
import { ErrorBoundary } from './ErrorBoundary';

export interface MotivationGraphViewProps {
  model: MetaModel;
}

/**
 * MotivationGraphView Component
 * Renders motivation layer as interactive ontology diagram
 */
const MotivationGraphView: React.FC<MotivationGraphViewProps> = ({ model }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Create services
  const motivationGraphBuilder = useMemo(() => new MotivationGraphBuilder(), []);
  const motivationGraphTransformer = useMemo(
    () => new MotivationGraphTransformer({ layoutAlgorithm: 'force' }),
    []
  );

  /**
   * Transform model to motivation graph and apply layout
   */
  useEffect(() => {
    const buildAndTransformGraph = async () => {
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

        // Transform to ReactFlow format with layout
        console.log('[MotivationGraphView] Applying force-directed layout');
        const transformResult = motivationGraphTransformer.transform(motivationGraph);

        console.log('[MotivationGraphView] Transformation complete:', {
          nodes: transformResult.nodes.length,
          edges: transformResult.edges.length,
          bounds: transformResult.bounds,
        });

        // Set nodes and edges
        setNodes(transformResult.nodes);
        setEdges(transformResult.edges);

        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to build motivation graph';
        console.error('[MotivationGraphView] Error:', err);
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (model) {
      buildAndTransformGraph();
    }
  }, [model, motivationGraphBuilder, motivationGraphTransformer, setNodes, setEdges]);

  /**
   * Handle node selection
   */
  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    console.log('[MotivationGraphView] Node selected:', node.id, node.data);
    // TODO: Phase 4 - Show inspector panel with element details
  };

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
  if (nodes.length === 0) {
    return (
      <div className="message-overlay">
        <div className="message-box">
          <p>No motivation elements to display</p>
        </div>
      </div>
    );
  }

  // Render ReactFlow with motivation nodes and edges
  return (
    <ErrorBoundary>
      <div className="graph-viewer" style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
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
          <MiniMap
            nodeColor={(node) => {
              // Color minimap nodes based on their stroke color
              return node.data.stroke || '#6b7280';
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
};

export default MotivationGraphView;
