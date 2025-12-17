import { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import type { Node } from '@xyflow/react';
import GraphViewer from '../../../core/components/GraphViewer';
import ModelJSONViewer from '../components/ModelJSONViewer';
import AnnotationPanel from '../components/AnnotationPanel';
import SchemaInfoPanel from '../components/SchemaInfoPanel';
import ModelLayersSidebar from '../components/ModelLayersSidebar';
import LayerTypesLegend from '../components/LayerTypesLegend';
import NodeDetailsPanel from '../components/NodeDetailsPanel';
import GraphStatisticsPanel from '../components/GraphStatisticsPanel';
import HighlightedPathPanel from '../components/HighlightedPathPanel';
import SharedLayout from '../components/SharedLayout';
import { useModelStore } from '../../../core/stores/modelStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { embeddedDataLoader, LinkRegistry, SpecDataResponse } from '../services/embeddedDataLoader';
import { websocketClient } from '../services/websocketClient';

export default function ModelRoute() {
  const { view } = useParams({ strict: false });
  const { model, loading, error, setModel, setLoading, setError } = useModelStore();
  const annotationStore = useAnnotationStore();
  const [linkRegistry, setLinkRegistry] = useState<LinkRegistry | null>(null);
  const [specData, setSpecData] = useState<SpecDataResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const activeView = view === 'json' ? 'json' : 'graph';

  // Handle node click in graph view
  const handleNodeClick = (node: Node | null) => {
    setSelectedNode(node);
  };

  // Handle path highlight in JSON view (auto-clear after 3 seconds)
  const handlePathHighlight = (path: string | null) => {
    setHighlightedPath(path);
    if (path) {
      setTimeout(() => setHighlightedPath(null), 3000);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[ModelRoute] Loading model data...');

      const modelData = await embeddedDataLoader.loadModel();
      setModel(modelData);

      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);

      // Load link registry
      try {
        const registry = await embeddedDataLoader.loadLinkRegistry();
        setLinkRegistry(registry);
        console.log('[ModelRoute] Link registry loaded:', registry.linkTypes.length, 'link types');
      } catch (err) {
        console.warn('[ModelRoute] Failed to load link registry:', err);
      }

      // Load spec data for schema definitions
      try {
        const spec = await embeddedDataLoader.loadSpec();
        setSpecData(spec);
        console.log('[ModelRoute] Spec data loaded:', Object.keys(spec.schemas || {}).length, 'schemas');
      } catch (err) {
        console.warn('[ModelRoute] Failed to load spec data:', err);
      }

      console.log('[ModelRoute] Model loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
      setError(errorMessage);
      console.error('[ModelRoute] Error loading model:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleModelUpdated = async () => {
      console.log('[ModelRoute] Model updated event received');
      await loadData();
    };

    const handleAnnotationAdded = async () => {
      console.log('[ModelRoute] Annotation added event received');
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
          <p className="text-gray-700">Loading model...</p>
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
          <p className="text-gray-600 mb-2">Viewing current model</p>
          <p className="text-gray-500">Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <SharedLayout
      showLeftSidebar={true}
      showRightSidebar={true}
      leftSidebarContent={
        <ModelLayersSidebar
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
        />
      }
      rightSidebarContent={
        activeView === 'graph' ? (
          <>
            <AnnotationPanel />
            <LayerTypesLegend model={model} />
            <NodeDetailsPanel selectedNode={selectedNode} model={model} />
            <GraphStatisticsPanel model={model} />
          </>
        ) : (
          <>
            <AnnotationPanel />
            <HighlightedPathPanel highlightedPath={highlightedPath} />
            <SchemaInfoPanel />
          </>
        )
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        {activeView === 'graph' ? (
          <GraphViewer model={model} onNodeClick={handleNodeClick} />
        ) : (
          <ModelJSONViewer
            model={model}
            linkRegistry={linkRegistry || undefined}
            specData={specData || undefined}
            onPathHighlight={handlePathHighlight}
            selectedLayer={selectedLayerId}
          />
        )}
      </div>
    </SharedLayout>
  );
}
