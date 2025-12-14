import { useEffect } from 'react';
import { Outlet, useMatches, useNavigate } from '@tanstack/react-router';
import ConnectionStatus from './components/ConnectionStatus';
import SubTabNavigation, { SubTab } from './components/SubTabNavigation';
import { useConnectionStore } from './stores/connectionStore';
import { useViewPreferenceStore } from './stores/viewPreferenceStore';
import { websocketClient } from './services/websocketClient';

// Route metadata for sub-tab navigation
const routeMetadata: Record<string, { subTabs?: SubTab[] }> = {
  '/spec': {
    subTabs: [
      { id: 'graph', label: 'Graph', path: '/spec/graph' },
      { id: 'json', label: 'JSON', path: '/spec/json' }
    ]
  },
  '/model': {
    subTabs: [
      { id: 'graph', label: 'Graph', path: '/model/graph' },
      { id: 'json', label: 'JSON', path: '/model/json' }
    ]
  },
  '/changesets': {
    subTabs: [
      { id: 'graph', label: 'Graph', path: '/changesets/graph' },
      { id: 'list', label: 'List', path: '/changesets/list' }
    ]
  }
};

export default function EmbeddedLayout() {
  const connectionStore = useConnectionStore();
  const matches = useMatches();
  const navigate = useNavigate();
  const { specView, changesetView, modelView } = useViewPreferenceStore();

  // Determine active tab index from current route
  const currentPath = matches[matches.length - 1]?.pathname || '';
  const tabs = [
    { path: '/spec', label: 'Spec', defaultView: specView },
    { path: '/model', label: 'Model', defaultView: modelView },
    { path: '/motivation', label: 'Motivation', defaultView: null },
    { path: '/architecture', label: 'Architecture', defaultView: null },
    { path: '/changesets', label: 'Changesets', defaultView: changesetView },
  ];

  const activeTabIndex = tabs.findIndex(tab => currentPath.startsWith(tab.path));

  const handleTabChange = (index: number) => {
    const tab = tabs[index];
    const path = tab.defaultView ? `${tab.path}/${tab.defaultView}` : tab.path;
    navigate({ to: path });
  };

  // Determine current sub-tabs based on active main tab
  const currentMainTab = tabs.find(tab => currentPath.startsWith(tab.path));
  const subTabs = currentMainTab ? routeMetadata[currentMainTab.path]?.subTabs || [] : [];

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
    <div data-testid="embedded-app" className="min-h-screen bg-gray-50">
      <header data-testid="embedded-header" className="bg-white border-b">
        {/* Title Row */}
        <div className="px-6 py-4">
          <h1 className="text-xl">Documentation Robotics Viewer</h1>
        </div>

        {/* Main Tabs Row */}
        <div className="px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex">
              {tabs.map((tab, index) => (
                <button
                  key={tab.path}
                  onClick={() => handleTabChange(index)}
                  className={`px-4 py-3 text-sm relative ${
                    activeTabIndex === index
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <ConnectionStatus />
          </div>
        </div>

        {/* Sub-tabs Row (conditional) */}
        <SubTabNavigation tabs={subTabs} activePath={currentPath} />
      </header>

      <div className="flex h-[calc(100vh-180px)]">
        <Outlet />
      </div>
    </div>
  );
}
