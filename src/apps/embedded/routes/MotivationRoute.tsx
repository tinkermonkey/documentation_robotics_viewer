import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Alert } from 'flowbite-react';
import MotivationGraphView, { MotivationGraphViewRef } from '../components/MotivationGraphView';
import { MotivationRightSidebar } from '../components/MotivationRightSidebar';
import SharedLayout from '../components/SharedLayout';
import { useModelStore } from '../../../core/stores/modelStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { useDataLoader } from '../hooks/useDataLoader';
import { LoadingState, ErrorState } from '../components/shared';
import { ExportButtonGroup } from '../components/shared/ExportButtonGroup';
import { MotivationElementType, MotivationRelationshipType, MotivationGraph } from '../types/motivationGraph';
import { LayoutAlgorithm } from '../components/MotivationControlPanel';
import { MotivationGraphBuilder } from '../services/motivationGraphBuilder';
import {
  exportAsPNG,
  exportAsSVG,
  exportTraceabilityReport,
  exportGraphDataAsJSON,
} from '../services/motivationExportService';

function MotivationRouteContent() {
  const { model } = useModelStore();
  const {
    motivationPreferences,
    setVisibleElementTypes,
    setVisibleRelationshipTypes,
    setFocusContextEnabled,
  } = useViewPreferenceStore();

  // Panel state (extracted from MotivationGraphView)
  const [selectedElementTypes, setSelectedElementTypes] = useState<Set<MotivationElementType>>(
    motivationPreferences.visibleElementTypes
  );
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<Set<MotivationRelationshipType>>(
    motivationPreferences.visibleRelationshipTypes
  );
  const [selectedLayout, setSelectedLayout] = useState<LayoutAlgorithm>(
    motivationPreferences.selectedLayout
  );
  const [exportError, setExportError] = useState<string | null>(null);

  // Store reference to the full graph for inspector and export
  const fullGraphRef = useRef<MotivationGraph | null>(null);

  // Track graph version to trigger useMemo recalculation
  const [graphVersion, setGraphVersion] = useState(0);

  // Ref to MotivationGraphView for calling fitView
  const graphViewRef = useRef<MotivationGraphViewRef>(null);

  // Create graph builder service
  const motivationGraphBuilder = useMemo(() => new MotivationGraphBuilder(), []);

  // Build the full motivation graph
  useEffect(() => {
    if (model) {
      const graph = motivationGraphBuilder.build(model);
      fullGraphRef.current = graph;
      setGraphVersion((v) => v + 1); // Trigger useMemo recalculation
    }
  }, [model, motivationGraphBuilder]);

  // Create export service wrapper for ExportButtonGroup
  const motivationExportService = useMemo(
    () => ({
      exportAsPNG: (container: HTMLElement, filename: string) =>
        exportAsPNG(container, filename),
      exportAsSVG: (container: HTMLElement, filename: string) =>
        exportAsSVG(container, filename),
      exportAsJSON: (_data: unknown, filename: string) => {
        if (!fullGraphRef.current) {
          throw new Error('No graph data available');
        }
        // Validate that nodes and edges are valid Maps before processing
        if (!fullGraphRef.current.nodes || !fullGraphRef.current.edges) {
          throw new Error('Graph data is incomplete - missing nodes or edges');
        }
        const nodes = Array.from(fullGraphRef.current.nodes.values()).map(
          (n) => ({
            id: n.element.id,
            type: n.element.type,
            data: n.element,
          })
        );
        const edges = Array.from(fullGraphRef.current.edges.values()).map(
          (e) => ({
            id: e.id,
            source: e.sourceId,
            target: e.targetId,
            type: e.type,
            label: (e.relationship.properties?.description as string) || '',
          })
        );
        exportGraphDataAsJSON(nodes as any, edges as any, fullGraphRef.current, filename);
      },
    }),
    []
  );

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    if (!fullGraphRef.current) {
      return {
        elements: {} as Record<MotivationElementType, { visible: number; total: number }>,
        relationships: {} as Record<MotivationRelationshipType, { visible: number; total: number }>,
      };
    }

    const graph = fullGraphRef.current;

    // Validate graph structure
    if (!graph.nodes || !graph.edges) {
      return {
        elements: {} as Record<MotivationElementType, { visible: number; total: number }>,
        relationships: {} as Record<MotivationRelationshipType, { visible: number; total: number }>,
      };
    }

    // Count elements by type
    const elementCounts: Record<MotivationElementType, { visible: number; total: number }> = {} as Record<MotivationElementType, { visible: number; total: number }>;
    for (const elementType of Object.values(MotivationElementType)) {
      const total = Array.from(graph.nodes.values()).filter(
        (n) => n.element.type === elementType
      ).length;
      const visible = selectedElementTypes.has(elementType) ? total : 0;
      elementCounts[elementType] = { visible, total };
    }

    // Count relationships by type
    const relationshipCounts: Record<
      MotivationRelationshipType,
      { visible: number; total: number }
    > = {} as Record<MotivationRelationshipType, { visible: number; total: number }>;
    for (const relationshipType of Object.values(MotivationRelationshipType)) {
      const total = Array.from(graph.edges.values()).filter((e) => e.type === relationshipType).length;
      const visible = selectedRelationshipTypes.has(relationshipType) ? total : 0;
      relationshipCounts[relationshipType] = { visible, total };
    }

    return {
      elements: elementCounts,
      relationships: relationshipCounts,
    };
  }, [graphVersion, selectedElementTypes, selectedRelationshipTypes]);

  // Callback handlers
  const handleElementTypeChange = useCallback(
    (elementType: MotivationElementType, selected: boolean) => {
      const newTypes = new Set(selectedElementTypes);
      if (selected) {
        newTypes.add(elementType);
      } else {
        newTypes.delete(elementType);
      }
      setSelectedElementTypes(newTypes);
      setVisibleElementTypes(newTypes);
    },
    [selectedElementTypes, setVisibleElementTypes]
  );

  const handleRelationshipTypeChange = useCallback(
    (relationshipType: MotivationRelationshipType, selected: boolean) => {
      const newTypes = new Set(selectedRelationshipTypes);
      if (selected) {
        newTypes.add(relationshipType);
      } else {
        newTypes.delete(relationshipType);
      }
      setSelectedRelationshipTypes(newTypes);
      setVisibleRelationshipTypes(newTypes);
    },
    [selectedRelationshipTypes, setVisibleRelationshipTypes]
  );

  const handleClearAllFilters = useCallback(() => {
    const allElementTypes = new Set(Object.values(MotivationElementType));
    const allRelationshipTypes = new Set(Object.values(MotivationRelationshipType));
    setSelectedElementTypes(allElementTypes);
    setSelectedRelationshipTypes(allRelationshipTypes);
    setVisibleElementTypes(allElementTypes);
    setVisibleRelationshipTypes(allRelationshipTypes);
  }, [setVisibleElementTypes, setVisibleRelationshipTypes]);

  const handleFitToView = useCallback(() => {
    graphViewRef.current?.fitView();
  }, []);

  const handleClearHighlighting = useCallback(() => {
    useViewPreferenceStore.getState().setPathTracing({
      mode: 'none',
      selectedNodeIds: [],
      highlightedNodeIds: new Set(),
      highlightedEdgeIds: new Set(),
    });
  }, []);

  const handleTraceUpstream = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;
      const result = motivationGraphBuilder.traceUpstreamInfluences(
        nodeId,
        fullGraphRef.current,
        10
      );
      useViewPreferenceStore.getState().setPathTracing({
        mode: 'upstream',
        selectedNodeIds: [nodeId],
        highlightedNodeIds: result.nodeIds,
        highlightedEdgeIds: result.edgeIds,
      });
    },
    [motivationGraphBuilder]
  );

  const handleTraceDownstream = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;
      const result = motivationGraphBuilder.traceDownstreamImpacts(
        nodeId,
        fullGraphRef.current,
        10
      );
      useViewPreferenceStore.getState().setPathTracing({
        mode: 'downstream',
        selectedNodeIds: [nodeId],
        highlightedNodeIds: result.nodeIds,
        highlightedEdgeIds: result.edgeIds,
      });
    },
    [motivationGraphBuilder]
  );

  const handleShowNetwork = useCallback(
    (nodeId: string) => {
      useViewPreferenceStore.getState().setCenterNodeId(nodeId);
      setSelectedLayout('radial');
    },
    []
  );

  const handleFocusOnElement = useCallback(
    (nodeId: string) => {
      if (!fullGraphRef.current) return;
      const directRelationships = motivationGraphBuilder.getDirectRelationships(
        nodeId,
        fullGraphRef.current
      );

      const highlightedEdgeIds = new Set(directRelationships.map((r) => r.id));
      const highlightedNodeIds = new Set<string>();

      highlightedNodeIds.add(nodeId);
      directRelationships.forEach((rel) => {
        highlightedNodeIds.add(rel.sourceId);
        highlightedNodeIds.add(rel.targetId);
      });

      useViewPreferenceStore.getState().setPathTracing({
        mode: 'direct',
        selectedNodeIds: [nodeId],
        highlightedNodeIds,
        highlightedEdgeIds,
      });
      setFocusContextEnabled(true);
    },
    [motivationGraphBuilder, setFocusContextEnabled]
  );

  const handleCloseInspector = useCallback(() => {
    useViewPreferenceStore.getState().setInspectorPanelVisible(false);
    useViewPreferenceStore.getState().setSelectedNodeId(undefined);
  }, []);

  const handleExportPNG = useCallback(async () => {
    try {
      const reactFlowContainer = document.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await motivationExportService.exportAsPNG(reactFlowContainer, 'motivation-graph.png');
    } catch (error) {
      console.error('[MotivationRoute] PNG export failed:', error);
      setExportError('Failed to export PNG: ' + (error instanceof Error ? error.message : String(error)));
      setTimeout(() => setExportError(null), 5000);
    }
  }, [motivationExportService]);

  const handleExportSVG = useCallback(async () => {
    try {
      const reactFlowContainer = document.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await motivationExportService.exportAsSVG(reactFlowContainer, 'motivation-graph.svg');
    } catch (error) {
      console.error('[MotivationRoute] SVG export failed:', error);
      setExportError('Failed to export SVG: ' + (error instanceof Error ? error.message : String(error)));
      setTimeout(() => setExportError(null), 5000);
    }
  }, [motivationExportService]);

  const handleExportGraphData = useCallback(() => {
    try {
      if (!motivationExportService.exportAsJSON) {
        throw new Error('JSON export not available');
      }
      motivationExportService.exportAsJSON(null, 'motivation-graph-data.json');
    } catch (error) {
      console.error('[MotivationRoute] Graph data export failed:', error);
      setExportError('Failed to export graph data: ' + (error instanceof Error ? error.message : String(error)));
      setTimeout(() => setExportError(null), 5000);
    }
  }, [motivationExportService]);

  const handleExportTraceabilityReport = useCallback(() => {
    try {
      if (!fullGraphRef.current) {
        throw new Error('No graph data available');
      }
      exportTraceabilityReport(fullGraphRef.current, 'traceability-report.json');
    } catch (error) {
      console.error('[MotivationRoute] Traceability report export failed:', error);
      setExportError('Failed to export traceability report: ' + (error instanceof Error ? error.message : String(error)));
      setTimeout(() => setExportError(null), 5000);
    }
  }, []);

  if (!model) {
    return null;
  }

  return (
    <SharedLayout
      showLeftSidebar={false}
      showRightSidebar={true}
      rightSidebarContent={
        <MotivationRightSidebar
          selectedElementTypes={selectedElementTypes}
          onElementTypesChange={handleElementTypeChange}
          selectedRelationshipTypes={selectedRelationshipTypes}
          onRelationshipTypesChange={handleRelationshipTypeChange}
          onClearAllFilters={handleClearAllFilters}
          filterCounts={filterCounts}
          selectedLayout={selectedLayout}
          onLayoutChange={setSelectedLayout}
          onFitToView={handleFitToView}
          focusModeEnabled={motivationPreferences.focusContextEnabled}
          onFocusModeToggle={setFocusContextEnabled}
          onClearHighlighting={handleClearHighlighting}
          isHighlightingActive={motivationPreferences.pathTracing.mode !== 'none'}
          isLayouting={false}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportGraphData={handleExportGraphData}
          onExportTraceabilityReport={handleExportTraceabilityReport}
          selectedNodeId={motivationPreferences.selectedNodeId}
          graph={fullGraphRef.current || undefined}
          onTraceUpstream={handleTraceUpstream}
          onTraceDownstream={handleTraceDownstream}
          onShowNetwork={handleShowNetwork}
          onFocusOnElement={handleFocusOnElement}
          onCloseInspector={handleCloseInspector}
          inspectorPanelVisible={motivationPreferences.inspectorPanelVisible}
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
            service={motivationExportService}
            containerSelector=".react-flow"
            filenamePrefix="motivation-graph"
            data={{}}
            formats={['png', 'svg', 'json']}
            onExportError={(format, error) => {
              console.error(`[MotivationRoute] ${format} export error:`, error);
              setExportError(`Failed to export ${format.toUpperCase()}: ${error.message}`);
              // Auto-clear after 5 seconds
              setTimeout(() => setExportError(null), 5000);
            }}
          />
        </div>
        <MotivationGraphView
          ref={graphViewRef}
          model={model}
          selectedElementTypes={selectedElementTypes}
          selectedRelationshipTypes={selectedRelationshipTypes}
          layout={selectedLayout}
        />
      </div>
    </SharedLayout>
  );
}

export default function MotivationRoute() {
  const { setModel } = useModelStore();
  const annotationStore = useAnnotationStore();

  const { data: model, loading, error, reload } = useDataLoader({
    loadFn: async () => {
      console.log('[MotivationRoute] Loading model data...');
      const modelData = await embeddedDataLoader.loadModel();
      console.log('[MotivationRoute] Model loaded successfully');
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
    return <LoadingState variant="page" message="Loading motivation view..." />;
  }

  if (error) {
    return <ErrorState variant="page" message={error} onRetry={reload} />;
  }

  if (!model) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-lg border p-8 text-center max-w-md">
          <h2 className="text-2xl font-medium mb-4">Documentation Robotics Viewer</h2>
          <p className="text-gray-600 mb-2">Viewing motivation model</p>
          <p className="text-gray-500">Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <MotivationRouteContent />
    </ReactFlowProvider>
  );
}
