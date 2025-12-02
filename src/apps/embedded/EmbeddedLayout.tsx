import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import ModeSelector from './components/ModeSelector';
import ConnectionStatus from './components/ConnectionStatus';
import { useConnectionStore } from './stores/connectionStore';
import { useViewPreferenceStore } from './stores/viewPreferenceStore';
import { websocketClient } from './services/websocketClient';
import './EmbeddedApp.css';

export default function EmbeddedLayout() {
  const connectionStore = useConnectionStore();
  const location = useLocation();

  // Map current path to view mode for ModeSelector
  const getCurrentMode = () => {
    const path = location.pathname;
    if (path.startsWith('/spec')) return 'spec';
    if (path.startsWith('/model')) return 'model';
    if (path.startsWith('/changesets')) return 'changesets';
    if (path.startsWith('/motivation')) return 'motivation';
    if (path.startsWith('/architecture')) return 'architecture';
    return 'model'; // Default
  };

  /**
   * Initialize WebSocket connection and event handlers
   */
  useEffect(() => {
    console.log('[EmbeddedLayout] Initializing WebSocket connection');

    // Register event handlers
    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('reconnecting', handleReconnecting);
    websocketClient.on('error', handleError);
    websocketClient.on('rest-mode', handleRestMode);
    websocketClient.on('connected', handleServerConnected);

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
      websocketClient.disconnect();
    };
  }, []);

  const handleConnect = () => {
    console.log('[EmbeddedLayout] WebSocket connected');
    connectionStore.setConnected();
    if (websocketClient.transportMode === 'websocket') {
      websocketClient.subscribe(['model', 'changesets', 'annotations']);
    }
  };

  const handleRestMode = () => {
    console.log('[EmbeddedLayout] Using REST mode');
    connectionStore.setConnected();
  };

  const handleServerConnected = (data: any) => {
    console.log('[EmbeddedLayout] Server connection confirmed:', data);
  };

  const handleDisconnect = () => {
    console.log('[EmbeddedLayout] WebSocket disconnected');
    connectionStore.setDisconnected();
  };

  const handleReconnecting = (data: { attempt: number; delay: number }) => {
    connectionStore.setReconnecting(data.attempt, data.delay);
  };

  const handleError = (data: { error: any }) => {
    console.error('[EmbeddedLayout] WebSocket error:', data.error);
    connectionStore.setError('Connection error');
  };

  return (
    <div className="embedded-app">
      <header className="embedded-header">
        <h1>Documentation Robotics Viewer</h1>

        <ModeSelectorWrapper currentMode={getCurrentMode()} />

        <ConnectionStatus />
      </header>

      <div className="embedded-content">
        <div className="viewer-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function ModeSelectorWrapper({ currentMode }: { currentMode: string }) {
  const navigate = useNavigate();
  const { specView, changesetView, modelView } = useViewPreferenceStore();
  
  const handleModeChange = (mode: string) => {
    let path = `/${mode}`;
    
    if (mode === 'spec') {
      path = `/spec/${specView}`;
    } else if (mode === 'changesets') {
      path = `/changesets/${changesetView}`;
    } else if (mode === 'model') {
      path = `/model/${modelView}`;
    }
    
    navigate({ to: path });
  };

  return (
    <ModeSelector
      currentMode={currentMode as any}
      onModeChange={handleModeChange}
    />
  );
}
