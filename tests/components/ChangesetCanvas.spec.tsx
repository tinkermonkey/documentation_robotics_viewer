// @vitest-environment happy-dom
/**
 * ChangesetCanvas.spec.tsx — the changeset diff list + the inspector summary.
 *
 * Renders the REAL ChangesetCanvas + ChangesetInspector with the REAL data
 * hooks against the MSW-served changeset-detail fixture. We assert op-coded
 * rows (add/update/delete labels + classes), the StatTiles (additions /
 * modifications / deletions), the status pill, and that a row expands into a
 * side-by-side diff.
 */

import { describe, it, expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChangesetCanvas } from '@/apps/embedded/ui/ChangesetCanvas';
import { ChangesetInspector } from '@/apps/embedded/ui/ChangesetInspector';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';

const CHANGESET_ID = 'changeset-1774309821523-1gs13ct6s';

/** Seed the selected changeset, then render. */
function renderCanvas() {
  const r = renderWithProviders(<ChangesetCanvas />);
  useUiStore.getState().selectChangeset(CHANGESET_ID);
  return r;
}

function renderInspector() {
  const r = renderWithProviders(<ChangesetInspector />);
  useUiStore.getState().selectChangeset(CHANGESET_ID);
  return r;
}

describe('ChangesetCanvas — header + op rows', () => {
  it('shows the changeset name, status chip and change count in the header', async () => {
    renderCanvas();

    await waitFor(() =>
      expect(screen.getByTestId('page-header-title')).toHaveTextContent(
        'pr-497-data-pipeline-updates',
      ),
    );
    expect(screen.getByTestId('page-header-id-chip')).toHaveTextContent('committed');
    expect(screen.getByTestId('page-header-actions')).toHaveTextContent('38 changes');
  });

  it('renders op-coded rows with ADD / MOD / DEL labels and op classes', async () => {
    renderCanvas();

    // Wait for the detail to load and rows to render.
    await screen.findByTestId('changeset-list');
    const rows = await screen.findAllByTestId('changeset-row');
    expect(rows).toHaveLength(38);

    // Op buckets fold relationship-add → add and relationship-delete → delete.
    // The fixture has 12 add + 15 relationship-add = 27 add, 7 update, and
    // 4 relationship-delete = 4 delete (no plain deletes) — reconciling with
    // the stats {additions: 27, modifications: 7, deletions: 4}.
    const byOp = (op: string) => rows.filter((r) => r.getAttribute('data-op') === op);
    expect(byOp('add')).toHaveLength(27);
    expect(byOp('update')).toHaveLength(7);
    expect(byOp('delete')).toHaveLength(4);

    // Each op carries its short badge label.
    const addBadge = within(byOp('add')[0]).getByTestId('changeset-op-badge');
    expect(addBadge).toHaveTextContent('ADD');
    const updateBadge = within(byOp('update')[0]).getByTestId('changeset-op-badge');
    expect(updateBadge).toHaveTextContent('MOD');
    const deleteBadge = within(byOp('delete')[0]).getByTestId('changeset-op-badge');
    expect(deleteBadge).toHaveTextContent('DEL');
  });

  it('expands a row with before/after into a side-by-side diff', async () => {
    const user = userEvent.setup();
    renderCanvas();

    await screen.findByTestId('changeset-list');
    const rows = await screen.findAllByTestId('changeset-row');

    // An update row has both before + after, so it expands into a diff.
    const updateRow = rows.find((r) => r.getAttribute('data-op') === 'update')!;
    // The row is itself the expandable button (role="button").
    const toggle = within(updateRow).getByRole('button');
    expect(toggle).toBeInTheDocument();
    await user.click(toggle);

    // The expanded panel renders the Heimdall SideBySideDiff (role="table").
    // (Its row list is virtualized — happy-dom reports 0 viewport height — so we
    // assert the diff container mounts rather than counting rendered lines.)
    await waitFor(() => {
      const diff = updateRow.querySelector('.side-by-side-diff');
      expect(diff).not.toBeNull();
    });
  });
});

describe('ChangesetInspector — stat tiles + status pill', () => {
  it('shows additions / modifications / deletions StatTiles from the fixture', async () => {
    renderInspector();

    // StatTile exposes its value via aria-label "{label}: {value}".
    await waitFor(() =>
      expect(screen.getByLabelText('Added: 27')).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Modified: 7')).toBeInTheDocument();
    expect(screen.getByLabelText('Deleted: 4')).toBeInTheDocument();
  });

  it('shows the committed status label', async () => {
    renderInspector();

    await waitFor(() => expect(screen.getByText('COMMITTED')).toBeInTheDocument());
    // Name + change count in the inspector head.
    expect(screen.getByText('pr-497-data-pipeline-updates')).toBeInTheDocument();
  });

  it('shows the empty state when no changeset is selected', async () => {
    renderWithProviders(<ChangesetInspector />);
    // No selection seeded.
    expect(
      await screen.findByTestId('changeset-inspector-empty'),
    ).toHaveTextContent('Select a changeset to inspect.');
  });
});

describe('ChangesetCanvas — Impact tab', () => {
  it('switches from the change list to the impact lanes and back', async () => {
    const user = userEvent.setup();
    renderCanvas();
    await screen.findByTestId('changeset-list');

    await user.click(within(screen.getByTestId('changeset-tab-control')).getByRole('radio', { name: 'Impact' }));
    const impact = await screen.findByTestId('changeset-impact');
    expect(screen.queryByTestId('changeset-list')).not.toBeInTheDocument();

    // The legend counts the changed elements by op (12 added, 7 modified in the fixture).
    const legend = within(impact).getByRole('list', { name: 'Changed elements' });
    expect(within(legend).getByText(/12 added/)).toBeInTheDocument();
    expect(within(legend).getByText(/7 modified/)).toBeInTheDocument();
    expect(screen.queryByTestId('impact-unresolved')).not.toBeInTheDocument();

    // Each changed element gets a scoped outline rule keyed on its lane node.
    const styles = impact.querySelector('style')!.textContent!;
    expect(styles).toMatch(/\.drv-impact \[data-node-id="[^"]+"\] \.graph-lane-node\{outline:2px solid/);
    expect(styles).toMatch(/outline:2px dashed/);

    await user.click(within(screen.getByTestId('changeset-tab-control')).getByRole('radio', { name: 'Changes' }));
    expect(await screen.findByTestId('changeset-list')).toBeInTheDocument();
  });

  it('shares its follow depth with the Model inspector', async () => {
    const user = userEvent.setup();
    useUiStore.getState().setInspectorFollow(1);
    renderCanvas();
    await screen.findByTestId('changeset-list');
    await user.click(within(screen.getByTestId('changeset-tab-control')).getByRole('radio', { name: 'Impact' }));
    await screen.findByTestId('changeset-impact');

    await user.click(within(screen.getByTestId('impact-follow-control')).getByRole('radio', { name: /Direct/ }));
    expect(useUiStore.getState().inspectorFollow).toBe(0);
  });
});

describe('ChangesetInspector — blast radius', () => {
  it('summarizes what the changeset reaches outside itself, per layer', async () => {
    renderInspector();
    const section = await screen.findByTestId('changeset-blast-radius');
    expect(within(section).getByTestId('blast-radius-summary')).toHaveTextContent(
      /\d+ elements? in \d+ layers? outside the changeset/,
    );
    const rows = within(section).getAllByTestId('blast-radius-layer');
    expect(rows.length).toBeGreaterThan(0);
    expect(within(section).getByRole('img')).toHaveAttribute('aria-label', expect.stringMatching(/^Reached by layer: /));
  });
});
