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
import { useDataLoader } from '../hooks/useDataLoader';
import { LoadingState, ErrorState } from '../components/shared';

export default function ChangesetRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const changesetStore = useChangesetStore();
  const { changesetView, setChangesetView } = useViewPreferenceStore();

  const activeView = view === 'list' ? 'list' : 'graph';

  // Handle view synchronization in effect to avoid navigation during render
  useEffect(() => {
    if (!view) {
      navigate({ to: `/changesets/${changesetView}`, replace: true });
    } else if (activeView !== changesetView) {
      setChangesetView(activeView);
    }
  }, [view, activeView, changesetView, navigate, setChangesetView]);

  const { data: changesetList, loading, error, reload } = useDataLoader({
    loadFn: async () => {
      console.log('[ChangesetRoute] Loading changesets...');
      const list = await embeddedDataLoader.getChangesetList();
      console.log('[ChangesetRoute] Loaded', list.length, 'changesets');
      return list;
    },
    websocketEvents: ['changeset.created', 'changeset.updated', 'changeset.applied'],
    onSuccess: (list) => {
      changesetStore.setChangesets(list);
    },
  });

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

  if (loading && !changesetList?.length) {
    return <LoadingState variant="page" message="Loading changesets..." />;
  }

  if (error) {
    return <ErrorState variant="page" message={error} onRetry={reload} />;
  }

  return (
    <SharedLayout
      showLeftSidebar={true}
      showRightSidebar={true}
      leftSidebarContent={<ChangesetList onChangesetSelect={handleChangesetSelect} />}
      rightSidebarContent={<AnnotationPanel />}
    >
      {activeView === 'graph' ? (
        <ChangesetGraphView changeset={changesetStore.selectedChangeset} />
      ) : (
        <ChangesetViewer />
      )}
    </SharedLayout>
  );
}
