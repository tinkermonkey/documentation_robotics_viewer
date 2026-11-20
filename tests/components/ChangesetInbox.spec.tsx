// @vitest-environment happy-dom
/**
 * ChangesetInbox.spec.tsx — the Changesets view with no changeset open:
 * staged changesets waiting on you / on DrBot (by their review counts, or by
 * verdicts kept in this browser for an older dr CLI), and the history.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
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
  useLocalReviewStore.setState({ byChangeset: {}, unsupported: {}, blockersSeen: {} });
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
    expect(within(article).getByRole('button', { name: 'Continue review of pr-497' })).toBeInTheDocument();

    const onBot = screen.getByTestId('inbox-on-bot');
    expect(within(onBot).getByText('wire-orphans')).toBeInTheDocument();
    expect(within(onBot).getByRole('button', { name: 'Open wire-orphans' })).toBeInTheDocument();

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

  it('shows a one-paragraph inline excerpt of a markdown description on the card', async () => {
    serveList({
      'cs-a': {
        name: 'changeset-description-markdown', status: 'staged', created: '2026-11-20T10:00:00Z', changes_count: 10,
        purpose: 'plan', actions: ['commit', 'discard'],
        description: [
          "#588: render a changeset's description as **markdown** in `ChangesetCanvas`, see [#588](https://example.com/588).",
          '',
          '**In scope**',
          '- `application.applicationcomponent.markdown-text`',
          '',
          '## Done when',
          '- the inbox shows an excerpt',
        ].join('\n'),
      },
    });
    renderInbox();

    const excerpt = await screen.findByTestId('inbox-card-description');
    expect(excerpt).toHaveTextContent(
      "#588: render a changeset's description as markdown in ChangesetCanvas, see #588.",
    );
    expect(within(excerpt).getByText('markdown').tagName).toBe('STRONG');
    expect(within(excerpt).getByText('ChangesetCanvas').tagName).toBe('CODE');
    // Only the first paragraph: no list, heading or later text, and no nested link in the card.
    expect(excerpt).not.toHaveTextContent('In scope');
    expect(excerpt).not.toHaveTextContent('Done when');
    expect(excerpt.querySelector('a, ul, li, h1, h2, h3')).toBeNull();
  });

  it('keeps a verification record out of Waiting on you and pairs it with its plan', async () => {
    serveList({
      'cs-plan': {
        name: 'add-export', status: 'staged', created: '2026-11-18T10:00:00Z', changes_count: 12,
        purpose: 'plan', actions: ['commit', 'discard'], review: { decided: 0, total: 12, asked: 0 },
        drift: { state: 'none', blocksCommit: false, message: 'The base model has not changed since this changeset was created.' },
      },
      'cs-rec': {
        name: 'add-export-as-built', status: 'staged', created: '2026-11-18T11:00:00Z', changes_count: 9,
        purpose: 'verification', verifies: 'cs-plan', actions: ['discard'], review: { decided: 0, total: 9, asked: 0 },
        drift: { state: 'not-applicable', blocksCommit: false, message: 'A verification record is never landed, so base drift does not apply to it.' },
      },
      'cs-boot': {
        name: 'extract-abc', status: 'staged', created: '2026-11-17T11:00:00Z', changes_count: 40,
        purpose: 'bootstrap', actions: ['commit', 'discard'], review: { decided: 0, total: 40, asked: 0 },
        drift: { state: 'none', blocksCommit: false, message: 'The base model has not changed since this changeset was created.' },
      },
    });
    const user = userEvent.setup();
    renderInbox();

    const onYou = await screen.findByTestId('inbox-on-you');
    await within(onYou).findByText('add-export');
    expect(within(onYou).queryByText('add-export-as-built')).not.toBeInTheDocument();
    expect(within(onYou).queryByText('extract-abc')).not.toBeInTheDocument();
    expect(within(onYou).getByText('add-export').closest('article')).toHaveTextContent(/plan · /);
    // The plan names its record.
    expect(within(onYou).getByTestId('inbox-plan-record')).toHaveTextContent('verified by add-export-as-built');

    expect(within(screen.getByTestId('inbox-to-land')).getByText('extract-abc')).toBeInTheDocument();

    const records = screen.getByTestId('inbox-records');
    const record = within(records).getByTestId('inbox-record');
    expect(record).toHaveTextContent('add-export-as-built');
    expect(within(record).getByTestId('inbox-record-plan')).toHaveTextContent('Verifies add-export');
    expect(within(record).queryByRole('button', { name: /review/i })).not.toBeInTheDocument();
    await user.click(within(record).getByRole('button', { name: 'add-export' }));
    expect(useUiStore.getState().changesetId).toBe('cs-plan');
  });

  it('lists an upgrade record under its own heading, never under Waiting on you', async () => {
    serveList({
      'cs-upg': {
        name: 'upgrade-0.13.0-drops', status: 'staged', created: '2026-11-19T10:00:00Z', changes_count: 3,
        purpose: 'upgrade-record', actions: ['discard'], origin: { kind: 'upgrade' },
        review: { decided: 0, total: 3, asked: 0 },
        drift: { state: 'not-applicable', blocksCommit: false, message: 'An upgrade record is never landed, so base drift does not apply to it.' },
      },
    });
    const user = userEvent.setup();
    renderInbox();

    const upgrades = await screen.findByTestId('inbox-upgrades');
    const card = within(upgrades).getByTestId('inbox-upgrade');
    expect(card).toHaveTextContent('upgrade-0.13.0-drops');
    expect(card).toHaveTextContent('3 relationships dropped');
    expect(within(screen.getByTestId('inbox-on-you')).queryByText('upgrade-0.13.0-drops')).not.toBeInTheDocument();
    await user.click(within(card).getByTestId('inbox-upgrade-open'));
    expect(useUiStore.getState().changesetId).toBe('cs-upg');
  });

  it("shows each changeset's purpose in the history", async () => {
    serveList({
      'cs-c': {
        name: 'landed-plan', status: 'committed', created: '2026-11-12T09:00:00Z', changes_count: 4,
        purpose: 'plan', actions: [],
        drift: { state: 'not-applicable', blocksCommit: false, message: 'The changeset is committed, so base drift no longer applies to it.' },
      },
      'cs-d': { name: 'older', status: 'committed', created: '2026-11-10T09:00:00Z', changes_count: 2 },
    });
    renderInbox();
    await screen.findByTestId('inbox-history');
    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getAllByTestId('inbox-history-purpose').map((c) => c.textContent)).toEqual(['plan', '—']);
  });

  it('counts verdicts kept in this browser for an older dr CLI, by the shared definition', async () => {
    // The detail (MSW's default: the fixture, 38 changes of which 8 cancel out) gives total 30;
    // dropping RelationshipType (7) also leaves out its link (32), which counts as decided.
    serveList({ 'cs-a': { name: 'legacy', status: 'staged', created: '2026-11-13T10:00:00Z', changes_count: 38 } });
    useLocalReviewStore.setState({
      byChangeset: { 'cs-a': { '0': { verdict: 'keep' }, '7': { verdict: 'drop' } } },
    });
    renderInbox();
    const card = (await screen.findByText('legacy')).closest('article')!;
    await waitFor(() => expect(card).toHaveTextContent('27 need a decision'));
    expect(within(card).getByRole('progressbar', { name: 'legacy: 3 of 30 decided' })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Continue review of legacy' })).toBeInTheDocument();
  });

  it('badges a drifted plan on its card, and not a record or content-free drift', async () => {
    const drifted = 'The base model changed since this changeset was created, so a commit is refused for drift.';
    serveList({
      'cs-drifted': {
        name: 'add-export', status: 'staged', created: '2026-11-18T10:00:00Z', changes_count: 6, purpose: 'plan',
        actions: ['commit', 'discard'], drift: { state: 'drifted', blocksCommit: true, message: drifted },
      },
      'cs-quiet': {
        name: 'wire-orphans', status: 'staged', created: '2026-11-18T09:00:00Z', changes_count: 3, purpose: 'plan',
        actions: ['commit', 'discard'],
        drift: { state: 'content-free', blocksCommit: false, message: 'Another changeset landed; nothing this one touches changed.' },
      },
      'cs-record': {
        name: 'add-export-as-built', status: 'staged', created: '2026-11-18T11:00:00Z', changes_count: 6,
        purpose: 'verification', verifies: 'cs-drifted', actions: ['discard'],
        drift: { state: 'not-applicable', blocksCommit: false, message: 'A verification record is never landed.' },
      },
      // A malformed drift is dropped, not rendered.
      'cs-odd': {
        name: 'odd', status: 'staged', created: '2026-11-18T08:00:00Z', changes_count: 1,
        drift: { state: 'drifted', blocksCommit: 'yes' },
      },
    });
    renderInbox();

    const onYou = await screen.findByTestId('inbox-on-you');
    const card = (await within(onYou).findByText('add-export')).closest('article')!;
    expect(within(card).getByTestId('drift-badge')).toHaveTextContent('Base changed since this was staged');
    expect(within(card).getByTestId('inbox-drift-message')).toHaveTextContent(drifted);

    const quiet = within(onYou).getByText('wire-orphans').closest('article')!;
    expect(within(quiet).queryByTestId('drift-badge')).not.toBeInTheDocument();
    const odd = within(onYou).getByText('odd').closest('article')!;
    expect(within(odd).queryByTestId('drift-badge')).not.toBeInTheDocument();
    const record = screen.getByText('add-export-as-built').closest('article')!;
    expect(within(record).queryByTestId('drift-badge')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('drift-badge')).toHaveLength(1);
  });
});
