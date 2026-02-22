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
  useNodesState,
  useEdgesState,
  Panel,
  Node,
  Edge,
} from '@xyflow/react';
import { MetaModel } from '@/core/types/model';
import { BusinessGraph, BusinessNode } from '@/core/types/businessLayer';
import { BusinessLayerParser } from '@/core/services/businessLayerParser';
import { BusinessGraphBuilder } from '@/core/services/businessGraphBuilder';
import { BusinessNodeTransformer } from '@/core/services/businessNodeTransformer';
import { CrossLayerReferenceResolver } from '@/core/services/crossLayerReferenceResolver';
import { HierarchicalBusinessLayout } from '@/core/layout/business/HierarchicalBusinessLayout';
import { DEFAULT_LAYOUT_OPTIONS } from '@/core/layout/business/types';
import { nodeTypes } from '@/core/nodes';
import { edgeTypes } from '@/core/edges';
import { useBusinessFilters } from '@/core/hooks/useBusinessFilters';
import { useBusinessFocus } from '@/core/hooks/useBusinessFocus';
import { useBusinessLayerStore } from '@/apps/embedded/stores/businessLayerStore';
import { BusinessLayerControls } from './BusinessLayerControls';
import { ProcessInspectorPanel } from './ProcessInspectorPanel';
import {
  exportAsPNG,
  exportAsSVG,
  exportGraphDataAsJSON,
  exportProcessCatalog,
  exportTraceabilityReport,
  exportImpactAnalysisReport,
} from '@/core/services/businessExportService';
import { MiniMap } from '../MiniMap';
import { getLayerColor } from '@/core/utils/layerColors';

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
  const [isExporting, setIsExporting] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);

  // Get state from store
  const {
    filters,
    focusMode,
    focusRadius,
    setFocusMode,
    setSelectedNodeId,
    expandedNodes,
    toggleNodeExpanded,
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

  // Apply layout when graph changes (with async support for Web Worker)
  useEffect(() => {
    if (!businessGraph) return;

    let isCancelled = false;

    const calculateLayout = async () => {
      try {
        setLoading(true);

        // Step 5: Calculate hierarchical layout (may use Web Worker for large graphs)
        const layoutEngine = new HierarchicalBusinessLayout();
        const layoutResult = await layoutEngine.calculate(businessGraph, {
          ...DEFAULT_LAYOUT_OPTIONS,
          algorithm: 'hierarchical',
          direction: 'TB',
          animate: true,
        });

        if (isCancelled) return;

        // Log performance metrics
        if (layoutResult.metadata) {
          const { calculationTime, usedWorker } = layoutResult.metadata;
          console.log(
            `[BusinessLayerView] Layout calculated in ${calculationTime.toFixed(2)}ms ${usedWorker ? '(Web Worker)' : '(main thread)'}`
          );
        }

        setNodes(layoutResult.nodes);

        // Step 6: Add cross-layer edges to the layout edges
        const crossLayerEdges: Edge[] = businessGraph.crossLayerLinks.map((link) => ({
          id: `cross-${link.source}-${link.target}`,
          source: link.source,
          target: link.target,
          type: 'elbow',
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
        if (isCancelled) return;

        const message = err instanceof Error ? err.message : String(err);
        console.error('[BusinessLayerView] Error calculating layout:', err);
        setError(message);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    calculateLayout();

    // Cleanup function to cancel pending operations
    return () => {
      isCancelled = true;
    };
  }, [businessGraph, setNodes, setEdges]);



  // Export handlers
  const handleExport = useCallback(
    async (type: 'png' | 'svg' | 'graphData' | 'catalog' | 'traceability' | 'impact') => {
      if (!businessGraph) {
        setError('Cannot export: business graph not loaded');
        return;
      }

      if (isExporting) {
        return; // Prevent concurrent exports
      }

      try {
        setIsExporting(true);
        setError(null); // Clear any previous errors
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
      } finally {
        setIsExporting(false);
      }
    },
    [nodes, edges, businessGraph, selectedNodes, isExporting]
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

  // Apply focus styling to nodes and pass expand/collapse state
  const styledNodes = useMemo(() => {
    return filteredNodes.map((node) => {
      const isFocused = focusMode !== 'none' && focusedNodes.has(node.id);
      const isDimmed = focusMode !== 'none' && dimmedNodes.has(node.id);

      return {
        ...node,
        data: {
          ...node.data,
          // Pass expand/collapse state and callback to nodes that support it
          expandedNodes,
          onToggleExpanded: toggleNodeExpanded,
        },
        style: {
          ...node.style,
          opacity: isDimmed ? 0.3 : 1,
          boxShadow: isFocused ? '0 0 0 3px rgba(74, 144, 226, 0.5)' : undefined,
        },
        className: isFocused ? 'border-[3px] border-blue-400' : undefined,
      };
    });
  }, [filteredNodes, focusedNodes, dimmedNodes, focusMode, expandedNodes, toggleNodeExpanded]);

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
      <div className="w-full h-screen flex items-center justify-center font-sans">
        <div className="p-6 bg-red-50 border-2 border-red-800 rounded-lg max-w-xl">
          <h2 className="m-0 mb-3 text-red-800 font-bold">Error</h2>
          <p className="m-0 text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center font-sans">
        <div className="p-6 bg-blue-50 border-2 border-blue-700 rounded-lg">
          <p className="m-0 text-blue-700 font-semibold">
            Loading business layer...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Controls Panel */}
      <BusinessLayerControls
        businessGraph={businessGraph}
        onExport={handleExport}
        isExporting={isExporting}
        visibleCount={visibleCount}
        totalCount={totalCount}
      />

      {/* Graph Visualization */}
      <div ref={reactFlowWrapperRef} className="flex-1 relative">
        <ReactFlow
          nodes={styledNodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
                nodeColor={() => {
                  // All nodes use Business layer color
                  return getLayerColor('Business', 'primary');
                }}
              />
            </div>
          </div>
        </Panel>
        <Panel position="top-left">
          <div className="bg-white p-3 rounded-lg shadow-md font-sans">
            <h3 className="m-0 mb-2 text-base text-gray-800">
              Business Layer
            </h3>
            {businessGraph && (
              <div className="text-xs text-gray-500">
                <div>
                  {businessGraph.nodes.size} elements • {businessGraph.edges.size} relationships
                </div>
                <div>Max depth: {businessGraph.hierarchy.maxDepth}</div>
                {businessGraph.metrics.circularDependencies.length > 0 && (
                  <div className="text-red-700 mt-1">
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
