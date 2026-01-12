import { useNavigate, useParams } from '@tanstack/react-router';
import ChangesetList from '../components/ChangesetList';
import ChangesetViewer from '../components/ChangesetViewer';
import ChangesetGraphView from '../components/ChangesetGraphView';
import AnnotationPanel from '../components/AnnotationPanel';
import SharedLayout from '../components/SharedLayout';
import { useChangesetStore } from '../stores/changesetStore';
import { useViewPreferenceStore } from '../stores/viewPreferenceStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { useDataLoader } from '@/core/hooks/useDataLoader';
import { LoadingState, ErrorState, ViewToggle } from '../components/shared';

export default function ChangesetRoute() {
  const { view } = useParams({ strict: false });
  const navigate = useNavigate();
  const changesetStore = useChangesetStore();
  const { changesetView, setChangesetView } = useViewPreferenceStore();

  // Handle view parameter routing
  if (!view) {
    navigate({ to: `/changesets/${changesetView}`, replace: true });
  } else if ((view === 'list' || view === 'graph') && view !== changesetView) {
    setChangesetView(view);
  }

  const activeView = view === 'list' ? 'list' : 'graph';

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
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <ViewToggle
            views={[
              { key: 'graph', label: 'Graph' },
              { key: 'list', label: 'List' },
            ]}
            activeView={activeView}
            onViewChange={(v) => navigate({ to: `/changesets/${v}` })}
          />
        </div>
        {activeView === 'graph' ? (
          <ChangesetGraphView changeset={changesetStore.selectedChangeset} />
        ) : (
          <ChangesetViewer />
        )}
      </div>
    </SharedLayout>
  );
}
