// @vitest-environment happy-dom
/**
 * NavTree.spec.tsx — the 3-level navigation tree (Section → Layer → Leaf).
 *
 * Renders the REAL NavTree + the REAL data hooks against MSW-served fixtures.
 * Counts come from the live model/spec/changeset payloads; clicks drive the
 * real `uiStore`. We assert what a user sees (rows, counts, active state) and
 * that interactions update presentation state — not implementation details.
 */

import { describe, it, expect } from 'vitest';
import { act, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NavTree } from '@/apps/embedded/ui/NavTree';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { LAYER_ORDER } from '@/apps/embedded/ui/domain';
import { renderWithProviders } from '../helpers/renderWithProviders';

import model from '../fixtures/model.json';
import changesets from '../fixtures/changesets.json';

/** Open a Model type group (#592) by its `<layer>.<type>` key. */
async function openGroup(user: ReturnType<typeof userEvent.setup>, key: string) {
  await user.click(await screen.findByTestId(`nav-type-group-${key}`));
}

/** Per-layer model element counts from the raw fixture, keyed by slug. */
function modelCountsByLayer(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of model.nodes) {
    counts[n.layer_id] = (counts[n.layer_id] ?? 0) + 1;
  }
  return counts;
}

describe('NavTree — sections', () => {
  it('renders all four sections (Architecture / Model / Schema / Changesets)', async () => {
    renderWithProviders(<NavTree />);

    expect(await screen.findByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('Schema')).toBeInTheDocument();
    expect(screen.getByText('Changesets')).toBeInTheDocument();
  });

  it('shows 12 on the Model section and the live changeset count on Changesets', async () => {
    renderWithProviders(<NavTree />);

    // The Model section row reports 12 layers.
    const modelRow = (await screen.findByText('Model')).closest('button')!;
    expect(within(modelRow).getByText('12')).toBeInTheDocument();

    // The Changesets section reports the live fixture count (3).
    const changesetCount = Object.keys(changesets.changesets).length;
    expect(changesetCount).toBe(3);
    const changesetsRow = screen.getByText('Changesets').closest('button')!;
    await waitFor(() =>
      expect(within(changesetsRow).getByText(String(changesetCount))).toBeInTheDocument(),
    );
  });
});

describe('NavTree — Model layers', () => {
  it('expands the Model section into 12 layer rows', async () => {
    renderWithProviders(<NavTree />);

    // Model is expanded by default in the initial store state — wait for data.
    await screen.findByText('Model');

    // All 12 layer rows render as depth-1 nav items. Leaf (element) rows ALSO
    // carry `nav-item--depth-1` but add the `drv-nav-l2` marker class, so we
    // exclude those to count layer rows specifically — robust even if a layer
    // is expanded and renders leaves.
    await waitFor(() => {
      const layerRows = document
        .querySelector('[data-testid="nav-tree"]')!
        .querySelectorAll('.nav-item--depth-1:not(.drv-nav-l2):not(.drv-nav-l3)');
      expect(layerRows.length).toBe(LAYER_ORDER.length);
    });
  });

  it('each Model layer row shows its live element count', async () => {
    renderWithProviders(<NavTree />);

    const counts = modelCountsByLayer();

    // Wait for the model query to resolve so counts populate (initially 0).
    await waitFor(() => {
      const motivationRow = screen.getAllByText('Motivation')[0].closest('button')!;
      expect(within(motivationRow).getByText(String(counts.motivation))).toBeInTheDocument();
    });

    // Spot-check representative layers by their (label, count) pairing.
    const applicationRow = screen.getAllByText('Application')[0].closest('button')!;
    expect(within(applicationRow).getByText(String(counts.application))).toBeInTheDocument();

    const apiRow = screen.getAllByText('API')[0].closest('button')!;
    expect(within(apiRow).getByText(String(counts.api))).toBeInTheDocument();
  });

  it('expands a layer to reveal its element leaves', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    await screen.findByText('Motivation');

    // Expand the motivation layer row.
    const motivationRow = screen.getAllByText('Motivation')[0].closest('button')!;
    await user.click(motivationRow);
    await openGroup(user, 'motivation.goal');

    // A known motivation element name appears as a leaf.
    expect(
      await screen.findByText('Visualize Multi-Layer Architecture Models'),
    ).toBeInTheDocument();

    // The store reflects the selected layer.
    expect(useUiStore.getState().layerId).toBe('motivation');
    expect(useUiStore.getState().expandedLayers.has('model:motivation')).toBe(true);
  });
});

describe('NavTree — clicks drive the uiStore', () => {
  it('clicking the Schema section switches the view to spec', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    await user.click(await screen.findByText('Schema'));

    expect(useUiStore.getState().view).toBe('spec');
    expect(useUiStore.getState().expandedSections.has('spec')).toBe(true);
  });

  it('clicking a layer row sets layerId + selects no node', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    const businessRow = (await screen.findAllByText('Business'))[0].closest('button')!;
    await user.click(businessRow);

    expect(useUiStore.getState().view).toBe('model');
    expect(useUiStore.getState().layerId).toBe('business');
    expect(useUiStore.getState().selectedId).toBeNull();
  });

  it('clicking a Model leaf navigates to that element with full context (layer + view)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    await screen.findByText('Motivation');
    await user.click(screen.getAllByText('Motivation')[0].closest('button')!);
    await openGroup(user, 'motivation.goal');

    const leaf = await screen.findByText('Visualize Multi-Layer Architecture Models');
    await user.click(leaf);

    const state = useUiStore.getState();
    // The store holds the element's UUID, layer, and correct view/focus.
    expect(state.selectedId).toBe('462e2931-4c7c-4051-a9ac-8817c270d650');
    expect(state.layerId).toBe('motivation');
    expect(state.view).toBe('model');
    expect(state.focus).toBe('node');
    // The active row carries the active class.
    await waitFor(() =>
      expect(leaf.closest('button')).toHaveClass('nav-item--active'),
    );
  });

  it('clicking a Schema leaf navigates to that node type with full context (layer + view)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    // Switch to Schema view (this clears selectedId when switching from model view).
    const schemaButton = await screen.findByText('Schema');
    await user.click(schemaButton);
    expect(useUiStore.getState().view).toBe('spec');

    // Expand data-model layer in Schema view.
    // Wait for data model to appear and then expand its layer row.
    const dataModelButtons = await screen.findAllByText('Data Model');
    const dataModelRow = dataModelButtons[dataModelButtons.length - 1].closest('button')!;
    await user.click(dataModelRow);

    // Expand should set layerId to data-model in spec view.
    expect(useUiStore.getState().layerId).toBe('data-model');
    expect(useUiStore.getState().view).toBe('spec');

    // Opening Schema collapsed Model (accordion, #560), so the only leaves in
    // the tree are the spec node types under data-model.
    // Now get the first spec node leaf under data-model.
    const navTree = screen.getByTestId('nav-tree');
    const targetLeaf = navTree.querySelector('.drv-nav-l2');

    expect(targetLeaf).not.toBeNull();

    await user.click(targetLeaf!);
    const state = useUiStore.getState();
    // The store holds the spec node id, layer, and correct view/focus.
    expect(state.selectedId).toContain('data-model.');
    expect(state.layerId).toBe('data-model');
    expect(state.view).toBe('spec');
    expect(state.focus).toBe('node');
  });

  it('clicking a leaf under a different layer switches to that layer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    // Start with application layer active.
    const applicationRow = (await screen.findAllByText('Application'))[0].closest('button')!;
    await user.click(applicationRow);
    expect(useUiStore.getState().layerId).toBe('application');

    // Expand motivation layer and click one of its leaves.
    const motivationRow = screen.getAllByText('Motivation')[0].closest('button')!;
    await user.click(motivationRow);
    await openGroup(user, 'motivation.goal');
    const motivationLeaf = await screen.findByText('Visualize Multi-Layer Architecture Models');
    await user.click(motivationLeaf);

    // The store should now reflect motivation layer, not application.
    expect(useUiStore.getState().layerId).toBe('motivation');
    expect(useUiStore.getState().selectedId).toBe('462e2931-4c7c-4051-a9ac-8817c270d650');
  });

  it('clicking a changeset leaf selects it and switches to the changesets view', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    // Expand the Changesets section.
    await user.click(await screen.findByText('Changesets'));

    // The fixture's newest changeset name renders as a leaf and is clickable.
    const csName = 'pr-497-data-pipeline-updates';
    const leaf = await screen.findByText(csName);
    await user.click(leaf);

    expect(useUiStore.getState().view).toBe('changesets');
    expect(useUiStore.getState().changesetId).toBeTruthy();
  });
});

describe('NavTree — Schema counts differ from Model', () => {
  it('Schema layer counts come from spec node-types (data-model non-zero)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    // Switch to Schema and expand it.
    await user.click(await screen.findByText('Schema'));

    // data-model has node-types in the spec even though its model layer differs.
    const dataModelRow = (await screen.findAllByText('Data Model'))[0].closest('button')!;
    const countText = within(dataModelRow)
      .getAllByText(/^\d+$/)[0]
      .textContent!.trim();
    expect(Number(countText)).toBeGreaterThan(0);
  });

  it('opens one section at a time and reports it with aria-expanded (#560)', async () => {
    const user = userEvent.setup();
    useUiStore.setState({ view: 'model', expandedSections: new Set(['model']) });
    renderWithProviders(<NavTree />);
    const section = (label: string) => screen.getAllByRole('button').find((b) => b.textContent?.startsWith(label))!;

    expect(section('Model')).toHaveAttribute('aria-expanded', 'true');
    await user.click(section('Schema'));
    expect(useUiStore.getState().view).toBe('spec');
    expect(section('Schema')).toHaveAttribute('aria-expanded', 'true');
    expect(section('Model')).toHaveAttribute('aria-expanded', 'false');

    // Clicking another section switches to it and opens it — never the old
    // "switch to Model but collapse it" state.
    await user.click(section('Model'));
    expect(useUiStore.getState().view).toBe('model');
    expect([...useUiStore.getState().expandedSections]).toEqual(['model']);

    // Clicking the current view's own section toggles it.
    await user.click(section('Model'));
    expect(useUiStore.getState().expandedSections.size).toBe(0);
  });

  it('collapses sibling sections on a URL-driven view change and cross-layer navigation (#560)', () => {
    useUiStore.setState({ view: 'model', expandedSections: new Set(['model']) });
    useUiStore.getState().setView('spec');
    expect([...useUiStore.getState().expandedSections]).toEqual(['spec']);
    useUiStore.getState().navigateToElement('some-uuid', 'api');
    expect([...useUiStore.getState().expandedSections]).toEqual(['model']);
    useUiStore.getState().selectChangeset('cs-1');
    expect([...useUiStore.getState().expandedSections]).toEqual(['changesets']);
  });
});

describe('NavTree — reveals the selection', () => {
  it('scrolls to a deep-linked leaf once the model loads, not just its layer', async () => {
    const scrolled: string[] = [];
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
      scrolled.push(this.textContent ?? '');
    };
    try {
      renderWithProviders(<NavTree />);
      // A cold deep link: the router sets layer + node before /api/model returns.
      const node = model.nodes.find((n) => n.layer_id === 'application')!;
      act(() => {
        useUiStore.getState().selectLayer('application');
        useUiStore.getState().selectNode(node.id);
      });
      expect(screen.queryByText(node.name)).not.toBeInTheDocument();

      await waitFor(() => expect(scrolled[scrolled.length - 1] ?? '').toContain(node.name));
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });
});

describe('NavTree type groups', () => {
  const goals = model.nodes.filter((n) => n.layer_id === 'motivation' && n.type === 'goal');

  it('a layer opens onto collapsed groups and a group opens without history', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    await user.click((await screen.findAllByText('Motivation'))[0].closest('button')!);
    const goal = await screen.findByTestId('nav-type-group-motivation.goal');

    // One group per type, named with the type's short plural (#605), its count
    // in NavItem's badge as on the layer rows, A–Z; all collapsed.
    const groups = screen
      .getByTestId('nav-tree')
      .querySelectorAll<HTMLButtonElement>('.drv-nav-group');
    const labels = [...groups].map(
      (g) =>
        `${g.querySelector('.nav-item__label')!.textContent} · ${g.querySelector('.nav-item__count')!.textContent}`,
    );
    const count = (type: string) =>
      model.nodes.filter((n) => n.layer_id === 'motivation' && n.type === type).length;
    expect(labels).toEqual(
      [
        ['Constraints', 'constraint'],
        ['Drivers', 'driver'],
        ['Goals', 'goal'],
        ['Principles', 'principle'],
        ['Requirements', 'requirement'],
        ['Stakeholders', 'stakeholder'],
      ].map(([label, type]) => `${label} · ${count(type)}`),
    );
    for (const g of groups) expect(g).toHaveAttribute('aria-expanded', 'false');
    expect(goal).toHaveAccessibleName(`Goals, ${goals.length} elements`);
    expect(screen.queryByText(goals[0].name)).not.toBeInTheDocument();

    // Opening a group shows its elements A–Z and touches neither the
    // navigation state nor the browser history.
    const before = { ...useUiStore.getState() };
    const historyLength = window.history.length;
    await user.click(goal);
    expect(goal).toHaveAttribute('aria-expanded', 'true');
    const leaves = [...screen.getByTestId('nav-tree').querySelectorAll('.drv-nav-l3')].map(
      (l) => l.textContent,
    );
    expect(leaves).toEqual(goals.map((n) => n.name).sort((a, b) => a.localeCompare(b)));
    const after = useUiStore.getState();
    expect(after.layerId).toBe(before.layerId);
    expect(after.selectedId).toBe(before.selectedId);
    expect(after.navSeq).toBe(before.navSeq);
    expect(window.history.length).toBe(historyLength);

    // And it closes again.
    await user.click(goal);
    expect(goal).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(goals[0].name)).not.toBeInTheDocument();
  });

  it('a type with a single element still gets its own group', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);
    await user.click((await screen.findAllByText('Security'))[0].closest('button')!);
    expect(await screen.findByTestId('nav-type-group-security.role')).toHaveAccessibleName(/, 1 element$/);
  });

  it('a selection made elsewhere opens its group and reveals its row', async () => {
    const scrolled: string[] = [];
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
      scrolled.push(this.textContent ?? '');
    };
    try {
      const user = userEvent.setup();
      renderWithProviders(<NavTree />);
      await screen.findByText('Motivation');
      const target = goals[0];

      // A cross-layer navigate (or graph click, deep link) — not a nav click.
      act(() => useUiStore.getState().navigateToElement(target.id, 'motivation'));
      const group = await screen.findByTestId('nav-type-group-motivation.goal');
      await waitFor(() => expect(group).toHaveAttribute('aria-expanded', 'true'));
      const row = screen.getByText(target.name).closest('button')!;
      expect(row).toHaveClass('nav-item--active');
      await waitFor(() => expect(scrolled[scrolled.length - 1] ?? '').toContain(target.name));

      // Closing it sticks until the next selection, which opens it again.
      await user.click(group);
      expect(group).toHaveAttribute('aria-expanded', 'false');
      act(() => useUiStore.getState().navigateToElement(goals[1].id, 'motivation'));
      await waitFor(() => expect(group).toHaveAttribute('aria-expanded', 'true'));
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });
});

describe('NavTree — Architecture section', () => {
  it('lists the C4 diagrams and opens one from its row', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);
    // The helper's fixture model reads as people, containers and components.
    await user.click((await screen.findByText('Architecture')).closest('button')!);
    expect(useUiStore.getState().view).toBe('architecture');

    const context = await screen.findByTestId('nav-c4-context');
    expect(context).toHaveClass('nav-item--active');
    await user.click(screen.getByTestId('nav-c4-containers'));
    expect(useUiStore.getState()).toMatchObject({ c4Level: 'container', c4Scope: null });
    await waitFor(() => expect(screen.getByTestId('nav-c4-containers')).toHaveClass('nav-item--active'));

    // Every element with parts gets a row, named with its part count; it opens that scope.
    const rows = await waitFor(() => {
      const found = [...document.querySelectorAll<HTMLElement>('.drv-nav-c4')];
      expect(found.length).toBeGreaterThan(0);
      return found;
    });
    expect(rows[0]).toHaveAccessibleName(/, \d+ parts?$/);
    const before = useUiStore.getState().navSeq;
    await user.click(rows[0]);
    const scope = rows[0].getAttribute('data-testid')!.replace('nav-c4-', '');
    expect(useUiStore.getState()).toMatchObject({ c4Level: 'component', c4Scope: scope, c4SelectedId: null });
    expect(useUiStore.getState().navSeq).toBe(before + 1);
    await waitFor(() => expect(rows[0]).toHaveClass('nav-item--active'));
  });

  it('counts the diagrams on the section row', async () => {
    renderWithProviders(<NavTree />);
    const row = (await screen.findByText('Architecture')).closest('button')!;
    // Context and Containers, plus one per element with parts (the model loads async).
    await waitFor(() => {
      const count = Number(row.querySelector('.nav-item__count, [class*="count"]')?.textContent);
      expect(count).toBeGreaterThan(2);
    });
  });
});
