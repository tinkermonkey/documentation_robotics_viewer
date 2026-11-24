import { useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useParams,
  useSearch,
  createHashHistory,
} from '@tanstack/react-router';
import { AppShell } from './ui/AppShell';
import {
  CHECKOUT_SHELL_PATH,
  CheckoutPickerPage,
  CheckoutUnavailablePage,
} from './ui/CheckoutPicker';
import { CHANGESETS_VIEW, formatNext, isShellSection, readCliLink } from './routes/checkoutLinks';
import { sameCheckout, useCheckoutStore, type CheckoutRef } from './stores/checkoutStore';
import { chatService } from './services/chatService';
import { isCheckoutNotFound } from './data/checkoutScope';
import { useChangeset } from './data/useChangesets';
import { dottedId } from './data/modelGraph';
import { useUiStore, type ViewKind } from './ui/uiStore';
import {
  formatViewportParam,
  liveCanvasKey,
  parseViewportParam,
  sameViewport,
  viewportParamFits,
} from './ui/graphViewport';
import { decideHistoryStep, type LastPush } from './routes/historyPolicy';
import { formatOpenParam, parseOpenParam, parseSeqParam, sameList } from './routes/shellParams';
import { useAuthStore } from './stores/authStore';
import { useConnectionStore } from './stores/connectionStore';
import { websocketClient } from './services/websocketClient';
import { useModel } from './data/useModel';
import { parseC4Level, type C4Level } from './data/c4/c4Level';

/**
 * Root component — runs the WebSocket bootstrap effect (ported from the old
 * EmbeddedLayout): connect and set the token. The checkout feed subscription
 * is CheckoutShellRoute's. Renders the routed outlet.
 */
function RootShell() {
  const token = useAuthStore((state) => state.token);

  // Individual action selectors to avoid re-render loops from whole-store references.
  const setConnected = useConnectionStore((state) => state.setConnected);
  const setDisconnected = useConnectionStore((state) => state.setDisconnected);
  const setReconnecting = useConnectionStore((state) => state.setReconnecting);
  const setError = useConnectionStore((state) => state.setError);

  // The central process (dr serve) sends a checkout's events to the sockets
  // subscribed to that checkout: CheckoutShellRoute subscribes (through
  // websocketClient.setCheckout), and the client resubscribes on every connect.
  const handleConnect = useCallback(() => {
    console.log('[RootShell] WebSocket connected');
    setConnected();
    // A process answers again: one that was stopping is back (or replaced).
    useCheckoutStore.getState().clearUnavailable('stopping');
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
  /** Changesets view: the element whose change to select in `changeset` (the
   *  dr CLI's `changesets/<id>?element=<id>` link). Dropped once applied. */
  element?: string;
  /** Graph viewport `centerX,centerY,zoom,tag` (see ui/graphViewport.ts) of the
   *  canvas the view draws: the Model / Schema graph (kept on page-mode URLs
   *  too, so switching back to the graph returns to the same view), the Impact
   *  lanes or the C4 diagram. The tag scopes it to that canvas. */
  vp?: string;
  /** Changesets view: `impact` when the Impact tab is shown (absent: Review). */
  tab?: string;
  /** Changesets view: the reviewed change (`uiStore.changeSeq`), by sequence.
   *  A number, so the URL reads `seq=12` (a numeric string would be quoted). */
  seq?: number;
  /** Changesets view, Impact tab: the focused element (`uiStore.impactFocus`). */
  focus?: string;
  /** The opened lanes / groups (`uiStore.openGroups`), comma-separated: the
   *  Model by-type lanes' folded types, or the Impact tab's type groups. */
  open?: string;
}

/** The search params the router compares to tell a new destination from the
 *  one in the URL: every key but `vp` (and `element`, consumed on arrival). */
const COMPARED_KEYS = ['layer', 'node', 'edge', 'changeset', 'level', 'scope', 'built', 'tab', 'seq', 'focus', 'open'] as const;

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
 * `?changeset=...`) so the hash always reflects the truth. Whether it pushes,
 * replaces or coalesces is `routes/historyPolicy.ts`'s `decideHistoryStep`
 * (#619): a destination change (view, mode, layer, tab, an opened changeset,
 * a deliberate navigation via `uiStore.navSeq`, a selection in page mode)
 * pushes; so does a graph move (`uiStore.graphMove`: a selection in a graph, an
 * Impact focus, a lane or group opened). A viewport dwell or fit replaces; a
 * recentre coalesces with the selection it centres on, and a repeat of the
 * last push within a double-click coalesces too. Guarded (mount ref +
 * prev-value refs + an "already matches the URL" check) so the two effects
 * never ping-pong and back/forward never pushes a duplicate entry.
 *
 * `?vp=` carries the viewport of the canvas the view draws (`liveCanvasKey`:
 * the Model / Schema graph, the Impact lanes, the C4 diagram). Each history
 * entry holds the last view seen there; back/forward and reloads restore it
 * silently. It's only written while it belongs to the live canvas, so a
 * layer, layout, focus or diagram change drops it.
 */
function AppShellRoute({ checkout }: { checkout: CheckoutRef }) {
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
  const canvasKey = useUiStore(liveCanvasKey);
  const changesetTab = useUiStore((s) => s.changesetTab);
  const changeSeq = useUiStore((s) => s.changeSeq);
  const impactFocus = useUiStore((s) => s.impactFocus);
  const openGroups = useUiStore((s) => s.openGroups);
  const modelView = useUiStore((s) => s.modelView);
  const graphMove = useUiStore((s) => s.graphMove);
  const restoreChangeset = useUiStore((s) => s.restoreChangeset);
  const restoreOpenGroups = useUiStore((s) => s.restoreOpenGroups);
  const setGraphViewport = useUiStore((s) => s.setGraphViewport);
  const selectLayer = useUiStore((s) => s.selectLayer);
  const selectNode = useUiStore((s) => s.selectNode);
  const selectEdge = useUiStore((s) => s.selectEdge);
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
  const prevTabRef = useRef(useUiStore.getState().changesetTab);
  const prevMoveSeqRef = useRef(0);
  const prevStateKeyRef = useRef<string | null>(null);
  // The last push this tab made, so a repeat of it (a double-click) or the
  // recentre that follows it coalesces (see routes/historyPolicy.ts).
  const lastPushRef = useRef<LastPush | null>(null);

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
    // Changesets: the open changeset (none: the inbox, so back/forward onto
    // it closes the one we're leaving), its tab, reviewed change, Impact focus
    // and opened groups, restored in one write.
    if (section === 'changesets') {
      const id = search.changeset ?? null;
      const next = {
        changesetId: id,
        tab: search.tab === 'impact' ? ('impact' as const) : ('changes' as const),
        seq: parseSeqParam(search.seq),
        focus: search.focus ?? null,
        open: parseOpenParam(search.open),
      };
      const s = useUiStore.getState();
      const differs =
        s.view !== 'changesets' ||
        s.changesetId !== id ||
        (id !== null &&
          (s.changesetTab !== next.tab ||
            s.changeSeq !== next.seq ||
            s.impactFocus !== next.focus ||
            !sameList(s.openGroups, next.open)));
      if (differs) restoreChangeset(next);
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
    // The by-type lanes' opened types (after selectLayer, which clears them).
    if (section === 'model') {
      const open = parseOpenParam(search.open);
      if (!sameList(useUiStore.getState().openGroups, open)) restoreOpenGroups(open);
    }
    // Deliberately keyed on the URL values (plus the model data `?edge=`
    // validation needs) only — reacting to the rest of the store here too
    // would make this effect re-fire the moment IT calls
    // selectLayer/selectNode/selectEdge/selectChangeset, fighting its own update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, search.layer, search.node, search.edge, search.changeset, search.level, search.scope, search.built, search.tab, search.seq, search.focus, search.open, modelLoaded, model.links]);

  // URL → store: viewport. Runs after the selection effect above, so on
  // back/forward the layer it scopes to is already in the store. A URL with
  // no `?vp=` clears it, so a viewport from the entry we just left can't be
  // written onto this one. So does one recorded on a different layout or
  // display (its tag doesn't match): the store → URL effect then drops it
  // from the URL too.
  useEffect(() => {
    const s = useUiStore.getState();
    const scope = liveCanvasKey(s);
    const parsed = parseViewportParam(search.vp);
    const next = scope && parsed && viewportParamFits(parsed, scope) ? parsed : null;
    const current = s.graphViewport;
    if (!next || !scope) {
      if (current) setGraphViewport(null);
      return;
    }
    if (current && current.scope === scope && sameViewport(current, next)) return;
    setGraphViewport({ scope, center: next.center, zoom: next.zoom });
  }, [section, search.layer, search.vp, search.changeset, search.tab, search.focus, search.level, search.scope, search.built, setGraphViewport]);

  // store → URL, through the history policy (routes/historyPolicy.ts): a
  // destination change or a graph move pushes, a dwell or fit replaces, a
  // recentre or a double-click coalesces. Skip first render — see mountedRef.
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
      prevTabRef.current = changesetTab;
      prevMoveSeqRef.current = graphMove?.seq ?? 0;
      return;
    }
    // Read live, not from this render's closure: the URL → store effect above
    // may have just seeded the viewport in this same flush (a deep link, or
    // StrictMode's effect re-run in dev), and a stale null here would strip `?vp=`.
    const live = useUiStore.getState();
    const canvas = liveCanvasKey(live);
    const liveVp = live.graphViewport;
    const vp = canvas && liveVp && liveVp.scope === canvas ? formatViewportParam(liveVp) : undefined;

    const targetSection = VIEW_TO_SECTION[view];
    const targetView =
      view === 'changesets' || view === 'architecture' ? SECTION_DEFAULT_VIEW[targetSection] : mode;
    const impactTab = !!changesetId && changesetTab === 'impact';
    const targetSearch: AppShellSearch =
      view === 'architecture'
        ? {
            level: c4Level,
            scope: c4Level === 'component' ? (c4Scope ?? undefined) : undefined,
            node: c4SelectedId ?? undefined,
            changeset: c4ChangesetId ?? undefined,
            built: c4ChangesetId ? (c4BuiltId ?? undefined) : undefined,
            vp,
          }
        : view === 'changesets'
        ? {
            changeset: changesetId ?? undefined,
            tab: impactTab ? 'impact' : undefined,
            seq: changesetId && changeSeq !== null ? changeSeq : undefined,
            // Kept on the Review tab too, so returning to Impact finds them.
            focus: changesetId ? (impactFocus ?? undefined) : undefined,
            open: changesetId ? formatOpenParam(openGroups) : undefined,
            vp,
          }
        : {
            layer: layerId ?? undefined,
            // Mutually exclusive: selecting an edge already cleared
            // selectedId, so at most one of these is ever defined here.
            node: selectedId ?? undefined,
            edge: selectedEdgeId ?? undefined,
            open: view === 'model' && modelView === 'type-lanes' ? formatOpenParam(openGroups) : undefined,
            vp,
          };
    const stateKey = `${targetSection}/${targetView}?${COMPARED_KEYS.map((k) => targetSearch[k] ?? '').join('&')}`;

    const viewChanged = prevViewRef.current !== view;
    const selectionChanged = prevSelectionKeyRef.current !== key;
    const modeChanged = prevModeRef.current !== mode;
    // A layer change from "no layer yet" is the data-driven default selection
    // landing, not a user navigation — pushing it would leave a dead entry
    // that Back can't leave (it re-defaults straight back).
    const layerChanged = prevLayerRef.current !== null && prevLayerRef.current !== layerId;
    const navigated = prevNavSeqRef.current !== navSeq;
    const tabChanged = view === 'changesets' && prevTabRef.current !== changesetTab;
    const move = graphMove && graphMove.seq !== prevMoveSeqRef.current ? graphMove : null;
    const vpChanged = prevVpRef.current !== vp;
    const stateChanged = prevStateKeyRef.current !== stateKey;
    if (!viewChanged && !selectionChanged && !modeChanged && !navigated && !vpChanged && !stateChanged && !move && !tabChanged) return;
    prevViewRef.current = view;
    prevSelectionKeyRef.current = key;
    prevModeRef.current = mode;
    prevLayerRef.current = layerId;
    prevNavSeqRef.current = navSeq;
    prevVpRef.current = vp;
    prevTabRef.current = changesetTab;
    prevStateKeyRef.current = stateKey;
    if (graphMove) prevMoveSeqRef.current = graphMove.seq;

    // The store already matches the URL — this change came FROM the URL
    // (back/forward, a deep link). Navigating here would push a duplicate
    // entry and wipe the forward history.
    const destinationMatchesUrl =
      section === targetSection &&
      viewParam === targetView &&
      COMPARED_KEYS.every((k) => (search[k] ?? undefined) === targetSearch[k]);
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

    const destination =
      viewChanged ||
      modeChanged ||
      layerChanged ||
      navigated ||
      tabChanged ||
      (mode === 'page' && view !== 'architecture' && view !== 'changesets' && selectionChanged) ||
      // Opening or closing a changeset: the inbox and each changeset are
      // destinations of their own.
      (view === 'changesets' && selectionChanged);
    const step =
      destinationMatchesUrl || sameDiagramNormalized
        ? 'replace'
        : decideHistoryStep({
            destination,
            move,
            entrySelection: search.node ?? search.edge ?? search.focus ?? null,
            lastPush: lastPushRef.current,
          });
    if (step === 'push') {
      lastPushRef.current =
        move && !destination
          ? { kind: move.kind, target: move.target, at: move.at }
          : { kind: 'destination', target: selectedId ?? c4SelectedId ?? impactFocus, at: Date.now() };
    }

    router.navigate({
      to: CHECKOUT_SHELL_PATH,
      params: { project: checkout.project, checkout: checkout.checkout, section: targetSection, view: targetView },
      search: targetSearch,
      replace: step !== 'push',
    });
    // `search`/`section`/`viewParam` are read only for the "already matches"
    // guard; re-running on their own changes would re-check a URL the store
    // effects above are about to make it match.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, mode, layerId, selectedId, selectedEdgeId, changesetId, changesetTab, changeSeq, impactFocus, openGroups, modelView, navSeq, graphViewport, graphMove, canvasKey, c4Level, c4Scope, c4SelectedId, c4ChangesetId, c4BuiltId]);

  // `?element=` (the dr CLI's changeset link with an element): once the
  // changeset's detail is here, select its change to that element (the first,
  // by sequence), then drop the parameter so it isn't applied again.
  const linkedChangeset = section === 'changesets' && search.element ? (search.changeset ?? null) : null;
  const { detail: linkedDetail, isError: linkedFailed } = useChangeset(linkedChangeset);
  useEffect(() => {
    if (!linkedChangeset || !search.element) return;
    if (!linkedDetail && !linkedFailed) return;
    if (linkedDetail && useUiStore.getState().changesetId === linkedChangeset) {
      const change = [...linkedDetail.changes]
        .filter((c) => c.elementId === search.element)
        .sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))[0];
      // Not selectChange: arriving by a link is not a move of its own to push.
      if (change?.sequenceNumber !== undefined) useUiStore.setState({ changeSeq: change.sequenceNumber });
    } else if (linkedDetail) {
      return; // the URL → store effect hasn't opened the changeset yet
    }
    router.navigate({ to: '.', search: (prev: AppShellSearch) => ({ ...prev, element: undefined }), replace: true } as never);
  }, [linkedChangeset, search.element, linkedDetail, linkedFailed]);

  return <AppShell />;
}

/** The search params a shell route keeps (unknown ones, and `token`, are dropped). */
function validateShellSearch(search: Record<string, unknown>): AppShellSearch {
  const str = (key: string) => (typeof search[key] === 'string' ? (search[key] as string) : undefined);
  return {
    layer: str('layer'),
    node: str('node'),
    edge: str('edge'),
    changeset: str('changeset'),
    element: str('element'),
    level: str('level'),
    scope: str('scope'),
    built: str('built'),
    vp: str('vp'),
    tab: str('tab'),
    seq: parseSeqParam(search.seq) ?? undefined,
    focus: str('focus'),
    open: str('open'),
  };
}

/**
 * Keeps the checkout the route names in force: the store every data hook
 * reads, the websocket's feed subscription and the DrBot conversation. Runs
 * before the shell's own effects, so no query is made for the checkout before.
 */
function useCheckoutInForce(checkout: CheckoutRef) {
  const { project, checkout: name } = checkout;
  useLayoutEffect(() => {
    const ref = { project, checkout: name };
    // Another checkout than the one this tab showed (a switch, a link, Back):
    // its selection was that checkout's. Compared with the store, not this
    // component, which remounts when the route changes shape.
    const previous = useCheckoutStore.getState().ref;
    if (previous && !sameCheckout(previous, ref)) {
      useUiStore.getState().clearCheckoutSelection();
    }
    useCheckoutStore.getState().setRef(ref);
    websocketClient.setCheckout(ref);
    chatService.setCheckout(ref);
  }, [project, name]);

  // The server says the checkout went away, or that it is stopping.
  useEffect(() => {
    const ref = { project, checkout: name };
    const onRemoved = (message: unknown) => {
      const m = (message ?? {}) as { message?: unknown };
      useCheckoutStore.getState().markUnavailable(ref, {
        reason: 'removed',
        ...(typeof m.message === 'string' ? { message: m.message } : {}),
      });
    };
    const onStopping = () => useCheckoutStore.getState().markUnavailable(ref, { reason: 'stopping' });
    websocketClient.on(CHECKOUT_REMOVED_EVENT, onRemoved);
    websocketClient.on(SERVER_STOPPING_EVENT, onStopping);
    return () => {
      websocketClient.off(CHECKOUT_REMOVED_EVENT, onRemoved);
      websocketClient.off(SERVER_STOPPING_EVENT, onStopping);
    };
  }, [project, name]);
}

/** The central process's notice that a checkout is gone (its subscribers only). */
export const CHECKOUT_REMOVED_EVENT = 'checkout.removed';
/** The central process's notice that it is shutting down. */
export const SERVER_STOPPING_EVENT = 'server.stopping';

/**
 * `/#/p/:project/c/:checkout/:section/:view` — one checkout's shell. Reads the
 * dr CLI's link forms first (`changesets/<id>`, `elements/<id>`) and replaces
 * them with the page they open; shows the unavailable page instead of the
 * views when the checkout can't be served.
 */
function CheckoutShellRoute() {
  const { project, checkout, section, view } = useParams({ strict: false }) as {
    project: string;
    checkout: string;
    section: string;
    view: string;
  };
  const search = useSearch({ strict: false }) as AppShellSearch;
  const ref = { project, checkout };
  useCheckoutInForce(ref);
  const storeRef = useCheckoutStore((s) => s.ref);
  const unavailable = useCheckoutStore((s) => s.unavailable);
  const inForce = storeRef?.project === project && storeRef?.checkout === checkout;

  const link = readCliLink(section, view, search.element);
  const unknownSection = !link && !isShellSection(section);

  // A changeset link (or an unknown section) is replaced by the page it means.
  useEffect(() => {
    if (link?.kind === 'changeset') {
      router.navigate({
        to: CHECKOUT_SHELL_PATH,
        params: { project, checkout, section: 'changesets', view: CHANGESETS_VIEW },
        search: { changeset: link.changesetId, element: link.element },
        replace: true,
      });
    } else if (unknownSection) {
      router.navigate({
        to: CHECKOUT_SHELL_PATH,
        params: { project, checkout, section: 'model', view: 'graph' },
        search: {},
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, checkout, section, view]);

  if (!inForce) return null;
  if (unavailable) return <CheckoutUnavailablePage checkout={ref} unavailable={unavailable} />;
  if (link?.kind === 'element') return <ElementLink checkout={ref} elementId={link.elementId} />;
  if (link || unknownSection) return null;
  return (
    <>
      <CheckoutNotFoundWatch checkout={ref} />
      <AppShellRoute checkout={ref} />
    </>
  );
}

/** Marks the checkout unavailable when its model read answers 404. */
function CheckoutNotFoundWatch({ checkout }: { checkout: CheckoutRef }) {
  const { error } = useModel();
  useEffect(() => {
    if (!isCheckoutNotFound(error)) return;
    const message = (error as { serverMessage?: string }).serverMessage;
    useCheckoutStore.getState().markUnavailable(checkout, { reason: 'not-found', ...(message ? { message } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, checkout.project, checkout.checkout]);
  return null;
}

/**
 * `elements/<id>` — the dr CLI's element link. Waits for the model, finds the
 * element by its dotted id (or UUID) and replaces the link with the Model view
 * on that element's layer, the element selected.
 */
function ElementLink({ checkout, elementId }: { checkout: CheckoutRef; elementId: string }) {
  const { derived, isSuccess, error } = useModel();
  const node = isSuccess ? derived.nodes.find((n) => n.id === elementId || dottedId(n) === elementId) : undefined;
  useEffect(() => {
    if (!isSuccess || !node) return;
    router.navigate({
      to: CHECKOUT_SHELL_PATH,
      params: { project: checkout.project, checkout: checkout.checkout, section: 'model', view: 'graph' },
      search: { layer: node.layer_id, node: node.id },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, node?.id]);

  if (isCheckoutNotFound(error)) return <CheckoutNotFoundWatch checkout={checkout} />;
  if (!isSuccess || node) {
    return (
      <p role="status" style={{ padding: 24, color: 'rgb(var(--shell-fg-2))', background: 'rgb(var(--shell-bg))', minHeight: '100vh', margin: 0 }}>
        Opening {elementId}…
      </p>
    );
  }
  return (
    <main
      data-testid="element-link-missing"
      style={{ padding: 24, color: 'rgb(var(--shell-fg-1))', background: 'rgb(var(--shell-bg))', minHeight: '100vh' }}
    >
      <p style={{ fontSize: 14 }}>
        The model of checkout {checkout.checkout} of project {checkout.project} has no element {elementId}.
      </p>
      <button
        type="button"
        className="drv-linkbtn"
        onClick={() =>
          router.navigate({
            to: CHECKOUT_SHELL_PATH,
            params: { project: checkout.project, checkout: checkout.checkout, section: 'model', view: 'graph' },
            search: {},
            replace: true,
          })
        }
      >
        Open the model
      </button>
    </main>
  );
}

/** `/#/p/:project/c/:checkout` (the CLI's checkout link): the checkout's Model view. */
function CheckoutIndexRoute() {
  const { project, checkout } = useParams({ strict: false }) as { project: string; checkout: string };
  useEffect(() => {
    router.navigate({
      to: CHECKOUT_SHELL_PATH,
      params: { project, checkout, section: 'model', view: 'graph' },
      search: {},
      replace: true,
    });
  }, [project, checkout]);
  return null;
}

/** A bare `/#/`: no project named, so the picker. */
function IndexRoute() {
  return <CheckoutPickerPage />;
}

/** An old unscoped `/#/:section/:view` link: the picker, which opens it in the checkout chosen. */
function LegacyShellRoute() {
  const { section, view } = useParams({ strict: false }) as { section: string; view: string };
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  return <CheckoutPickerPage next={formatNext(section, view, search)} />;
}

const rootRoute = createRootRoute({
  component: RootShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRoute,
});

const legacyShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$section/$view',
  validateSearch: validateShellSearch,
  component: LegacyShellRoute,
});

const checkoutIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/$project/c/$checkout',
  component: CheckoutIndexRoute,
});

const checkoutShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: CHECKOUT_SHELL_PATH,
  validateSearch: validateShellSearch,
  component: CheckoutShellRoute,
});

const routeTree = rootRoute.addChildren([indexRoute, legacyShellRoute, checkoutIndexRoute, checkoutShellRoute]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
