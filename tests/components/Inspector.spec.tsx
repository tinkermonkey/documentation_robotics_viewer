// @vitest-environment happy-dom
/**
 * Inspector.spec.tsx — the right-pane element/spec detail surface.
 *
 * Renders the REAL Inspector (Heimdall GraphInspector + our AnnotationsSection)
 * with the REAL data hooks against MSW fixtures. We seed a selection through the
 * real `uiStore` actions, then assert what a user observes: title/id/properties,
 * relationship rows, navigation on click (cross-layer switches layerId), and
 * that AnnotationsSection mounts ONLY for Model elements.
 */

import { describe, it, expect } from 'vitest';
import { screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Inspector } from '@/apps/embedded/ui/Inspector';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';

// Cross-layer element: application "Data Loader" → serves → business
// "Model Loading and Rendering" (verified against the model fixture).
const DATA_LOADER_UUID = 'a5342d6f-daf4-4a6e-a98b-7fada2561798';
const MODEL_LOADING_UUID = 'a138ca69-d437-4841-b96f-5fb5dd703380';

// Annotated motivation goal (has seeded annotations in the fixture).
const GOAL_UUID = '462e2931-4c7c-4051-a9ac-8817c270d650';

/** Seed the store to a selected Model element, then render. */
function renderModelSelection(layerId: string, selectedId: string) {
  const result = renderWithProviders(<Inspector />);
  useUiStore.getState().setView('model');
  useUiStore.getState().selectLayer(layerId);
  useUiStore.getState().selectNode(selectedId);
  return result;
}

describe('Inspector — Model element detail', () => {
  it('renders the element title, id and a curated PROPERTIES grid', async () => {
    renderModelSelection('application', DATA_LOADER_UUID);

    // Title + the element's dotted path (the design's identity line, #559).
    expect(await screen.findByTestId('inspector-title')).toHaveTextContent('Data Loader');
    expect(screen.getByTestId('inspector-id')).toHaveTextContent(/^application\.[a-z]+\.data-loader$/);
    expect(screen.getByTestId('inspector-id')).not.toHaveTextContent(DATA_LOADER_UUID);

    // The curated metadata grid carries layer + type + provenance (not a raw
    // attribute spread).
    const metadata = screen.getByTestId('inspector-metadata');
    expect(within(metadata).getByText('layer')).toBeInTheDocument();
    expect(within(metadata).getByText('Application')).toBeInTheDocument();
    expect(within(metadata).getByText('type')).toBeInTheDocument();
    expect(within(metadata).getByText('provenance')).toBeInTheDocument();
  });

  it('renders Outgoing + Incoming relationship rows', async () => {
    renderModelSelection('application', DATA_LOADER_UUID);

    // Outgoing list contains the cross-layer "serves" target (the fixture has
    // it twice — assert at least one) plus an intra-layer "depends-on".
    const outgoing = await screen.findByTestId('inspector-outgoing');
    expect(
      within(outgoing).getAllByText('Model Loading and Rendering').length,
    ).toBeGreaterThan(0);
    expect(within(outgoing).getByText('Relationships YAML Parser')).toBeInTheDocument();

    // Incoming list carries inbound relationships from other elements.
    const incoming = await screen.findByTestId('inspector-incoming');
    expect(within(incoming).getByText('Model Store')).toBeInTheDocument();
  });
});

describe('Inspector — Model kind badge NodeTypeTooltip', () => {
  it('shows the rich node-type tooltip on hover/focus of the interactive kind badge', async () => {
    renderModelSelection('application', DATA_LOADER_UUID);

    const badge = await screen.findByTestId('inspector-kind-tooltip');
    expect(within(badge).getByText('applicationservice')).toBeInTheDocument();

    fireEvent.focus(within(badge).getByText('applicationservice'));
    const tooltip = await screen.findByRole('tooltip');
    // "ApplicationService" (the title) also appears among the connection
    // rows below (e.g. a "depends-on · ApplicationService" relationship), so
    // scope to the tooltip's own title element specifically.
    expect(tooltip.querySelector('.rich-tooltip__title')).toHaveTextContent(
      'ApplicationService',
    );
    expect(
      within(tooltip).getByText('Service that exposes application functionality'),
    ).toBeInTheDocument();
  });

  it("does not duplicate the plain kind badge — GraphInspector's own head no longer renders it", async () => {
    renderModelSelection('application', DATA_LOADER_UUID);
    await screen.findByTestId('inspector-title');

    // Only our interactive badge should carry the `graph-inspector__badge`
    // class with this text — GraphInspector's own head-eyebrow badge is
    // suppressed (kind: undefined) to avoid a duplicate (the element's raw
    // type also legitimately appears in the PROPERTIES metadata grid below,
    // which is a separate, unrelated display).
    const badges = screen
      .getAllByText('applicationservice')
      .filter((el) => el.classList.contains('graph-inspector__badge'));
    expect(badges).toHaveLength(1);
  });
});

describe('Inspector — kind badge cross-view navigation', () => {
  it('clicking the kind badge navigates to the node type\'s entry in the Schema view', async () => {
    renderModelSelection('application', DATA_LOADER_UUID);

    const badge = await screen.findByTestId('inspector-kind-tooltip');
    // fireEvent.click, not userEvent.click — the badge sits inside
    // NodeTypeBadge's hover-tracked RichTooltip overlay (see the identical
    // gotcha noted in PageView.spec.tsx / CLAUDE.md).
    fireEvent.click(within(badge).getByText('applicationservice'));

    const s = useUiStore.getState();
    expect(s.view).toBe('spec');
    expect(s.layerId).toBe('application');
    expect(s.selectedId).toBe('application.applicationservice');
  });
});

describe('Inspector — relationship navigation', () => {
  it('clicking a cross-layer relationship target navigates + switches layerId', async () => {
    const user = userEvent.setup();
    renderModelSelection('application', DATA_LOADER_UUID);

    const outgoing = await screen.findByTestId('inspector-outgoing');
    const target = within(outgoing).getAllByRole('button', {
      name: /Navigate to Model Loading and Rendering/i,
    })[0];
    await user.click(target);

    // navigateToElement switched the active layer to the target's (business)
    // and selected the target, while staying in the model view.
    await waitFor(() => {
      const s = useUiStore.getState();
      expect(s.view).toBe('model');
      expect(s.layerId).toBe('business');
      expect(s.selectedId).toBe(MODEL_LOADING_UUID);
    });
  });

  it('shows the rich predicate tooltip on hover/focus of relationship predicates', async () => {
    renderModelSelection('application', DATA_LOADER_UUID);

    // Find the outgoing relationships section and get a predicate span.
    const outgoing = await screen.findByTestId('inspector-outgoing');
    const predicateTooltips = within(outgoing).getAllByTestId(
      /relationship-predicate-tooltip/,
    );
    expect(predicateTooltips.length).toBeGreaterThan(0);

    // Focus the first predicate to trigger the tooltip.
    const predicateSpan = predicateTooltips[0].querySelector('span');
    fireEvent.focus(predicateSpan || predicateTooltips[0]);
    const tooltip = await screen.findByRole('tooltip');

    // The tooltip should show the predicate and relationship section label.
    expect(tooltip.querySelector('.rich-tooltip__title')).toBeInTheDocument();
    expect(
      within(tooltip).getByText('Relationship'),
    ).toBeInTheDocument();
  });
});

describe('Inspector — followed across layers (heimdall-ui 0.10 reach)', () => {
  // security "Bearer Token Policy": constrained-by application "Graph Viewer",
  // which realizes business "Architecture Model Visualization" — a hop-2 row.
  const BEARER_UUID = 'f502d58f-1a96-44d5-8fb8-c7e5e67f3f0d';
  const AMV_UUID = '35295e18-08a8-4ca0-ada3-40a017cb4318';
  // motivation "Development Team": has direct links but nothing past them at +1.
  const DEV_TEAM_UUID = 'e7b0e422-b8fa-416b-89b0-cd724465ff98';

  it('lists a hop-2 element with its +1 badge, a via line and the reach summary at the default +1 layer', async () => {
    renderModelSelection('security', BEARER_UUID);

    const section = await screen.findByTestId('inspector-followed');
    const row = within(section).getByTestId(`inspector-followed-row-${AMV_UUID}`);
    // The via line carries the element it was reached through and the
    // predicate of THAT link — not a leading arrow + predicate, which would
    // read as the selection's own relationship.
    expect(within(row).getByText(/^via .+/)).toBeInTheDocument();
    expect(row.querySelector(':scope > .graph-inspector__rel-dir')).toBeNull();
    expect(within(row).getByText('+1')).toHaveAttribute('aria-hidden', 'true');
    expect(within(section).getByTestId('inspector-reach-summary')).toHaveTextContent(
      /reach \d+ elements across \d+ layers/,
    );
  });

  it('gives followed rows an accessible name with layer, depth and how it was reached', async () => {
    renderModelSelection('security', BEARER_UUID);

    const section = await screen.findByTestId('inspector-followed');
    const button = within(within(section).getByTestId(`inspector-followed-row-${AMV_UUID}`)).getByRole('button');
    expect(button).toHaveAccessibleName(/^Navigate to Architecture Model Visualization, Business layer, 1 layer past direct, via .+, which .+$/);
  });

  it('draws a reach strip with one segment per reached layer', async () => {
    renderModelSelection('security', BEARER_UUID);

    const strip = await screen.findByTestId('inspector-reach-strip');
    expect(strip).toHaveAttribute('aria-label', expect.stringMatching(/^Reached by layer: .*Business \d+/));
    const layers = Array.from(strip.children).map((c) => c.getAttribute('data-layer'));
    expect(layers).toContain('business');
    expect(new Set(layers).size).toBe(layers.length);
  });

  it('names the other layer on direct cross-layer rows, but not on same-layer rows', async () => {
    renderModelSelection('security', BEARER_UUID);

    const target = await screen.findByRole('button', { name: 'Navigate to Graph Viewer, Application layer' });
    expect(within(target.closest('li')!).getByText('Application')).toBeInTheDocument();
    const sameLayer = screen.getAllByRole('button', { name: /^Navigate to [^,]+$/ });
    expect(sameLayer.length).toBeGreaterThan(0);
    for (const b of sameLayer) expect(b.closest('li')!.querySelector('.drv-rel-layer')).toBeNull();
  });

  it('shows "Nothing further across layers." outside GraphInspector, so its empty-state CSS does not hide it', async () => {
    renderModelSelection('motivation', DEV_TEAM_UUID);

    const section = await screen.findByTestId('inspector-followed');
    const empty = await within(section).findByText('Nothing further across layers.');
    // domain-and-nav.css hides `.graph-inspector--custom-relationships .graph-inspector .graph-inspector__empty-mini`.
    expect(empty.closest('.graph-inspector--custom-relationships')).not.toBeNull();
    expect(empty.closest('.graph-inspector')).toBeNull();
    expect(within(section).getByTestId('inspector-reach-summary')).toHaveTextContent(/reach [1-9]\d* element/);
  });

  it('switching Follow to Direct empties the followed list and persists the choice', async () => {
    const user = userEvent.setup();
    renderModelSelection('security', BEARER_UUID);

    const section = await screen.findByTestId('inspector-followed');
    await user.click(within(section).getByRole('radio', { name: 'Direct' }));

    expect(useUiStore.getState().inspectorFollow).toBe(0);
    expect(await within(section).findByText('Direct links only.')).toBeInTheDocument();
    expect(within(section).queryByText(/^via /)).not.toBeInTheDocument();
  });

  it('+2 layers adds rows carrying a +2 hop badge', async () => {
    const user = userEvent.setup();
    renderModelSelection('security', BEARER_UUID);

    const section = await screen.findByTestId('inspector-followed');
    expect(within(section).queryByText('+2')).not.toBeInTheDocument();
    await user.click(within(section).getByRole('radio', { name: '+2 layers' }));
    expect((await within(section).findAllByText('+2')).length).toBeGreaterThan(0);
  });

  it('clicking a followed row navigates to that element in its own layer', async () => {
    const user = userEvent.setup();
    renderModelSelection('security', BEARER_UUID);

    const section = await screen.findByTestId('inspector-followed');
    await user.click(
      within(within(section).getByTestId(`inspector-followed-row-${AMV_UUID}`)).getByRole('button'),
    );
    await waitFor(() => {
      const s = useUiStore.getState();
      expect(s.view).toBe('model');
      expect(s.layerId).toBe('business');
      expect(s.selectedId).toBe(AMV_UUID);
    });
  });

  it('is not shown for a Schema node', async () => {
    renderWithProviders(<Inspector />);
    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('data-model');
    useUiStore.getState().selectNode('data-model.objectschema');

    await waitFor(() => expect(useUiStore.getState().view).toBe('spec'));
    expect(screen.queryByTestId('inspector-followed')).not.toBeInTheDocument();
  });
});

describe('Inspector — stale edge selection guard', () => {
  it('clears selectedEdgeId once the model has loaded and the id no longer resolves', async () => {
    renderWithProviders(<Inspector />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    // A link id that never existed in the fixture — same shape as a dead
    // WS-removed link or a stale bookmarked ?edge= param.
    useUiStore.setState({ selectedEdgeId: 'rel:does-not-exist', selectedId: null });

    await waitFor(() => {
      expect(useUiStore.getState().selectedEdgeId).toBeNull();
    });
  });

  it('leaves a resolvable selectedEdgeId untouched', async () => {
    const result = renderWithProviders(<Inspector />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm');
    useUiStore.getState().selectEdge(
      'rel:apm.alert.web-socket-disconnect-alert:apm.metricinstrument.web-socket-connection-state-gauge:monitors',
    );

    await result.findByTestId('edge-inspector-predicate-tooltip');
    expect(useUiStore.getState().selectedEdgeId).toBe(
      'rel:apm.alert.web-socket-disconnect-alert:apm.metricinstrument.web-socket-connection-state-gauge:monitors',
    );
  });
});

describe('Inspector — AnnotationsSection mounting', () => {
  it('mounts the annotations section for a selected Model element', async () => {
    renderModelSelection('motivation', GOAL_UUID);

    // The annotations section appears (keyed by the element's dotted id) and
    // loads the seeded annotations.
    expect(await screen.findByTestId('annotations-section')).toBeInTheDocument();
    expect(
      await screen.findByText('Seed annotation for the goal element.'),
    ).toBeInTheDocument();
  });

  it('does NOT mount the annotations section when nothing is selected', async () => {
    renderWithProviders(<Inspector />);
    useUiStore.getState().setView('model');

    // GraphInspector shows its own empty state; no annotations section.
    expect(await screen.findByTestId('inspector-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('annotations-section')).not.toBeInTheDocument();
  });

  it('does NOT mount the annotations section for a Schema node', async () => {
    renderWithProviders(<Inspector />);
    // Schema view with a spec node selected — annotations apply to Model
    // elements only.
    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('data-model');
    useUiStore.getState().selectNode('data-model.objectschema');

    await waitFor(() =>
      expect(useUiStore.getState().view).toBe('spec'),
    );
    expect(screen.queryByTestId('annotations-section')).not.toBeInTheDocument();
  });
});
