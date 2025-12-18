/**
 * ArchitectureRoute Component
 * Renders the C4 architecture visualization view
 * Manages data loading and provides ReactFlowProvider context
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import C4GraphView, { C4GraphViewRef } from '../components/C4GraphView';
import { C4RightSidebar } from '../components/C4RightSidebar';
import SharedLayout from '../components/SharedLayout';
import { useModelStore } from '../../../core/stores/modelStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { websocketClient } from '../services/websocketClient';
import { C4Graph, ContainerType, C4ViewLevel } from '../types/c4Graph';
import { C4LayoutAlgorithm } from '../components/C4ControlPanel';
import { C4GraphBuilder } from '../services/c4Parser';
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

function ArchitectureRouteContent() {
  const { model } = useModelStore();
  const {
    c4Preferences,
    setC4VisibleContainerTypes,
    setC4VisibleTechnologyStacks,
    setC4Layout,
    setC4ViewLevel,
    setC4SelectedContainer,
    setC4SelectedComponent,
    setC4FocusContextEnabled,
    setC4ScenarioPreset,
  } = useViewPreferenceStore();

  // Panel state (extracted from C4GraphView)
  const [selectedContainerTypes, setSelectedContainerTypes] = useState<Set<ContainerType>>(
    c4Preferences.visibleContainerTypes
  );
  const [selectedTechnologyStacks, setSelectedTechnologyStacks] = useState<Set<string>>(
    c4Preferences.visibleTechnologyStacks
  );
  const [selectedLayout, setSelectedLayout] = useState<C4LayoutAlgorithm>(
    c4Preferences.selectedLayout
  );

  // Store reference to the full C4 graph
  const fullGraphRef = useRef<C4Graph | null>(null);

  // Track graph version to trigger useMemo recalculation
  const [graphVersion, setGraphVersion] = useState(0);

  // Ref to C4GraphView for calling fitView
  const graphViewRef = useRef<C4GraphViewRef>(null);

  // Create graph builder service
  const c4GraphBuilder = useMemo(() => new C4GraphBuilder(), []);

  // Build the full C4 graph
  useEffect(() => {
    if (model) {
      const graph = c4GraphBuilder.build(model);
      fullGraphRef.current = graph;
      setGraphVersion((v) => v + 1); // Trigger useMemo recalculation
    }
  }, [model, c4GraphBuilder]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    if (!fullGraphRef.current) {
      const emptyContainerCounts: Record<ContainerType, { visible: number; total: number }> = Object.values(ContainerType).reduce(
        (acc, type) => {
          acc[type as ContainerType] = { visible: 0, total: 0 };
          return acc;
        },
        {} as Record<ContainerType, { visible: number; total: number }>
      );

      return {
        containerTypes: emptyContainerCounts,
        technologies: {},
      };
    }

    const graph = fullGraphRef.current;

    // Count by container type
    const containerTypeCounts: Record<ContainerType, { visible: number; total: number }> = Object.values(ContainerType).reduce(
      (acc, type) => {
        acc[type as ContainerType] = { visible: 0, total: 0 };
        return acc;
      },
      {} as Record<ContainerType, { visible: number; total: number }>
    );
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
  }, [graphVersion, selectedContainerTypes, selectedTechnologyStacks]);

  // Get available technologies from graph
  const availableTechnologies = useMemo((): string[] => {
    if (!fullGraphRef.current) return [];
    return fullGraphRef.current.metadata.technologies;
  }, [graphVersion]);

  // Callback handlers
  const handleContainerTypeChange = useCallback(
    (containerType: ContainerType, selected: boolean) => {
      const newTypes = new Set(selectedContainerTypes);
      if (selected) {
        newTypes.add(containerType);
      } else {
        newTypes.delete(containerType);
      }
      setSelectedContainerTypes(newTypes);
      setC4VisibleContainerTypes(newTypes);
    },
    [selectedContainerTypes, setC4VisibleContainerTypes]
  );

  const handleTechnologyChange = useCallback(
    (technology: string, selected: boolean) => {
      const newStacks = new Set(selectedTechnologyStacks);
      if (selected) {
        newStacks.add(technology);
      } else {
        newStacks.delete(technology);
      }
      setSelectedTechnologyStacks(newStacks);
      setC4VisibleTechnologyStacks(newStacks);
    },
    [selectedTechnologyStacks, setC4VisibleTechnologyStacks]
  );

  const handleClearAllFilters = useCallback(() => {
    const allContainerTypes = new Set(Object.values(ContainerType));
    const allTechnologies = new Set(availableTechnologies);
    setSelectedContainerTypes(allContainerTypes);
    setSelectedTechnologyStacks(allTechnologies);
    setC4VisibleContainerTypes(allContainerTypes);
    setC4VisibleTechnologyStacks(allTechnologies);
  }, [availableTechnologies, setC4VisibleContainerTypes, setC4VisibleTechnologyStacks]);

  const handleLayoutChange = useCallback(
    (layout: C4LayoutAlgorithm) => {
      setSelectedLayout(layout);
      setC4Layout(layout);
    },
    [setC4Layout]
  );

  const handleViewLevelChange = useCallback(
    (level: C4ViewLevel, containerId?: string, componentId?: string) => {
      setC4ViewLevel(level);
      setC4SelectedContainer(containerId);
      setC4SelectedComponent(componentId);
    },
    [setC4ViewLevel, setC4SelectedContainer, setC4SelectedComponent]
  );

  const handleFitToView = useCallback(() => {
    graphViewRef.current?.fitView();
  }, []);

  const handleFocusModeToggle = useCallback(
    (enabled: boolean) => {
      setC4FocusContextEnabled(enabled);
    },
    [setC4FocusContextEnabled]
  );

  const handleClearHighlighting = useCallback(() => {
    useViewPreferenceStore.getState().setC4PathTracing({
      mode: 'none',
      sourceId: undefined,
      targetId: undefined,
      highlightedNodeIds: new Set(),
      highlightedEdgeIds: new Set(),
    });
  }, []);

  const handleTraceUpstream = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;

      debugLog('[ArchitectureRoute] Tracing upstream from:', nodeId);

      // Note: C4ViewTransformer tracing logic would be used here
      // For now, just set the node as selected
      useViewPreferenceStore.getState().setC4SelectedNodeId(nodeId);
    },
    []
  );

  const handleTraceDownstream = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;

      debugLog('[ArchitectureRoute] Tracing downstream from:', nodeId);

      // Note: C4ViewTransformer tracing logic would be used here
      // For now, just set the node as selected
      useViewPreferenceStore.getState().setC4SelectedNodeId(nodeId);
    },
    []
  );

  const handleDrillDown = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;

      const node = fullGraphRef.current.nodes.get(nodeId);
      if (node) {
        debugLog('[ArchitectureRoute] Drilling down to:', nodeId);
        handleViewLevelChange('container', nodeId);
      }
    },
    [handleViewLevelChange]
  );

  const handleCloseInspector = useCallback(() => {
    debugLog('[ArchitectureRoute] Closing inspector panel');
    useViewPreferenceStore.getState().setC4InspectorPanelVisible(false);
    useViewPreferenceStore.getState().setC4SelectedNodeId(undefined);
  }, []);

  // Export handlers
  const handleExportPNG = useCallback(async () => {
    try {
      const reactFlowContainer = document.querySelector('.c4-graph-viewer') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await exportC4AsPNG(reactFlowContainer, `c4-${c4Preferences.viewLevel}-diagram.png`);
    } catch (error) {
      console.error('[ArchitectureRoute] PNG export failed:', error);
      alert('Failed to export PNG: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [c4Preferences.viewLevel]);

  const handleExportSVG = useCallback(async () => {
    try {
      const reactFlowContainer = document.querySelector('.c4-graph-viewer') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await exportC4AsSVG(reactFlowContainer, `c4-${c4Preferences.viewLevel}-diagram.svg`);
    } catch (error) {
      console.error('[ArchitectureRoute] SVG export failed:', error);
      alert('Failed to export SVG: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [c4Preferences.viewLevel]);

  const handleExportGraphData = useCallback(() => {
    try {
      if (!fullGraphRef.current) {
        throw new Error('No graph data available');
      }
      // Export the C4 graph structure
      const graphNodes = Array.from(fullGraphRef.current.nodes.values());
      const graphEdges = Array.from(fullGraphRef.current.edges.values());

      // Convert C4 nodes/edges to ReactFlow format for export
      const reactFlowNodes: any[] = graphNodes.map(node => ({
        id: node.id,
        type: node.c4Type,
        data: {
          label: node.name,
          c4Type: node.c4Type,
          description: node.description,
          technology: node.technology,
        },
      }));

      const reactFlowEdges: any[] = graphEdges.map(edge => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.description || '',
      }));

      exportC4GraphAsJSON(reactFlowNodes, reactFlowEdges, fullGraphRef.current, `c4-${c4Preferences.viewLevel}-data.json`);
    } catch (error) {
      console.error('[ArchitectureRoute] Graph data export failed:', error);
      alert('Failed to export graph data: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [c4Preferences.viewLevel]);

  if (!model) {
    return null;
  }

  return (
    <SharedLayout
      showLeftSidebar={false}
      showRightSidebar={true}
      rightSidebarContent={
        <C4RightSidebar
          selectedContainerTypes={selectedContainerTypes}
          onContainerTypeChange={handleContainerTypeChange}
          selectedTechnologyStacks={selectedTechnologyStacks}
          onTechnologyChange={handleTechnologyChange}
          onClearAllFilters={handleClearAllFilters}
          filterCounts={filterCounts}
          availableTechnologies={availableTechnologies}
          selectedLayout={selectedLayout}
          currentViewLevel={c4Preferences.viewLevel}
          onLayoutChange={handleLayoutChange}
          onViewLevelChange={handleViewLevelChange}
          onFitToView={handleFitToView}
          focusModeEnabled={c4Preferences.focusContextEnabled}
          onFocusModeToggle={handleFocusModeToggle}
          onClearHighlighting={handleClearHighlighting}
          isHighlightingActive={c4Preferences.pathTracing.mode !== 'none'}
          isLayouting={false}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportGraphData={handleExportGraphData}
          hasSelectedContainer={!!c4Preferences.selectedContainerId}
          scenarioPreset={c4Preferences.scenarioPreset}
          onScenarioPresetChange={setC4ScenarioPreset}
          selectedNodeId={c4Preferences.selectedNodeId}
          graph={fullGraphRef.current || undefined}
          inspectorPanelVisible={c4Preferences.inspectorPanelVisible}
          onTraceUpstream={handleTraceUpstream}
          onTraceDownstream={handleTraceDownstream}
          onDrillDown={handleDrillDown}
          onCloseInspector={handleCloseInspector}
        />
      }
    >
      <C4GraphView
        ref={graphViewRef}
        model={model}
        selectedContainerTypes={selectedContainerTypes}
        selectedTechnologyStacks={selectedTechnologyStacks}
        layout={selectedLayout}
      />
    </SharedLayout>
  );
}

export default function ArchitectureRoute() {
  const { model, loading, error, setModel, setLoading, setError } = useModelStore();
  const annotationStore = useAnnotationStore();

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      debugLog('[ArchitectureRoute] Loading model data...');

      const modelData = await embeddedDataLoader.loadModel();
      setModel(modelData);

      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);

      debugLog('[ArchitectureRoute] Model loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
      setError(errorMessage);
      console.error('[ArchitectureRoute] Error loading model:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleModelUpdated = async () => {
      await loadData();
    };

    const handleAnnotationAdded = async () => {
      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);
    };

    websocketClient.on('model.updated', handleModelUpdated);
    websocketClient.on('annotation.added', handleAnnotationAdded);

    return () => {
      websocketClient.off('model.updated', handleModelUpdated);
      websocketClient.off('annotation.added', handleAnnotationAdded);
    };
  }, [setModel, setLoading, setError, annotationStore.setAnnotations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-lg border p-6 text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700">Loading architecture view...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-lg border p-8 text-center max-w-md">
          <h2 className="text-2xl font-medium mb-4">Documentation Robotics Viewer</h2>
          <p className="text-gray-600 mb-2">Viewing C4 architecture model</p>
          <p className="text-gray-500">Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <ArchitectureRouteContent />
    </ReactFlowProvider>
  );
}
