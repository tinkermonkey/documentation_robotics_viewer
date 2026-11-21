import { describe, expect, it } from 'vitest';
import {
  baseChangeCountsLabel,
  baseChangesByLayer,
  driftBlocksCommit,
  driftTone,
  overlapReasonLabel,
  toDrift,
  toDriftSummary,
} from '@/apps/embedded/data/changesetDrift';

const DRIFTED = {
  state: 'drifted',
  blocksCommit: true,
  message: 'The base model changed since this changeset was created, so a commit is refused for drift.',
};

describe('changesetDrift', () => {
  it('reads the summary and drops a malformed drift', () => {
    expect(toDriftSummary(DRIFTED)).toEqual(DRIFTED);
    // A missing message gets a plain one, never a crash.
    expect(toDriftSummary({ state: 'unknown', blocksCommit: false })?.message).toMatch(/could not be checked/);
    expect(toDriftSummary({ state: 'sideways', blocksCommit: false, message: 'x' })).toBeUndefined();
    expect(toDriftSummary({ state: 'drifted', blocksCommit: 'yes', message: 'x' })).toBeUndefined();
    expect(toDriftSummary(['drifted'])).toBeUndefined();
    expect(toDriftSummary('drifted')).toBeUndefined();
    expect(toDrift({ blocksCommit: true })).toBeUndefined();
  });

  it('reads a missing blocksCommit (deprecated) as false, but drops a non-boolean one', () => {
    expect(toDriftSummary({ state: 'drifted', message: 'm' })).toEqual({ state: 'drifted', blocksCommit: false, message: 'm' });
    expect(driftTone(toDriftSummary({ state: 'drifted', message: 'm' }))).toBe('overlaps');
    expect(toDrift({ state: 'content-free', message: 'm' })?.blocksCommit).toBe(false);
    expect(toDriftSummary({ state: 'drifted', blocksCommit: null, message: 'm' })).toBeUndefined();
    expect(toDriftSummary({ state: 'drifted', blocksCommit: 'false', message: 'm' })).toBeUndefined();
    // The fallback message takes no side on whether a commit is refused (it depends on the CLI).
    expect(toDriftSummary({ state: 'drifted' })?.message).not.toMatch(/refuse/);
  });

  it('reads no drift from an older dr CLI', () => {
    expect(toDriftSummary(undefined)).toBeUndefined();
    expect(toDrift(undefined)).toBeUndefined();
    expect(toDrift(null)).toBeUndefined();
    expect(driftTone(undefined)).toBeUndefined();
    expect(driftBlocksCommit(undefined)).toBe(false);
  });

  it("keeps the detail's overlaps and base changes, dropping malformed entries", () => {
    const drift = toDrift({
      ...DRIFTED,
      warnings: ['Overlaps: 1 element.', 7, ''],
      baseIndex: 'recorded',
      overlapping: {
        elements: [
          { id: 'application.applicationservice.use-changesets', reason: 'changed-in-base' },
          { id: 'data-model.objectschema.gone', reason: 'removed-in-base' },
          { id: 'x', reason: 'made-up' },
          { id: 'y', reason: 5 },
          'nope',
        ],
        relationships: [
          { source: 'a.b.c', predicate: 'serves', target: 'd.e.f', reason: 'endpoint-removed-in-base', endpoints: ['d.e.f', 3] },
          { source: 'a.b.c', predicate: 'serves', reason: 'already-in-base' },
        ],
      },
      baseChanges: {
        counts: { elementsAdded: 2, elementsRemoved: -1, elementsChanged: 61, relationshipsAdded: 1, relationshipsRemoved: 'x' },
        elementsAdded: ['api.operation.one', 'api.operation.two'],
        elementsRemoved: [],
        elementsChanged: ['application.applicationservice.use-changesets', 4],
        relationshipsAdded: [{ source: 'a.b.c', predicate: 'serves', target: 'd.e.f' }, { source: 'a' }],
        relationshipsRemoved: 'nope',
        layers: ['api', 'application', 'data-model'],
        truncated: true,
      },
    });
    expect(drift?.warnings).toEqual(['Overlaps: 1 element.']);
    expect(drift?.baseIndex).toBe('recorded');
    expect(drift?.overlapping).toEqual({
      // A reason this viewer doesn't know (a newer CLI) is kept, not dropped: a blocking drift never lists nothing.
      elements: [
        { id: 'application.applicationservice.use-changesets', reason: 'changed-in-base' },
        { id: 'data-model.objectschema.gone', reason: 'removed-in-base' },
        { id: 'x', reason: 'made-up' },
      ],
      relationships: [
        { source: 'a.b.c', predicate: 'serves', target: 'd.e.f', reason: 'endpoint-removed-in-base', endpoints: ['d.e.f'] },
      ],
    });
    expect(overlapReasonLabel('removed-in-base')).toBe('the base removed it');
    expect(overlapReasonLabel('linked-in-base')).toMatch(/linked it since/);
    expect(overlapReasonLabel('endpoint-changed-in-base')).toBe('the base changed an end');
    expect(overlapReasonLabel('made-up')).toBe('made-up');
    expect(overlapReasonLabel('toString')).toBe('toString');
    const changes = drift!.baseChanges!;
    expect(changes.counts).toEqual({ elementsAdded: 2, elementsRemoved: 0, elementsChanged: 61, relationshipsAdded: 1, relationshipsRemoved: 0 });
    expect(changes.elementsChanged).toEqual(['application.applicationservice.use-changesets']);
    expect(changes.relationshipsAdded).toHaveLength(1);
    expect(changes.relationshipsRemoved).toEqual([]);
    expect(changes.truncated).toBe(true);
    expect(baseChangeCountsLabel(changes)).toBe('elements: 2 added, 61 changed · links: 1 added');
    // In the server's layer order; a layer only links changed in has no element count.
    expect(baseChangesByLayer(changes)).toEqual([
      { layer: 'api', count: 2 },
      { layer: 'application', count: 1 },
      { layer: 'data-model', count: 0 },
    ]);
    // No base index: no baseChanges, and the summary still reads.
    expect(toDrift({ ...DRIFTED, baseIndex: 'not-recorded' })).toEqual({ ...DRIFTED, baseIndex: 'not-recorded' });
  });

  it('tells a blocking drift from a quiet note and an unchecked one', () => {
    expect(driftTone(toDriftSummary(DRIFTED))).toBe('blocks');
    expect(driftBlocksCommit(toDriftSummary(DRIFTED))).toBe(true);
    expect(driftTone({ state: 'content-free', blocksCommit: false, message: 'm' })).toBe('quiet');
    expect(driftTone({ state: 'unknown', blocksCommit: false, message: 'm' })).toBe('unchecked');
    expect(driftTone({ state: 'not-applicable', blocksCommit: false, message: 'm' })).toBe('settled');
    expect(driftTone({ state: 'none', blocksCommit: false, message: 'm' })).toBeUndefined();
    expect(driftBlocksCommit({ state: 'content-free', blocksCommit: false, message: 'm' })).toBe(false);
  });

  it('reads a newer dr CLI: consequence and resolve per overlap, notChecked, the page; drifted lands over its overlaps', () => {
    const NEWER = { state: 'drifted', blocksCommit: false, message: 'The base changed under 1 staged change.' };
    const drift = toDrift({
      ...NEWER,
      overlapping: {
        elements: [
          { id: 'a.b.c', reason: 'changed-in-base', consequence: 'Landing overwrites the base edit.', resolve: 'Restage the update.' },
          { id: 'a.b.d', reason: 'changed-in-base', consequence: '', resolve: 7 },
        ],
        relationships: [
          { source: 'a.b.c', predicate: 'serves', target: 'd.e.f', reason: 'already-in-base', consequence: 'Nothing is added.', resolve: 'Unstage it.' },
        ],
      },
      notChecked: { elements: ['x.y.z', 3], relationships: 2, sentence: '1 element and 2 links could not be checked.' },
      baseChanges: {
        counts: { elementsAdded: 3, elementsRemoved: 0, elementsChanged: 0, relationshipsAdded: 0, relationshipsRemoved: 0 },
        elementsAdded: ['api.operation.one'],
        elementsRemoved: [],
        elementsChanged: [],
        relationshipsAdded: [],
        relationshipsRemoved: [],
        layers: ['api'],
        truncated: true,
        page: {
          offset: 0,
          limit: 1,
          totals: { elementsAdded: 3, elementsRemoved: 0, elementsChanged: 0, relationshipsAdded: 0, relationshipsRemoved: 0 },
          returned: { elementsAdded: 1, elementsRemoved: 0, elementsChanged: 0, relationshipsAdded: 0, relationshipsRemoved: 0 },
          nextOffset: 1,
          more: 'Read on with driftOffset 1.',
        },
      },
    });
    expect(drift?.overlapping).toEqual({
      elements: [
        { id: 'a.b.c', reason: 'changed-in-base', consequence: 'Landing overwrites the base edit.', resolve: 'Restage the update.' },
        // Empty or non-string explanations are dropped; the overlap stays.
        { id: 'a.b.d', reason: 'changed-in-base' },
      ],
      relationships: [
        { source: 'a.b.c', predicate: 'serves', target: 'd.e.f', reason: 'already-in-base', consequence: 'Nothing is added.', resolve: 'Unstage it.' },
      ],
    });
    expect(drift?.notChecked).toEqual({ elements: ['x.y.z'], relationships: 2, sentence: '1 element and 2 links could not be checked.' });
    expect(drift?.baseChanges?.page).toMatchObject({ offset: 0, limit: 1, nextOffset: 1, more: 'Read on with driftOffset 1.' });
    expect(drift?.baseChanges?.page?.totals.elementsAdded).toBe(3);
    // A malformed page or notChecked is dropped, the rest kept.
    const odd = toDrift({ ...NEWER, notChecked: { elements: [] }, baseChanges: { ...drift!.baseChanges!, page: { offset: 'x' } } });
    expect(odd?.notChecked).toBeUndefined();
    expect(odd?.baseChanges && 'page' in odd.baseChanges).toBe(false);
    expect(odd?.baseChanges?.elementsAdded).toEqual(['api.operation.one']);
    // Drifted that doesn't block (blocksCommit is always false now): it lands over its overlaps.
    expect(driftTone(toDriftSummary(NEWER))).toBe('overlaps');
    expect(driftBlocksCommit(toDriftSummary(NEWER))).toBe(false);
  });
});
