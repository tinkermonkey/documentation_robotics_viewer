/**
 * Business Layer View Component
 *
 * Displays the business layer using React Flow with hierarchical layout.
 * Integrates BusinessLayerParser, BusinessGraphBuilder, and HierarchicalBusinessLayout.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Node,
  Edge,
} from '@xyflow/react';
import { MetaModel } from '../../types/model';
import { BusinessGraph, BusinessNode } from '../../types/businessLayer';
import { BusinessLayerParser } from '../../services/businessLayerParser';
import { BusinessGraphBuilder } from '../../services/businessGraphBuilder';
import { BusinessNodeTransformer } from '../../services/businessNodeTransformer';
import { CrossLayerReferenceResolver } from '../../services/crossLayerReferenceResolver';
import { HierarchicalBusinessLayout } from '../../layout/business/HierarchicalBusinessLayout';
import { DEFAULT_LAYOUT_OPTIONS } from '../../layout/business/types';
import { nodeTypes } from '../../nodes';
import { edgeTypes } from '../../edges';
import { useBusinessFilters } from '../../hooks/useBusinessFilters';
import { useBusinessFocus } from '../../hooks/useBusinessFocus';
import { useBusinessLayerStore } from '../../../stores/businessLayerStore';
import { BusinessLayerControls } from './BusinessLayerControls';
import { ProcessInspectorPanel } from './ProcessInspectorPanel';
import {
  exportAsPNG,
  exportAsSVG,
  exportGraphDataAsJSON,
  exportProcessCatalog,
  exportTraceabilityReport,
  exportImpactAnalysisReport,
} from '../../services/businessExportService';
import './BusinessLayerView.css';

interface BusinessLayerViewProps {
  /** The documentation model */
  model: MetaModel;
}

/**
 * BusinessLayerView - Visualize business layer with hierarchical layout
 */
export const BusinessLayerView: React.FC<BusinessLayerViewProps> = ({ model }) => {
  const [businessGraph, setBusinessGraph] = useState<BusinessGraph | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);

  // Get state from store
  const {
    filters,
    focusMode,
    focusRadius,
    setFocusMode,
    setSelectedNodeId,
  } = useBusinessLayerStore();

  // Apply filters to nodes and edges
  const { filteredNodes, filteredEdges, visibleCount, totalCount } = useBusinessFilters(
    nodes,
    edges,
    filters,
    businessGraph
  );

  // Apply focus mode
  const { focusedNodes, focusedEdges, dimmedNodes } = useBusinessFocus(
    selectedNodes,
    focusMode,
    focusRadius,
    businessGraph
  );

  // Get selected node for inspector
  const selectedNode = useMemo<BusinessNode | null>(() => {
    if (selectedNodes.size !== 1 || !businessGraph) return null;
    const nodeId = Array.from(selectedNodes)[0];
    return businessGraph.nodes.get(nodeId) || null;
  }, [selectedNodes, businessGraph]);

  // Parse and build graph on mount/model change
  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Parse business layer from model
      const parser = new BusinessLayerParser();
      const businessLayerData = parser.parseBusinessLayer(model);

      // Step 2: Build graph with hierarchy and metrics
      const graphBuilder = new BusinessGraphBuilder();
      let graph = graphBuilder.buildGraph(
        businessLayerData.elements,
        businessLayerData.relationships
      );

      // Step 3: Resolve cross-layer references
      const crossLayerResolver = new CrossLayerReferenceResolver();
      graph = crossLayerResolver.resolveAllLinks(graph, model);

      // Step 4: Pre-calculate dimensions
      const transformer = new BusinessNodeTransformer();
      transformer.precalculateDimensions(graph.nodes);

      setBusinessGraph(graph);
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
      // Step 5: Calculate hierarchical layout
      const layoutEngine = new HierarchicalBusinessLayout();
      const layoutResult = layoutEngine.calculate(businessGraph, {
        ...DEFAULT_LAYOUT_OPTIONS,
        algorithm: 'hierarchical',
        direction: 'TB',
        animate: true,
      });

      setNodes(layoutResult.nodes);

      // Step 6: Add cross-layer edges to the layout edges
      const crossLayerEdges: Edge[] = businessGraph.crossLayerLinks.map((link) => ({
        id: `cross-${link.source}-${link.target}`,
        source: link.source,
        target: link.target,
        type: 'crossLayer',
        data: {
          targetLayer: link.targetLayer,
          relationshipType: link.type,
          label: link.type,
        },
        style: {
          strokeDasharray: '5,5',
        },
      }));

      setEdges([...layoutResult.edges, ...crossLayerEdges]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[BusinessLayerView] Error calculating layout:', err);
      setError(message);
    }
  }, [businessGraph, setNodes, setEdges]);

  // Fit view when nodes change
  const onNodesInitialized = useCallback(() => {
    // Nodes are initialized and fitView is handled by ReactFlow
  }, []);

  // Export handlers
  const handleExport = useCallback(
    async (type: 'png' | 'svg' | 'graphData' | 'catalog' | 'traceability' | 'impact') => {
      if (!businessGraph) {
        setError('Cannot export: business graph not loaded');
        return;
      }

      try {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

        switch (type) {
          case 'png':
            if (reactFlowWrapperRef.current) {
              await exportAsPNG(reactFlowWrapperRef.current, `business-layer-${timestamp}.png`);
            }
            break;
          case 'svg':
            if (reactFlowWrapperRef.current) {
              await exportAsSVG(reactFlowWrapperRef.current, `business-layer-${timestamp}.svg`);
            }
            break;
          case 'graphData':
            exportGraphDataAsJSON(nodes, edges, businessGraph, `business-graph-${timestamp}.json`);
            break;
          case 'catalog':
            exportProcessCatalog(businessGraph, `business-catalog-${timestamp}.json`);
            break;
          case 'traceability':
            exportTraceabilityReport(
              businessGraph,
              businessGraph.crossLayerLinks,
              `traceability-${timestamp}.json`
            );
            break;
          case 'impact':
            if (selectedNodes.size === 0) {
              setError('Please select at least one process to analyze impact');
              return;
            }
            exportImpactAnalysisReport(
              selectedNodes,
              businessGraph,
              `impact-analysis-${timestamp}.json`
            );
            break;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[BusinessLayerView] Export failed:', err);
        setError(`Export failed: ${message}`);
      }
    },
    [nodes, edges, businessGraph, selectedNodes]
  );

  // Node interaction handlers
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (event.shiftKey) {
        // Multi-select for path tracing
        setSelectedNodes((prev) => {
          const updated = new Set(prev);
          updated.add(node.id);
          return updated;
        });
      } else {
        // Single select
        setSelectedNodes(new Set([node.id]));
        setSelectedNodeId(node.id);
        setFocusMode('selected');
      }
    },
    [setFocusMode, setSelectedNodeId]
  );

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Double-click to expand/collapse (future implementation)
      // For now, just select
      setSelectedNodes(new Set([node.id]));
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  // Focus mode action handlers
  const handleTraceUpstream = useCallback(() => {
    setFocusMode('upstream');
  }, [setFocusMode]);

  const handleTraceDownstream = useCallback(() => {
    setFocusMode('downstream');
  }, [setFocusMode]);

  const handleIsolate = useCallback(() => {
    // Isolate shows only selected node and immediate neighbors
    setFocusMode('radial');
  }, [setFocusMode]);

  /**
   * Cross-layer navigation handler
   *
   * Dispatches a custom event that parent components can listen to for navigation.
   * Parent component is responsible for adding/removing event listeners.
   *
   * Example listener setup:
   * ```typescript
   * useEffect(() => {
   *   const handler = (e: CustomEvent) => {
   *     const { layer, elementId } = e.detail;
   *     // Navigate to layer and highlight element
   *   };
   *   window.addEventListener('navigate-to-layer', handler);
   *   return () => window.removeEventListener('navigate-to-layer', handler);
   * }, []);
   * ```
   */
  const handleNavigateToCrossLayer = useCallback(
    (layer: string, elementId: string) => {
      // Emit event for parent component to handle navigation
      // This decouples the business layer view from routing implementation
      window.dispatchEvent(
        new CustomEvent('navigate-to-layer', {
          detail: { layer, elementId },
        })
      );
    },
    []
  );

  // Apply focus styling to nodes
  const styledNodes = useMemo(() => {
    return filteredNodes.map((node) => {
      const isFocused = focusMode !== 'none' && focusedNodes.has(node.id);
      const isDimmed = focusMode !== 'none' && dimmedNodes.has(node.id);

      return {
        ...node,
        style: {
          ...node.style,
          opacity: isDimmed ? 0.3 : 1,
          transition: 'opacity 0.3s ease',
        },
        className: isFocused ? 'focused-node' : undefined,
      };
    });
  }, [filteredNodes, focusedNodes, dimmedNodes, focusMode]);

  // Apply focus styling to edges
  const styledEdges = useMemo(() => {
    return filteredEdges.map((edge) => {
      const isFocused = focusMode !== 'none' && focusedEdges.has(edge.id);
      const isDimmed = focusMode !== 'none' && !focusedEdges.has(edge.id);

      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isDimmed ? 0.2 : 1,
          strokeWidth: isFocused ? 3 : 2,
          transition: 'opacity 0.3s ease, stroke-width 0.3s ease',
        },
      };
    });
  }, [filteredEdges, focusedEdges, focusMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodes(new Set());
        setSelectedNodeId(undefined);
        setFocusMode('none');
      }
      // Tab, Enter, Arrow keys handled by ReactFlow
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setFocusMode, setSelectedNodeId]);

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
    <div className="business-layer-view" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Controls Panel */}
      <BusinessLayerControls
        businessGraph={businessGraph}
        onExport={handleExport}
        visibleCount={visibleCount}
        totalCount={totalCount}
      />

      {/* Graph Visualization */}
      <div ref={reactFlowWrapperRef} style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={styledNodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesInitialized={onNodesInitialized}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
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
            return (node.data?.fill as string) || '#e0e0e0';
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

        {/* Process Inspector Panel */}
        <ProcessInspectorPanel
          selectedNode={selectedNode}
          businessGraph={businessGraph}
          onTraceUpstream={handleTraceUpstream}
          onTraceDownstream={handleTraceDownstream}
          onIsolate={handleIsolate}
          onNavigateToCrossLayer={handleNavigateToCrossLayer}
        />
      </div>
    </div>
  );
};
