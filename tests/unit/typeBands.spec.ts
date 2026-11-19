/**
 * typeBands — one DR layer's elements grouped by node type (#594).
 * Ordering is checked against the real motivation fixture; naming and the
 * lane cap against small hand-built inputs.
 */

import { describe, it, expect } from 'vitest';
import type { GraphEdgeData, GraphNodeData } from '@tinkermonkey/heimdall-ui';

import {
  BAND_CAP,
  MORE_PREFIX,
  bandSpan,
  capBands,
  orderTypes,
  typeBandLabel,
  typeBands,
} from '@/apps/embedded/data/typeBands';
import { buildModelIndex, edgesForLayer, nodesForLayer } from '@/apps/embedded/data/modelGraph';
import type { ModelDerived, ModelPayload } from '@/apps/embedded/data/useModel';
import modelFixture from '../fixtures/model.json';

function derive(payload: ModelPayload): ModelDerived {
  const nodesByLayer: Record<string, ModelPayload['nodes']> = {};
  for (const n of payload.nodes) (nodesByLayer[n.layer_id] ??= []).push(n);
  return { nodes: payload.nodes, links: payload.links, nodesByLayer } as unknown as ModelDerived;
}

const model = derive(modelFixture as unknown as ModelPayload);
const index = buildModelIndex(model);

function pairsOf(nodes: GraphNodeData[], edges: GraphEdgeData[]): Map<string, number> {
  const kind = new Map(nodes.map((n) => [n.id, n.kind ?? '']));
  const pairs = new Map<string, number>();
  for (const e of edges) {
    const a = kind.get(e.sourceId)!;
    const b = kind.get(e.targetId)!;
    if (a === b) continue;
    const k = a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
    pairs.set(k, (pairs.get(k) ?? 0) + 1);
  }
  return pairs;
}

describe('type bands order linked types next to each other', () => {
  const nodes = nodesForLayer(model, 'motivation');
  const edges = edgesForLayer(model, 'motivation', index);

  it('puts every motivation type in exactly one band', () => {
    const { bands, layering } = typeBands('motivation', nodes, edges);
    expect(bands.map((b) => b.id).sort()).toEqual([...new Set(nodes.map((n) => n.kind))].sort());
    expect(bands.reduce((n, b) => n + b.count, 0)).toBe(nodes.length);
    expect(layering.layerBy).toBe('kind');
    expect(layering.layers?.map((l) => l.id)).toEqual(bands.map((b) => b.id));
  });

  it('finds an order with no more lane-skipping than any other order', () => {
    const { bands } = typeBands('motivation', nodes, edges);
    const pairs = pairsOf(nodes, edges);
    const best = bandSpan(bands.map((b) => b.id), pairs);
    const busiest = [...bands].sort((a, b) => b.count - a.count || a.id.localeCompare(b.id)).map((b) => b.id);
    expect(best).toBeLessThanOrEqual(bandSpan(busiest, pairs));
    // Exhaustive: no permutation beats it.
    const ids = bands.map((b) => b.id);
    let min = Infinity;
    const permute = (rest: string[], acc: string[]) => {
      if (!rest.length) return void (min = Math.min(min, bandSpan(acc, pairs)));
      rest.forEach((t, i) => permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, t]));
    };
    permute(ids, []);
    expect(best).toBe(min);
  });

  it('places a chain of linked types in chain order', () => {
    const counts = new Map([['a', 5], ['b', 4], ['c', 3], ['d', 2]]);
    // a—c, c—b, b—d: the only zero-skip orders are a,c,b,d and its reverse.
    const pairs = new Map([['a\u0000c', 3], ['b\u0000c', 3], ['b\u0000d', 3]]);
    const order = orderTypes(counts, pairs);
    expect(bandSpan(order, pairs)).toBe(0);
    expect([order.join(''), [...order].reverse().join('')]).toContain('acbd');
  });

  it('keeps busiest-first order when the types share no links', () => {
    const counts = new Map([['x', 1], ['y', 9], ['z', 4]]);
    expect(orderTypes(counts, new Map())).toEqual(['y', 'z', 'x']);
  });

  it('orders more than seven types greedily, still with every type once', () => {
    const counts = new Map(Array.from({ length: 9 }, (_, i) => [`t${i}`, 9 - i] as [string, number]));
    const pairs = new Map([['t0\u0000t8', 5]]);
    const order = orderTypes(counts, pairs);
    expect([...order].sort()).toEqual([...counts.keys()].sort());
    expect(Math.abs(order.indexOf('t0') - order.indexOf('t8'))).toBe(1);
  });
});

describe('type bands name types without the layer prefix', () => {
  it('drops the layer word and makes the type plural', () => {
    expect(typeBandLabel('ApplicationService', 'application')).toBe('Services');
    expect(typeBandLabel('ApplicationComponent', 'application')).toBe('Components');
    expect(typeBandLabel('BusinessProcess', 'business')).toBe('Processes');
    expect(typeBandLabel('Requirement', 'motivation')).toBe('Requirements');
    expect(typeBandLabel('Policy', 'security')).toBe('Policies');
  });

  it('keeps a title that is only the layer word, and splits the rest into words', () => {
    expect(typeBandLabel('TestCaseSketch', 'testing')).toBe('Test Case Sketches');
    expect(typeBandLabel('ObjectSchema', 'data-model')).toBe('Object Schemas');
    expect(typeBandLabel('DataModel', 'data-model')).toBe('Data Models');
  });

  it('names bands from the spec title, else the raw type, and keeps the raw type as the id', () => {
    const nodes: GraphNodeData[] = [
      { id: '1', label: 'A', kind: 'applicationservice' },
      { id: '2', label: 'B', kind: 'mystery' },
    ];
    const spec = { typeCount: 1, typeIds: ['applicationservice'], typeTitles: ['ApplicationService'], standard: '' };
    const { bands } = typeBands('application', nodes, [], spec);
    expect(bands.find((b) => b.id === 'applicationservice')?.label).toBe('Services');
    expect(bands.find((b) => b.id === 'mystery')?.label).toBe('Mysteries');
  });

  it('carries the full count in the band title', () => {
    const nodes: GraphNodeData[] = [{ id: '1', label: 'A', kind: 'goal' }, { id: '2', label: 'B', kind: 'goal' }];
    expect(typeBands('motivation', nodes, []).layering.layers?.[0].label).toBe('Goals · 2');
  });
});

describe('capBands', () => {
  const many: GraphNodeData[] = Array.from({ length: BAND_CAP + 10 }, (_, i) => ({
    id: `n${i}`,
    label: `Node ${String(i).padStart(3, '0')}`,
    kind: 'testcasesketch',
  }));
  const few: GraphNodeData[] = [{ id: 'c1', label: 'Context', kind: 'contextvariation' }];
  const bands = [
    { id: 'testcasesketch', label: 'Test Case Sketches', count: many.length },
    { id: 'contextvariation', label: 'Context Variations', count: 1 },
  ];
  const edges: GraphEdgeData[] = [
    { id: 'e1', sourceId: `n${BAND_CAP + 5}`, targetId: 'c1' },
    { id: 'e2', sourceId: 'n0', targetId: 'c1' },
  ];

  it('folds a lane over the cap into a "+N more" node, keeping the most linked', () => {
    const r = capBands([...many, ...few], edges, bands);
    const lane = r.nodes.filter((n) => n.kind === 'testcasesketch');
    expect(lane).toHaveLength(BAND_CAP);
    const more = lane.find((n) => n.id.startsWith(MORE_PREFIX));
    expect(more?.label).toBe('+11 more test case sketches');
    expect(r.hidden.get('testcasesketch')).toBe(11);
    // The linked element stays, and so does its edge.
    expect(lane.some((n) => n.id === `n${BAND_CAP + 5}`)).toBe(true);
    expect(r.edges.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
    // A small lane is untouched.
    expect(r.nodes.filter((n) => n.kind === 'contextvariation')).toHaveLength(1);
  });

  it('always keeps the selection, and shows a whole lane once it is expanded', () => {
    const last = `n${BAND_CAP + 9}`;
    const kept = capBands(many, [], bands, { keep: new Set([last]) });
    expect(kept.nodes.some((n) => n.id === last)).toBe(true);

    const open = capBands(many, [], bands, { expanded: new Set(['testcasesketch']) });
    expect(open.nodes).toHaveLength(many.length);
    expect(open.hidden.size).toBe(0);
  });
});
