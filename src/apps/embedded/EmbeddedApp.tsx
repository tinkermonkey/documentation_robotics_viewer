/**
 * EmbeddedApp Component
 * Streamlined viewer for embedding in the Python dr CLI
 * Supports spec viewing, model viewing, and changeset visualization
 */

import { useState, useEffect } from 'react';
import GraphViewer from '../../core/components/GraphViewer';
import LayerPanel from '../../core/components/LayerPanel';
import ModeSelector from './components/ModeSelector';
import ConnectionStatus from './components/ConnectionStatus';
import ChangesetList from './components/ChangesetList';
import ChangesetViewer from './components/ChangesetViewer';
import ChangesetGraphView from './components/ChangesetGraphView';
import AnnotationPanel from './components/AnnotationPanel';
import SpecViewer from './components/SpecViewer';
import SpecGraphView from './components/SpecGraphView';
import ModelJSONViewer from './components/ModelJSONViewer';
import MotivationGraphView from './components/MotivationGraphView';
import ViewTabSwitcher from './components/ViewTabSwitcher';
import { useModelStore } from '../../core/stores/modelStore';
import { useConnectionStore } from './stores/connectionStore';
import { useChangesetStore } from './stores/changesetStore';
import { useAnnotationStore } from './stores/annotationStore';
import { useViewPreferenceStore } from './stores/viewPreferenceStore';
import { websocketClient } from './services/websocketClient';
import { embeddedDataLoader, SpecDataResponse } from './services/embeddedDataLoader';
import './EmbeddedApp.css';

type ViewMode = 'spec' | 'model' | 'changesets' | 'motivation';

function EmbeddedApp() {
  const { model, loading, error, setModel, setLoading, setError } = useModelStore();
  const connectionStore = useConnectionStore();
  const changesetStore = useChangesetStore();
  const annotationStore = useAnnotationStore();
  const viewPreferences = useViewPreferenceStore();
  const [viewMode, setViewMode] = useState<ViewMode>('model');
  const [specData, setSpecData] = useState<SpecDataResponse | null>(null);

  /**
   * Initialize WebSocket connection and event handlers
   */
  useEffect(() => {
    console.log('[EmbeddedApp] Initializing WebSocket connection');

    // Register event handlers
    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('reconnecting', handleReconnecting);
    websocketClient.on('error', handleError);
    websocketClient.on('rest-mode', handleRestMode);
    websocketClient.on('connected', handleServerConnected);
    websocketClient.on('model.updated', handleModelUpdated);
    websocketClient.on('changeset.created', handleChangesetCreated);
    websocketClient.on('annotation.added', handleAnnotationAdded);

    // Connect to WebSocket
    websocketClient.connect();

    // Cleanup on unmount
    return () => {
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
      websocketClient.off('reconnecting', handleReconnecting);
      websocketClient.off('error', handleError);
      websocketClient.off('rest-mode', handleRestMode);
      websocketClient.off('connected', handleServerConnected);
      websocketClient.off('model.updated', handleModelUpdated);
      websocketClient.off('changeset.created', handleChangesetCreated);
      websocketClient.off('annotation.added', handleAnnotationAdded);
      websocketClient.disconnect();
    };
  }, []);

  /**
   * Handle WebSocket connect event
   */
  const handleConnect = () => {
    console.log('[EmbeddedApp] WebSocket connected');
    connectionStore.setConnected();

    // Only subscribe if using WebSocket mode
    if (websocketClient.transportMode === 'websocket') {
      websocketClient.subscribe(['model', 'changesets', 'annotations']);
    } else if (websocketClient.transportMode === 'rest') {
      // Load initial data in REST mode
      loadInitialData();
    }
  };

  /**
   * Handle REST mode fallback
   */
  const handleRestMode = () => {
    console.log('[EmbeddedApp] Using REST mode for data transport');
    connectionStore.setConnected();

    // Load initial data immediately in REST mode
    loadInitialData();
  };

  /**
   * Handle server connection confirmation
   */
  const handleServerConnected = (data: any) => {
    console.log('[EmbeddedApp] Server connection confirmed:', data);

    // Load initial data based on current mode
    loadInitialData();
  };

  /**
   * Handle WebSocket disconnect event
   */
  const handleDisconnect = () => {
    console.log('[EmbeddedApp] WebSocket disconnected');
    connectionStore.setDisconnected();
  };

  /**
   * Handle WebSocket reconnecting event
   */
  const handleReconnecting = (data: { attempt: number; delay: number }) => {
    console.log('[EmbeddedApp] WebSocket reconnecting...', data);
    connectionStore.setReconnecting(data.attempt, data.delay);
  };

  /**
   * Handle WebSocket error event
   */
  const handleError = (data: { error: any }) => {
    console.error('[EmbeddedApp] WebSocket error:', data.error);
    connectionStore.setError('Connection error');
  };

  /**
   * Handle model updated event from server
   */
  const handleModelUpdated = async (data: any) => {
    console.log('[EmbeddedApp] Model updated event received:', data);

    if (viewMode === 'model') {
      // Reload model data
      await loadModelData();
    }
  };

  /**
   * Handle changeset created event from server
   */
  const handleChangesetCreated = async (data: { changesetId: string }) => {
    console.log('[EmbeddedApp] Changeset created:', data.changesetId);

    // Reload changeset list if in changeset mode
    if (viewMode === 'changesets') {
      await loadChangesets();
    }
  };

  /**
   * Handle annotation added event from server
   */
  const handleAnnotationAdded = async (data: any) => {
    console.log('[EmbeddedApp] Annotation added:', data);

    // Reload annotations
    await loadAnnotations();
  };

  /**
   * Load initial data based on current mode
   */
  const loadInitialData = async () => {
    try {
      if (viewMode === 'spec') {
        await loadSpecData();
        await loadAnnotations();
      } else if (viewMode === 'model') {
        await loadModelData();
        await loadAnnotations();
      } else if (viewMode === 'motivation') {
        await loadModelData(); // Motivation view uses model data
        await loadAnnotations();
      } else if (viewMode === 'changesets') {
        await loadChangesets();
      }
    } catch (err) {
      console.error('[EmbeddedApp] Failed to load initial data:', err);
    }
  };

  /**
   * Load spec data from server
   */
  const loadSpecData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[EmbeddedApp] Loading spec data...');

      const spec = await embeddedDataLoader.loadSpec();
      console.log('[EmbeddedApp] Spec loaded from API:', {
        hasData: !!spec,
        dataKeys: spec ? Object.keys(spec) : [],
        hasSchemas: !!(spec?.schemas),
        schemaCount: spec?.schemas ? Object.keys(spec.schemas).length : 0,
        schemaKeys: spec?.schemas ? Object.keys(spec.schemas).slice(0, 3) : [],
        version: spec?.version
      });

      setSpecData(spec);
      console.log('[EmbeddedApp] Spec state updated, specData is now:', !!spec);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load spec';
      setError(errorMessage);
      console.error('[EmbeddedApp] Error loading spec:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load model data from server
   */
  const loadModelData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[EmbeddedApp] Loading model data...');

      const modelData = await embeddedDataLoader.loadModel();
      setModel(modelData);

      console.log('[EmbeddedApp] Model loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
      setError(errorMessage);
      console.error('[EmbeddedApp] Error loading model:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load changesets from server
   */
  const loadChangesets = async () => {
    try {
      changesetStore.setLoading(true);
      changesetStore.setError(null);
      console.log('[EmbeddedApp] Loading changesets...');

      const changesetList = await embeddedDataLoader.getChangesetList();
      changesetStore.setChangesets(changesetList);

      console.log('[EmbeddedApp] Loaded', changesetList.length, 'changesets');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load changesets';
      changesetStore.setError(errorMessage);
      console.error('[EmbeddedApp] Error loading changesets:', err);
    } finally {
      changesetStore.setLoading(false);
    }
  };

  /**
   * Load annotations from server
   */
  const loadAnnotations = async () => {
    try {
      annotationStore.setLoading(true);
      annotationStore.setError(null);
      console.log('[EmbeddedApp] Loading annotations...');

      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);

      console.log('[EmbeddedApp] Loaded', annotations.length, 'annotations');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load annotations';
      annotationStore.setError(errorMessage);
      console.error('[EmbeddedApp] Error loading annotations:', err);
    } finally {
      annotationStore.setLoading(false);
    }
  };

  /**
   * Handle changeset selection
   */
  const handleChangesetSelect = async (changesetId: string) => {
    try {
      changesetStore.setLoading(true);
      changesetStore.setError(null);
      changesetStore.setSelectedChangesetId(changesetId);

      console.log('[EmbeddedApp] Loading changeset:', changesetId);

      const changeset = await embeddedDataLoader.loadChangeset(changesetId);
      changesetStore.setSelectedChangeset(changeset);

      console.log('[EmbeddedApp] Changeset loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load changeset details';
      changesetStore.setError(errorMessage);
      console.error('[EmbeddedApp] Error loading changeset:', err);
    } finally {
      changesetStore.setLoading(false);
    }
  };

  /**
   * Handle mode change
   */
  const handleModeChange = async (mode: ViewMode) => {
    console.log('[EmbeddedApp] Mode change requested:', {
      fromMode: viewMode,
      toMode: mode,
      isConnected: websocketClient.isConnected
    });
    setViewMode(mode);

    // Load appropriate data for the new mode
    if (websocketClient.isConnected) {
      if (mode === 'spec') {
        console.log('[EmbeddedApp] Loading spec data for mode change');
        await loadSpecData();
        await loadAnnotations();
      } else if (mode === 'model') {
        console.log('[EmbeddedApp] Loading model data for mode change');
        await loadModelData();
        await loadAnnotations();
      } else if (mode === 'motivation') {
        console.log('[EmbeddedApp] Loading model data for motivation view');
        await loadModelData();
        await loadAnnotations();
      } else if (mode === 'changesets') {
        console.log('[EmbeddedApp] Loading changeset data for mode change');
        await loadChangesets();
      }
    } else {
      console.warn('[EmbeddedApp] Skipping data load - WebSocket not connected');
    }
  };

  return (
    <div className="embedded-app">
      <header className="embedded-header">
        <h1>Documentation Robotics Viewer</h1>

        <ModeSelector
          currentMode={viewMode}
          onModeChange={handleModeChange}
        />

        <ConnectionStatus />

        {viewMode === 'spec' && specData && (
          <div className="model-info">
            <span className="version-badge">v{specData.version}</span>
            <span className="schema-badge">Spec</span>
          </div>
        )}

        {viewMode === 'model' && model && (
          <div className="model-info">
            <span className="version-badge">v{model.version}</span>
          </div>
        )}
      </header>

      <div className="embedded-content">
        <LayerPanel />

        <div className="viewer-container">
          {loading && (
            <div className="message-overlay">
              <div className="message-box">
                <div className="spinner"></div>
                <p>Loading model...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="message-overlay">
              <div className="message-box error">
                <h3>Error</h3>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !model && (
            <div className="message-overlay">
              <div className="message-box welcome">
                <h2>Documentation Robotics Viewer</h2>
                <p className="mode-info">
                  {viewMode === 'spec' && 'Viewing specification structure'}
                  {viewMode === 'model' && 'Viewing current model'}
                  {viewMode === 'changesets' && 'Viewing changesets'}
                </p>
                <p className="connection-status">
                  Waiting for connection to dr CLI...
                </p>
              </div>
            </div>
          )}

          {!loading && !error && viewMode === 'changesets' && (
            <div className="changeset-view">
              <ChangesetList onChangesetSelect={handleChangesetSelect} />
              <div className="changeset-viewer-container">
                <ViewTabSwitcher
                  options={[
                    { value: 'graph', label: 'Graph', icon: '📊' },
                    { value: 'list', label: 'List', icon: '📋' }
                  ]}
                  activeView={viewPreferences.changesetView}
                  onChange={(view) => viewPreferences.setChangesetView(view as 'graph' | 'list')}
                />
                {viewPreferences.changesetView === 'graph' ? (
                  <ChangesetGraphView changeset={changesetStore.selectedChangeset} />
                ) : (
                  <ChangesetViewer />
                )}
              </div>
            </div>
          )}

          {(() => {
            const shouldRender = !loading && !error && viewMode === 'spec' && specData;
            console.log('[EmbeddedApp] Spec view render check:', {
              loading,
              error,
              viewMode,
              hasSpecData: !!specData,
              specDataKeys: specData ? Object.keys(specData) : [],
              shouldRender,
              activeView: viewPreferences.specView
            });
            return shouldRender ? (
              <>
                <div className="spec-view-container">
                  <ViewTabSwitcher
                    options={[
                      { value: 'graph', label: 'Graph', icon: '📊' },
                      { value: 'json', label: 'JSON', icon: '📄' }
                    ]}
                    activeView={viewPreferences.specView}
                    onChange={(view) => viewPreferences.setSpecView(view as 'graph' | 'json')}
                  />
                  <div className="spec-view-content">
                    {viewPreferences.specView === 'graph' ? (
                      <>
                        {console.log('[EmbeddedApp] Rendering SpecGraphView')}
                        <SpecGraphView specData={specData} />
                      </>
                    ) : (
                      <>
                        {console.log('[EmbeddedApp] Rendering SpecViewer')}
                        <SpecViewer specData={specData} />
                      </>
                    )}
                  </div>
                </div>
                <AnnotationPanel />
              </>
            ) : null;
          })()}

          {!loading && !error && viewMode === 'model' && model && (
            <>
              <div className="model-view-container">
                <ViewTabSwitcher
                  options={[
                    { value: 'graph', label: 'Graph', icon: '📊' },
                    { value: 'json', label: 'JSON', icon: '📄' }
                  ]}
                  activeView={viewPreferences.modelView}
                  onChange={(view) => viewPreferences.setModelView(view as 'graph' | 'json')}
                />
                <div className="model-view-content">
                  {viewPreferences.modelView === 'graph' ? (
                    <GraphViewer model={model} />
                  ) : (
                    <ModelJSONViewer model={model} />
                  )}
                </div>
              </div>
              <AnnotationPanel />
            </>
          )}

          {!loading && !error && viewMode === 'motivation' && model && (
            <>
              <div className="motivation-view-container">
                <MotivationGraphView model={model} />
              </div>
              <AnnotationPanel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmbeddedApp;
