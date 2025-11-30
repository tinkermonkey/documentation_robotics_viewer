import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import MotivationGraphView from '../components/MotivationGraphView';
import AnnotationPanel from '../components/AnnotationPanel';
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
      <div className="message-overlay">
        <div className="message-box">
          <div className="spinner"></div>
          <p>Loading motivation view...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="message-overlay">
        <div className="message-box error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="message-overlay">
        <div className="message-box welcome">
          <h2>Documentation Robotics Viewer</h2>
          <p className="mode-info">Viewing motivation model</p>
          <p className="connection-status">Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="motivation-view-container">
        <ReactFlowProvider>
          <MotivationGraphView model={model} />
        </ReactFlowProvider>
      </div>
      <AnnotationPanel />
    </>
  );
}
