/**
 * c4Diff — a changeset on the C4 diagrams: element and arrow statuses, roll-up
 * to the box a diagram shows, unshown changes, and the union view that draws
 * removed things back in.
 */
import { describe, it, expect } from 'vitest';

import { C4_SYSTEM_ID, buildC4Model, c4Ancestors } from '@/apps/embedded/data/c4/c4Model';
import { diffC4, isEmptyC4Diff, unionC4, unionC4View } from '@/apps/embedded/data/c4/c4Diff';
import { EMPTY_TRACE, overlayModel } from '@/apps/embedded/data/modelOverlay';
import type { ChangeRecord } from '@/apps/embedded/data/changesets';
import {
  addElement,
  addRelationship,
  deleteElement,
  deleteRelationship,
  numbered,
  ref,
  sampleModel,
  updateElement,
} from './fixture';

const { model, n } = sampleModel();
const base = buildC4Model(model);

/** A staged changeset: the C4 model before and after it, and the diff. */
function stage(changes: ChangeRecord[]) {
  const { model: afterModel, trace } = overlayModel(model, numbered(changes), 'apply');
  const after = buildC4Model(afterModel);
  return { after, trace, diff: diffC4(base, after, trace) };
}

const MINIMAP = 'application.applicationcomponent.minimap';
const addMinimap = () => [
  addElement('application.applicationcomponent', 'Minimap', { type: 'internal' }),
  addRelationship(n.canvas, 'composes', MINIMAP),
];

describe('diffC4: nothing changed', () => {
  it('is empty for an empty changeset', () => {
    const { diff } = stage([]);
    expect(isEmptyC4Diff(diff)).toBe(true);
    expect(diff.rollUp.size).toBe(0);
  });

  it('is empty between two builds of one model, matched by sources not identity', () => {
    const diff = diffC4(base, buildC4Model(model), EMPTY_TRACE);
    expect(isEmptyC4Diff(diff)).toBe(true);
    expect(diff.unionIdOf.get(ref(n.canvas))).toBe(ref(n.canvas));
  });
});

describe('diffC4: element statuses', () => {
  it('added, with the parent whose parts changed', () => {
    const { diff } = stage(addMinimap());
    expect(diff.elements.get(MINIMAP)).toMatchObject({ status: 'added', baseId: null, afterId: MINIMAP, sequences: [1, 2] });
    expect(diff.elements.get(ref(n.canvas))).toMatchObject({ status: 'parts-changed', sequences: [2] });
    expect(diff.tally.elements.added).toBe(1);
    expect(diff.unshown).toEqual([]);
  });

  it('removed, and the arrows at it', () => {
    const { diff } = stage([deleteElement(n.tooltip)]);
    expect(diff.elements.get(ref(n.tooltip))).toMatchObject({ status: 'removed', afterId: null, sequences: [1] });
    const arrow = diff.relationships.get(`${ref(n.inspector)}>${ref(n.tooltip)}`);
    expect(arrow).toMatchObject({ status: 'removed', labels: ['uses'], sequences: [1] });
    expect(diff.elements.get(ref(n.app))?.status).toBe('parts-changed');
  });

  it('changed: its own element, or one folded onto it', () => {
    const own = stage([updateElement(n.transform, { description: 'Now with more.' })]).diff;
    expect(own.elements.get(ref(n.transform))).toMatchObject({ status: 'changed', sequences: [1] });

    const folded = stage([updateElement(n.test, { description: 'Covers more.' })]).diff;
    expect(folded.elements.get(ref(n.transform))).toMatchObject({ status: 'changed', sequences: [1] });
    expect(folded.unshown).toEqual([]);
  });

  it('matches a renamed element by its UUID: changed, not removed and added', () => {
    const { diff } = stage([updateElement(n.canvas, { name: 'Graph Canvas' })]);
    const renamed = 'application.applicationcomponent.graph-canvas';
    expect(diff.elements.get(renamed)).toMatchObject({ status: 'changed', baseId: ref(n.canvas), afterId: renamed });
    expect(diff.unionIdOf.get(ref(n.canvas))).toBe(renamed);
    expect(diff.tally.elements.added + diff.tally.elements.removed).toBe(0);
    // Its parts stay put: the parent's id changed, not the parent.
    expect(diff.elements.has(ref(n.lanes))).toBe(false);
  });

  it('moved: its parent changed, and both parents’ parts changed', () => {
    const { diff } = stage([deleteRelationship(n.shell, 'composes', n.canvas)]);
    expect(diff.elements.get(ref(n.canvas))).toMatchObject({
      status: 'moved',
      previousParentId: ref(n.shell),
      sequences: [1],
    });
    expect(diff.parentOf.get(ref(n.canvas))).toBe(ref(n.app));
    expect(diff.elements.get(ref(n.shell))).toMatchObject({ status: 'parts-changed', sequences: [1] });
  });
});

describe('diffC4: relationship statuses', () => {
  it('added, with the change behind it', () => {
    const { diff } = stage([addRelationship(n.lanes, 'uses', n.tooltip)]);
    expect(diff.relationships.get(`${ref(n.lanes)}>${ref(n.tooltip)}`)).toMatchObject({ status: 'added', sequences: [1], baseLabels: [] });
  });

  it('relabelled: a new label on an existing arrow', () => {
    const { diff } = stage([addRelationship(n.apiClient, 'uses', n.transform)]);
    const arrow = diff.relationships.get(`${ref(n.apiClient)}>${ref(n.transform)}`)!;
    expect(arrow.status).toBe('relabelled');
    expect([...arrow.labels].sort()).toEqual(['depends-on', 'uses']);
    expect(arrow.baseLabels).toEqual(['depends-on']);
    expect(arrow.sequences).toEqual([1]);
  });

  it('relinked: same label, another model link behind it', () => {
    // `serves` flips to "uses": Tooltip serves Inspector draws Inspector → Tooltip, as `uses` already does.
    const { diff } = stage([addRelationship(n.tooltip, 'serves', n.inspector)]);
    expect(diff.relationships.get(`${ref(n.inspector)}>${ref(n.tooltip)}`)).toMatchObject({ status: 'relinked', sequences: [1] });
  });
});

describe('diffC4: roll-up to the box a diagram shows', () => {
  const { diff } = stage(addMinimap());

  it('counts a change on every ancestor, so each level shows it', () => {
    for (const ancestor of c4Ancestors(base, ref(n.canvas)).slice(1)) {
      expect(diff.rollUp.get(ancestor)?.elements, ancestor).toBe(2); // Minimap and Canvas
    }
    expect(diff.rollUp.get(ref(n.canvas))).toMatchObject({ elements: 1, sequences: [1, 2] });
    // Context shows the system, Container the Viewer, Component (Viewer) Shell: each carries it.
    expect(diff.rollUp.get(C4_SYSTEM_ID)?.sequences).toEqual([1, 2]);
    expect(diff.rollUp.get(ref(n.app))?.sequences).toEqual([1, 2]);
    expect(diff.rollUp.get(ref(n.shell))?.sequences).toEqual([1, 2]);
    expect(diff.rollUp.has(ref(n.db))).toBe(false);
  });

  it('counts an arrow on the elements that hold both its ends', () => {
    const arrows = stage([addRelationship(n.lanes, 'uses', n.hive)]).diff;
    expect(arrows.rollUp.get(ref(n.canvas))).toMatchObject({ relationships: 1, sequences: [1] });
    expect(arrows.rollUp.get(ref(n.app))?.relationships).toBe(1);
    expect(arrows.rollUp.has(ref(n.lanes))).toBe(false);
  });
});

describe('diffC4: changes no diagram shows', () => {
  it('counts a change to an element no rule places', () => {
    const { diff } = stage([updateElement(n.orphan, { description: 'Worse.' }), updateElement(n.transform, { description: 'x' })]);
    expect(diff.unshown).toEqual([1]);
    expect(isEmptyC4Diff(diff)).toBe(false);
  });

  it('passes on what the overlay could not place or netted out', () => {
    const { diff } = stage([
      addRelationship('x.y.z', 'uses', n.shell),
      addRelationship(n.shell, 'uses', n.tooltip),
      deleteRelationship(n.shell, 'uses', n.tooltip),
    ]);
    expect(diff.unresolved).toEqual([1]);
    expect(diff.netted).toEqual([2, 3]);
    expect(diff.relationships.size).toBe(0);
  });
});

describe('diffC4: staged and applied read the same', () => {
  it('gives one diff for a changeset applied forward or reverted from the applied model', () => {
    const changes = numbered([
      ...addMinimap(),
      deleteRelationship(n.inspector, 'uses', n.tooltip),
      deleteElement(n.tooltip),
      updateElement(n.transform, { name: 'Graph Transform' }),
    ]);
    const forward = overlayModel(model, changes, 'apply');
    const staged = diffC4(base, buildC4Model(forward.model), forward.trace);

    const appliedC4 = buildC4Model(forward.model);
    const backward = overlayModel(forward.model, changes, 'revert');
    const applied = diffC4(buildC4Model(backward.model), appliedC4, backward.trace);

    const statuses = (d: typeof staged) => [...d.elements.values()].map((e) => `${e.id}:${e.status}:${e.sequences}`).sort();
    expect(statuses(applied)).toEqual(statuses(staged));
    expect([...applied.relationships.keys()].sort()).toEqual([...staged.relationships.keys()].sort());
    expect(staged.relationships.get(`${ref(n.inspector)}>${ref(n.tooltip)}`)?.status).toBe('removed');
  });

  it('cannot bring back links an applied delete took without a change of their own', () => {
    // The changeset records the element delete only; its links went with it at commit.
    const changes = numbered([deleteElement(n.tooltip)]);
    const applied = overlayModel(model, changes, 'apply').model;
    const reverted = overlayModel(applied, changes, 'revert');
    const diff = diffC4(buildC4Model(reverted.model), buildC4Model(applied), reverted.trace);
    expect(diff.elements.get(ref(n.tooltip))?.status).toBe('removed');
    expect(diff.relationships.size).toBe(0);
  });
});

describe('unionC4 and unionC4View', () => {
  it('is the after model itself when nothing was removed', () => {
    const { after, diff } = stage(addMinimap());
    expect(unionC4(base, after, diff)).toBe(after);
  });

  it('draws a removed element back in under its base parent, with its arrows', () => {
    const { after, diff } = stage([deleteElement(n.tooltip)]);
    const union = unionC4(base, after, diff);
    expect(union.byId.get(ref(n.tooltip))?.parentId).toBe(ref(n.app));
    expect(union.childrenOf.get(ref(n.app))).toContain(ref(n.tooltip));
    expect(union.relationships.some((r) => r.id === `${ref(n.inspector)}>${ref(n.tooltip)}`)).toBe(true);

    // On the Viewer's Component diagram the arrow is lifted to Shell → Tooltip, and removed.
    const view = unionC4View(base, after, diff, 'component', ref(n.app));
    expect(view.elements.map((e) => e.id)).toContain(ref(n.tooltip));
    expect(view.relationshipDiff.get(`${ref(n.shell)}>${ref(n.tooltip)}`)).toMatchObject({ status: 'removed', sequences: [1] });
  });

  it('marks a lifted arrow relinked when only the links behind it change', () => {
    const { after, diff } = stage([addRelationship(n.lanes, 'uses', n.tooltip)]);
    const view = unionC4View(base, after, diff, 'component', ref(n.app));
    // Lanes → Tooltip and Inspector → Tooltip both lift to Shell → Tooltip.
    expect(view.relationshipDiff.get(`${ref(n.shell)}>${ref(n.tooltip)}`)).toMatchObject({ status: 'relinked', sequences: [1] });
    const inner = unionC4View(base, after, diff, 'component', ref(n.canvas));
    expect(inner.relationshipDiff.get(`${ref(n.lanes)}>${ref(n.tooltip)}`)).toMatchObject({ status: 'added', baseLabels: [] });
  });

  it('opens a removed container as a ghost scope', () => {
    const { after, diff } = stage([deleteElement(n.shell)]);
    const view = unionC4View(base, after, diff, 'component', ref(n.app));
    expect(diff.elements.get(ref(n.shell))?.status).toBe('removed');
    expect(view.elements.map((e) => e.id)).toContain(ref(n.shell));
  });

  it('is the plain view for an unchanged model', () => {
    const view = unionC4View(base, base, diffC4(base, base, EMPTY_TRACE), 'container');
    expect(view.relationshipDiff.size).toBe(0);
    expect(view.scope?.id).toBe(C4_SYSTEM_ID);
  });
});
