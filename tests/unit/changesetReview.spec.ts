/**
 * changesetReview.spec.ts — the pure review model: grouping by review weight,
 * cancel-out pairs, effective decisions (revised after the decision), the drop
 * cascade, the since-review diff, the apply plan and commit body.
 */

import { describe, it, expect } from 'vitest';

import {
  buildReviewModel,
  cancelPairs,
  cascadeOfDrops,
  changedPaths,
  groupReviewItems,
  kindCountsLabel,
  landedByLayer,
  nameFromId,
  originLabel,
  reviewHeadline,
  toReviewItems,
  type ChangesetReview,
  type UnstagedChange,
} from '@/apps/embedded/data/changesetReview';
import { LAYER_ORDER } from '@/apps/embedded/ui/domain';
import type { ChangeRecord } from '@/apps/embedded/data/changesets';
import changesetDetail from '../fixtures/changeset-detail.json';

const FIXTURE = changesetDetail.changes as ChangeRecord[];

function el(seq: number, type: string, elementId: string, extra: Partial<ChangeRecord> = {}): ChangeRecord {
  const layer = elementId.split('.')[0];
  const name = nameFromId(elementId);
  const obj = { name, type: elementId.split('.')[1], layer_id: layer, description: `${name} desc` };
  return {
    type,
    elementId,
    layerName: layer,
    sequenceNumber: seq,
    ...(type === 'add' ? { after: obj } : {}),
    ...(type === 'delete' ? { before: obj } : {}),
    ...extra,
  };
}

function rel(seq: number, type: 'relationship-add' | 'relationship-delete', source: string, predicate: string, target: string): ChangeRecord {
  const body = { source, target, predicate };
  return {
    type,
    elementId: `${source}::${predicate}::${target}`,
    layerName: source.split('.')[0],
    sequenceNumber: seq,
    ...(type === 'relationship-add' ? { after: body } : { before: body }),
  };
}

const A = 'application.applicationservice.alpha';
const B = 'application.applicationservice.beta';
const C = 'application.applicationservice.gamma';

describe('cancelPairs', () => {
  it('pairs the fixture’s four link adds that a later link delete removes', () => {
    const pairs = cancelPairs(FIXTURE);
    expect(pairs.map((p) => [p.addSeq, p.deleteSeq])).toEqual([
      [21, 34],
      [24, 35],
      [25, 36],
      [33, 37],
    ]);
  });

  it('folds an element add, its updates and its delete together', () => {
    const changes = [el(0, 'add', A), el(1, 'update', A, { before: { name: 'x' }, after: { name: 'y' } }), el(2, 'delete', A)];
    const [pair] = cancelPairs(changes);
    expect(pair).toMatchObject({ addSeq: 0, deleteSeq: 2, betweenSeqs: [1], elementId: A });
  });

  it('leaves a delete of a model element (no earlier add) alone', () => {
    expect(cancelPairs([el(0, 'delete', A)])).toEqual([]);
  });
});

describe('toReviewItems', () => {
  const pairs = cancelPairs(FIXTURE);
  const items = toReviewItems(FIXTURE, pairs);

  it('leaves the cancelled pairs out', () => {
    expect(items).toHaveLength(38 - 8);
    expect(items.map((i) => i.seq)).not.toContain(21);
    expect(items.map((i) => i.seq)).not.toContain(37);
  });

  it('weighs updates routine, adds new elements, link adds new links', () => {
    const byWeight = (w: string) => items.filter((i) => i.weight === w).map((i) => i.seq);
    expect(byWeight('routine')).toEqual([0, 13, 14, 15, 16, 17, 18]);
    expect(byWeight('add')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(byWeight('link')).toEqual([19, 20, 22, 23, 26, 27, 28, 29, 30, 31, 32]);
  });

  it('names the changed field and flags a type-only change', () => {
    const seq0 = items.find((i) => i.seq === 0)!;
    expect(seq0.fields).toEqual(['attributes.droppedAttributesCount']);
    expect(seq0.chips).toContain('type only');
    expect(seq0.summary).toBe('"0" → 0');
    const seq13 = items.find((i) => i.seq === 13)!;
    expect(seq13.fields).toEqual(['description']);
    expect(seq13.summary).toBe('rewritten');
  });

  it('marks link ends new to the changeset', () => {
    expect(items.find((i) => i.seq === 19)!.chips).toEqual(['both ends new']);
    expect(items.find((i) => i.seq === 20)!.chips).toEqual(['new target']);
    expect(items.find((i) => i.seq === 27)!.chips).toEqual(['new source']);
  });

  it('counts the links each new element gets (cancelled ones excluded)', () => {
    expect(items.find((i) => i.seq === 1)!.chips).toEqual(['2 links']);
    expect(items.find((i) => i.seq === 12)!.chips).toEqual(['1 link']);
  });

  it('puts a delete with blockers in Blocked deletes, one without in Removals', () => {
    const blockers = [{ relationshipId: `${B}::serves::${A}`, direction: 'in' as const, otherElementId: B, predicate: 'serves' }];
    const out = toReviewItems([el(0, 'delete', A, { blockers }), el(1, 'delete', C)], []);
    expect(out.map((i) => i.weight)).toEqual(['blocked', 'removal']);
    expect(out[0].chips).toContain('1 link still use it');
  });

  it('keeps an identity-changing update out of the bulk keep', () => {
    const out = toReviewItems(
      [el(0, 'update', A, { before: { name: 'Alpha' }, after: { name: 'Alpha 2' } })],
      [],
    );
    expect(out[0].bulkEligible).toBe(false);
    expect(out[0].chips).toContain('renamed');
  });
});

describe('changedPaths', () => {
  it('ignores metadata, id and path', () => {
    expect(changedPaths({ id: 1, metadata: { v: 1 }, description: 'a' }, { id: 2, metadata: { v: 2 }, description: 'a' })).toEqual([]);
  });
});

describe('buildReviewModel', () => {
  it('tallies decisions and is not ready while changes are undecided', () => {
    const review: ChangesetReview = { decisions: { '0': { verdict: 'keep' }, '1': { verdict: 'ask', note: 'why?' } } };
    const m = buildReviewModel({ changes: FIXTURE, review });
    expect(m.tally).toMatchObject({ total: 30, kept: 1, asked: 1, undecided: 28, decided: 2 });
    expect(m.ready).toBe(false);
    expect(reviewHeadline(m.tally)).toBe('28 of 30 need a decision');
  });

  it('is ready once every change is kept or dropped, and sends no body when nothing is dropped', () => {
    const decisions = Object.fromEntries(
      buildReviewModel({ changes: FIXTURE }).items.map((i) => [String(i.seq), { verdict: 'keep' as const }]),
    );
    const m = buildReviewModel({ changes: FIXTURE, review: { decisions } });
    expect(m.ready).toBe(true);
    expect(m.apply.body).toBeUndefined();
    expect(m.apply.landing).toHaveLength(30);
    expect(reviewHeadline(m.tally)).toBe('Every change has a decision');
  });

  it('cascades a dropped add to its links and updates, and drops only the explicit seq in the body', () => {
    // seq 7 adds RelationshipType; seq 32 links it (extends Relationship).
    const decisions = Object.fromEntries(
      buildReviewModel({ changes: FIXTURE }).items.map((i) => [String(i.seq), { verdict: 'keep' as const }]),
    );
    decisions['7'] = { verdict: 'drop', note: 'compat enum' } as never;
    const m = buildReviewModel({ changes: FIXTURE, review: { decisions } });
    expect(m.stateOf(7)).toBe('drop');
    expect(m.stateOf(32)).toBe('cascaded');
    expect(m.tally).toMatchObject({ dropped: 1, cascaded: 1, undecided: 0 });
    expect(m.apply.body).toEqual({ drop: [7] });
    expect(m.apply.dropped.map((d) => [d.item.seq, d.note, d.cascadedBy?.seq])).toEqual([
      [7, 'compat enum', undefined],
      [32, undefined, 7],
    ]);
    expect(m.apply.landing).toHaveLength(28);
  });

  it('a cascaded change needs no decision of its own', () => {
    const m = buildReviewModel({ changes: [el(0, 'add', A), rel(1, 'relationship-add', A, 'serves', B)], review: { decisions: { '0': { verdict: 'drop' } } } });
    expect(m.tally.undecided).toBe(0);
    expect(m.ready).toBe(false); // nothing would land
  });

  it('sends kept blocked deletes as deleteBlockedLinks and counts their links', () => {
    const blockers = [
      { relationshipId: `${B}::serves::${A}`, direction: 'in' as const, otherElementId: B, predicate: 'serves' },
      { relationshipId: `${A}::uses::${C}`, direction: 'out' as const, otherElementId: C, predicate: 'uses' },
    ];
    const m = buildReviewModel({
      changes: [el(3, 'delete', A, { blockers })],
      review: { decisions: { '3': { verdict: 'keep' } } },
    });
    expect(m.apply.body).toEqual({ deleteBlockedLinks: [3] });
    expect(m.apply.linksDeleted).toBe(2);
  });

  it('ignores a decision on a change revised after it', () => {
    const unstaged: UnstagedChange[] = [{ sequence: 0, removedAt: 12, rewritten: true, change: el(0, 'add', A) }];
    const review: ChangesetReview = { decisions: { '0': { verdict: 'keep', atRevision: 10 } }, lastReviewedRevision: 10 };
    const m = buildReviewModel({ changes: [el(0, 'add', A)], unstaged, review });
    expect(m.stateOf(0)).toBe('undecided');
    // ...but a decision made after the rewrite counts.
    const later = buildReviewModel({
      changes: [el(0, 'add', A)],
      unstaged,
      review: { decisions: { '0': { verdict: 'keep', atRevision: 13 } }, lastReviewedRevision: 13 },
    });
    expect(later.stateOf(0)).toBe('keep');
  });

  it('names link ends from the changeset’s own adds when the model lacks them', () => {
    const m = buildReviewModel({
      changes: [el(0, 'add', A, { after: { name: 'Real Alpha', type: 'applicationservice' } }), rel(1, 'relationship-add', A, 'serves', B)],
      nameOf: (id) => (id === B ? 'Model Beta' : undefined),
    });
    expect(m.bySeq.get(1)!.summary).toBe('Real Alpha serves Model Beta');
  });
});

describe('revisionDiff (via buildReviewModel)', () => {
  const changes = [
    el(0, 'add', A),
    el(1, 'add', B),
    rel(5, 'relationship-add', A, 'serves', B),
    el(6, 'add', C),
  ];
  const unstaged: UnstagedChange[] = [
    { sequence: 1, removedAt: 6, rewritten: true, change: el(1, 'add', B) },
    { sequence: 2, removedAt: 6, change: rel(2, 'relationship-add', B, 'uses', A) },
    { sequence: 3, removedAt: 4, change: el(3, 'add', 'application.applicationservice.old') },
  ];
  const review: ChangesetReview = {
    decisions: {
      '0': { verdict: 'keep', atRevision: 5 },
      '1': { verdict: 'ask', atRevision: 5, note: 'rename it' },
      '2': { verdict: 'drop', atRevision: 5 },
    },
    lastReviewedRevision: 5,
  };

  it('splits revised, new, withdrawn and carried over', () => {
    const { diff } = buildReviewModel({ changes, unstaged, review });
    expect(diff).not.toBeNull();
    expect(diff!.since).toBe(5);
    expect(diff!.revised.map((r) => [r.item.seq, r.earlier?.verdict])).toEqual([[1, 'ask']]);
    expect(diff!.added.map((i) => i.seq)).toEqual([5, 6]);
    expect(diff!.withdrawn.map((w) => [w.tombstone.sequence, w.decision?.verdict])).toEqual([[2, 'drop']]);
    expect(diff!.carried.map((i) => i.seq)).toEqual([0]);
    expect(diff!.changedCount).toBe(4);
  });

  it('is null before any review', () => {
    expect(buildReviewModel({ changes }).diff).toBeNull();
  });

  it('the Since filter shows only revised and new changes', () => {
    const m = buildReviewModel({ changes, unstaged, review });
    const groups = groupReviewItems(m, 'sequence', 'since');
    expect(groups[0].items.map((i) => i.seq)).toEqual([1, 5, 6]);
  });
});

describe('groupReviewItems', () => {
  const m = buildReviewModel({ changes: FIXTURE, review: { decisions: { '13': { verdict: 'keep' } } } });

  it('groups by review weight with a bulk keep over the undecided routine updates', () => {
    const groups = groupReviewItems(m, 'weight', 'all');
    expect(groups.map((g) => g.title)).toEqual(['Routine', 'New elements', 'New links']);
    expect(groups[0].bulkSeqs).toEqual([0, 14, 15, 16, 17, 18]);
  });

  it('filters to Needs decision and Decided', () => {
    const needs = groupReviewItems(m, 'sequence', 'needs')[0].items.map((i) => i.seq);
    expect(needs).not.toContain(13);
    expect(groupReviewItems(m, 'sequence', 'decided')[0].items.map((i) => i.seq)).toEqual([13]);
  });

  it('groups by layer in layer order', () => {
    const groups = groupReviewItems(m, 'layer', 'all', LAYER_ORDER);
    expect(groups.map((g) => g.layerId)).toEqual(['application', 'data-model', 'apm']);
  });
});

describe('labels', () => {
  it('kindCountsLabel leaves zeros out', () => {
    expect(kindCountsLabel({ add: 2, update: 0, delete: 0, 'link-add': 3, 'link-delete': 1 })).toBe(
      '2 add · 3 link add · 1 link delete',
    );
  });

  it('originLabel', () => {
    expect(originLabel({ kind: 'chat', detail: 'Sync PR' })).toBe('staged by DrBot · from chat "Sync PR"');
    expect(originLabel(undefined)).toBeUndefined();
  });

  it('landedByLayer counts per layer', () => {
    const m = buildReviewModel({ changes: FIXTURE });
    const apm = landedByLayer(m.items).find((l) => l.layerId === 'apm')!;
    expect(apm.counts.update).toBe(1);
  });

  it('cascadeOfDrops is empty without dropped adds', () => {
    const items = toReviewItems(FIXTURE, cancelPairs(FIXTURE));
    expect(cascadeOfDrops(items, new Set([13])).size).toBe(0);
  });
});
