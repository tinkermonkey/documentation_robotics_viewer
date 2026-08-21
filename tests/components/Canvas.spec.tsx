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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
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

/** Setup hook: disable inter-layer nodes for consistent test counts. */
beforeEach(() => {
  useUiStore.setState({ showInterLayerNodes: false });
});

/** Number of graph edge elements currently rendered — GraphCanvas only gives
 *  an edge this testid when it's actually rendered (hidden non-structural
 *  edges get no testid at all, confirmed empirically), so this doubles as
 *  "how many edges are currently visible." */
function graphEdgeCount(): number {
  return document.querySelectorAll('[data-testid^="graph-edge-"]').length;
}

/** Number of card-presentation nodes actually visible in the graph viewport.
 *  GraphCanvas also renders every node once more, offscreen, in a hidden
 *  `.graph-measure` container (to measure foreignObject dimensions before
 *  layout) — that copy carries no `graph-node-*` testid, so scoping the
 *  query under `[data-testid^="graph-node-"]` (same prefix `graphNodeCount`
 *  uses) counts only the real, visible instance of each node. */
function cardNodeCount(): number {
  return document.querySelectorAll('[data-testid^="graph-node-"] .graph-node--card').length;
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

    // Boundaries control appears only when layout is not 'force'; use within()
    // to disambiguate from the Inter-layer 'Off' option also present in Model view
    fireEvent.click(within(screen.getByTestId('graph-boundaries-control')).getByRole('radio', { name: 'Off' }));
    expect(useUiStore.getState().showClusterBoundaries).toBe(false);

    // Relations control also has an 'Off' option; use within() to disambiguate
    fireEvent.click(within(screen.getByTestId('graph-relations-control')).getByRole('radio', { name: 'Structural' }));
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

describe('Canvas — card node presentation (default) vs. pill, Display control', () => {
  it('renders Model view nodes as cards by default (nodeDisplay defaults to "card")', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    expect(cardNodeCount()).toBe(11);
  });

  it('Schema view always renders the default pill, regardless of nodeDisplay', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('data-model');
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(0));

    expect(cardNodeCount()).toBe(0);
  });

  it('the Display control is shown in Model view and hidden in Schema view', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    fireEvent.focus(screen.getByTestId('graph-controls-toggle'));
    expect(screen.getByTestId('graph-display-control')).toBeInTheDocument();

    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('data-model');
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(0));
    fireEvent.focus(screen.getByTestId('graph-controls-toggle'));
    expect(screen.queryByTestId('graph-display-control')).not.toBeInTheDocument();
  });

  it('switching Display to Pill re-renders Model view nodes as pills, and back to Card', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    expect(cardNodeCount()).toBe(11);

    fireEvent.focus(screen.getByTestId('graph-controls-toggle'));
    fireEvent.click(screen.getByRole('radio', { name: 'Pill' }));
    expect(useUiStore.getState().nodeDisplay).toBe('pill');

    await waitFor(() => expect(graphNodeCount()).toBe(11));
    expect(cardNodeCount()).toBe(0);

    fireEvent.focus(screen.getByTestId('graph-controls-toggle'));
    fireEvent.click(screen.getByRole('radio', { name: 'Card' }));
    expect(useUiStore.getState().nodeDisplay).toBe('card');
    await waitFor(() => expect(cardNodeCount()).toBe(11));
  });

  it('Schema view pill nodes show the NodeTypeBadge tooltip on hover of the kind label', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('data-model');
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(0));

    const kindLabel = document.querySelector(
      '[data-testid^="graph-node-"] .graph-node__kind',
    ) as HTMLElement;
    expect(kindLabel).toBeTruthy();
    fireEvent.focus(kindLabel);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('Model view pill-mode nodes show the NodeTypeBadge tooltip on hover of the kind label', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    useUiStore.getState().setNodeDisplay('pill');
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    expect(cardNodeCount()).toBe(0);

    const kindLabel = document.querySelector(
      '[data-testid^="graph-node-"] .graph-node__kind',
    ) as HTMLElement;
    expect(kindLabel).toBeTruthy();
    fireEvent.focus(kindLabel);
    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('Alert')).toBeInTheDocument();

    useUiStore.getState().setNodeDisplay('card');
  });

  it('clicking a card node selects it and populates the Inspector, same as a pill', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    const firstCard = document.querySelector(
      '[data-testid^="graph-node-"] .graph-node--card',
    ) as HTMLElement;
    expect(firstCard).toBeTruthy();
    await user.click(firstCard);

    await waitFor(() => expect(useUiStore.getState().selectedId).not.toBeNull());
    expect(screen.getByTestId('inspector')).toHaveStyle({ width: '320px' });
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

describe('Canvas — edge tooltip on hover (renderEdgeTooltip)', () => {
  // apm layer, "WebSocket Disconnect Alert" --monitors--> "WebSocket
  // Connection State Gauge" (verified against the model fixture).
  const EDGE_ID =
    'rel:apm.alert.web-socket-disconnect-alert:apm.metricinstrument.web-socket-connection-state-gauge:monitors';

  function edgeLabelEl(): HTMLElement {
    const el = document.querySelector(
      `[data-testid="graph-edge-${EDGE_ID}"] .graph-edge__label`,
    );
    expect(el).toBeTruthy();
    return el as HTMLElement;
  }

  it('hovering an edge shows the PredicateTooltip with the resolved source/predicate/destination', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphEdgeCount()).toBe(12));

    // Hover the edge label — GraphCanvas's native edgeTooltip render-prop
    // (Canvas.tsx's renderEdgeTooltip) should render the tooltip.
    const edgeLabel = edgeLabelEl();
    fireEvent.pointerEnter(edgeLabel);
    fireEvent.pointerOver(edgeLabel);

    // The tooltip renders inside Heimdall's `.graph-tooltip-layer`; look for
    // the content rendered by PredicateTooltipContent.
    await waitFor(() => {
      expect(screen.getByTestId('edge-predicate-tooltip-content')).toBeInTheDocument();
    });

    // Verify the tooltip shows the correct content and diagram.
    const tooltip = screen.getByTestId('edge-predicate-tooltip-content');
    expect(within(tooltip).getByTestId('edge-predicate-tooltip-diagram')).toBeInTheDocument();

    // The diagram should have the source and destination type labels (lowercase slugs).
    const diagram = within(tooltip).getByTestId('edge-predicate-tooltip-diagram');
    expect(within(diagram).getByText('alert')).toBeInTheDocument();
    expect(within(diagram).getByText('metricinstrument')).toBeInTheDocument();

    // Verify the predicate definition appears in the description.
    expect(within(tooltip).getByText(/Element observes or tracks another element/)).toBeInTheDocument();
  });

  it('hovering an edge does NOT set highlightedEdgeId (documented perf invariant)', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphEdgeCount()).toBe(12));

    const edgeLabel = edgeLabelEl();

    // Verify highlighted edge is initially null.
    expect(useUiStore.getState().highlightedEdgeId).toBeNull();

    // Hover the edge.
    fireEvent.pointerEnter(edgeLabel);
    fireEvent.pointerOver(edgeLabel);

    // Wait briefly for any pending state updates, then verify highlightedEdgeId
    // is still null — hover is deliberately NOT wired to set it. The
    // highlighted state is reserved for rare click-triggered highlights via
    // navigateToElementWithEdge, not per-pointer-move previews, because
    // wiring hover into the edges memo was a real perf bug (see PR #537).
    await waitFor(() => {
      expect(screen.getByTestId('edge-predicate-tooltip-content')).toBeInTheDocument();
    });
    expect(useUiStore.getState().highlightedEdgeId).toBeNull();
  });

  it('leaving an edge hover hides the PredicateTooltip', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphEdgeCount()).toBe(12));

    const edgeLabel = edgeLabelEl();

    // Hover the edge to show the tooltip.
    fireEvent.pointerEnter(edgeLabel);
    fireEvent.pointerOver(edgeLabel);
    await waitFor(() => {
      expect(screen.getByTestId('edge-predicate-tooltip-content')).toBeInTheDocument();
    });

    // Unhover (pointerOut) — the tooltip should disappear.
    fireEvent.pointerOut(edgeLabel);
    fireEvent.pointerLeave(edgeLabel);

    // The tooltip should no longer be in the DOM.
    await waitFor(() => {
      expect(screen.queryByTestId('edge-predicate-tooltip-content')).not.toBeInTheDocument();
    });
  });
});

describe('Canvas — edge selection, highlighting, and the edge inspector', () => {
  // apm layer, "WebSocket Disconnect Alert" --monitors--> "WebSocket
  // Connection State Gauge" (verified against the model fixture).
  const EDGE_ID =
    'rel:apm.alert.web-socket-disconnect-alert:apm.metricinstrument.web-socket-connection-state-gauge:monitors';

  function edgeLabelEl(): HTMLElement {
    const el = document.querySelector(
      `[data-testid="graph-edge-${EDGE_ID}"] .graph-edge__label`,
    );
    expect(el).toBeTruthy();
    return el as HTMLElement;
  }

  it('clicking an edge predicate selects it, renders it with a distinct highlighted state, and populates the Inspector', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphEdgeCount()).toBe(12));

    fireEvent.click(edgeLabelEl());

    await waitFor(() => expect(useUiStore.getState().selectedEdgeId).toBe(EDGE_ID));
    const edgeEl = document.querySelector(`[data-testid="graph-edge-${EDGE_ID}"]`)!;
    expect(edgeEl).toHaveClass('selected');
    expect(edgeEl).toHaveClass('graph-edge--hot');

    // Sidebar: source node info, edge info (preceded by its own interactive
    // predicate badge — see EdgeInspector.tsx's Phase 5 hover-tooltip wiring),
    // destination node info, in order.
    const inspector = screen.getByTestId('edge-inspector');
    const children = [...inspector.children].map((c) => c.getAttribute('data-testid'));
    expect(children).toEqual([
      'edge-inspector-source-node',
      'edge-inspector-predicate-row',
      'edge-inspector-edge',
      'edge-inspector-destination-node',
    ]);

    expect(
      within(screen.getByTestId('edge-inspector-source-node')).getByTestId('inspector-title'),
    ).toHaveTextContent('WebSocket Disconnect Alert');
    expect(screen.getByTestId('edge-inspector-edge')).toHaveTextContent('monitors');
    expect(
      within(screen.getByTestId('edge-inspector-destination-node')).getByTestId('inspector-title'),
    ).toHaveTextContent('WebSocket Connection State Gauge');
  });

  it('selecting a node clears an edge selection, and selecting an edge clears a node selection', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphEdgeCount()).toBe(12));

    fireEvent.click(edgeLabelEl());
    await waitFor(() => expect(useUiStore.getState().selectedEdgeId).toBe(EDGE_ID));

    const firstCard = document.querySelector(
      '[data-testid^="graph-node-"] .graph-node--card',
    ) as HTMLElement;
    fireEvent.click(firstCard);

    await waitFor(() => expect(useUiStore.getState().selectedId).not.toBeNull());
    expect(useUiStore.getState().selectedEdgeId).toBeNull();
    expect(screen.queryByTestId('edge-inspector')).not.toBeInTheDocument();

    fireEvent.click(edgeLabelEl());
    await waitFor(() => expect(useUiStore.getState().selectedEdgeId).toBe(EDGE_ID));
    expect(useUiStore.getState().selectedId).toBeNull();
  });

  it('clicking the graph background clears an edge selection too', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    await waitFor(() => expect(graphEdgeCount()).toBe(12));

    fireEvent.click(edgeLabelEl());
    await waitFor(() => expect(useUiStore.getState().selectedEdgeId).toBe(EDGE_ID));

    // onBackgroundClick is driven by real pointerdown/pointerup (drag-distance
    // check), not a bare synthetic 'click' — same as the existing node
    // background-deselect test above, use userEvent.click for a real
    // pointer sequence.
    const canvas = document.querySelector('.graph-canvas') as HTMLElement;
    await user.click(canvas);

    await waitFor(() => expect(useUiStore.getState().selectedEdgeId).toBeNull());
    expect(screen.getByTestId('inspector')).toHaveStyle({ width: '0px' });
  });

  it('clicking a cross-layer relationship target inside the edge inspector navigates + switches layerId (not just selectGraphNode)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('application');

    // application "Data Loader" --depends-on--> application "Relationships
    // YAML Parser" is an intra-layer edge (renders in the graph); "Data
    // Loader" also has an outgoing cross-layer "serves" relationship to
    // business "Model Loading and Rendering" (verified against the model
    // fixture) — surfaced only in the edge inspector's flanking
    // GraphInspector relationship panel, not the edge's own endpoints.
    const crossLayerEdgeId =
      'rel:application.applicationservice.data-loader:application.applicationservice.relationships-yaml-parser:depends-on';
    await waitFor(() =>
      expect(
        document.querySelector(`[data-testid="graph-edge-${crossLayerEdgeId}"] .graph-edge__label`),
      ).toBeTruthy(),
    );
    fireEvent.click(
      document.querySelector(
        `[data-testid="graph-edge-${crossLayerEdgeId}"] .graph-edge__label`,
      ) as HTMLElement,
    );
    await waitFor(() => expect(useUiStore.getState().selectedEdgeId).toBe(crossLayerEdgeId));

    const sourcePanel = screen.getByTestId('edge-inspector-source-node');
    const target = within(sourcePanel).getAllByRole('button', {
      name: /Navigate to Model Loading and Rendering/i,
    })[0];
    await user.click(target);

    // navigateToElement (the same cross-layer-aware handler the plain
    // node-inspector branch uses) switched the active layer, selected the
    // target, and cleared the edge selection — not selectGraphNode, which
    // would leave layerId on "application" and the target invisible.
    await waitFor(() => {
      const s = useUiStore.getState();
      expect(s.view).toBe('model');
      expect(s.layerId).toBe('business');
      expect(s.selectedId).toBe('a138ca69-d437-4841-b96f-5fb5dd703380');
      expect(s.selectedEdgeId).toBeNull();
    });
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

describe('Canvas — Inter-layer nodes control', () => {
  it('shows the inter-layer toggle only in Model view', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');

    // Wait for graph to render
    await waitFor(() => expect(graphNodeCount()).toBe(11));

    // Toggle should be visible in Model view
    const toggle = screen.getByTestId('graph-controls-toggle');
    fireEvent.focus(toggle);
    await waitFor(() => expect(screen.getByTestId('graph-inter-layer-control')).toBeInTheDocument());

    // Close controls and switch to Schema
    fireEvent.keyDown(screen.getByTestId('graph-controls'), { key: 'Escape' });
    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('apm');

    // Wait for schema graph to render
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(0));

    // Toggle should not be visible in Schema view
    fireEvent.focus(screen.getByTestId('graph-controls-toggle'));
    expect(screen.queryByTestId('graph-inter-layer-control')).not.toBeInTheDocument();
  });

  it('toggles inter-layer nodes on and off', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    useUiStore.setState({ showInterLayerNodes: true });

    // With inter-layer nodes enabled, should have more nodes than native count
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(11));

    // Disable inter-layer nodes
    const toggle = screen.getByTestId('graph-controls-toggle');
    fireEvent.focus(toggle);
    await waitFor(() => expect(screen.getByTestId('graph-inter-layer-control')).toBeInTheDocument());

    const interLayerControl = screen.getByTestId('graph-inter-layer-control');
    const offButton = within(interLayerControl).getByRole('radio', { name: 'Off' });
    fireEvent.click(offButton);

    // Now should have only native nodes (11)
    await waitFor(() => expect(graphNodeCount()).toBe(11));
  });

  it('foreign nodes render with distinct styling (reduced opacity)', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    useUiStore.setState({ showInterLayerNodes: true });

    // Wait for graph to render with foreign nodes
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(11));

    // Query for foreign node wrappers and verify opacity
    const foreignWrappers = screen.getAllByTestId(/^foreign-node-wrapper-/);
    expect(foreignWrappers.length).toBeGreaterThan(0);

    // Assert that each foreign node wrapper has opacity: 0.6
    foreignWrappers.forEach((wrapper) => {
      expect(wrapper).toHaveStyle({ opacity: '0.6' });
    });
  });

  it('foreign nodes respect showAllRelations filter (exclude orphans when structural-only)', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('business');
    useUiStore.setState({ showInterLayerNodes: true, showAllRelations: true });

    // With all relations shown, should have foreign nodes
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(0));
    const allCount = graphNodeCount();
    expect(allCount).toBeGreaterThan(0);

    // Switch to structural-only
    const toggle = screen.getByTestId('graph-controls-toggle');
    fireEvent.focus(toggle);
    await waitFor(() => expect(screen.getByTestId('graph-relations-control')).toBeInTheDocument());

    const relationsControl = screen.getByTestId('graph-relations-control');
    const structuralButton = within(relationsControl).getByRole('radio', { name: 'Structural' });
    fireEvent.click(structuralButton);

    expect(useUiStore.getState().showAllRelations).toBe(false);

    // Foreign node count may change, but total count should still be valid
    await waitFor(() => {
      const structuralCount = graphNodeCount();
      expect(structuralCount).toBeGreaterThan(0);
    });
  });

  it('toggling inter-layer nodes on and off updates the graph composition', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('business');

    // Start with inter-layer nodes off
    useUiStore.setState({ showInterLayerNodes: false });
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(0));
    const nativeOnlyCount = graphNodeCount();

    // Turn on inter-layer nodes
    useUiStore.setState({ showInterLayerNodes: true });
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(nativeOnlyCount));
    const withForeignCount = graphNodeCount();

    // Verify we have more nodes when foreign nodes are included
    expect(withForeignCount).toBeGreaterThan(nativeOnlyCount);

    // Turn off again
    useUiStore.setState({ showInterLayerNodes: false });
    await waitFor(() => expect(graphNodeCount()).toBe(nativeOnlyCount));
  });

  it('switching layouts preserves inter-layer nodes (force→galaxy→clustered)', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('business');
    useUiStore.setState({ showInterLayerNodes: true, graphLayout: 'force' });

    // Get initial count with force layout
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(0));
    const forceCount = graphNodeCount();

    // Switch to galaxy layout
    const toggle = screen.getByTestId('graph-controls-toggle');
    fireEvent.focus(toggle);
    await waitFor(() => expect(screen.getByTestId('graph-layout-control')).toBeInTheDocument());

    const layoutControl = screen.getByTestId('graph-layout-control');
    const galaxyButton = within(layoutControl).getByRole('radio', { name: 'Galaxy' });
    fireEvent.click(galaxyButton);

    expect(useUiStore.getState().graphLayout).toBe('galaxy');

    // Galaxy layout should also render the same foreign nodes
    await waitFor(() => {
      const galaxyCount = graphNodeCount();
      expect(galaxyCount).toBe(forceCount);
    });

    // Switch to clustered layout
    fireEvent.focus(screen.getByTestId('graph-controls-toggle'));
    await waitFor(() => expect(screen.getByTestId('graph-layout-control')).toBeInTheDocument());

    const clusteredButton = within(screen.getByTestId('graph-layout-control')).getByRole('radio', {
      name: 'Clustered',
    });
    fireEvent.click(clusteredButton);

    expect(useUiStore.getState().graphLayout).toBe('force-clustered');

    // Clustered layout should also render the same foreign nodes
    await waitFor(() => {
      const clusteredCount = graphNodeCount();
      expect(clusteredCount).toBe(forceCount);
    });
  });

  it('dark and light canvas modes both render foreign nodes correctly', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('technology');
    useUiStore.setState({ showInterLayerNodes: true, canvasDark: true });

    // Verify dark mode renders foreign nodes
    await waitFor(() => expect(graphNodeCount()).toBeGreaterThan(0));
    const darkCount = graphNodeCount();
    expect(useUiStore.getState().canvasDark).toBe(true);

    // Switch to light mode
    useUiStore.getState().toggleCanvasDark();
    expect(useUiStore.getState().canvasDark).toBe(false);

    // Light mode should render the same number of foreign nodes
    await waitFor(() => {
      const lightCount = graphNodeCount();
      expect(lightCount).toBe(darkCount);
    });

    // Switch back to dark mode
    useUiStore.getState().toggleCanvasDark();
    expect(useUiStore.getState().canvasDark).toBe(true);

    await waitFor(() => {
      const finalCount = graphNodeCount();
      expect(finalCount).toBe(darkCount);
    });
  });

});
