/**
 * planVerification — a plan changeset compared with what was built, as the dr
 * CLI's `GET /api/changesets/:id/verification?against=<as-built id>` reports
 * it (the `changeset_verify` MCP tool's report, over REST). Pure, no React.
 *
 * The viewer never matches plan and build itself: the CLI's matcher already
 * handles names that differ between a plan and extraction, and two matchers
 * would disagree. This module only reads its report:
 *
 *  - `toPlanVerification` validates the wire payload before it reaches React
 *    (as `tier1.ts` does): a malformed item is dropped and counted in
 *    `dropped`, never allowed to blank the view; a payload without the report's
 *    core fields is `null`.
 *  - Each planned element gets a verdict: `built` (matched exactly),
 *    `probable` (matched probably), `divergent` (matched, fields differ),
 *    `missing` (planned, not found; a planned delete not done reads as missing
 *    too) or `unverifiable` (extraction can't see that kind of element). Each
 *    as-built element the plan doesn't name is `unplanned`. Relationships the
 *    same, by their ends' element ids and predicate.
 *  - `asBuiltChoices` pairs a plan with its verification records (the ones that
 *    say they `verify` it) and offers every other as-built changeset by hand.
 *
 * The route is newer than this viewer's generated API client (dr CLI with
 * documentation_robotics' verification route), so the wire type is declared
 * here, from the CLI's `ChangesetVerificationSchema`.
 */

import type { ChangesetPurpose } from './changesetPurpose';

/** A verdict on one planned (or unplanned) element or relationship. */
export type PlanVerdict = 'missing' | 'divergent' | 'probable' | 'unverifiable' | 'built' | 'unplanned';

/** Worst first: a box holding several elements shows the first of these that any of them has. */
export const PLAN_VERDICTS: readonly PlanVerdict[] = ['missing', 'divergent', 'probable', 'unverifiable', 'built', 'unplanned'];

/** The report's overall verdict, as the CLI names it. */
export type VerificationVerdict = 'match' | 'probable-match' | 'diverges' | 'incomplete' | 'unverifiable' | 'empty-plan';

const OVERALL: readonly VerificationVerdict[] = ['match', 'probable-match', 'diverges', 'incomplete', 'unverifiable', 'empty-plan'];

export interface VerdictItem {
  /** The element id (dotted) the verdict is about: the planned id, or the as-built id for an unplanned one. */
  id: string;
  /** The as-built element it matched, when that differs from `id`. */
  builtId?: string;
  verdict: PlanVerdict;
  /** The planned op (`add`, `update`, `delete`); absent for an unplanned element. */
  op?: string;
  /** Its name, when the report gives one. */
  name?: string;
  /** Why (missing, unverifiable, probable), from the report. */
  reason?: string;
  /** The fields that differ (divergent). */
  fields?: string[];
  /** An unplanned element: what the build did to it (`added`, `updated`, `deleted`, `present`). */
  change?: string;
}

export interface RelationshipVerdictItem {
  source: string;
  predicate: string;
  target: string;
  /** The as-built relationship it matched, when its ends differ. */
  built?: { source: string; predicate: string; target: string };
  verdict: PlanVerdict;
  reason?: string;
}

export interface PlanVerification {
  plan: { id: string; name: string };
  asBuilt: { id: string; name: string };
  verdict: VerificationVerdict;
  verdictText: string;
  elements: VerdictItem[];
  relationships: RelationshipVerdictItem[];
  /** Set when the comparison says little about the code. */
  warning?: string;
  notes: string[];
  /** Items left out because they were malformed. */
  dropped: number;
}

// ─── Validation ──────────────────────────────────────────────────────────────

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function named(v: unknown): { id: string; name: string } | null {
  if (!isObject(v)) return null;
  const id = str(v.id);
  return id ? { id, name: str(v.name) ?? id } : null;
}

function triple(v: unknown): { source: string; predicate: string; target: string } | null {
  if (!isObject(v)) return null;
  const source = str(v.source);
  const predicate = str(v.predicate);
  const target = str(v.target);
  return source && predicate && target ? { source, predicate, target } : null;
}

const sameTriple = (a: { source: string; predicate: string; target: string }, b: typeof a) =>
  a.source === b.source && a.predicate === b.predicate && a.target === b.target;

/** The CLI's report as a `PlanVerification`, or null when it isn't one. */
export function toPlanVerification(raw: unknown): PlanVerification | null {
  if (!isObject(raw)) return null;
  const plan = named(raw.plannedChangeset);
  const asBuilt = named(raw.asBuiltChangeset);
  const verdict = OVERALL.find((v) => v === raw.verdict);
  if (!plan || !asBuilt || !verdict || !isObject(raw.elements) || !isObject(raw.relationships)) return null;

  let dropped = 0;
  const elements: VerdictItem[] = [];
  const el = raw.elements;
  const addPlanned = (items: unknown, verdictOf: (item: Raw) => PlanVerdict) => {
    for (const item of list(items)) {
      const id = isObject(item) ? str(item.planned) : undefined;
      if (!isObject(item) || !id) {
        dropped++;
        continue;
      }
      const built = str(item.built);
      const fields = list(item.fields)
        .map((f) => (isObject(f) ? str(f.field) : undefined))
        .filter((f): f is string => !!f);
      elements.push({
        id,
        ...(built && built !== id ? { builtId: built } : {}),
        verdict: verdictOf(item),
        ...(str(item.op) ? { op: str(item.op) } : {}),
        ...(str(item.name) ? { name: str(item.name) } : {}),
        ...(str(item.reason) ? { reason: str(item.reason) } : {}),
        ...(fields.length > 0 ? { fields } : {}),
      });
    }
  };
  addPlanned(el.matched, (item) => (item.match === 'probable' ? 'probable' : 'built'));
  addPlanned(el.divergent, () => 'divergent');
  addPlanned(el.missing, () => 'missing');
  addPlanned(el.unverifiable, () => 'unverifiable');
  addPlanned(el.deletionsNotDone, () => 'missing');
  for (const item of list(el.unplanned)) {
    const id = isObject(item) ? str(item.id) : undefined;
    if (!isObject(item) || !id) {
      dropped++;
      continue;
    }
    elements.push({
      id,
      verdict: 'unplanned',
      ...(str(item.name) ? { name: str(item.name) } : {}),
      ...(str(item.change) ? { change: str(item.change) } : {}),
    });
  }

  const relationships: RelationshipVerdictItem[] = [];
  const rel = raw.relationships;
  const addPlannedRel = (items: unknown, verdictOf: (item: Raw) => PlanVerdict) => {
    for (const item of list(items)) {
      const planned = isObject(item) ? triple(item.planned) : null;
      if (!isObject(item) || !planned) {
        dropped++;
        continue;
      }
      const built = triple(item.built);
      relationships.push({
        ...planned,
        ...(built && !sameTriple(built, planned) ? { built } : {}),
        verdict: verdictOf(item),
        ...(str(item.reason) ? { reason: str(item.reason) } : {}),
      });
    }
  };
  addPlannedRel(rel.matched, (item) => (item.match === 'probable' ? 'probable' : 'built'));
  addPlannedRel(rel.divergent, () => 'divergent');
  addPlannedRel(rel.missing, () => 'missing');
  addPlannedRel(rel.unverifiable, () => 'unverifiable');
  addPlannedRel(rel.deletionsNotDone, () => 'missing');
  for (const item of list(rel.unplanned)) {
    const t = triple(item);
    if (!t) {
      dropped++;
      continue;
    }
    relationships.push({ ...t, verdict: 'unplanned' });
  }

  return {
    plan,
    asBuilt,
    verdict,
    verdictText: str(raw.verdictText) ?? '',
    elements,
    relationships,
    ...(str(raw.warning) ? { warning: str(raw.warning) } : {}),
    notes: list(raw.notes).filter((n): n is string => typeof n === 'string'),
    dropped,
  };
}

/** Elements and relationships per verdict. */
export function verdictCounts(verification: PlanVerification): {
  elements: Record<PlanVerdict, number>;
  relationships: Record<PlanVerdict, number>;
} {
  const zero = (): Record<PlanVerdict, number> => ({ missing: 0, divergent: 0, probable: 0, unverifiable: 0, built: 0, unplanned: 0 });
  const elements = zero();
  const relationships = zero();
  for (const item of verification.elements) elements[item.verdict]++;
  for (const item of verification.relationships) relationships[item.verdict]++;
  return { elements, relationships };
}

// ─── Pairing ─────────────────────────────────────────────────────────────────

export interface PairableChangeset {
  id: string;
  name: string;
  status: string;
  purpose?: ChangesetPurpose;
  verifies?: string;
}

/** Purposes a changeset of what was built can have. */
const AS_BUILT_PURPOSES: ReadonlySet<ChangesetPurpose | undefined> = new Set<ChangesetPurpose | undefined>([
  'verification',
  'reconcile',
  'bootstrap',
]);

/**
 * The as-built changesets a plan can be compared with: its own verification
 * records first, then any other verification, reconcile or bootstrap
 * changeset (staged before applied), never the plan itself or a discarded one.
 */
export function asBuiltChoices<T extends PairableChangeset>(
  planId: string,
  changesets: readonly T[],
): { records: T[]; others: T[] } {
  const usable = changesets.filter((c) => c.id !== planId && c.status !== 'discarded');
  const stagedFirst = (a: T, b: T) => Number(a.status !== 'staged') - Number(b.status !== 'staged') || a.name.localeCompare(b.name);
  const records = usable.filter((c) => c.purpose === 'verification' && c.verifies === planId).sort(stagedFirst);
  const recordIds = new Set(records.map((c) => c.id));
  const others = usable.filter((c) => !recordIds.has(c.id) && AS_BUILT_PURPOSES.has(c.purpose)).sort(stagedFirst);
  return { records, others };
}

/** The as-built changeset to open a plan against when none is named: its first verification record. */
export function defaultAsBuilt<T extends PairableChangeset>(planId: string, changesets: readonly T[]): T | null {
  return asBuiltChoices(planId, changesets).records[0] ?? null;
}

// ─── Fetching ────────────────────────────────────────────────────────────────

/** The React Query key prefix of every comparison (refetched on `changesets.updated` and `model.updated`). */
export const PLAN_VERIFICATION_KEY = 'changeset-verification';

/** A failed request to the verification route, with its HTTP status. */
export class VerificationRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'VerificationRequestError';
  }
}

/** The server has no verification route: an older dr CLI (or something else answering). */
export function isVerificationUnavailable(error: unknown): boolean {
  if (error instanceof VerificationRequestError) return error.status === 405 || error.status === 501 || error.status === 0;
  return false;
}

export function verificationUrl(planId: string, asBuiltId: string): string {
  return `/api/changesets/${encodeURIComponent(planId)}/verification?against=${encodeURIComponent(asBuiltId)}`;
}

/**
 * Fetches and validates the comparison. A 404 whose body is the server's JSON
 * `{ error }` means a changeset is gone; any other 404 (no JSON: the route
 * itself is missing) reads as an older dr CLI, status 0.
 */
export async function fetchPlanVerification(
  planId: string,
  asBuiltId: string,
  fetcher: typeof fetch = fetch,
): Promise<PlanVerification> {
  const response = await fetcher(verificationUrl(planId, asBuiltId), { headers: { Accept: 'application/json' } });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const message = isObject(body) ? str(body.error) : undefined;
    if (response.status === 404 && !message) throw new VerificationRequestError(0, 'This dr CLI cannot compare a plan with what was built.');
    throw new VerificationRequestError(response.status, message ?? `The comparison failed (${response.status}).`);
  }
  const verification = toPlanVerification(body);
  if (!verification) throw new VerificationRequestError(0, 'This dr CLI cannot compare a plan with what was built.');
  return verification;
}
