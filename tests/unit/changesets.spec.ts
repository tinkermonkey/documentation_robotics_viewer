import { describe, it, expect } from 'vitest';
import {
  normalizeOp,
  opMeta,
  changeDetail,
  toChangeRow,
  toChangeRows,
  buildDiffLines,
  changesetSummary,
  type ChangeRecord,
} from '@/apps/embedded/data/changesets';
import detailFixture from '../fixtures/changeset-detail.json';

interface DetailFixture {
  id: string;
  stats: { additions: number; modifications: number; deletions: number };
  changes: ChangeRecord[];
}
const detail = detailFixture as unknown as DetailFixture;

// ─── normalizeOp folds relationship-* into the 3 buckets ──────────────────────

describe('normalizeOp', () => {
  const cases: Array<[string | undefined, 'add' | 'update' | 'delete']> = [
    ['add', 'add'],
    ['create', 'add'],
    ['relationship-add', 'add'], // folded into add
    ['delete', 'delete'],
    ['remove', 'delete'],
    ['relationship-delete', 'delete'], // folded into delete
    ['update', 'update'],
    ['modify', 'update'], // anything else → update
    [undefined, 'update'],
    ['', 'update'],
    ['ADD', 'add'], // case-insensitive
  ];

  it.each(cases)('normalizeOp(%j) === %j', (type, expected) => {
    expect(normalizeOp(type)).toBe(expected);
  });
});

// ─── REGRESSION: op-row counts reconcile with stats after folding ─────────────

describe('op-row counts reconcile with stats (relationship-* folded)', () => {
  it('the fixture has the pr-497-style mix (12 add + 15 rel-add, etc.)', () => {
    const byType = detail.changes.reduce<Record<string, number>>((acc, c) => {
      acc[c.type ?? '?'] = (acc[c.type ?? '?'] ?? 0) + 1;
      return acc;
    }, {});
    // Confirms the fixture really exercises the fold (relationship-* present).
    expect(byType['relationship-add']).toBeGreaterThan(0);
    expect(byType['relationship-delete']).toBeGreaterThan(0);
  });

  it('folded add/update/delete counts equal stats {additions,modifications,deletions}', () => {
    const rows = toChangeRows(detail.changes);
    const folded = rows.reduce(
      (acc, r) => {
        acc[r.op] += 1;
        return acc;
      },
      { add: 0, update: 0, delete: 0 } as Record<'add' | 'update' | 'delete', number>,
    );
    expect(folded.add).toBe(detail.stats.additions);
    expect(folded.update).toBe(detail.stats.modifications);
    expect(folded.delete).toBe(detail.stats.deletions);
  });

  it('every row has a stable, unique key and preserves API order', () => {
    const rows = toChangeRows(detail.changes);
    expect(rows).toHaveLength(detail.changes.length);
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
    // Row N maps change N (order preserved).
    rows.forEach((r, i) => {
      expect(r.op).toBe(normalizeOp(detail.changes[i].type));
    });
  });

  it('toChangeRows(undefined) is []', () => {
    expect(toChangeRows(undefined)).toEqual([]);
  });
});

// ─── opMeta colors ────────────────────────────────────────────────────────────

describe('opMeta', () => {
  it('add → emerald ADD', () => {
    const m = opMeta('relationship-add');
    expect(m.op).toBe('add');
    expect(m.label).toBe('ADD');
    expect(m.color).toBe('#10B981');
  });
  it('update → cyan MOD', () => {
    const m = opMeta('update');
    expect(m.label).toBe('MOD');
    expect(m.color).toBe('#22D3EE');
  });
  it('delete → rose DEL', () => {
    const m = opMeta('relationship-delete');
    expect(m.label).toBe('DEL');
    expect(m.color).toBe('#F43F5E');
  });
  it('background is a translucent tint of the color', () => {
    expect(opMeta('add').background).toBe('rgba(16,185,129,0.12)');
  });
});

// ─── changeDetail ─────────────────────────────────────────────────────────────

describe('changeDetail', () => {
  it('add of an element → "Added {type}"', () => {
    const c: ChangeRecord = { type: 'add', after: { type: 'goal', name: 'X' } };
    expect(changeDetail(c)).toBe('Added goal');
  });

  it('relationship-add → "Added relationship"', () => {
    const c: ChangeRecord = { type: 'relationship-add', after: { predicate: 'supports' } };
    expect(changeDetail(c)).toBe('Added relationship');
  });

  it('delete of an element → "Removed {type}"', () => {
    const c: ChangeRecord = { type: 'delete', before: { type: 'service' } };
    expect(changeDetail(c)).toBe('Removed service');
  });

  it('relationship-delete → "Removed relationship"', () => {
    const c: ChangeRecord = { type: 'relationship-delete', before: { predicate: 'uses' } };
    expect(changeDetail(c)).toBe('Removed relationship');
  });

  it('update lists the changed top-level fields', () => {
    const c: ChangeRecord = {
      type: 'update',
      before: { name: 'A', description: 'old', type: 'goal' },
      after: { name: 'B', description: 'new', type: 'goal' },
    };
    expect(changeDetail(c)).toBe('Changed name, description');
  });

  it('update with >3 changed fields shows "+N more"', () => {
    const c: ChangeRecord = {
      type: 'update',
      before: { a: 1, b: 1, c: 1, d: 1, e: 1 },
      after: { a: 2, b: 2, c: 2, d: 2, e: 2 },
    };
    expect(changeDetail(c)).toBe('Changed a, b, c +2 more');
  });

  it('update with no field differences → "Updated {type}"', () => {
    const c: ChangeRecord = {
      type: 'update',
      before: { type: 'goal', name: 'same' },
      after: { type: 'goal', name: 'same' },
    };
    expect(changeDetail(c)).toBe('Updated goal');
  });
});

// ─── toChangeRow ──────────────────────────────────────────────────────────────

describe('toChangeRow', () => {
  it('derives op, meta, elementId, layer, detail and hasDiff', () => {
    const row = toChangeRow(
      {
        type: 'relationship-add',
        elementId: 'a.b.c',
        layerName: 'business',
        after: { predicate: 'serves' },
        sequenceNumber: 7,
      },
      0,
    );
    expect(row.op).toBe('add');
    expect(row.meta.label).toBe('ADD');
    expect(row.elementId).toBe('a.b.c');
    expect(row.layerName).toBe('business');
    expect(row.detail).toBe('Added relationship');
    expect(row.hasDiff).toBe(true);
    expect(row.key).toBe('a.b.c::7');
  });

  it('falls back to index for the key when sequenceNumber is absent', () => {
    const row = toChangeRow({ type: 'add', elementId: 'x' }, 5);
    expect(row.key).toBe('x::5');
    expect(row.hasDiff).toBe(false); // no before/after
  });

  it('uses "(unknown)" when elementId is missing', () => {
    expect(toChangeRow({ type: 'add' }, 0).elementId).toBe('(unknown)');
  });
});

// ─── buildDiffLines ───────────────────────────────────────────────────────────

describe('buildDiffLines', () => {
  it('add (null before) → all lines are "added"', () => {
    const lines = buildDiffLines({ type: 'add', after: { name: 'X', type: 'goal' } });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((l) => l.type === 'added')).toBe(true);
    expect(lines.some((l) => l.content.includes('"name"'))).toBe(true);
  });

  it('delete (null after) → all lines are "removed"', () => {
    const lines = buildDiffLines({ type: 'delete', before: { name: 'X' } });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((l) => l.type === 'removed')).toBe(true);
  });

  it('update → unchanged lines drop out; only diffed lines appear', () => {
    const lines = buildDiffLines({
      type: 'update',
      before: { name: 'A', kept: 'same' },
      after: { name: 'B', kept: 'same' },
    });
    // The "kept" line is shared → excluded. name lines differ → present.
    expect(lines.some((l) => l.type === 'removed' && l.content.includes('"A"'))).toBe(true);
    expect(lines.some((l) => l.type === 'added' && l.content.includes('"B"'))).toBe(true);
    expect(lines.some((l) => l.content.includes('"same"'))).toBe(false);
  });

  it('both sides null → empty diff', () => {
    expect(buildDiffLines({ type: 'update' })).toEqual([]);
  });
});

// ─── changesetSummary ─────────────────────────────────────────────────────────

describe('changesetSummary', () => {
  it('renders the additions/modifications/deletions sentence', () => {
    expect(changesetSummary('pr-497', { additions: 27, modifications: 7, deletions: 4 })).toBe(
      '27 additions · 7 modifications · 4 deletions in this changeset.',
    );
  });
  it('falls back to the name when stats are missing', () => {
    expect(changesetSummary('pr-497', undefined)).toBe('pr-497');
  });
});
