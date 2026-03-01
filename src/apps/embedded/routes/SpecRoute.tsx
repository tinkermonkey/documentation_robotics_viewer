import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import SpecViewer from '../components/SpecViewer';
import SpecGraphView from '../components/SpecGraphView';
import SpecSchemasSidebar from '../components/SpecSchemasSidebar';
import AnnotationPanel from '../components/AnnotationPanel';
import SchemaInfoPanel from '../components/SchemaInfoPanel';
import SharedLayout from '../components/SharedLayout';
import { LoadingState, ErrorState } from '../components/shared';
import { useAnnotationStore } from '../stores/annotationStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import type { SchemaDefinition } from '../services/embeddedDataLoader';
import { useDataLoader } from '../hooks/useDataLoader';
import { isLayerSchema, sortLayerSchemas } from '../services/specGraphBuilder';

export default function SpecRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const annotationStore = useAnnotationStore();
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const { specView, setSpecView } = useViewPreferenceStore();

  const activeView = view === 'graph' ? 'graph' : 'details';

  // Load spec data
  const { data: specData, loading, error, reload } = useDataLoader({
    loadFn: async () => {
      const spec = await embeddedDataLoader.loadSpec();
      return spec;
    },
    websocketEvents: ['model.updated'],
    onSuccess: async () => {
      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);
    },
  });

  // Sync route param ↔ store preference
  useEffect(() => {
    if (!view) {
      navigate({ to: `/spec/${specView}`, replace: true });
    } else if (activeView !== specView) {
      setSpecView(activeView);
    }
  }, [view, activeView, specView, navigate, setSpecView]);

  // Auto-select first layer schema when data loads
  useEffect(() => {
    if (specData && !selectedSchemaId) {
      const allEntries = Object.entries(specData.schemas || {}) as [string, SchemaDefinition][];
      const layerEntries = sortLayerSchemas(allEntries.filter(([, schema]) => isLayerSchema(schema)));
      setSelectedSchemaId(layerEntries[0]?.[0] ?? null);
    }
  }, [specData, selectedSchemaId]);

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

  return (
    <SharedLayout
      showLeftSidebar={true}
      showRightSidebar={true}
      leftSidebarContent={
        <SpecSchemasSidebar
          specData={specData}
          selectedSchemaId={selectedSchemaId}
          onSelectSchema={setSelectedSchemaId}
        />
      }
      rightSidebarContent={
        <>
          <AnnotationPanel />
          <SchemaInfoPanel />
        </>
      }
    >
      {activeView === 'graph'
        ? <SpecGraphView specData={specData} selectedSchemaId={selectedSchemaId} />
        : <SpecViewer specData={specData} selectedSchemaId={selectedSchemaId} />}
    </SharedLayout>
  );
}
