import { useState } from 'react';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
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
import { useDataLoader } from '../hooks/useDataLoader';
import { LoadingState, ErrorState, ViewToggle } from '../components/shared';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { MetaModel } from '../../../core/types';

/**
 * Sanitize model data to ensure all elements have required visual properties.
 * This prevents NaN viewBox errors when rendering graphs.
 */
function sanitizeModel(model: MetaModel): MetaModel {
  const sanitized = { ...model };
  
  for (const layer of Object.values(sanitized.layers)) {
    if (!layer.elements || !Array.isArray(layer.elements)) continue;
    
    for (const element of layer.elements) {
      // Ensure visual object exists with valid defaults
      if (!element.visual) {
        element.visual = {
          position: { x: 0, y: 0 },
          size: { width: 200, height: 100 },
          style: { backgroundColor: '#e3f2fd', borderColor: '#1976d2' }
        };
      }
      
      // Ensure position has valid numbers
      if (!element.visual.position) {
        element.visual.position = { x: 0, y: 0 };
      }
      element.visual.position.x = Number.isFinite(element.visual.position.x) ? element.visual.position.x : 0;
      element.visual.position.y = Number.isFinite(element.visual.position.y) ? element.visual.position.y : 0;
      
      // Ensure size has valid numbers
      if (!element.visual.size) {
        element.visual.size = { width: 200, height: 100 };
      }
      element.visual.size.width = Number.isFinite(element.visual.size.width) && element.visual.size.width > 0 ? element.visual.size.width : 200;
      element.visual.size.height = Number.isFinite(element.visual.size.height) && element.visual.size.height > 0 ? element.visual.size.height : 100;
      
      // Ensure style object exists
      if (!element.visual.style) {
        element.visual.style = { backgroundColor: '#e3f2fd', borderColor: '#1976d2' };
      }
    }
  }
  
  return sanitized;
}

export default function ModelRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { layer?: string };
  const { setModel } = useModelStore();
  const annotationStore = useAnnotationStore();
  const [linkRegistry, setLinkRegistry] = useState<LinkRegistry | null>(null);
  const [specData, setSpecData] = useState<SpecDataResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(search?.layer || null);

  const activeView = view === 'json' ? 'json' : 'graph';

  // Handle layer selection and update URL
  const handleLayerSelect = (layerId: string | null) => {
    setSelectedLayerId(layerId);

    // Update URL with only the layer parameter (token stays in page URL)
    navigate({
      to: '.',
      search: { layer: layerId || undefined }
    });
  };

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

  const { data: model, loading, error, reload } = useDataLoader({
    loadFn: async () => {
      console.log('[ModelRoute] Loading model data...');

      const modelData = await embeddedDataLoader.loadModel();

      // Debug: log the structure of the model
      console.log('[ModelRoute] Received model from loader:', {
        version: modelData.version,
        metadata: modelData.metadata,
        layerCount: Object.keys(modelData.layers).length,
        layers: Object.entries(modelData.layers).map(([id, layer]) => ({
          id,
          type: layer.type,
          elementCount: layer.elements?.length || 0,
          relationshipCount: layer.relationships?.length || 0,
          firstElementVisual: layer.elements?.[0]?.visual
        })),
        referenceCount: modelData.references?.length || 0
      });

      // Sanitize model data to ensure all elements have valid visual properties
      const sanitizedModel = sanitizeModel(modelData);

      console.log('[ModelRoute] Model loaded successfully');
      return sanitizedModel;
    },
    websocketEvents: ['model.updated', 'annotation.added'],
    onSuccess: async (modelData) => {
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
    },
  });

  if (loading) {
    return <LoadingState variant="page" message="Loading model..." />;
  }

  if (error) {
    return <ErrorState variant="page" message={error} onRetry={reload} />;
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

  // All views use SharedLayout wrapped in error boundary
  return (
    <ErrorBoundary fallback={<ErrorState variant="page" message="Failed to render model view. Please try again." onRetry={reload} />}>
      <SharedLayout
        showLeftSidebar={true}
        showRightSidebar={true}
        leftSidebarContent={
          <ModelLayersSidebar
            selectedLayerId={selectedLayerId}
            onSelectLayer={handleLayerSelect}
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
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <ViewToggle
              views={[
                { key: 'graph', label: 'Graph' },
                { key: 'json', label: 'JSON' },
              ]}
              activeView={activeView}
              onViewChange={(v) => navigate({ to: `/model/${v}`, search: { layer: selectedLayerId || undefined } })}
            />
          </div>
          {activeView === 'graph' ? (
            <GraphViewer
              model={model}
              onNodeClick={handleNodeClick}
              selectedLayerId={selectedLayerId}
            />
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
    </ErrorBoundary>
  );
}
