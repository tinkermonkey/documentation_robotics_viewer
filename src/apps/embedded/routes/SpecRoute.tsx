import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import SpecViewer from '../components/SpecViewer';
import SpecGraphView from '../components/SpecGraphView';
import AnnotationPanel from '../components/AnnotationPanel';
import LayerPanel from '../../../core/components/LayerPanel';
import ViewTabSwitcher from '../components/ViewTabSwitcher';
import { useAnnotationStore } from '../stores/annotationStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { embeddedDataLoader, SpecDataResponse } from '../services/embeddedDataLoader';
import { websocketClient } from '../services/websocketClient';

export default function SpecRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const [specData, setSpecData] = useState<SpecDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const annotationStore = useAnnotationStore();
  const { specView, setSpecView } = useViewPreferenceStore();

  // If view is undefined, redirect to preferred view
  useEffect(() => {
    if (!view) {
      navigate({ to: `/spec/${specView}`, replace: true });
    }
  }, [view, specView, navigate]);

  // If view IS defined, update the store
  useEffect(() => {
    if (view === 'json' || view === 'graph') {
      if (view !== specView) {
        setSpecView(view);
      }
    }
  }, [view, specView, setSpecView]);

  const activeView = view === 'json' ? 'json' : 'graph';

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[SpecRoute] Loading spec data...');

      const spec = await embeddedDataLoader.loadSpec();
      setSpecData(spec);
      
      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);

      console.log('[SpecRoute] Spec loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load spec';
      setError(errorMessage);
      console.error('[SpecRoute] Error loading spec:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    const handleAnnotationAdded = async () => {
      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);
    };

    websocketClient.on('annotation.added', handleAnnotationAdded);
    return () => {
      websocketClient.off('annotation.added', handleAnnotationAdded);
    };
  }, [annotationStore.setAnnotations]);

  if (loading) {
    return (
      <div className="message-overlay">
        <div className="message-box">
          <div className="spinner"></div>
          <p>Loading spec...</p>
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

  if (!specData) {
    return (
      <div className="message-overlay">
        <div className="message-box welcome">
          <h2>Documentation Robotics Viewer</h2>
          <p className="mode-info">Viewing specification structure</p>
          <p className="connection-status">Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {activeView === 'graph' && <LayerPanel />}
      <div className="spec-view-container">
        <ViewTabSwitcher
          options={[
            { value: 'graph', label: 'Graph', icon: '📊' },
            { value: 'json', label: 'JSON', icon: '📄' }
          ]}
          activeView={activeView}
          onChange={(v) => navigate({ to: `/spec/${v}` })}
        />
        <div className="spec-view-content">
          {activeView === 'graph' ? (
            <SpecGraphView specData={specData} />
          ) : (
            <SpecViewer specData={specData} />
          )}
        </div>
      </div>
      <AnnotationPanel />
    </>
  );
}
