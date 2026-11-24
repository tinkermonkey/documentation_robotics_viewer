/**
 * c4Marks — the words a changeset overlay puts on a C4 box or arrow: the
 * change count beside its status (#629) and the scope total in the bar.
 */

import { describe, it, expect } from 'vitest';
import type { C4ElementDiff, C4RollUp, C4ViewRelationshipDiff } from '@/apps/embedded/data/c4/c4Diff';
import {
  changeCountLabel,
  elementStatusWords,
  relationshipStatusWords,
  rollUpLabel,
  scopeChangesLabel,
} from '@/apps/embedded/ui/c4Marks';
import { c4EdgeLabelWidth, c4MarkedEdgeLabel } from '@/apps/embedded/data/c4/c4Layout';

const seqs = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const box = (status: C4ElementDiff['status'], n: number, extra: Partial<C4ElementDiff> = {}): C4ElementDiff => ({
  id: 'x',
  status,
  baseId: 'x',
  afterId: 'x',
  sequences: seqs(n),
  ...extra,
});
const rollUp = (n: number): C4RollUp => ({ elements: 1, relationships: 0, sequences: seqs(n), byStatus: { elements: {}, relationships: {} } });
const nameOf = (id: string) => (id === 'web' ? 'Web App' : undefined);

describe('c4Marks: change counts', () => {
  it('counts past one, and says nothing at one or none', () => {
    expect(changeCountLabel(12)).toBe('12 changes');
    expect(changeCountLabel(2)).toBe('2 changes');
    expect(changeCountLabel(1)).toBe('');
    expect(changeCountLabel(0)).toBe('');
  });

  it('puts the count in the words for accessible names, after a comma, before the roll-up', () => {
    expect(elementStatusWords(box('changed', 12), rollUp(3), nameOf)).toEqual(['changed, 12 changes', '3 changes inside']);
    expect(elementStatusWords(box('moved', 4, { previousParentId: 'web' }), undefined, nameOf)).toEqual([
      'moved from Web App, 4 changes',
    ]);
    expect(elementStatusWords(box('added', 1), undefined, nameOf)).toEqual(['added']);
    expect(elementStatusWords(box('parts-changed', 5), rollUp(5), nameOf)).toEqual(['5 changes inside']);
  });

  it("counts an arrow's changes past one", () => {
    const arrow = (status: C4ViewRelationshipDiff['status'], n: number, baseLabels: string[] = []): C4ViewRelationshipDiff => ({
      status,
      baseLabels,
      sequences: seqs(n),
    });
    expect(relationshipStatusWords(arrow('added', 4))).toBe('added, 4 changes');
    expect(relationshipStatusWords(arrow('relabelled', 2, ['uses']))).toBe('relabelled, was uses, 2 changes');
    expect(relationshipStatusWords(arrow('removed', 1))).toBe('removed');
  });

  it("states a scope's total as its chip did one level up", () => {
    expect(scopeChangesLabel('Web App', rollUp(37))).toBe('37 changes inside Web App');
    expect(rollUpLabel(rollUp(37))).toBe('37 changes inside');
    expect(scopeChangesLabel('Web App', rollUp(1))).toBe('1 change inside Web App');
    expect(scopeChangesLabel('Web App', undefined)).toBe('');
  });
});

describe('c4Layout: a marked arrow label', () => {
  it('cuts the glyph and labels, never the count', () => {
    expect(c4MarkedEdgeLabel('uses', '+', '4 changes')).toBe('+ uses · 4 changes');
    expect(c4MarkedEdgeLabel('uses', '+', '')).toBe('+ uses');
    expect(c4MarkedEdgeLabel('uses')).toBe('uses');
    const long = c4MarkedEdgeLabel('reads, writes, serves, realizes, composes', '~', '12 changes');
    expect(long).toMatch(/… · 12 changes$/);
    expect(long.indexOf(' · 12 changes')).toBe(28);
  });

  it('widens the label background to fit the drawn text, never narrower than laid out', () => {
    expect(c4EdgeLabelWidth(120, 'uses')).toBe(120);
    expect(c4EdgeLabelWidth(40, '+ uses · 4 changes')).toBeGreaterThan(40);
  });
});
