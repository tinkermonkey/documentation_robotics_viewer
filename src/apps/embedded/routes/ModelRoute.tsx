import { useState, useRef, useEffect } from 'react';
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
import { embeddedDataLoader, SpecDataResponse } from '../services/embeddedDataLoader';
import { useDataLoader } from '../hooks/useDataLoader';
import { LoadingState, ErrorState } from '../components/shared';
import type { MetaModel } from '../../../core/types';

/**
 * Sanitize model data to ensure all elements have required visual properties.
 * Uses immutable updates to prevent mutation of input data.
 * This prevents NaN viewBox errors when rendering graphs.
 */
function sanitizeModel(model: MetaModel): MetaModel {
  return {
    ...model,
    layers: Object.fromEntries(
      Object.entries(model.layers).map(([layerId, layer]) => [
        layerId,
        {
          ...layer,
          elements: layer.elements?.map(element => ({
            ...element,
            visual: {
              position: {
                x: Number.isFinite(element.visual?.position?.x) ? element.visual.position.x : 0,
                y: Number.isFinite(element.visual?.position?.y) ? element.visual.position.y : 0,
              },
              size: {
                width: Number.isFinite(element.visual?.size?.width) && (element.visual?.size?.width ?? 0) > 0
                  ? element.visual.size.width
                  : 200,
                height: Number.isFinite(element.visual?.size?.height) && (element.visual?.size?.height ?? 0) > 0
                  ? element.visual.size.height
                  : 100,
              },
              style: element.visual?.style || {
                backgroundColor: '#e3f2fd',
                borderColor: '#1976d2',
              },
            },
          })) ?? [],
        },
      ])
    ),
  };
}

export default function ModelRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { layer?: string };
  const { setModel } = useModelStore();
  const annotationStore = useAnnotationStore();
  const [specData, setSpecData] = useState<SpecDataResponse | null>(null);
  const [specDataError, setSpecDataError] = useState<string | null>(null);
  const [annotationsError, setAnnotationsError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(search?.layer || null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeView = view === 'json' ? 'json' : 'graph';

  // Cleanup highlight timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

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
    // Clear any existing timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }

    setHighlightedPath(path);
    if (path) {
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedPath(null);
        highlightTimeoutRef.current = null;
      }, 3000);
    }
  };

  const { data: model, loading, error, reload } = useDataLoader({
    loadFn: async () => {
      const modelData = await embeddedDataLoader.loadModel();

      // Sanitize model data to ensure all elements have valid visual properties
      const sanitizedModel = sanitizeModel(modelData);

      return sanitizedModel;
    },
    websocketEvents: ['model.updated', 'annotation.added'],
    onSuccess: async (modelData) => {
      setModel(modelData);

      // Load annotations with error handling
      try {
        const annotations = await embeddedDataLoader.loadAnnotations();
        annotationStore.setAnnotations(annotations);
        setAnnotationsError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load annotations';
        setAnnotationsError(errorMessage);
        // Continue loading other data even if annotations fail
        annotationStore.setAnnotations([]);
      }

      // Load spec data for schema definitions
      try {
        const spec = await embeddedDataLoader.loadSpec();
        setSpecData(spec);
        setSpecDataError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load schema information';
        setSpecDataError(errorMessage);
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

  // All views use SharedLayout
  return (
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
            <AnnotationPanel loadError={annotationsError} />
            <LayerTypesLegend model={model} />
            <NodeDetailsPanel selectedNode={selectedNode} model={model} />
            <GraphStatisticsPanel model={model} />
          </>
        ) : (
          <>
            <AnnotationPanel loadError={annotationsError} />
            <HighlightedPathPanel highlightedPath={highlightedPath} />
            <SchemaInfoPanel specDataError={specDataError} />
          </>
        )
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        {activeView === 'graph' ? (
          <GraphViewer
            model={model}
            onNodeClick={handleNodeClick}
            selectedLayerId={selectedLayerId}
          />
        ) : (
          <ModelJSONViewer
            model={model}
            specData={specData || undefined}
            onPathHighlight={handlePathHighlight}
            selectedLayer={selectedLayerId}
          />
        )}
      </div>
    </SharedLayout>
  );
}
