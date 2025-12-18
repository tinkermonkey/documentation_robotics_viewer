/**
 * C4GraphView Component
 * Displays C4 architecture diagrams using ReactFlow
 * Provides view level switching, filtering, and interactive controls
 * Follows MotivationGraphView architecture patterns
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
  NodeMouseHandler,
} from '@xyflow/react';

import { MetaModel } from '../../../core/types';
import { nodeTypes } from '../../../core/nodes';
import { edgeTypes } from '../../../core/edges';
import { C4GraphBuilder } from '../services/c4Parser';
import { C4ViewTransformer } from '../services/c4ViewTransformer';
import { ErrorBoundary } from './ErrorBoundary';
import { C4BreadcrumbNav } from './C4BreadcrumbNav';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import {
  C4Graph,
  C4ViewLevel,
  C4TransformerOptions,
  C4BreadcrumbSegment,
  ContainerType,
} from '../types/c4Graph';
import { SpaceMouseHandler } from '../../../core/components/SpaceMouseHandler';
import { C4LayoutAlgorithm } from './C4ControlPanel';

// Debug logging helper - only logs in development mode
const DEBUG = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
  if (DEBUG) console.log(...args);
};

export interface C4GraphViewProps {
  model: MetaModel;
  selectedContainerTypes: Set<ContainerType>;
  selectedTechnologyStacks: Set<string>;
  layout: C4LayoutAlgorithm;
}

export interface C4GraphViewRef {
  fitView: () => void;
}

/**
 * C4GraphView Component
 * Renders C4 architecture diagrams with drill-down navigation
 */
const C4GraphView = React.forwardRef<C4GraphViewRef, C4GraphViewProps>(
  ({ model, selectedContainerTypes, selectedTechnologyStacks, layout }, ref) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [breadcrumb, setBreadcrumb] = useState<C4BreadcrumbSegment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Get ReactFlow instance for fitView
    const reactFlowInstance = useReactFlow();

    // Expose fitView method to parent via ref
    React.useImperativeHandle(ref, () => ({
      fitView: () => {
        reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
      },
    }));

    // Get preferences from store
    const {
      c4Preferences,
      setC4ViewLevel,
      setC4SelectedContainer,
      setC4SelectedComponent,
    } = useViewPreferenceStore();

    // Store reference to full graph for relationship tracing
    const fullGraphRef = useRef<C4Graph | null>(null);

    // Create services
    const c4GraphBuilder = useMemo(() => new C4GraphBuilder(), []);

    /**
     * Build the full C4 graph from model
     */
    useEffect(() => {
      const buildGraph = async () => {
        try {
          setLoading(true);
          setError('');

          debugLog('[C4GraphView] Building C4 graph from model');

          // Build intermediate C4 graph
          const c4Graph = c4GraphBuilder.build(model);

          debugLog('[C4GraphView] C4 graph built:', {
            nodes: c4Graph.nodes.size,
            edges: c4Graph.edges.size,
            containers: c4Graph.metadata.elementCounts.container,
            components: c4Graph.metadata.elementCounts.component,
            external: c4Graph.metadata.elementCounts.external,
          });

          // Check if we have any C4 elements
          if (c4Graph.nodes.size === 0) {
            console.warn('[C4GraphView] No C4 elements found in model');
            setError('No C4 elements (containers, components) found in this model. Ensure the model has an Application layer with services.');
            setLoading(false);
            return;
          }

          // Store the full graph
          fullGraphRef.current = c4Graph;

          setLoading(false);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to build C4 graph';
          console.error('[C4GraphView] Error:', err);
          setError(errorMessage);
          setLoading(false);
        }
      };

      if (model) {
        buildGraph();
      }
    }, [model, c4GraphBuilder]);

    /**
     * Transform graph to ReactFlow format whenever filters, layout, or view level changes
     */
    useEffect(() => {
      if (!fullGraphRef.current) return;

      const transformGraph = async () => {
        try {
          debugLog('[C4GraphView] Transforming graph with:', {
            viewLevel: c4Preferences.viewLevel,
            layout,
            selectedContainerId: c4Preferences.selectedContainerId,
          });

          // Prepare transformer options
          const transformerOptions: C4TransformerOptions = {
            viewLevel: c4Preferences.viewLevel,
            selectedContainerId: c4Preferences.selectedContainerId,
            selectedComponentId: c4Preferences.selectedComponentId,
            layoutAlgorithm: layout,
            filterOptions: {
              containerTypes: selectedContainerTypes,
              technologyStack: selectedTechnologyStacks,
              showDeployment: c4Preferences.showDeploymentOverlay,
            },
            focusContext: {
              enabled: c4Preferences.focusContextEnabled,
              focusedNodeId: c4Preferences.selectedNodeId,
            },
            pathHighlighting: {
              mode: c4Preferences.pathTracing.mode,
              sourceId: c4Preferences.pathTracing.sourceId,
              targetId: c4Preferences.pathTracing.targetId,
              highlightedNodeIds: c4Preferences.pathTracing.highlightedNodeIds,
              highlightedEdgeIds: c4Preferences.pathTracing.highlightedEdgeIds,
            },
            semanticZoom: {
              enabled: true,
              currentScale: 1.0,
            },
            existingPositions:
              layout === 'manual' ? c4Preferences.manualPositions : undefined,
            scenarioPreset: c4Preferences.scenarioPreset,
            showOnlyChangeset: false,
          };

          const transformer = new C4ViewTransformer(transformerOptions);

          const transformResult = transformer.transform(fullGraphRef.current!);

          debugLog('[C4GraphView] Transformation complete:', {
            nodes: transformResult.nodes.length,
            edges: transformResult.edges.length,
            bounds: transformResult.bounds,
          });

          setNodes(transformResult.nodes);
          setEdges(transformResult.edges);
          setBreadcrumb(transformResult.breadcrumb);

          // Fit view after layout
          setTimeout(() => {
            reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
          }, 100);
        } catch (err) {
          console.error('[C4GraphView] Transform error:', err);
          setError('Failed to transform graph. Please try a different layout or reload the page.');
        }
      };

      transformGraph();
    }, [
      fullGraphRef.current,
      c4Preferences.viewLevel,
      c4Preferences.selectedContainerId,
      c4Preferences.selectedComponentId,
      layout,
      selectedContainerTypes,
      selectedTechnologyStacks,
      c4Preferences.showDeploymentOverlay,
      c4Preferences.focusContextEnabled,
      c4Preferences.manualPositions,
      c4Preferences.pathTracing,
      c4Preferences.scenarioPreset,
      reactFlowInstance,
    ]);

    /**
     * Handle view level change (from breadcrumb navigation)
     */
    const handleViewLevelChange = useCallback(
      (level: C4ViewLevel, containerId?: string, componentId?: string) => {
        debugLog('[C4GraphView] View level change:', level, containerId, componentId);
        setC4ViewLevel(level);
        setC4SelectedContainer(containerId);
        setC4SelectedComponent(componentId);
      },
      [setC4ViewLevel, setC4SelectedContainer, setC4SelectedComponent]
    );

    /**
     * Handle node click - drill-down or selection
     */
    const onNodeClick: NodeMouseHandler = useCallback(
      (_event, node) => {
        debugLog('[C4GraphView] Node clicked:', node.id, node.data.c4Type);

        if (!fullGraphRef.current) return;

        const c4Type = node.data.c4Type;
        const currentViewLevel = c4Preferences.viewLevel;

        // Drill-down logic
        if (currentViewLevel === 'context' && c4Type === 'container') {
          debugLog('[C4GraphView] Drilling down to container view:', node.id);
          handleViewLevelChange('container', node.id);
          return;
        }

        if (currentViewLevel === 'container' && c4Type === 'component') {
          debugLog('[C4GraphView] Drilling down to component view:', node.id);
          handleViewLevelChange('component', c4Preferences.selectedContainerId, node.id);
          return;
        }

        // Standard selection - notify parent via store
        useViewPreferenceStore.getState().setC4SelectedNodeId(node.id);
        useViewPreferenceStore.getState().setC4InspectorPanelVisible(true);
      },
      [c4Preferences.viewLevel, c4Preferences.selectedContainerId, handleViewLevelChange]
    );

    /**
     * Handle zoom changes for semantic zoom
     */
    const onMoveEnd = useCallback(
      (_event: any, viewport: { x: number; y: number; zoom: number }) => {
        debugLog('[C4GraphView] Zoom changed:', viewport.zoom);
      },
      []
    );

    // Loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-50 dark:bg-gray-950">
          <div className="flex flex-col items-center gap-4 py-8 px-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-center max-w-md">
            <div className="w-8 h-8 border-[3px] border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="m-0 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Loading C4 architecture diagram...</p>
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-50 dark:bg-gray-950">
          <div className="flex flex-col items-center gap-4 py-8 px-12 border rounded-xl shadow-sm text-center max-w-md border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
            <h3 className="m-0 text-base font-semibold text-red-600 dark:text-red-400">Error</h3>
            <p className="m-0 text-sm text-red-900 dark:text-red-300">{error}</p>
          </div>
        </div>
      );
    }

    // Render ReactFlow with C4 nodes and edges
    return (
      <ErrorBoundary>
        <div className="flex flex-col w-full h-full bg-gray-50 dark:bg-gray-950 relative c4-graph-viewer">
          {/* Breadcrumb Navigation */}
          {breadcrumb.length > 0 && (
            <C4BreadcrumbNav
              breadcrumb={breadcrumb}
              currentViewLevel={c4Preferences.viewLevel}
              onNavigate={handleViewLevelChange}
            />
          )}

          {/* Graph Viewer */}
          <div className="flex-1 relative bg-white dark:bg-gray-900">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onMoveEnd={onMoveEnd}
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
                  return (node.data.stroke as string) || '#6b7280';
                }}
                maskColor="rgba(0, 0, 0, 0.1)"
                style={{
                  backgroundColor: '#f9fafb',
                }}
                pannable
                zoomable
              />
            </ReactFlow>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
);

C4GraphView.displayName = 'C4GraphView';

export default C4GraphView;
