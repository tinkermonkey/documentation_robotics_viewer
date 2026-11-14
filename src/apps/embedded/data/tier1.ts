/**
 * tier1 — the Tier 1 wire types and pure helpers behind the changeset view's
 * origin badges / filter and the Tier 1 panel (dr CLI's `GET /api/tier1`).
 *
 * Tier 1 is the decision model `codebase_extract` asks about the cards Tier 0's
 * rules can't decide. The dr CLI records who decided each staged change in
 * the change's `origin`, and serves the opt-in state and this month's spend
 * at `GET /api/tier1`. The viewer only reads both: Tier 1 is enabled and
 * changed with `dr analyzer tier1 ...`, never from here.
 *
 * The wire types are the generated OpenAPI schemas (`docs/api-spec.yaml` →
 * `npm run client:generate`), aliased here so the rest of the viewer imports
 * them from one place: a change to the contract is a spec sync plus whatever
 * this file's helpers need. Both are optional on the wire: changes without
 * `origin` (hand-made, or staged by an older CLI) and servers without
 * `/api/tier1` read as "nothing to show".
 *
 * Stateless and JSX-free.
 */

import type { components } from '../../../core/types/api-client';
import type { ChangeRecord } from './changesets';

// ─── Wire types ───────────────────────────────────────────────────────────────

/** Who decided a staged change (codebase_extract only). */
export type ChangeOrigin = components['schemas']['ChangeOrigin'];
export type ChangeOriginBy = ChangeOrigin['by'];

/** `GET /api/tier1`: Tier 1's state and this month's spend. Never carries a secret. */
export type Tier1Status = components['schemas']['Tier1Status'];
export type Tier1State = Tier1Status['state'];
export type Tier1Month = Tier1Status['month'];
export type Tier1SourceSpend = Tier1Status['bySource'][string];

// ─── Change origin ────────────────────────────────────────────────────────────

/** The filter key for changes without an origin. */
export const NO_ORIGIN = 'none';
/** A filter over who decided a change: every change, one `by`, or those without an origin. */
export type OriginFilter = 'all' | typeof NO_ORIGIN | string;

const ORIGIN_LABEL: Record<ChangeOriginBy, string> = {
  tier0: 'Tier 0',
  tier1: 'Tier 1',
  agent: 'Agent',
};

const ORIGIN_TITLE: Record<ChangeOriginBy, string> = {
  tier0: 'Decided by a Tier 0 rule',
  tier1: 'Decided by the Tier 1 decision model',
  agent: 'Decided by the agent',
};

/** Fixed order of the known deciders in the filter; unknown ones follow by name. */
const ORIGIN_ORDER: string[] = ['tier0', 'tier1', 'agent'];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * The change's origin, or undefined when it has none (or it's malformed). An
 * unknown `by` from a newer CLI is kept: it shows under its own name.
 */
export function originOf(record: ChangeRecord | undefined): ChangeOrigin | undefined {
  const o = record?.origin;
  if (!isRecord(o) || typeof o.by !== 'string' || o.by.length === 0) return undefined;
  return o as ChangeOrigin;
}

/** "Tier 0" / "Tier 1" / "Agent", or the raw `by` for one this viewer doesn't know. */
export function originLabel(by: string): string {
  return ORIGIN_LABEL[by as ChangeOriginBy] ?? by;
}

/** One sentence naming the decider, for the badge's tooltip and the inspector. */
export function originTitle(by: string): string {
  return ORIGIN_TITLE[by as ChangeOriginBy] ?? `Decided by ${by}`;
}

/** A probability as a whole percentage ("92%", "<1%"). */
export function formatProbability(p: number): string {
  if (!Number.isFinite(p)) return '—';
  const pct = p * 100;
  if (pct > 0 && pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

const CONFIRMED_LABEL: Record<string, string> = {
  auto: 'automatically (stage mode)',
  agent: 'by the agent (acceptTier1)',
};

/**
 * The origin's details as label / value rows, in reading order, for the
 * badge's tooltip and the change inspector. Only fields the origin carries.
 */
export function originDetails(origin: ChangeOrigin): { key: string; value: string }[] {
  const rows: { key: string; value: string }[] = [];
  if (origin.rule) rows.push({ key: 'Rule', value: origin.rule });
  if (origin.provider) rows.push({ key: 'Provider', value: origin.provider });
  if (origin.model) rows.push({ key: 'Model', value: origin.model });
  if (origin.upstream) rows.push({ key: 'Upstream', value: origin.upstream });
  if (isRecord(origin.p)) {
    if (typeof origin.p.layer === 'number') rows.push({ key: 'Layer', value: formatProbability(origin.p.layer) });
    rows.push({
      key: 'Type',
      value: typeof origin.p.type === 'number' ? formatProbability(origin.p.type) : 'not asked',
    });
  }
  if (origin.confirmed) {
    rows.push({ key: 'Confirmed', value: CONFIRMED_LABEL[origin.confirmed] ?? origin.confirmed });
  }
  return rows;
}

/** A one-line description of the origin (accessible names, plain-text contexts). */
export function originSummary(origin: ChangeOrigin): string {
  const details = originDetails(origin).map((d) => `${d.key.toLowerCase()} ${d.value}`);
  return [originTitle(origin.by), ...details].join(' · ');
}

/** The filter key a change falls under. */
export function originKey(record: ChangeRecord | undefined): string {
  return originOf(record)?.by ?? NO_ORIGIN;
}

/** Whether a change passes the origin filter. */
export function passesOriginFilter(record: ChangeRecord | undefined, filter: OriginFilter): boolean {
  return filter === 'all' || originKey(record) === filter;
}

/**
 * The origin filter's options with counts, in a stable order (Tier 0, Tier 1,
 * Agent, any other decider, then no origin). Empty when no change carries an
 * origin: the filter has nothing to offer, so the view leaves it out.
 */
export function originFilterOptions(records: (ChangeRecord | undefined)[]): { value: OriginFilter; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    const k = originKey(r);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const deciders = [...counts.keys()].filter((k) => k !== NO_ORIGIN);
  if (deciders.length === 0) return [];
  const rank = (k: string) => {
    const i = ORIGIN_ORDER.indexOf(k);
    return i === -1 ? ORIGIN_ORDER.length : i;
  };
  deciders.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const options: { value: OriginFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: records.length },
    ...deciders.map((k) => ({ value: k, label: originLabel(k), count: counts.get(k)! })),
  ];
  const none = counts.get(NO_ORIGIN);
  if (none) options.push({ value: NO_ORIGIN, label: 'No origin', count: none });
  return options;
}

// ─── Tier 1 status ────────────────────────────────────────────────────────────

const TIER1_STATES: readonly string[] = ['off', 'misconfigured', 'no-credentials', 'on', 'capped'];

/**
 * The body as a Tier1Status, or null when it isn't one (an older server
 * answering something else at that path). Checks what the panel relies on;
 * optional fields stay optional.
 */
export function toTier1Status(raw: unknown): Tier1Status | null {
  if (!isRecord(raw) || typeof raw.state !== 'string' || !TIER1_STATES.includes(raw.state)) return null;
  const m = raw.month;
  if (!isRecord(m) || typeof m.spentUsd !== 'number' || typeof m.capUsd !== 'number') return null;
  return {
    ...(raw as Tier1Status),
    credentials: isRecord(raw.credentials) ? (raw.credentials as Tier1Status['credentials']) : {},
    bySource: isRecord(raw.bySource) ? (raw.bySource as Tier1Status['bySource']) : {},
    warnings: Array.isArray(raw.warnings) ? raw.warnings.filter((w): w is string => typeof w === 'string') : [],
    nearCap: raw.nearCap === true,
  };
}

export const TIER1_STATE_LABEL: Record<Tier1State, string> = {
  on: 'on',
  capped: 'capped',
  off: 'off',
  misconfigured: 'misconfigured',
  'no-credentials': 'no credentials',
};

/** Chip colour per state (Heimdall StatusColor). */
export const TIER1_STATE_COLOR: Record<Tier1State, 'emerald' | 'amber' | 'rose' | 'neutral'> = {
  on: 'emerald',
  capped: 'rose',
  off: 'neutral',
  misconfigured: 'rose',
  'no-credentials': 'amber',
};

/** "$16.42". */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

/** Share of the cap spent, 0–100 (a cap of 0 reads as 0% spent, or 100% once anything is spent). */
export function spendPercent(month: Pick<Tier1Month, 'spentUsd' | 'capUsd'>): number {
  if (month.capUsd <= 0) return month.spentUsd > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, (month.spentUsd / month.capUsd) * 100));
}

/** The spend bar's colour: rose at the cap, amber in the 80% warning, else emerald. */
export function spendColor(status: Pick<Tier1Status, 'state' | 'nearCap' | 'month'>): 'rose' | 'amber' | 'emerald' {
  if (status.state === 'capped' || (status.month.capUsd > 0 && status.month.spentUsd >= status.month.capUsd)) {
    return 'rose';
  }
  return status.nearCap ? 'amber' : 'emerald';
}

/** "Dec 1" (UTC: the window resets at 00:00 UTC on the first of the month). */
export function formatResetDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const SOURCE_ORDER = ['extract', 'index', 'classify', 'probe'];

/** This month's spend per source, the known sources first, each with a label. */
export function sourceBreakdown(
  bySource: Tier1Status['bySource'],
): { source: string; spend: Tier1SourceSpend }[] {
  const rank = (s: string) => {
    const i = SOURCE_ORDER.indexOf(s);
    return i === -1 ? SOURCE_ORDER.length : i;
  };
  return Object.entries(bySource)
    .filter(([, spend]) => isRecord(spend))
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([source, spend]) => ({ source, spend }));
}

/** "6.8 MB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Split text on backticks into plain and code segments, so a CLI command the
 * server quotes (`dr analyzer tier1 ...`) renders as code. An unpaired
 * backtick stays as text.
 */
export function splitCode(text: string): { code: boolean; text: string }[] {
  const parts = text.split('`');
  if (parts.length % 2 === 0) return [{ code: false, text }];
  return parts.map((t, i) => ({ code: i % 2 === 1, text: t })).filter((p) => p.text.length > 0);
}
