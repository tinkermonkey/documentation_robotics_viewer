import { useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import ChangesetList from '../components/ChangesetList';
import ChangesetViewer from '../components/ChangesetViewer';
import ChangesetGraphView from '../components/ChangesetGraphView';
import ViewTabSwitcher from '../components/ViewTabSwitcher';
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
      <div className="message-overlay">
        <div className="message-box">
          <div className="spinner"></div>
          <p>Loading changesets...</p>
        </div>
      </div>
    );
  }

  if (changesetStore.error) {
    return (
      <div className="message-overlay">
        <div className="message-box error">
          <h3>Error</h3>
          <p>{changesetStore.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="changeset-view">
      <ChangesetList onChangesetSelect={handleChangesetSelect} />
      <div className="changeset-viewer-container">
        <ViewTabSwitcher
          options={[
            { value: 'graph', label: 'Graph', icon: '📊' },
            { value: 'list', label: 'List', icon: '📋' }
          ]}
          activeView={activeView}
          onChange={(v) => navigate({ to: `/changesets/${v}` })}
        />
        {activeView === 'graph' ? (
          <ChangesetGraphView changeset={changesetStore.selectedChangeset} />
        ) : (
          <ChangesetViewer />
        )}
      </div>
    </div>
  );
}
