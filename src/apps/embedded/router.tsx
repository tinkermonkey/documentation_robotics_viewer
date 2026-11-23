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
import {
  formatViewportParam,
  graphCanvasKey,
  parseViewportParam,
  sameViewport,
  viewportParamFits,
} from './ui/graphViewport';
import { useAuthStore } from './stores/authStore';
import { useConnectionStore } from './stores/connectionStore';
import { websocketClient } from './services/websocketClient';
import { useModel } from './data/useModel';
import { parseC4Level, type C4Level } from './data/c4/c4Level';

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
  architecture: 'architecture',
};

/** Reverse map: uiStore view → route `:section` segment. */
const VIEW_TO_SECTION: Record<ViewKind, string> = {
  model: 'model',
  spec: 'spec',
  changesets: 'changesets',
  architecture: 'architecture',
};

/** Default `:view` segment per section (the only view each section has today). */
const SECTION_DEFAULT_VIEW: Record<string, string> = {
  model: 'graph',
  spec: 'graph',
  changesets: 'list',
  architecture: 'diagram',
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
 *  naturally omitted. On an Architecture URL `changeset` is the changeset laid
 *  over the C4 diagrams (`uiStore.c4ChangesetId`), never the Changesets view's
 *  open changeset (`uiStore.changesetId`). */
interface AppShellSearch {
  layer?: string;
  node?: string;
  edge?: string;
  changeset?: string;
  /** Architecture view: the C4 level (`context` | `container` | `component`). */
  level?: string;
  /** Architecture view, Component level: the C4 element whose parts are shown.
   *  There, `node` is the selected box (a C4 element id), not a model element. */
  scope?: string;
  /** Architecture view: the as-built changeset the `changeset` plan is compared
   *  with (`uiStore.c4BuiltId`). Only with `changeset`. */
  built?: string;
  /** Graph viewport `centerX,centerY,zoom` (see ui/graphViewport.ts). Model +
   *  Schema only. Kept on page-mode URLs too, so switching back to the graph
   *  returns to the same view. */
  vp?: string;
}

/** Combine layer/node/edge/changeset into one string so a single ref comparison
 *  (see prevSelectionKeyRef below) detects a change in any of them. */
function selectionKey(
  layerId: string | null,
  selectedId: string | null,
  selectedEdgeId: string | null,
  changesetId: string | null,
  c4: string,
): string {
  return `${layerId ?? ''}|${selectedId ?? ''}|${selectedEdgeId ?? ''}|${changesetId ?? ''}|${c4}`;
}

/** The Architecture view's part of the selection key: level, scope, selected box, overlaid changeset. */
function c4Key(
  level: C4Level,
  scope: string | null,
  selectedId: string | null,
  changesetId: string | null,
  builtId: string | null,
): string {
  return `${level}:${scope ?? ''}:${selectedId ?? ''}:${changesetId ?? ''}:${builtId ?? ''}`;
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
 * `:view` is the graph/page mode for Model + Schema (`/model/page?...`), so
 * the mode is part of every history entry too.
 *
 * store → URL: when the view, mode, or selection changes from inside the app,
 * push/replace the matching `/$section/$view?layer=...&node=...` (or
 * `?changeset=...`) so the hash always reflects the truth. Destination changes
 * PUSH a history entry: view, mode, layer, a deliberate navigation (see
 * `uiStore.navSeq`), or any selection change in page mode. Plain on-canvas
 * selection within a layer REPLACES the entry, so graph clicks don't flood
 * history. Guarded (mount ref + prev-value refs + an "already matches the
 * URL" check) so the two effects never ping-pong and back/forward never
 * pushes a duplicate entry.
 *
 * `?vp=` carries the graph viewport. It never pushes: Canvas records a
 * viewport when the user stops panning/zooming or the canvas recentres
 * itself, and the router replaces the current entry with it, so each history
 * entry ends up holding the last view seen there. Back/forward and reloads
 * restore it (Canvas applies it silently). It's only written while it belongs
 * to the live canvas (`graphCanvasKey`), so a layer or layout change drops it.
 */
function AppShellRoute() {
  const { section, view: viewParam } = useParams({ strict: false }) as {
    section?: string;
    view?: string;
  };
  const search = useSearch({ strict: false }) as AppShellSearch;
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const selectedEdgeId = useUiStore((s) => s.selectedEdgeId);
  const changesetId = useUiStore((s) => s.changesetId);
  const mode = useUiStore((s) => s.mode);
  const setMode = useUiStore((s) => s.setMode);
  const navSeq = useUiStore((s) => s.navSeq);
  const c4Level = useUiStore((s) => s.c4Level);
  const c4Scope = useUiStore((s) => s.c4Scope);
  const c4SelectedId = useUiStore((s) => s.c4SelectedId);
  const c4ChangesetId = useUiStore((s) => s.c4ChangesetId);
  const c4BuiltId = useUiStore((s) => s.c4BuiltId);
  const restoreC4 = useUiStore((s) => s.restoreC4);
  const graphViewport = useUiStore((s) => s.graphViewport);
  const canvasKey = useUiStore(graphCanvasKey);
  const setGraphViewport = useUiStore((s) => s.setGraphViewport);
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
  const prevSelectionKeyRef = useRef(
    selectionKey(layerId, selectedId, selectedEdgeId, changesetId, c4Key(c4Level, c4Scope, c4SelectedId, c4ChangesetId, c4BuiltId)),
  );
  const prevModeRef = useRef(mode);
  const prevLayerRef = useRef(layerId);
  const prevNavSeqRef = useRef(navSeq);
  const prevVpRef = useRef<string | undefined>(undefined);

  // URL → store: section/view (unchanged from before).
  useEffect(() => {
    const next = section ? SECTION_TO_VIEW[section] : undefined;
    if (next) setView(next);
  }, [section, setView]);

  // URL → store: graph/page mode, from the `:view` segment (Model + Schema).
  useEffect(() => {
    if (viewParam === 'graph' || viewParam === 'page') setMode(viewParam);
  }, [viewParam, setMode]);

  // URL → store: layer/node/changeset — deep link, shared URL, or
  // back/forward. Only acts on the field(s) actually present in the URL and
  // only when they differ from the store, so it never fights a change that
  // originated in the app itself (see the store → URL effect below).
  useEffect(() => {
    // Architecture: `?level=` / `?scope=` pick the diagram, `?node=` the
    // selected box, `?changeset=` the overlaid changeset (`?built=` the
    // as-built it is compared with). Its `node` is a C4
    // element id and its `changeset` the overlay's, so neither may reach the
    // Model selection or the Changesets view's changeset below.
    if (section === 'architecture') {
      const level = parseC4Level(search.level) ?? 'context';
      const scope = level === 'component' ? (search.scope ?? null) : null;
      const selected = search.node ?? null;
      const overlay = search.changeset ?? null;
      const built = overlay ? (search.built ?? null) : null;
      const s = useUiStore.getState();
      if (
        s.c4Level !== level ||
        s.c4Scope !== scope ||
        s.c4SelectedId !== selected ||
        s.c4ChangesetId !== overlay ||
        s.c4BuiltId !== built
      ) {
        restoreC4(level, scope, selected, overlay, built);
      }
      return;
    }
    if (search.changeset && search.changeset !== changesetId) {
      selectChangeset(search.changeset);
      return;
    }
    // A Changesets entry without `?changeset=` is the inbox: back/forward onto
    // it closes the changeset we're leaving.
    if (section === 'changesets' && !search.changeset && changesetId) {
      selectChangeset(null);
      return;
    }
    const layerChanged = !!search.layer && search.layer !== layerId;
    if (layerChanged) selectLayer(search.layer!);
    // An entry with a layer but no node or edge means nothing is selected in
    // it. Back/forward onto one must clear the selection we're leaving, or the
    // store → URL effect would write that node onto this older entry.
    // (`selectLayer` above already cleared it when the layer changed.)
    if (search.layer && !search.node && !search.edge && !layerChanged && (selectedId || selectedEdgeId)) {
      selectLayer(search.layer);
    }
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
  }, [section, search.layer, search.node, search.edge, search.changeset, search.level, search.scope, modelLoaded, model.links]);

  // URL → store: viewport. Runs after the selection effect above, so on
  // back/forward the layer it scopes to is already in the store. A URL with
  // no `?vp=` clears it, so a viewport from the entry we just left can't be
  // written onto this one. So does one recorded on a different layout or
  // display (its tag doesn't match): the store → URL effect then drops it
  // from the URL too.
  useEffect(() => {
    const s = useUiStore.getState();
    const scope = graphCanvasKey(s);
    const parsed = parseViewportParam(search.vp);
    const next = parsed && viewportParamFits(parsed, scope) ? parsed : null;
    const current = s.graphViewport;
    if (!next) {
      if (current) setGraphViewport(null);
      return;
    }
    if (current && current.scope === scope && sameViewport(current, next)) return;
    setGraphViewport({ scope, center: next.center, zoom: next.zoom });
  }, [section, search.layer, search.vp, setGraphViewport]);

  // store → URL. Push a history entry for a destination change — view,
  // graph/page mode, layer, a deliberate navigation (navSeq: cross-layer
  // links, relationship links, neighborhood-graph clicks), or any selection
  // change in page mode (each page is its own destination). Replace for plain
  // on-canvas selection within a layer so graph clicks don't flood history.
  // Skip first render — see mountedRef above.
  useEffect(() => {
    const key = selectionKey(
      layerId,
      selectedId,
      selectedEdgeId,
      changesetId,
      c4Key(c4Level, c4Scope, c4SelectedId, c4ChangesetId, c4BuiltId),
    );
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevViewRef.current = view;
      prevSelectionKeyRef.current = key;
      prevModeRef.current = mode;
      prevLayerRef.current = layerId;
      prevNavSeqRef.current = navSeq;
      prevVpRef.current = search.vp;
      return;
    }
    const viewChanged = prevViewRef.current !== view;
    const selectionChanged = prevSelectionKeyRef.current !== key;
    const modeChanged = prevModeRef.current !== mode;
    // A layer change from "no layer yet" is the data-driven default selection
    // landing, not a user navigation — pushing it would leave a dead entry
    // that Back can't leave (it re-defaults straight back).
    const layerChanged = prevLayerRef.current !== null && prevLayerRef.current !== layerId;
    const navigated = prevNavSeqRef.current !== navSeq;
    // Read live, not from this render's closure: the URL → store effect above
    // may have just seeded it in this same flush (a deep link, or StrictMode's
    // effect re-run in dev), and a stale null here would strip `?vp=`.
    const live = useUiStore.getState();
    const vp =
      view !== 'changesets' && view !== 'architecture' && live.graphViewport?.scope === graphCanvasKey(live)
        ? formatViewportParam(live.graphViewport)
        : undefined;
    const vpChanged = prevVpRef.current !== vp;
    if (!viewChanged && !selectionChanged && !modeChanged && !navigated && !vpChanged) return;
    prevViewRef.current = view;
    prevSelectionKeyRef.current = key;
    prevModeRef.current = mode;
    prevLayerRef.current = layerId;
    prevNavSeqRef.current = navSeq;
    prevVpRef.current = vp;

    const targetSection = VIEW_TO_SECTION[view];
    const targetView =
      view === 'changesets' || view === 'architecture' ? SECTION_DEFAULT_VIEW[targetSection] : mode;
    const targetSearch: AppShellSearch =
      view === 'architecture'
        ? {
            level: c4Level,
            scope: c4Level === 'component' ? (c4Scope ?? undefined) : undefined,
            node: c4SelectedId ?? undefined,
            changeset: c4ChangesetId ?? undefined,
            built: c4ChangesetId ? (c4BuiltId ?? undefined) : undefined,
          }
        : view === 'changesets'
        ? { changeset: changesetId ?? undefined }
        : {
            layer: layerId ?? undefined,
            // Mutually exclusive: selecting an edge already cleared
            // selectedId, so at most one of these is ever defined here.
            node: selectedId ?? undefined,
            edge: selectedEdgeId ?? undefined,
            vp,
          };

    // The store already matches the URL — this change came FROM the URL
    // (back/forward, a deep link). Navigating here would push a duplicate
    // entry and wipe the forward history.
    const destinationMatchesUrl =
      section === targetSection &&
      viewParam === targetView &&
      (search.layer ?? undefined) === targetSearch.layer &&
      (search.node ?? undefined) === targetSearch.node &&
      (search.edge ?? undefined) === targetSearch.edge &&
      (search.changeset ?? undefined) === targetSearch.changeset &&
      (search.level ?? undefined) === targetSearch.level &&
      (search.scope ?? undefined) === targetSearch.scope &&
      (search.built ?? undefined) === targetSearch.built;
    if (destinationMatchesUrl && (search.vp ?? undefined) === targetSearch.vp) {
      return;
    }

    // An Architecture URL that reads as this same diagram once normalized (no
    // or an unknown `?level=`, a `?scope=` the level ignores): spelling the
    // defaults out is no new destination, so replace — a push would leave a
    // level-less entry that Back lands on with nothing changing.
    const sameDiagramNormalized =
      view === 'architecture' &&
      section === targetSection &&
      (parseC4Level(search.level) ?? 'context') === targetSearch.level &&
      (targetSearch.level !== 'component' || (search.scope ?? undefined) === targetSearch.scope) &&
      (search.node ?? undefined) === targetSearch.node &&
      (search.changeset ?? undefined) === targetSearch.changeset &&
      (search.built ?? undefined) === targetSearch.built;

    // Only `?vp=` differs: a recorded viewport, or a stale one being dropped
    // after back/forward. Never a new destination, so always replace.
    const push =
      !destinationMatchesUrl &&
      !sameDiagramNormalized &&
      (viewChanged ||
        modeChanged ||
        layerChanged ||
        navigated ||
        (mode === 'page' && view !== 'architecture' && selectionChanged) ||
        // Opening or closing a changeset: the inbox and each changeset are
        // destinations of their own.
        (view === 'changesets' && selectionChanged));

    router.navigate({
      to: '/$section/$view',
      params: { section: targetSection, view: targetView },
      search: targetSearch,
      replace: !push,
    });
    // `search`/`section`/`viewParam` are read only for the "already matches"
    // guard; re-running on their own changes would re-check a URL the store
    // effects above are about to make it match.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, mode, layerId, selectedId, selectedEdgeId, changesetId, navSeq, graphViewport, canvasKey, c4Level, c4Scope, c4SelectedId, c4ChangesetId, c4BuiltId]);

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
    level: typeof search.level === 'string' ? search.level : undefined,
    scope: typeof search.scope === 'string' ? search.scope : undefined,
    built: typeof search.built === 'string' ? search.built : undefined,
    vp: typeof search.vp === 'string' ? search.vp : undefined,
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
