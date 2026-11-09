// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { buildModelLayeredIndex, elementReach } from '@/apps/embedded/data/reach';
import { buildModelIndex, resolveEndpoint } from '@/apps/embedded/data/modelGraph';
import { LAYER_ORDER } from '@/apps/embedded/ui/domain';
import type { ModelDerived, ModelNode, ModelLink } from '@/apps/embedded/data/useModel';
import modelFixture from '../fixtures/model.json';

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
const layered = buildModelLayeredIndex(model, index);

function byName(name: string): ModelNode {
  const n = raw.nodes.find((x) => x.name === name);
  if (!n) throw new Error(`fixture has no element named ${name}`);
  return n;
}
const layerOf = (uuid: string) => index.byUuid.get(uuid)!.layer_id;

/** Every (other node, predicate, direction) on links touching `uuid`. */
function directLinks(uuid: string) {
  const out: { other: string; predicate: string; direction: 'in' | 'out' }[] = [];
  for (const l of raw.links) {
    const s = resolveEndpoint(index, l.source)?.id;
    const t = resolveEndpoint(index, l.target)?.id;
    if (s === uuid && t) out.push({ other: t, predicate: l.type, direction: 'out' });
    if (t === uuid && s) out.push({ other: s, predicate: l.type, direction: 'in' });
  }
  return out;
}

const BEARER = byName('Bearer Token Policy');

describe('buildModelLayeredIndex', () => {
  it('indexes every element, in the 12 DR layers in spec order', () => {
    expect(layered.nodes).toHaveLength(raw.nodes.length);
    expect(layered.layers.map((l) => l.id)).toEqual(LAYER_ORDER);
  });

  it('resolves every link endpoint (UUID or dotted id) — no dangling edges', () => {
    expect(layered.issues.filter((i) => i.kind === 'dangling-edge')).toEqual([]);
    const bundledEdgeCount = layered.links.reduce((n, l) => n + l.edgeIds.length, 0);
    expect(bundledEdgeCount).toBe(raw.links.length);
  });
});

describe('elementReach', () => {
  it('returns nothing for an unknown element id', () => {
    expect(elementReach(layered, 'no-such-id', 1)).toEqual({ followed: [], nodeCount: 0, layerCount: 0 });
  });

  it('follow 0 lists no followed rows; the reach is exactly the direct neighbours', () => {
    const r = elementReach(layered, BEARER.id, 0);
    expect(r.followed).toEqual([]);
    const neighbours = new Set(directLinks(BEARER.id).map((d) => d.other));
    expect(r.nodeCount).toBe(neighbours.size);
    const layers = new Set([BEARER.layer_id, ...[...neighbours].map(layerOf)]);
    expect(r.layerCount).toBe(layers.size);
  });

  it('follow 1 rows are hop 2, outside the origin layer, reached over a real cross-layer link from a direct neighbour', () => {
    const r = elementReach(layered, BEARER.id, 1);
    expect(r.followed.length).toBeGreaterThan(0);
    const neighbours = new Set(directLinks(BEARER.id).map((d) => d.other));

    for (const rel of r.followed) {
      expect(rel.hop).toBe(2);
      expect(rel.targetDomain).toBe(layerOf(rel.target));
      expect(rel.targetDomain).not.toBe(BEARER.layer_id);
      expect(neighbours.has(rel.target)).toBe(false);
      // The via element is a direct neighbour in another layer…
      expect(neighbours.has(rel.via.id)).toBe(true);
      expect(layerOf(rel.via.id)).not.toBe(layerOf(rel.target));
      // …and a link with that predicate and direction joins it to the target.
      const viaLinks = directLinks(rel.via.id).filter((d) => d.other === rel.target);
      expect(viaLinks.map((d) => d.predicate)).toContain(rel.predicate.split(' · ')[0]);
      expect(viaLinks.map((d) => d.direction)).toContain(rel.direction);
      expect(rel.via.predicate).toBe(rel.predicate);
    }
    // Known reach in the fixture: the policy constrains Graph Viewer, which realizes the business service.
    expect(r.followed.map((f) => f.targetTitle)).toContain('Architecture Model Visualization');
    expect(r.nodeCount).toBe(neighbours.size + r.followed.length);
  });

  it('follow 2 extends follow 1 with hop-3 rows reached from hop-2 elements', () => {
    const one = elementReach(layered, BEARER.id, 1);
    const two = elementReach(layered, BEARER.id, 2);
    const oneTargets = new Set(one.followed.map((f) => f.target));
    for (const t of oneTargets) expect(two.followed.some((f) => f.target === t)).toBe(true);

    const hop3 = two.followed.filter((f) => f.hop === 3);
    for (const rel of hop3) expect(oneTargets.has(rel.via.id)).toBe(true);
    expect(two.nodeCount).toBeGreaterThanOrEqual(one.nodeCount);
  });

  it('sorts rows nearest hop first, then by layer order', () => {
    const { followed } = elementReach(layered, BEARER.id, 2);
    const keys = followed.map((f) => [f.hop, LAYER_ORDER.indexOf(f.targetDomain as never)]);
    const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    expect(keys).toEqual(sorted);
  });
});
