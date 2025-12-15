import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import SpecViewer from '../components/SpecViewer';
import SpecGraphView from '../components/SpecGraphView';
import AnnotationPanel from '../components/AnnotationPanel';
import SchemaInfoPanel from '../components/SchemaInfoPanel';
import ModelLayersSidebar from '../components/ModelLayersSidebar';
import SharedLayout from '../components/SharedLayout';
import { LoadingState, ErrorState } from '../components/shared';
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
  // const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  // const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

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

  // Handle node click in graph view
  // const handleNodeClick = (node: Node | null) => {
  //   setSelectedNode(node);
  // };

  // Handle path highlight in JSON view (auto-clear after 3 seconds)
  // const handlePathHighlight = (path: string | null) => {
  //   setHighlightedPath(path);
  //   if (path) {
  //     setTimeout(() => setHighlightedPath(null), 3000);
  //   }
  // };

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
    return <LoadingState variant="page" message="Loading spec..." />;
  }

  if (error) {
    return <ErrorState variant="page" message={error} onRetry={loadData} />;
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
      leftSidebarContent={<ModelLayersSidebar />}
      rightSidebarContent={
        activeView === 'json' ? (
          <>
            <AnnotationPanel />
            {/* <HighlightedPathPanel highlightedPath={highlightedPath} /> */}
            <SchemaInfoPanel />
          </>
        ) : (
          <>
            <AnnotationPanel />
            <SchemaInfoPanel />
          </>
        )
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        {activeView === 'graph' ? (
          <SpecGraphView specData={specData} />
        ) : (
          <SpecViewer specData={specData} />
        )}
      </div>
    </SharedLayout>
  );
}
