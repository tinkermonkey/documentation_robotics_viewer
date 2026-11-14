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
 * Nothing from the wire reaches React unchecked: `originOf` and
 * `toTier1Status` keep only fields of the documented type (a hand-edited
 * changes.yaml or an odd server must not blank the viewer), so every string
 * the UI renders is a string and every number a finite number.
 *
 * Stateless and JSX-free.
 */

import type { components } from '../../../core/types/api-client';
import type { ChangeRecord } from './changesets';

// ─── Wire types ───────────────────────────────────────────────────────────────

type WireOrigin = components['schemas']['ChangeOrigin'];
type WireStatus = components['schemas']['Tier1Status'];

export type KnownDecider = WireOrigin['by'];

/**
 * Who decided a staged change (codebase_extract only). `by` may be a decider
 * this viewer doesn't know yet (a newer CLI): it shows under its own name.
 */
export type ChangeOrigin = Omit<WireOrigin, 'by'> & { by: KnownDecider | (string & {}) };

/**
 * This month's spend. `percentUsed` (0–100 to one decimal, held at 100 past
 * the cap, null for a cap of $0) is optional here so an earlier build of the
 * CLI without it still reads; `percentUsed()` falls back to working it out.
 */
export type Tier1Month = Omit<WireStatus['month'], 'percentUsed'> & { percentUsed?: number | null };

/** `GET /api/tier1`: Tier 1's state and this month's spend. Never carries a secret. */
export type Tier1Status = Omit<WireStatus, 'month'> & { month: Tier1Month };
export type Tier1State = Tier1Status['state'];
export type Tier1SourceSpend = Tier1Status['bySource'][string];
export type Tier1Credential = Tier1Status['credentials'][string];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

// ─── Change origin ────────────────────────────────────────────────────────────

/**
 * Filter keys. Deciders are prefixed (`by:tier1`) so no decider's name can
 * collide with the two fixed keys.
 */
export const ALL_ORIGINS = 'all';
export const NO_ORIGIN = 'none';
export type OriginFilter = typeof ALL_ORIGINS | typeof NO_ORIGIN | `by:${string}`;

export function deciderKey(by: string): OriginFilter {
  return `by:${by}`;
}

const DECIDER_LABEL: Record<KnownDecider, string> = {
  tier0: 'Tier 0',
  tier1: 'Tier 1',
  agent: 'Agent',
};

const DECIDER_TITLE: Record<KnownDecider, string> = {
  tier0: 'Decided by a Tier 0 rule',
  tier1: 'Decided by the Tier 1 decision model',
  agent: 'Decided by the agent',
};

/** Fixed order of the known deciders in the filter; unknown ones follow by name. */
const DECIDER_ORDER: string[] = ['tier0', 'tier1', 'agent'];

export function isKnownDecider(by: string): by is KnownDecider {
  return by === 'tier0' || by === 'tier1' || by === 'agent';
}

/**
 * The change's origin with only well-typed fields, or undefined when it has
 * none (or no string `by`). Strings stay strings, probabilities numbers (a
 * null type probability is kept: the type was not asked); anything else is
 * dropped.
 */
export function originOf(record: ChangeRecord | undefined): ChangeOrigin | undefined {
  const o = record?.origin;
  if (!isRecord(o)) return undefined;
  const by = str(o.by);
  if (!by) return undefined;
  const out: ChangeOrigin = { by };
  const rule = str(o.rule);
  const provider = str(o.provider);
  const model = str(o.model);
  const upstream = str(o.upstream);
  if (rule) out.rule = rule;
  if (provider) out.provider = provider;
  if (model) out.model = model;
  if (upstream) out.upstream = upstream;
  if (o.confirmed === 'auto' || o.confirmed === 'agent') out.confirmed = o.confirmed;
  if (isRecord(o.p)) {
    const layer = num(o.p.layer);
    const type = num(o.p.type);
    if (layer !== undefined) out.p = { layer, type: type ?? null };
  }
  return out;
}

/** "Tier 0" / "Tier 1" / "Agent", or the raw `by` for one this viewer doesn't know. */
export function deciderLabel(by: string): string {
  return isKnownDecider(by) ? DECIDER_LABEL[by] : by;
}

/** One sentence naming the decider, for the badge's tooltip and the inspector. */
export function originTitle(by: string): string {
  return isKnownDecider(by) ? DECIDER_TITLE[by] : `Decided by ${by}`;
}

/** A probability as a whole percentage ("92%", "<1%"), clamped to 0–100%. */
export function formatProbability(p: number): string {
  if (!Number.isFinite(p)) return '—';
  const pct = Math.min(1, Math.max(0, p)) * 100;
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
 * Expects an origin from `originOf`.
 */
export function originDetails(origin: ChangeOrigin): { key: string; value: string }[] {
  const rows: { key: string; value: string }[] = [];
  if (origin.rule) rows.push({ key: 'Rule', value: origin.rule });
  if (origin.provider) rows.push({ key: 'Provider', value: origin.provider });
  if (origin.model) rows.push({ key: 'Model', value: origin.model });
  if (origin.upstream) rows.push({ key: 'Upstream', value: origin.upstream });
  if (origin.p) {
    rows.push({ key: 'Layer', value: formatProbability(origin.p.layer) });
    rows.push({ key: 'Type', value: origin.p.type === null ? 'not asked' : formatProbability(origin.p.type) });
  }
  if (origin.confirmed) {
    rows.push({ key: 'Confirmed', value: CONFIRMED_LABEL[origin.confirmed] ?? origin.confirmed });
  }
  return rows;
}

/** A one-line description of the origin (plain-text contexts). */
export function originSummary(origin: ChangeOrigin): string {
  const details = originDetails(origin).map((d) => `${d.key.toLowerCase()} ${d.value}`);
  return [originTitle(origin.by), ...details].join(' · ');
}

/** The filter key a change falls under. */
export function originKey(record: ChangeRecord | undefined): OriginFilter {
  const by = originOf(record)?.by;
  return by ? deciderKey(by) : NO_ORIGIN;
}

/** Whether a change passes the origin filter. */
export function passesOriginFilter(record: ChangeRecord | undefined, filter: OriginFilter): boolean {
  return filter === ALL_ORIGINS || originKey(record) === filter;
}

/** Longest decider label the filter shows before cutting it short. */
const MAX_FILTER_LABEL = 20;

/**
 * The origin filter's options with counts, in a stable order (Tier 0, Tier 1,
 * Agent, any other decider, then no origin). Empty when no change carries an
 * origin: the filter has nothing to offer, so the view leaves it out.
 */
export function originFilterOptions(
  records: (ChangeRecord | undefined)[],
): { value: OriginFilter; label: string; count: number }[] {
  const counts = new Map<string, number>();
  let none = 0;
  for (const r of records) {
    const by = originOf(r)?.by;
    if (by) counts.set(by, (counts.get(by) ?? 0) + 1);
    else none++;
  }
  if (counts.size === 0) return [];
  const rank = (k: string) => {
    const i = DECIDER_ORDER.indexOf(k);
    return i === -1 ? DECIDER_ORDER.length : i;
  };
  const deciders = [...counts.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const cut = (s: string) => (s.length > MAX_FILTER_LABEL ? `${s.slice(0, MAX_FILTER_LABEL - 1)}…` : s);
  const options: { value: OriginFilter; label: string; count: number }[] = [
    { value: ALL_ORIGINS, label: 'All', count: records.length },
    ...deciders.map((by) => ({ value: deciderKey(by), label: cut(deciderLabel(by)), count: counts.get(by)! })),
  ];
  if (none) options.push({ value: NO_ORIGIN, label: 'No origin', count: none });
  return options;
}

// ─── Tier 1 status ────────────────────────────────────────────────────────────

const TIER1_STATES: readonly string[] = ['off', 'misconfigured', 'no-credentials', 'on', 'capped'];

/**
 * The body as a Tier1Status the panel can render, or null when it isn't one
 * (an older server answering something else at that path).
 *
 * Required: a known `state` and `month.spentUsd` / `month.capUsd` as numbers.
 * Everything else is coerced to its documented type or left out: strings
 * default to '' (or are absent when optional), counts to 0, `remainingUsd` to
 * what the cap leaves; credential entries that aren't `{ set, from }` and
 * per-source entries without numeric cards and cost are dropped; only string
 * warnings are kept.
 */
export function toTier1Status(raw: unknown): Tier1Status | null {
  if (!isRecord(raw) || typeof raw.state !== 'string' || !TIER1_STATES.includes(raw.state)) return null;
  const m = raw.month;
  if (!isRecord(m)) return null;
  const spentUsd = num(m.spentUsd);
  const capUsd = num(m.capUsd);
  if (spentUsd === undefined || capUsd === undefined) return null;

  const month: Tier1Month = {
    spentUsd,
    capUsd,
    remainingUsd: num(m.remainingUsd) ?? Math.max(0, capUsd - spentUsd),
    resetsAt: str(m.resetsAt) ?? '',
    cards: num(m.cards) ?? 0,
  };
  const percent = num(m.percentUsed);
  if (percent !== undefined) month.percentUsed = Math.min(100, Math.max(0, percent));
  else if (m.percentUsed === null) month.percentUsed = null;

  const credentials: Tier1Status['credentials'] = {};
  if (isRecord(raw.credentials)) {
    for (const [name, c] of Object.entries(raw.credentials)) {
      if (!isRecord(c) || typeof c.set !== 'boolean') continue;
      if (c.from !== null && typeof c.from !== 'string') continue;
      credentials[name] = { set: c.set, from: c.from };
    }
  }

  const bySource: Tier1Status['bySource'] = {};
  if (isRecord(raw.bySource)) {
    for (const [source, s] of Object.entries(raw.bySource)) {
      if (!isRecord(s)) continue;
      const cards = num(s.cards);
      const costUsd = num(s.costUsd);
      if (cards === undefined || costUsd === undefined) continue;
      bySource[source] = { cards, costUsd, lastAt: str(s.lastAt) ?? '' };
    }
  }

  const c = isRecord(raw.cache) ? raw.cache : {};
  const out: Tier1Status = {
    state: raw.state as Tier1State,
    analyzer: str(raw.analyzer) ?? '',
    config: str(raw.config) ?? '',
    credentials,
    month,
    nearCap: raw.nearCap === true,
    bySource,
    cache: {
      entries: num(c.entries) ?? 0,
      bytes: num(c.bytes) ?? 0,
      files: num(c.files) ?? 0,
      lastCompaction: str(c.lastCompaction) ?? null,
    },
    dotDrIgnored: typeof raw.dotDrIgnored === 'boolean' ? raw.dotDrIgnored : null,
    warnings: Array.isArray(raw.warnings) ? raw.warnings.filter((w): w is string => typeof w === 'string' && w.length > 0) : [],
    summary: str(raw.summary) ?? '',
    note: str(raw.note) ?? '',
  };
  const reason = str(raw.reason);
  const provider = str(raw.provider);
  const model = str(raw.model);
  const modelId = str(raw.modelId);
  const monthlyCapUsd = num(raw.monthlyCapUsd);
  const concurrency = num(raw.concurrency);
  if (reason) out.reason = reason;
  if (provider) out.provider = provider;
  if (model) out.model = model;
  if (modelId) out.modelId = modelId;
  if (monthlyCapUsd !== undefined) out.monthlyCapUsd = monthlyCapUsd;
  if (concurrency !== undefined) out.concurrency = concurrency;
  return out;
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

const USD = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "$16.42", "$1,234.50"; spend under a cent reads "<$0.01" rather than "$0.00". */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n > 0 && n < 0.01) return '<$0.01';
  return `$${USD.format(n)}`;
}

/** "11,730". */
export function formatCount(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—';
}

/** A cap of $0: Tier 1 asks nothing by choice (only cached answers are used). */
export function isZeroCap(month: Pick<Tier1Month, 'capUsd'>): boolean {
  return month.capUsd === 0;
}

/**
 * Share of the cap spent, 0–100: the server's `percentUsed` when it sends a
 * number, else worked out and rounded down as the CLI does (held at 100 past
 * the cap). 0 for a cap of $0.
 */
export function percentUsed(month: Pick<Tier1Month, 'spentUsd' | 'capUsd' | 'percentUsed'>): number {
  if (typeof month.percentUsed === 'number' && Number.isFinite(month.percentUsed)) {
    return Math.min(100, Math.max(0, month.percentUsed));
  }
  if (month.capUsd <= 0) return 0;
  return Math.min(100, Math.max(0, Math.floor((100 * month.spentUsd) / month.capUsd)));
}

/** "82.1%", "100%". */
export function formatPercent(p: number): string {
  return `${Number.isInteger(p) ? p : p.toFixed(1)}%`;
}

/** The spend bar's colour: rose at the cap, amber in the 80% warning, else emerald. */
export function spendColor(status: Pick<Tier1Status, 'state' | 'nearCap' | 'month'>): 'rose' | 'amber' | 'emerald' {
  if (isZeroCap(status.month)) return 'emerald';
  if (status.state === 'capped' || status.month.spentUsd >= status.month.capUsd) return 'rose';
  return status.nearCap ? 'amber' : 'emerald';
}

/** The server's 80% warning, as the CLI words it, out of `summary`; null when it isn't there. */
export function nearCapWarningText(summary: string): string | null {
  const at = summary.indexOf('Tier 1 has used ');
  return at === -1 ? null : summary.slice(at).trim();
}

/** "Dec 1" (UTC: the window resets at 00:00 UTC on the first of the month). */
export function formatResetDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const SOURCE_ORDER = ['extract', 'index', 'classify', 'probe'];

/** This month's spend per source, the known sources first. */
export function sourceBreakdown(
  bySource: Tier1Status['bySource'],
): { source: string; spend: Tier1SourceSpend }[] {
  const rank = (s: string) => {
    const i = SOURCE_ORDER.indexOf(s);
    return i === -1 ? SOURCE_ORDER.length : i;
  };
  return Object.entries(bySource)
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
 * backtick stays as text; anything but a string yields no segments.
 */
export function splitCode(text: unknown): { code: boolean; text: string }[] {
  if (typeof text !== 'string' || text.length === 0) return [];
  const parts = text.split('`');
  if (parts.length % 2 === 0) return [{ code: false, text }];
  return parts.map((t, i) => ({ code: i % 2 === 1, text: t })).filter((p) => p.text.length > 0);
}
