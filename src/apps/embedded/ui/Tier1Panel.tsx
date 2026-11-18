/**
 * Tier1Panel — Tier 1's state and this month's spend, in the Changesets inbox
 * (extraction changesets are where Tier 1's decisions land).
 *
 * - On / capped / no credentials / misconfigured: a card with the state, the
 *   provider and model, the month's spend against the cap (a bar; amber with
 *   the 80% warning when `nearCap`, rose at the cap), the reset date, spend per
 *   source, where each credential comes from (never its value), the answer
 *   cache, warnings, and the server's `reason` whenever Tier 1 isn't on.
 * - Warming (on, while a codebase_index job fills the answer cache): the fill's
 *   progress in place of `reason` — cards done of the total, time left, time
 *   running, cost so far — refreshed by `useTier1` until it ends.
 * - Mode (stages without the agent / suggests only, with `modeReason`) and,
 *   for OpenRouter, the upstreams card text may go to and the routing terms.
 * - A cap of $0 is a choice, not an overrun: the card says Tier 1 asks
 *   nothing, with no bar and no reset date.
 * - Off (the default, not opted in): a folded one-liner, so the inbox stays
 *   as it was for a project that doesn't use Tier 1.
 * - An older dr CLI without `GET /api/tier1`: nothing at all. Other failures:
 *   one muted line saying the status couldn't be read.
 *
 * Server wording wins where it exists (`reason`, the 80% warning in
 * `summary`); the panel's own text is only the fallback for an earlier CLI
 * that doesn't send it. Everything rendered went through `toTier1Status`.
 *
 * Read-only. The panel offers no action that changes Tier 1: the server's
 * `note` names the `dr analyzer tier1 ...` command instead.
 */

import { Chip, ProgressBar } from '@tinkermonkey/heimdall-ui';
import { WithCode } from './reviewParts';
import { useTier1 } from '../data/useTier1';
import {
  TIER1_MODE_LABEL,
  TIER1_STATE_COLOR,
  TIER1_STATE_LABEL,
  formatBytes,
  formatCount,
  formatDuration,
  warmingPercent,
  type Tier1Warming,
  formatPercent,
  formatResetDate,
  formatUsd,
  isZeroCap,
  nearCapWarningText,
  percentUsed,
  sourceBreakdown,
  spendColor,
  type Tier1Status,
} from '../data/tier1';

function formatDay(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function cards(n: number): string {
  return `${formatCount(n)} card${n === 1 ? '' : 's'}`;
}

function SourceTable({ status }: { status: Tier1Status }) {
  const sources = sourceBreakdown(status.bySource);
  if (sources.length === 0) return null;
  return (
    <table className="drv-table" data-testid="tier1-sources" aria-label="Tier 1 spend this month by source">
      <thead>
        <tr>
          <th scope="col">SOURCE</th>
          <th scope="col">CARDS</th>
          <th scope="col">COST</th>
          <th scope="col">LAST</th>
        </tr>
      </thead>
      <tbody>
        {sources.map(({ source, spend }) => (
          <tr key={source} data-testid="tier1-source-row" data-source={source}>
            <td className="drv-mono" style={{ fontSize: 12 }}>
              {source}
            </td>
            <td className="drv-mono" style={{ fontSize: 12 }}>
              {formatCount(spend.cards)}
            </td>
            <td className="drv-mono" style={{ fontSize: 12 }}>
              {formatUsd(spend.costUsd)}
            </td>
            <td className="drv-mono drv-muted" style={{ fontSize: 12 }}>
              {formatDay(spend.lastAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Spend({ status }: { status: Tier1Status }) {
  const { month } = status;
  if (isZeroCap(month)) {
    return (
      <>
        <div className="drv-tier1__spend" data-testid="tier1-spend">
          <strong>{formatUsd(month.spentUsd)}</strong>
          <span>spent this month · the monthly cap is $0</span>
        </div>
        <SourceTable status={status} />
      </>
    );
  }
  const pct = percentUsed(month);
  const serverWarning = nearCapWarningText(status.summary);
  return (
    <>
      <div className="drv-tier1__spend" data-testid="tier1-spend">
        <strong>{formatUsd(month.spentUsd)}</strong>
        <span>of the {formatUsd(month.capUsd)} monthly cap</span>
        <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>
          {formatUsd(month.remainingUsd)} left · {cards(month.cards)}
          {month.resetsAt ? ` · resets ${formatResetDate(month.resetsAt)} (UTC)` : ''}
        </span>
      </div>
      <ProgressBar
        percent={pct}
        color={spendColor(status)}
        height={4}
        role="progressbar"
        aria-label={`Tier 1 spend this month: ${formatUsd(month.spentUsd)} of ${formatUsd(month.capUsd)}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        data-testid="tier1-spend-bar"
      />
      {status.nearCap && (
        <p className="drv-warn" role="status" data-testid="tier1-near-cap">
          {serverWarning ? (
            <WithCode text={serverWarning} />
          ) : (
            <>
              Tier 1 has used {formatPercent(pct)} of this checkout&apos;s monthly cap. At the cap it stops asking the
              model until it resets; cached answers are still used.
            </>
          )}
        </p>
      )}
      <SourceTable status={status} />
    </>
  );
}

/**
 * Warming: how far the codebase_index job's cache fill has got — cards done of
 * the total as a bar (or that the cards are still being built), time left,
 * how long it has run and its cost so far. `useTier1` re-reads the status
 * while warming, so this moves on its own.
 */
function Warming({ warming }: { warming: Tier1Warming }) {
  const { cards } = warming;
  const started = Date.parse(warming.startedAt);
  const elapsed = Number.isNaN(started) ? null : Math.max(0, (Date.now() - started) / 1000);
  const facts = [
    warming.etaSeconds !== undefined ? `${formatDuration(warming.etaSeconds)} left` : null,
    elapsed !== null ? `running ${formatDuration(elapsed).replace(/^about /, '')}` : null,
    `${formatUsd(warming.costUsd)} so far`,
  ].filter(Boolean);
  const pct = warmingPercent(cards);
  return (
    <div className="drv-tier1__warming" data-testid="tier1-warming">
      <div className="drv-tier1__spend">
        <span className="drv-eyebrow">Filling the answer cache</span>
        {cards ? (
          <span data-testid="tier1-warming-cards">
            {formatCount(cards.done)} of {formatCount(cards.total)} cards
          </span>
        ) : (
          <span data-testid="tier1-warming-cards">Building the cards…</span>
        )}
      </div>
      {cards && (
        <ProgressBar
          percent={pct}
          color="cyan"
          height={4}
          role="progressbar"
          aria-label={`Answer cache fill: ${formatCount(cards.done)} of ${formatCount(cards.total)} cards`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          data-testid="tier1-warming-bar"
        />
      )}
      <span className="drv-mono drv-muted" style={{ fontSize: 12 }} data-testid="tier1-warming-facts">
        {facts.join(' · ')}
      </span>
    </div>
  );
}

/**
 * Mode and routing: whether Tier 1 places changes without the agent (and the
 * server's reason), and for OpenRouter, the upstreams card text may go to.
 * Read-only: the server's `note` names the command that changes the mode.
 */
function Settings({ status }: { status: Tier1Status }) {
  const { mode, modeReason, routing } = status;
  if (!mode && !routing) return null;
  return (
    <dl className="drv-kv" style={{ margin: 0 }} data-testid="tier1-settings">
      {mode && (
        <>
          <dt>Mode</dt>
          <dd data-testid="tier1-mode" data-mode={mode}>
            <span style={{ color: 'rgb(var(--canvas-fg-1))' }}>{TIER1_MODE_LABEL[mode]}</span>
            {modeReason && (
              <span className="drv-muted" style={{ flexBasis: '100%', fontSize: 12 }} data-testid="tier1-mode-reason">
                <WithCode text={modeReason} />
              </span>
            )}
          </dd>
        </>
      )}
      {routing && (
        <>
          <dt>Card text to</dt>
          <dd data-testid="tier1-routing">
            {routing.only.map((u) => (
              <Chip key={u} variant="neutral" data-testid="tier1-upstream">
                {u}
              </Chip>
            ))}
            <span className="drv-muted" style={{ flexBasis: '100%', fontSize: 12 }} data-testid="tier1-routing-terms">
              only these · no fallbacks · no data collection{routing.zdr ? ' · zero data retention' : ''}
            </span>
          </dd>
        </>
      )}
    </dl>
  );
}

function Credentials({ status }: { status: Tier1Status }) {
  const entries = Object.entries(status.credentials);
  if (entries.length === 0) return null;
  return (
    <div className="drv-pills" role="group" aria-label="Credentials" data-testid="tier1-credentials">
      {entries.map(([name, c]) => (
        <Chip key={name} variant={c.set ? 'neutral' : 'amber'} data-testid="tier1-credential" data-set={String(c.set)}>
          {name}: {c.set ? `set${c.from ? ` from ${c.from}` : ''}` : 'missing'}
        </Chip>
      ))}
    </div>
  );
}

/**
 * Why Tier 1 isn't asking: the server's `reason` (sent for every state but
 * on), else the panel's own words for a cap of $0 or a reached cap, else
 * `summary` for the other states. Nothing when Tier 1 is simply on.
 */
function Reason({ status }: { status: Tier1Status }) {
  // Warming is on while codebase_index fills the answer cache; its progress is in `reason`.
  const running = status.state === 'on' || status.state === 'warming' || status.state === 'capped';
  if (status.reason) {
    return (
      <p className="drv-text-block" style={{ margin: 0 }} data-testid="tier1-reason">
        <WithCode text={status.reason} />
      </p>
    );
  }
  if (running && isZeroCap(status.month)) {
    return (
      <p className="drv-text-block" style={{ margin: 0 }} data-testid="tier1-zero-cap">
        The monthly cap is $0, so Tier 1 asks the model nothing and uses only cached answers. To let it ask:{' '}
        <code className="drv-code">dr analyzer tier1 set monthly-cap &lt;usd&gt;</code>.
      </p>
    );
  }
  if (status.state === 'capped') {
    return (
      <p className="drv-text-block" style={{ margin: 0 }} data-testid="tier1-capped">
        This month&apos;s cap is reached: extraction asks the model nothing more until{' '}
        {formatResetDate(status.month.resetsAt)} (UTC). Cached answers are still used.
      </p>
    );
  }
  if (!running && status.summary) {
    return (
      <p className="drv-text-block" style={{ margin: 0 }} data-testid="tier1-reason">
        <WithCode text={status.summary} />
      </p>
    );
  }
  return null;
}

function Tier1Card({ status }: { status: Tier1Status }) {
  const zeroCap = isZeroCap(status.month);
  const tone =
    status.state === 'misconfigured' || (status.state === 'capped' && !zeroCap)
      ? ' drv-card--danger'
      : status.state === 'no-credentials' || (status.nearCap && !zeroCap)
        ? ' drv-card--attention'
        : '';
  const modelLine = [status.provider, status.modelId ?? status.model].filter(Boolean).join(' · ');
  const warming = status.state === 'warming' ? status.warming : undefined;
  return (
    <section
      className={`drv-card drv-tier1${tone}`}
      aria-labelledby="tier1-heading"
      data-testid="tier1-panel"
      data-state={status.state}
    >
      <div className="drv-summary__top">
        <h2 id="tier1-heading" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
          Tier 1 decisions
        </h2>
        <Chip variant={zeroCap ? 'neutral' : TIER1_STATE_COLOR[status.state]} data-testid="tier1-state">
          {TIER1_STATE_LABEL[status.state]}
        </Chip>
        {modelLine && (
          <span className="drv-mono drv-muted" style={{ fontSize: 12 }} data-testid="tier1-model">
            {modelLine}
          </span>
        )}
      </div>

      {/* While warming, the progress below says what `reason` says in words. */}
      {warming ? <Warming warming={warming} /> : <Reason status={status} />}
      {status.state !== 'misconfigured' && <Spend status={status} />}
      <Settings status={status} />
      <Credentials status={status} />

      {status.warnings.length > 0 && (
        <ul className="drv-warn" style={{ paddingLeft: 26 }} data-testid="tier1-warnings">
          {status.warnings.map((w) => (
            <li key={w}>
              <WithCode text={w} />
            </li>
          ))}
        </ul>
      )}

      {/* cache.entries counts lines in the cache files (one per answer, before compaction drops any). */}
      {status.cache.entries > 0 && (
        <span className="drv-mono drv-muted" style={{ fontSize: 12 }} data-testid="tier1-cache">
          Answer cache: {formatCount(status.cache.entries)} lines · {formatBytes(status.cache.bytes)}
        </span>
      )}
      {status.note && (
        <p className="drv-tier1__note" data-testid="tier1-note">
          <WithCode text={status.note} />
        </p>
      )}
    </section>
  );
}

/** Off: one folded line, the reason and the note inside. */
function Tier1Off({ status }: { status: Tier1Status }) {
  const why = status.reason ?? status.summary;
  return (
    <details className="drv-group drv-tier1-off" data-testid="tier1-panel" data-state="off">
      <summary>
        <strong>Tier 1</strong> is off · extraction decides with its rules alone
        {status.month.spentUsd > 0 && ` · ${formatUsd(status.month.spentUsd)} spent this month`}
      </summary>
      <div className="drv-tier1">
        {why && (
          <p className="drv-text-block" style={{ margin: 0 }} data-testid="tier1-reason">
            <WithCode text={why} />
          </p>
        )}
        {status.note && (
          <p className="drv-tier1__note" data-testid="tier1-note">
            <WithCode text={status.note} />
          </p>
        )}
      </div>
    </details>
  );
}

export function Tier1Panel() {
  const view = useTier1();
  if (view.kind === 'loading' || view.kind === 'unavailable') return null;
  if (view.kind === 'error') {
    return (
      <p className="drv-muted" style={{ margin: 0, fontSize: 12.5 }} data-testid="tier1-error">
        Tier 1 status couldn&apos;t be read: {view.message}
      </p>
    );
  }
  return view.status.state === 'off' ? <Tier1Off status={view.status} /> : <Tier1Card status={view.status} />;
}

export default Tier1Panel;
