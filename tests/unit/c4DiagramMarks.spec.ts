/**
 * c4DiagramMarks — the one resolution of a drawn card's or arrow's mark, from
 * a changeset overlay or a plan comparison, and the same marks as C4 Export
 * Marks, so an export says what the screen says.
 */

import { describe, it, expect } from 'vitest';
import type { C4ElementDiff, C4ViewRelationshipDiff } from '@/apps/embedded/data/c4/c4Diff';
import type { C4ElementVerdict } from '@/apps/embedded/data/c4/c4PlanCompare';
import { cardMark, edgeMark, isGhost, toExportMarks, type C4DiagramComparison, type C4DiagramOverlay } from '@/apps/embedded/ui/c4DiagramMarks';

const el = (id: string) => ({ id }) as never;
const view = { elements: [el('a'), el('b'), el('c'), el('parent')], relationships: [{ id: 'a>b' }, { id: 'b>c' }] as never[] };

const diff = (id: string, status: C4ElementDiff['status'], extra: Partial<C4ElementDiff> = {}): C4ElementDiff =>
  ({ id, status, baseId: id, afterId: id, sequences: [1], ...extra }) as C4ElementDiff;

const overlay: C4DiagramOverlay = {
  elements: new Map([
    ['a', diff('a', 'added', { baseId: null })],
    ['b', diff('b', 'removed', { afterId: null })],
    ['c', diff('c', 'moved', { previousParentId: 'old' })],
    ['parent', diff('parent', 'parts-changed')],
  ]),
  rollUp: new Map([
    ['parent', { elements: 3, relationships: 1, sequences: [3, 4], byStatus: { elements: { added: 1, changed: 2 }, relationships: { removed: 1 } } }],
  ]),
  relationships: new Map<string, C4ViewRelationshipDiff>([
    ['a>b', { status: 'relabelled', baseLabels: ['uses'], sequences: [5] }],
    ['b>c', { status: 'removed', baseLabels: ['reads'], sequences: [6] }],
  ]),
  nameOf: (id) => (id === 'old' ? 'Old Home' : undefined),
};

const verdict = (v: C4ElementVerdict['verdict']): C4ElementVerdict => ({ verdict: v, items: [{ id: 'x', verdict: v }], folded: [] });
const comparison: C4DiagramComparison = {
  elements: new Map([
    ['a', verdict('missing')],
    ['b', verdict('unverifiable')],
  ]),
  arrows: new Map([['a>b', { verdict: 'probable' as const }]]),
  rollUp: new Map([['parent', { missing: 1, divergent: 0, probable: 0, unverifiable: 0, built: 2, unplanned: 0 }]]),
};

const colorOf = (token: string) => `color(${token})`;

describe('c4DiagramMarks: an overlay', () => {
  it('marks a card with its op outline, glyph and words, and a box whose parts changed with its roll-up only', () => {
    const a = cardMark({ overlay }, 'a');
    expect(a.mark).toMatchObject({ status: 'added', glyph: '+', token: '--status-emerald', lineStyle: 'solid', lineWidth: 2 });
    expect(cardMark({ overlay }, 'c').words).toEqual(['moved from Old Home']);
    // The legend is the status's own words, not this box's.
    expect(cardMark({ overlay }, 'c').mark?.legend).toBe('moved');
    const parent = cardMark({ overlay }, 'parent');
    expect(parent.mark).toMatchObject({ status: 'parts-changed', outline: null, token: null });
    expect(parent.inside).toBe('2 changes inside');
    // The chip follows the legend: the op most changes inside are (2 modified) sets its border; each op gets a swatch.
    expect(parent.insideMark).toMatchObject({ token: '--status-cyan', style: 'dashed' });
    expect(parent.insideMark?.ops.map((o) => o.glyph)).toEqual(['+', '~', '−']);
    expect(isGhost({ overlay }, 'b')).toBe(true);
  });

  it("gives an arrow its op colour and, for an export, the dash the canvas draws it with", () => {
    expect(edgeMark({ overlay }, 'a>b')).toMatchObject({ status: 'relabelled', words: ['relabelled, was uses'], dash: null, exportDash: '7 4' });
    expect(edgeMark({ overlay }, 'b>c')).toMatchObject({ status: 'removed', exportDash: '2 4' });
  });
});

describe('c4DiagramMarks: a comparison', () => {
  it('marks a card with its verdict, and wins over an overlay', () => {
    const a = cardMark({ overlay, comparison }, 'a');
    expect(a.mark).toMatchObject({ status: 'v-missing', glyph: '∅', words: ['planned, not built'], lineStyle: 'dotted' });
    // "can't be checked" has no outline: nothing to draw but the chip.
    expect(cardMark({ comparison }, 'b').mark).toMatchObject({ outline: null, lineStyle: null, token: null });
    expect(isGhost({ overlay, comparison }, 'b')).toBe(false);
    expect(cardMark({ comparison }, 'parent').inside).toBe('3 inside · 1 ∅');
    // Its chip takes the worst verdict's colour and line.
    expect(cardMark({ comparison }, 'parent').insideMark).toEqual({ token: '--status-rose', style: 'dotted', ops: [] });
  });
});

describe('c4DiagramMarks: as C4 Export Marks', () => {
  it('carries the same status, glyph and words, with each colour resolved', () => {
    const marks = toExportMarks(view, { overlay }, colorOf);
    expect(marks.elements.get('a')).toEqual({
      status: 'added',
      glyph: '+',
      words: ['added'],
      legend: 'added',
      color: 'color(--status-emerald)',
      lineStyle: 'solid',
      lineWidth: 2,
      dash: null,
    });
    expect(marks.elements.get('parent')).toMatchObject({ color: null, words: ['2 changes inside'] });
    expect(marks.inside.get('parent')).toBe('+ ~ − · 2 changes inside');
    expect(marks.insideColor?.get('parent')).toBe('color(--status-cyan)');
    expect([...marks.ghosts]).toEqual(['b']);
    expect(marks.relationships.get('b>c')).toMatchObject({ color: 'color(--status-rose)', dash: '2 4' });
  });

  it("takes a comparison's verdicts and roll-ups, never the overlay's", () => {
    const marks = toExportMarks(view, { overlay, comparison }, colorOf);
    expect([...marks.elements.keys()]).toEqual(['a', 'b']);
    expect(marks.elements.get('a')).toMatchObject({ status: 'v-missing', color: 'color(--status-rose)' });
    expect(marks.relationships.get('a>b')).toMatchObject({ status: 'v-probable', dash: '7 4' });
    expect(marks.relationships.has('b>c')).toBe(false);
    expect(marks.ghosts.size).toBe(0);
    expect(marks.inside.get('parent')).toBe('3 inside · 1 ∅');
  });
});
