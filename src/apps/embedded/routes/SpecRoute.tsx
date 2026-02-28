import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import SpecViewer from '../components/SpecViewer';
import SpecSchemasSidebar from '../components/SpecSchemasSidebar';
import AnnotationPanel from '../components/AnnotationPanel';
import SchemaInfoPanel from '../components/SchemaInfoPanel';
import SharedLayout from '../components/SharedLayout';
import { LoadingState, ErrorState } from '../components/shared';
import { useAnnotationStore } from '../stores/annotationStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { useDataLoader } from '../hooks/useDataLoader';

export default function SpecRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const annotationStore = useAnnotationStore();
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

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

  // Redirect any non-details view to /spec/details
  useEffect(() => {
    if (view !== 'details') {
      navigate({ to: '/spec/$view', params: { view: 'details' }, replace: true });
    }
  }, [view, navigate]);

  // Auto-select first schema when data loads
  useEffect(() => {
    if (specData && !selectedSchemaId) {
      const firstId = Object.keys(specData.schemas || {})[0] ?? null;
      setSelectedSchemaId(firstId);
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
      <SpecViewer specData={specData} selectedSchemaId={selectedSchemaId} />
    </SharedLayout>
  );
}
