/**
 * ChangesetInbox — the Changesets view with no changeset open: what is
 * waiting on you, what is waiting on DrBot, and what was applied or
 * discarded.
 *
 * Staged changesets go under "Waiting on DrBot" when every change has a
 * verdict and some are asks (DrBot is revising); otherwise under "Waiting on
 * you", with their review progress. Progress comes from the list's `review`
 * counts (a dr CLI with review) or from verdicts kept in this browser.
 *
 * Above the history, the Tier 1 panel (`Tier1Panel`): the decision model's
 * state and this month's spend, read-only.
 */

import { Button, Chip, ProgressBar } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { plural } from './reviewParts';
import { useChangesets, useLocalReviewCounts, type ChangesetSummary } from '../data/useChangesets';
import { originLabel } from '../data/changesetReview';
import { useLocalReviewStore } from '../stores/localReviewStore';
import { Tier1Panel } from './Tier1Panel';

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

function StagedCard({ cs, progress }: { cs: ChangesetSummary; progress: Progress }) {
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const undecided = progress.total - progress.decided;
  const pct = progress.total ? Math.round((progress.decided / progress.total) * 100) : 0;
  const started = progress.decided > 0;
  const origin = originLabel(cs.origin);
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
          {[origin, cs.revision !== undefined ? `revision ${cs.revision}` : undefined, formatDay(cs.created)]
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
      {cs.description && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'rgb(var(--canvas-fg-2))', maxWidth: 980 }}>
          {cs.description}
        </p>
      )}
      <div className="drv-pills">
        <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>
          {plural(cs.changesCount, 'change')}
        </span>
        {undecided > 0 && <Chip variant="amber">{undecided} need a decision</Chip>}
        {progress.asked > 0 && <Chip variant="violet">{progress.asked} asked DrBot</Chip>}
      </div>
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

export function ChangesetInbox() {
  const { derived, isLoading } = useChangesets();
  const local = useLocalReviewStore((s) => s.byChangeset);
  const selectChangeset = useUiStore((s) => s.selectChangeset);

  const legacyIds = derived.list.filter((c) => c.status === 'staged' && !c.review).map((c) => c.id);
  const localCounts = useLocalReviewCounts(legacyIds, local);
  const staged = derived.list
    .filter((c) => c.status === 'staged')
    .map((cs) => ({ cs, p: progressOf(cs, localCounts) }));
  const onYou = staged.filter((s) => !waitingOnDrBot(s.p));
  const onBot = staged.filter((s) => waitingOnDrBot(s.p));
  const history = derived.list.filter((c) => c.status !== 'staged');

  return (
    <div className="drv-inbox" data-testid="changeset-inbox">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'rgb(var(--canvas-fg-1))' }}>Changesets</h1>
        <p style={{ margin: 0, maxWidth: 900, lineHeight: 1.55, color: 'rgb(var(--canvas-fg-2))', fontSize: 13.5 }}>
          Planned changes to the model. Nothing reaches the model until you apply it. DrBot stages, you decide.
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
          onYou.map(({ cs, p }) => <StagedCard key={cs.id} cs={cs} progress={p} />)
        )}
      </section>

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
      <Tier1Panel />

      {history.length > 0 && (
        <section className="drv-inbox__section" aria-labelledby="inbox-history" data-testid="inbox-history">
          <h2 id="inbox-history" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
            Applied and discarded
          </h2>
          <div className="drv-group">
            <table className="drv-table">
              <thead>
                <tr>
                  <th scope="col">CHANGESET</th>
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
