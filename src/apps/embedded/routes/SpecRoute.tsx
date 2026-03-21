import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import SpecViewer from '../components/SpecViewer';
import SpecNodeDetailsPanel from '../components/SpecNodeDetailsPanel';
import AnnotationPanel from '../components/AnnotationPanel';
import SchemaInfoPanel from '../components/SchemaInfoPanel';
import ModelLayersSidebar from '../components/ModelLayersSidebar';
import SharedLayout from '../components/SharedLayout';
import { LoadingState, ErrorState } from '../components/shared';
import { useAnnotationStore } from '../stores/annotationStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { useModelStore } from '../../../core/stores/modelStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { useDataLoader } from '../hooks/useDataLoader';

export default function SpecRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const annotationStore = useAnnotationStore();
  const { specView, setSpecView } = useViewPreferenceStore();
  const { setModel, specSchemas } = useModelStore();
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedSpecNodeId, setSelectedSpecNodeId] = useState<string | null>(null);

  // Load both spec and model (model populates ModelLayersSidebar via modelStore)
  const { data: specData, loading, error, reload } = useDataLoader({
    loadFn: async () => {
      const [spec, model] = await Promise.all([
        embeddedDataLoader.loadSpec(),
        embeddedDataLoader.loadModel(),
      ]);
      setModel(model);
      return spec;
    },
    websocketEvents: ['model', 'model.updated'],
    onSuccess: async () => {
      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);
    },
  });

  // Build maps from layer id → schema key and layer id → node type count
  const { layerIdToSchemaKey, layerCounts } = useMemo(() => {
    if (!specData) return { layerIdToSchemaKey: {}, layerCounts: {} };
    const layerIdToSchemaKey: Record<string, string> = {};
    const layerCounts: Record<string, number> = {};
    for (const [schemaKey, schema] of Object.entries(specData.schemas)) {
      const layerObj = schema.layer as { id?: string } | undefined;
      const nodeSchemas = schema.nodeSchemas as Record<string, unknown> | undefined;
      if (layerObj?.id) {
        layerIdToSchemaKey[layerObj.id] = schemaKey;
        layerCounts[layerObj.id] = nodeSchemas ? Object.keys(nodeSchemas).length : 0;
      }
    }
    return { layerIdToSchemaKey, layerCounts };
  }, [specData]);

  // Default to first layer when data loads
  useEffect(() => {
    if (specData && !selectedLayerId) {
      const firstLayerId = Object.keys(layerIdToSchemaKey)[0];
      if (firstLayerId) setSelectedLayerId(firstLayerId);
    }
  }, [specData, layerIdToSchemaKey, selectedLayerId]);

  const activeView = view === 'json' ? 'json' : 'graph';

  // Handle view synchronization in effect to avoid navigation during render
  useEffect(() => {
    if (!view) {
      navigate({ to: `/spec/${specView}`, replace: true });
    } else if (activeView !== specView) {
      setSpecView(activeView);
    }
  }, [view, activeView, specView, navigate, setSpecView]);

  if (loading) {
    return <LoadingState variant="page" message="Loading spec..." />;
  }

  if (error) {
    return <ErrorState variant="page" message={error} onRetry={reload} />;
  }

  if (!specData) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-lg border p-8 text-center max-w-md">
          <h2 className="text-2xl font-medium mb-4">Documentation Robotics Viewer</h2>
          <p className="text-gray-600 mb-2">Viewing specification structure</p>
          <p className="text-gray-500">Waiting for data...</p>
        </div>
      </div>
    );
  }

  const selectedSchemaId = selectedLayerId ? layerIdToSchemaKey[selectedLayerId] ?? null : null;
  const selectedSchema = selectedSchemaId ? specData.schemas[selectedSchemaId] : undefined;

  // Get spec node details for SpecNodeDetailsPanel
  const specNodeDetails = useMemo(() => {
    if (!selectedSpecNodeId) return { nodeSchema: null, relationshipSchemas: [] };

    const parsed = selectedSpecNodeId.split('.');
    if (parsed.length !== 2) return { nodeSchema: null, relationshipSchemas: [] };

    const [layerId, nodeType] = parsed;
    const specSchema = specSchemas[layerId];
    if (!specSchema) return { nodeSchema: null, relationshipSchemas: [] };

    const nodeSchema = specSchema.nodeSchemas?.[nodeType];
    const relationshipSchemas = specSchema.relationshipSchemas ?? [];

    return { nodeSchema, relationshipSchemas };
  }, [selectedSpecNodeId, specSchemas]);

  return (
    <SharedLayout
      showLeftSidebar={true}
      showRightSidebar={true}
      leftSidebarContent={
        <ModelLayersSidebar
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          layerCounts={layerCounts}
        />
      }
      rightSidebarContent={
        <>
          <SpecNodeDetailsPanel
            selectedSpecNodeId={selectedSpecNodeId}
            nodeSchema={specNodeDetails.nodeSchema}
            relationshipSchemas={specNodeDetails.relationshipSchemas}
            onNodeClick={setSelectedSpecNodeId}
          />
          <AnnotationPanel />
          <SchemaInfoPanel />
        </>
      }
    >
      {activeView === 'graph' ? (
        <SpecViewer
          specData={specData}
          selectedSchemaId={selectedSchemaId}
          onSpecNodeSelect={setSelectedSpecNodeId}
        />
      ) : (
        <div className="h-full overflow-auto p-6">
          {selectedSchema ? (
            <pre className="text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-auto">
              {JSON.stringify(selectedSchema, null, 2)}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>Select a layer to view its schema</p>
            </div>
          )}
        </div>
      )}
    </SharedLayout>
  );
}
