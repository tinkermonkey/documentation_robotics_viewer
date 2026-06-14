// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@/apps/embedded/ui/uiStore';

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
      expandedSections: new Set<string>(['model']),
      expandedLayers: new Set<string>(),
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
