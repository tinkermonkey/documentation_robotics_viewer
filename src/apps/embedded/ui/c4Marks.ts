/**
 * c4Marks — how a changeset's C4 diff reads on a diagram: the mark per box and
 * per arrow (an op outline from `opStyles.ts`, a glyph and a word), the
 * roll-up line of a box whose parts changed, and the words that go into
 * accessible names. Pure: the C4 Diagram, the changeset bar and the details
 * drawer share it so the three say the same thing.
 */

import type { C4ElementDiff, C4ElementStatus, C4RelationshipStatus, C4RollUp, C4ViewRelationshipDiff } from '../data/c4/c4Diff';
import { OVERLAY_OPS, type OverlayOp } from './opStyles';

export interface C4Mark {
  /** The op outline it borrows (null: no outline of its own, e.g. parts changed: the roll-up says it). */
  op: OverlayOp | null;
  /** Lower-case word for chips and accessible names. */
  label: string;
  /** One character before the label; `aria-hidden`. */
  glyph: string;
}

export const ELEMENT_MARKS: Record<C4ElementStatus, C4Mark> = {
  added: { op: 'add', label: 'added', glyph: '+' },
  removed: { op: 'delete', label: 'removed', glyph: '−' },
  moved: { op: 'update', label: 'moved', glyph: '→' },
  changed: { op: 'update', label: 'changed', glyph: '~' },
  'parts-changed': { op: null, label: 'parts changed', glyph: '' },
};

export const RELATIONSHIP_MARKS: Record<C4RelationshipStatus, C4Mark> = {
  added: { op: 'add', label: 'added', glyph: '+' },
  removed: { op: 'delete', label: 'removed', glyph: '−' },
  relabelled: { op: 'update', label: 'relabelled', glyph: '~' },
  relinked: { op: 'relink', label: 'relinked', glyph: '↔' },
};

/** The changes counted on a box whose parts changed: the changeset's changes, else the C4 differences. */
export function rollUpCount(rollUp: C4RollUp | undefined): number {
  if (!rollUp) return 0;
  return rollUp.sequences.length > 0 ? rollUp.sequences.length : rollUp.elements + rollUp.relationships;
}

/** The ops below a box, in legend order, each with how many changed elements and arrows carry it. */
export function rollUpOps(rollUp: C4RollUp | undefined): { op: OverlayOp; count: number }[] {
  if (!rollUp?.byStatus) return [];
  const counts = new Map<OverlayOp, number>();
  const add = (op: OverlayOp | null, n: number | undefined) => {
    if (op && n) counts.set(op, (counts.get(op) ?? 0) + n);
  };
  for (const [status, n] of Object.entries(rollUp.byStatus.elements)) add(ELEMENT_MARKS[status as C4ElementStatus].op, n);
  for (const [status, n] of Object.entries(rollUp.byStatus.relationships)) add(RELATIONSHIP_MARKS[status as C4RelationshipStatus].op, n);
  return OVERLAY_OPS.filter((op) => counts.has(op)).map((op) => ({ op, count: counts.get(op)! }));
}

/** "12 changes", or '' when there is one change or none (the mark already says one thing changed). */
export function changeCountLabel(n: number): string {
  return n > 1 ? `${n} changes` : '';
}

/** How many of the changeset's changes are behind a box's or an arrow's own mark. */
export function changeCount(diff: { sequences: readonly number[] } | undefined): number {
  return diff?.sequences.length ?? 0;
}

/** "3 changes inside", or '' when nothing below the box changed. */
export function rollUpLabel(rollUp: C4RollUp | undefined): string {
  const n = rollUpCount(rollUp);
  return n === 0 ? '' : `${n} ${n === 1 ? 'change' : 'changes'} inside`;
}

/** A box's own status in words, without its count: "added", "moved from Web App". Empty for none or parts changed. */
export function elementStatusLabel(diff: C4ElementDiff | undefined, nameOf: (id: string) => string | undefined): string {
  if (!diff || diff.status === 'parts-changed') return '';
  if (diff.status === 'moved') {
    const from = diff.previousParentId ? nameOf(diff.previousParentId) : undefined;
    return from ? `moved from ${from}` : 'moved';
  }
  return ELEMENT_MARKS[diff.status].label;
}

/**
 * A box's status words for its accessible name and tooltip: "added",
 * "changed, 12 changes", "moved from Web App", "3 changes inside". Empty when
 * the changeset leaves it and its parts alone.
 */
export function elementStatusWords(
  diff: C4ElementDiff | undefined,
  rollUp: C4RollUp | undefined,
  nameOf: (id: string) => string | undefined,
): string[] {
  const words: string[] = [];
  const label = elementStatusLabel(diff, nameOf);
  if (label) {
    const n = changeCountLabel(changeCount(diff));
    words.push(n ? `${label}, ${n}` : label);
  }
  const inside = rollUpLabel(rollUp);
  if (inside) words.push(inside);
  return words;
}

/** An arrow's own status in words, without its count: "added", "relabelled, was uses". */
export function relationshipStatusLabel(diff: C4ViewRelationshipDiff | undefined): string {
  if (!diff) return '';
  if (diff.status === 'relabelled' && diff.baseLabels.length > 0) return `relabelled, was ${diff.baseLabels.join(', ')}`;
  return RELATIONSHIP_MARKS[diff.status].label;
}

/** An arrow's status words: "added", "removed, 4 changes", "relabelled, was uses", "relinked". */
export function relationshipStatusWords(diff: C4ViewRelationshipDiff | undefined): string {
  if (!diff) return '';
  const label = relationshipStatusLabel(diff);
  const n = changeCountLabel(changeCount(diff));
  return n ? `${label}, ${n}` : label;
}

/**
 * The changes inside a diagram's scope, each counted once: the same number
 * as the scope box's "N changes inside" chip one level up, so a reader who
 * followed that chip can check it here. "37 changes inside Web App", or '' for none.
 */
export function scopeChangesLabel(scopeName: string, rollUp: C4RollUp | undefined): string {
  const n = rollUpCount(rollUp);
  return n === 0 ? '' : `${n} ${n === 1 ? 'change' : 'changes'} inside ${scopeName}`;
}
