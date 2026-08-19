// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
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

    const stored = JSON.parse(localStorage.getItem(PERSIST_KEY) ?? '{}');
    expect(stored.state).toMatchObject({
      canvasDark: true, // reset() started at false; one toggle -> true
      chatOpen: true, // reset() started at false; one toggle -> true
      graphLayout: 'galaxy',
      showClusterBoundaries: false,
      showAllRelations: false,
      nodeMarginPreset: 'wide',
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
  it('default to force layout, boundaries on, every relation visible, default node margin', () => {
    expect(get().graphLayout).toBe('force');
    expect(get().showClusterBoundaries).toBe(true);
    expect(get().showAllRelations).toBe(true);
    expect(get().nodeMarginPreset).toBe('default');
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
});
