// @vitest-environment happy-dom
/**
 * changesetImpact.spec.ts — the Changesets Impact tab's data: the changeset laid
 * over the model, its changed elements as reach origins, and the reached
 * subgraph + per-layer blast radius. Real fixtures: this repo's model and the
 * pr-497 changeset (12 element adds, 7 updates, 15 relationship adds, 4
 * relationship deletes — every element it names is in the model fixture).
 */
import { describe, it, expect } from 'vitest';
import { changesetImpact, EMPTY_IMPACT, netOp } from '@/apps/embedded/data/changesetImpact';
import { buildModelIndex } from '@/apps/embedded/data/modelGraph';
import { LAYER_ORDER } from '@/apps/embedded/ui/domain';
import type { ChangeRecord } from '@/apps/embedded/data/changesets';
import type { ModelDerived, ModelNode, ModelLink } from '@/apps/embedded/data/useModel';
import modelFixture from '../fixtures/model.json';
import changesetFixture from '../fixtures/changeset-detail.json';

interface RawModel {
  nodes: ModelNode[];
  links: ModelLink[];
}
const raw = modelFixture as unknown as RawModel;
const model: ModelDerived = {
  nodes: raw.nodes,
  links: raw.links,
  countsByLayer: {},
  nodesByLayer: {},
  relCount: raw.links.length,
};
const index = buildModelIndex(model);
const changes = changesetFixture.changes as unknown as ChangeRecord[];
const uuidOf = (dotted: string) => index.byEndpoint.get(dotted)!.id;

describe('changesetImpact — origins', () => {
  it('is empty without changes or without a model', () => {
    expect(changesetImpact(model, [], 1)).toBe(EMPTY_IMPACT);
    expect(changesetImpact(model, undefined, 1)).toBe(EMPTY_IMPACT);
    expect(
      changesetImpact({ ...model, nodes: [], links: [] }, changes, 1),
    ).toBe(EMPTY_IMPACT);
  });

  it('marks every changed element with its op, and relationship ends as relink', () => {
    const impact = changesetImpact(model, changes, 1);
    const ops = [...impact.opOf.values()];
    expect(ops.filter((o) => o === 'add')).toHaveLength(12);
    expect(ops.filter((o) => o === 'update')).toHaveLength(7);
    expect(impact.unresolved).toBe(0);

    // An element the changeset only re-wires is `relink`; its own change wins otherwise.
    const relinked = uuidOf('application.applicationservice.embedded-data-loader');
    expect(impact.opOf.get(relinked)).toBe('relink');
    const added = uuidOf('application.applicationservice.relationships-yaml-parser');
    expect(impact.opOf.get(added)).toBe('add');

    // Every marked element is an origin at hop 0.
    expect(impact.originIds).toHaveLength(impact.opOf.size);
    for (const id of impact.originIds) expect(impact.hopOf.get(id)).toBe(0);
  });

  it('adds a staged element and relationship that the model does not have yet', () => {
    const target = raw.nodes.find((n) => n.layer_id === 'motivation')!;
    const staged: ChangeRecord[] = [
      {
        type: 'add',
        elementId: 'technology.node.brand-new-server',
        layerName: 'technology',
        after: { id: 'new-uuid', name: 'Brand New Server', type: 'node', layer_id: 'technology' },
      },
      {
        type: 'relationship-add',
        elementId: `technology.node.brand-new-server::serves::${target.id}`,
        after: { source: 'technology.node.brand-new-server', target: target.id, predicate: 'serves' },
      },
    ];
    const impact = changesetImpact(model, staged, 0);
    expect(impact.opOf.get('new-uuid')).toBe('add');
    expect(impact.nodes.find((n) => n.id === 'new-uuid')).toMatchObject({
      label: 'Brand New Server',
      domainColor: 'technology',
    });
    // The new relationship carries the reach to the existing element.
    expect(impact.opOf.get(target.id)).toBe('relink');
    expect(impact.edges.some((e) => e.sourceId === 'new-uuid' && e.targetId === target.id)).toBe(true);
  });

  it('counts changes it cannot place instead of dropping them silently', () => {
    const impact = changesetImpact(
      model,
      [
        ...changes,
        { type: 'update', elementId: 'api.operation.no-such-thing', after: { name: 'Gone' } },
        { type: 'relationship-delete', before: { source: 'x.y.z', target: 'a.b.c', predicate: 'serves' } },
      ],
      1,
    );
    expect(impact.unresolved).toBe(2);
    expect(impact.opOf.size).toBe(changesetImpact(model, changes, 1).opOf.size);
  });
});

describe('changesetImpact — net ops over a sequence of changes', () => {
  it('nets two changes to one element', () => {
    expect(netOp(undefined, 'update')).toBe('update');
    expect(netOp('add', 'update')).toBe('add');
    expect(netOp('add', 'delete')).toBeNull();
    expect(netOp('update', 'delete')).toBe('delete');
    expect(netOp('delete', 'add')).toBe('update');
    expect(netOp('update', 'update')).toBe('update');
  });

  const newElement = (type: string, after?: Record<string, unknown>): ChangeRecord => ({
    type,
    elementId: 'technology.node.brand-new-server',
    layerName: 'technology',
    after: after ?? { id: 'new-uuid', name: 'Brand New Server', type: 'node', layer_id: 'technology' },
  });

  it('keeps an element the changeset adds and then updates as added', () => {
    const impact = changesetImpact(model, [newElement('add'), newElement('update', { id: 'new-uuid', name: 'Renamed Server' })], 0);
    expect(impact.opOf.get('new-uuid')).toBe('add');
    expect(impact.nodes.find((n) => n.id === 'new-uuid')?.label).toBe('Renamed Server');
  });

  it('drops an element the changeset adds and then deletes', () => {
    const impact = changesetImpact(model, [newElement('add'), { ...newElement('delete'), after: undefined, before: { id: 'new-uuid' } }], 1);
    expect(impact.opOf.has('new-uuid')).toBe(false);
    expect(impact.nodes.some((n) => n.id === 'new-uuid')).toBe(false);
  });

  it('cancels a relationship added and then deleted: no edge, no relinked ends', () => {
    const [a, b] = raw.nodes.filter((n) => n.layer_id === 'motivation');
    const rel = { source: a.id, target: b.id, predicate: 'influence' };
    const impact = changesetImpact(
      model,
      [
        { type: 'relationship-add', elementId: 'r', after: rel },
        { type: 'relationship-delete', elementId: 'r', before: rel },
      ],
      1,
    );
    expect(impact.originIds).toEqual([]);
    expect(impact.unresolved).toBe(0);
  });
});

describe('changesetImpact — reach and blast radius', () => {
  it('reaches further as follow grows, and Direct still reaches past the changeset', () => {
    const [direct, one, two] = ([0, 1, 2] as const).map((f) => changesetImpact(model, changes, f));
    expect(direct.outsideCount).toBeGreaterThan(0);
    expect(one.outsideCount).toBeGreaterThanOrEqual(direct.outsideCount);
    expect(two.outsideCount).toBeGreaterThanOrEqual(one.outsideCount);
    expect(two.outsideCount).toBeGreaterThan(direct.outsideCount);
  });

  it('summarizes reached elements outside the changeset per layer, in layer order', () => {
    const impact = changesetImpact(model, changes, 1);
    const layers = impact.byLayer.map((l) => l.layerId);
    expect(layers).toEqual(LAYER_ORDER.filter((l) => layers.includes(l)));
    expect(impact.byLayer.reduce((s, l) => s + l.count, 0)).toBe(impact.outsideCount);
    for (const l of impact.byLayer) expect(l.names).toHaveLength(l.count);

    // Outside = reached minus origins.
    const outside = [...impact.hopOf.keys()].filter((id) => !impact.opOf.has(id));
    expect(outside).toHaveLength(impact.outsideCount);
  });

  it('returns only the reached subgraph: every node reached, every edge between reached nodes', () => {
    const impact = changesetImpact(model, changes, 2);
    expect(impact.nodes.map((n) => n.id).sort()).toEqual([...impact.hopOf.keys()].sort());
    for (const e of impact.edges) {
      expect(impact.hopOf.has(e.sourceId)).toBe(true);
      expect(impact.hopOf.has(e.targetId)).toBe(true);
      expect(['structural', 'relational']).toContain(e.attributes?.category);
    }
    expect(impact.nodes.length).toBeLessThan(raw.nodes.length);
  });
});
