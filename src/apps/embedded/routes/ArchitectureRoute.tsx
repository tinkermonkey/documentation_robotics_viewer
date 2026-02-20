/**
 * ArchitectureRoute Component
 * Renders the C4 architecture visualization view
 * Manages data loading and provides ReactFlowProvider context
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Alert } from 'flowbite-react';
import C4GraphView, { C4GraphViewRef } from '../components/C4GraphView';
import { LayerRightSidebar } from '../components/shared/LayerRightSidebar';
import { CrossLayerPanel } from '../components/CrossLayerPanel';
import AnnotationPanel from '../components/AnnotationPanel';
import { C4ControlPanel } from '../components/C4ControlPanel';
import { C4InspectorPanel } from '../components/C4InspectorPanel';
import SharedLayout from '../components/SharedLayout';
import { useModelStore } from '../../../core/stores/modelStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { useDataLoader } from '../hooks/useDataLoader';
import { LoadingState, ErrorState } from '../components/shared';
import { ExportButtonGroup } from '../components/shared/ExportButtonGroup';
import { C4Graph, ContainerType, C4ViewLevel } from '../types/c4Graph';
import { C4LayoutAlgorithm } from '../components/C4ControlPanel';
import { buildC4FilterSections } from '../utils/graphFilterUtils';
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
  const [exportError, setExportError] = useState<string | null>(null);

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

  // Create export service wrapper for ExportButtonGroup
  const c4ExportService = useMemo(
    () => ({
      exportAsPNG: (container: HTMLElement, filename: string) =>
        exportC4AsPNG(container, filename),
      exportAsSVG: (container: HTMLElement, filename: string) =>
        exportC4AsSVG(container, filename),
      exportAsJSON: (_data: unknown, filename: string) => {
        if (!fullGraphRef.current) {
          throw new Error('No graph data available');
        }
        const graphNodes = Array.from(fullGraphRef.current.nodes.values());
        const graphEdges = Array.from(fullGraphRef.current.edges.values());
        const reactFlowNodes = graphNodes.map((node) => ({
          id: node.id,
          type: node.c4Type,
          data: {
            label: node.name,
            c4Type: node.c4Type,
            description: node.description,
            technology: node.technology,
          },
        }));
        const reactFlowEdges = graphEdges.map((edge) => ({
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
          label: edge.description || '',
        }));
        exportC4GraphAsJSON(
          reactFlowNodes as any,
          reactFlowEdges as any,
          fullGraphRef.current,
          filename
        );
      },
    }),
    []
  );

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
    const allTechnologies = new Set<string>(fullGraphRef.current?.metadata.technologies ?? []);
    setSelectedContainerTypes(allContainerTypes);
    setSelectedTechnologyStacks(allTechnologies);
    setC4VisibleContainerTypes(allContainerTypes);
    setC4VisibleTechnologyStacks(allTechnologies);
  }, [setC4VisibleContainerTypes, setC4VisibleTechnologyStacks]);

  // Build data-driven filter sections from live graph data (after callbacks are declared)
  const filterSections = useMemo(() => {
    if (!fullGraphRef.current?.indexes) return [];
    return buildC4FilterSections(
      fullGraphRef.current,
      selectedContainerTypes,
      selectedTechnologyStacks,
      handleContainerTypeChange,
      handleTechnologyChange,
    );
  }, [graphVersion, selectedContainerTypes, selectedTechnologyStacks, handleContainerTypeChange, handleTechnologyChange]);

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

  const handleExportPNG = useCallback(async () => {
    try {
      const reactFlowContainer = document.querySelector('.c4-graph-viewer') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await c4ExportService.exportAsPNG(reactFlowContainer, `c4-${c4Preferences.viewLevel}-diagram.png`);
    } catch (error) {
      console.error('[ArchitectureRoute] PNG export failed:', error);
      setExportError('Failed to export PNG: ' + (error instanceof Error ? error.message : String(error)));
      setTimeout(() => setExportError(null), 5000);
    }
  }, [c4ExportService, c4Preferences.viewLevel]);

  const handleExportSVG = useCallback(async () => {
    try {
      const reactFlowContainer = document.querySelector('.c4-graph-viewer') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await c4ExportService.exportAsSVG(reactFlowContainer, `c4-${c4Preferences.viewLevel}-diagram.svg`);
    } catch (error) {
      console.error('[ArchitectureRoute] SVG export failed:', error);
      setExportError('Failed to export SVG: ' + (error instanceof Error ? error.message : String(error)));
      setTimeout(() => setExportError(null), 5000);
    }
  }, [c4ExportService, c4Preferences.viewLevel]);

  const handleExportGraphData = useCallback(() => {
    try {
      if (!c4ExportService.exportAsJSON) {
        throw new Error('JSON export not available');
      }
      c4ExportService.exportAsJSON(null, `c4-${c4Preferences.viewLevel}-data.json`);
    } catch (error) {
      console.error('[ArchitectureRoute] Graph data export failed:', error);
      setExportError('Failed to export graph data: ' + (error instanceof Error ? error.message : String(error)));
      setTimeout(() => setExportError(null), 5000);
    }
  }, [c4ExportService, c4Preferences.viewLevel]);

  if (!model) {
    return null;
  }

  return (
    <SharedLayout
      showLeftSidebar={false}
      showRightSidebar={true}
      rightSidebarContent={
        <LayerRightSidebar
          filterSections={filterSections}
          onClearFilters={handleClearAllFilters}
          controlContent={
            <C4ControlPanel
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
            />
          }
          inspectorContent={
            c4Preferences.inspectorPanelVisible &&
            c4Preferences.selectedNodeId &&
            fullGraphRef.current ? (
              <C4InspectorPanel
                selectedNodeId={c4Preferences.selectedNodeId}
                graph={fullGraphRef.current}
                onTraceUpstream={handleTraceUpstream}
                onTraceDownstream={handleTraceDownstream}
                onDrillDown={handleDrillDown}
                onClose={handleCloseInspector}
              />
            ) : undefined
          }
          annotationContent={<AnnotationPanel />}
          crossLayerContent={<CrossLayerPanel />}
          testId="c4-right-sidebar"
        />
      }
    >
      <div className="relative w-full h-full">
        {exportError && (
          <div className="fixed top-4 right-4 z-50 max-w-md">
            <Alert color="failure" onDismiss={() => setExportError(null)}>
              <span className="font-medium">Export failed:</span> {exportError}
            </Alert>
          </div>
        )}
        <div className="absolute top-4 right-4 z-10">
          <ExportButtonGroup
            service={c4ExportService}
            containerSelector=".c4-graph-viewer"
            filenamePrefix={`c4-${c4Preferences.viewLevel}`}
            data={{}}
            formats={['png', 'svg', 'json']}
            onExportError={(format, error) => {
              console.error(`[ArchitectureRoute] ${format} export error:`, error);
              setExportError(`Failed to export ${format.toUpperCase()}: ${error.message}`);
              // Auto-clear after 5 seconds
              setTimeout(() => setExportError(null), 5000);
            }}
          />
        </div>
        <C4GraphView
          ref={graphViewRef}
          model={model}
          selectedContainerTypes={selectedContainerTypes}
          selectedTechnologyStacks={selectedTechnologyStacks}
          layout={selectedLayout}
        />
      </div>
    </SharedLayout>
  );
}

export default function ArchitectureRoute() {
  const { setModel } = useModelStore();
  const annotationStore = useAnnotationStore();

  const { data: model, loading, error, reload } = useDataLoader({
    loadFn: async () => {
      debugLog('[ArchitectureRoute] Loading model data...');
      const modelData = await embeddedDataLoader.loadModel();
      debugLog('[ArchitectureRoute] Model loaded successfully');
      return modelData;
    },
    websocketEvents: ['model.updated', 'annotation.added'],
    onSuccess: async (modelData) => {
      setModel(modelData);
      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);
    },
  });

  if (loading) {
    return <LoadingState variant="page" message="Loading architecture view..." />;
  }

  if (error) {
    return <ErrorState variant="page" message={error} onRetry={reload} />;
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
