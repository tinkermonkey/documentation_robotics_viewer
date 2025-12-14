import { useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import ChangesetList from '../components/ChangesetList';
import ChangesetViewer from '../components/ChangesetViewer';
import ChangesetGraphView from '../components/ChangesetGraphView';
import AnnotationPanel from '../components/AnnotationPanel';
import SharedLayout from '../components/SharedLayout';
import { useChangesetStore } from '../stores/changesetStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { websocketClient } from '../services/websocketClient';

export default function ChangesetRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const changesetStore = useChangesetStore();
  const { changesetView, setChangesetView } = useViewPreferenceStore();

  // If view is undefined, redirect to preferred view
  useEffect(() => {
    if (!view) {
      navigate({ to: `/changesets/${changesetView}`, replace: true });
    }
  }, [view, changesetView, navigate]);

  // If view IS defined, update the store
  useEffect(() => {
    if (view === 'list' || view === 'graph') {
      if (view !== changesetView) {
        setChangesetView(view);
      }
    }
  }, [view, changesetView, setChangesetView]);

  const activeView = view === 'list' ? 'list' : 'graph';

  const loadData = async () => {
    try {
      changesetStore.setLoading(true);
      changesetStore.setError(null);
      console.log('[ChangesetRoute] Loading changesets...');

      const changesetList = await embeddedDataLoader.getChangesetList();
      changesetStore.setChangesets(changesetList);

      console.log('[ChangesetRoute] Loaded', changesetList.length, 'changesets');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load changesets';
      changesetStore.setError(errorMessage);
      console.error('[ChangesetRoute] Error loading changesets:', err);
    } finally {
      changesetStore.setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleChangesetCreated = async (data: { changesetId: string }) => {
      console.log('[ChangesetRoute] Changeset created:', data.changesetId);
      await loadData();
    };

    websocketClient.on('changeset.created', handleChangesetCreated);
    return () => {
      websocketClient.off('changeset.created', handleChangesetCreated);
    };
  }, [changesetStore.setChangesets, changesetStore.setLoading, changesetStore.setError]);

  const handleChangesetSelect = async (changesetId: string) => {
    try {
      changesetStore.setLoading(true);
      changesetStore.setError(null);
      changesetStore.setSelectedChangesetId(changesetId);

      console.log('[ChangesetRoute] Loading changeset:', changesetId);

      const changeset = await embeddedDataLoader.loadChangeset(changesetId);
      changesetStore.setSelectedChangeset(changeset);

      console.log('[ChangesetRoute] Changeset loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load changeset details';
      changesetStore.setError(errorMessage);
      console.error('[ChangesetRoute] Error loading changeset:', err);
    } finally {
      changesetStore.setLoading(false);
    }
  };

  if (changesetStore.loading && !changesetStore.changesets.length) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-lg border p-6 text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700">Loading changesets...</p>
        </div>
      </div>
    );
  }

  if (changesetStore.error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
          <p className="text-red-600">{changesetStore.error}</p>
        </div>
      </div>
    );
  }

  return (
    <SharedLayout
      showLeftSidebar={true}
      showRightSidebar={true}
      leftSidebarContent={<ChangesetList onChangesetSelect={handleChangesetSelect} />}
      rightSidebarContent={<AnnotationPanel />}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {activeView === 'graph' ? (
          <ChangesetGraphView changeset={changesetStore.selectedChangeset} />
        ) : (
          <ChangesetViewer />
        )}
      </div>
    </SharedLayout>
  );
}
