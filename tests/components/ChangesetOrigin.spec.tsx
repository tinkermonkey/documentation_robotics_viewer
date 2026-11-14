// @vitest-environment happy-dom
/**
 * ChangesetOrigin.spec.tsx — who decided each staged change (codebase_extract's
 * `origin`): the badge on each row with its details on hover, the Decided by
 * filter, and the change inspector's Decided by section. Renders the REAL
 * ChangesetCanvas + ChangesetInspector against MSW: the captured detail,
 * served staged, with origins on some changes. Without any origin (an older
 * dr CLI, or a changeset staged by hand) nothing of this shows.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ChangesetCanvas } from '@/apps/embedded/ui/ChangesetCanvas';
import { ChangesetInspector } from '@/apps/embedded/ui/ChangesetInspector';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { useLocalReviewStore } from '@/apps/embedded/stores/localReviewStore';
import type { ChangesetReview, DecisionInput } from '@/apps/embedded/data/changesetReview';
import type { ChangeRecord } from '@/apps/embedded/data/changesets';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';
import changesetDetail from '../fixtures/changeset-detail.json';

const ID = 'changeset-1774309821523-1gs13ct6s';

const ORIGINS: Record<number, object> = {
  1: {
    by: 'tier1',
    rule: 'tier1:dr-qset-2',
    provider: 'openrouter',
    model: 'clef-1',
    upstream: 'workers-ai',
    p: { layer: 0.923, type: 0.81 },
    confirmed: 'agent',
  },
  2: { by: 'tier1', rule: 'tier1:dr-qset-2', provider: 'cloudflare-workers-ai', model: 'clef', p: { layer: 0.97, type: 0.88 }, confirmed: 'auto' },
  3: { by: 'tier1', rule: 'tier1:dr-qset-2', provider: 'cloudflare-workers-ai', model: 'clef', p: { layer: 0.71, type: null }, confirmed: 'auto' },
  6: { by: 'tier0', rule: 'node-mapping:Route' },
  13: { by: 'tier0', rule: 'node-mapping:Service' },
  19: { by: 'tier0', rule: 'edge:CALLS' },
  20: { by: 'agent' },
};

function withOrigins(origins: Record<number, unknown>): ChangeRecord[] {
  return (changesetDetail.changes as ChangeRecord[]).map((c) =>
    origins[c.sequenceNumber!] ? { ...c, origin: origins[c.sequenceNumber!] } : c,
  );
}

function serve(changes: ChangeRecord[], review: ChangesetReview = { decisions: {} }) {
  const puts: DecisionInput[][] = [];
  mswServer.use(
    http.get('*/api/changesets/:id', ({ params }) =>
      HttpResponse.json({
        ...changesetDetail,
        id: params.id,
        status: 'staged',
        changes,
        revision: 38,
        unstaged: [],
        review,
      }),
    ),
    http.put('*/api/changesets/:id/review', async ({ request }) => {
      const body = (await request.json()) as { decisions: DecisionInput[] };
      puts.push(body.decisions);
      return HttpResponse.json({ decisions: {} });
    }),
  );
  return { puts };
}

function renderReview(changeSeq: number | null = null) {
  const r = renderWithProviders(
    <>
      <ChangesetCanvas />
      <ChangesetInspector />
    </>,
  );
  act(() => {
    useUiStore.getState().selectChangeset(ID);
    if (changeSeq !== null) useUiStore.getState().selectChange(changeSeq);
  });
  return r;
}

const row = (seq: number) =>
  screen.getAllByTestId('review-row').find((r) => r.getAttribute('data-seq') === String(seq));
const shownSeqs = () => screen.getAllByTestId('review-row').map((r) => Number(r.getAttribute('data-seq')));

beforeEach(() => {
  useLocalReviewStore.setState({ byChangeset: {}, unsupported: {}, blockersSeen: {} });
  localStorage.clear();
});

describe('origin badges', () => {
  it('marks who decided each change, and nothing on a change without an origin', async () => {
    serve(withOrigins(ORIGINS));
    renderReview();
    await screen.findAllByTestId('review-row');

    const badge = (seq: number) => within(row(seq)!).queryByTestId('origin-badge');
    expect(badge(1)).toHaveAttribute('data-origin', 'tier1');
    expect(badge(1)).toHaveTextContent('Tier 1');
    expect(badge(6)).toHaveTextContent('Tier 0');
    expect(badge(20)).toHaveTextContent('Agent');
    expect(badge(4)).toBeNull();
    // Screen readers hear who decided it, not the bare label.
    expect(row(1)).toHaveAccessibleName(expect.stringContaining('Decided by the Tier 1 decision model'));
  });

  it('shows the model, probabilities, rule, upstream and confirmation on hover', async () => {
    serve(withOrigins(ORIGINS));
    const user = userEvent.setup();
    renderReview();
    await screen.findAllByTestId('review-row');

    await user.hover(within(row(1)!).getByTestId('origin-badge'));
    const card = await screen.findByTestId('origin-badge-tooltip-card');
    expect(card).toHaveAttribute('role', 'tooltip');
    expect(card).toHaveTextContent('Decided by the Tier 1 decision model');
    const details = within(card).getByTestId('origin-details');
    expect(details).toHaveTextContent('Ruletier1:dr-qset-2');
    expect(details).toHaveTextContent('Modelclef-1');
    expect(details).toHaveTextContent('Upstreamworkers-ai');
    expect(details).toHaveTextContent('Layer92%');
    expect(details).toHaveTextContent('Type81%');
    expect(details).toHaveTextContent('Confirmedby the agent (acceptTier1)');
  });

  it('shows a Tier 0 rule on hover', async () => {
    serve(withOrigins(ORIGINS));
    const user = userEvent.setup();
    renderReview();
    await screen.findAllByTestId('review-row');
    await user.hover(within(row(19)!).getByTestId('origin-badge'));
    const card = await screen.findByTestId('origin-badge-tooltip-card');
    expect(card).toHaveTextContent('Decided by a Tier 0 rule');
    expect(card).toHaveTextContent('Ruleedge:CALLS');
  });

  it('gives the same details in the change inspector', async () => {
    serve(withOrigins(ORIGINS));
    renderReview(3);
    const section = await screen.findByTestId('change-origin');
    expect(section).toHaveTextContent('Decided by the Tier 1 decision model');
    expect(section).toHaveTextContent('Layer71%');
    expect(section).toHaveTextContent('Typenot asked');
    expect(section).toHaveTextContent('Confirmedautomatically (stage mode)');
  });

  it('leaves the inspector section out for a change without an origin', async () => {
    serve(withOrigins(ORIGINS));
    renderReview(4);
    await screen.findByTestId('change-inspector');
    expect(screen.queryByTestId('change-origin')).not.toBeInTheDocument();
  });
});

describe('origin filter', () => {
  it('offers each decider with its count, and No origin', async () => {
    serve(withOrigins(ORIGINS));
    renderReview();
    const filter = await screen.findByTestId('review-origin-filter');
    expect(within(filter).getAllByRole('radio').map((r) => r.textContent)).toEqual([
      'All · 30',
      'Tier 0 · 3',
      'Tier 1 · 3',
      'Agent · 1',
      'No origin · 23',
    ]);
  });

  it('narrows the list to one decider, and back', async () => {
    serve(withOrigins(ORIGINS));
    const user = userEvent.setup();
    renderReview();
    const filter = await screen.findByTestId('review-origin-filter');

    await user.click(within(filter).getByRole('radio', { name: /^Tier 1/ }));
    expect(shownSeqs().sort((a, b) => a - b)).toEqual([1, 2, 3]);

    await user.click(within(filter).getByRole('radio', { name: /^Agent/ }));
    expect(shownSeqs()).toEqual([20]);

    await user.click(within(filter).getByRole('radio', { name: /^No origin/ }));
    expect(shownSeqs()).not.toContain(1);
    expect(shownSeqs()).toContain(4);

    await user.click(within(filter).getByRole('radio', { name: /^All/ }));
    expect(shownSeqs()).toHaveLength(30);
  });

  it('keeps in bulk only the routine changes the filter shows', async () => {
    const { puts } = serve(withOrigins(ORIGINS));
    const user = userEvent.setup();
    renderReview();
    const filter = await screen.findByTestId('review-origin-filter');
    await user.click(within(filter).getByRole('radio', { name: /^Tier 0/ }));
    const bulk = screen.getByTestId('review-bulk-keep');
    expect(bulk).toHaveTextContent('Keep 1 routine');
    fireEvent.click(bulk);
    await waitFor(() => expect(puts).toEqual([[{ sequence: 13, verdict: 'keep' }]]));
  });

  it('is not offered, and no badge shows, when no change carries an origin', async () => {
    serve(changesetDetail.changes as ChangeRecord[]);
    renderReview();
    await screen.findAllByTestId('review-row');
    expect(screen.queryByTestId('review-origin-filter')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('origin-badge')).toHaveLength(0);
  });
});

describe('origin robustness', () => {
  it('renders a hand-edited origin with fields of the wrong type, keeping only what is well-typed', async () => {
    serve(
      withOrigins({
        1: { by: 'tier1', rule: { x: 1 }, model: ['m'], provider: 'p', p: { layer: 'high', type: {} }, confirmed: 7 },
        2: { by: { nested: true } },
        3: 'tier1',
      }),
    );
    const user = userEvent.setup();
    renderReview(1);
    await screen.findAllByTestId('review-row');
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    expect(within(row(1)!).getByTestId('origin-badge')).toHaveTextContent('Tier 1');
    expect(within(row(2)!).queryByTestId('origin-badge')).toBeNull();
    expect(within(row(3)!).queryByTestId('origin-badge')).toBeNull();
    const section = screen.getByTestId('change-origin');
    expect(section).toHaveTextContent('Providerp');
    expect(section).not.toHaveTextContent(/Rule|Model|Layer|Confirmed/);

    await user.hover(within(row(1)!).getByTestId('origin-badge'));
    expect(await screen.findByTestId('origin-badge-tooltip-card')).toHaveTextContent('Providerp');
  });

  it('cuts a long unknown decider name short in the badge', async () => {
    serve(withOrigins({ 4: { by: 'a-very-long-decider-name-from-the-future' } }));
    renderReview();
    await screen.findAllByTestId('review-row');
    const badge = within(row(4)!).getByTestId('origin-badge');
    expect(badge).toHaveClass('drv-origin--other');
    expect(badge.querySelector('.drv-origin__label')).toHaveTextContent('a-very-long-decider-name-from-the-future');
  });

  it('a click in the tooltip card does not select or deselect the row', async () => {
    serve(withOrigins(ORIGINS));
    const user = userEvent.setup();
    renderReview();
    await screen.findAllByTestId('review-row');
    await user.hover(within(row(1)!).getByTestId('origin-badge'));
    const card = await screen.findByTestId('origin-badge-tooltip-card');

    // One click at a time: two would toggle the row on and off again.
    fireEvent.mouseDown(within(card).getByTestId('origin-details'));
    fireEvent.click(within(card).getByTestId('origin-details'));
    expect(useUiStore.getState().changeSeq).toBeNull();
    fireEvent.click(card);
    expect(useUiStore.getState().changeSeq).toBeNull();
    expect(row(1)).toHaveAttribute('aria-pressed', 'false');

    // The badge itself is part of the row: clicking it still opens the change.
    fireEvent.click(within(row(1)!).getByTestId('origin-badge'));
    expect(useUiStore.getState().changeSeq).toBe(1);
  });
});

describe('origin filter and the since-your-review section', () => {
  const reviewed: ChangesetReview = {
    decisions: {
      '0': { verdict: 'keep', atRevision: 19, decidedAt: 'x' },
      '13': { verdict: 'keep', atRevision: 19, decidedAt: 'x' },
    },
    lastReviewedRevision: 19,
  };

  it('counts only the changes the filter shows, and says when none match', async () => {
    serve(withOrigins(ORIGINS), reviewed);
    const user = userEvent.setup();
    renderReview();
    const since = await screen.findByTestId('review-since');
    expect(since).toHaveTextContent('0 revised · 0 withdrawn · 11 new · 2 carried over');

    const filter = screen.getByTestId('review-origin-filter');
    await user.click(within(filter).getByRole('radio', { name: /^Tier 0/ }));
    expect(screen.getByTestId('review-since')).toHaveTextContent('0 revised · 0 withdrawn · 1 new · 1 carried over');
    expect(screen.getAllByTestId('review-new')).toHaveLength(1);

    await user.click(within(filter).getByRole('radio', { name: /^Tier 1/ }));
    expect(screen.getByTestId('review-since')).toHaveTextContent('0 revised · 0 withdrawn · 0 new · 0 carried over');
    expect(screen.getByTestId('review-since-empty')).toBeInTheDocument();
    expect(screen.queryAllByTestId('review-new')).toHaveLength(0);
  });
});
