import { useEffect, useCallback, useRef } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { createHashHistory } from '@tanstack/history';
import AuthRoute from './routes/AuthRoute';
import { AppShell } from './ui/AppShell';
import { useUiStore, type ViewKind } from './ui/uiStore';
import { useAuthStore } from './stores/authStore';
import { useConnectionStore } from './stores/connectionStore';
import { websocketClient } from './services/websocketClient';
import { useModel } from './data/useModel';

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

/** Search-param shape for `appShellRoute` — reflects the current left-panel
 *  selection so it's shareable/bookmarkable and survives back/forward.
 *  `layer`/`node` apply to Model + Schema (both keep the selection in the
 *  SAME `uiStore.layerId`/`selectedId` fields regardless of view — a Schema
 *  `node` is a `spec_node_id`, a Model `node` is a UUID, but the sync logic
 *  below doesn't need to care which); `changeset` applies to Changesets.
 *  `edge` applies to the Model graph only, and is mutually exclusive with
 *  `node` — `uiStore.selectEdge` already clears `selectedId`, so
 *  whenever `edge` is present in the store → URL direction below, `node` is
 *  naturally omitted. */
interface AppShellSearch {
  layer?: string;
  node?: string;
  edge?: string;
  changeset?: string;
}

/** Combine layer/node/edge/changeset into one string so a single ref comparison
 *  (see prevSelectionKeyRef below) detects a change in any of them. */
function selectionKey(
  layerId: string | null,
  selectedId: string | null,
  selectedEdgeId: string | null,
  changesetId: string | null,
): string {
  return `${layerId ?? ''}|${selectedId ?? ''}|${selectedEdgeId ?? ''}|${changesetId ?? ''}`;
}

/**
 * Thin route component — keeps `uiStore.view` + the current left-panel
 * selection (layer/node/edge/changeset) and the URL hash in two-way sync, then
 * renders the AppShell (which is itself view/selection-driven from the store).
 *
 * URL → store: `:section` drives `setView`; `?layer`/`?node`/`?edge`/`?changeset`
 * drive `selectLayer`/`selectNode`/`selectEdge`/`selectChangeset` — so a deep
 * link, a shared URL, or browser back/forward all restore the exact selection.
 * `?edge=` is additionally validated against the loaded model before being
 * restored — edge ids are volatile (any relationship change removes one
 * permanently), so a bookmarked/shared `?edge=` is a common way to end up
 * with an id that no longer exists. Restoring it unconditionally would call
 * `selectEdge` with a dead id that `edgeMetadata()` can never resolve,
 * leaving the Inspector closed but the URL still carrying the stale param.
 * Validation waits for the model query to actually succeed first (an
 * empty/loading `links` array is not evidence the id is invalid), then either
 * restores the selection or strips the dead param from the URL.
 *
 * store → URL: when the view OR the selection changes from inside the app
 * (nav tree clicks, graph node clicks, cross-layer navigation, the
 * data-driven default-selection effect in AppShell.tsx), push/replace the
 * matching `/$section/$view?layer=...&node=...` (or `?changeset=...`) so the
 * hash always reflects the truth. A genuine VIEW change pushes a new history
 * entry (same as before); a pure selection change within the same view
 * replaces the current entry instead, so every nav-tree/graph click doesn't
 * flood browser history — only switching Model/Schema/Changesets does.
 * Guarded (mount ref + prev-value refs) so the two effects never ping-pong.
 */
function AppShellRoute() {
  const { section } = useParams({ strict: false }) as { section?: string };
  const search = useSearch({ strict: false }) as AppShellSearch;
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const selectedEdgeId = useUiStore((s) => s.selectedEdgeId);
  const changesetId = useUiStore((s) => s.changesetId);
  const selectLayer = useUiStore((s) => s.selectLayer);
  const selectNode = useUiStore((s) => s.selectNode);
  const selectEdge = useUiStore((s) => s.selectEdge);
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const { derived: model, isSuccess: modelLoaded } = useModel();

  // On mount (incl. a deep-link / reload) the URL is authoritative: the URL →
  // store effects seed the view/selection from the route. The store → URL
  // effect must NOT fire on that first render, or the store's initial
  // defaults would clobber an incoming deep link before the seed lands.
  // After mount, genuine changes (nav clicks, cross-layer navigation, the
  // default-selection effect) drive the URL.
  const mountedRef = useRef(false);
  // Tracks the last view/selection we reacted to so the store → URL effect
  // fires ONLY on a genuine change — see the original comment this is based
  // on: without it, a URL-driven change (back/forward) updates the route
  // first while the store is still stale; the effect would see a mismatch
  // and navigate "backward" to correct it, oscillating forever.
  const prevViewRef = useRef(view);
  const prevSelectionKeyRef = useRef(selectionKey(layerId, selectedId, selectedEdgeId, changesetId));

  // URL → store: section/view (unchanged from before).
  useEffect(() => {
    const next = section ? SECTION_TO_VIEW[section] : undefined;
    if (next) setView(next);
  }, [section, setView]);

  // URL → store: layer/node/changeset — deep link, shared URL, or
  // back/forward. Only acts on the field(s) actually present in the URL and
  // only when they differ from the store, so it never fights a change that
  // originated in the app itself (see the store → URL effect below).
  useEffect(() => {
    if (search.changeset && search.changeset !== changesetId) {
      selectChangeset(search.changeset);
      return;
    }
    if (search.layer && search.layer !== layerId) selectLayer(search.layer);
    // edge/node are mutually exclusive in the URL — prefer edge when
    // both are somehow present rather than restoring one then the other.
    if (search.edge && search.edge !== selectedEdgeId) {
      // Wait for the model to actually load before judging validity — an
      // empty/loading links array would otherwise look indistinguishable
      // from a genuinely dead id and strip a valid deep link before the
      // data it needs to validate against has even arrived.
      if (!modelLoaded) return;
      if (model.links.some((link) => link.id === search.edge)) {
        selectEdge(search.edge);
      } else {
        // Bookmarked/shared edge id that no longer exists in the model —
        // drop the dead param instead of restoring a selection
        // edgeMetadata() can never resolve.
        router.navigate({ to: '.', search: (prev) => ({ ...prev, edge: undefined }), replace: true });
      }
    } else if (search.node && search.node !== selectedId) {
      selectNode(search.node);
    }
    // Deliberately keyed on the URL values (plus the model data `?edge=`
    // validation needs) only — reacting to the rest of the store here too
    // would make this effect re-fire the moment IT calls
    // selectLayer/selectNode/selectEdge/selectChangeset, fighting its own update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.layer, search.node, search.edge, search.changeset, modelLoaded, model.links]);

  // store → URL: view (push on a genuine section change) + layer/node/changeset
  // (replace on a pure selection change within the same section). Skip first
  // render — see mountedRef above.
  useEffect(() => {
    const key = selectionKey(layerId, selectedId, selectedEdgeId, changesetId);
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevViewRef.current = view;
      prevSelectionKeyRef.current = key;
      return;
    }
    const viewChanged = prevViewRef.current !== view;
    const selectionChanged = prevSelectionKeyRef.current !== key;
    if (!viewChanged && !selectionChanged) return;
    prevViewRef.current = view;
    prevSelectionKeyRef.current = key;

    const targetSection = VIEW_TO_SECTION[view];
    const sectionNeedsUpdate = section !== targetSection;
    // Nothing actually changed on the URL side (e.g. this fired only because
    // a URL-driven update above just made the store match the URL already).
    if (!sectionNeedsUpdate && !selectionChanged) return;

    router.navigate({
      to: '/$section/$view',
      params: { section: targetSection, view: SECTION_DEFAULT_VIEW[targetSection] },
      search:
        view === 'changesets'
          ? { changeset: changesetId ?? undefined }
          : {
              layer: layerId ?? undefined,
              // Mutually exclusive: selecting an edge already cleared
              // selectedId, so at most one of these is ever defined here.
              node: selectedId ?? undefined,
              edge: selectedEdgeId ?? undefined,
            },
      replace: !sectionNeedsUpdate,
    });
  }, [view, layerId, selectedId, selectedEdgeId, changesetId, section]);

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
  validateSearch: (search: Record<string, unknown>): AppShellSearch => ({
    layer: typeof search.layer === 'string' ? search.layer : undefined,
    node: typeof search.node === 'string' ? search.node : undefined,
    edge: typeof search.edge === 'string' ? search.edge : undefined,
    changeset: typeof search.changeset === 'string' ? search.changeset : undefined,
  }),
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
