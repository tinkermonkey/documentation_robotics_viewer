/**
 * changesetPurpose — what a changeset is for and what may be done with it,
 * as the dr CLI reports them (`GET /api/changesets` and `/api/changesets/:id`).
 *
 * Every changeset declares a purpose when it is made (the CLI infers one for
 * an older changeset), and the server lists the moves its purpose and status
 * allow now as `actions`:
 *
 * - `plan` (changeset_create) lands with the code; `chat` (DrBot) lands after
 *   review. Both offer commit and discard while staged.
 * - `bootstrap` / `reconcile` (codebase_extract, no plan active) land the model
 *   as built and reconcile it with the code.
 * - `verification` (codebase_extract with `since` while a plan was active) is
 *   the record of what was built, compared with the plan it `verifies`. It is
 *   never landed: kept as a record (it stays staged and is committed to git
 *   with the plan) or discarded. Its actions are `['discard']`.
 * - `upgrade-record` (`dr upgrade` / project_upgrade) records the relationships
 *   a spec migration dropped because the new catalog has no replacement for
 *   their types, each as a staged relationship delete. It is never landed:
 *   reviewed, restored from by hand (in a plan) and discarded. Its actions are
 *   `['discard']`.
 *
 * The viewer renders these rather than working them out: Apply and Discard
 * come from `actions`, never from names (`-as-built`) or descriptions. An
 * older dr CLI sends neither field, so `canDo` falls back to today's rule (a
 * staged changeset offers both) and an unknown purpose reads as none.
 *
 * Nothing from the wire reaches React unchecked (as in `tier1.ts`): unknown
 * purposes and actions are ignored, never rendered or trusted.
 *
 * Stateless and JSX-free.
 */

import type { paths } from '../../../core/types/api-client';

// ─── Wire types ───────────────────────────────────────────────────────────────

type WireDetail =
  paths['/api/projects/:project/checkouts/:checkout/changesets/:changesetId']['get']['responses'][200]['content']['application/json'];

/** What a changeset is for (the generated OpenAPI enum). */
export type ChangesetPurpose = WireDetail['purpose'];
/** A move the server allows from the changeset's state. */
export type ChangesetMove = WireDetail['actions'][number];
/** What a verification record's extraction read: changes since `since`, at `codeCommit`. */
export type ChangesetScope = NonNullable<WireDetail['scope']>;

export const CHANGESET_PURPOSES: readonly ChangesetPurpose[] = [
  'plan',
  'chat',
  'bootstrap',
  'reconcile',
  'verification',
  'upgrade-record',
];
const MOVES: readonly ChangesetMove[] = ['commit', 'discard'];

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/** A known purpose, else undefined (absent on an older dr CLI, or one this viewer doesn't know). */
export function toPurpose(v: unknown): ChangesetPurpose | undefined {
  return typeof v === 'string' && (CHANGESET_PURPOSES as readonly string[]).includes(v)
    ? (v as ChangesetPurpose)
    : undefined;
}

/**
 * The known moves in `actions`, unknown ones dropped. Undefined when the
 * server sends no array (an older dr CLI): `canDo` then falls back to status.
 */
export function toActions(v: unknown): ChangesetMove[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return MOVES.filter((m) => v.includes(m));
}

/** A verification record's scope, when it carries a usable one. */
export function toScope(v: unknown): ChangesetScope | undefined {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return undefined;
  const { since, codeCommit } = v as { since?: unknown; codeCommit?: unknown };
  const s = str(since);
  if (!s) return undefined;
  const commit = str(codeCommit);
  return commit ? { since: s, codeCommit: commit } : { since: s };
}

/** The plan a verification record verifies (an id), when it names one. */
export function toVerifies(v: unknown): string | undefined {
  return str(v);
}

/** The purpose fields of a list entry or a detail, read safely. */
export function purposeFields(raw: { purpose?: unknown; actions?: unknown; verifies?: unknown }): {
  purpose?: ChangesetPurpose;
  actions?: ChangesetMove[];
  verifies?: string;
} {
  const purpose = toPurpose(raw.purpose);
  const actions = toActions(raw.actions);
  const verifies = toVerifies(raw.verifies);
  return {
    ...(purpose ? { purpose } : {}),
    ...(actions ? { actions } : {}),
    ...(verifies ? { verifies } : {}),
  };
}

// ─── Moves ────────────────────────────────────────────────────────────────────

/**
 * Whether the viewer offers this move: as the server's `actions` say, else
 * (an older dr CLI without them) on any staged changeset, as before.
 */
export function canDo(cs: { status: string; actions?: readonly ChangesetMove[] }, move: ChangesetMove): boolean {
  return cs.actions ? cs.actions.includes(move) : cs.status === 'staged';
}

// ─── Labels and copy ──────────────────────────────────────────────────────────

export const PURPOSE_LABEL: Record<ChangesetPurpose, string> = {
  plan: 'plan',
  chat: 'DrBot chat',
  bootstrap: 'bootstrap',
  reconcile: 'reconcile',
  verification: 'verification record',
  'upgrade-record': 'upgrade record',
};

/** "plan" etc.; undefined when the server sent none (an older dr CLI). */
export function purposeLabel(purpose: ChangesetPurpose | undefined): string | undefined {
  return purpose ? PURPOSE_LABEL[purpose] : undefined;
}

/**
 * What this kind of changeset is for and what happens next, for the
 * changeset's header. `planName` names the plan a verification record
 * verifies (its name, or its id when the plan isn't listed).
 */
export function purposeLifecycle(purpose: ChangesetPurpose | undefined, planName?: string): string | undefined {
  switch (purpose) {
    case 'plan':
      return 'A plan: it lands with the code. Decide each change, then apply what you kept.';
    case 'chat':
      return "DrBot's changes from chat. Decide each change, then apply what you kept.";
    case 'bootstrap':
      return 'Extracted from the whole codebase. Applying it lands the model as built, reconciled with the code.';
    case 'reconcile':
      return 'Extracted from changed code with no plan active. Applying it reconciles the model with the code.';
    case 'verification':
      return `Record of what was built, compared with ${planName ? `plan "${planName}"` : 'its plan'}. It isn't applied: keep it as a record (it stays staged and is committed to git with the plan), or discard it.`;
    case 'upgrade-record':
      return "What a spec upgrade dropped: relationships whose types the new catalog retired, with no replacement. It isn't applied: review it, restore what you still need by hand in a plan, then discard it.";
    default:
      return undefined;
  }
}

/** "changes since origin/main, at abc1234" for a verification record's scope. */
export function scopeLabel(scope: ChangesetScope | undefined): string | undefined {
  if (!scope) return undefined;
  return `changes since ${scope.since}${scope.codeCommit ? `, at ${scope.codeCommit.slice(0, 7)}` : ''}`;
}

// ─── Inbox ────────────────────────────────────────────────────────────────────

export interface PurposedChangeset {
  id: string;
  name: string;
  status: string;
  purpose?: ChangesetPurpose;
  verifies?: string;
}

export interface InboxGroups<T extends PurposedChangeset> {
  /** Staged plans and DrBot's changes (or a changeset whose purpose isn't known): yours to review. */
  review: T[];
  /** Staged bootstrap / reconcile changesets: extracted from the code, to land as built. */
  land: T[];
  /** Staged verification records, each with the plan it verifies when that is listed. */
  records: { record: T; plan?: T }[];
  /** Staged upgrade records: what a spec upgrade dropped, to review and discard. */
  upgrades: T[];
  /** Applied (and, from an older dr CLI, discarded) changesets. */
  history: T[];
}

/**
 * Sorts changesets by what each needs from the person, in list order. A
 * discard deletes a changeset on a current dr CLI, so the history holds only
 * what landed there; an older one also lists discarded ones.
 */
export function inboxGroups<T extends PurposedChangeset>(list: readonly T[]): InboxGroups<T> {
  const out: InboxGroups<T> = { review: [], land: [], records: [], upgrades: [], history: [] };
  const byId = new Map(list.map((c) => [c.id, c]));
  for (const cs of list) {
    if (cs.status !== 'staged') out.history.push(cs);
    else if (cs.purpose === 'verification') {
      const plan = cs.verifies ? byId.get(cs.verifies) : undefined;
      out.records.push(plan ? { record: cs, plan } : { record: cs });
    } else if (cs.purpose === 'upgrade-record') out.upgrades.push(cs);
    else if (cs.purpose === 'bootstrap' || cs.purpose === 'reconcile') out.land.push(cs);
    else out.review.push(cs);
  }
  return out;
}

/** The verification records listed for a plan. */
export function recordsOf<T extends PurposedChangeset>(planId: string, list: readonly T[]): T[] {
  return list.filter((c) => c.purpose === 'verification' && c.verifies === planId);
}
