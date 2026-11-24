// @vitest-environment happy-dom
/**
 * C4Overlay.spec.tsx — a STAGED changeset (and one APPLIED, reverted) laid over the Architecture view's
 * diagrams: op marks and status chips
 * on the cards, a ghost for the removed box, the roll-up on the box whose parts
 * changed, the bar's tally and Clear, the drawer's "In this changeset" section
 * and its link into the Changesets view, and the accessible names.
 *
 * The changeset is built over the MSW model fixture with the unit fixture's
 * change builders; what each box should read as comes from the same pure
 * pipeline the view uses (overlayModel → buildC4Model → diffC4). The layout is
 * a stand-in grid with straight arrows (ELK is c4Layout.spec.ts's).
 */

import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

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
      const centre = (id: string) => {
        const b = boxes.get(id)!;
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      };
      return {
        width: 1800,
        height: 200 + Math.ceil(view.elements.length / 6) * 160,
        boxes,
        boundary: view.scope ? { x: 20, y: 20, width: 1760, height: 120 } : null,
        edges: view.relationships.map((r) => ({ id: r.id, points: [centre(r.sourceId), centre(r.targetId)] })),
      };
    },
  };
});

import { ArchitectureCanvas } from '@/apps/embedded/ui/ArchitectureCanvas';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { C4_SYSTEM_ID, buildC4Model } from '@/apps/embedded/data/c4/c4Model';
import { buildC4View } from '@/apps/embedded/data/c4/c4Views';
import { diffC4 } from '@/apps/embedded/data/c4/c4Diff';
import { overlayModel } from '@/apps/embedded/data/modelOverlay';
import type { ModelPayload } from '@/apps/embedded/data/useModel';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';
import { addElement, deleteElement, derive, node, updateElement } from '../unit/c4/fixture';
import modelFixture from '../fixtures/model.json';

// ─── The changeset, and what it should read as ──────────────────────────────

const payload = modelFixture as unknown as ModelPayload;
const model = derive(payload.nodes, payload.links);
const base = buildC4Model(model);
const containerView = buildC4View(base, 'container');
const nodeOf = (uuid: string) => payload.nodes.find((n) => n.id === uuid)!;

// A container whose parts include a plain component: that component is deleted.
const parent = containerView.elements.find((e) => {
  if (!e.inScope || !e.drillable) return false;
  return buildC4View(base, 'component', e.id).elements.some((p) => p.inScope && !p.drillable && p.element.sources.length === 1);
})!;
const doomed = buildC4View(base, 'component', parent.id).elements.find(
  (p) => p.inScope && !p.drillable && p.element.sources.length === 1,
)!;
// Another container with a model element of its own gets a new description.
const edited = containerView.elements.find((e) => e.inScope && e.id !== parent.id && e.element.sources.length > 0)!;

const changes = [
  deleteElement(nodeOf(doomed.element.sources[0].id), 1),
  updateElement(nodeOf(edited.element.sources[0].id), { description: 'Now with a changeset overlay.' }, 2),
  addElement('application.applicationcomponent', 'Overlay Probe', {}, 3),
];
const { model: afterModel, trace } = overlayModel(model, changes, 'apply');
const diff = diffC4(base, buildC4Model(afterModel), trace);
const addedId = [...diff.elements.values()].find((d) => d.status === 'added')!.id;

const CS_ID = 'cs-overlay';

function serveChangeset() {
  const detail = {
    id: CS_ID,
    name: 'overlay-probe',
    status: 'staged',
    created: '2026-11-21T00:00:00Z',
    purpose: 'plan',
    revision: 4,
    changes,
  };
  mswServer.use(
    http.get('*/api/projects/:project/checkouts/:checkout/changesets', () =>
      HttpResponse.json({
        version: '1',
        changesets: { [CS_ID]: { name: 'overlay-probe', status: 'staged', created: detail.created, changes_count: 3, purpose: 'plan' } },
      }),
    ),
    http.get(`*/api/projects/:project/checkouts/:checkout/changesets/${CS_ID}`, () => HttpResponse.json(detail)),
  );
}

/** Render, then open a diagram with the changeset laid over it, as the URL would. */
async function renderOverlay(level: 'context' | 'container' | 'component', scope: string | null = null) {
  serveChangeset();
  renderWithProviders(<ArchitectureCanvas />);
  act(() => useUiStore.getState().showC4(level, scope, { changesetId: CS_ID }));
  await screen.findByTestId('c4-bar-tally');
  await waitFor(() => expect(screen.getByTestId('c4-diagram')).toHaveAttribute('data-level', level));
}

const card = (id: string) => document.querySelector<HTMLElement>(`[data-testid="c4-card"][data-c4-id="${CSS.escape(id)}"]`);

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('C4 changeset overlay (staged changeset)', () => {
  it('the fixture changeset does what the tests expect', () => {
    expect(diff.elements.get(doomed.id)?.status).toBe('removed');
    expect(diff.elements.get(edited.id)?.status).toBe('changed');
    expect(diff.rollUp.get(parent.id)?.sequences).toContain(1);
  });

  it('marks the changed box with an outline and a chip, and rolls up the changes inside a box', async () => {
    await renderOverlay('container');
    await waitFor(() => expect(card(edited.id)).toHaveAttribute('data-status', 'changed'));

    const changed = card(edited.id)!;
    expect(within(changed).getByTestId('c4-card-mark')).toBeInTheDocument();
    expect(within(changed).getByTestId('c4-card-status')).toHaveTextContent('~ changed');
    // The status is in the accessible name, not only drawn.
    expect(within(changed).getByRole('button', { name: new RegExp(`^${edited.element.name}, .*, changed`) })).toBeInTheDocument();

    const holder = card(parent.id)!;
    const inside = diff.rollUp.get(parent.id)!.sequences.length;
    expect(within(holder).getByTestId('c4-card-rollup')).toHaveTextContent(`${inside} ${inside === 1 ? 'change' : 'changes'} inside`);
    expect(within(holder).getByRole('button', { name: new RegExp(`${inside} changes? inside`) })).toBeInTheDocument();

    // Boxes the changeset leaves alone carry no mark.
    const untouched = containerView.elements.find((e) => !diff.elements.has(e.id) && !diff.rollUp.has(e.id));
    if (untouched) expect(within(card(untouched.id)!).queryByTestId('c4-card-mark')).not.toBeInTheDocument();
  });

  it('draws the removed box as a ghost that can be selected but not opened', async () => {
    await renderOverlay('component', parent.id);
    await waitFor(() => expect(card(doomed.id)).toHaveAttribute('data-status', 'removed'));
    const ghost = card(doomed.id)!;
    expect(ghost).toHaveClass('c4-card--ghost');
    expect(within(ghost).getByTestId('c4-card-status')).toHaveTextContent('− removed');
    expect(within(ghost).queryByTestId('c4-card-drill')).not.toBeInTheDocument();
    const button = within(ghost).getByRole('button', { name: new RegExp(`^${doomed.element.name}, .*, removed`) });

    // Selected, its drawer says what the changeset does to it and lists the change behind it.
    fireEvent.click(button);
    const details = await screen.findByTestId('c4-details');
    expect(within(details).getByTestId('c4-details-ghost')).toHaveTextContent('The changeset removes this box.');
    const section = within(details).getByTestId('c4-details-changes');
    const rows = within(section).getAllByTestId('c4-details-change');
    expect(rows[0]).toHaveTextContent('deleted');
    expect(rows[0]).toHaveTextContent(doomed.element.name);

    // The change opens in the Changesets view's review, on that change.
    fireEvent.click(within(rows[0]).getByRole('button', { name: 'Open change 1 in the Changesets view' }));
    expect(useUiStore.getState()).toMatchObject({ view: 'changesets', changesetId: CS_ID, changeSeq: 1 });
  });

  it('marks the added box, where it lands', async () => {
    const parentOfAdded = diff.parentOf.get(addedId)!;
    await renderOverlay('component', parentOfAdded);
    await waitFor(() => expect(card(addedId)).toHaveAttribute('data-status', 'added'));
    expect(within(card(addedId)!).getByTestId('c4-card-status')).toHaveTextContent('+ added');
    expect(within(card(addedId)!).getByRole('button', { name: /^Overlay Probe, .*, added/ })).toBeInTheDocument();
  });

  it('the bar names the changeset and says what differs, with a legend; Clear takes the overlay off', async () => {
    await renderOverlay('container');
    const bar = screen.getByTestId('c4-changeset-bar');
    expect(within(bar).getByTestId('c4-bar-name')).toHaveTextContent('overlay-probe');
    expect(bar).toHaveTextContent('plan · staged, shown applied');
    const tally = within(bar).getByTestId('c4-bar-tally');
    expect(tally).toHaveTextContent(`${diff.tally.elements.added} added`);
    expect(tally).toHaveTextContent(`${diff.tally.elements.removed} removed`);
    expect(tally).toHaveTextContent(`${diff.tally.elements.changed} changed`);
    expect(within(bar).getByTestId('c4-bar-legend')).toHaveTextContent('removed (drawn faded)');
    // A staged changeset doesn't need the reverted note.
    expect(within(bar).queryByTestId('c4-bar-revert-note')).not.toBeInTheDocument();

    const before = useUiStore.getState().navSeq;
    fireEvent.click(within(bar).getByTestId('c4-bar-clear'));
    expect(useUiStore.getState().c4ChangesetId).toBeNull();
    expect(useUiStore.getState().navSeq).toBe(before + 1);
    await waitFor(() => expect(screen.queryByTestId('c4-changeset-bar')).not.toBeInTheDocument());
    expect(screen.queryAllByTestId('c4-card-mark')).toHaveLength(0);
  });

  it('lets go of a selected box once the overlay that drew it is cleared', async () => {
    // The added box is only on the diagram while the staged changeset is laid over it.
    await renderOverlay('component', diff.parentOf.get(addedId)!);
    await waitFor(() => expect(card(addedId)).toBeInTheDocument());
    act(() => useUiStore.getState().selectC4(addedId));
    expect(await screen.findByTestId('c4-details')).toBeInTheDocument();
    act(() => useUiStore.getState().showC4Overlay(null));
    await waitFor(() => expect(useUiStore.getState().c4SelectedId).toBeNull());
  });

  it('lists the arrows with their status for assistive technology', async () => {
    await renderOverlay('component', parent.id);
    await waitFor(() => expect(card(doomed.id)).toBeInTheDocument());
    const list = screen.getByTestId('c4-relationship-list');
    const removedArrows = [...list.querySelectorAll('li')].filter((li) => li.textContent?.endsWith('— removed'));
    const drawnRemoved = document.querySelectorAll('[data-testid="c4-edge"][data-status="removed"]').length;
    expect(drawnRemoved).toBeGreaterThan(0);
    expect(removedArrows).toHaveLength(drawnRemoved);
  });
});

describe('C4 changeset overlay (applied changeset, shown reverted)', () => {
  // The applied changeset deleted a person: reverted, it is a ghost on the Context diagram whose model
  // element no longer exists, so its drawer names it without a link into the Model view.
  // (A business role: the spec fixture predates product.persona.)
  const gone = node('business.businessrole', 'Departed Reviewer');
  const APPLIED_ID = 'cs-applied';

  function serveApplied() {
    const created = '2026-11-20T00:00:00Z';
    mswServer.use(
      http.get('*/api/projects/:project/checkouts/:checkout/changesets', () =>
        HttpResponse.json({
          version: '1',
          changesets: { [APPLIED_ID]: { name: 'retire-persona', status: 'committed', created, changes_count: 1, purpose: 'plan' } },
        }),
      ),
      http.get(`*/api/projects/:project/checkouts/:checkout/changesets/${APPLIED_ID}`, () =>
        HttpResponse.json({ id: APPLIED_ID, name: 'retire-persona', status: 'committed', created, purpose: 'plan', revision: 1, changes: [deleteElement(gone, 1)] }),
      ),
    );
  }

  it('opens no Model view link from a box whose model element the changeset deleted', async () => {
    serveApplied();
    renderWithProviders(<ArchitectureCanvas />);
    act(() => useUiStore.getState().showC4('context', null, { changesetId: APPLIED_ID }));
    await screen.findByTestId('c4-bar-tally');
    const ghostId = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-testid="c4-card"][data-status="removed"]');
      expect(el).not.toBeNull();
      return el!.dataset.c4Id!;
    });

    act(() => useUiStore.getState().selectC4(ghostId));
    const details = await screen.findByTestId('c4-details');
    const sources = within(details).getByRole('region', { name: 'Model elements' });
    expect(within(sources).getByText(gone.name)).toBeInTheDocument();
    expect(within(details).queryByTestId('c4-source-link')).not.toBeInTheDocument();

    // A box whose model elements are all in the model still links them.
    const live = [...document.querySelectorAll<HTMLElement>('[data-testid="c4-card"]')].find((c) => !c.dataset.status && c.dataset.c4Id !== C4_SYSTEM_ID)!;
    act(() => useUiStore.getState().selectC4(live.dataset.c4Id!));
    await waitFor(() => expect(within(screen.getByTestId('c4-details')).getAllByTestId('c4-source-link').length).toBeGreaterThan(0));
  });
});
