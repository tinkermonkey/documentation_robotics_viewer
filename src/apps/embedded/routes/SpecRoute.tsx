import { useNavigate, useParams } from '@tanstack/react-router';
import SpecViewer from '../components/SpecViewer';
import SpecGraphView from '../components/SpecGraphView';
import AnnotationPanel from '../components/AnnotationPanel';
import SchemaInfoPanel from '../components/SchemaInfoPanel';
import SharedLayout from '../components/SharedLayout';
import { LoadingState, ErrorState, ViewToggle } from '../components/shared';
import { useAnnotationStore } from '../stores/annotationStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { useDataLoader } from '@/core/hooks/useDataLoader';

export default function SpecRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const selectedSchemaId: string | null = null;
  const annotationStore = useAnnotationStore();
  const { specView, setSpecView } = useViewPreferenceStore();

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

  // Handle view parameter routing
  if (!view) {
    navigate({ to: `/spec/${specView}`, replace: true });
  } else if ((view === 'json' || view === 'graph') && view !== specView) {
    setSpecView(view as 'graph' | 'json');
  }

  const activeView = view === 'json' ? 'json' : 'graph';

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

  // Standard graph/json views use SharedLayout
  return (
    <SharedLayout
      showLeftSidebar={false}
      showRightSidebar={true}
      rightSidebarContent={
        <>
          <AnnotationPanel />
          <SchemaInfoPanel />
        </>
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
            onViewChange={(v) => navigate({ to: `/spec/${v}` })}
          />
        </div>
        {activeView === 'graph' ? (
          <SpecGraphView specData={specData} selectedSchemaId={selectedSchemaId} />
        ) : (
          <SpecViewer specData={specData} selectedSchemaId={selectedSchemaId} />
        )}
      </div>
    </SharedLayout>
  );
}
