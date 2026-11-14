/**
 * Tier1Panel — Tier 1's state and this month's spend, in the Changesets inbox
 * (extraction changesets are where Tier 1's decisions land).
 *
 * - On / capped / no credentials / misconfigured: a card with the state, the
 *   provider and model, the month's spend against the cap (a bar; amber with
 *   the 80% warning when `nearCap`, rose at the cap), the reset date, spend per
 *   source, where each credential comes from (never its value), the answer
 *   cache, warnings, and the server's `reason` when it isn't running.
 * - Off (the default, not opted in): a folded one-liner, so the inbox stays
 *   as it was for a project that doesn't use Tier 1.
 * - An older dr CLI without `GET /api/tier1`: nothing at all. Other failures:
 *   one muted line saying the status couldn't be read.
 *
 * Read-only. The panel offers no action that changes Tier 1: the server's
 * `note` names the `dr analyzer tier1 ...` command instead.
 */

import { Chip, ProgressBar } from '@tinkermonkey/heimdall-ui';
import { WithCode, plural } from './reviewParts';
import { useTier1 } from '../data/useTier1';
import {
  TIER1_STATE_COLOR,
  TIER1_STATE_LABEL,
  formatBytes,
  formatResetDate,
  formatUsd,
  sourceBreakdown,
  spendColor,
  spendPercent,
  type Tier1Status,
} from '../data/tier1';

function formatDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Spend({ status }: { status: Tier1Status }) {
  const { month } = status;
  const pct = spendPercent(month);
  const sources = sourceBreakdown(status.bySource);
  return (
    <>
      <div className="drv-tier1__spend" data-testid="tier1-spend">
        <strong>{formatUsd(month.spentUsd)}</strong>
        <span>of the {formatUsd(month.capUsd)} monthly cap</span>
        <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>
          {formatUsd(month.remainingUsd)} left · {plural(month.cards, 'card')} · resets {formatResetDate(month.resetsAt)}{' '}
          (UTC)
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
        aria-valuenow={Math.round(pct)}
        data-testid="tier1-spend-bar"
      />
      {status.nearCap && (
        <p className="drv-warn" role="status" data-testid="tier1-near-cap">
          Tier 1 has used {Math.round(pct)}% of this checkout&apos;s monthly cap. At the cap it stops asking the model
          until {formatResetDate(month.resetsAt)}; cached answers are still used.
        </p>
      )}
      {sources.length > 0 && (
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
                  {spend.cards}
                </td>
                <td className="drv-mono" style={{ fontSize: 12 }}>
                  {formatUsd(spend.costUsd)}
                </td>
                <td className="drv-mono drv-muted" style={{ fontSize: 12 }}>
                  {spend.lastAt ? formatDay(spend.lastAt) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
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

function Tier1Card({ status }: { status: Tier1Status }) {
  const running = status.state === 'on' || status.state === 'capped';
  const tone =
    status.state === 'capped' || status.state === 'misconfigured'
      ? ' drv-card--danger'
      : status.state === 'no-credentials' || status.nearCap
        ? ' drv-card--attention'
        : '';
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
        <Chip variant={TIER1_STATE_COLOR[status.state]} data-testid="tier1-state">
          {TIER1_STATE_LABEL[status.state]}
        </Chip>
        {(status.provider || status.model) && (
          <span className="drv-mono drv-muted" style={{ fontSize: 12 }} data-testid="tier1-model">
            {[status.provider, status.modelId ?? status.model].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      {!running && (
        <p className="drv-text-block" style={{ margin: 0 }} data-testid="tier1-reason">
          <WithCode text={status.reason ?? status.summary} />
        </p>
      )}
      {status.state === 'capped' && (
        <p className="drv-text-block" style={{ margin: 0 }} data-testid="tier1-capped">
          This month&apos;s cap is reached: extraction asks the model nothing more until{' '}
          {formatResetDate(status.month.resetsAt)} (UTC). Cached answers are still used.
        </p>
      )}

      {status.state !== 'misconfigured' && <Spend status={status} />}
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

      {(status.cache?.entries ?? 0) > 0 && (
        <span className="drv-mono drv-muted" style={{ fontSize: 12 }} data-testid="tier1-cache">
          Answer cache: {status.cache.entries} entries · {formatBytes(status.cache.bytes)}
        </span>
      )}
      <p className="drv-tier1__note" data-testid="tier1-note">
        <WithCode text={status.note} />
      </p>
    </section>
  );
}

/** Off: one folded line, the reason and the note inside. */
function Tier1Off({ status }: { status: Tier1Status }) {
  return (
    <details className="drv-group drv-tier1-off" data-testid="tier1-panel" data-state="off">
      <summary>
        <strong>Tier 1</strong> is off · extraction decides with its rules alone
        {status.month.spentUsd > 0 && ` · ${formatUsd(status.month.spentUsd)} spent this month`}
      </summary>
      <div className="drv-tier1">
        <p className="drv-text-block" style={{ margin: 0 }} data-testid="tier1-reason">
          <WithCode text={status.reason ?? status.summary} />
        </p>
        <p className="drv-tier1__note" data-testid="tier1-note">
          <WithCode text={status.note} />
        </p>
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
