import { useEffect, useCallback } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useParams,
} from '@tanstack/react-router';
import { createHashHistory } from '@tanstack/history';
import AuthRoute from './routes/AuthRoute';
import { AppShell } from './ui/AppShell';
import { useUiStore, type ViewKind } from './ui/uiStore';
import { useAuthStore } from './stores/authStore';
import { useConnectionStore } from './stores/connectionStore';
import { websocketClient } from './services/websocketClient';

/**
 * Root component — runs the WebSocket bootstrap effect (ported verbatim from the
 * old EmbeddedLayout): connect, set token, subscribe to model/changesets/
 * annotations channels. Renders the routed outlet.
 */
function RootShell() {
  const token = useAuthStore((state) => state.token);

  // Individual action selectors to avoid re-render loops from whole-store references.
  const setConnected = useConnectionStore((state) => state.setConnected);
  const setDisconnected = useConnectionStore((state) => state.setDisconnected);
  const setReconnecting = useConnectionStore((state) => state.setReconnecting);
  const setError = useConnectionStore((state) => state.setError);

  const handleConnect = useCallback(() => {
    console.log('[RootShell] WebSocket connected');
    setConnected();
    if (websocketClient.transportMode === 'websocket') {
      websocketClient.subscribe(['model', 'changesets', 'annotations']);
    }
  }, [setConnected]);

  const handleRestMode = useCallback(() => {
    console.log('[RootShell] Using REST mode');
    setConnected();
  }, [setConnected]);

  const handleDisconnect = useCallback(() => {
    console.log('[RootShell] WebSocket disconnected');
    setDisconnected();
  }, [setDisconnected]);

  const handleReconnecting = useCallback(
    (data: { attempt: number; delay: number }) => {
      setReconnecting(data.attempt, data.delay);
    },
    [setReconnecting]
  );

  const handleError = useCallback(
    (
      data:
        | { kind: 'event'; error: Event }
        | { kind: 'code'; code: string; message: string }
    ) => {
      const errorDetail =
        data.kind === 'event' ? data.error : `${data.code}: ${data.message}`;
      console.error('[RootShell] WebSocket error:', errorDetail);
      setError('Connection error');
    },
    [setError]
  );

  useEffect(() => {
    console.log('[RootShell] Initializing WebSocket connection');

    if (token) {
      console.log('[RootShell] Setting authentication token for WebSocket');
      websocketClient.setToken(token);
    }

    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('reconnecting', handleReconnecting);
    websocketClient.on('error', handleError);
    websocketClient.on('rest-mode', handleRestMode);

    websocketClient.connect();

    return () => {
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
      websocketClient.off('reconnecting', handleReconnecting);
      websocketClient.off('error', handleError);
      websocketClient.off('rest-mode', handleRestMode);
      websocketClient.disconnect();
    };
  }, [
    token,
    handleConnect,
    handleDisconnect,
    handleReconnecting,
    handleError,
    handleRestMode,
  ]);

  return <Outlet />;
}

/** Maps a route `/$section/$view` segment to a uiStore view. */
const SECTION_TO_VIEW: Record<string, ViewKind> = {
  model: 'model',
  spec: 'spec',
  changesets: 'changesets',
};

/**
 * Thin route component — reads the `:section` param and syncs `uiStore.view`,
 * then renders the AppShell. The shell itself is view-driven from the store.
 */
function AppShellRoute() {
  const { section } = useParams({ strict: false }) as { section?: string };
  const setView = useUiStore((s) => s.setView);

  useEffect(() => {
    const view = section ? SECTION_TO_VIEW[section] : undefined;
    if (view) setView(view);
  }, [section, setView]);

  return <AppShell />;
}

const rootRoute = createRootRoute({
  component: RootShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: AuthRoute,
});

const appShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$section/$view',
  component: AppShellRoute,
});

const routeTree = rootRoute.addChildren([indexRoute, appShellRoute]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
