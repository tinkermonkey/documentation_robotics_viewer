import { useEffect } from 'react';
import { Outlet, useMatches, useNavigate } from '@tanstack/react-router';
import {
  HiDocumentText,
  HiCube,
  HiLightBulb,
  HiViewGrid,
  HiCollection,
} from 'react-icons/hi';
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
    { path: '/spec', label: 'Spec', icon: HiDocumentText, defaultView: specView },
    { path: '/model', label: 'Model', icon: HiCube, defaultView: modelView },
    { path: '/motivation', label: 'Motivation', icon: HiLightBulb, defaultView: null },
    { path: '/architecture', label: 'Architecture', icon: HiViewGrid, defaultView: null },
    { path: '/changesets', label: 'Changesets', icon: HiCollection, defaultView: changesetView },
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
    <div data-testid="embedded-app" className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header data-testid="embedded-header" className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Title Row */}
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Documentation Robotics Viewer
          </h1>
          <ConnectionStatus />
        </div>

        {/* Main Tabs Row */}
        <div className="px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex -mb-px">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.path}
                  onClick={() => handleTabChange(index)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTabIndex === index
                      ? 'text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  data-testid={`main-tab-${tab.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
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
