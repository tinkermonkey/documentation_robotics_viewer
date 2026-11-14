// @vitest-environment happy-dom
/**
 * ChangesetReview.spec.tsx — reviewing a staged changeset change by change.
 *
 * Renders the REAL ChangesetCanvas + ChangesetInspector (and the inbox) with
 * the REAL data hooks against a stateful MSW double of the dr CLI's review
 * API: `GET /api/changesets/:id` (served STAGED, with `review`), `PUT
 * .../review` (merges verdicts like the server) and `POST .../commit` /
 * `.../discard` (record the body, flip the status). An older CLI is the same
 * detail without `review`.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ChangesetCanvas } from '@/apps/embedded/ui/ChangesetCanvas';
import { ChangesetInspector } from '@/apps/embedded/ui/ChangesetInspector';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { useLocalReviewStore } from '@/apps/embedded/stores/localReviewStore';
import { changesetActionErrorMessage } from '@/apps/embedded/data/useChangesets';
import type { ChangesetReview, DecisionInput, UnstagedChange } from '@/apps/embedded/data/changesetReview';
import type { ChangeRecord } from '@/apps/embedded/data/changesets';
import { ApiError } from '@/core/services/generatedApiClient';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';
import changesetDetail from '../fixtures/changeset-detail.json';

const ID = 'changeset-1774309821523-1gs13ct6s';
const FIXTURE = changesetDetail.changes as ChangeRecord[];
/** Every reviewable change in the fixture (38 minus the 8 that cancel out). */
const REVIEWABLE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 26, 27, 28, 29, 30, 31, 32];

interface ServeOptions {
  /** Omit `review` from the detail: an older dr CLI. */
  legacy?: boolean;
  review?: ChangesetReview;
  changes?: ChangeRecord[];
  unstaged?: UnstagedChange[];
  revision?: number;
  commitError?: { status: number; body: unknown };
  /** PUT .../review answers 404 with no JSON body (route missing). */
  reviewMissing?: boolean;
}

interface Server {
  puts: DecisionInput[][];
  commits: (unknown | null)[];
  discards: number;
  review: () => ChangesetReview;
}

function keepAll(except: Record<number, 'drop' | 'ask'> = {}): ChangesetReview {
  const decisions: ChangesetReview['decisions'] = {};
  for (const seq of REVIEWABLE) decisions[String(seq)] = { verdict: except[seq] ?? 'keep', atRevision: 38, decidedAt: 'x' };
  return { decisions, lastReviewedRevision: 38 };
}

function serve(opts: ServeOptions = {}): Server {
  let status = 'staged';
  let review: ChangesetReview = opts.review ?? { decisions: {} };
  const revision = opts.revision ?? 38;
  const server: Server = { puts: [], commits: [], discards: 0, review: () => review };
  mswServer.use(
    http.get('*/api/changesets/:id', ({ params }) =>
      HttpResponse.json({
        ...changesetDetail,
        id: params.id,
        status,
        changes: opts.changes ?? FIXTURE,
        ...(opts.legacy ? {} : { revision, unstaged: opts.unstaged ?? [], review }),
      }),
    ),
    http.put('*/api/changesets/:id/review', async ({ request }) => {
      if (opts.legacy || opts.reviewMissing) return new HttpResponse('404 Not Found', { status: 404 });
      const body = (await request.json()) as { decisions: DecisionInput[] };
      server.puts.push(body.decisions);
      const decisions = { ...review.decisions };
      for (const d of body.decisions) {
        if (d.verdict === null) delete decisions[String(d.sequence)];
        else decisions[String(d.sequence)] = { verdict: d.verdict, ...(d.note ? { note: d.note } : {}), atRevision: revision, decidedAt: 'now' };
      }
      review = { decisions, ...(Object.keys(decisions).length ? { lastReviewedRevision: revision } : {}) };
      return HttpResponse.json(review);
    }),
    http.post('*/api/changesets/:id/commit', async ({ params, request }) => {
      const text = await request.text();
      server.commits.push(text ? JSON.parse(text) : null);
      if (opts.commitError) return HttpResponse.json(opts.commitError.body as object, { status: opts.commitError.status });
      status = 'committed';
      const drop = text ? ((JSON.parse(text) as { drop?: number[] }).drop ?? []) : [];
      // The server cascades: dropping the add of RelationshipType (7) leaves out its link (32).
      const dropped = drop.includes(7) ? [...drop, 32].sort((a, b) => a - b) : drop;
      return HttpResponse.json({
        id: params.id,
        name: changesetDetail.name,
        status,
        committed: 30 - dropped.length,
        ...(text ? { dropped, linksDeleted: 0 } : {}),
      });
    }),
    http.post('*/api/changesets/:id/discard', ({ params }) => {
      server.discards++;
      status = 'discarded';
      return HttpResponse.json({ id: params.id, name: changesetDetail.name, status });
    }),
  );
  return server;
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
  screen.getAllByTestId('review-row').find((r) => r.getAttribute('data-seq') === String(seq))!;

beforeEach(() => {
  useLocalReviewStore.setState({ byChangeset: {}, unsupported: {}, blockersSeen: {} });
  localStorage.clear();
});

describe('review — deciding changes (dr CLI with review)', () => {
  it('summarises what needs a decision and holds Apply until every change has one', async () => {
    serve();
    renderReview();
    expect(await screen.findByTestId('review-headline')).toHaveTextContent('30 of 30 need a decision');
    expect(screen.getByTestId('changeset-apply-button')).toBeDisabled();
    expect(screen.getByTestId('review-apply-why')).toHaveTextContent('30 changes still need a decision');
    expect(screen.getByRole('progressbar', { name: '0 of 30 decided' })).toBeInTheDocument();
    expect(screen.queryByTestId('review-local-pill')).not.toBeInTheDocument();
  });

  it('records Keep from the inspector and flips the row', async () => {
    const server = serve();
    const user = userEvent.setup();
    renderReview(13);
    await user.click(await screen.findByTestId('decide-keep'));

    await waitFor(() => expect(server.puts).toEqual([[{ sequence: 13, verdict: 'keep' }]]));
    // The default filter (Needs decision) no longer lists it; All does, as kept.
    await user.click(within(screen.getByTestId('review-filter')).getByRole('radio', { name: /^All/ }));
    expect(row(13)).toHaveAttribute('data-state', 'keep');
    expect(screen.getByTestId('review-tally')).toHaveTextContent('1 kept');
    expect(screen.getByTestId('decide-keep')).toHaveAttribute('aria-pressed', 'true');
  });

  it('sends the note with a Drop, and warns what a dropped add takes with it', async () => {
    const server = serve();
    const user = userEvent.setup();
    renderReview(7);
    await user.type(await screen.findByTestId('decision-note'), 'compat enum');
    await user.click(screen.getByTestId('decide-drop'));

    await waitFor(() => expect(server.puts).toEqual([[{ sequence: 7, verdict: 'drop', note: 'compat enum' }]]));
    expect(await screen.findByTestId('change-takes-with')).toHaveTextContent('1 change that need it: 32');
  });

  it('keeps the routine updates in bulk', async () => {
    const server = serve();
    renderReview();
    fireEvent.click(await screen.findByTestId('review-bulk-keep'));
    await waitFor(() => expect(server.puts).toHaveLength(1));
    expect(server.puts[0].map((d) => d.sequence)).toEqual([0, 13, 14, 15, 16, 17, 18]);
    expect(server.puts[0].every((d) => d.verdict === 'keep')).toBe(true);
  });

  it('opens a change from the list in the inspector', async () => {
    serve();
    const user = userEvent.setup();
    renderReview();
    await screen.findAllByTestId('review-row');
    await user.click(row(14));
    const inspector = await screen.findByTestId('change-inspector');
    expect(inspector).toHaveTextContent('Data Loader');
    expect(within(inspector).getAllByTestId('change-field')[0]).toHaveTextContent('description');
    // The links this changeset adds to it (seq 20) are listed.
    expect(within(screen.getByTestId('change-related'))).toBeTruthy();
    expect(screen.getByTestId('change-related')).toHaveTextContent('Data Loader depends-on Relationships YAML Parser');
  });

  it('rolls the verdict back and says why when the server refuses it', async () => {
    serve();
    mswServer.use(
      http.put('*/api/changesets/:id/review', () =>
        HttpResponse.json({ error: "Changeset 'x' is not staged" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderReview(13);
    await user.click(await screen.findByTestId('decide-keep'));
    expect(await screen.findByTestId('review-decision-error')).toHaveTextContent('is not staged');
    expect(screen.getByTestId('review-tally')).toHaveTextContent('0 kept');
  });
});

describe('review — Apply', () => {
  it('lists what lands and what is left out, then commits with the drop list', async () => {
    const server = serve({ review: keepAll({ 7: 'drop' }) });
    const user = userEvent.setup();
    renderReview();

    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    expect(apply).toHaveTextContent('Apply 28 kept, drop 2');
    await user.click(apply);

    const dialog = await screen.findByTestId('apply-confirm');
    const dropped = within(dialog).getByTestId('apply-confirm-dropped');
    expect(dropped).toHaveTextContent('RelationshipType');
    expect(dropped).toHaveTextContent('left out with RelationshipType (7)');
    expect(server.commits).toEqual([]);
    await user.click(within(dialog).getByTestId('apply-confirm-button'));

    await waitFor(() => expect(server.commits).toEqual([{ drop: [7], deleteBlockedLinks: [] }]));
    expect(await screen.findByTestId('applied-result')).toBeInTheDocument();
    expect(await screen.findByText('Applied 28 changes to the model')).toBeInTheDocument();
    expect(screen.queryByTestId('review-summary')).not.toBeInTheDocument();
    expect(screen.getByTestId('applied-left-out')).toHaveTextContent('2 left out');
  });

  it('waits on DrBot while a change is asked about', async () => {
    serve({ review: keepAll({ 13: 'ask' }) });
    renderReview();
    expect(await screen.findByTestId('review-headline')).toHaveTextContent('1 waiting on DrBot');
    expect(screen.getByTestId('changeset-apply-button')).toBeDisabled();
  });

  it('says nothing was written when the model drifted (409)', async () => {
    serve({
      review: keepAll(),
      commitError: { status: 409, body: { error: 'Base model has drifted since changeset creation. Use --force to commit anyway.' } },
    });
    const user = userEvent.setup();
    renderReview();
    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);
    await user.click(within(await screen.findByTestId('apply-confirm')).getByTestId('apply-confirm-button'));
    expect(await screen.findByTestId('changeset-action-error')).toHaveTextContent(
      'Nothing was written. The model changed after this was staged. Your decisions are kept',
    );
    expect(screen.getByTestId('review-summary')).toBeInTheDocument();
  });

  it('names the links a refused delete still has (422 blockers)', async () => {
    serve({
      review: keepAll(),
      commitError: {
        status: 422,
        body: {
          error: 'Deletes still in use',
          blockers: {
            '14': [
              {
                relationshipId: 'application.applicationservice.embedded-data-loader::depends-on::application.applicationservice.data-loader',
                direction: 'in',
                otherElementId: 'application.applicationservice.embedded-data-loader',
                predicate: 'depends-on',
              },
            ],
          },
        },
      },
    });
    const user = userEvent.setup();
    renderReview();
    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);
    await user.click(within(await screen.findByTestId('apply-confirm')).getByTestId('apply-confirm-button'));
    const alert = await screen.findByTestId('changeset-action-error');
    expect(alert).toHaveTextContent('would leave links pointing at nothing');
    expect(alert).toHaveTextContent('change 14 (Data Loader)');
  });

  it("shows the server's reason for any other refusal", async () => {
    const reason = 'Validation failed with 1 error(s):\n  - api.operation.x: missing operationId';
    serve({ review: keepAll(), commitError: { status: 422, body: { error: reason } } });
    const user = userEvent.setup();
    renderReview();
    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);
    await user.click(within(await screen.findByTestId('apply-confirm')).getByTestId('apply-confirm-button'));
    expect(await screen.findByTestId('changeset-action-error')).toHaveTextContent('missing operationId');
  });

  it('discards after confirmation', async () => {
    const server = serve();
    const user = userEvent.setup();
    renderReview();
    await user.click(await screen.findByTestId('changeset-discard-button'));
    const dialog = await screen.findByRole('dialog', { name: 'Discard changeset' });
    await user.click(within(dialog).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(server.discards).toBe(1));
    expect(await screen.findByTestId('review-discarded')).toBeInTheDocument();
  });
});

describe('review — a delete still in use', () => {
  const blocked: ChangeRecord = {
    type: 'delete',
    elementId: 'application.applicationservice.data-loader',
    layerName: 'application',
    sequenceNumber: 3,
    before: { name: 'Data Loader', type: 'applicationservice', description: 'Old loader' },
    blockers: [
      { relationshipId: 'a::serves::application.applicationservice.data-loader', direction: 'in', otherElementId: 'a', predicate: 'serves' },
      { relationshipId: 'application.applicationservice.data-loader::uses::b', direction: 'out', otherElementId: 'b', predicate: 'uses' },
    ],
  };

  it('groups it under Blocked deletes and resolves it by deleting the links too', async () => {
    const server = serve({ changes: [blocked], revision: 4 });
    const user = userEvent.setup();
    renderReview();
    const group = await screen.findByRole('region', { name: 'Blocked deletes' });
    expect(group).toHaveTextContent('2 links still use it');

    await user.click(row(3));
    expect(await screen.findByTestId('change-blockers')).toHaveTextContent(/into ·\s*a · serves/);
    // Keep the other N leaves blocked deletes alone.
    expect(screen.getByTestId('review-keep-rest')).toBeDisabled();
    // Picking (and arrowing between) options records nothing; Confirm does.
    await user.click(screen.getByTestId('resolve-ask'));
    await user.click(screen.getByTestId('resolve-keep'));
    expect(server.puts).toEqual([]);
    await user.click(screen.getByTestId('resolve-confirm'));
    await waitFor(() => expect(server.puts).toEqual([[{ sequence: 3, verdict: 'keep' }]]));
    // The links it was kept with are remembered, so a new one would re-open it.
    expect(useLocalReviewStore.getState().blockersSeen[ID]['3']).toEqual([
      'a::serves::application.applicationservice.data-loader',
      'application.applicationservice.data-loader::uses::b',
    ]);

    const apply = screen.getByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);
    expect(within(await screen.findByTestId('apply-confirm')).getByTestId('apply-confirm-links')).toHaveTextContent(
      '2 links that still use Data Loader are deleted with it',
    );
    await user.click(within(screen.getByTestId('apply-confirm')).getByTestId('apply-confirm-button'));
    await waitFor(() => expect(server.commits).toEqual([{ drop: [], deleteBlockedLinks: [3] }]));
  });
});

describe('review — a blocked delete: clearing, and a blocker that appears later', () => {
  const blocked = (ids: string[]): ChangeRecord => ({
    type: 'delete',
    elementId: 'application.applicationservice.data-loader',
    layerName: 'application',
    sequenceNumber: 3,
    before: { name: 'Data Loader', type: 'applicationservice' },
    blockers: ids.map((relationshipId) => ({ relationshipId, direction: 'in' as const, otherElementId: 'a', predicate: 'serves' })),
  });

  it('clears a verdict with Clear verdict', async () => {
    const server = serve({ changes: [blocked(['r1'])], revision: 4, review: { decisions: { '3': { verdict: 'drop', atRevision: 4 } } } });
    const user = userEvent.setup();
    renderReview(3);
    await user.click(await screen.findByTestId('resolve-clear'));
    await waitFor(() => expect(server.puts).toEqual([[{ sequence: 3, verdict: null }]]));
  });

  it('puts a kept delete back to "needs decision" when it gains a blocker', async () => {
    useLocalReviewStore.setState({ blockersSeen: { [ID]: { '3': ['r1'] } } });
    serve({ changes: [blocked(['r1', 'r2'])], revision: 4, review: { decisions: { '3': { verdict: 'keep', atRevision: 4 } } } });
    renderReview();
    expect(await screen.findByTestId('review-headline')).toHaveTextContent('1 of 1 need a decision');
  });
});

describe('review — PUT ordering and rollback', () => {
  it('serialises back-to-back PUTs in order and keeps both verdicts', async () => {
    serve();
    const arrived: number[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let review: ChangesetReview = { decisions: {} };
    mswServer.use(
      http.put('*/api/changesets/:id/review', async ({ request }) => {
        const body = (await request.json()) as { decisions: DecisionInput[] };
        arrived.push(body.decisions[0].sequence);
        if (body.decisions[0].sequence === 13) await gate;
        for (const d of body.decisions) {
          review = {
            decisions: { ...review.decisions, [String(d.sequence)]: { verdict: d.verdict!, atRevision: 38 } },
            lastReviewedRevision: 38,
          };
        }
        return HttpResponse.json(review);
      }),
      http.get('*/api/changesets/:id', ({ params }) =>
        HttpResponse.json({ ...changesetDetail, id: params.id, status: 'staged', revision: 38, unstaged: [], review }),
      ),
    );
    renderReview(13);
    fireEvent.click(await screen.findByTestId('decide-keep'));
    act(() => useUiStore.getState().selectChange(14));
    fireEvent.click(await screen.findByTestId('decide-keep'));
    // The second waits for the first.
    await new Promise((r) => setTimeout(r, 50));
    expect(arrived).toEqual([13]);
    release();
    await waitFor(() => expect(arrived).toEqual([13, 14]));
    await waitFor(() => expect(screen.getByTestId('review-tally')).toHaveTextContent('2 kept'));
  });

  it('on a refused PUT restores only the verdict, keeping a refetch that landed meanwhile', async () => {
    serve();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    // Hold the refetch that follows the refusal, so we see what onError left.
    let releaseRefetch!: () => void;
    const refetchGate = new Promise<void>((r) => (releaseRefetch = r));
    let putSettled = false;
    mswServer.use(
      http.put('*/api/changesets/:id/review', async () => {
        await gate;
        putSettled = true;
        return HttpResponse.json({ error: 'not staged' }, { status: 409 });
      }),
      http.get('*/api/changesets/:id', async ({ params }) => {
        if (putSettled) await refetchGate;
        return HttpResponse.json({
          ...changesetDetail, id: params.id, status: 'staged', revision: 38, unstaged: [], review: { decisions: {} },
        });
      }),
    );
    const { client } = renderReview(13);
    fireEvent.click(await screen.findByTestId('decide-keep'));
    await waitFor(() => expect(screen.getByTestId('review-tally')).toHaveTextContent('1 kept'));
    // A websocket refetch lands while the PUT is in flight: DrBot restaged.
    const key = ['getapichangesetschangesetId', ID];
    act(() => {
      const current = client.getQueryData<Record<string, unknown>>(key)!;
      client.setQueryData(key, { ...current, revision: 40 });
    });
    release();
    expect(await screen.findByTestId('review-decision-error')).toHaveTextContent('not staged');
    const after = client.getQueryData<Record<string, unknown>>(key)!;
    expect(after.revision).toBe(40);
    expect((after.review as ChangesetReview).decisions['13']).toBeUndefined();
    releaseRefetch();
  });
});

describe('review — Ask DrBot', () => {
  it("doesn't post a comment on an element this changeset adds, and says so", async () => {
    const server = serve({
      revision: 2,
      changes: [
        {
          type: 'add',
          elementId: 'application.applicationservice.brand-new-service',
          layerName: 'application',
          sequenceNumber: 1,
          after: { name: 'Brand New Service', type: 'applicationservice', description: 'new' },
        },
      ],
    });
    let annotationPosts = 0;
    mswServer.use(
      http.post('*/api/annotations', () => {
        annotationPosts++;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    // seq 1 adds an element the model doesn't have yet.
    renderReview(1);
    await user.type(await screen.findByTestId('decision-note'), 'why this name?');
    expect(screen.getByTestId('ask-no-comment')).toBeInTheDocument();
    await user.click(screen.getByTestId('decide-ask'));
    await waitFor(() => expect(server.puts).toEqual([[{ sequence: 1, verdict: 'ask', note: 'why this name?' }]]));
    expect(annotationPosts).toBe(0);
  });

  it('posts the note as a comment on a model element, and reports a failed post', async () => {
    serve();
    mswServer.use(http.post('*/api/annotations', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    const user = userEvent.setup();
    // seq 14 updates Data Loader, which is in the model.
    renderReview(14);
    await user.type(await screen.findByTestId('decision-note'), 'which parsers?');
    await user.click(screen.getByTestId('decide-ask'));
    expect(await screen.findByTestId('ask-comment-error')).toHaveTextContent('verdict is recorded');
  });
});

describe('review — since your last review', () => {
  it('opens on what DrBot changed: revised, new and withdrawn', async () => {
    const add = (seq: number, slug: string, description: string): ChangeRecord => ({
      type: 'add',
      elementId: `application.applicationservice.${slug}`,
      layerName: 'application',
      sequenceNumber: seq,
      after: { name: slug, type: 'applicationservice', description },
    });
    serve({
      changes: [add(0, 'alpha', 'now'), add(4, 'gamma', 'new one')],
      unstaged: [
        { sequence: 0, removedAt: 4, rewritten: true, change: add(0, 'alpha', 'before') },
        { sequence: 1, removedAt: 4, change: add(1, 'beta', 'gone') },
      ],
      revision: 5,
      review: {
        decisions: { '0': { verdict: 'ask', note: 'rename', atRevision: 3 }, '1': { verdict: 'drop', atRevision: 3 } },
        lastReviewedRevision: 3,
      },
    });
    renderReview();
    const since = await screen.findByTestId('review-since');
    expect(within(since).getByTestId('review-revised')).toHaveTextContent('You asked DrBot the earlier version: "rename"');
    expect(within(since).getByTestId('review-new')).toHaveTextContent('gamma');
    expect(within(since).getByTestId('review-withdrawn')).toHaveTextContent('You dropped it');
    // The ask on the earlier version no longer counts.
    expect(screen.getByTestId('review-headline')).toHaveTextContent('2 of 2 need a decision');
  });
});

describe('review — an older dr CLI (no review API)', () => {
  it('keeps verdicts in this browser, hides Drop and applies without a body', async () => {
    const server = serve({ legacy: true });
    const user = userEvent.setup();
    renderReview(13);
    expect(await screen.findByTestId('review-local-note')).toBeInTheDocument();
    expect(screen.queryByTestId('decide-drop')).not.toBeInTheDocument();
    expect(screen.getByTestId('drop-unavailable')).toBeInTheDocument();

    await user.click(screen.getByTestId('decide-keep'));
    expect(useLocalReviewStore.getState().byChangeset[ID]['13'].verdict).toBe('keep');
    expect(JSON.parse(localStorage.getItem('dr-viewer-local-review')!).state.byChangeset[ID]['13'].verdict).toBe('keep');
    expect(server.puts).toEqual([]);

    await user.click(screen.getByTestId('review-keep-rest'));
    const apply = screen.getByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);
    await user.click(within(await screen.findByTestId('apply-confirm')).getByTestId('apply-confirm-button'));
    await waitFor(() => expect(server.commits).toEqual([null]));
    // Applied: the verdicts kept in this browser are cleared.
    await waitFor(() => expect(useLocalReviewStore.getState().byChangeset[ID]).toBeUndefined());
  });

  it('falls back to this browser when PUT .../review is missing (404, no error body)', async () => {
    serve({ reviewMissing: true });
    const user = userEvent.setup();
    renderReview(13);
    await user.click(await screen.findByTestId('decide-keep'));
    await waitFor(() => expect(useLocalReviewStore.getState().unsupported[ID]).toBe(true));
    expect(useLocalReviewStore.getState().byChangeset[ID]['13'].verdict).toBe('keep');
    expect(await screen.findByTestId('review-local-note')).toBeInTheDocument();
    expect(screen.queryByTestId('review-decision-error')).not.toBeInTheDocument();
  });
});

describe('changesetActionErrorMessage', () => {
  it("returns the server's { error } message", () => {
    const err = new ApiError(
      'POST /api/changesets/:changesetId/commit',
      409,
      '{"error":"Base model has drifted since changeset creation. Use --force to commit anyway."}',
    );
    expect(changesetActionErrorMessage(err)).toBe(
      'Base model has drifted since changeset creation. Use --force to commit anyway.',
    );
  });

  it('falls back to the raw body, then the error message', () => {
    expect(changesetActionErrorMessage(new ApiError('POST /x', 500, 'Internal Server Error'))).toBe(
      'Internal Server Error',
    );
    expect(changesetActionErrorMessage(new Error('Network down'))).toBe('Network down');
  });
});
