import { describe, it, expect } from 'vitest';
import {
  slugifyName,
  dottedId,
  buildModelIndex,
  resolveEndpoint,
  gridLayout,
  nodesForLayer,
  edgesForLayer,
} from '@/apps/embedded/data/modelGraph';
import type {
  ModelDerived,
  ModelNode,
  ModelLink,
} from '@/apps/embedded/data/useModel';
import modelFixture from '../fixtures/model.json';

// ─── Fixture → ModelDerived (mirrors useModel's derive, no React) ─────────────

interface RawModel {
  nodes: ModelNode[];
  links: ModelLink[];
}

function deriveModel(raw: RawModel): ModelDerived {
  const countsByLayer: Record<string, number> = {};
  const nodesByLayer: Record<string, ModelNode[]> = {};
  for (const node of raw.nodes) {
    const layer = node.layer_id;
    if (!layer) continue;
    countsByLayer[layer] = (countsByLayer[layer] ?? 0) + 1;
    (nodesByLayer[layer] ??= []).push(node);
  }
  return {
    nodes: raw.nodes,
    links: raw.links,
    countsByLayer,
    nodesByLayer,
    relCount: raw.links.length,
  };
}

const model = deriveModel(modelFixture as unknown as RawModel);

// ─── slugifyName (table-driven) ───────────────────────────────────────────────

describe('slugifyName', () => {
  // [input, expected, note]
  const cases: Array<[string, string, string]> = [
    // lower→Upper camel boundaries hyphenate
    ['WebSocket', 'web-socket', 'lower→Upper boundary inside a word'],
    ['camelCase', 'camel-case', 'simple camelCase'],
    ['getUserById', 'get-user-by-id', 'multiple camel boundaries'],
    // acronyms / digit→Upper boundaries do NOT hyphenate
    ['E2E', 'e2e', 'acronym with digit, no boundary inserted'],
    ['APIGateway', 'apigateway', 'leading acronym (no lower→Upper split)'],
    ['HTTPSConnection', 'httpsconnection', 'all-caps acronym run stays glued'],
    // dots are dropped, not turned into hyphens
    ['2.1', '21', 'version-like dotted number → digits glued'],
    ['v1.2.3', 'v123', 'multiple dots all dropped'],
    ['data.model', 'datamodel', 'dotted words glue together'],
    // punctuation / spaces collapse to single hyphen
    ['Visualize Multi-Layer Models', 'visualize-multi-layer-models', 'spaces + existing hyphen'],
    ['foo / bar', 'foo-bar', 'slash + spaces collapse'],
    ['a__b--c', 'a-b-c', 'underscores + double hyphen collapse'],
    // digit→Upper is NOT a camel boundary → no hyphen there
    ['Order2Cash', 'order2cash', 'digit→Upper (2C) does not split'],
    ['HTTP2Server', 'http2server', 'acronym+digit then Upper does not split'],
    ['a2Server', 'a2server', 'digit→Upper (2S) does not split'],
    ['already-slugged', 'already-slugged', 'idempotent on a clean slug'],
    ['', '', 'empty string'],
  ];

  it.each(cases)('slugifyName(%j) === %j  // %s', (input, expected) => {
    expect(slugifyName(input)).toBe(expected);
  });

  it('only hyphenates at lower→Upper boundaries, never digit→Upper', () => {
    // "rS" in "userServer" is lower→Upper → split; "2S" is digit→Upper → no split.
    expect(slugifyName('userServer')).toBe('user-server');
    expect(slugifyName('a2Server')).toBe('a2server');
  });

  it('trims BOTH leading and trailing hyphen runs', () => {
    expect(slugifyName('---edge---')).toBe('edge');
    expect(slugifyName('  leading and trailing  ')).toBe('leading-and-trailing');
    expect(slugifyName('trailing only ')).toBe('trailing-only');
    expect(slugifyName('-abc')).toBe('abc');
    expect(slugifyName('abc')).toBe('abc');
  });

  it('is idempotent (slug of a slug is itself) for clean inputs', () => {
    const samples = ['web-socket', 'get-user-by-id', 'e2e', 'order2cash'];
    for (const s of samples) expect(slugifyName(s)).toBe(s);
  });
});

// ─── dottedId ─────────────────────────────────────────────────────────────────

describe('dottedId', () => {
  it('composes {layer_id}.{type}.{slug(name)}', () => {
    const node = {
      id: 'uuid-1',
      layer_id: 'data-model',
      type: 'objectschema',
      name: 'WebSocket Frame',
    } as ModelNode;
    expect(dottedId(node)).toBe('data-model.objectschema.web-socket-frame');
  });

  it('drops dots in the name segment (2.1 → 21)', () => {
    const node = {
      id: 'uuid-2',
      layer_id: 'api',
      type: 'operation',
      name: 'v2.1',
    } as ModelNode;
    expect(dottedId(node)).toBe('api.operation.v21');
  });

  it('matches slugifyName for the name segment on every fixture node', () => {
    for (const node of model.nodes) {
      expect(dottedId(node)).toBe(
        `${node.layer_id}.${node.type}.${slugifyName(node.name)}`,
      );
    }
  });
});

// ─── REGRESSION: dual-index resolves ALL 445 live links ───────────────────────

describe('buildModelIndex (445-link resolution regression)', () => {
  it('the fixture really has 285 nodes and 445 links', () => {
    expect(model.nodes).toHaveLength(285);
    expect(model.links).toHaveLength(445);
  });

  it('indexes every node under both its UUID and its dotted id', () => {
    const index = buildModelIndex(model);
    // byUuid has one entry per node.
    expect(index.byUuid.size).toBe(model.nodes.length);
    // byEndpoint has both forms (no dotted-id collisions → 2 per node).
    expect(index.byEndpoint.size).toBe(model.nodes.length * 2);
  });

  it('resolves ALL 445 link endpoints — zero unresolved', () => {
    const index = buildModelIndex(model);
    const unresolved = model.links.filter(
      (l) =>
        !resolveEndpoint(index, l.source) || !resolveEndpoint(index, l.target),
    );
    expect(unresolved).toEqual([]);
  });

  it('has ZERO dotted-id collisions across the model', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const node of model.nodes) {
      const dot = dottedId(node);
      const prev = seen.get(dot);
      if (prev && prev !== node.id) collisions.push(dot);
      seen.set(dot, node.id);
    }
    expect(collisions).toEqual([]);
  });

  it('exercises BOTH endpoint forms — links reference nodes by UUID and by dotted id', () => {
    // The dual index is only load-bearing if links actually use both forms.
    const uuidIds = new Set(model.nodes.map((n) => n.id));
    let byUuidForm = 0;
    let byDottedForm = 0;
    for (const l of model.links) {
      if (uuidIds.has(l.source)) byUuidForm += 1;
      else byDottedForm += 1;
    }
    expect(byUuidForm).toBeGreaterThan(0);
    expect(byDottedForm).toBeGreaterThan(0);
  });

  it('resolveEndpoint returns undefined for an unknown endpoint', () => {
    const index = buildModelIndex(model);
    expect(resolveEndpoint(index, 'no.such.endpoint')).toBeUndefined();
  });
});

// ─── gridLayout ───────────────────────────────────────────────────────────────

describe('gridLayout', () => {
  it('positions every id and is recentered on the origin (mean-ish ~ 0)', () => {
    const ids = Array.from({ length: 9 }, (_, i) => `n${i}`);
    const pos = gridLayout(ids);
    expect(pos.size).toBe(9);
    const xs = [...pos.values()].map((p) => p.x);
    const ys = [...pos.values()].map((p) => p.y);
    // bounding box is centered: min + max ≈ 0 on each axis.
    expect(Math.min(...xs) + Math.max(...xs)).toBeCloseTo(0, 6);
    expect(Math.min(...ys) + Math.max(...ys)).toBeCloseTo(0, 6);
  });

  it('is deterministic — same ids produce identical positions', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    expect([...gridLayout(ids).entries()]).toEqual([...gridLayout(ids).entries()]);
  });

  it('clamps columns to [2,4]', () => {
    // 2 ids → 2 cols → row 0 only → both y === 0 (then recentered to 0).
    const two = gridLayout(['a', 'b']);
    expect(two.get('a')!.y).toBe(two.get('b')!.y);
    // 25 ids → ceil(sqrt(25))=5 clamped to 4 cols → 7 rows.
    const many = gridLayout(Array.from({ length: 25 }, (_, i) => `n${i}`));
    const distinctX = new Set([...many.values()].map((p) => Math.round(p.x)));
    // At most 4 columns → small set of staggered x bands (≤ 8 with stagger).
    expect(distinctX.size).toBeLessThanOrEqual(8);
  });
});

// ─── nodesForLayer ────────────────────────────────────────────────────────────

describe('nodesForLayer', () => {
  it('returns exactly the layer-resident nodes mapped to GraphNodeData', () => {
    const nodes = nodesForLayer(model, 'security');
    expect(nodes).toHaveLength(model.countsByLayer['security']);
    for (const gn of nodes) {
      const src = model.nodes.find((n) => n.id === gn.id)!;
      expect(src.layer_id).toBe('security');
      expect(gn.label).toBe(src.name); // label ← name
      expect(gn.kind).toBe(src.type); // kind ← type
      expect(gn.domainColor).toBe('security'); // domainColor ← layer slug
      expect(typeof gn.x).toBe('number');
      expect(typeof gn.y).toBe('number');
    }
  });

  it('returns an empty array for a layer with no elements', () => {
    expect(nodesForLayer(model, 'no-such-layer')).toEqual([]);
  });

  it('ids are the node UUIDs (selectable by GraphCanvas)', () => {
    const uuids = new Set(model.nodes.map((n) => n.id));
    for (const gn of nodesForLayer(model, 'api')) {
      expect(uuids.has(gn.id)).toBe(true);
    }
  });
});

// ─── edgesForLayer ────────────────────────────────────────────────────────────

describe('edgesForLayer', () => {
  const index = buildModelIndex(model);

  it('includes an edge only when BOTH endpoints resolve into the layer', () => {
    const layer = 'business';
    const edges = edgesForLayer(model, layer, index);
    const layerUuids = new Set(model.nodesByLayer[layer].map((n) => n.id));
    expect(edges.length).toBeGreaterThan(0);
    for (const e of edges) {
      expect(layerUuids.has(e.sourceId)).toBe(true);
      expect(layerUuids.has(e.targetId)).toBe(true);
    }
  });

  it('excludes cross-layer links from the layer graph', () => {
    // Count intra-layer links manually and compare to edge count.
    const layer = 'application';
    const intra = model.links.filter((l) => {
      const s = resolveEndpoint(index, l.source);
      const t = resolveEndpoint(index, l.target);
      return s && t && s.layer_id === layer && t.layer_id === layer;
    });
    const edges = edgesForLayer(model, layer, index);
    expect(edges).toHaveLength(intra.length);
  });

  it('maps endpoints to node UUIDs and label to link.type', () => {
    const edges = edgesForLayer(model, 'technology', index);
    const e = edges[0];
    const link = model.links.find((l) => l.id === e.id)!;
    expect(e.label).toBe(link.type);
    // source/target are UUIDs, matching the resolved endpoints.
    expect(e.sourceId).toBe(resolveEndpoint(index, link.source)!.id);
    expect(e.targetId).toBe(resolveEndpoint(index, link.target)!.id);
  });

  it('produces zero edges for a layer with no nodes', () => {
    expect(edgesForLayer(model, 'no-such-layer', index)).toEqual([]);
  });
});
