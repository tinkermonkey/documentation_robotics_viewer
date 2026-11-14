// @vitest-environment happy-dom
/**
 * ChangesetCanvas.spec.tsx — a committed changeset's page + the inspector summary.
 *
 * Renders the REAL ChangesetCanvas + ChangesetInspector with the REAL data
 * hooks against the MSW-served changeset-detail fixture (committed). We assert
 * the read-only review list (weight groups, cancel-out pairs, the changed
 * field), the applied result, the StatTiles, the status pill and the Impact
 * tab. The staged review flows are in ChangesetReview.spec.tsx.
 */

import { describe, it, expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChangesetCanvas } from '@/apps/embedded/ui/ChangesetCanvas';
import { ChangesetInspector } from '@/apps/embedded/ui/ChangesetInspector';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';
import { http, HttpResponse } from 'msw';

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

  it('lists the committed changeset read-only: 30 changes to review, 4 pairs that cancel out', async () => {
    renderCanvas();

    await screen.findByTestId('changeset-list');
    const rows = await screen.findAllByTestId('review-row');
    // 38 changes, of which 4 link adds are removed again later (8 changes cancel out).
    expect(rows).toHaveLength(30);
    expect(screen.getByTestId('review-cancel-out')).toHaveTextContent('4 pairs');
    // Grouped by review weight: routine updates, new elements, new links.
    const groups = screen.getAllByTestId('review-group').map((g) => g.getAttribute('data-group'));
    expect(groups).toEqual(['routine', 'add', 'link']);
    // A committed changeset shows what landed, and offers no decisions.
    expect(screen.getByTestId('applied-result')).toHaveTextContent('30 changes in the model');
    expect(screen.queryByTestId('review-summary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('review-filter')).not.toBeInTheDocument();
  });

  it('marks the changed field of an update and its op', async () => {
    renderCanvas();
    const row = (await screen.findAllByTestId('review-row')).find((r) => r.getAttribute('data-seq') === '0')!;
    expect(within(row).getByTestId('review-op-chip')).toHaveTextContent('update');
    expect(row.querySelector('.drv-field')).toHaveTextContent('attributes.droppedAttributesCount');
    expect(row).toHaveTextContent('type only');
  });
});

describe('ChangesetInspector — stat tiles + status pill', () => {
  it('shows additions / modifications / deletions StatTiles from the fixture', async () => {
    renderInspector();

    // StatTile exposes its value via aria-label "{label}: {value}". The
    // fixture's stats are 27 / 7 / 4, but its 4 link deletes each remove a link
    // the same changeset added (cancel-out pairs), so the tiles net them out.
    await waitFor(() =>
      expect(screen.getByLabelText('Added: 23')).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Modified: 7')).toBeInTheDocument();
    expect(screen.getByLabelText('Deleted: 0')).toBeInTheDocument();
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

    // The op is in each changed element's accessible name, not only its outline.
    expect(within(impact).getAllByRole('button', { name: /· added/ }).length).toBeGreaterThan(0);
    expect(within(impact).getAllByRole('button', { name: /· modified/ }).length).toBeGreaterThan(0);

    // A committed changeset's first tab is "Changes" (a staged one's is "Review").
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

  it('keeps its scrolling body reachable by keyboard', async () => {
    renderInspector();
    await screen.findByTestId('changeset-blast-radius');
    expect(screen.getByRole('region', { name: 'Changeset details' })).toHaveAttribute('tabindex', '0');
  });
});

describe('ChangesetCanvas — a changeset that fails to load', () => {
  it('says why instead of "loading changeset…" forever (canvas and inspector)', async () => {
    // A tab holding an older server's token: the server refuses it.
    mswServer.use(
      http.get('*/api/changesets/:id', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    );
    renderWithProviders(
      <>
        <ChangesetCanvas />
        <ChangesetInspector />
      </>,
    );
    useUiStore.getState().selectChangeset(CHANGESET_ID);

    const alert = await screen.findByRole('alert', {}, { timeout: 4000 });
    expect(alert).toHaveTextContent(/access token/);
    expect(screen.getByTestId('changeset-inspector-empty')).toHaveTextContent(/access token/);
    expect(screen.queryByText('loading changeset…')).not.toBeInTheDocument();
  });
});
