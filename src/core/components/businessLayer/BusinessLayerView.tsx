/**
 * Business Layer View Component
 *
 * Displays the business layer using React Flow with hierarchical layout.
 * Integrates BusinessLayerParser, BusinessGraphBuilder, and HierarchicalBusinessLayout.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import { MetaModel } from '../../types/model';
import { BusinessGraph } from '../../types/businessLayer';
import { BusinessLayerParser } from '../../services/businessLayerParser';
import { BusinessGraphBuilder } from '../../services/businessGraphBuilder';
import { BusinessNodeTransformer } from '../../services/businessNodeTransformer';
import { HierarchicalBusinessLayout } from '../../layout/business/HierarchicalBusinessLayout';
import { DEFAULT_LAYOUT_OPTIONS } from '../../layout/business/types';
import { nodeTypes } from '../../nodes';
import { edgeTypes } from '../../edges';

interface BusinessLayerViewProps {
  /** The documentation model */
  model: MetaModel;
}

/**
 * BusinessLayerView - Visualize business layer with hierarchical layout
 */
export const BusinessLayerView: React.FC<BusinessLayerViewProps> = ({ model }) => {
  const [businessGraph, setBusinessGraph] = useState<BusinessGraph | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse and build graph on mount/model change
  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      console.log('[BusinessLayerView] Parsing business layer...');
      const startTime = performance.now();

      // Step 1: Parse business layer from model
      const parser = new BusinessLayerParser();
      const businessLayerData = parser.parseBusinessLayer(model);

      console.log(
        `[BusinessLayerView] Parsed ${businessLayerData.elements.length} elements, ${businessLayerData.relationships.length} relationships`
      );

      // Step 2: Build graph with hierarchy and metrics
      const graphBuilder = new BusinessGraphBuilder();
      const graph = graphBuilder.buildGraph(
        businessLayerData.elements,
        businessLayerData.relationships
      );

      console.log(
        `[BusinessLayerView] Built graph with ${graph.nodes.size} nodes, ${graph.edges.size} edges, max depth ${graph.hierarchy.maxDepth}`
      );

      // Step 3: Pre-calculate dimensions
      const transformer = new BusinessNodeTransformer();
      transformer.precalculateDimensions(graph.nodes);

      setBusinessGraph(graph);

      const elapsedTime = performance.now() - startTime;
      console.log(`[BusinessLayerView] Graph building completed in ${elapsedTime.toFixed(2)}ms`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[BusinessLayerView] Error parsing business layer:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [model]);

  // Apply layout when graph changes
  useEffect(() => {
    if (!businessGraph) return;

    try {
      console.log('[BusinessLayerView] Calculating layout...');
      const startTime = performance.now();

      // Step 4: Calculate hierarchical layout
      const layoutEngine = new HierarchicalBusinessLayout();
      const layoutResult = layoutEngine.calculate(businessGraph, {
        ...DEFAULT_LAYOUT_OPTIONS,
        algorithm: 'hierarchical',
        direction: 'TB',
        animate: true,
      });

      setNodes(layoutResult.nodes);
      setEdges(layoutResult.edges);

      const elapsedTime = performance.now() - startTime;
      console.log(`[BusinessLayerView] Layout calculated in ${elapsedTime.toFixed(2)}ms`);
      console.log(
        `[BusinessLayerView] Created ${layoutResult.nodes.length} nodes and ${layoutResult.edges.length} edges`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[BusinessLayerView] Error calculating layout:', err);
      setError(message);
    }
  }, [businessGraph, setNodes, setEdges]);

  // Fit view when nodes change
  const onNodesInitialized = useCallback(() => {
    console.log('[BusinessLayerView] Nodes initialized, fitting view');
  }, []);

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            padding: 24,
            background: '#ffebee',
            border: '2px solid #c62828',
            borderRadius: 8,
            maxWidth: 600,
          }}
        >
          <h2 style={{ margin: 0, marginBottom: 12, color: '#c62828' }}>Error</h2>
          <p style={{ margin: 0, color: '#424242' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            padding: 24,
            background: '#e3f2fd',
            border: '2px solid #1565c0',
            borderRadius: 8,
          }}
        >
          <p style={{ margin: 0, color: '#1565c0', fontWeight: 600 }}>
            Loading business layer...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-layer-view" style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesInitialized={onNodesInitialized}
        onlyRenderVisibleElements={true} // Critical for performance with >200 nodes
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          duration: 200,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'elbow',
          animated: false,
        }}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return node.data.fill || '#e0e0e0';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            backgroundColor: '#f5f5f5',
          }}
        />
        <Panel position="top-left">
          <div
            style={{
              background: 'white',
              padding: 12,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, color: '#1f2937' }}>
              Business Layer
            </h3>
            {businessGraph && (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                <div>
                  {businessGraph.nodes.size} elements • {businessGraph.edges.size} relationships
                </div>
                <div>Max depth: {businessGraph.hierarchy.maxDepth}</div>
                {businessGraph.metrics.circularDependencies.length > 0 && (
                  <div style={{ color: '#c62828', marginTop: 4 }}>
                    ⚠️ {businessGraph.metrics.circularDependencies.length} circular dependencies
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};
