// @vitest-environment happy-dom
/**
 * ChangesetActions.spec.tsx — Apply / Discard in the changeset inspector.
 *
 * Renders the REAL ChangesetInspector + data hooks against MSW. The detail
 * fixture is a committed changeset, so each test serves it as STAGED and lets
 * the commit/discard handlers flip that status, which the inspector picks up
 * through the hook's cache invalidation + refetch.
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ChangesetInspector } from '@/apps/embedded/ui/ChangesetInspector';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import {
  changesetActionErrorMessage,
  useRefreshAfterChatReply,
} from '@/apps/embedded/data/useChangesets';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { createTestQueryClient, renderHookWithClient } from '../helpers/renderHookWithClient';
import { mswServer } from '../helpers/mswServer';
import changesetDetail from '../fixtures/changeset-detail.json';

const CHANGESET_ID = 'changeset-1774309821523-1gs13ct6s';
const NAME = changesetDetail.name;

/** Serve the fixture as a staged changeset; returns the POSTs it received. */
function serveStaged(opts: { commitError?: { status: number; error: string } } = {}) {
  let status = 'staged';
  const posts: string[] = [];
  mswServer.use(
    http.get('*/api/changesets/:id', ({ params }) =>
      HttpResponse.json({ ...changesetDetail, id: params.id, status }),
    ),
    http.post('*/api/changesets/:id/commit', ({ params }) => {
      posts.push('commit');
      if (opts.commitError) {
        return HttpResponse.json({ error: opts.commitError.error }, { status: opts.commitError.status });
      }
      status = 'committed';
      return HttpResponse.json({ id: params.id, name: NAME, status, committed: 38, skipped: 0, failed: 0 });
    }),
    http.post('*/api/changesets/:id/discard', ({ params }) => {
      posts.push('discard');
      status = 'discarded';
      return HttpResponse.json({ id: params.id, name: NAME, status });
    }),
  );
  return posts;
}

function renderInspector() {
  const r = renderWithProviders(<ChangesetInspector />);
  useUiStore.getState().selectChangeset(CHANGESET_ID);
  return r;
}

async function confirmIn(dialogTitle: string, button: string) {
  const user = userEvent.setup();
  const dialog = (await screen.findByText(dialogTitle)).closest('[role="dialog"]') as HTMLElement;
  expect(dialog).toBeTruthy();
  await user.click(within(dialog).getByRole('button', { name: button }));
}

describe('ChangesetInspector — Apply / Discard', () => {
  it('offers no actions on a committed changeset', async () => {
    renderInspector();

    await waitFor(() => expect(screen.getByText('COMMITTED')).toBeInTheDocument());
    expect(screen.queryByTestId('changeset-actions')).not.toBeInTheDocument();
  });

  it('applies a staged changeset after confirmation', async () => {
    const posts = serveStaged();
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByTestId('changeset-apply-button'));
    expect(posts).toEqual([]);
    await confirmIn('Apply changeset', 'Apply');

    await waitFor(() => expect(screen.getByText('COMMITTED')).toBeInTheDocument());
    expect(posts).toEqual(['commit']);
    expect(await screen.findByText('Applied 38 changes to the model')).toBeInTheDocument();
    expect(screen.queryByTestId('changeset-actions')).not.toBeInTheDocument();
  });

  it('discards a staged changeset after confirmation', async () => {
    const posts = serveStaged();
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByTestId('changeset-discard-button'));
    await confirmIn('Discard changeset', 'Discard');

    await waitFor(() => expect(screen.getByText('DISCARDED')).toBeInTheDocument());
    expect(posts).toEqual(['discard']);
    expect(await screen.findByText(`Discarded ${NAME}`)).toBeInTheDocument();
  });

  it('does nothing when the confirmation is cancelled', async () => {
    const posts = serveStaged();
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByTestId('changeset-apply-button'));
    await confirmIn('Apply changeset', 'Cancel');

    expect(posts).toEqual([]);
    expect(screen.getByText('STAGED')).toBeInTheDocument();
  });

  it("shows the server's reason inline when a commit is refused", async () => {
    const reason = 'Validation failed with 1 error(s):\n  - api.operation.x: missing operationId';
    const posts = serveStaged({ commitError: { status: 422, error: reason } });
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByTestId('changeset-apply-button'));
    await confirmIn('Apply changeset', 'Apply');

    const alert = await screen.findByTestId('changeset-action-error');
    expect(alert).toHaveTextContent('Validation failed with 1 error(s):');
    expect(alert).toHaveTextContent('missing operationId');
    expect(posts).toEqual(['commit']);
    expect(screen.getByText('STAGED')).toBeInTheDocument();
    expect(screen.getByTestId('changeset-apply-button')).toBeEnabled();
  });
});

describe('changesetActionErrorMessage', () => {
  it("returns the body's error from the generated client's message", () => {
    const err = new Error(
      'POST /api/changesets/:changesetId/commit failed: 409 {"error":"Base model has drifted since changeset creation. Use --force to commit anyway."}',
    );
    expect(changesetActionErrorMessage(err)).toBe(
      'Base model has drifted since changeset creation. Use --force to commit anyway.',
    );
  });

  it('falls back to the raw body, then the whole message', () => {
    expect(changesetActionErrorMessage(new Error('POST /x failed: 500 Internal Server Error'))).toBe(
      'Internal Server Error',
    );
    expect(changesetActionErrorMessage(new Error('Network down'))).toBe('Network down');
  });
});

describe('useRefreshAfterChatReply', () => {
  it('refetches changesets and the model only when a DrBot reply finishes', () => {
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { rerender } = renderHookWithClient(
      ({ streaming }: { streaming: boolean }) => useRefreshAfterChatReply(streaming),
      { client, initialProps: { streaming: false } },
    );

    rerender({ streaming: true });
    expect(invalidate).not.toHaveBeenCalled();

    rerender({ streaming: false });
    const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey);
    expect(keys).toEqual([['getapichangesets'], ['getapichangesetschangesetId'], ['getapimodel']]);

    invalidate.mockClear();
    rerender({ streaming: false });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
