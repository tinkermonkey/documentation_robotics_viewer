// @vitest-environment happy-dom
/**
 * ArchitectureCanvas.spec.tsx — the Architecture view against the MSW-served
 * model fixture: the level control, drill-down and back, the details drawer
 * and its links into the Model view. The layout is a stand-in grid (ELK is
 * covered by tests/unit/c4/c4Layout.spec.ts).
 */

import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';

import type { C4View } from '@/apps/embedded/data/c4/c4Views';
import type { C4Layout } from '@/apps/embedded/data/c4/c4Layout';

vi.mock('@/apps/embedded/data/c4/c4Layout', async (original) => {
  const actual = await original<typeof import('@/apps/embedded/data/c4/c4Layout')>();
  return {
    ...actual,
    layoutC4View: async (view: C4View): Promise<C4Layout> => {
      const boxes = new Map<string, { x: number; y: number; width: number; height: number }>();
      view.elements.forEach((e, i) =>
        boxes.set(e.id, { x: 40 + (i % 6) * 280, y: 60 + Math.floor(i / 6) * 160, ...actual.C4_CARD }),
      );
      return {
        width: 1800,
        height: 200 + Math.ceil(view.elements.length / 6) * 160,
        boxes,
        boundary: view.scope ? { x: 20, y: 20, width: 1760, height: 120 } : null,
        edges: [],
      };
    },
  };
});

import { ArchitectureCanvas } from '@/apps/embedded/ui/ArchitectureCanvas';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { buildC4Model, C4_SYSTEM_ID } from '@/apps/embedded/data/c4/c4Model';
import { buildC4View, defaultComponentScope } from '@/apps/embedded/data/c4/c4Views';
import type { ModelPayload } from '@/apps/embedded/data/useModel';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';
import { derive } from '../unit/c4/fixture';
import modelFixture from '../fixtures/model.json';

// What the fixture reads as, by the same rules the view uses (no spec check:
// the spec fixture is older than the rules).
const payload = modelFixture as unknown as ModelPayload;
const c4 = buildC4Model(derive(payload.nodes, payload.links));
const containers = buildC4View(c4, 'container');
const firstContainer = containers.elements.find((e) => e.inScope && e.drillable)!;

const cards = () => screen.findAllByTestId('c4-card');

/** Render the view (the helper resets the store first), then open a diagram as the nav or URL would. */
async function renderAt(level: 'context' | 'container' | 'component') {
  renderWithProviders(<ArchitectureCanvas />);
  act(() => useUiStore.getState().showC4(level));
  await waitFor(() => expect(screen.getByTestId('c4-diagram')).toBeInTheDocument());
}

describe('ArchitectureCanvas', () => {
  it('opens on the system context: the system as one box, with who and what is around it', async () => {
    renderWithProviders(<ArchitectureCanvas />);
    expect(await screen.findByRole('heading', { name: 'System Context' })).toBeInTheDocument();
    const context = buildC4View(c4, 'context');
    await waitFor(async () => expect(await cards()).toHaveLength(context.elements.length));
    expect(screen.getByTestId('c4-diagram')).toHaveAttribute('data-level', 'context');
    expect(screen.queryByTestId('c4-trail')).not.toBeInTheDocument();
    // The line under the diagram says how much of the model is on the diagrams.
    expect(screen.getByTestId('c4-footnote')).toHaveTextContent(`${c4.elements.length} C4 elements`);
    expect(screen.getByTestId('c4-footnote')).toHaveTextContent(`${c4.unplaced.total} not on any diagram`);
  });

  it('switches level from the header control', async () => {
    renderWithProviders(<ArchitectureCanvas />);
    await cards();
    fireEvent.click(within(screen.getByTestId('c4-level-control')).getByText('Containers'));
    expect(await screen.findByRole('heading', { name: 'Containers' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('c4-diagram')).toHaveAttribute('data-level', 'container'));
    expect(useUiStore.getState()).toMatchObject({ view: 'architecture', c4Level: 'container', c4Scope: null });
    expect(screen.getByTestId('c4-count')).toHaveTextContent(`${containers.elements.filter((e) => e.inScope).length} in scope`);
  });

  it('drills from a container into its components and back', async () => {
    await renderAt('container');
    await waitFor(() => expect(screen.getByTestId('c4-diagram')).toHaveAttribute('data-level', 'container'));
    const before = useUiStore.getState().navSeq;

    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Open ${firstContainer.element.name}: `) }));
    expect(useUiStore.getState()).toMatchObject({ c4Level: 'component', c4Scope: firstContainer.id });
    // A drill-down is a navigation: the router pushes history for it.
    expect(useUiStore.getState().navSeq).toBe(before + 1);
    expect(await screen.findByRole('heading', { name: new RegExp(`^${firstContainer.element.name}`) })).toBeInTheDocument();
    const parts = buildC4View(c4, 'component', firstContainer.id);
    await waitFor(async () => expect(await cards()).toHaveLength(parts.elements.length));
    // The drilled card is gone: focus moves into the new diagram, not to the page.
    await waitFor(() => expect(screen.getByTestId('c4-diagram')).toContainElement(document.activeElement as HTMLElement));

    // Back up through the breadcrumb: the system is the Containers diagram.
    const trail = screen.getByTestId('c4-trail');
    expect(within(trail).getByText(firstContainer.element.name)).toHaveAttribute('aria-current', 'page');
    fireEvent.click(within(trail).getByRole('button', { name: c4.byId.get(C4_SYSTEM_ID)!.name }));
    expect(useUiStore.getState()).toMatchObject({ c4Level: 'container', c4Scope: null });
    expect(await screen.findByRole('heading', { name: 'Containers' })).toBeInTheDocument();
  });

  it('shows the default container when the Components level has no scope', async () => {
    await renderAt('component');
    const scope = c4.byId.get(defaultComponentScope(c4)!)!;
    // The header's chip ("components") is part of the heading.
    expect(await screen.findByRole('heading', { name: new RegExp(`^${scope.name}`) })).toBeInTheDocument();
  });

  it('opens the details of a selected box, and a model element from them', async () => {
    await renderAt('container');
    await waitFor(() => expect(screen.getByTestId('c4-diagram')).toHaveAttribute('data-level', 'container'));
    expect(screen.queryByTestId('c4-details')).not.toBeInTheDocument();

    const target = containers.elements.find((e) => e.inScope && e.element.sources.length > 0)!;
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${target.element.name}, `) }));
    expect(useUiStore.getState().c4SelectedId).toBe(target.id);

    const details = await screen.findByTestId('c4-details');
    expect(within(details).getByRole('heading', { name: target.element.name })).toBeInTheDocument();
    const links = within(details).getAllByTestId('c4-source-link');
    expect(links).toHaveLength(target.element.sources.length);

    // A source opens that element in the Model view.
    const source = target.element.sources[0];
    fireEvent.click(links[0]);
    expect(useUiStore.getState()).toMatchObject({ view: 'model', layerId: source.layerId, selectedId: source.id });
  });

  it('closes the details from their Close button', async () => {
    await renderAt('container');
    await waitFor(() => expect(screen.getByTestId('c4-diagram')).toHaveAttribute('data-level', 'container'));
    act(() => useUiStore.getState().selectC4(firstContainer.id));
    fireEvent.click(await screen.findByTestId('c4-details-close'));
    expect(useUiStore.getState().c4SelectedId).toBeNull();
  });

  describe('Changeset picker', () => {
    /** A changeset list with staged and applied changesets, newest first by created. */
    function serveChangesets() {
      const entry = (name: string, status: string, created: string, changes = 3, purpose?: string) => ({
        name,
        status,
        created,
        changes_count: changes,
        ...(purpose ? { purpose } : {}),
      });
      mswServer.use(
        http.get('*/api/changesets', () =>
          HttpResponse.json({
            version: '1',
            changesets: {
              'cs-applied-new': entry('applied-newest', 'committed', '2026-11-20T00:00:00Z', 5, 'plan'),
              'cs-staged-old': entry('staged-older', 'staged', '2026-11-01T00:00:00Z', 2, 'chat'),
              'cs-staged-new': entry('staged-newer', 'staged', '2026-11-19T00:00:00Z', 4, 'plan'),
              'cs-discarded': entry('thrown-away', 'discarded', '2026-11-18T00:00:00Z'),
              'cs-empty': entry('nothing-in-it', 'staged', '2026-11-17T00:00:00Z', 0),
            },
          }),
        ),
      );
    }

    async function openPicker() {
      const picker = await screen.findByTestId('c4-changeset-picker');
      fireEvent.click(within(picker).getByRole('button'));
      return screen.findByRole('listbox');
    }

    it('lists staged changesets before applied ones, with None first, and leaves out discarded and empty ones', async () => {
      serveChangesets();
      await renderAt('context');
      const listbox = await openPicker();
      await waitFor(() => expect(within(listbox).getAllByRole('option')).toHaveLength(4));
      const options = within(listbox).getAllByRole('option');
      expect(options.map((o) => o.textContent)).toEqual([
        'No changeset',
        expect.stringContaining('staged-newer'),
        expect.stringContaining('staged-older'),
        expect.stringContaining('applied-newest'),
      ]);
      expect(options[1]).toHaveTextContent('plan · staged, shown applied');
      expect(options[3]).toHaveTextContent('plan · applied, shown reverted');
      expect(listbox).not.toHaveTextContent('thrown-away');
      expect(listbox).not.toHaveTextContent('nothing-in-it');
    });

    it('selecting a changeset overlays it (a navigation) and keeps the diagram; None clears it', async () => {
      serveChangesets();
      await renderAt('container');
      const before = useUiStore.getState().navSeq;
      let listbox = await openPicker();
      fireEvent.click(await within(listbox).findByRole('option', { name: /staged-older/ }));
      expect(useUiStore.getState()).toMatchObject({ c4ChangesetId: 'cs-staged-old', c4Level: 'container', changesetId: null });
      expect(useUiStore.getState().navSeq).toBe(before + 1);

      listbox = await openPicker();
      fireEvent.click(within(listbox).getByRole('option', { name: /No changeset/ }));
      expect(useUiStore.getState().c4ChangesetId).toBeNull();
    });

    it('still shows a ?changeset= the list does not hold, by its id', async () => {
      serveChangesets();
      await renderAt('context');
      act(() => useUiStore.getState().restoreC4('context', null, null, 'cs-unknown'));
      const listbox = await openPicker();
      expect(await within(listbox).findByRole('option', { name: /cs-unknown/ })).toHaveAttribute('aria-selected', 'true');
    });
  });
});
