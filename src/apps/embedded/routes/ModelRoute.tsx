import { useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import GraphViewer from '../../../core/components/GraphViewer';
import ModelJSONViewer from '../components/ModelJSONViewer';
import AnnotationPanel from '../components/AnnotationPanel';
import LayerPanel from '../../../core/components/LayerPanel';
import ViewTabSwitcher from '../components/ViewTabSwitcher';
import { useModelStore } from '../../../core/stores/modelStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { websocketClient } from '../services/websocketClient';

export default function ModelRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const { model, loading, error, setModel, setLoading, setError } = useModelStore();
  const annotationStore = useAnnotationStore();

  const activeView = view === 'json' ? 'json' : 'graph';

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[ModelRoute] Loading model data...');

      const modelData = await embeddedDataLoader.loadModel();
      setModel(modelData);
      
      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);

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
      <div className="message-overlay">
        <div className="message-box">
          <div className="spinner"></div>
          <p>Loading model...</p>
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
          <p className="mode-info">Viewing current model</p>
          <p className="connection-status">Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {activeView === 'graph' && <LayerPanel />}
      <div className="model-view-container">
        <ViewTabSwitcher
          options={[
            { value: 'graph', label: 'Graph', icon: '📊' },
            { value: 'json', label: 'JSON', icon: '📄' }
          ]}
          activeView={activeView}
          onChange={(v) => navigate({ to: `/model/${v}` })}
        />
        <div className="model-view-content">
          {activeView === 'graph' ? (
            <GraphViewer model={model} />
          ) : (
            <ModelJSONViewer model={model} />
          )}
        </div>
      </div>
      <AnnotationPanel />
    </>
  );
}
