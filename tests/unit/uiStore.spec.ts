// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useUiStore, PERSIST_KEY } from '@/apps/embedded/ui/uiStore';

// Capture the pristine initial state (set at module load) so each test starts
// from a known baseline regardless of prior mutations.
const INITIAL = useUiStore.getState();

function reset() {
  document.body.classList.remove('dark-canvas');
  useUiStore.setState(
    {
      view: 'model',
      layerId: null,
      selectedId: null,
      selectedEdgeId: null,
      highlightedEdgeId: null,
      changesetId: null,
      canvasDark: false,
      chatOpen: false,
      wide: false,
      mode: 'graph',
      focus: 'layer',
      expandedSections: new Set<string>(['model']),
      expandedLayers: new Set<string>(),
      graphLayout: 'force',
      showClusterBoundaries: true,
      showAllRelations: true,
      nodeMarginPreset: 'default',
      nodeDisplay: 'card',
    },
    false,
  );
}

beforeEach(reset);

const get = () => useUiStore.getState();

describe('uiStore — default state', () => {
  it('exposes the expected action surface and seeds the model section', () => {
    expect(INITIAL.view).toBe('model');
    expect(INITIAL.expandedSections.has('model')).toBe(true);
    expect(typeof INITIAL.toggleCanvasDark).toBe('function');
    expect(typeof INITIAL.navigateToElement).toBe('function');
  });

  it('defaults canvasDark to true (dark mode on first visit)', () => {
    expect(INITIAL.canvasDark).toBe(true);
  });
});

describe('uiStore — localStorage persistence', () => {
  it('persists canvasDark, chatOpen, and the graph settings under PERSIST_KEY', () => {
    get().toggleCanvasDark();
    get().toggleChat();
    get().setGraphLayout('galaxy');
    get().toggleClusterBoundaries();
    get().toggleShowAllRelations();
    get().setNodeMarginPreset('wide');
    get().setNodeDisplay('pill');

    const stored = JSON.parse(localStorage.getItem(PERSIST_KEY) ?? '{}');
    expect(stored.state).toMatchObject({
      canvasDark: true, // reset() started at false; one toggle -> true
      chatOpen: true, // reset() started at false; one toggle -> true
      graphLayout: 'galaxy',
      showClusterBoundaries: false,
      showAllRelations: false,
      nodeMarginPreset: 'wide',
      nodeDisplay: 'pill',
    });
  });

  it('does NOT persist navigation state (view/layerId/selectedId/changesetId/mode/focus/expanded*)', () => {
    get().selectLayer('security');
    get().selectNode('elem-1');
    get().setMode('page');
    get().selectChangeset('cs-9');

    const stored = JSON.parse(localStorage.getItem(PERSIST_KEY) ?? '{}');
    expect(stored.state).not.toHaveProperty('view');
    expect(stored.state).not.toHaveProperty('layerId');
    expect(stored.state).not.toHaveProperty('selectedId');
    expect(stored.state).not.toHaveProperty('changesetId');
    expect(stored.state).not.toHaveProperty('mode');
    expect(stored.state).not.toHaveProperty('focus');
    expect(stored.state).not.toHaveProperty('expandedSections');
    expect(stored.state).not.toHaveProperty('expandedLayers');
  });
});

describe('toggleCanvasDark', () => {
  it('toggles body.dark-canvas and the canvasDark flag', () => {
    expect(document.body.classList.contains('dark-canvas')).toBe(false);

    get().toggleCanvasDark();
    expect(get().canvasDark).toBe(true);
    expect(document.body.classList.contains('dark-canvas')).toBe(true);

    get().toggleCanvasDark();
    expect(get().canvasDark).toBe(false);
    expect(document.body.classList.contains('dark-canvas')).toBe(false);
  });
});

describe('selectNode / selectGraphNode', () => {
  it('selectNode sets selectedId without touching the view', () => {
    get().selectNode('elem-1');
    expect(get().selectedId).toBe('elem-1');
    expect(get().view).toBe('model');
  });

  it('selectGraphNode expands the active section (and layer when set)', () => {
    useUiStore.setState({ layerId: 'api', view: 'model' });
    get().selectGraphNode('node-9');
    expect(get().selectedId).toBe('node-9');
    expect(get().expandedSections.has('model')).toBe(true);
    expect(get().expandedLayers.has('model:api')).toBe(true);
  });
});

describe('navigateToElement — cross-layer navigation', () => {
  it('switches layerId, keeps the Model view, and expands the target layer', () => {
    useUiStore.setState({ view: 'model', layerId: 'motivation' });
    get().navigateToElement('elem-7', 'application');
    const s = get();
    expect(s.view).toBe('model'); // stays in model view
    expect(s.layerId).toBe('application'); // crossed to the target layer
    expect(s.selectedId).toBe('elem-7');
    expect(s.expandedSections.has('model')).toBe(true);
    expect(s.expandedLayers.has('model:application')).toBe(true);
  });

  it('same-layer navigation keeps the expandedLayers set untouched', () => {
    useUiStore.setState({
      view: 'model',
      layerId: 'business',
      expandedLayers: new Set(['model:business']),
    });
    const before = get().expandedLayers;
    get().navigateToElement('elem-3', 'business');
    expect(get().layerId).toBe('business');
    expect(get().selectedId).toBe('elem-3');
    expect(get().expandedLayers).toBe(before); // identity preserved (no churn)
  });
});

describe('navigateToSpecNode — cross-layer navigation in Schema view', () => {
  it('stays in the Schema view and switches the layer', () => {
    useUiStore.setState({ view: 'spec', layerId: 'data-model' });
    get().navigateToSpecNode('api.response', 'api');
    const s = get();
    expect(s.view).toBe('spec');
    expect(s.layerId).toBe('api');
    expect(s.selectedId).toBe('api.response');
    expect(s.expandedSections.has('spec')).toBe(true);
    expect(s.expandedLayers.has('spec:api')).toBe(true);
  });
});

describe('toggleSection', () => {
  it('collapses an expanded section and activates its view', () => {
    expect(get().expandedSections.has('model')).toBe(true);
    get().toggleSection('model');
    expect(get().expandedSections.has('model')).toBe(false);
    expect(get().view).toBe('model');
  });

  it('expands a collapsed section and switches the view to it', () => {
    get().toggleSection('spec');
    expect(get().expandedSections.has('spec')).toBe(true);
    expect(get().view).toBe('spec');
  });

  it('clears selectedId on a genuine view switch — selection ids are not portable across views', () => {
    useUiStore.setState({ view: 'model', layerId: 'application', selectedId: 'model-uuid-1', focus: 'node' });
    get().toggleSection('spec');
    const s = get();
    expect(s.view).toBe('spec');
    expect(s.selectedId).toBeNull(); // a Model UUID means nothing in Schema
    expect(s.focus).toBe('layer');
    // layerId IS portable (same 12 layer slugs in both views) — switching
    // sections stays on the same layer, just the other view of it.
    expect(s.layerId).toBe('application');
  });

  it('toggling the ALREADY-active section (pure expand/collapse) leaves selection untouched', () => {
    useUiStore.setState({ view: 'model', selectedId: 'keep-me', focus: 'node' });
    get().toggleSection('model'); // model is already the active view
    const s = get();
    expect(s.view).toBe('model');
    expect(s.selectedId).toBe('keep-me');
    expect(s.focus).toBe('node');
  });
});

describe('toggleLayer', () => {
  it('expands a layer: sets it active, clears selection, activates the section', () => {
    get().toggleLayer('model', 'security');
    const s = get();
    expect(s.expandedLayers.has('model:security')).toBe(true);
    expect(s.layerId).toBe('security');
    expect(s.selectedId).toBeNull(); // expanding clears selection
    expect(s.view).toBe('model');
    expect(s.expandedSections.has('model')).toBe(true);
  });

  it('collapsing a layer keeps the current selection', () => {
    useUiStore.setState({
      selectedId: 'keep-me',
      expandedLayers: new Set(['model:security']),
      layerId: 'security',
    });
    get().toggleLayer('model', 'security');
    expect(get().expandedLayers.has('model:security')).toBe(false);
    expect(get().selectedId).toBe('keep-me'); // collapse preserves selection
  });
});

describe('selectLayer / selectChangeset / toggleChat / setWide', () => {
  it('selectLayer clears selection and expands the layer under the active view', () => {
    useUiStore.setState({ view: 'model', selectedId: 'old' });
    get().selectLayer('technology');
    expect(get().layerId).toBe('technology');
    expect(get().selectedId).toBeNull();
    expect(get().expandedLayers.has('model:technology')).toBe(true);
  });

  it('selectChangeset switches to the changesets view', () => {
    get().selectChangeset('cs-1');
    expect(get().view).toBe('changesets');
    expect(get().changesetId).toBe('cs-1');
    expect(get().expandedSections.has('changesets')).toBe(true);
  });

  it('toggleChat flips chatOpen; setWide sets the responsive seed', () => {
    expect(get().chatOpen).toBe(false);
    get().toggleChat();
    expect(get().chatOpen).toBe(true);
    get().setWide(true);
    expect(get().wide).toBe(true);
  });
});

describe('selectEdge / setHighlightedEdgeId — edge selection (ADR-6: mutually exclusive with node)', () => {
  it('selectEdge sets selectedEdgeId, clears selectedId, and resets focus to layer', () => {
    useUiStore.setState({ selectedId: 'node-1', focus: 'node' });
    get().selectEdge('edge-1');
    const s = get();
    expect(s.selectedEdgeId).toBe('edge-1');
    expect(s.selectedId).toBeNull();
    expect(s.focus).toBe('layer');
  });

  it('selectNode / selectGraphNode / navigateToElement / navigateToSpecNode all clear a prior edge selection', () => {
    useUiStore.setState({ selectedEdgeId: 'edge-1' });
    get().selectNode('elem-1');
    expect(get().selectedEdgeId).toBeNull();

    useUiStore.setState({ selectedEdgeId: 'edge-1', layerId: 'api' });
    get().selectGraphNode('elem-2');
    expect(get().selectedEdgeId).toBeNull();

    useUiStore.setState({ selectedEdgeId: 'edge-1', view: 'model', layerId: 'motivation' });
    get().navigateToElement('elem-3', 'application');
    expect(get().selectedEdgeId).toBeNull();

    useUiStore.setState({ selectedEdgeId: 'edge-1', view: 'spec', layerId: 'data-model' });
    get().navigateToSpecNode('api.response', 'api');
    expect(get().selectedEdgeId).toBeNull();
  });

  it('selectLayer and toggleLayer (expanding) clear a prior edge selection', () => {
    useUiStore.setState({ selectedEdgeId: 'edge-1' });
    get().selectLayer('technology');
    expect(get().selectedEdgeId).toBeNull();

    useUiStore.setState({ selectedEdgeId: 'edge-1' });
    get().toggleLayer('model', 'security'); // expands
    expect(get().selectedEdgeId).toBeNull();
  });

  it('toggleLayer (collapsing) preserves a prior edge selection', () => {
    useUiStore.setState({
      selectedEdgeId: 'edge-1',
      expandedLayers: new Set(['model:security']),
      layerId: 'security',
    });
    get().toggleLayer('model', 'security'); // collapses
    expect(get().selectedEdgeId).toBe('edge-1');
  });

  it('toggleSection clears a prior edge selection on a genuine view switch, but not on a same-view toggle', () => {
    useUiStore.setState({ view: 'model', selectedEdgeId: 'edge-1' });
    get().toggleSection('spec');
    expect(get().selectedEdgeId).toBeNull();

    useUiStore.setState({ view: 'model', selectedEdgeId: 'edge-2' });
    get().toggleSection('model'); // already active — pure expand/collapse
    expect(get().selectedEdgeId).toBe('edge-2');
  });

  it('a node selection clears a prior edge selection, and vice versa (round trip)', () => {
    get().selectNode('elem-1');
    expect(get().selectedId).toBe('elem-1');
    get().selectEdge('edge-1');
    expect(get().selectedEdgeId).toBe('edge-1');
    expect(get().selectedId).toBeNull();
    get().selectNode('elem-2');
    expect(get().selectedId).toBe('elem-2');
    expect(get().selectedEdgeId).toBeNull();
  });

  it('setHighlightedEdgeId sets/clears the transient hover-preview id independently of selection', () => {
    get().selectEdge('edge-1');
    get().setHighlightedEdgeId('edge-2');
    expect(get().highlightedEdgeId).toBe('edge-2');
    expect(get().selectedEdgeId).toBe('edge-1'); // untouched by hover

    get().setHighlightedEdgeId(null);
    expect(get().highlightedEdgeId).toBeNull();
  });

  it('does NOT persist selectedEdgeId/highlightedEdgeId (URL/transient, not localStorage)', () => {
    get().selectEdge('edge-1');
    get().setHighlightedEdgeId('edge-1');

    const stored = JSON.parse(localStorage.getItem(PERSIST_KEY) ?? '{}');
    expect(stored.state).not.toHaveProperty('selectedEdgeId');
    expect(stored.state).not.toHaveProperty('highlightedEdgeId');
  });
});

describe('mode — graph/page toggle', () => {
  it('setMode switches the mode', () => {
    expect(get().mode).toBe('graph');
    get().setMode('page');
    expect(get().mode).toBe('page');
    get().setMode('graph');
    expect(get().mode).toBe('graph');
  });

  it('persists across a layer/node selection (design: "mode toggle persists across selections")', () => {
    get().setMode('page');
    get().selectLayer('technology');
    expect(get().mode).toBe('page');
    get().selectNode('elem-1');
    expect(get().mode).toBe('page');
    get().navigateToElement('elem-7', 'application');
    expect(get().mode).toBe('page');
  });
});

describe('focus — page-view target (layer overview vs. node detail)', () => {
  it('starts as "layer"', () => {
    expect(get().focus).toBe('layer');
  });

  it('selectLayer sets focus to "layer"', () => {
    useUiStore.setState({ focus: 'node' });
    get().selectLayer('technology');
    expect(get().focus).toBe('layer');
  });

  it('selectNode / selectGraphNode / navigateToElement / navigateToSpecNode all set focus to "node"', () => {
    get().selectNode('elem-1');
    expect(get().focus).toBe('node');

    useUiStore.setState({ focus: 'layer' });
    get().selectGraphNode('node-9');
    expect(get().focus).toBe('node');

    useUiStore.setState({ focus: 'layer' });
    get().navigateToElement('elem-7', 'application');
    expect(get().focus).toBe('node');

    useUiStore.setState({ focus: 'layer' });
    get().navigateToSpecNode('api.response', 'api');
    expect(get().focus).toBe('node');
  });

  it('toggleLayer sets focus to "layer" when expanding, preserves it when collapsing', () => {
    useUiStore.setState({ focus: 'node' });
    get().toggleLayer('model', 'security'); // expands (not yet expanded)
    expect(get().focus).toBe('layer');

    useUiStore.setState({ focus: 'node' });
    get().toggleLayer('model', 'security'); // now collapses
    expect(get().focus).toBe('node'); // untouched by a collapse
  });
});

describe('graph layout/display preferences', () => {
  it('default to force layout, boundaries on, every relation visible, default node margin, card node display', () => {
    expect(get().graphLayout).toBe('force');
    expect(get().showClusterBoundaries).toBe(true);
    expect(get().showAllRelations).toBe(true);
    expect(get().nodeMarginPreset).toBe('default');
    expect(get().nodeDisplay).toBe('card');
  });

  it('setGraphLayout switches the layout engine', () => {
    get().setGraphLayout('galaxy');
    expect(get().graphLayout).toBe('galaxy');
    get().setGraphLayout('force-clustered');
    expect(get().graphLayout).toBe('force-clustered');
    get().setGraphLayout('force');
    expect(get().graphLayout).toBe('force');
  });

  it('toggleClusterBoundaries flips showClusterBoundaries', () => {
    get().toggleClusterBoundaries();
    expect(get().showClusterBoundaries).toBe(false);
    get().toggleClusterBoundaries();
    expect(get().showClusterBoundaries).toBe(true);
  });

  it('toggleShowAllRelations flips showAllRelations', () => {
    get().toggleShowAllRelations();
    expect(get().showAllRelations).toBe(false);
    get().toggleShowAllRelations();
    expect(get().showAllRelations).toBe(true);
  });

  it('setNodeMarginPreset switches the preset', () => {
    get().setNodeMarginPreset('tight');
    expect(get().nodeMarginPreset).toBe('tight');
    get().setNodeMarginPreset('wide');
    expect(get().nodeMarginPreset).toBe('wide');
    get().setNodeMarginPreset('default');
    expect(get().nodeMarginPreset).toBe('default');
  });

  it('setNodeDisplay switches between card and pill', () => {
    get().setNodeDisplay('pill');
    expect(get().nodeDisplay).toBe('pill');
    get().setNodeDisplay('card');
    expect(get().nodeDisplay).toBe('card');
  });
});

describe('persist hydration validates graphLayout/nodeMarginPreset', () => {
  // These two string-union types are compile-time only at the one point
  // untyped external data enters them: a value read back from localStorage.
  // Exercises the actual read/hydrate path (vi.resetModules + a fresh
  // import re-runs the module's create(persist(...)) against whatever is
  // in localStorage right now), not just the write path the persistence
  // describe block above covers.
  afterEach(() => {
    localStorage.removeItem(PERSIST_KEY);
  });

  it('falls back to the documented defaults when the persisted value is not a valid literal', async () => {
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        state: {
          canvasDark: true,
          chatOpen: false,
          graphLayout: 'not-a-real-layout',
          showClusterBoundaries: true,
          showAllRelations: true,
          nodeMarginPreset: 'not-a-real-preset',
          nodeDisplay: 'not-a-real-display',
        },
        version: 1,
      }),
    );

    vi.resetModules();
    const fresh = await import('@/apps/embedded/ui/uiStore');
    expect(fresh.useUiStore.getState().graphLayout).toBe('force');
    expect(fresh.useUiStore.getState().nodeMarginPreset).toBe('default');
    expect(fresh.useUiStore.getState().nodeDisplay).toBe('card');
  });

  it('keeps a genuinely valid persisted value as-is', async () => {
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        state: {
          canvasDark: true,
          chatOpen: false,
          graphLayout: 'galaxy',
          showClusterBoundaries: true,
          showAllRelations: true,
          nodeMarginPreset: 'wide',
          nodeDisplay: 'pill',
        },
        version: 1,
      }),
    );

    vi.resetModules();
    const fresh = await import('@/apps/embedded/ui/uiStore');
    expect(fresh.useUiStore.getState().graphLayout).toBe('galaxy');
    expect(fresh.useUiStore.getState().nodeMarginPreset).toBe('wide');
    expect(fresh.useUiStore.getState().nodeDisplay).toBe('pill');
  });
});
