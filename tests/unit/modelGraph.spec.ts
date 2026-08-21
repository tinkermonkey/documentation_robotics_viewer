import { describe, it, expect } from 'vitest';
import {
  slugifyName,
  dottedId,
  buildModelIndex,
  resolveEndpoint,
  gridLayout,
  nodesForLayer,
  edgesForLayer,
  nodesWithCardData,
  edgeMetadata,
  interLayerNodesAndEdges,
  CARD_CROSS_LINK_CAP,
} from '@/apps/embedded/data/modelGraph';
import type {
  ModelDerived,
  ModelNode,
  ModelLink,
} from '@/apps/embedded/data/useModel';
import type { SpecPayload } from '@/apps/embedded/data/specGraph';
import modelFixture from '../fixtures/model.json';
import specFixture from '../fixtures/spec.json';

const spec = specFixture as unknown as SpecPayload;

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
      // x/y intentionally unset — GraphCanvas layout="force" places nodes.
      expect(gn.x).toBeUndefined();
      expect(gn.y).toBeUndefined();
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

// ─── nodesWithCardData ────────────────────────────────────────────────────────

describe('nodesWithCardData', () => {
  const index = buildModelIndex(model);

  it('returns the same nodes as nodesForLayer, plus one CardData entry per node', () => {
    const plain = nodesForLayer(model, 'security');
    const { nodes, cardData } = nodesWithCardData(model, 'security', index);
    expect(nodes).toEqual(plain);
    expect(cardData.size).toBe(nodes.length);
    for (const n of nodes) expect(cardData.has(n.id)).toBe(true);
  });

  it('counts intra-layer connections per node (Developer: 4, security model: 5)', () => {
    const { cardData } = nodesWithCardData(model, 'security', index);
    const developer = model.nodesByLayer['security'].find((n) => n.name === 'Developer')!;
    const secModel = model.nodesByLayer['security'].find(
      (n) => n.name === 'Documentation Robotics Viewer Security Model',
    )!;
    expect(cardData.get(developer.id)?.intraCount).toBe(4);
    expect(cardData.get(secModel.id)?.intraCount).toBe(5);
  });

  it('has intraCount matching edgesForLayer degree for every node (cross-check against the edge list)', () => {
    const { nodes, cardData } = nodesWithCardData(model, 'security', index);
    const edges = edgesForLayer(model, 'security', index);
    const degree = new Map<string, number>();
    for (const e of edges) {
      degree.set(e.sourceId, (degree.get(e.sourceId) ?? 0) + 1);
      degree.set(e.targetId, (degree.get(e.targetId) ?? 0) + 1);
    }
    for (const n of nodes) {
      expect(cardData.get(n.id)?.intraCount).toBe(degree.get(n.id) ?? 0);
    }
  });

  it('enumerates inter-layer connections with predicate, target name, and target layer', () => {
    const { cardData } = nodesWithCardData(model, 'security', index);
    const bearerPolicy = model.nodesByLayer['security'].find(
      (n) => n.name === 'Bearer Token Policy',
    )!;
    const data = cardData.get(bearerPolicy.id)!;
    // 8 real inbound cross-layer links, capped to CARD_CROSS_LINK_CAP entries.
    expect(data.crossTotal).toBe(8);
    expect(data.crossLinks).toHaveLength(CARD_CROSS_LINK_CAP);
    for (const link of data.crossLinks) {
      expect(link.targetLayer).not.toBe('security');
      expect(typeof link.predicate).toBe('string');
      expect(typeof link.targetName).toBe('string');
    }
  });

  it('a node with no cross-layer links gets an empty crossLinks array and zero crossTotal', () => {
    const { cardData } = nodesWithCardData(model, 'security', index);
    const developer = model.nodesByLayer['security'].find((n) => n.name === 'Developer')!;
    const data = cardData.get(developer.id)!;
    expect(data.crossTotal).toBe(0);
    expect(data.crossLinks).toEqual([]);
  });

  it('sums to the manually-counted intra/cross link totals for a layer (api: 19 intra, 29 cross)', () => {
    const { nodes, cardData } = nodesWithCardData(model, 'api', index);
    const layerIds = new Set(nodes.map((n) => n.id));
    let manualIntra = 0;
    let manualCross = 0;
    for (const l of model.links) {
      const s = resolveEndpoint(index, l.source);
      const t = resolveEndpoint(index, l.target);
      if (!s || !t) continue;
      const sIn = layerIds.has(s.id);
      const tIn = layerIds.has(t.id);
      if (!sIn && !tIn) continue;
      if (sIn && tIn) manualIntra += 1;
      else manualCross += 1;
    }
    expect(manualIntra).toBe(19);
    expect(manualCross).toBe(29);

    const summedIntra = [...cardData.values()].reduce((sum, d) => sum + d.intraCount, 0) / 2;
    const summedCross = [...cardData.values()].reduce((sum, d) => sum + d.crossTotal, 0);
    expect(summedIntra).toBe(manualIntra);
    expect(summedCross).toBe(manualCross);
  });

  it('returns empty nodes/cardData for a layer with no elements', () => {
    const { nodes, cardData } = nodesWithCardData(model, 'no-such-layer', index);
    expect(nodes).toEqual([]);
    expect(cardData.size).toBe(0);
  });
});

// ─── edgeMetadata ─────────────────────────────────────────────────────────────

describe('edgeMetadata', () => {
  const index = buildModelIndex(model);

  it('resolves a real edge to source/target identity + type + predicate', () => {
    const link = model.links.find(
      (l) => l.type === 'aggregates' && l.id.includes('security.securitymodel'),
    )!;
    const meta = edgeMetadata(model, link.id, index, spec)!;
    expect(meta).toBeDefined();
    expect(meta.predicate).toBe('aggregates');
    expect(meta.sourceNode).toEqual({
      id: resolveEndpoint(index, link.source)!.id,
      name: 'Documentation Robotics Viewer Security Model',
      type: resolveEndpoint(index, link.source)!.type,
      layer: 'security',
    });
    expect(meta.targetNode).toEqual({
      id: resolveEndpoint(index, link.target)!.id,
      name: 'Developer',
      type: resolveEndpoint(index, link.target)!.type,
      layer: 'security',
    });
  });

  it('resolves the matching spec relationship schema when one is declared', () => {
    const link = model.links.find((l) => l.type === 'influence')!;
    const meta = edgeMetadata(model, link.id, index, spec)!;
    expect(meta.specRelationship).toBeDefined();
    expect(meta.specRelationship?.predicate).toBe('influence');
    expect(meta.specRelationship?.source_spec_node_id).toBe(
      `${meta.sourceNode.layer}.${meta.sourceNode.type}`,
    );
    expect(meta.specRelationship?.destination_spec_node_id).toBe(
      `${meta.targetNode.layer}.${meta.targetNode.type}`,
    );
  });

  it('resolves a cross-layer edge whose spec relationship is declared in the source layer file', () => {
    const link = model.links.find((l) => {
      const s = resolveEndpoint(index, l.source);
      const t = resolveEndpoint(index, l.target);
      return s && t && s.layer_id !== t.layer_id;
    })!;
    const meta = edgeMetadata(model, link.id, index, spec)!;
    expect(meta.sourceNode.layer).not.toBe(meta.targetNode.layer);
    expect(meta).toBeDefined();
  });

  it('leaves specRelationship undefined when no spec relationship schema matches', () => {
    const syntheticModel: ModelDerived = {
      nodes: [
        { id: 'n1', layer_id: 'security', type: 'not-a-real-type', name: 'A' },
        { id: 'n2', layer_id: 'security', type: 'not-a-real-type', name: 'B' },
      ] as ModelNode[],
      links: [{ id: 'e1', source: 'n1', target: 'n2', type: 'not-a-real-predicate' }] as ModelLink[],
      countsByLayer: {},
      nodesByLayer: {},
      relCount: 1,
    };
    const idx = buildModelIndex(syntheticModel);
    const meta = edgeMetadata(syntheticModel, 'e1', idx, spec)!;
    expect(meta).toBeDefined();
    expect(meta.specRelationship).toBeUndefined();
  });

  it('returns undefined for an unknown edge id', () => {
    expect(edgeMetadata(model, 'no-such-edge', index, spec)).toBeUndefined();
  });

  it('returns undefined when an endpoint fails to resolve', () => {
    const syntheticModel: ModelDerived = {
      nodes: [{ id: 'n1', layer_id: 'security', type: 't', name: 'A' }] as ModelNode[],
      links: [{ id: 'e1', source: 'n1', target: 'no-such-node', type: 'uses' }] as ModelLink[],
      countsByLayer: {},
      nodesByLayer: {},
      relCount: 1,
    };
    const idx = buildModelIndex(syntheticModel);
    expect(edgeMetadata(syntheticModel, 'e1', idx, spec)).toBeUndefined();
  });

  it('works with an undefined spec payload (specRelationship stays undefined)', () => {
    const link = model.links[0];
    const meta = edgeMetadata(model, link.id, index, undefined)!;
    expect(meta).toBeDefined();
    expect(meta.specRelationship).toBeUndefined();
  });
});

// ─── interLayerNodesAndEdges ──────────────────────────────────────────────────

describe('interLayerNodesAndEdges', () => {
  const index = buildModelIndex(model);

  it('returns the expected data structure with foreignNodes, crossEdges, and foreignNodeIds', () => {
    const result = interLayerNodesAndEdges(model, 'security', index);
    expect(result).toHaveProperty('foreignNodes');
    expect(result).toHaveProperty('crossEdges');
    expect(result).toHaveProperty('foreignNodeIds');
    expect(Array.isArray(result.foreignNodes)).toBe(true);
    expect(Array.isArray(result.crossEdges)).toBe(true);
    expect(result.foreignNodeIds instanceof Set).toBe(true);
  });

  it('includes foreign nodes for every cross-layer link where the layer has one endpoint', () => {
    const layer = 'security';
    const result = interLayerNodesAndEdges(model, layer, index);
    const layerUuids = new Set(model.nodesByLayer[layer].map((n) => n.id));

    // Count expected foreign nodes manually.
    const expectedForeignUuids = new Set<string>();
    for (const link of model.links) {
      const src = resolveEndpoint(index, link.source);
      const tgt = resolveEndpoint(index, link.target);
      if (!src || !tgt) continue;

      const srcInLayer = layerUuids.has(src.id);
      const tgtInLayer = layerUuids.has(tgt.id);

      if (srcInLayer && !tgtInLayer) expectedForeignUuids.add(tgt.id);
      if (!srcInLayer && tgtInLayer) expectedForeignUuids.add(src.id);
    }

    // Result should include all expected foreign nodes.
    expect(result.foreignNodeIds.size).toBe(expectedForeignUuids.size);
    for (const id of expectedForeignUuids) {
      expect(result.foreignNodeIds.has(id)).toBe(true);
    }
  });

  it('deduplicates foreign nodes by UUID (a node linked via multiple predicates appears once)', () => {
    const layer = 'business';
    const result = interLayerNodesAndEdges(model, layer, index);

    // Each node id should appear exactly once in foreignNodes.
    const nodeIds = result.foreignNodes.map((n) => n.id);
    const uniqueIds = new Set(nodeIds);
    expect(nodeIds).toHaveLength(uniqueIds.size);
    expect(uniqueIds).toEqual(result.foreignNodeIds);
  });

  it("assigns each foreign node its own layer's domainColor (not the active layer)", () => {
    const layer = 'application';
    const result = interLayerNodesAndEdges(model, layer, index);

    for (const node of result.foreignNodes) {
      const actualNode = index.byUuid.get(node.id)!;
      expect(node.domainColor).toBe(actualNode.layer_id);
      expect(node.domainColor).not.toBe(layer);
    }
  });

  it('maps foreign node properties: id → UUID, label → name, kind → type', () => {
    const result = interLayerNodesAndEdges(model, 'technology', index);
    for (const gn of result.foreignNodes) {
      const src = index.byUuid.get(gn.id)!;
      expect(gn.label).toBe(src.name);
      expect(gn.kind).toBe(src.type);
    }
  });

  it('cross-layer edges carry opacity 0.4 and strokeDash [6, 4]', () => {
    const result = interLayerNodesAndEdges(model, 'api', index);
    expect(result.crossEdges.length).toBeGreaterThan(0);
    for (const edge of result.crossEdges) {
      expect(edge.opacity).toBe(0.4);
      expect(edge.strokeDash).toEqual([6, 4]);
    }
  });

  it('cross-layer edges carry the link predicate as label', () => {
    const layer = 'data-model';
    const result = interLayerNodesAndEdges(model, layer, index);
    const layerUuids = new Set(model.nodesByLayer[layer].map((n) => n.id));

    for (const edge of result.crossEdges) {
      const link = model.links.find((l) => l.id === edge.id)!;
      expect(edge.label).toBe(link.type);

      // Verify exactly one endpoint is in the layer.
      const srcInLayer = layerUuids.has(edge.sourceId);
      const tgtInLayer = layerUuids.has(edge.targetId);
      expect(srcInLayer).not.toBe(tgtInLayer);
    }
  });

  it('cross-layer edges map sourceId/targetId to node UUIDs', () => {
    const result = interLayerNodesAndEdges(model, 'testing', index);
    for (const edge of result.crossEdges) {
      const src = index.byUuid.get(edge.sourceId);
      const tgt = index.byUuid.get(edge.targetId);
      expect(src).toBeDefined();
      expect(tgt).toBeDefined();
    }
  });

  it('covers both incoming and outgoing cross-layer links', () => {
    const layer = 'security';
    const result = interLayerNodesAndEdges(model, layer, index);
    const layerUuids = new Set(model.nodesByLayer[layer].map((n) => n.id));
    const foreignUuids = result.foreignNodeIds;

    let hasIncoming = false;
    let hasOutgoing = false;
    for (const edge of result.crossEdges) {
      if (layerUuids.has(edge.sourceId) && foreignUuids.has(edge.targetId)) {
        hasOutgoing = true;
      }
      if (foreignUuids.has(edge.sourceId) && layerUuids.has(edge.targetId)) {
        hasIncoming = true;
      }
    }

    // Verify both directions exist for this layer.
    expect(hasIncoming && hasOutgoing).toBe(true);
  });

  it('returns empty arrays for a layer with no cross-layer links', () => {
    // This layer may not exist in the fixture, but the function should handle it gracefully.
    const result = interLayerNodesAndEdges(model, 'no-such-layer', index);
    expect(result.foreignNodes).toEqual([]);
    expect(result.crossEdges).toEqual([]);
    expect(result.foreignNodeIds.size).toBe(0);
  });

  describe('perimeter-ring layout', () => {
    it('omits x/y coordinates when perimeterLayout is undefined', () => {
      const result = interLayerNodesAndEdges(model, 'business', index, undefined);
      for (const node of result.foreignNodes) {
        expect(node.x).toBeUndefined();
        expect(node.y).toBeUndefined();
      }
    });

    it('omits x/y coordinates when perimeterLayout is false', () => {
      const result = interLayerNodesAndEdges(model, 'business', index, false);
      for (const node of result.foreignNodes) {
        expect(node.x).toBeUndefined();
        expect(node.y).toBeUndefined();
      }
    });

    it('assigns x/y coordinates on a ring when perimeterLayout is true', () => {
      const result = interLayerNodesAndEdges(model, 'business', index, true);
      expect(result.foreignNodes.length).toBeGreaterThan(0);
      for (const node of result.foreignNodes) {
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
      }
    });

    it('positions foreign nodes on a circle centered at the origin', () => {
      const result = interLayerNodesAndEdges(model, 'business', index, true);
      const ringRadii = result.foreignNodes.map((n) => Math.sqrt(n.x! ** 2 + n.y! ** 2));

      // All nodes should be at approximately the same distance from origin (ring radius).
      const avgRadius = ringRadii.reduce((a, b) => a + b, 0) / ringRadii.length;
      for (const radius of ringRadii) {
        expect(radius).toBeCloseTo(avgRadius, 5);
      }
    });

    it('scales ring radius by foreign node count (Math.max(300, count * 80))', () => {
      const result = interLayerNodesAndEdges(model, 'business', index, true);
      const count = result.foreignNodes.length;
      const expectedRadius = Math.max(300, count * 80);

      // All nodes at approximately this radius.
      const actual = Math.sqrt(result.foreignNodes[0].x! ** 2 + result.foreignNodes[0].y! ** 2);
      expect(actual).toBeCloseTo(expectedRadius, 5);
    });

    it('evenly spaces nodes around the circle by angle', () => {
      const result = interLayerNodesAndEdges(model, 'api', index, true);
      const count = result.foreignNodes.length;

      // Compute angles.
      const angles = result.foreignNodes.map((n) => Math.atan2(n.y!, n.x!));
      angles.sort((a, b) => a - b);

      // Adjacent angles should differ by roughly 2π / count.
      const expectedAngleStep = (2 * Math.PI) / count;
      for (let i = 0; i < angles.length - 1; i++) {
        const diff = angles[i + 1] - angles[i];
        expect(diff).toBeCloseTo(expectedAngleStep, 4);
      }
    });

    it('handles a single foreign node (radius still applies, angle is arbitrary)', () => {
      const syntheticModel: ModelDerived = {
        nodes: [
          { id: 'native-1', layer_id: 'test-layer', type: 't1', name: 'Native' },
          { id: 'foreign-1', layer_id: 'other-layer', type: 't2', name: 'Foreign' },
        ] as ModelNode[],
        links: [{ id: 'e1', source: 'native-1', target: 'foreign-1', type: 'uses' }] as ModelLink[],
        countsByLayer: {
          'test-layer': 1,
          'other-layer': 1,
        },
        nodesByLayer: {
          'test-layer': [{ id: 'native-1', layer_id: 'test-layer', type: 't1', name: 'Native' }] as ModelNode[],
          'other-layer': [
            { id: 'foreign-1', layer_id: 'other-layer', type: 't2', name: 'Foreign' },
          ] as ModelNode[],
        },
        relCount: 1,
      };
      const idx = buildModelIndex(syntheticModel);
      const result = interLayerNodesAndEdges(syntheticModel, 'test-layer', idx, true);

      expect(result.foreignNodes).toHaveLength(1);
      const node = result.foreignNodes[0];
      const radius = Math.sqrt(node.x! ** 2 + node.y! ** 2);
      expect(radius).toBeCloseTo(300, 5); // MIN_RING_RADIUS
    });
  });

  it('manually-counts cross-layer links for a layer and matches the result', () => {
    const layer = 'security';
    const result = interLayerNodesAndEdges(model, layer, index);
    const layerUuids = new Set(model.nodesByLayer[layer].map((n) => n.id));

    let manualCrossCount = 0;
    for (const l of model.links) {
      const s = resolveEndpoint(index, l.source);
      const t = resolveEndpoint(index, l.target);
      if (!s || !t) continue;
      const sIn = layerUuids.has(s.id);
      const tIn = layerUuids.has(t.id);
      if ((sIn && !tIn) || (!sIn && tIn)) manualCrossCount += 1;
    }

    // Cross-layer links may be duplicated if a foreign node is reachable via multiple predicates;
    // crossEdges count edges (one per link id), foreignNodes are deduplicated by UUID.
    expect(result.crossEdges).toHaveLength(manualCrossCount);
  });
});
