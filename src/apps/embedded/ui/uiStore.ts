/**
 * UI store — drives the static 5-pane shell (view / layer / selection /
 * changeset, canvas dark mode, chat drawer, responsive width, and the nav
 * tree's expanded sections + layers).
 *
 * This is the single source of truth for presentation state. Data state lives
 * in React Query (see `data/`); connection state lives in `connectionStore`.
 *
 * A subset of fields persist to localStorage (see `partialize` below) — the
 * canvas theme, the DrBot drawer's open/closed state, and the graph
 * layout/display settings (graphLayout/showClusterBoundaries/
 * showAllRelations/nodeMarginPreset/nodeDisplay). Navigation state (view/layerId/
 * selectedId/changesetId/mode/focus/expanded*) is deliberately NOT persisted
 * here — that's the URL router's job (see router.tsx), so the two mechanisms
 * don't fight over which one is authoritative for "where you are."
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ViewKind = 'model' | 'spec' | 'changesets';
export type CanvasMode = 'graph' | 'page';
export type PageFocus = 'layer' | 'node';
export type GraphLayout = 'force' | 'galaxy' | 'force-clustered';
export type NodeMarginPreset = 'tight' | 'default' | 'wide';
export type NodeDisplay = 'card' | 'pill';

interface UiState {
  view: ViewKind;
  layerId: string | null;
  selectedId: string | null;
  /** Selected Model graph edge (a link id), mutually exclusive with `selectedId`
   *  (ADR-6) — selecting one always clears the other. Drives the Inspector's
   *  edge branch (source/edge/destination) and round-trips through the URL's
   *  `?edge=` param, same as `selectedId`'s `?node=`. Edges only exist in the
   *  Model view's graph, so nothing else needs to clear this on a Schema
   *  selection beyond the existing view-switch clearing. */
  selectedEdgeId: string | null;
  /** Edge currently rendered with the `variant: 'hot'` highlight (ADR-3) —
   *  driven by hover (see `useEdgeInteraction`), independent of click
   *  selection: hovering a different edge than the selected one previews it
   *  without disturbing `selectedEdgeId`. Not persisted or URL-synced —
   *  purely a transient visual cue. */
  highlightedEdgeId: string | null;
  changesetId: string | null;
  canvasDark: boolean;
  chatOpen: boolean;
  wide: boolean;
  /** Main-panel mode for Model/Schema: the live graph, or the page-view detail scaffold. */
  mode: CanvasMode;
  /** Which record the page view renders when `mode === 'page'` — the active
   *  layer's overview, or the selected node's detail. Set by the same
   *  selection actions that drive `selectedId` (see each action below). */
  focus: PageFocus;
  /** Section ids currently expanded in the nav tree (e.g. 'model'). */
  expandedSections: Set<string>;
  /** Layer keys currently expanded in the nav tree (e.g. 'model:data-model'). */
  expandedLayers: Set<string>;

  /** GraphCanvas layout engine for the Model/Schema graph. Global (not per-layer),
   *  same as canvasDark/mode. Defaults to 'force' — the pre-Heimdall-0.6.0 behavior. */
  graphLayout: GraphLayout;
  /** Whether galaxy/force-clustered draw a boundary circle per top-level group.
   *  No effect under layout 'force'. */
  showClusterBoundaries: boolean;
  /** Whether every edge is shown, or only edges GraphCanvas classifies as
   *  structural (see data/predicates.ts). Defaults to true (every edge visible)
   *  to match pre-Heimdall-0.6.0 behavior — 'Structural' is the new opt-in filter. */
  showAllRelations: boolean;
  /** nodeMargin preset for force/force-clustered (galaxy already defaults to the
   *  'tight' behavior). 'default' leaves nodeMargin unset (GraphCanvas's own
   *  per-engine default). */
  nodeMarginPreset: NodeMarginPreset;
  /** Model graph node presentation: 'card' shows type + intra/inter-layer
   *  connection counts (see data/modelGraph.ts's nodesWithCardData), 'pill' is
   *  the original compact GraphNode. Only meaningful in the Model view — the
   *  Schema view's node-type graph always uses the default pill. Defaults to
   *  'card'. */
  nodeDisplay: NodeDisplay;

  setView: (view: ViewKind) => void;
  selectLayer: (layerId: string) => void;
  /**
   * Select a node/element by id (always sets `focus: 'node'`). Takes a
   * non-nullable id on purpose — pairing `selectedId: null` with
   * `focus: 'node'` would be an inconsistent state (page-mode's `focus`
   * implies a real node is selected). Use `selectLayer` to clear back to a
   * layer-level selection instead of calling this with `null`.
   */
  selectNode: (selectedId: string) => void;
  /** Select a node clicked in the graph canvas (current layer). */
  selectGraphNode: (selectedId: string) => void;
  /** Select an edge clicked in the Model graph (a link id) — clears any node
   *  selection (ADR-6: mutually exclusive). */
  selectEdge: (edgeId: string) => void;
  /** Edge currently previewed as `variant: 'hot'` via hover; `null` clears it.
   *  See `highlightedEdgeId` above. */
  setHighlightedEdgeId: (edgeId: string | null) => void;
  /**
   * Navigate to an element by id, switching the active layer when it lives in
   * another layer (cross-layer relationship navigation). Stays in the Model
   * view and keeps the nav tree's section/layer expanded.
   */
  navigateToElement: (elementId: string, layerId: string) => void;
  /**
   * Same as `navigateToElement`, but also sets `highlightedEdgeId` and forces
   * `mode: 'graph'` so the arriving GRAPH (not the page-view scaffold, which
   * renders no edges at all) renders the given edge in its `hot` variant
   * (clicking an edge predicate reference navigates to the edge's source
   * node with the edge highlighted) — unlike every other navigation action
   * here, which deliberately leaves `mode` alone
   * ("mode toggle persists across selections"), this one's entire point is
   * showing the graph, so forcing it is the correct exception rather than a
   * violation of that rule. The highlight is transient — every other explicit
   * selection action clears `highlightedEdgeId` back to `null` (see each
   * action below), so it never lingers past the next click.
   */
  navigateToElementWithEdge: (elementId: string, layerId: string, edgeId: string) => void;
  /**
   * Navigate to a spec node-type by its `spec_node_id`, switching the active
   * layer when it lives in another layer (cross-layer relationship navigation
   * in the Schema view). Stays in the Schema view and keeps the nav tree's
   * section/layer expanded.
   */
  navigateToSpecNode: (specNodeId: string, layerId: string) => void;
  selectChangeset: (changesetId: string | null) => void;
  /** Switch the main panel between the live graph and the page-view scaffold.
   *  Persists across layer/node selections (design's "mode toggle persists"). */
  setMode: (mode: CanvasMode) => void;
  toggleCanvasDark: () => void;
  toggleChat: () => void;
  /** Toggle a nav section's expanded state and activate its view. */
  toggleSection: (sectionId: string) => void;
  /** Toggle a layer row's expanded state under a section. */
  toggleLayer: (sectionId: string, layerId: string) => void;
  setWide: (wide: boolean) => void;
  setGraphLayout: (layout: GraphLayout) => void;
  toggleClusterBoundaries: () => void;
  toggleShowAllRelations: () => void;
  setNodeMarginPreset: (preset: NodeMarginPreset) => void;
  setNodeDisplay: (nodeDisplay: NodeDisplay) => void;
}

const initialWide =
  typeof window !== 'undefined' ? window.innerWidth >= 1300 : false;

function applyCanvasDark(dark: boolean): void {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('dark-canvas', dark);
  }
}

const layerKey = (sectionId: string, layerId: string) =>
  `${sectionId}:${layerId}`;

/** localStorage key for the persisted preference subset (see the module doc
 *  comment above for exactly which fields). Exported for tests. */
export const PERSIST_KEY = 'dr-viewer-ui-preferences';

/** window-guarded storage passthrough — safe to import in a non-browser
 *  context (SSR, a Node-env test file with no happy-dom pragma) without
 *  crashing at module-load time, matching this file's existing
 *  `typeof window !== 'undefined'` guards elsewhere. */
const safeStorage = {
  getItem: (name: string) =>
    typeof window !== 'undefined' ? window.localStorage.getItem(name) : null,
  setItem: (name: string, value: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(name);
  },
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      view: 'model',
      layerId: null,
      selectedId: null,
      selectedEdgeId: null,
      highlightedEdgeId: null,
      changesetId: null,
      // Dark by default (first visit, nothing persisted yet) — a later
      // explicit choice via toggleCanvasDark persists and overrides this.
      canvasDark: true,
      chatOpen: initialWide,
      wide: initialWide,
      mode: 'graph',
      focus: 'layer',
      expandedSections: new Set<string>(['model']),
      expandedLayers: new Set<string>(),
      graphLayout: 'force',
      showClusterBoundaries: true,
      showAllRelations: true,
      nodeMarginPreset: 'default',
      nodeDisplay: 'card',

      setView: (view) => set({ view }),

      selectLayer: (layerId) =>
        set((s) => {
          const expandedLayers = new Set(s.expandedLayers);
          expandedLayers.add(layerKey(s.view, layerId));
          return {
            layerId,
            selectedId: null,
            selectedEdgeId: null,
            highlightedEdgeId: null,
            focus: 'layer',
            expandedSections: new Set(s.expandedSections).add(s.view),
            expandedLayers,
          };
        }),

      selectNode: (selectedId) =>
        set({ selectedId, selectedEdgeId: null, highlightedEdgeId: null, focus: 'node' }),

      selectGraphNode: (selectedId) =>
        set((s) => ({
          selectedId,
          selectedEdgeId: null,
          highlightedEdgeId: null,
          focus: 'node',
          expandedSections: new Set(s.expandedSections).add(s.view),
          expandedLayers: s.layerId
            ? new Set(s.expandedLayers).add(layerKey(s.view, s.layerId))
            : s.expandedLayers,
        })),

      selectEdge: (selectedEdgeId) =>
        set({ selectedEdgeId, selectedId: null, highlightedEdgeId: null, focus: 'layer' }),

      setHighlightedEdgeId: (highlightedEdgeId) => set({ highlightedEdgeId }),

      navigateToElement: (elementId, layerId) =>
        set((s) => {
          const sameLayer = s.layerId === layerId;
          const expandedLayers = sameLayer
            ? s.expandedLayers
            : new Set(s.expandedLayers).add(layerKey('model', layerId));
          return {
            view: 'model',
            layerId,
            selectedId: elementId,
            selectedEdgeId: null,
            highlightedEdgeId: null,
            focus: 'node',
            expandedSections: new Set(s.expandedSections).add('model'),
            expandedLayers,
          };
        }),

      navigateToElementWithEdge: (elementId, layerId, edgeId) =>
        set((s) => {
          const sameLayer = s.layerId === layerId;
          const expandedLayers = sameLayer
            ? s.expandedLayers
            : new Set(s.expandedLayers).add(layerKey('model', layerId));
          return {
            view: 'model',
            mode: 'graph',
            layerId,
            selectedId: elementId,
            selectedEdgeId: null,
            highlightedEdgeId: edgeId,
            focus: 'node',
            expandedSections: new Set(s.expandedSections).add('model'),
            expandedLayers,
          };
        }),

      navigateToSpecNode: (specNodeId, layerId) =>
        set((s) => {
          const sameLayer = s.layerId === layerId;
          const expandedLayers = sameLayer
            ? s.expandedLayers
            : new Set(s.expandedLayers).add(layerKey('spec', layerId));
          return {
            view: 'spec',
            layerId,
            selectedId: specNodeId,
            selectedEdgeId: null,
            highlightedEdgeId: null,
            focus: 'node',
            expandedSections: new Set(s.expandedSections).add('spec'),
            expandedLayers,
          };
        }),

      selectChangeset: (changesetId) =>
        set((s) => ({
          view: 'changesets',
          changesetId,
          highlightedEdgeId: null,
          expandedSections: new Set(s.expandedSections).add('changesets'),
        })),

      setMode: (mode) => set({ mode }),

      toggleCanvasDark: () =>
        set((s) => {
          const canvasDark = !s.canvasDark;
          applyCanvasDark(canvasDark);
          return { canvasDark };
        }),

      toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),

      toggleSection: (sectionId) =>
        set((s) => {
          const expandedSections = new Set(s.expandedSections);
          if (expandedSections.has(sectionId)) {
            expandedSections.delete(sectionId);
          } else {
            expandedSections.add(sectionId);
          }
          const viewChanged = s.view !== sectionId;
          return {
            view: sectionId as ViewKind,
            expandedSections,
            // selectedId isn't portable across views (a Model instance UUID
            // means nothing in Schema, and vice versa) — clear it on a genuine
            // view switch so a stale cross-view selection doesn't get baked
            // into the URL by the router's store -> URL sync (it would
            // otherwise push e.g. ?layer=apm&node=<stale-model-uuid> onto the
            // Schema view, a dead link nothing resolves). layerId IS portable
            // (both views share the same 12 layer slugs), so it's left as-is —
            // switching sections keeps you on the same layer, just the other
            // view of it. Toggling the ALREADY-active section's own
            // expand/collapse isn't a view switch, so selection is untouched.
            ...(viewChanged
              ? { selectedId: null, selectedEdgeId: null, highlightedEdgeId: null, focus: 'layer' as const }
              : {}),
          };
        }),

      toggleLayer: (sectionId, layerId) =>
        set((s) => {
          const key = layerKey(sectionId, layerId);
          const expandedLayers = new Set(s.expandedLayers);
          const collapsing = expandedLayers.has(key);
          if (collapsing) {
            expandedLayers.delete(key);
          } else {
            expandedLayers.add(key);
          }
          return {
            view: sectionId as ViewKind,
            layerId,
            selectedId: collapsing ? s.selectedId : null,
            selectedEdgeId: collapsing ? s.selectedEdgeId : null,
            highlightedEdgeId: collapsing ? s.highlightedEdgeId : null,
            focus: collapsing ? s.focus : 'layer',
            expandedSections: new Set(s.expandedSections).add(sectionId),
            expandedLayers,
          };
        }),

      setWide: (wide) => set({ wide }),

      setGraphLayout: (graphLayout) => set({ graphLayout }),

      toggleClusterBoundaries: () =>
        set((s) => ({ showClusterBoundaries: !s.showClusterBoundaries })),

      toggleShowAllRelations: () =>
        set((s) => ({ showAllRelations: !s.showAllRelations })),

      setNodeMarginPreset: (nodeMarginPreset) => set({ nodeMarginPreset }),

      setNodeDisplay: (nodeDisplay) => set({ nodeDisplay }),
    }),
    {
      name: PERSIST_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // Only these survive a reload — see the module doc comment for why
      // navigation state is excluded (the URL router owns that instead).
      partialize: (state) => ({
        canvasDark: state.canvasDark,
        chatOpen: state.chatOpen,
        graphLayout: state.graphLayout,
        showClusterBoundaries: state.showClusterBoundaries,
        showAllRelations: state.showAllRelations,
        nodeMarginPreset: state.nodeMarginPreset,
        nodeDisplay: state.nodeDisplay,
      }),
      // Re-sync body.dark-canvas once hydration lands — covers both "restored
      // a persisted value" and "nothing was persisted, using the true
      // default" (this callback fires either way).
      onRehydrateStorage: () => (state) => {
        if (state) applyCanvasDark(state.canvasDark);
      },
    },
  ),
);

/** Seed `body.dark-canvas` from the initial (hydration-resolved) store state —
 *  localStorage hydration is synchronous, so `getState()` here already
 *  reflects it; this is a belt-and-suspenders call alongside
 *  onRehydrateStorage above, not the only place this runs. */
if (typeof document !== 'undefined') {
  applyCanvasDark(useUiStore.getState().canvasDark);
}

const VALID_GRAPH_LAYOUTS: ReadonlySet<GraphLayout> = new Set([
  'force',
  'galaxy',
  'force-clustered',
]);
const VALID_NODE_MARGIN_PRESETS: ReadonlySet<NodeMarginPreset> = new Set([
  'tight',
  'default',
  'wide',
]);
const VALID_NODE_DISPLAYS: ReadonlySet<NodeDisplay> = new Set(['card', 'pill']);

/** Guards the one place untyped external data (a previous app version's
 *  persisted shape, a hand-edited localStorage value) enters these two
 *  string-union fields — `GraphLayout`/`NodeMarginPreset` are compile-time-only
 *  types at the persist-hydration boundary, so a corrupted/stale value would
 *  otherwise flow straight into "typed" state unchecked. Placed here (after
 *  `create()` has fully resolved, same as the dark-canvas seed above) rather
 *  than in `onRehydrateStorage` so it can safely call `useUiStore.setState`
 *  instead of mutating the hydrated snapshot directly. */
{
  const hydrated = useUiStore.getState();
  const fixes: Partial<UiState> = {};
  if (!VALID_GRAPH_LAYOUTS.has(hydrated.graphLayout)) fixes.graphLayout = 'force';
  if (!VALID_NODE_MARGIN_PRESETS.has(hydrated.nodeMarginPreset)) fixes.nodeMarginPreset = 'default';
  if (!VALID_NODE_DISPLAYS.has(hydrated.nodeDisplay)) fixes.nodeDisplay = 'card';
  if (Object.keys(fixes).length > 0) useUiStore.setState(fixes);
}

/** Keep `wide` in sync with the viewport for the chat-drawer overlay threshold. */
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const wide = window.innerWidth >= 1300;
    if (wide !== useUiStore.getState().wide) {
      useUiStore.getState().setWide(wide);
    }
  });
}
