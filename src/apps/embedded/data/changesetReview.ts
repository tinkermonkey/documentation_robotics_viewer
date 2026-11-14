/**
 * changesetReview — the pure model behind reviewing a staged changeset one
 * change at a time (Keep / Drop / Ask DrBot) instead of one Apply for the lot.
 *
 * Input: the `/api/changesets/:id` detail's `changes`, `unstaged` tombstones,
 * `revision` and `review` (see coord CONTRACT §1), or a viewer-local review
 * when the dr CLI predates review (no `review` in the detail).
 *
 * Output (`buildReviewModel`):
 *   - `items`: one view-model per change still to decide, with its review
 *     weight (routine field edits, new elements, new links, blocked deletes,
 *     removals), a one-line summary naming the changed field, and chips;
 *   - `pairs`: add-then-delete pairs within the changeset ("cancel out"), which
 *     need no decision and land nothing;
 *   - effective decisions (a decision on a change revised after it was made no
 *     longer counts), the tally, and the cascade of drops (a dropped add takes
 *     the links and updates that need its element with it, as the server does);
 *   - `diff`: what changed since the reviewer's last review (revised / new /
 *     withdrawn / carried over);
 *   - `apply`: what Apply lands, what it leaves out, and the commit body.
 *
 * Stateless and JSX-free; `useChangesetReview` wires it to the API.
 */

import { layerLabel } from '../ui/domain';
import { normalizeOp, type ChangeRecord, type DeleteBlocker } from './changesets';

// ─── Wire types (CONTRACT §1) ─────────────────────────────────────────────────

export type Verdict = 'keep' | 'drop' | 'ask';

export interface ReviewDecision {
  verdict: Verdict;
  note?: string;
  /** The changeset revision the decision was made at (server-stamped). */
  atRevision?: number;
  decidedAt?: string;
}

export interface ChangesetReview {
  /** Keyed by sequence number, as a string. */
  decisions: Record<string, ReviewDecision>;
  lastReviewedRevision?: number;
}

/** A tombstone: a change unstaged (withdrawn) or rewritten in place (revised). */
export interface UnstagedChange {
  sequence: number;
  removedAt: number;
  rewritten?: boolean;
  change?: ChangeRecord;
}

export type OriginKind = 'chat' | 'plan' | 'extract' | 'cli';
export interface ChangesetOrigin {
  kind: OriginKind;
  detail?: string;
}

/** One entry of `PUT /api/changesets/:id/review`'s `decisions`. */
export interface DecisionInput {
  sequence: number;
  verdict: Verdict | null;
  note?: string;
}

/** `POST /api/changesets/:id/commit`'s optional body. */
export interface CommitBody {
  drop: number[];
  deleteBlockedLinks: number[];
}

// ─── Items ────────────────────────────────────────────────────────────────────

export type ChangeKind = 'add' | 'update' | 'delete' | 'link-add' | 'link-delete';

/** How much attention a change needs, which decides its group. */
export type ReviewWeight = 'blocked' | 'routine' | 'add' | 'link' | 'removal';

export interface ReviewLink {
  source: string;
  target: string;
  predicate: string;
}

export interface ReviewItem {
  seq: number;
  kind: ChangeKind;
  weight: ReviewWeight;
  /** Dotted element id, or `source::predicate::target` for a relationship. */
  elementId: string;
  layerId: string;
  /** Element name; for a relationship, its source's name. */
  name: string;
  /** "application · service", or "depends-on → Target" for a relationship. */
  typeLabel: string;
  /** Updates: the changed field paths (metadata left out). */
  fields: string[];
  /** The one-line change summary (after the field, for updates). */
  summary: string;
  chips: string[];
  /** Delete changes with relationships still using the element. */
  blockers: DeleteBlocker[];
  /** Relationship changes: the endpoints. */
  link?: ReviewLink;
  /** Updates: whether "Keep N routine" may decide it (its name and type stay). */
  bulkEligible: boolean;
  record: ChangeRecord;
}

/**
 * An add and a later delete of the same element or link, the delete with no
 * blockers: nothing lands, so neither needs a decision.
 */
export interface CancelPair {
  addSeq: number;
  deleteSeq: number;
  elementId: string;
  label: string;
}

/** Fields that change on every write and say nothing about the change. */
const VOLATILE_FIELDS = new Set(['metadata', 'id', 'path']);

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/** "relationships-yaml-parser" → "Relationships Yaml Parser" (when the model doesn't know the id). */
export function nameFromId(id: string): string {
  const slug = id.split('.').pop() ?? id;
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export type NameOf = (dottedId: string) => string | undefined;

export function changeKind(record: ChangeRecord): ChangeKind {
  const isRel = (record.type ?? '').includes('relationship');
  const op = normalizeOp(record.type);
  if (isRel) return op === 'delete' ? 'link-delete' : 'link-add';
  return op;
}

function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined';
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`)
    .join(',')}}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * The field paths an update changes: top-level keys, one level deeper inside
 * `attributes` (so "attributes.serviceType", not "attributes"). Metadata, id
 * and path are left out.
 */
export function changedPaths(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string[] {
  if (!before || !after) return [];
  const out: string[] = [];
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  for (const key of keys) {
    if (VOLATILE_FIELDS.has(key)) continue;
    const b = before[key];
    const a = after[key];
    if (stable(b) === stable(a)) continue;
    if (key === 'attributes' && (isPlainObject(b) || isPlainObject(a))) {
      const bo = isPlainObject(b) ? b : {};
      const ao = isPlainObject(a) ? a : {};
      for (const sub of [...new Set([...Object.keys(bo), ...Object.keys(ao)])]) {
        if (stable(bo[sub]) !== stable(ao[sub])) out.push(`${key}.${sub}`);
      }
    } else {
      out.push(key);
    }
  }
  return out;
}

/** The value at a dotted field path ("attributes.x"). */
export function valueAt(obj: Record<string, unknown> | null | undefined, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (!isPlainObject(cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

function short(value: unknown, max = 40): string {
  const text = typeof value === 'string' ? `"${value}"` : (JSON.stringify(value) ?? '—');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function updateSummary(record: ChangeRecord, fields: string[]): string {
  if (fields.length === 0) return 'no field changes';
  const [first] = fields;
  const before = valueAt(record.before, first);
  const after = valueAt(record.after, first);
  const more = fields.length > 1 ? ` · +${fields.length - 1} more` : '';
  const isText = typeof before === 'string' && typeof after === 'string';
  if (isText && (before.length > 40 || after.length > 40)) return `rewritten${more}`;
  if (before === undefined) return `set to ${short(after)}${more}`;
  if (after === undefined) return `removed${more}`;
  return `${short(before)} → ${short(after)}${more}`;
}

/** Same value apart from its JSON type ("0" → 0). */
function typeOnly(record: ChangeRecord, fields: string[]): boolean {
  return (
    fields.length > 0 &&
    fields.every((f) => {
      const b = valueAt(record.before, f);
      const a = valueAt(record.after, f);
      return b !== undefined && a !== undefined && typeof b !== typeof a && String(b) === String(a);
    })
  );
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function linkOf(record: ChangeRecord): ReviewLink | undefined {
  const obj = record.after ?? record.before;
  if (obj) {
    const source = asString(obj.source);
    const target = asString(obj.target);
    const predicate = asString(obj.predicate) ?? asString(obj.type);
    if (source && target && predicate) return { source, target, predicate };
  }
  const parts = (record.elementId ?? '').split('::');
  if (parts.length === 3) return { source: parts[0], predicate: parts[1], target: parts[2] };
  return undefined;
}

/**
 * The add-then-delete pairs in a changeset (the definition the dr CLI's review
 * counts share): an `add` (or `relationship-add`) and a later `delete` (or
 * `relationship-delete`) of the same elementId, both staged, where the delete
 * has no blockers. A delete WITH blockers is never folded: the server checks
 * every staged delete's blockers at a reviewed commit, so it must stay a
 * change the reviewer can see and resolve. Updates in between are ordinary
 * changes (they count, and are decided like any other).
 */
export function cancelPairs(changes: ChangeRecord[], nameOf: NameOf = () => undefined): CancelPair[] {
  const sorted = [...changes].sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0));
  const openAdds = new Map<string, number>();
  const pairs: CancelPair[] = [];
  for (const c of sorted) {
    const id = c.elementId;
    const seq = c.sequenceNumber;
    if (!id || seq === undefined) continue;
    const kind = changeKind(c);
    if (kind === 'add' || kind === 'link-add') {
      openAdds.set(id, seq);
    } else if (kind === 'delete' || kind === 'link-delete') {
      const addSeq = openAdds.get(id);
      if (addSeq === undefined) continue;
      openAdds.delete(id);
      if (Array.isArray(c.blockers) && c.blockers.length > 0) continue;
      const link = kind === 'link-delete' ? linkOf(c) : undefined;
      const label = link
        ? `${nameOf(link.source) ?? nameFromId(link.source)} ${link.predicate} ${nameOf(link.target) ?? nameFromId(link.target)}`
        : (nameOf(id) ?? asString(c.before?.name) ?? nameFromId(id));
      pairs.push({ addSeq, deleteSeq: seq, elementId: id, label });
    }
  }
  return pairs;
}

/**
 * The changeset's add / modify / delete totals with cancel-out pairs taken
 * out, so they agree with the review's own counts. The dr CLI's `stats` count
 * both halves of a pair (one add-kind, one delete-kind), which then read as
 * an addition and a deletion that never land.
 */
export function netStats(
  stats: { additions: number; modifications: number; deletions: number },
  changes: ChangeRecord[],
): { additions: number; modifications: number; deletions: number } {
  const n = cancelPairs(changes).length;
  return {
    additions: Math.max(0, stats.additions - n),
    modifications: stats.modifications,
    deletions: Math.max(0, stats.deletions - n),
  };
}

/** The sequence numbers cancel-out pairs fold away. */
export function pairMembers(pairs: CancelPair[]): Set<number> {
  return new Set(pairs.flatMap((p) => [p.addSeq, p.deleteSeq]));
}

/**
 * Review items for the changes still to decide (cancel-out pairs left out), in
 * sequence order. `nameOf` resolves a dotted id to an element name (the model,
 * plus the changeset's own adds).
 */
export function toReviewItems(
  changes: ChangeRecord[],
  pairs: CancelPair[],
  nameOf: NameOf = () => undefined,
): ReviewItem[] {
  const cancelled = pairMembers(pairs);
  const addedIds = new Set(
    changes.filter((c) => changeKind(c) === 'add' && c.elementId).map((c) => c.elementId as string),
  );
  const linkCount = new Map<string, number>();
  for (const c of changes) {
    if (changeKind(c) !== 'link-add' || cancelled.has(c.sequenceNumber ?? -1)) continue;
    const l = linkOf(c);
    if (!l) continue;
    for (const end of [l.source, l.target]) linkCount.set(end, (linkCount.get(end) ?? 0) + 1);
  }
  const nameFor = (id: string) => nameOf(id) ?? nameFromId(id);

  return changes
    .filter((c) => c.sequenceNumber !== undefined && !cancelled.has(c.sequenceNumber))
    .sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))
    .map((record) => {
      const seq = record.sequenceNumber as number;
      const kind = changeKind(record);
      const elementId = record.elementId ?? '(unknown)';
      const obj = record.after ?? record.before ?? {};
      const layerId = record.layerName ?? asString(obj.layer_id) ?? elementId.split('.')[0];
      const type = asString(obj.type) ?? elementId.split('.')[1] ?? 'element';
      const blockers = kind === 'delete' && Array.isArray(record.blockers) ? record.blockers : [];
      const chips: string[] = [];

      if (kind === 'link-add' || kind === 'link-delete') {
        const link = linkOf(record) ?? { source: elementId, target: '', predicate: '' };
        const srcNew = addedIds.has(link.source);
        const tgtNew = addedIds.has(link.target);
        if (kind === 'link-add') {
          if (srcNew && tgtNew) chips.push('both ends new');
          else if (srcNew) chips.push('new source');
          else if (tgtNew) chips.push('new target');
        }
        return {
          seq,
          kind,
          weight: kind === 'link-add' ? 'link' : 'removal',
          elementId,
          layerId,
          name: nameFor(link.source),
          typeLabel: `${link.predicate} → ${nameFor(link.target)}`,
          fields: [],
          summary: `${nameFor(link.source)} ${link.predicate} ${nameFor(link.target)}`,
          chips,
          blockers: [],
          link,
          bulkEligible: false,
          record,
        } satisfies ReviewItem;
      }

      const name = asString(obj.name) ?? nameFor(elementId);
      const typeLabel = `${layerLabel(layerId).toLowerCase()} · ${type}`;

      if (kind === 'update') {
        const fields = changedPaths(record.before, record.after);
        const identity = fields.includes('name') || fields.includes('type');
        if (typeOnly(record, fields)) chips.push('type only');
        if (identity) chips.push(fields.includes('name') ? 'renamed' : 'type changes');
        return {
          seq,
          kind,
          weight: 'routine',
          elementId,
          layerId,
          name,
          typeLabel,
          fields,
          summary: updateSummary(record, fields),
          chips,
          blockers: [],
          bulkEligible: !identity,
          record,
        } satisfies ReviewItem;
      }

      const description = asString(obj.description);
      if (kind === 'add') {
        const n = linkCount.get(elementId) ?? 0;
        if (n > 0) chips.push(plural(n, 'link'));
        else chips.push('no links');
      }
      if (blockers.length > 0) chips.push(`${plural(blockers.length, 'link')} still ${blockers.length === 1 ? 'uses' : 'use'} it`);
      return {
        seq,
        kind,
        weight: kind === 'add' ? 'add' : blockers.length > 0 ? 'blocked' : 'removal',
        elementId,
        layerId,
        name,
        typeLabel,
        fields: [],
        summary: description ?? (kind === 'add' ? `Adds this ${type}` : `Removes this ${type}`),
        chips,
        blockers,
        bulkEligible: false,
        record,
      } satisfies ReviewItem;
    });
}

// ─── Decisions ────────────────────────────────────────────────────────────────

/** Per sequence, the latest rewritten tombstone (the change was revised in place). */
export function revisions(unstaged: UnstagedChange[]): Map<number, UnstagedChange> {
  const out = new Map<number, UnstagedChange>();
  for (const t of unstaged) {
    if (!t.rewritten) continue;
    const prev = out.get(t.sequence);
    if (!prev || t.removedAt > prev.removedAt) out.set(t.sequence, t);
  }
  return out;
}

/**
 * The decision that still counts for a change: none when there is none, or
 * when the change was revised after the decision (it needs reviewing again).
 */
export function effectiveDecision(
  seq: number,
  review: ChangesetReview | undefined,
  revised: Map<number, UnstagedChange>,
): ReviewDecision | undefined {
  const d = review?.decisions[String(seq)];
  if (!d) return undefined;
  const t = revised.get(seq);
  if (t && d.atRevision !== undefined && t.removedAt > d.atRevision) return undefined;
  return d;
}

/** A change left out because a dropped add took its element with it. */
export interface Cascade {
  seq: number;
  /** The dropped add it depends on. */
  bySeq: number;
}

/**
 * The server's drop cascade (CONTRACT §4): a relationship-add whose endpoint,
 * or an update whose element, is added by a dropped add is left out too.
 */
export function cascadeOfDrops(items: ReviewItem[], dropped: Set<number>): Map<number, Cascade> {
  // Keyed by dotted id and by UUID: a relationship may name its ends either way.
  const droppedAdds = new Map<string, number>();
  for (const item of items) {
    if (item.kind !== 'add' || !dropped.has(item.seq)) continue;
    droppedAdds.set(item.elementId, item.seq);
    const uuid = asString(item.record.after?.id);
    if (uuid) droppedAdds.set(uuid, item.seq);
  }
  const out = new Map<number, Cascade>();
  if (droppedAdds.size === 0) return out;
  for (const item of items) {
    if (dropped.has(item.seq)) continue;
    let by: number | undefined;
    if (item.kind === 'link-add' && item.link) {
      by = droppedAdds.get(item.link.source) ?? droppedAdds.get(item.link.target);
    } else if (item.kind === 'update') {
      by = droppedAdds.get(item.elementId);
    }
    if (by !== undefined) out.set(item.seq, { seq: item.seq, bySeq: by });
  }
  return out;
}

/**
 * A dropped link delete whose element another kept (or undecided) delete still
 * removes: the link would be left pointing at nothing, so the server refuses
 * the commit. Keep the link delete, or drop the element delete too.
 */
export interface DropConflict {
  linkSeq: number;
  deleteSeq: number;
}

/**
 * For each change in a drop conflict, the other side of it: a dropped link
 * delete maps to the element delete it blocks, and that delete to the link(s).
 */
export function conflictPartners(conflicts: DropConflict[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  const add = (seq: number, other: number) => out.set(seq, [...(out.get(seq) ?? []), other]);
  for (const c of conflicts) {
    add(c.linkSeq, c.deleteSeq);
    add(c.deleteSeq, c.linkSeq);
  }
  return out;
}

export function dropConflicts(items: ReviewItem[], dropped: Set<number>): DropConflict[] {
  const deletes = new Map<string, number>();
  for (const i of items) {
    if (i.kind === 'delete' && !dropped.has(i.seq)) {
      deletes.set(i.elementId, i.seq);
      const uuid = asString(i.record.before?.id);
      if (uuid) deletes.set(uuid, i.seq);
    }
  }
  const out: DropConflict[] = [];
  for (const i of items) {
    if (i.kind !== 'link-delete' || !dropped.has(i.seq) || !i.link) continue;
    const d = deletes.get(i.link.source) ?? deletes.get(i.link.target);
    if (d !== undefined) out.push({ linkSeq: i.seq, deleteSeq: d });
  }
  return out;
}

/** Where a change stands. `cascaded`: left out with a dropped add. */
export type ItemState = Verdict | 'undecided' | 'cascaded';

export interface ReviewTally {
  total: number;
  kept: number;
  dropped: number;
  asked: number;
  cascaded: number;
  undecided: number;
  /** kept + dropped + asked + cascaded. */
  decided: number;
}

// ─── Since your review ────────────────────────────────────────────────────────

export interface RevisedChange {
  item: ReviewItem;
  /** The change as it was before the rewrite, when the tombstone carries it. */
  previous?: ChangeRecord;
  /** The decision made on the earlier version (no longer counts). */
  earlier?: ReviewDecision;
}

export interface WithdrawnChange {
  tombstone: UnstagedChange;
  decision?: ReviewDecision;
  label: string;
}

export interface RevisionDiff {
  /** The revision the reviewer last decided at. */
  since: number;
  revised: RevisedChange[];
  added: ReviewItem[];
  withdrawn: WithdrawnChange[];
  /** Unchanged since the review, with a decision that carries over. */
  carried: ReviewItem[];
  /** revised + added + withdrawn. */
  changedCount: number;
}

function tombstoneLabel(t: UnstagedChange, nameOf: NameOf): string {
  return t.change ? describeChange(t.change, nameOf) : `change ${t.sequence}`;
}

/** One line naming a change: "A predicate B" for a link, else the element's name. */
export function describeChange(c: ChangeRecord, nameOf: NameOf = () => undefined): string {
  const kind = changeKind(c);
  if (kind === 'link-add' || kind === 'link-delete') {
    const l = linkOf(c);
    if (l) {
      return `${nameOf(l.source) ?? nameFromId(l.source)} ${l.predicate} ${nameOf(l.target) ?? nameFromId(l.target)}`;
    }
  }
  const obj = c.after ?? c.before;
  return asString(obj?.name) ?? (c.elementId ? (nameOf(c.elementId) ?? nameFromId(c.elementId)) : 'a change');
}

/**
 * What a committed changeset left out: the tombstones its commit made for the
 * reviewer's drops (one revision for all, cascades included).
 */
export function leftOutAtCommit(
  unstaged: UnstagedChange[],
  review: ChangesetReview | undefined,
  nameOf: NameOf = () => undefined,
): { seq: number; label: string }[] {
  const dropRevisions = new Set(
    unstaged
      .filter((t) => !t.rewritten && review?.decisions[String(t.sequence)]?.verdict === 'drop')
      .map((t) => t.removedAt),
  );
  return unstaged
    .filter((t) => !t.rewritten && dropRevisions.has(t.removedAt))
    .sort((a, b) => a.sequence - b.sequence)
    .map((t) => ({ seq: t.sequence, label: tombstoneLabel(t, nameOf) }));
}

/**
 * What changed since the reviewer's last review (CONTRACT §1): new changes
 * (sequence ≥ lastReviewedRevision), revised ones (rewritten after their
 * decision, or after the review when undecided), withdrawn ones (unstaged
 * after the review), and the rest, whose decisions carry over. Null before
 * any review.
 */
export function revisionDiff(
  items: ReviewItem[],
  review: ChangesetReview | undefined,
  unstaged: UnstagedChange[],
  nameOf: NameOf = () => undefined,
): RevisionDiff | null {
  const since = review?.lastReviewedRevision;
  if (since === undefined || !review) return null;
  const revisedMap = revisions(unstaged);
  const current = new Set(items.map((i) => i.seq));

  const revised: RevisedChange[] = [];
  const added: ReviewItem[] = [];
  const carried: ReviewItem[] = [];
  for (const item of items) {
    const decision = review.decisions[String(item.seq)];
    const t = revisedMap.get(item.seq);
    const after = decision?.atRevision ?? since;
    if (t && t.removedAt > after) {
      revised.push({ item, previous: t.change, earlier: decision });
    } else if (item.seq >= since) {
      added.push(item);
    } else if (decision) {
      carried.push(item);
    }
  }

  const withdrawn: WithdrawnChange[] = unstaged
    .filter((t) => !t.rewritten && t.removedAt > since && !current.has(t.sequence))
    .sort((a, b) => a.sequence - b.sequence)
    .map((t) => ({ tombstone: t, decision: review.decisions[String(t.sequence)], label: tombstoneLabel(t, nameOf) }));

  return {
    since,
    revised,
    added,
    withdrawn,
    carried,
    changedCount: revised.length + added.length + withdrawn.length,
  };
}

// ─── Apply ────────────────────────────────────────────────────────────────────

export interface DroppedEntry {
  item: ReviewItem;
  note?: string;
  /** Set when it's left out with a dropped add rather than dropped itself. */
  cascadedBy?: ReviewItem;
}

export interface ApplyPlan {
  landing: ReviewItem[];
  landingByKind: Record<ChangeKind, number>;
  dropped: DroppedEntry[];
  /** Kept deletes whose blocking links are deleted with them. */
  deleteBlockedLinks: number[];
  /** How many blocking links go with them. */
  linksDeleted: number;
  /**
   * The commit body for a dr CLI with review. Always carries both lists: the
   * server only applies reviewed-commit rules (drops, blocker refusal) when the
   * body names either, even empty.
   */
  body: CommitBody;
}

// ─── The model ────────────────────────────────────────────────────────────────

export interface ReviewModelInput {
  changes: ChangeRecord[];
  unstaged?: UnstagedChange[];
  review?: ChangesetReview;
  nameOf?: NameOf;
  /**
   * Per delete sequence (as a string), the blocker relationship ids the delete
   * had when this browser kept it ("Delete the links too" covers those). A kept
   * delete with a blocker outside its list counts as undecided. No entry (kept
   * elsewhere, or omitted): the keep counts.
   */
  acknowledgedBlockers?: Record<string, string[]>;
}

export interface ReviewModel {
  items: ReviewItem[];
  bySeq: Map<number, ReviewItem>;
  pairs: CancelPair[];
  /** Decisions that still count, by sequence. */
  decisions: Map<number, ReviewDecision>;
  cascade: Map<number, Cascade>;
  /** Dropped link deletes an element delete contradicts; Apply waits on them. */
  conflicts: DropConflict[];
  tally: ReviewTally;
  diff: RevisionDiff | null;
  apply: ApplyPlan;
  /** Every change decided, none waiting on DrBot, and something lands. */
  ready: boolean;
  stateOf: (seq: number) => ItemState;
  /** Element names: the model's, then the changeset's own adds. */
  nameOf: NameOf;
  /** Whether the current model has the element (not only this changeset's add). */
  inModel: (dottedId: string) => boolean;
  /** A cancel-out pair member, as an item (for the cascade preview). */
  pairItem: (seq: number) => ReviewItem | undefined;
}

const ZERO_KINDS = (): Record<ChangeKind, number> => ({
  add: 0,
  update: 0,
  delete: 0,
  'link-add': 0,
  'link-delete': 0,
});

export function buildReviewModel({
  changes,
  unstaged = [],
  review,
  nameOf: modelNameOf = () => undefined,
  acknowledgedBlockers,
}: ReviewModelInput): ReviewModel {
  // The changeset's own adds name elements the model doesn't have yet.
  const addedNames = new Map<string, string>();
  for (const c of changes) {
    const name = asString(c.after?.name);
    if (changeKind(c) === 'add' && c.elementId && name) addedNames.set(c.elementId, name);
  }
  const nameOf: NameOf = (id) => modelNameOf(id) ?? addedNames.get(id);

  const pairs = cancelPairs(changes, nameOf);
  const items = toReviewItems(changes, pairs, nameOf);
  const bySeq = new Map(items.map((i) => [i.seq, i]));
  // Pair members aren't reviewed, but the server's drop cascade reaches them
  // too (a link add to a dropped element is left out even when a later link
  // delete would have cancelled it), so the preview includes them.
  const members = pairMembers(pairs);
  const pairItems = toReviewItems(changes, [], nameOf).filter((i) => members.has(i.seq));
  const revisedMap = revisions(unstaged);

  const decisions = new Map<number, ReviewDecision>();
  for (const item of items) {
    const d = effectiveDecision(item.seq, review, revisedMap);
    if (!d) continue;
    // "Delete the links too" covers the links the reviewer saw. A delete that
    // has gained a blocker since (a refetch, a refused commit) needs deciding again.
    const seen = acknowledgedBlockers?.[String(item.seq)];
    if (d.verdict === 'keep' && seen && item.blockers.some((b) => !seen.includes(b.relationshipId))) continue;
    decisions.set(item.seq, d);
  }
  const droppedSeqs = new Set([...decisions].filter(([, d]) => d.verdict === 'drop').map(([s]) => s));
  const cascade = cascadeOfDrops([...items, ...pairItems], droppedSeqs);
  const pairBySeq = new Map(pairItems.map((i) => [i.seq, i]));
  const conflicts = dropConflicts(items, droppedSeqs);

  const stateOf = (seq: number): ItemState => {
    const d = decisions.get(seq);
    if (d?.verdict === 'drop') return 'drop';
    if (cascade.has(seq)) return 'cascaded';
    return d?.verdict ?? 'undecided';
  };

  const tally: ReviewTally = { total: items.length, kept: 0, dropped: 0, asked: 0, cascaded: 0, undecided: 0, decided: 0 };
  for (const item of items) {
    const s = stateOf(item.seq);
    if (s === 'keep') tally.kept++;
    else if (s === 'drop') tally.dropped++;
    else if (s === 'ask') tally.asked++;
    else if (s === 'cascaded') tally.cascaded++;
    else tally.undecided++;
  }
  tally.decided = tally.total - tally.undecided;

  const landing = items.filter((i) => {
    const s = stateOf(i.seq);
    return s !== 'drop' && s !== 'cascaded';
  });
  const landingByKind = ZERO_KINDS();
  for (const i of landing) landingByKind[i.kind]++;
  const dropped: DroppedEntry[] = [...items, ...pairItems.filter((i) => cascade.has(i.seq))]
    .filter((i) => droppedSeqs.has(i.seq) || cascade.has(i.seq))
    .sort((a, b) => a.seq - b.seq)
    .map((i) => {
      const c = cascade.get(i.seq);
      return c ? { item: i, cascadedBy: bySeq.get(c.bySeq) } : { item: i, note: decisions.get(i.seq)?.note };
    });
  const blockedKept = landing.filter((i) => i.blockers.length > 0 && stateOf(i.seq) === 'keep');
  const deleteBlockedLinks = blockedKept.map((i) => i.seq);
  // Distinct links: one between two kept deletes is deleted once.
  const linksDeleted = new Set(blockedKept.flatMap((i) => i.blockers.map((b) => b.relationshipId))).size;
  const drop = [...droppedSeqs].sort((a, b) => a - b);
  // Always both lists: with a body the server enforces blockers (a delete still
  // in use and not in deleteBlockedLinks is refused) instead of silently
  // removing the links, as a body-less commit does.
  const body: CommitBody = { drop, deleteBlockedLinks };

  return {
    items,
    bySeq,
    pairs,
    decisions,
    cascade,
    conflicts,
    tally,
    diff: revisionDiff(items, review, unstaged, nameOf),
    apply: { landing, landingByKind, dropped, deleteBlockedLinks, linksDeleted, body },
    ready: tally.undecided === 0 && tally.asked === 0 && conflicts.length === 0 && landing.length > 0,
    stateOf,
    nameOf,
    inModel: (id) => modelNameOf(id) !== undefined,
    pairItem: (seq) => pairBySeq.get(seq),
  };
}

// ─── Counts shared with the dr CLI's list ─────────────────────────────────────

/** `GET /api/changesets` → `review` for one changeset. */
export interface ReviewCounts {
  decided: number;
  total: number;
  asked: number;
}

/**
 * The review counts by the definition the viewer and the dr CLI share:
 * total = staged changes minus cancel-pair members (an add / relationship-add
 * and a later delete / relationship-delete of the same elementId, the delete
 * without blockers); decided = changes with a verdict that still counts, plus
 * changes cascaded from a dropped add; asked = the decided ones whose verdict
 * is ask.
 */
export function reviewCounts(input: ReviewModelInput | ReviewModel): ReviewCounts {
  const model = 'tally' in input ? input : buildReviewModel(input);
  const { decided, total, asked } = model.tally;
  return { decided, total, asked };
}

// ─── Grouping + filtering ─────────────────────────────────────────────────────

export type GroupBy = 'weight' | 'layer' | 'sequence';
export type ShowFilter = 'since' | 'needs' | 'decided' | 'all';

export interface ReviewGroup {
  key: string;
  title: string;
  hint?: string;
  /** Layer groups: the layer slug (for its swatch). */
  layerId?: string;
  items: ReviewItem[];
  /** Routine: the undecided updates "Keep N routine" decides. */
  bulkSeqs?: number[];
}

const WEIGHT_GROUPS: { key: ReviewWeight; title: string; hint: string }[] = [
  { key: 'blocked', title: 'Blocked deletes', hint: 'Deletes of elements other elements still link to. Resolve each before Apply.' },
  { key: 'routine', title: 'Routine', hint: "Field edits that keep each element's identity. Safe to keep in bulk." },
  { key: 'add', title: 'New elements', hint: "Decide each: they add to the model's shape." },
  { key: 'link', title: 'New links', hint: 'Decide each. Dropping an element drops its links.' },
  { key: 'removal', title: 'Removals', hint: 'Deletes and removed links. Decide each.' },
];

/** Whether an item passes the Needs decision / Decided / All filter. */
export function passesFilter(model: ReviewModel, item: ReviewItem, filter: ShowFilter): boolean {
  const s = model.stateOf(item.seq);
  // A conflict holds Apply like an open decision, so both sides show here.
  if (filter === 'needs')
    return s === 'undecided' || s === 'ask' || model.conflicts.some((c) => c.linkSeq === item.seq || c.deleteSeq === item.seq);
  if (filter === 'decided') return s !== 'undecided';
  if (filter === 'since') {
    const d = model.diff;
    if (!d) return false;
    return d.revised.some((r) => r.item.seq === item.seq) || d.added.some((a) => a.seq === item.seq);
  }
  return true;
}

/** The shown items in groups, empty groups left out. */
export function groupReviewItems(
  model: ReviewModel,
  groupBy: GroupBy,
  filter: ShowFilter,
  layerOrder: readonly string[] = [],
): ReviewGroup[] {
  const shown = model.items.filter((i) => passesFilter(model, i, filter));
  if (groupBy === 'sequence') {
    return shown.length ? [{ key: 'sequence', title: 'In staging order', items: shown }] : [];
  }
  if (groupBy === 'layer') {
    const byLayer = new Map<string, ReviewItem[]>();
    for (const i of shown) byLayer.set(i.layerId, [...(byLayer.get(i.layerId) ?? []), i]);
    const rank = (l: string) => {
      const r = layerOrder.indexOf(l);
      return r === -1 ? layerOrder.length : r;
    };
    return [...byLayer.keys()]
      .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
      .map((l) => ({ key: `layer:${l}`, title: layerLabel(l), layerId: l, items: byLayer.get(l)! }));
  }
  return WEIGHT_GROUPS.map((g) => {
    const groupItems = shown.filter((i) => i.weight === g.key);
    const group: ReviewGroup = { key: g.key, title: g.title, hint: g.hint, items: groupItems };
    if (g.key === 'routine') {
      const bulk = model.items
        .filter((i) => i.weight === 'routine' && i.bulkEligible && model.stateOf(i.seq) === 'undecided')
        .map((i) => i.seq);
      if (bulk.length > 0) group.bulkSeqs = bulk;
    }
    return group;
  }).filter((g) => g.items.length > 0);
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const KIND_LABEL: Record<ChangeKind, string> = {
  add: 'add',
  update: 'update',
  delete: 'delete',
  'link-add': '+ link',
  'link-delete': '− link',
};

/** Op chip colour per kind (Heimdall StatusColor). */
export const KIND_COLOR: Record<ChangeKind, 'emerald' | 'cyan' | 'rose'> = {
  add: 'emerald',
  update: 'cyan',
  delete: 'rose',
  'link-add': 'emerald',
  'link-delete': 'rose',
};

export const STATE_LABEL: Record<ItemState, string> = {
  keep: 'kept',
  drop: 'dropped',
  ask: 'asked DrBot',
  undecided: 'needs decision',
  cascaded: 'left out',
};

export const STATE_COLOR: Record<ItemState, 'emerald' | 'rose' | 'violet' | 'amber' | 'neutral'> = {
  keep: 'emerald',
  drop: 'rose',
  ask: 'violet',
  undecided: 'amber',
  cascaded: 'neutral',
};

/** "12 add · 7 update · 11 link add" over the given counts, zeros left out. */
export function kindCountsLabel(counts: Record<ChangeKind, number>): string {
  const parts: string[] = [];
  if (counts.add) parts.push(`${counts.add} add`);
  if (counts.update) parts.push(`${counts.update} update`);
  if (counts.delete) parts.push(`${counts.delete} delete`);
  if (counts['link-add']) parts.push(`${counts['link-add']} link add`);
  if (counts['link-delete']) parts.push(`${counts['link-delete']} link delete`);
  return parts.join(' · ');
}

export function countKinds(items: ReviewItem[]): Record<ChangeKind, number> {
  const out = ZERO_KINDS();
  for (const i of items) out[i.kind]++;
  return out;
}

/** The headline of the summary card. */
export function reviewHeadline(tally: ReviewTally): string {
  if (tally.total === 0) return 'Nothing to decide';
  if (tally.undecided > 0) return `${tally.undecided} of ${tally.total} need a decision`;
  if (tally.asked > 0) return `${tally.asked} waiting on DrBot`;
  return 'Every change has a decision';
}

/** "Staged by DrBot · from chat" etc. */
export function originLabel(origin: ChangesetOrigin | undefined): string | undefined {
  if (!origin) return undefined;
  switch (origin.kind) {
    case 'chat':
      return origin.detail ? `staged by DrBot · from chat "${origin.detail}"` : 'staged by DrBot · from chat';
    case 'plan':
      return 'staged by DrBot · /dr-plan';
    case 'extract':
      return 'extracted from the code';
    case 'cli':
      return 'staged from the dr CLI';
    default:
      return undefined;
  }
}

/** Per landing layer: counts by kind, for the results card. */
export function landedByLayer(items: ReviewItem[]): { layerId: string; counts: Record<ChangeKind, number> }[] {
  const by = new Map<string, Record<ChangeKind, number>>();
  for (const i of items) {
    const counts = by.get(i.layerId) ?? ZERO_KINDS();
    counts[i.kind]++;
    by.set(i.layerId, counts);
  }
  return [...by].map(([layerId, counts]) => ({ layerId, counts }));
}
