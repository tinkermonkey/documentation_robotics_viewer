import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import MotivationGraphView from '../components/MotivationGraphView';
import AnnotationPanel from '../components/AnnotationPanel';
import SharedLayout from '../components/SharedLayout';
import { useModelStore } from '../../../core/stores/modelStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { websocketClient } from '../services/websocketClient';

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
    <SharedLayout
      showLeftSidebar={false}
      showRightSidebar={true}
      rightSidebarContent={<AnnotationPanel />}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <ReactFlowProvider>
          <MotivationGraphView model={model} />
        </ReactFlowProvider>
      </div>
    </SharedLayout>
  );
}
