import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import MotivationGraphView from '../components/MotivationGraphView';
import { MotivationRightSidebar } from '../components/MotivationRightSidebar';
import SharedLayout from '../components/SharedLayout';
import { useModelStore } from '../../../core/stores/modelStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { websocketClient } from '../services/websocketClient';
import { MotivationElementType, MotivationRelationshipType, MotivationGraph } from '../types/motivationGraph';
import { LayoutAlgorithm } from '../components/MotivationControlPanel';
import { MotivationGraphBuilder } from '../services/motivationGraphBuilder';
import {
  exportAsPNG,
  exportAsSVG,
  exportTraceabilityReport,
} from '../services/motivationExportService';

function MotivationRouteContent() {
  const { model } = useModelStore();
  const {
    motivationPreferences,
    setVisibleElementTypes,
    setVisibleRelationshipTypes,
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
  const [focusModeEnabled, setFocusModeEnabled] = useState(
    motivationPreferences.focusContextEnabled
  );

  // Store reference to the full graph for inspector and export
  const fullGraphRef = useRef<MotivationGraph | null>(null);

  // Create graph builder service
  const motivationGraphBuilder = useMemo(() => new MotivationGraphBuilder(), []);

  // Build the full motivation graph
  useEffect(() => {
    if (model) {
      const graph = motivationGraphBuilder.build(model);
      fullGraphRef.current = graph;
    }
  }, [model, motivationGraphBuilder]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    if (!fullGraphRef.current) {
      return {
        elements: {} as any,
        relationships: {} as any,
      };
    }

    const graph = fullGraphRef.current;

    // Count elements by type
    const elementCounts: Record<MotivationElementType, { visible: number; total: number }> = {} as any;
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
    > = {} as any;
    for (const relationshipType of Object.values(MotivationRelationshipType)) {
      const total = Array.from(graph.edges.values()).filter((e) => e.type === relationshipType).length;
      const visible = selectedRelationshipTypes.has(relationshipType) ? total : 0;
      relationshipCounts[relationshipType] = { visible, total };
    }

    return {
      elements: elementCounts,
      relationships: relationshipCounts,
    };
  }, [fullGraphRef.current, selectedElementTypes, selectedRelationshipTypes]);

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
    // This will be handled by MotivationGraphView's internal fitView
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
      setFocusModeEnabled(true);
    },
    [motivationGraphBuilder]
  );

  const handleCloseInspector = useCallback(() => {
    useViewPreferenceStore.getState().setInspectorPanelVisible(false);
    useViewPreferenceStore.getState().setSelectedNodeId(undefined);
  }, []);

  // Export handlers
  const handleExportPNG = useCallback(async () => {
    try {
      const reactFlowContainer = document.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await exportAsPNG(reactFlowContainer, 'motivation-graph.png');
    } catch (error) {
      console.error('[MotivationRoute] PNG export failed:', error);
      alert('Failed to export PNG: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, []);

  const handleExportSVG = useCallback(async () => {
    try {
      const reactFlowContainer = document.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowContainer) {
        throw new Error('Graph container not found');
      }
      await exportAsSVG(reactFlowContainer, 'motivation-graph.svg');
    } catch (error) {
      console.error('[MotivationRoute] SVG export failed:', error);
      alert('Failed to export SVG: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, []);

  const handleExportGraphData = useCallback(() => {
    try {
      if (!fullGraphRef.current) {
        throw new Error('No graph data available');
      }
      // Note: nodes and edges would need to be passed from MotivationGraphView
      // For now, we'll export just the graph structure
      const graphData = {
        nodes: Array.from(fullGraphRef.current.nodes.values()),
        edges: Array.from(fullGraphRef.current.edges.values()),
      };
      const dataStr = JSON.stringify(graphData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', 'motivation-graph-data.json');
      link.click();
    } catch (error) {
      console.error('[MotivationRoute] Graph data export failed:', error);
      alert('Failed to export graph data: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, []);

  const handleExportTraceabilityReport = useCallback(() => {
    try {
      if (!fullGraphRef.current) {
        throw new Error('No graph data available');
      }
      exportTraceabilityReport(fullGraphRef.current, 'traceability-report.json');
    } catch (error) {
      console.error('[MotivationRoute] Traceability report export failed:', error);
      alert('Failed to export traceability report: ' + (error instanceof Error ? error.message : String(error)));
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
          focusModeEnabled={focusModeEnabled}
          onFocusModeToggle={setFocusModeEnabled}
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
      <MotivationGraphView
        model={model}
        selectedElementTypes={selectedElementTypes}
        onElementTypesChange={setSelectedElementTypes}
        selectedRelationshipTypes={selectedRelationshipTypes}
        onRelationshipTypesChange={setSelectedRelationshipTypes}
        layout={selectedLayout}
        onLayoutChange={setSelectedLayout}
        focusModeEnabled={focusModeEnabled}
        onFocusModeChange={setFocusModeEnabled}
      />
    </SharedLayout>
  );
}

export default function MotivationRoute() {
  const { model, loading, error, setModel, setLoading, setError } = useModelStore();
  const annotationStore = useAnnotationStore();

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[MotivationRoute] Loading model data...');

      const modelData = await embeddedDataLoader.loadModel();
      setModel(modelData);
      
      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);

      console.log('[MotivationRoute] Model loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
      setError(errorMessage);
      console.error('[MotivationRoute] Error loading model:', err);
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
          <p className="text-gray-700">Loading motivation view...</p>
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
