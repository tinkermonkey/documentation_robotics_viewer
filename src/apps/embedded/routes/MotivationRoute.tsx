import { ReactFlowProvider } from '@xyflow/react';
import { LayerRightSidebar } from '../components/shared/LayerRightSidebar';
import { CrossLayerPanel } from '../components/CrossLayerPanel';
import AnnotationPanel from '../components/AnnotationPanel';
import SharedLayout from '../components/SharedLayout';
import { useModelStore } from '../../../core/stores/modelStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { useDataLoader } from '../hooks/useDataLoader';
import { LoadingState, ErrorState } from '../components/shared';
import GraphViewer from '../../../core/components/GraphViewer';

function MotivationRouteContent() {
  const { model } = useModelStore();

  if (!model) {
    return null;
  }

  return (
    <SharedLayout
      showLeftSidebar={false}
      showRightSidebar={true}
      rightSidebarContent={
        <LayerRightSidebar
          filterSections={[]}
          onClearFilters={() => {}}
          controlContent={null}
          annotationContent={<AnnotationPanel />}
          crossLayerContent={<CrossLayerPanel />}
          testId="motivation-right-sidebar"
        />
      }
    >
      <GraphViewer model={model} />
    </SharedLayout>
  );
}

export default function MotivationRoute() {
  const { setModel } = useModelStore();
  const annotationStore = useAnnotationStore();

  const { data: model, loading, error, reload } = useDataLoader({
    loadFn: async () => {
      const modelData = await embeddedDataLoader.loadModel();
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
