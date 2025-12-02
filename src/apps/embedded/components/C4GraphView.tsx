/**
 * C4GraphView Component
 * Displays C4 architecture diagrams using ReactFlow
 * Provides view level switching, filtering, and interactive controls
 * Follows MotivationGraphView architecture patterns
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import '@xyflow/react/dist/style.css';
import '../../../core/components/GraphViewer.css';
import './C4GraphView.css';
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
import { C4FilterPanel, C4FilterCounts } from './C4FilterPanel';
import { C4ControlPanel, C4LayoutAlgorithm } from './C4ControlPanel';
import { C4InspectorPanel } from './C4InspectorPanel';
import { useViewPreferenceStore, C4PathTracingState } from '../stores/viewPreferenceStore';
import {
  C4Graph,
  C4ViewLevel,
  C4TransformerOptions,
  ContainerType,
  C4Type,
  C4BreadcrumbSegment,
} from '../types/c4Graph';
import {
  exportC4AsPNG,
  exportC4AsSVG,
  exportC4GraphAsJSON,
} from '../services/c4ExportService';

// Debug logging helper - only logs in development mode
const DEBUG = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
  if (DEBUG) console.log(...args);
};

export interface C4GraphViewProps {
  model: MetaModel;
}

/**
 * C4GraphView Component
 * Renders C4 architecture diagrams with drill-down navigation
 */
const C4GraphView: React.FC<C4GraphViewProps> = ({ model }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isLayouting, setIsLayouting] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<C4BreadcrumbSegment[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [graphReady, setGraphReady] = useState(false);

  // Store reference to the full C4 graph
  const fullGraphRef = useRef<C4Graph | null>(null);

  // Get ReactFlow instance for fitView
  const reactFlowInstance = useReactFlow();

  // Get preferences from store
  const {
    c4Preferences,
    setC4ViewLevel,
    setC4SelectedContainer,
    setC4SelectedComponent,
    setC4Layout,
    setC4VisibleContainerTypes,
    setC4VisibleTechnologyStacks,
    setC4ManualPositions,
    setC4FocusContextEnabled,
    setC4PathTracing,
    setC4ScenarioPreset,
    setC4SelectedNodeId,
    setC4InspectorPanelVisible,
  } = useViewPreferenceStore();

  // Local state for changeset filter
  const [showOnlyChangeset, setShowOnlyChangeset] = useState(false);
  const [hasChangesetElements, setHasChangesetElements] = useState(false);

  // Use store state directly to avoid sync issues
  const selectedContainerTypes = c4Preferences.visibleContainerTypes;
  const selectedTechnologyStacks = c4Preferences.visibleTechnologyStacks;
  const selectedLayout = c4Preferences.selectedLayout;

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
        setGraphReady(true);

        // Update available technology stacks for filtering
        if (c4Graph.metadata.technologies.length > 0) {
          // Initialize technology stacks filter if empty
          if (selectedTechnologyStacks.size === 0) {
            setC4VisibleTechnologyStacks(new Set(c4Graph.metadata.technologies));
          }
        }

        // Check for changeset elements
        let hasChangeset = false;
        for (const node of c4Graph.nodes.values()) {
          if (node.changesetStatus) {
            hasChangeset = true;
            break;
          }
        }
        if (!hasChangeset) {
          for (const edge of c4Graph.edges.values()) {
            if (edge.changesetStatus) {
              hasChangeset = true;
              break;
            }
          }
        }
        setHasChangesetElements(hasChangeset);

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
  }, [model, c4GraphBuilder, setC4VisibleTechnologyStacks]);

  /**
   * Transform graph to ReactFlow format whenever filters, layout, or view level changes
   */
  useEffect(() => {
    if (!graphReady || !fullGraphRef.current) return;

    const transformGraph = async () => {
      try {
        setIsLayouting(true);

        debugLog('[C4GraphView] Transforming graph with:', {
          viewLevel: c4Preferences.viewLevel,
          layout: selectedLayout,
          selectedContainerId: c4Preferences.selectedContainerId,
        });

        // Prepare transformer options
        const transformerOptions: C4TransformerOptions = {
          viewLevel: c4Preferences.viewLevel,
          selectedContainerId: c4Preferences.selectedContainerId,
          selectedComponentId: c4Preferences.selectedComponentId,
          layoutAlgorithm: selectedLayout,
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
            currentScale: zoomLevel,
          },
          existingPositions:
            selectedLayout === 'manual' ? c4Preferences.manualPositions : undefined,
          scenarioPreset: c4Preferences.scenarioPreset,
          showOnlyChangeset: showOnlyChangeset,
        };

        const transformer = new C4ViewTransformer(transformerOptions);

        // Transform with animation delay for smooth transitions
        await new Promise((resolve) => setTimeout(resolve, 50));

        const transformResult = transformer.transform(fullGraphRef.current);

        debugLog('[C4GraphView] Transformation complete:', {
          nodes: transformResult.nodes.length,
          edges: transformResult.edges.length,
          bounds: transformResult.bounds,
        });

        // Apply animated transitions if layout changed
        if (nodes.length > 0 && transformResult.nodes.length > 0) {
          try {
            await animateLayoutTransition(nodes, transformResult.nodes, setNodes, setIsLayouting);
          } catch (animationErr) {
            // If animation fails, apply nodes directly without animation
            console.warn('[C4GraphView] Animation failed, applying nodes directly:', animationErr);
            setNodes(transformResult.nodes);
          }
        } else {
          setNodes(transformResult.nodes);
        }

        setEdges(transformResult.edges);
        setBreadcrumb(transformResult.breadcrumb);

        // Fit view after layout
        setTimeout(() => {
          reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
        }, 100);

        setIsLayouting(false);
      } catch (err) {
        console.error('[C4GraphView] Transform error:', err);
        // Attempt to recover by showing a user-friendly error message
        setError('Failed to transform graph. Please try a different layout or reload the page.');
        setIsLayouting(false);
      }
    };

    transformGraph();
  }, [
    graphReady,
    c4Preferences.viewLevel,
    c4Preferences.selectedContainerId,
    c4Preferences.selectedComponentId,
    selectedLayout,
    selectedContainerTypes,
    selectedTechnologyStacks,
    c4Preferences.showDeploymentOverlay,
    c4Preferences.focusContextEnabled,
    c4Preferences.manualPositions,
    c4Preferences.pathTracing,
    c4Preferences.scenarioPreset,
    showOnlyChangeset,
    zoomLevel,
  ]);

  /**
   * Calculate filter counts for display (memoized for performance)
   */
  const filterCounts = useMemo((): C4FilterCounts => {
    if (!graphReady || !fullGraphRef.current) {
      return {
        containerTypes: {},
        technologies: {},
      };
    }

    const graph = fullGraphRef.current;

    // Count by container type
    const containerTypeCounts: Record<ContainerType, { visible: number; total: number }> = {} as any;
    for (const containerType of Object.values(ContainerType)) {
      const typeNodes = graph.indexes.byContainerType.get(containerType as ContainerType);
      const total = typeNodes?.size || 0;
      const visible = selectedContainerTypes.has(containerType as ContainerType) ? total : 0;
      containerTypeCounts[containerType as ContainerType] = { visible, total };
    }

    // Count by technology
    const technologyCounts: Record<string, { visible: number; total: number }> = {};
    for (const [tech, nodeIds] of graph.indexes.byTechnology) {
      const total = nodeIds.size;
      const visible = selectedTechnologyStacks.has(tech) ? total : 0;
      technologyCounts[tech] = { visible, total };
    }

    return {
      containerTypes: containerTypeCounts,
      technologies: technologyCounts,
    };
  }, [graphReady, selectedContainerTypes, selectedTechnologyStacks]);

  /**
   * Get available technologies from graph
   */
  const availableTechnologies = useMemo((): string[] => {
    if (!graphReady || !fullGraphRef.current) return [];
    return fullGraphRef.current.metadata.technologies;
  }, [graphReady]);

  /**
   * Handle container type filter change
   */
  const handleContainerTypeChange = useCallback(
    (containerType: ContainerType, selected: boolean) => {
      const newTypes = new Set(selectedContainerTypes);
      if (selected) {
        newTypes.add(containerType);
      } else {
        newTypes.delete(containerType);
      }
      setC4VisibleContainerTypes(newTypes);
    },
    [selectedContainerTypes, setC4VisibleContainerTypes]
  );

  /**
   * Handle technology stack filter change
   */
  const handleTechnologyChange = useCallback(
    (technology: string, selected: boolean) => {
      const newStacks = new Set(selectedTechnologyStacks);
      if (selected) {
        newStacks.add(technology);
      } else {
        newStacks.delete(technology);
      }
      setC4VisibleTechnologyStacks(newStacks);
    },
    [selectedTechnologyStacks, setC4VisibleTechnologyStacks]
  );

  /**
   * Handle clear all filters
   */
  const handleClearAllFilters = useCallback(() => {
    const allContainerTypes = new Set(Object.values(ContainerType));
    const allTechnologies = new Set(availableTechnologies);
    setC4VisibleContainerTypes(allContainerTypes);
    setC4VisibleTechnologyStacks(allTechnologies);
  }, [availableTechnologies, setC4VisibleContainerTypes, setC4VisibleTechnologyStacks]);

  /**
   * Handle layout change
   */
  const handleLayoutChange = useCallback(
    (layout: C4LayoutAlgorithm) => {
      setC4Layout(layout);
    },
    [setC4Layout]
  );

  /**
   * Handle view level change (from breadcrumb or view switcher)
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
   * Handle fit to view
   */
  const handleFitToView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
  }, [reactFlowInstance]);

  /**
   * Handle focus mode toggle
   */
  const handleFocusModeToggle = useCallback(
    (enabled: boolean) => {
      setC4FocusContextEnabled(enabled);
    },
    [setC4FocusContextEnabled]
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
      if (currentViewLevel === 'context' && c4Type === C4Type.Container) {
        // Drill down to container view
        debugLog('[C4GraphView] Drilling down to container view:', node.id);
        handleViewLevelChange('container', node.id);
        return;
      }

      if (currentViewLevel === 'container' && c4Type === C4Type.Component) {
        // Drill down to component view
        debugLog('[C4GraphView] Drilling down to component view:', node.id);
        handleViewLevelChange('component', c4Preferences.selectedContainerId, node.id);
        return;
      }

      // Standard selection
      setC4SelectedNodeId(node.id);
      setC4InspectorPanelVisible(true);

      // Highlight direct relationships
      const transformer = new C4ViewTransformer({
        viewLevel: c4Preferences.viewLevel,
        layoutAlgorithm: selectedLayout,
        filterOptions: {},
        semanticZoom: { enabled: true, currentScale: zoomLevel },
      });

      // Get upstream and downstream nodes
      const upstreamNodes = transformer.traceUpstream(node.id, fullGraphRef.current);
      const downstreamNodes = transformer.traceDownstream(node.id, fullGraphRef.current);
      const highlightedNodeIds = new Set([...upstreamNodes, ...downstreamNodes]);
      const highlightedEdgeIds = transformer.getHighlightedEdges(
        highlightedNodeIds,
        fullGraphRef.current
      );

      setC4PathTracing({
        mode: 'upstream',
        sourceId: node.id,
        targetId: undefined,
        highlightedNodeIds,
        highlightedEdgeIds,
      });
    },
    [
      c4Preferences.viewLevel,
      c4Preferences.selectedContainerId,
      handleViewLevelChange,
      setC4SelectedNodeId,
      setC4InspectorPanelVisible,
      setC4PathTracing,
      selectedLayout,
      zoomLevel,
    ]
  );

  /**
   * Handle trace upstream
   */
  const handleTraceUpstream = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;

      debugLog('[C4GraphView] Tracing upstream from:', nodeId);

      const transformer = new C4ViewTransformer({
        viewLevel: c4Preferences.viewLevel,
        layoutAlgorithm: selectedLayout,
        filterOptions: {},
        semanticZoom: { enabled: true, currentScale: zoomLevel },
      });

      const upstreamNodes = transformer.traceUpstream(nodeId, fullGraphRef.current);
      const highlightedEdgeIds = transformer.getHighlightedEdges(
        upstreamNodes,
        fullGraphRef.current
      );

      setC4PathTracing({
        mode: 'upstream',
        sourceId: nodeId,
        targetId: undefined,
        highlightedNodeIds: upstreamNodes,
        highlightedEdgeIds,
      });
    },
    [c4Preferences.viewLevel, selectedLayout, zoomLevel, setC4PathTracing]
  );

  /**
   * Handle trace downstream
   */
  const handleTraceDownstream = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;

      debugLog('[C4GraphView] Tracing downstream from:', nodeId);

      const transformer = new C4ViewTransformer({
        viewLevel: c4Preferences.viewLevel,
        layoutAlgorithm: selectedLayout,
        filterOptions: {},
        semanticZoom: { enabled: true, currentScale: zoomLevel },
      });

      const downstreamNodes = transformer.traceDownstream(nodeId, fullGraphRef.current);
      const highlightedEdgeIds = transformer.getHighlightedEdges(
        downstreamNodes,
        fullGraphRef.current
      );

      setC4PathTracing({
        mode: 'downstream',
        sourceId: nodeId,
        targetId: undefined,
        highlightedNodeIds: downstreamNodes,
        highlightedEdgeIds,
      });
    },
    [c4Preferences.viewLevel, selectedLayout, zoomLevel, setC4PathTracing]
  );

  /**
   * Handle clear path highlighting
   */
  const handleClearPathHighlighting = useCallback(() => {
    debugLog('[C4GraphView] Clearing path highlighting');
    setC4PathTracing({
      mode: 'none',
      sourceId: undefined,
      targetId: undefined,
      highlightedNodeIds: new Set(),
      highlightedEdgeIds: new Set(),
    });
  }, [setC4PathTracing]);

  /**
   * Handle close inspector panel
   */
  const handleCloseInspector = useCallback(() => {
    debugLog('[C4GraphView] Closing inspector panel');
    setC4InspectorPanelVisible(false);
    setC4SelectedNodeId(undefined);
  }, [setC4InspectorPanelVisible, setC4SelectedNodeId]);

  /**
   * Export handlers
   */
  const handleExportPNG = useCallback(async () => {
    try {
      debugLog('[C4GraphView] Exporting as PNG');
      const reactFlowContainer = document.querySelector('.c4-graph-viewer') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await exportC4AsPNG(reactFlowContainer, `c4-${c4Preferences.viewLevel}-diagram.png`);
      debugLog('[C4GraphView] PNG export successful');
    } catch (error) {
      console.error('[C4GraphView] PNG export failed:', error);
      alert('Failed to export PNG: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [c4Preferences.viewLevel]);

  const handleExportSVG = useCallback(async () => {
    try {
      debugLog('[C4GraphView] Exporting as SVG');
      const reactFlowContainer = document.querySelector('.c4-graph-viewer') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await exportC4AsSVG(reactFlowContainer, `c4-${c4Preferences.viewLevel}-diagram.svg`);
      debugLog('[C4GraphView] SVG export successful');
    } catch (error) {
      console.error('[C4GraphView] SVG export failed:', error);
      alert('Failed to export SVG: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [c4Preferences.viewLevel]);

  const handleExportGraphData = useCallback(() => {
    try {
      debugLog('[C4GraphView] Exporting graph data');
      if (!fullGraphRef.current) {
        throw new Error('No graph data available');
      }
      exportC4GraphAsJSON(nodes, edges, fullGraphRef.current, `c4-${c4Preferences.viewLevel}-data.json`);
      debugLog('[C4GraphView] Graph data export successful');
    } catch (error) {
      console.error('[C4GraphView] Graph data export failed:', error);
      alert('Failed to export graph data: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [nodes, edges, c4Preferences.viewLevel]);

  /**
   * Save manual positions when nodes are dragged
   */
  const onNodeDragStop = useCallback(
    (_event: any, _node: any) => {
      if (selectedLayout === 'manual') {
        const positions = new Map<string, { x: number; y: number }>();
        nodes.forEach((n) => {
          positions.set(n.id, { x: n.position.x, y: n.position.y });
        });
        setC4ManualPositions(positions);
        debugLog('[C4GraphView] Saved manual positions for', positions.size, 'nodes');
      }
    },
    [selectedLayout, nodes, setC4ManualPositions]
  );

  /**
   * Handle zoom changes for semantic zoom
   */
  const onMoveEnd = useCallback(
    (_event: any, viewport: { x: number; y: number; zoom: number }) => {
      setZoomLevel(viewport.zoom);
    },
    []
  );

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key - deselect current node
      if (event.key === 'Escape') {
        setC4SelectedNodeId(undefined);
        setC4InspectorPanelVisible(false);
        handleClearPathHighlighting();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setC4SelectedNodeId, setC4InspectorPanelVisible, handleClearPathHighlighting]);

  // Loading state
  if (loading) {
    return (
      <div className="message-overlay">
        <div className="message-box">
          <div className="spinner"></div>
          <p>Loading C4 architecture diagram...</p>
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
          <p>No C4 elements match the current filters</p>
          <button onClick={handleClearAllFilters} className="clear-filters-button">
            Clear All Filters
          </button>
        </div>
      </div>
    );
  }

  // Render ReactFlow with C4 nodes and edges
  return (
    <ErrorBoundary>
      <div className="c4-graph-container">
        {/* Filter Panel */}
        <div className="c4-sidebar left">
          <C4FilterPanel
            selectedContainerTypes={selectedContainerTypes}
            selectedTechnologyStacks={selectedTechnologyStacks}
            filterCounts={filterCounts}
            availableTechnologies={availableTechnologies}
            onContainerTypeChange={handleContainerTypeChange}
            onTechnologyChange={handleTechnologyChange}
            onClearAllFilters={handleClearAllFilters}
          />
        </div>

        {/* Main Graph View */}
        <div className="c4-main-content">
          {/* Breadcrumb Navigation */}
          <C4BreadcrumbNav
            breadcrumb={breadcrumb}
            currentViewLevel={c4Preferences.viewLevel}
            onNavigate={handleViewLevelChange}
          />

          {/* Graph Viewer */}
          <div className="c4-graph-viewer">
            {isLayouting && (
              <div className="layout-overlay" role="status" aria-live="polite">
                <div className="layout-progress">
                  <div className="spinner-small"></div>
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
              <MiniMap
                nodeColor={(node) => {
                  return node.data.stroke || '#6b7280';
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

        {/* Control Panel */}
        <div className="c4-sidebar right">
          <C4ControlPanel
            selectedLayout={selectedLayout}
            currentViewLevel={c4Preferences.viewLevel}
            onLayoutChange={handleLayoutChange}
            onViewLevelChange={handleViewLevelChange}
            onFitToView={handleFitToView}
            focusModeEnabled={c4Preferences.focusContextEnabled}
            onFocusModeToggle={handleFocusModeToggle}
            onClearHighlighting={handleClearPathHighlighting}
            isHighlightingActive={c4Preferences.pathTracing.mode !== 'none'}
            isLayouting={isLayouting}
            onExportPNG={handleExportPNG}
            onExportSVG={handleExportSVG}
            onExportGraphData={handleExportGraphData}
            hasSelectedContainer={!!c4Preferences.selectedContainerId}
            scenarioPreset={c4Preferences.scenarioPreset}
            onScenarioPresetChange={setC4ScenarioPreset}
            showOnlyChangeset={showOnlyChangeset}
            onChangesetFilterToggle={setShowOnlyChangeset}
            hasChangesetElements={hasChangesetElements}
          />
        </div>

        {/* Inspector Panel */}
        {c4Preferences.inspectorPanelVisible &&
          c4Preferences.selectedNodeId &&
          fullGraphRef.current && (
            <div className="c4-sidebar right inspector">
              <C4InspectorPanel
                selectedNodeId={c4Preferences.selectedNodeId}
                graph={fullGraphRef.current}
                onTraceUpstream={handleTraceUpstream}
                onTraceDownstream={handleTraceDownstream}
                onDrillDown={(nodeId) => {
                  const node = fullGraphRef.current?.nodes.get(nodeId);
                  if (node?.c4Type === C4Type.Container) {
                    handleViewLevelChange('container', nodeId);
                  }
                }}
                onClose={handleCloseInspector}
              />
            </div>
          )}
      </div>
    </ErrorBoundary>
  );
};

/**
 * Animate layout transitions using position interpolation
 * Target: 800ms smooth transition with < 300ms drill-down latency
 */
async function animateLayoutTransition(
  oldNodes: Node[],
  newNodes: Node[],
  setNodes: (nodes: Node[]) => void,
  setIsLayouting: (loading: boolean) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const duration = 300; // Faster for drill-down feel
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
          console.error('[C4GraphView] Animation frame error:', err);
          setIsLayouting(false);
          reject(err);
        }
      };

      // Start animation
      requestAnimationFrame(animate);
    } catch (err) {
      console.error('[C4GraphView] Animation setup error:', err);
      setIsLayouting(false);
      reject(err);
    }
  });
}

export default C4GraphView;
