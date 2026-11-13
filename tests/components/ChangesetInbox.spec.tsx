// @vitest-environment happy-dom
/**
 * ChangesetInbox.spec.tsx — the Changesets view with no changeset open:
 * staged changesets waiting on you / on DrBot (by their review counts, or by
 * verdicts kept in this browser for an older dr CLI), and the history.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ChangesetCanvas } from '@/apps/embedded/ui/ChangesetCanvas';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { useLocalReviewStore } from '@/apps/embedded/stores/localReviewStore';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';

function serveList(changesets: Record<string, object>) {
  mswServer.use(http.get('*/api/changesets', () => HttpResponse.json({ version: '1.0.0', changesets })));
}

beforeEach(() => {
  useLocalReviewStore.setState({ byChangeset: {}, unsupported: {} });
});

function renderInbox() {
  const r = renderWithProviders(<ChangesetCanvas />);
  act(() => useUiStore.getState().setView('changesets'));
  return r;
}

describe('ChangesetInbox', () => {
  it('sorts staged changesets into waiting on you and on DrBot, with the history below', async () => {
    serveList({
      'cs-a': {
        name: 'pr-497', status: 'staged', created: '2026-11-13T10:00:00Z', changes_count: 30,
        description: 'Brings the model in line with PR 497', origin: { kind: 'chat' }, revision: 38,
        review: { decided: 10, total: 30, asked: 1 },
      },
      'cs-b': {
        name: 'wire-orphans', status: 'staged', created: '2026-11-13T09:00:00Z', changes_count: 4,
        revision: 9, review: { decided: 4, total: 4, asked: 2 },
      },
      'cs-c': { name: 'old-sync', status: 'committed', created: '2026-11-12T09:00:00Z', changes_count: 4, review: { decided: 4, total: 4, asked: 0 } },
      'cs-d': { name: 'tried', status: 'discarded', created: '2026-11-10T09:00:00Z', changes_count: 0 },
    });
    renderInbox();

    const onYou = await screen.findByTestId('inbox-on-you');
    const card = await within(onYou).findByText('pr-497');
    const article = card.closest('article')!;
    expect(article).toHaveTextContent('Brings the model in line with PR 497');
    expect(article).toHaveTextContent('staged by DrBot · from chat');
    expect(article).toHaveTextContent('20 need a decision');
    expect(within(article).getByRole('progressbar', { name: 'pr-497: 10 of 30 decided' })).toBeInTheDocument();
    expect(within(article).getByRole('button', { name: 'Continue review' })).toBeInTheDocument();

    expect(within(screen.getByTestId('inbox-on-bot')).getByText('wire-orphans')).toBeInTheDocument();

    const history = screen.getAllByTestId('inbox-history-row');
    expect(history.map((r) => r.textContent)).toEqual([
      expect.stringContaining('old-sync'),
      expect.stringContaining('tried'),
    ]);
    expect(history[0]).toHaveTextContent('applied');
  });

  it('opens a changeset from its card', async () => {
    serveList({ 'cs-a': { name: 'pr-497', status: 'staged', created: '2026-11-13T10:00:00Z', changes_count: 3 } });
    const user = userEvent.setup();
    renderInbox();
    await user.click(await screen.findByTestId('inbox-open'));
    expect(useUiStore.getState().changesetId).toBe('cs-a');
  });

  it('counts verdicts kept in this browser for an older dr CLI', async () => {
    serveList({ 'cs-a': { name: 'legacy', status: 'staged', created: '2026-11-13T10:00:00Z', changes_count: 3 } });
    useLocalReviewStore.setState({ byChangeset: { 'cs-a': { '0': { verdict: 'keep' }, '1': { verdict: 'keep' } } } });
    renderInbox();
    const card = (await screen.findByText('legacy')).closest('article')!;
    expect(card).toHaveTextContent('1 need a decision');
    expect(within(card).getByRole('button', { name: 'Continue review' })).toBeInTheDocument();
  });
});
