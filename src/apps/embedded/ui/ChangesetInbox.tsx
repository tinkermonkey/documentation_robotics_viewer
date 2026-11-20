/**
 * ChangesetInbox — the Changesets view with no changeset open, sorted by what
 * each changeset needs from you (its `purpose`, from the dr CLI; see
 * `data/changesetPurpose.ts`):
 *
 * - Plans and DrBot's changes (or a changeset whose purpose this dr CLI
 *   doesn't say) go under "Waiting on DrBot" when every change has a verdict
 *   and some are asks (DrBot is revising); otherwise under "Waiting on you",
 *   with their review progress. Progress comes from the list's `review`
 *   counts (a dr CLI with review) or from verdicts kept in this browser.
 * - Bootstrap / reconcile changesets (extracted from the code) go under
 *   "Ready to land as built", with the same progress.
 * - Verification records go under their own heading, each paired with the
 *   plan it verifies. They are never applied: kept as a record or discarded.
 * - Upgrade records (the relationships a spec upgrade dropped) go under their
 *   own heading. Never applied: reviewed, restored from by hand, discarded.
 * - The history: what landed (and, from an older dr CLI, what was discarded:
 *   a current one deletes a discarded changeset), with each one's purpose.
 *
 * A plan whose base drifted under it (the server would refuse to apply it)
 * carries a "Base changed since this was staged" badge with the server's
 * message, before anyone starts its review (`DriftNotice`). Content-free
 * drift and verification records are never badged.
 *
 * Above the history, the Tier 1 panel (`Tier1Panel`): the decision model's
 * state and this month's spend, read-only.
 */

import { Button, Chip, ProgressBar } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { plural } from './reviewParts';
import { useChangesets, useLocalReviewCounts, type ChangesetSummary } from '../data/useChangesets';
import { originLabel } from '../data/changesetReview';
import { inboxGroups, purposeLabel, recordsOf } from '../data/changesetPurpose';
import { useLocalReviewStore } from '../stores/localReviewStore';
import { Tier1Panel } from './Tier1Panel';
import { ErrorBoundary } from './ErrorBoundary';
import { DriftBadge } from './DriftNotice';
import { driftTone } from '../data/changesetDrift';
import { MarkdownExcerpt } from './MarkdownText';

interface Progress {
  decided: number;
  total: number;
  asked: number;
}

/**
 * The list's own counts (a dr CLI with review), else the same counts worked
 * out here from the detail and this browser's verdicts (`reviewCounts`), else
 * nothing decided yet while that detail loads.
 */
function progressOf(cs: ChangesetSummary, local: Record<string, Progress>): Progress {
  return cs.review ?? local[cs.id] ?? { decided: 0, total: cs.changesCount, asked: 0 };
}

export function waitingOnDrBot(p: Progress): boolean {
  return p.asked > 0 && p.decided >= p.total;
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function StagedCard({
  cs,
  progress,
  records = [],
}: {
  cs: ChangesetSummary;
  progress: Progress;
  /** Verification records of this plan. */
  records?: ChangesetSummary[];
}) {
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const undecided = progress.total - progress.decided;
  const pct = progress.total ? Math.round((progress.decided / progress.total) * 100) : 0;
  const started = progress.decided > 0;
  const origin = originLabel(cs.origin);
  const purpose = purposeLabel(cs.purpose);
  return (
    <article
      className={`drv-card drv-inbox__card${undecided > 0 ? ' drv-card--attention' : ''}`}
      data-testid="inbox-card"
      data-changeset={cs.id}
    >
      <div className="drv-summary__top">
        <Chip variant="cyan">staged</Chip>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>{cs.name}</h3>
        <span className="drv-muted" style={{ fontSize: 12.5 }}>
          {[purpose, origin, cs.revision !== undefined ? `revision ${cs.revision}` : undefined, formatDay(cs.created)]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <Button
            variant="accent"
            size="sm"
            onClick={() => selectChangeset(cs.id)}
            aria-label={`${started ? 'Continue review of' : 'Review'} ${cs.name}`}
            data-testid="inbox-open"
          >
            {started ? 'Continue review' : 'Review'}
          </Button>
        </span>
      </div>
      {/* The description's first paragraph, inline (#588); the canvas shows it whole. */}
      <MarkdownExcerpt text={cs.description} data-testid="inbox-card-description" />
      <div className="drv-pills">
        <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>
          {plural(cs.changesCount, 'change')}
        </span>
        <DriftBadge drift={cs.drift} />
        {undecided > 0 && <Chip variant="amber">{undecided} need a decision</Chip>}
        {progress.asked > 0 && <Chip variant="violet">{progress.asked} asked DrBot</Chip>}
        {records.map((r) => (
          <button
            key={r.id}
            type="button"
            className="drv-linkbtn"
            style={{ fontSize: 12 }}
            onClick={() => selectChangeset(r.id)}
            data-testid="inbox-plan-record"
          >
            verified by {r.name}
          </button>
        ))}
      </div>
      {driftTone(cs.drift) === 'blocks' && (
        <p className="drv-muted" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }} data-testid="inbox-drift-message">
          {cs.drift!.message} Ask DrBot to restage it before you review.
        </p>
      )}
      <ProgressBar
        percent={pct}
        color="amber"
        height={4}
        role="progressbar"
        aria-label={`${cs.name}: ${progress.decided} of ${progress.total} decided`}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.decided}
      />
    </article>
  );
}

/** A verification record, with the plan it verifies: kept or discarded, never applied. */
function RecordCard({ record, plan }: { record: ChangesetSummary; plan?: ChangesetSummary }) {
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  return (
    <article className="drv-card drv-inbox__card" data-testid="inbox-record" data-changeset={record.id}>
      <div className="drv-summary__top">
        <Chip variant="neutral">record</Chip>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>{record.name}</h3>
        <span className="drv-muted" style={{ fontSize: 12.5 }}>
          {plural(record.changesCount, 'change')} as built · {formatDay(record.created)}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => selectChangeset(record.id)}
            aria-label={`Open ${record.name}`}
            data-testid="inbox-record-open"
          >
            Open
          </Button>
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'rgb(var(--canvas-fg-2))' }} data-testid="inbox-record-plan">
        Verifies{' '}
        {plan ? (
          <button type="button" className="drv-linkbtn" onClick={() => selectChangeset(plan.id)}>
            {plan.name}
          </button>
        ) : (
          <span className="drv-mono">{record.verifies ?? 'a plan that is no longer listed'}</span>
        )}
        {plan && plan.status !== 'staged' ? ` (${plan.status === 'committed' ? 'applied' : plan.status})` : ''}
      </p>
    </article>
  );
}

/** An upgrade record: what a spec upgrade dropped. Reviewed, restored from by hand, discarded; never applied. */
function UpgradeCard({ record }: { record: ChangesetSummary }) {
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  return (
    <article className="drv-card drv-inbox__card" data-testid="inbox-upgrade" data-changeset={record.id}>
      <div className="drv-summary__top">
        <Chip variant="neutral">upgrade</Chip>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>{record.name}</h3>
        <span className="drv-muted" style={{ fontSize: 12.5 }}>
          {plural(record.changesCount, 'relationship')} dropped · {formatDay(record.created)}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => selectChangeset(record.id)}
            aria-label={`Open ${record.name}`}
            data-testid="inbox-upgrade-open"
          >
            Open
          </Button>
        </span>
      </div>
    </article>
  );
}

export function ChangesetInbox() {
  const { derived, isLoading } = useChangesets();
  const local = useLocalReviewStore((s) => s.byChangeset);
  const selectChangeset = useUiStore((s) => s.selectChangeset);

  const groups = inboxGroups(derived.list);
  // Records are never applied, so their review progress isn't counted.
  const legacyIds = [...groups.review, ...groups.land].filter((c) => !c.review).map((c) => c.id);
  const localCounts = useLocalReviewCounts(legacyIds, local);
  const staged = groups.review.map((cs) => ({ cs, p: progressOf(cs, localCounts) }));
  const onYou = staged.filter((s) => !waitingOnDrBot(s.p));
  const onBot = staged.filter((s) => waitingOnDrBot(s.p));
  const toLand = groups.land.map((cs) => ({ cs, p: progressOf(cs, localCounts) }));
  const { records, upgrades, history } = groups;

  return (
    <div className="drv-inbox" data-testid="changeset-inbox">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'rgb(var(--canvas-fg-1))' }}>Changesets</h1>
        <p style={{ margin: 0, maxWidth: 900, lineHeight: 1.55, color: 'rgb(var(--canvas-fg-2))', fontSize: 13.5 }}>
          Changes staged against the model. Nothing reaches the model until you apply it. Plans and DrBot&apos;s
          changes wait on your review; changesets extracted from the code land the model as built; verification
          records compare what was built with a plan, and are kept or discarded, never applied. Upgrade records list
          what a spec upgrade dropped.
        </p>
      </div>

      <section className="drv-inbox__section" aria-labelledby="inbox-on-you" data-testid="inbox-on-you">
        <h2 id="inbox-on-you" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
          Waiting on you <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>{onYou.length}</span>
        </h2>
        {onYou.length === 0 ? (
          <p className="drv-muted" style={{ margin: 0, fontSize: 13 }}>
            {isLoading ? 'Loading changesets…' : 'Nothing to review.'}
          </p>
        ) : (
          onYou.map(({ cs, p }) => (
            <StagedCard key={cs.id} cs={cs} progress={p} records={recordsOf(cs.id, derived.list)} />
          ))
        )}
      </section>

      {toLand.length > 0 && (
        <section className="drv-inbox__section" aria-labelledby="inbox-to-land" data-testid="inbox-to-land">
          <h2 id="inbox-to-land" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
            Ready to land as built <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>{toLand.length}</span>
          </h2>
          <p className="drv-muted" style={{ margin: 0, fontSize: 13 }}>
            Extracted from the code. Applying one reconciles the model with the code.
          </p>
          {toLand.map(({ cs, p }) => (
            <StagedCard key={cs.id} cs={cs} progress={p} />
          ))}
        </section>
      )}

      {records.length > 0 && (
        <section className="drv-inbox__section" aria-labelledby="inbox-records" data-testid="inbox-records">
          <h2 id="inbox-records" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
            Verification records <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>{records.length}</span>
          </h2>
          <p className="drv-muted" style={{ margin: 0, fontSize: 13 }}>
            What was built, compared with its plan. A record isn&apos;t applied: keep it (it stays staged and is
            committed to git with the plan), or discard it.
          </p>
          {records.map(({ record, plan }) => (
            <RecordCard key={record.id} record={record} plan={plan} />
          ))}
        </section>
      )}

      {upgrades.length > 0 && (
        <section className="drv-inbox__section" aria-labelledby="inbox-upgrades" data-testid="inbox-upgrades">
          <h2 id="inbox-upgrades" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
            Upgrade records <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>{upgrades.length}</span>
          </h2>
          <p className="drv-muted" style={{ margin: 0, fontSize: 13 }}>
            Relationships a spec upgrade dropped because the new catalog has no replacement for their types. A
            record isn&apos;t applied: review it, restore what you still need by hand in a plan, then discard it.
          </p>
          {upgrades.map((cs) => (
            <UpgradeCard key={cs.id} record={cs} />
          ))}
        </section>
      )}

      {onBot.length > 0 && (
        <section className="drv-inbox__section" aria-labelledby="inbox-on-bot" data-testid="inbox-on-bot">
          <h2 id="inbox-on-bot" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
            Waiting on DrBot <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>{onBot.length}</span>
          </h2>
          {onBot.map(({ cs, p }) => (
            <article key={cs.id} className="drv-card drv-inbox__card" data-testid="inbox-card" data-changeset={cs.id}>
              <div className="drv-summary__top">
                <Chip variant="violet">asked</Chip>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
                  {cs.name}
                </h3>
                <span className="drv-muted" style={{ fontSize: 12.5 }}>
                  You asked about {plural(p.asked, 'change')} · DrBot restages them
                </span>
                <span style={{ marginLeft: 'auto' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => selectChangeset(cs.id)}
                    aria-label={`Open ${cs.name}`}
                  >
                    Open
                  </Button>
                </span>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Tier 1's state and spend (hidden on a dr CLI without /api/tier1; one folded line when off). */}
      <ErrorBoundary what="Tier 1's status">
        <Tier1Panel />
      </ErrorBoundary>

      {history.length > 0 && (
        <section className="drv-inbox__section" aria-labelledby="inbox-history" data-testid="inbox-history">
          <h2 id="inbox-history" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
            History
          </h2>
          <div className="drv-group">
            <table className="drv-table">
              <thead>
                <tr>
                  <th scope="col">CHANGESET</th>
                  <th scope="col">PURPOSE</th>
                  <th scope="col">OUTCOME</th>
                  <th scope="col">CHANGES</th>
                  <th scope="col">DECIDED</th>
                  <th scope="col">WHEN</th>
                </tr>
              </thead>
              <tbody>
                {history.map((cs) => (
                  <tr key={cs.id} data-testid="inbox-history-row">
                    <td>
                      <button type="button" className="drv-linkbtn" onClick={() => selectChangeset(cs.id)}>
                        {cs.name}
                      </button>
                    </td>
                    <td className="drv-muted" style={{ fontSize: 12 }} data-testid="inbox-history-purpose">
                      {purposeLabel(cs.purpose) ?? '—'}
                    </td>
                    <td>
                      <Chip variant={cs.status === 'committed' ? 'emerald' : 'neutral'}>
                        {cs.status === 'committed' ? 'applied' : cs.status}
                      </Chip>
                    </td>
                    <td className="drv-mono" style={{ fontSize: 12 }}>
                      {cs.status === 'committed' ? plural(cs.changesCount, 'change') : 'nothing'}
                    </td>
                    <td className="drv-mono drv-muted" style={{ fontSize: 12 }}>
                      {cs.review && cs.review.decided > 0 ? `${cs.review.decided} decided` : '—'}
                    </td>
                    <td className="drv-mono drv-muted" style={{ fontSize: 12 }}>
                      {formatDay(cs.created)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default ChangesetInbox;
