// @vitest-environment happy-dom
/**
 * Canvas.spec.tsx — the center pane PageHeader + GraphCanvas composition.
 *
 * Renders the REAL Canvas (Heimdall PageHeader + GraphCanvas) with the REAL
 * data hooks against MSW fixtures. We assert OUR composition: the right eyebrow
 * (INSTANCE MODEL / META-MODEL), title, id chip, and meta per view, and that
 * the GraphCanvas receives the right layer's nodes and REMOUNTS when the
 * view/layer key changes. We do NOT assert pixel positions (happy-dom returns
 * 0 for measurements; Heimdall's internal layout is its own concern).
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GraphCanvasProps } from '@tinkermonkey/heimdall-ui';

import { Canvas } from '@/apps/embedded/ui/Canvas';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';

/** Captures the most recent props Canvas.tsx actually passed to the REAL
 *  GraphCanvas — used only to verify our own prop-wiring (centerOnSelect,
 *  fullscreenContainerRef), which has no other DOM-observable signature in
 *  this happy-dom environment (see this file's own top comment on why pixel
 *  positions aren't asserted here). Still renders the real component
 *  underneath, so every other test in this file is unaffected. */
let lastGraphCanvasProps: GraphCanvasProps | undefined;

vi.mock('@tinkermonkey/heimdall-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tinkermonkey/heimdall-ui')>();
  return {
    ...actual,
    GraphCanvas: (props: GraphCanvasProps) => {
      lastGraphCanvasProps = props;
      return <actual.GraphCanvas {...props} />;
    },
  };
});

/** Number of graph node elements currently rendered in the canvas. */
function graphNodeCount(): number {
  return document.querySelectorAll('[data-testid^="graph-node-"]').length;
}

/** Number of graph edge elements currently rendered — GraphCanvas only gives
 *  an edge this testid when it's actually rendered (hidden non-structural
 *  edges get no testid at all, confirmed empirically), so this doubles as
 *  "how many edges are currently visible." */
function graphEdgeCount(): number {
  return document.querySelectorAll('[data-testid^="graph-edge-"]').length;
}

describe('Canvas — empty state', () => {
  it('shows the model empty hint when no layer is selected', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');

    expect(await screen.findByTestId('canvas-empty')).toHaveTextContent(
      'select a layer to view its instance model',
    );
    // Title falls back to 'Model'; no graph nodes.
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Model');
    expect(graphNodeCount()).toBe(0);
  });
});

describe('Canvas — Model view PageHeader', () => {
  it('renders INSTANCE MODEL eyebrow, layer title, id chip and element meta', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('application');

    // Eyebrow = "INSTANCE MODEL · {standard}".
    await waitFor(() =>
      expect(screen.getByTestId('page-header-eyebrow')).toHaveTextContent(
        'INSTANCE MODEL · ArchiMate 3.2',
      ),
    );
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Application');
    expect(screen.getByTestId('page-header-id-chip')).toHaveTextContent('application');

    // Meta reports the live element count (54 application elements).
    await waitFor(() =>
      expect(screen.getByTestId('page-header-actions')).toHaveTextContent('54 elements'),
    );
  });

  it('renders the selected layer graph nodes', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm'); // 11 elements (small layer)

    await waitFor(() => expect(graphNodeCount()).toBe(11));
  });
});

describe('Canvas — Schema view PageHeader', () => {
  it('renders META-MODEL eyebrow, "{layer} schema" title and node-type meta', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('data-model');

    await waitFor(() =>
      expect(screen.getByTestId('page-header-eyebrow')).toHaveTextContent(
        'META-MODEL · JSON Schema Draft 7',
      ),
    );
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Data Model schema');
    // Meta is "{n} node types · {m} relationships".
    await waitFor(() =>
      expect(screen.getByTestId('page-header-actions')).toHaveTextContent(/node types/),
    );
  });
});

describe('Canvas — keyed remount on view/layer switch', () => {
  it('switching the layer swaps the rendered node set', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');

    useUiStore.getState().selectLayer('apm'); // 11 nodes
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    const apmNodeIds = [...document.querySelectorAll('[data-testid^="graph-node-"]')].map(
      (n) => n.getAttribute('data-testid'),
    );

    useUiStore.getState().selectLayer('data-store'); // 9 nodes
    await waitFor(() => expect(graphNodeCount()).toBe(9));
    const storeNodeIds = [...document.querySelectorAll('[data-testid^="graph-node-"]')].map(
      (n) => n.getAttribute('data-testid'),
    );

    // The new layer's nodes are entirely different (the key remounted the canvas).
    expect(storeNodeIds.some((id) => apmNodeIds.includes(id))).toBe(false);
  });

  it('switching Model→Schema for one layer swaps instances for node-types', async () => {
    renderWithProviders(<Canvas />);

    // Model view, application layer: 54 instance nodes.
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('application');
    await waitFor(() => expect(graphNodeCount()).toBe(54));
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Application');

    // Schema view, same layer: node-types (9), title becomes "{layer} schema".
    useUiStore.getState().setView('spec');
    await waitFor(() =>
      expect(screen.getByTestId('page-header-title')).toHaveTextContent('Application schema'),
    );
    await waitFor(() => expect(graphNodeCount()).toBe(9));
  });
});

describe('Canvas — graph/page mode toggle', () => {
  it('clicking the "page" segment swaps GraphCanvas for the page-view scaffold, and back', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    expect(screen.queryByTestId('page-view')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'page' }));
    expect(useUiStore.getState().mode).toBe('page');
    expect(await screen.findByTestId('page-view')).toBeInTheDocument();
    expect(graphNodeCount()).toBe(0); // GraphCanvas unmounted

    await user.click(screen.getByRole('radio', { name: 'graph' }));
    expect(useUiStore.getState().mode).toBe('graph');
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    expect(screen.queryByTestId('page-view')).not.toBeInTheDocument();
  });

  it('layer-focus page mode overrides the header with the LayerPageData eyebrow/title/meta', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('data-model'); // sets focus: 'layer'
    useUiStore.getState().setMode('page');

    // Overridden by pg.eyebrow/pg.title/pg.meta (layerPageData), NOT the
    // graph mode's "INSTANCE MODEL · ..." / element-count meta.
    await waitFor(() =>
      expect(screen.getByTestId('page-header-eyebrow')).toHaveTextContent(
        /^LAYER \d+ · JSON Schema Draft 7$/,
      ),
    );
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Data Model');
    await waitFor(() =>
      expect(screen.getByTestId('page-header-actions')).toHaveTextContent(
        /node types · \d+ relationship schemas/,
      ),
    );
  });

  it('node-focus page mode (a selected model element) renders the ELEMENT eyebrow', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('data-model');
    useUiStore.getState().selectNode('cfe8d725-4f64-4eae-b2fa-825e4a774a3a'); // MetaModel
    useUiStore.getState().setMode('page');

    await waitFor(() =>
      expect(screen.getByTestId('page-header-eyebrow')).toHaveTextContent('ELEMENT · Data Model'),
    );
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('MetaModel');
  });

  it('mode persists across a layer switch (design: mode toggle persists across selections)', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    useUiStore.getState().setMode('page');
    expect(await screen.findByTestId('page-view')).toBeInTheDocument();

    useUiStore.getState().selectLayer('technology');
    expect(useUiStore.getState().mode).toBe('page'); // still page mode
    expect(await screen.findByTestId('page-view')).toBeInTheDocument();
    expect(graphNodeCount()).toBe(0);
  });

  it('page mode with a layer selected but no node focused shows the "select a node" empty state', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('data-model'); // focus: 'layer', not 'node'
    useUiStore.getState().setMode('page');
    // Force focus to 'node' with no selection to hit the `!pg` branch
    // (mirrors a spec-node page whose selectedId hasn't resolved yet).
    useUiStore.setState({ focus: 'node', selectedId: null });

    expect(await screen.findByTestId('canvas-empty')).toHaveTextContent(
      'select a node to view its page',
    );
  });
});

describe('Canvas — graph layout/display control strip', () => {
  it('is hidden with no layer selected, and in page mode', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    expect(screen.queryByTestId('graph-controls')).not.toBeInTheDocument();

    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    expect(screen.getByTestId('graph-controls')).toBeInTheDocument();

    useUiStore.getState().setMode('page');
    await screen.findByTestId('page-view');
    expect(screen.queryByTestId('graph-controls')).not.toBeInTheDocument();
  });

  it('shows Layout and Relations always; Boundaries only off "force", Node margin only off "galaxy"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    await user.hover(screen.getByTestId('graph-controls-toggle')); // expand the flyout

    // Default layout is 'force': Boundaries hidden, Node margin shown.
    expect(screen.getByTestId('graph-layout-control')).toBeInTheDocument();
    expect(screen.getByTestId('graph-relations-control')).toBeInTheDocument();
    expect(screen.queryByTestId('graph-boundaries-control')).not.toBeInTheDocument();
    expect(screen.getByTestId('graph-margin-control')).toBeInTheDocument();

    useUiStore.getState().setGraphLayout('galaxy');
    await waitFor(() => expect(screen.getByTestId('graph-boundaries-control')).toBeInTheDocument());
    expect(screen.queryByTestId('graph-margin-control')).not.toBeInTheDocument();

    useUiStore.getState().setGraphLayout('force-clustered');
    await waitFor(() => expect(screen.getByTestId('graph-margin-control')).toBeInTheDocument());
    expect(screen.getByTestId('graph-boundaries-control')).toBeInTheDocument();

    useUiStore.getState().setGraphLayout('force');
  });

  it('clicking each SegmentedControl option updates the corresponding uiStore field', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    const toggle = screen.getByTestId('graph-controls-toggle');
    // Open via focus, then interact via fireEvent.click (a plain "click"
    // event, no surrounding pointer/mouse choreography) rather than
    // userEvent.click for this multi-step sequence — happy-dom's user-event
    // integration doesn't reliably exclude a shared ancestor (this flyout's
    // wrapper) when synthesizing the pointer path between two DIFFERENT
    // click targets inside it, so a *real* mouseleave never fires but a
    // spurious one can here, collapsing (unmounting) the very control the
    // next click targets. Verified live in a real browser (not just this
    // suite) that clicking a control and then genuinely moving the mouse
    // away collapses the panel correctly — this is a test-environment
    // limitation, not a product bug; see Canvas.tsx's own collapseIfLeavingFlyout comment.
    fireEvent.focus(toggle);

    fireEvent.click(screen.getByRole('radio', { name: 'Galaxy' }));
    expect(useUiStore.getState().graphLayout).toBe('galaxy');

    fireEvent.click(screen.getByRole('radio', { name: 'Off' }));
    expect(useUiStore.getState().showClusterBoundaries).toBe(false);

    fireEvent.click(screen.getByRole('radio', { name: 'Structural' }));
    expect(useUiStore.getState().showAllRelations).toBe(false);

    fireEvent.click(screen.getByRole('radio', { name: 'Force' }));
    expect(useUiStore.getState().graphLayout).toBe('force');

    fireEvent.click(screen.getByRole('radio', { name: 'Wide' }));
    expect(useUiStore.getState().nodeMarginPreset).toBe('wide');
  });

  it('pins the built-in GraphToolbar bottom-left (not bottom-right, which collides with the Inspector drawer)', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    expect(document.querySelector('.graph-toolbar--bottom-left')).toBeInTheDocument();
    expect(document.querySelector('.graph-toolbar--bottom-right')).not.toBeInTheDocument();
  });

  it('floats GraphControls over the graph (absolutely positioned, not a layout row)', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    expect(screen.getByTestId('graph-controls')).toHaveStyle({ position: 'absolute' });
  });

  it('collapses to a transparent icon by default and expands the panel on hover/focus', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    const toggle = screen.getByTestId('graph-controls-toggle');
    expect(toggle).toHaveStyle({ background: 'transparent' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('graph-controls-panel')).not.toBeInTheDocument();

    // Hovering expands it.
    await user.hover(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('graph-controls-panel')).toBeInTheDocument();
    expect(screen.getByTestId('graph-layout-control')).toBeInTheDocument();

    // Unhovering collapses it again.
    await user.unhover(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('graph-controls-panel')).not.toBeInTheDocument();

    // Keyboard focus (not just mouse hover) also expands it.
    fireEvent.focus(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('graph-controls-panel')).toBeInTheDocument();

    // Blurring away from the whole flyout collapses it.
    fireEvent.blur(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('graph-controls-panel')).not.toBeInTheDocument();
  });

  it('stays expanded while focus moves onto a control inside the panel (blur to a sibling, not a collapse)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    // Focus (not hover) the toggle so DOM focus actually starts there, then
    // tab forward into the now-expanded panel — that move stays WITHIN the
    // flyout and must not collapse it mid-interaction.
    fireEvent.focus(screen.getByTestId('graph-controls-toggle'));
    await user.tab();
    expect(screen.getByTestId('graph-controls-toggle')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('graph-controls-panel')).toBeInTheDocument();
  });
});

describe('Canvas — background click deselects (Inspector auto-hide reachable)', () => {
  it('clicking the graph background clears the selection, closing the Inspector drawer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    // Select a real node via a real click (same as a user would). The React
    // onClick lives on the inner .graph-node DIV, not the outer <g data-testid=...>.
    const firstNode = document
      .querySelector('[data-testid^="graph-node-"] .graph-node') as HTMLElement;
    await user.click(firstNode);
    await waitFor(() => expect(useUiStore.getState().selectedId).not.toBeNull());
    expect(screen.getByTestId('inspector')).toHaveStyle({ width: '320px' }); // drawer open

    // Clicking empty canvas background (not a node) clears it back out.
    const canvas = document.querySelector('.graph-canvas') as HTMLElement;
    await user.click(canvas);

    await waitFor(() => expect(useUiStore.getState().selectedId).toBeNull());
    expect(useUiStore.getState().focus).toBe('layer');
    expect(useUiStore.getState().layerId).toBe('apm'); // stays on the same layer
    expect(screen.getByTestId('inspector')).toHaveStyle({ width: '0px' }); // drawer closed
  });
});

describe('Canvas — heimdall-ui 0.7.0 prop wiring', () => {
  it('passes centerOnSelect and a fullscreenContainerRef pointing at the graph-mode wrapper to GraphCanvas', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    expect(lastGraphCanvasProps?.centerOnSelect).toBe(true);

    // The ref must point at an ancestor that ALSO contains GraphControls and
    // Inspector — the whole reason fullscreenContainerRef exists (see
    // Canvas.tsx's own doc comment): fullscreening GraphCanvas's own root
    // alone would leave both siblings outside the fullscreened subtree.
    const ref = lastGraphCanvasProps?.fullscreenContainerRef;
    expect(ref).toBeDefined();
    const wrapper = ref?.current;
    expect(wrapper).not.toBeNull();
    expect(wrapper?.contains(screen.getByTestId('graph-controls'))).toBe(true);
    expect(wrapper?.contains(screen.getByTestId('inspector'))).toBe(true);
    expect(wrapper?.contains(document.querySelector('.graph-canvas'))).toBe(true);
    // And NOT just GraphCanvas's own root — that would defeat the point.
    expect(wrapper).not.toBe(document.querySelector('.graph-canvas'));
  });
});

describe('Canvas — Relations toggle actually filters rendered edges', () => {
  it('"Structural" hides non-structural edges; "All" restores them', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm'); // 12 edges total, 3 structural (aggregates)
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    await waitFor(() => expect(graphEdgeCount()).toBe(12));

    fireEvent.focus(screen.getByTestId('graph-controls-toggle'));
    fireEvent.click(screen.getByRole('radio', { name: 'Structural' }));
    expect(useUiStore.getState().showAllRelations).toBe(false);
    await waitFor(() => expect(graphEdgeCount()).toBe(3));

    fireEvent.click(screen.getByRole('radio', { name: 'All' }));
    expect(useUiStore.getState().showAllRelations).toBe(true);
    await waitFor(() => expect(graphEdgeCount()).toBe(12));
  });
});

describe('Canvas — GraphControls flyout keyboard/click activation', () => {
  it('the toggle button itself opens the panel on click (not just hover/focus) — a device with no hover (touch) has no other way in', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    const toggle = screen.getByTestId('graph-controls-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('graph-controls-panel')).toBeInTheDocument();

    // A second click stays open (idempotent OPEN, not a toggle) — a real
    // mouse click is always preceded by that same pointer's mouseEnter
    // already opening the panel via hover, so a toggle would immediately
    // re-close what hover just opened. Closing stays owned by
    // mouseLeave/blur/Escape (see the tests below), not a click.
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('graph-controls-panel')).toBeInTheDocument();
  });

  it('Escape closes the panel and returns focus to the toggle', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    const toggle = screen.getByTestId('graph-controls-toggle');
    fireEvent.focus(toggle);
    expect(screen.getByTestId('graph-controls-panel')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByTestId('graph-controls'), { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('graph-controls-panel')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(toggle);
  });
});
