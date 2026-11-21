/**
 * modelOverlay — the model with a changeset applied (staged) or reversed
 * (applied), netted in change order, over the C4 tests' hand-built model.
 */
import { describe, it, expect } from 'vitest';
import {
  EMPTY_TRACE,
  invertChanges,
  modelOverlay,
  overlayModel,
} from '@/apps/embedded/data/modelOverlay';
import { buildModelIndex, dottedId, resolveEndpoint } from '@/apps/embedded/data/modelGraph';
import type { ModelDerived } from '@/apps/embedded/data/useModel';
import {
  addElement,
  addRelationship,
  deleteElement,
  deleteRelationship,
  derive,
  link,
  node,
  numbered,
  sampleModel,
  updateElement,
} from './c4/fixture';

const { model, n } = sampleModel();

/** A comparable picture of a model: nodes by id with their fields, links by resolved ends. */
function snapshot(m: ModelDerived) {
  const index = buildModelIndex(m);
  const nodes = m.nodes
    .map((x) => `${x.id}|${x.layer_id}.${x.type}|${x.name}|${x.description ?? ''}|${JSON.stringify(x.attributes ?? {})}`)
    .sort();
  const links = m.links
    .map((l) => `${resolveEndpoint(index, l.source)?.id}|${l.type}|${resolveEndpoint(index, l.target)?.id}`)
    .sort();
  return { nodes, links };
}

const staged = () =>
  numbered([
    addElement('application.applicationcomponent', 'Minimap', { type: 'internal' }),
    addRelationship(n.canvas, 'composes', 'application.applicationcomponent.minimap'),
    updateElement(n.transform, { name: 'Graph Transform', description: 'Renamed.' }),
    deleteElement(n.orphan),
    deleteRelationship(n.inspector, 'uses', n.tooltip),
    addRelationship(n.lanes, 'uses', n.tooltip),
  ]);

describe('modelOverlay: nothing to do', () => {
  it('returns the model itself for no changes, so caches keyed on model.nodes still hit', () => {
    expect(modelOverlay(model, undefined, 'apply')).toBe(model);
    expect(modelOverlay(model, [], 'revert')).toBe(model);
    expect(overlayModel(model, [], 'apply').trace).toBe(EMPTY_TRACE);
  });

  it('returns the model itself when every change nets out, and says which did', () => {
    const changes = numbered([
      addElement('application.applicationcomponent', 'Scratch'),
      addRelationship(n.shell, 'uses', n.tooltip),
      deleteRelationship(n.shell, 'uses', n.tooltip),
      deleteElement({ ...n.shell, id: 'new:Scratch', name: 'Scratch' }),
    ]);
    const result = overlayModel(model, changes, 'apply');
    expect(result.model).toBe(model);
    expect(result.trace.netted).toEqual([1, 2, 3, 4]);
    expect(result.trace.changes).toEqual([]);
  });
});

describe('modelOverlay: apply', () => {
  const result = overlayModel(model, staged(), 'apply');
  const after = result.model;
  const index = buildModelIndex(after);

  it('adds, updates and deletes elements, with fresh arrays and derived counts', () => {
    expect(after).not.toBe(model);
    expect(after.nodes).not.toBe(model.nodes);
    expect(index.byUuid.get('new:Minimap')).toMatchObject({ name: 'Minimap', layer_id: 'application', type: 'applicationcomponent' });
    expect(index.byUuid.get(n.transform.id)).toMatchObject({ name: 'Graph Transform', description: 'Renamed.' });
    expect(index.byUuid.has(n.orphan.id)).toBe(false);
    expect(after.nodes).toHaveLength(model.nodes.length);
    expect(after.countsByLayer.application).toBe(model.countsByLayer.application + 1);
    expect(after.relCount).toBe(after.links.length);
  });

  it('adds and deletes relationships, resolving ends by dotted id and by the ids the changeset adds', () => {
    const keys = snapshot(after).links;
    expect(keys).toContain(`${n.canvas.id}|composes|new:Minimap`);
    expect(keys).toContain(`${n.lanes.id}|uses|${n.tooltip.id}`);
    expect(keys).not.toContain(`${n.inspector.id}|uses|${n.tooltip.id}`);
  });

  it('traces each change to the elements and links it touches', () => {
    const bySeq = new Map(result.trace.changes.map((c) => [c.sequence, c]));
    expect(bySeq.get(1)).toMatchObject({ kind: 'element', nodeIds: ['new:Minimap'] });
    expect(bySeq.get(2)).toMatchObject({ kind: 'relationship', nodeIds: [n.canvas.id, 'new:Minimap'] });
    expect(bySeq.get(2)!.linkIds).toHaveLength(1);
    // A deleted relationship is traced to the model link it removes.
    expect(bySeq.get(5)!.linkIds).toEqual([link(n.inspector, 'uses', n.tooltip).id]);
    expect(result.trace.unresolved).toEqual([]);
  });

  it('drops the links of a deleted element', () => {
    const withLink = derive([...model.nodes], [...model.links, link(n.orphan, 'threatens', n.shell)]);
    const out = modelOverlay(withLink, [deleteElement(n.orphan)], 'apply');
    expect(out.links.some((l) => l.source === n.orphan.id || l.target === n.orphan.id)).toBe(false);
  });

  it('keeps a link that names a renamed element by its dotted id', () => {
    const a = node('application.applicationcomponent', 'Alpha');
    const b = node('application.applicationcomponent', 'Beta');
    const m = derive([a, b], [{ id: 'l1', source: dottedId(a), target: dottedId(b), type: 'uses' }]);
    const out = modelOverlay(m, [updateElement(a, { name: 'Alpha Prime' })], 'apply');
    const idx = buildModelIndex(out);
    expect(resolveEndpoint(idx, out.links[0].source)?.name).toBe('Alpha Prime');
  });

  it('counts changes it cannot place', () => {
    const out = overlayModel(
      model,
      numbered([updateElement({ ...n.shell, id: 'nope', name: 'No Such Thing' }, { description: 'x' }), addRelationship('x.y.z', 'uses', n.shell)]),
      'apply',
    );
    expect(out.trace.unresolved).toEqual([1, 2]);
    expect(out.model).toBe(model);
  });

  it('nets in sequence order, not the order given', () => {
    const add = addElement('application.applicationcomponent', 'Scratch', {}, 1);
    const del = { ...deleteElement({ ...n.shell, id: 'new:Scratch', name: 'Scratch' }), sequenceNumber: 2 };
    expect(modelOverlay(model, [del, add], 'apply')).toBe(model);
  });
});

describe('modelOverlay: revert', () => {
  it('is the inverse of apply: applying then reverting gives the model back', () => {
    const changes = staged();
    const applied = modelOverlay(model, changes, 'apply');
    expect(snapshot(modelOverlay(applied, changes, 'revert'))).toEqual(snapshot(model));
  });

  it('brings a deleted element back from its before, with its UUID', () => {
    const changes = numbered([deleteElement(n.orphan)]);
    const applied = modelOverlay(model, changes, 'apply');
    const reverted = modelOverlay(applied, changes, 'revert');
    expect(buildModelIndex(reverted).byUuid.get(n.orphan.id)?.name).toBe('Token Theft');
  });

  it('inverts in reverse order, keeping each sequence', () => {
    const inverse = invertChanges(staged());
    expect(inverse.map((c) => c.sequenceNumber)).toEqual([6, 5, 4, 3, 2, 1]);
    expect(inverse.map((c) => c.type)).toEqual([
      'relationship-delete',
      'relationship-add',
      'add',
      'update',
      'relationship-delete',
      'delete',
    ]);
    expect(inverse[3].after).toMatchObject({ name: 'Transform' });
  });
});
