/**
 * changesets — pure, stateless helpers that map the live `/api/changesets/:id`
 * change records into op-coded view-models for the canvas diff list.
 *
 * Live `change` shape (verified against the running CLI):
 *   { type, elementId, layerName, before?, after?, timestamp, sequenceNumber }
 * where:
 *   - `add`               → `after` only (full element object)
 *   - `delete`            → `before` only (full element object)
 *   - `update`            → both `before` + `after` (full element objects)
 *   - `relationship-add`  → `after` only ({ source, target, predicate, ... })
 *   - `relationship-delete` → `before` only ({ source, target, predicate, ... })
 *
 * Op colors (from the design): add = emerald (#10B981), update = cyan (#22D3EE),
 * delete = rose (#F43F5E). Relationship add/delete reuse the add/delete colors.
 */

import type { DiffLine } from '@tinkermonkey/heimdall-ui';

/** The four op buckets the UI renders (badge color + 3-char label). */
export type ChangeOp = 'add' | 'update' | 'delete';

/** A raw change record from `/api/changesets/:id`. */
export interface ChangeRecord {
  type?: string;
  elementId?: string;
  layerName?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp?: string;
  sequenceNumber?: number;
  [key: string]: unknown;
}

/** Op metadata: short uppercase label + the badge color (CSS hex). */
export interface OpMeta {
  /** Normalized op bucket. */
  op: ChangeOp;
  /** Short badge label (e.g. 'ADD'). */
  label: string;
  /** Badge text/border color (hex). */
  color: string;
  /** Badge background (translucent tint of `color`). */
  background: string;
}

const OP_META: Record<ChangeOp, OpMeta> = {
  add: { op: 'add', label: 'ADD', color: '#10B981', background: 'rgba(16,185,129,0.12)' },
  update: { op: 'update', label: 'MOD', color: '#22D3EE', background: 'rgba(34,211,238,0.12)' },
  delete: { op: 'delete', label: 'DEL', color: '#F43F5E', background: 'rgba(244,63,94,0.12)' },
};

/**
 * Normalize a raw change `type` to one of the three op buckets.
 * `relationship-add` → add, `relationship-delete` → delete, etc.
 */
export function normalizeOp(type: string | undefined): ChangeOp {
  const t = (type ?? '').toLowerCase();
  if (t.includes('delete') || t === 'del' || t === 'remove') return 'delete';
  if (t.includes('add') || t === 'create') return 'add';
  return 'update';
}

/** Op metadata (label + colors) for a raw change `type`. */
export function opMeta(type: string | undefined): OpMeta {
  return OP_META[normalizeOp(type)];
}

/** A diff-list row view-model: op badge + element path + a one-line detail. */
export interface ChangeRow {
  /** Stable key for React (elementId + sequence). */
  key: string;
  /** Normalized op bucket. */
  op: ChangeOp;
  /** Op badge metadata. */
  meta: OpMeta;
  /** Dotted element id / relationship id (mono path). */
  elementId: string;
  /** Layer slug the change belongs to. */
  layerName: string;
  /** Human-readable detail line derived from before/after. */
  detail: string;
  /** Whether a before↔after side-by-side diff can be shown. */
  hasDiff: boolean;
  /** The raw record (for the expandable diff). */
  raw: ChangeRecord;
}

function elementTypeOf(obj: Record<string, unknown> | null | undefined): string {
  if (!obj) return 'element';
  const t = obj.type ?? obj.predicate;
  return typeof t === 'string' && t.length > 0 ? t : 'element';
}

/** Stable JSON for value comparison (sorts object keys, ignores key order). */
function stableValue(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableValue(obj[k])}`)
    .join(',')}}`;
}

/** Top-level field keys that differ between before and after. */
function changedFields(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string[] {
  if (!before || !after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (stableValue(before[key]) !== stableValue(after[key])) changed.push(key);
  }
  return changed;
}

/**
 * Derive the one-line detail string for a change:
 *   - add    → 'Added {type}'
 *   - delete → 'Removed {type}'
 *   - update → 'Changed {field, field}' (or 'Updated {type}' when nothing diffs)
 */
export function changeDetail(change: ChangeRecord): string {
  const op = normalizeOp(change.type);
  if (op === 'add') {
    const isRel = (change.type ?? '').includes('relationship');
    return isRel ? 'Added relationship' : `Added ${elementTypeOf(change.after)}`;
  }
  if (op === 'delete') {
    const isRel = (change.type ?? '').includes('relationship');
    return isRel ? 'Removed relationship' : `Removed ${elementTypeOf(change.before)}`;
  }
  const fields = changedFields(change.before, change.after);
  if (fields.length === 0) return `Updated ${elementTypeOf(change.after ?? change.before)}`;
  const shown = fields.slice(0, 3).join(', ');
  const extra = fields.length > 3 ? ` +${fields.length - 3} more` : '';
  return `Changed ${shown}${extra}`;
}

/** Map a raw change record to a diff-list row view-model. */
export function toChangeRow(change: ChangeRecord, idx: number): ChangeRow {
  const op = normalizeOp(change.type);
  const elementId = change.elementId ?? '(unknown)';
  return {
    key: `${elementId}::${change.sequenceNumber ?? idx}`,
    op,
    meta: OP_META[op],
    elementId,
    layerName: change.layerName ?? '',
    detail: changeDetail(change),
    hasDiff: Boolean(change.before) || Boolean(change.after),
    raw: change,
  };
}

/** Map all changes in a detail payload to row view-models (in API order). */
export function toChangeRows(changes: ChangeRecord[] | undefined): ChangeRow[] {
  if (!changes) return [];
  return changes.map(toChangeRow);
}

/**
 * Build Heimdall `DiffLine[]` for a single change's before↔after element JSON.
 * Pretty-printed JSON is diffed line-by-line: lines present only in `before` are
 * 'removed', lines present only in `after' are 'added', shared lines are
 * 'context'. Suitable for `SideBySideDiff` / `DiffViewer.SideBySide`.
 */
export function buildDiffLines(change: ChangeRecord): DiffLine[] {
  const beforeText = change.before ? JSON.stringify(change.before, null, 2) : '';
  const afterText = change.after ? JSON.stringify(change.after, null, 2) : '';
  const beforeLines = beforeText ? beforeText.split('\n') : [];
  const afterLines = afterText ? afterText.split('\n') : [];

  // Simple set-based line diff (key-stable JSON keeps shared lines aligned well
  // enough for a readable element diff without an LCP algorithm).
  const beforeSet = new Set(beforeLines);
  const afterSet = new Set(afterLines);

  const lines: DiffLine[] = [];
  // Removed lines (in before, not after).
  for (const line of beforeLines) {
    if (!afterSet.has(line)) lines.push({ type: 'removed', content: line });
  }
  // Added lines (in after, not before).
  for (const line of afterLines) {
    if (!beforeSet.has(line)) lines.push({ type: 'added', content: line });
  }
  return lines;
}

/** A short, human-friendly summary line for the canvas header area. */
export function changesetSummary(
  name: string,
  stats: { additions: number; modifications: number; deletions: number } | undefined,
): string {
  if (!stats) return name;
  const { additions, modifications, deletions } = stats;
  return `${additions} additions · ${modifications} modifications · ${deletions} deletions in this changeset.`;
}
