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
  /** The status the detail starts in (default staged). */
  status?: 'staged' | 'committed' | 'discarded';
  /** Omit `review` from the detail: an older dr CLI. */
  legacy?: boolean;
  review?: ChangesetReview;
  changes?: ChangeRecord[];
  unstaged?: UnstagedChange[];
  revision?: number;
  commitError?: { status: number; body: unknown };
  /** GET keeps answering `staged` after a commit (the refetch hasn't caught up). */
  staleAfterCommit?: boolean;
  /** PUT .../review answers 404 with no JSON body (route missing). */
  reviewMissing?: boolean;
  /** Purpose fields on the detail (a dr CLI with changeset purposes). */
  purpose?: string;
  actions?: string[];
  verifies?: string;
  scope?: { since: string; codeCommit?: string };
  /** A discard deletes the changeset: GET answers 404 afterwards (a current dr CLI). */
  deleteOnDiscard?: boolean;
  /** The detail's base drift (a dr CLI that reports it); omitted, an older dr CLI. */
  drift?: unknown;
}

interface Server {
  puts: DecisionInput[][];
  commits: (unknown | null)[];
  discards: number;
  review: () => ChangesetReview;
}

const NO_DRIFT = { state: 'none', blocksCommit: false, message: 'The base model has not changed since this changeset was created.' };
const SETTLED_DRIFT = { state: 'not-applicable', blocksCommit: false, message: 'Base drift does not apply to this changeset.' };

function keepAll(except: Record<number, 'drop' | 'ask'> = {}): ChangesetReview {
  const decisions: ChangesetReview['decisions'] = {};
  for (const seq of REVIEWABLE) decisions[String(seq)] = { verdict: except[seq] ?? 'keep', atRevision: 38, decidedAt: 'x' };
  return { decisions, lastReviewedRevision: 38 };
}

function serve(opts: ServeOptions = {}): Server {
  let status: string = opts.status ?? 'staged';
  let review: ChangesetReview = opts.review ?? { decisions: {} };
  const revision = opts.revision ?? 38;
  const server: Server = { puts: [], commits: [], discards: 0, review: () => review };
  mswServer.use(
    http.get('*/api/changesets/:id', ({ params }) =>
      opts.deleteOnDiscard && status === 'discarded'
        ? HttpResponse.json({ error: 'Changeset not found' }, { status: 404 })
        : HttpResponse.json({
            ...changesetDetail,
            id: params.id,
            status: opts.staleAfterCommit ? 'staged' : status,
            changes: opts.changes ?? FIXTURE,
            ...(opts.legacy ? {} : { revision, unstaged: opts.unstaged ?? [], review }),
            ...(opts.purpose ? { purpose: opts.purpose } : {}),
            ...(opts.actions ? { actions: status === 'staged' ? opts.actions : [] } : {}),
            ...(opts.verifies ? { verifies: opts.verifies } : {}),
            ...(opts.scope ? { scope: opts.scope } : {}),
            // A dr CLI that sends actions also reports drift (required there); an older one sends neither.
            ...(opts.drift !== undefined
              ? { drift: opts.drift }
              : opts.actions
                ? { drift: status === 'staged' && opts.purpose !== 'verification' ? NO_DRIFT : SETTLED_DRIFT }
                : {}),
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
  // #573: Apply no longer waits for a verdict on every change.
  it('summarises what needs a decision and offers Apply with the undecided landing as kept', async () => {
    serve();
    renderReview();
    expect(await screen.findByTestId('review-headline')).toHaveTextContent('30 of 30 need a decision');
    const apply = screen.getByTestId('changeset-apply-button');
    expect(apply).toBeEnabled();
    expect(apply).toHaveTextContent('Apply 30 · 30 undecided as kept');
    expect(screen.getByTestId('review-apply-undecided')).toHaveTextContent('Apply lands the 30 undecided changes as kept');
    expect(screen.queryByTestId('review-apply-why')).not.toBeInTheDocument();
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

  it('labels the columns and the two chip shapes, and draws a link as source → predicate → target', async () => {
    serve();
    const user = userEvent.setup();
    renderReview();
    await screen.findAllByTestId('review-row');
    await user.click(within(screen.getByTestId('review-filter')).getByRole('radio', { name: /^All/ }));
    const legend = screen.getByTestId('review-legend');
    expect(legend).toHaveTextContent('CHANGE');
    expect(legend).toHaveTextContent('YOUR DECISION');
    expect(within(row(1)).getByTestId('review-op-chip')).toHaveTextContent('+ element');
    expect(within(row(1)).getByTestId('review-verdict-chip')).toHaveTextContent('Needs decision');
    // Seq 19 links two elements this changeset adds; seq 27's target is already in the model.
    const chain = within(row(19)).getByTestId('link-chain');
    expect(within(chain).getAllByTestId('link-end').map((e) => e.hasAttribute('data-new'))).toEqual([true, true]);
    expect(chain).toHaveTextContent('depends-on');
    expect(within(row(27)).getAllByTestId('link-end').map((e) => e.hasAttribute('data-new'))).toEqual([true, false]);
    expect(row(19)).not.toHaveTextContent('new source');
    expect(row(27)).toHaveTextContent('objectschema → objectschema · within Data Model');
  });

  it("heads an added element's inspector with its layer, labelled rows and links grouped by direction", async () => {
    serve();
    renderReview(1);
    const inspector = await screen.findByTestId('change-inspector');
    expect(within(inspector).getByTestId('change-layer-band')).toHaveTextContent(/Adds to\s*Application layer/);
    expect(within(inspector).getByTestId('change-layer-band')).toHaveTextContent('applicationservice');
    const kv = within(inspector).getByTestId('change-kv');
    expect(kv).toHaveTextContent('Change+ element new in this changeset');
    expect(kv).toHaveTextContent('Your decision');
    // Out: it depends on the Predicate Type Mapper (19); in: the Data Loader depends on it (20).
    const out = within(inspector).getByTestId('related-out');
    expect(out).toHaveTextContent('depends-on');
    expect(out).toHaveTextContent('Predicate Type Mapper');
    expect(out).toHaveTextContent('NEW');
    expect(within(inspector).getByTestId('related-in')).toHaveTextContent('Data Loader');
    // Its source reference is listed under its own heading.
    expect(within(inspector).getByTestId('change-source')).toHaveTextContent(/\.ts/);
    expect(within(inspector).queryByTestId('change-source-none')).not.toBeInTheDocument();
    expect(within(inspector).getByTestId('change-neighbourhood')).toBeInTheDocument();
  });

  it('says when an element has no source reference instead of hiding the section', async () => {
    const changes = FIXTURE.map((c) =>
      c.sequenceNumber === 1 ? { ...c, after: { ...(c.after ?? {}), source_reference: undefined } } : c,
    );
    serve({ changes });
    renderReview(1);
    expect(await screen.findByTestId('change-source-none')).toHaveTextContent('None yet');
  });

  it('shows a link change as a card: source, predicate, target', async () => {
    serve();
    renderReview(27);
    const card = await screen.findByTestId('change-link-card');
    expect(within(card).getByTestId('link-card-source')).toHaveTextContent('NEW');
    expect(within(card).getByTestId('link-card-target')).toHaveTextContent('in the model');
    expect(card).toHaveTextContent('extends');
    expect(within(card).getByText('Identifier')).toBeInTheDocument();
    expect(screen.getByTestId('change-layer-band')).toHaveTextContent(/Adds a link\s*within Data Model/);
    expect(screen.getByTestId('change-source-none')).toHaveTextContent("Links don't carry one");
  });

  it('opens the element in Impact from its neighbourhood', async () => {
    serve();
    const user = userEvent.setup();
    renderReview(1);
    await user.click(await screen.findByTestId('neighbourhood-open-impact'));
    expect(useUiStore.getState().changesetTab).toBe('impact');
    expect(useUiStore.getState().impactFocus).toBe('application.applicationservice.relationships-yaml-parser');
    const crumbs = await screen.findByTestId('impact-breadcrumb');
    expect(crumbs).toHaveTextContent('Relationships YAML Parser');
    await user.click(within(crumbs).getByTestId('impact-show-all'));
    expect(useUiStore.getState().impactFocus).toBeNull();
  });

  it('finds an element in Impact and focuses it with Enter', async () => {
    serve();
    const user = userEvent.setup();
    renderReview();
    await screen.findAllByTestId('review-row');
    act(() => useUiStore.getState().setChangesetTab('impact'));
    const impact = await screen.findByTestId('changeset-impact');
    expect(within(impact).getByTestId('impact-help')).toBeInTheDocument();
    await user.type(within(impact).getByRole('textbox'), 'predicate');
    const matches = await within(impact).findByTestId('impact-matches');
    expect(within(matches).getAllByRole('option').length).toBeGreaterThan(0);
    await user.keyboard('{Enter}');
    expect(useUiStore.getState().impactFocus).not.toBeNull();
    expect(await within(impact).findByTestId('impact-focus')).toHaveTextContent(/Predicate/);
    // Its change opens in the inspector column.
    await user.click(within(impact).getByTestId('impact-open-change'));
    expect(useUiStore.getState().changeSeq).not.toBeNull();
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

describe('review — a settled changeset', () => {
  // #574: one applied without a change-by-change review has no decisions; its rows must not read "Needs decision".
  it('shows each change of an applied changeset as landed, not as needing a decision', async () => {
    serve({ status: 'committed' });
    renderReview(1);
    expect(await screen.findByTestId('applied-result')).toBeInTheDocument();
    const rows = await screen.findAllByTestId('review-row');
    expect(rows.every((r) => within(r).getByTestId('review-outcome-chip').textContent === '✓Landed')).toBe(true);
    expect(screen.queryAllByTestId('review-verdict-chip')).toHaveLength(0);
    expect(screen.queryByText('Needs decision')).not.toBeInTheDocument();
    const legend = screen.getByTestId('review-legend');
    expect(legend).toHaveTextContent('OUTCOME');
    expect(legend).not.toHaveTextContent('YOUR DECISION');
    const kv = within(await screen.findByTestId('change-inspector')).getByTestId('change-kv');
    expect(kv).toHaveTextContent('Outcome✓Landed');
    expect(kv).not.toHaveTextContent('Your decision');
  });

  it('shows each change of a discarded changeset as not applied', async () => {
    serve({ status: 'discarded' });
    renderReview();
    expect(await screen.findByTestId('review-discarded')).toBeInTheDocument();
    const rows = await screen.findAllByTestId('review-row');
    expect(rows.every((r) => within(r).getByTestId('review-outcome-chip').getAttribute('data-outcome') === 'not-applied')).toBe(true);
    expect(screen.getByTestId('review-legend')).toHaveTextContent('never reached the model');
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

  it("applies with changes undecided, says how many land as kept, and drops nothing it wasn't told to", async () => {
    // Only seq 7 is decided (dropped; its link 32 goes with it): the other 28 have no verdict.
    const server = serve({ review: { decisions: { '7': { verdict: 'drop', atRevision: 38 } }, lastReviewedRevision: 38 } });
    const user = userEvent.setup();
    renderReview();

    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toHaveTextContent('Apply 28, drop 2 · 28 undecided as kept'));
    expect(apply).toBeEnabled();
    await user.click(apply);

    const dialog = await screen.findByTestId('apply-confirm');
    expect(within(dialog).getByTestId('apply-confirm-undecided')).toHaveTextContent(
      /All 28 have no decision \(.*\)\. Apply lands them as kept/,
    );
    expect(within(dialog).getByTestId('apply-confirm-dropped')).toHaveTextContent('RelationshipType');
    await user.click(within(dialog).getByTestId('apply-confirm-button'));

    // No verdicts are written for the undecided: the body names only the drop.
    await waitFor(() => expect(server.commits).toEqual([{ drop: [7], deleteBlockedLinks: [] }]));
    expect(server.puts).toEqual([]);
    expect(await screen.findByTestId('applied-undecided')).toHaveTextContent(/28 .*landed without a per-change decision/);
  });

  it('keeps Apply shut after it succeeds until the changeset reads as committed', async () => {
    const server = serve({ review: keepAll(), staleAfterCommit: true });
    const user = userEvent.setup();
    renderReview();

    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);
    await user.click(within(await screen.findByTestId('apply-confirm')).getByTestId('apply-confirm-button'));

    await waitFor(() => expect(server.commits).toHaveLength(1));
    await screen.findByText('Applied 30 changes to the model');
    // The detail still says staged: the card stays, but can't be applied again.
    const stale = screen.getByTestId('changeset-apply-button');
    expect(stale).toBeDisabled();
    expect(stale).toHaveTextContent('Applying…');
    expect(screen.getByTestId('changeset-discard-button')).toBeDisabled();
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

describe('review — a delete still in use', () => {
  it('holds Apply while the blocked delete is undecided', async () => {
    const blocked: ChangeRecord = {
      type: 'delete',
      elementId: 'application.applicationservice.data-loader',
      layerName: 'application',
      sequenceNumber: 3,
      before: { name: 'Data Loader', type: 'applicationservice' },
      blockers: [{ relationshipId: 'a::serves::application.applicationservice.data-loader', direction: 'in', otherElementId: 'a', predicate: 'serves' }],
    };
    const routine: ChangeRecord = {
      type: 'update',
      elementId: 'application.applicationservice.other',
      layerName: 'application',
      sequenceNumber: 4,
      before: { name: 'Other', description: 'a' },
      after: { name: 'Other', description: 'b' },
    };
    serve({ changes: [blocked, routine], revision: 5 });
    renderReview();
    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(screen.getByTestId('review-apply-why')).toHaveTextContent('1 delete still in use needs a decision'));
    expect(apply).toBeDisabled();
    expect(screen.queryByTestId('review-apply-undecided')).not.toBeInTheDocument();
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

const RECORD_REFUSAL =
  "Changeset 'add-export-as-built' is a verification record: the record of what was built, compared with plan 'add-export'. A verification record is never landed. Land the plan 'add-export' instead. Keep this record (it stays staged and is committed to git with the plan) or discard it. To reconcile the model with code drift, extract without a plan active and land that changeset.";

describe('review — purpose and actions', () => {
  it('offers a verification record Discard but no Apply', async () => {
    serve({ review: keepAll(), purpose: 'verification', actions: ['discard'], verifies: 'cs-plan' });
    renderReview();
    await screen.findByTestId('review-summary');
    await waitFor(() => expect(screen.getByTestId('changeset-discard-button')).toBeEnabled());
    expect(screen.queryByTestId('changeset-apply-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('review-keep-rest')).not.toBeInTheDocument();
    expect(screen.queryByTestId('review-apply-why')).not.toBeInTheDocument();
    expect(screen.getByText('A verification record is never applied. Keep it as a record, or discard it.')).toBeInTheDocument();
  });

  it('explains a refused commit of a verification record inline, not as drift', async () => {
    // A detail that still offers commit (e.g. read before the server knew better): the server refuses.
    serve({ review: keepAll(), commitError: { status: 409, body: { error: RECORD_REFUSAL } } });
    const user = userEvent.setup();
    renderReview();
    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);
    await user.click(within(await screen.findByTestId('apply-confirm')).getByTestId('apply-confirm-button'));
    const error = await screen.findByTestId('changeset-action-error');
    expect(error).toHaveTextContent('This is a verification record, which is never applied');
    expect(error).toHaveTextContent("Land the plan 'add-export' instead");
    expect(error).not.toHaveTextContent('The model changed after this was staged');
  });

  it('keeps Apply and Discard on an older dr CLI that sends no actions', async () => {
    serve({ review: keepAll() });
    renderReview();
    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    expect(screen.getByTestId('changeset-discard-button')).toBeEnabled();
    expect(screen.getByTestId('review-keep-rest')).toBeInTheDocument();
    expect(screen.queryByTestId('changeset-purpose-note')).not.toBeInTheDocument();
  });
});

describe('ChangesetCanvas — purpose', () => {
  it('leads a verification record with the plan it verifies and what extraction read', async () => {
    serve({
      purpose: 'verification',
      actions: ['discard'],
      verifies: 'cs-plan',
      scope: { since: 'origin/main', codeCommit: '0123456789abcdef' },
    });
    mswServer.use(
      http.get('*/api/changesets', () =>
        HttpResponse.json({
          version: '1.0.0',
          changesets: {
            [ID]: { name: 'add-export-as-built', status: 'staged', created: '2026-11-18T11:00:00Z', changes_count: 38, purpose: 'verification', verifies: 'cs-plan', actions: ['discard'], drift: SETTLED_DRIFT },
            'cs-plan': { name: 'add-export', status: 'staged', created: '2026-11-18T10:00:00Z', changes_count: 12, purpose: 'plan', actions: ['commit', 'discard'], drift: NO_DRIFT },
          },
        }),
      ),
    );
    const user = userEvent.setup();
    renderReview();

    const note = await screen.findByTestId('changeset-purpose-note');
    await waitFor(() => expect(within(note).getByTestId('changeset-verifies')).toHaveTextContent('Verifies add-export'));
    expect(note).toHaveTextContent('extraction read changes since origin/main, at 0123456');
    expect(note).toHaveTextContent("It isn't applied: keep it as a record");
    expect(screen.getByTestId('page-header-eyebrow')).toHaveTextContent('VERIFICATION RECORD');

    await user.click(within(note).getByRole('button', { name: 'add-export' }));
    expect(useUiStore.getState().changesetId).toBe('cs-plan');
  });

  it('says a changeset is gone when the server no longer has it', async () => {
    const server = serve({ purpose: 'plan', actions: ['commit', 'discard'], deleteOnDiscard: true });
    const user = userEvent.setup();
    renderReview();

    // Discarding here deletes it: back to the inbox, with a toast.
    const discard = await screen.findByTestId('changeset-discard-button');
    await waitFor(() => expect(discard).toBeEnabled());
    await user.click(discard);
    await user.click(await screen.findByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(server.discards).toBe(1));
    await waitFor(() => expect(useUiStore.getState().changesetId).toBeNull());
    expect(await screen.findByText(`Discarded ${changesetDetail.name}`)).toBeInTheDocument();
    expect(screen.getByTestId('changeset-inbox')).toBeInTheDocument();

    // Opened again (a link, back/forward): the server answers 404, and the page says it is gone.
    act(() => useUiStore.getState().selectChangeset(ID));
    const gone = await screen.findByTestId('changeset-gone', {}, { timeout: 4000 });
    expect(gone).toHaveTextContent('A discarded changeset is deleted');
    await user.click(within(gone).getByTestId('changeset-gone-back'));
    expect(useUiStore.getState().changesetId).toBeNull();
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

describe('review — drift before Apply', () => {
  const DRIFTED_MESSAGE = 'The base model changed since this changeset was created, so a commit is refused for drift.';
  const DRIFTED = {
    state: 'drifted',
    blocksCommit: true,
    message: DRIFTED_MESSAGE,
    warnings: ['Could not compare one relationship.'],
    baseIndex: 'recorded',
    overlapping: {
      elements: [{ id: 'application.applicationservice.use-changesets', reason: 'changed-in-base' }],
      relationships: [{ source: 'api.operation.one', predicate: 'references', target: 'api.operation.two', reason: 'endpoint-removed-in-base', endpoints: ['api.operation.two'] }],
    },
    baseChanges: {
      counts: { elementsAdded: 2, elementsRemoved: 0, elementsChanged: 61, relationshipsAdded: 1, relationshipsRemoved: 0 },
      elementsAdded: ['api.operation.one', 'api.operation.two'],
      elementsRemoved: [],
      elementsChanged: ['application.applicationservice.use-changesets'],
      relationshipsAdded: [{ source: 'api.operation.one', predicate: 'references', target: 'api.operation.two' }],
      relationshipsRemoved: [],
      layers: ['application', 'api'],
      truncated: true,
    },
  };
  const PLAN = { purpose: 'plan', actions: ['commit', 'discard'] };

  it('badges a drifted plan in the canvas header and the inspector', async () => {
    serve({ ...PLAN, drift: DRIFTED });
    renderReview();
    await screen.findByTestId('review-summary');
    // Header + inspector overview, before any change is decided.
    await waitFor(() => expect(screen.getAllByTestId('drift-badge')).toHaveLength(2));
    for (const badge of screen.getAllByTestId('drift-badge')) {
      expect(badge).toHaveTextContent('Base changed since this was staged');
      expect(badge).toHaveAttribute('title', DRIFTED_MESSAGE);
    }
    expect(screen.getByTestId('drift-section')).toHaveTextContent(DRIFTED_MESSAGE);
  });

  it('explains the drift on the summary card and holds Apply before the confirm dialog', async () => {
    const server = serve({ ...PLAN, review: keepAll(), drift: DRIFTED });
    const user = userEvent.setup();
    renderReview();
    const note = await screen.findByTestId('drift-apply-note');
    expect(note).toHaveTextContent(DRIFTED_MESSAGE);
    expect(note).toHaveTextContent('Ask DrBot to restage it');
    expect(note).toHaveTextContent('the apply route takes no force');
    const apply = screen.getByTestId('changeset-apply-button');
    expect(apply).toBeDisabled();
    expect(apply.getAttribute('title')).toMatch(/base model changed since this was staged/);
    await user.click(apply);
    expect(screen.queryByTestId('apply-confirm')).not.toBeInTheDocument();
    expect(server.commits).toEqual([]);
    // Discard stays open: the way out of a stale plan.
    expect(screen.getByTestId('changeset-discard-button')).toBeEnabled();
  });

  it('shows no drift badge on a verification record or on content-free drift', async () => {
    serve({
      purpose: 'verification',
      actions: ['discard'],
      verifies: 'cs-plan',
      drift: { state: 'not-applicable', blocksCommit: false, message: "A verification record is never landed, so base drift does not apply to it. Its plan 'add-export' has landed." },
    });
    const record = renderReview();
    await screen.findByTestId('review-summary');
    await waitFor(() => expect(screen.getByTestId('drift-section')).toHaveTextContent("Its plan 'add-export' has landed."));
    expect(screen.queryByTestId('drift-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drift-apply-note')).not.toBeInTheDocument();
    record.unmount();

    serve({
      ...PLAN,
      review: keepAll(),
      drift: { state: 'content-free', blocksCommit: false, message: 'The base changed, but nothing this changeset was staged against did.' },
    });
    renderReview();
    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    expect(screen.queryByTestId('drift-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drift-apply-note')).not.toBeInTheDocument();
    // A quiet line in the inspector, not a warning.
    const quiet = screen.getByTestId('drift-section');
    expect(quiet).toHaveTextContent('nothing this changeset was staged against did');
    expect(quiet).not.toHaveClass('drv-alert');
  });

  it('says plainly when drift could not be checked, without holding Apply', async () => {
    serve({
      ...PLAN,
      review: keepAll(),
      drift: { state: 'unknown', blocksCommit: false, message: 'No base snapshot was recorded for this changeset, so drift cannot be checked.' },
    });
    renderReview();
    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    expect(screen.getByTestId('drift-apply-note')).toHaveTextContent("Drift couldn't be checked: No base snapshot was recorded");
    expect(screen.getByTestId('drift-apply-note')).toHaveTextContent("Apply isn't held for it");
    expect(screen.getByTestId('drift-section')).toHaveTextContent("Drift couldn't be checked.");
    expect(screen.queryByTestId('drift-badge')).not.toBeInTheDocument();
  });

  it('lists what the base changed under the changeset in the inspector overview', async () => {
    serve({ ...PLAN, drift: DRIFTED });
    renderReview();
    const overlaps = await screen.findByTestId('drift-overlaps');
    expect(overlaps).toHaveTextContent('application.applicationservice.use-changesets: the base changed it');
    expect(overlaps).toHaveTextContent('api.operation.one —references→ api.operation.two: the base removed an end (api.operation.two)');
    const changes = screen.getByTestId('drift-base-changes');
    expect(changes).toHaveTextContent('elements: 2 added, 61 changed · links: 1 added');
    const layers = within(changes).getAllByRole('listitem').map((li) => li.textContent);
    expect(layers).toEqual(['Application1 element', 'API2 elements']);
    expect(screen.getByTestId('drift-truncated')).toHaveTextContent('cut at 50');
    expect(screen.getByTestId('drift-section')).toHaveTextContent('Could not compare one relationship.');
  });

  it('keeps Apply and the 409 backstop on an older dr CLI without drift', async () => {
    serve({
      review: keepAll(),
      commitError: { status: 409, body: { error: 'Base model has drifted since changeset creation. Nothing was written.' } },
    });
    const user = userEvent.setup();
    renderReview();
    const apply = await screen.findByTestId('changeset-apply-button');
    await waitFor(() => expect(apply).toBeEnabled());
    expect(screen.queryByTestId('drift-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drift-apply-note')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drift-section')).not.toBeInTheDocument();
    await user.click(apply);
    await user.click(within(await screen.findByTestId('apply-confirm')).getByTestId('apply-confirm-button'));
    expect(await screen.findByTestId('changeset-action-error')).toHaveTextContent(
      'Nothing was written. The model changed after this was staged.',
    );
  });
});
