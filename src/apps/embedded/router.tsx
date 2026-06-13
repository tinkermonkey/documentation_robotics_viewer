import { useEffect, useCallback, useRef } from 'react';
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

/** Reverse map: uiStore view → route `:section` segment. */
const VIEW_TO_SECTION: Record<ViewKind, string> = {
  model: 'model',
  spec: 'spec',
  changesets: 'changesets',
};

/** Default `:view` segment per section (the only view each section has today). */
const SECTION_DEFAULT_VIEW: Record<string, string> = {
  model: 'graph',
  spec: 'graph',
  changesets: 'list',
};

/**
 * Thin route component — keeps `uiStore.view` and the URL hash in two-way sync,
 * then renders the AppShell (which is itself view-driven from the store).
 *
 * URL → store: the `:section` param drives `setView`, so browser back/forward
 * (a hash change) updates the active view.
 *
 * store → URL: when the view changes from inside the app (e.g. clicking a nav
 * section, or a cross-layer relationship that switches Model↔Schema), push the
 * matching `/$section/$view` so the hash reflects the active view and history
 * captures the change. Guarded on an actual section mismatch so the two effects
 * never ping-pong.
 */
function AppShellRoute() {
  const { section } = useParams({ strict: false }) as { section?: string };
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  // On mount (incl. a deep-link / reload) the URL is authoritative: the URL →
  // store effect seeds the view from `:section`. The store → URL effect must NOT
  // fire on that first render, or the store's initial default view ('model')
  // would clobber an incoming `#/spec/...` or `#/changesets/...` deep link before
  // the seed lands. After mount, genuine view changes (nav clicks, cross-layer
  // navigation) drive the URL.
  const mountedRef = useRef(false);
  // Tracks the last view we reacted to so the store → URL effect fires ONLY on a
  // genuine `view` change. Without this, a URL-driven change (back/forward)
  // updates `section` first while `view` is still stale; the effect would see a
  // mismatch and navigate "backward" to correct it, oscillating forever.
  const prevViewRef = useRef(view);

  // URL → store.
  useEffect(() => {
    const next = section ? SECTION_TO_VIEW[section] : undefined;
    if (next) setView(next);
  }, [section, setView]);

  // store → URL (skip first render; act ONLY on a real `view` change, never a
  // `section` change — see prevViewRef above).
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevViewRef.current = view;
      return;
    }
    if (prevViewRef.current === view) return;
    prevViewRef.current = view;
    const targetSection = VIEW_TO_SECTION[view];
    if (section === targetSection) return;
    router.navigate({
      to: '/$section/$view',
      params: { section: targetSection, view: SECTION_DEFAULT_VIEW[targetSection] },
    });
  }, [view, section]);

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
