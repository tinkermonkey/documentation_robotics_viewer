import { describe, it, expect } from 'vitest';
import {
  modelElementNeighborhoodGraph,
  specNodeNeighborhoodGraph,
} from '@/apps/embedded/data/neighborhoodGraph';
import { buildModelIndex } from '@/apps/embedded/data/modelGraph';
import type {
  ModelDerived,
  ModelNode,
  ModelLink,
} from '@/apps/embedded/data/useModel';
import type { SpecPayload } from '@/apps/embedded/data/specGraph';
import modelFixture from '../fixtures/model.json';
import specFixture from '../fixtures/spec.json';

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
const index = buildModelIndex(model);
const spec = specFixture as unknown as SpecPayload;

// ─── Model Element Neighborhood Graph ──────────────────────────────────────────

describe('modelElementNeighborhoodGraph', () => {
  it('returns empty result for unknown element id', () => {
    const result = modelElementNeighborhoodGraph('unknown-id', model, index);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.empty).toBe(true);
  });

  it('includes the center element with isCenter=true', () => {
    const metaModelId = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';
    const result = modelElementNeighborhoodGraph(metaModelId, model, index);
    const centerNode = result.nodes.find((n) => n.isCenter);
    expect(centerNode).toBeDefined();
    expect(centerNode?.id).toBe(metaModelId);
    expect(centerNode?.name).toBe('MetaModel');
    expect(centerNode?.layer).toBe('data-model');
  });

  it('includes all directly connected neighbors with isCenter=false', () => {
    const metaModelId = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';
    const result = modelElementNeighborhoodGraph(metaModelId, model, index);
    const neighbors = result.nodes.filter((n) => !n.isCenter);
    expect(neighbors.length).toBeGreaterThan(0);
    neighbors.forEach((n) => {
      expect(n.isCenter).toBe(false);
      expect(n.id).toBeDefined();
      expect(n.layer).toBeDefined();
    });
  });

  it('includes cross-layer neighbors from different layers', () => {
    const metaModelId = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';
    const result = modelElementNeighborhoodGraph(metaModelId, model, index);
    const layers = new Set(result.nodes.map((n) => n.layer));
    expect(layers.size).toBeGreaterThan(1);
    expect([...layers]).toContain('data-model');
    expect([...layers]).toContain('business');
  });

  it('deduplicates neighbors reachable via multiple edges', () => {
    const metaModelId = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';
    const result = modelElementNeighborhoodGraph(metaModelId, model, index);
    const neighborIds = result.nodes
      .filter((n) => !n.isCenter)
      .map((n) => n.id);
    const uniqueIds = new Set(neighborIds);
    expect(neighborIds.length).toBe(uniqueIds.size);
  });

  it('creates edges for each outgoing relationship', () => {
    const metaModelId = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';
    const result = modelElementNeighborhoodGraph(metaModelId, model, index);
    const outEdges = result.edges.filter((e) => e.direction === 'out');
    expect(outEdges.length).toBeGreaterThan(0);
    outEdges.forEach((e) => {
      expect(e.id).toBeDefined();
      expect(e.predicate).toBeDefined();
      expect(e.targetId).toBeDefined();
    });
  });

  it('creates edges for each incoming relationship', () => {
    const metaModelId = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';
    const result = modelElementNeighborhoodGraph(metaModelId, model, index);
    const inEdges = result.edges.filter((e) => e.direction === 'in');
    expect(inEdges.length).toBeGreaterThan(0);
    inEdges.forEach((e) => {
      expect(e.id).toBeDefined();
      expect(e.predicate).toBeDefined();
      expect(e.targetId).toBeDefined();
    });
  });

  it('marks element with no connections as empty', () => {
    const syntheticModel: ModelDerived = {
      ...model,
      links: model.links.filter(
        (l) =>
          !l.source.includes('isolated') &&
          !l.target.includes('isolated'),
      ),
    };
    const syntheticIndex = buildModelIndex(syntheticModel);
    const isolatedNode: ModelNode = {
      id: 'isolated-node-id',
      name: 'IsolatedNode',
      type: 'component',
      layer_id: 'application',
      spec_node_id: 'application.component',
      description: 'An isolated node with no connections',
      attributes: {},
      source_reference: {},
      metadata: {},
    };
    syntheticIndex.byUuid.set(isolatedNode.id, isolatedNode);
    syntheticIndex.byEndpoint.set(isolatedNode.id, isolatedNode);

    const result = modelElementNeighborhoodGraph(isolatedNode.id, syntheticModel, syntheticIndex);
    expect(result.empty).toBe(true);
    expect(result.edges).toEqual([]);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].isCenter).toBe(true);
  });

  it('preserves node type and layer information per neighbor', () => {
    const metaModelId = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';
    const result = modelElementNeighborhoodGraph(metaModelId, model, index);
    result.nodes.forEach((n) => {
      expect(n.kind).toBeDefined();
      expect(n.layer).toBeDefined();
      const nodeInModel = index.byUuid.get(n.id);
      if (nodeInModel) {
        expect(n.kind).toBe(nodeInModel.type);
        expect(n.layer).toBe(nodeInModel.layer_id);
      }
    });
  });

  it('edge count matches the number of relationships', () => {
    const metaModelId = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';
    const result = modelElementNeighborhoodGraph(metaModelId, model, index);
    // Count links that resolve to this element via the index (which handles both UUID and dotted IDs)
    const resolvedLinks = model.links.filter((l) => {
      const src = index.byEndpoint.get(l.source);
      const tgt = index.byEndpoint.get(l.target);
      if (!src || !tgt) return false;
      return src.id === metaModelId || tgt.id === metaModelId;
    });
    // Each link should produce exactly one edge in the result
    expect(result.edges.length).toBe(resolvedLinks.length);
  });

  it('center element appears exactly once even with self-referential relationships', () => {
    // Create a synthetic model with an explicit self-referential link
    const testNodeId = 'test-self-ref-node';
    const selfRefLink: ModelLink = {
      id: 'self-ref-link-id',
      source: testNodeId,
      target: testNodeId,
      type: 'self-references',
      source_layer_id: 'application',
      target_layer_id: 'application',
    };
    const testNode: ModelNode = {
      id: testNodeId,
      name: 'SelfRefNode',
      type: 'component',
      layer_id: 'application',
      spec_node_id: 'application.component',
      description: 'A node with self-referential relationships',
      attributes: {},
      source_reference: {},
      metadata: {},
    };
    const syntheticModel: ModelDerived = {
      ...model,
      links: [...model.links, selfRefLink],
    };
    const syntheticIndex = buildModelIndex(syntheticModel);
    syntheticIndex.byUuid.set(testNode.id, testNode);
    syntheticIndex.byEndpoint.set(testNode.id, testNode);

    const result = modelElementNeighborhoodGraph(testNodeId, syntheticModel, syntheticIndex);
    const centerNodes = result.nodes.filter((n) => n.isCenter);
    expect(centerNodes).toHaveLength(1);
    expect(centerNodes[0].id).toBe(testNodeId);
  });

  it('excludes self-referential relationships from neighbors', () => {
    // Create a synthetic model with an explicit self-referential link
    const testNodeId = 'test-self-ref-node';
    const selfRefLink: ModelLink = {
      id: 'self-ref-link-id',
      source: testNodeId,
      target: testNodeId,
      type: 'self-references',
      source_layer_id: 'application',
      target_layer_id: 'application',
    };
    const testNode: ModelNode = {
      id: testNodeId,
      name: 'SelfRefNode',
      type: 'component',
      layer_id: 'application',
      spec_node_id: 'application.component',
      description: 'A node with self-referential relationships',
      attributes: {},
      source_reference: {},
      metadata: {},
    };
    const syntheticModel: ModelDerived = {
      ...model,
      links: [...model.links, selfRefLink],
    };
    const syntheticIndex = buildModelIndex(syntheticModel);
    syntheticIndex.byUuid.set(testNode.id, testNode);
    syntheticIndex.byEndpoint.set(testNode.id, testNode);

    const result = modelElementNeighborhoodGraph(testNodeId, syntheticModel, syntheticIndex);
    // Verify self-referential links don't create neighbors (center node is never a neighbor)
    const neighborIds = result.nodes
      .filter((n) => !n.isCenter)
      .map((n) => n.id);
    expect(neighborIds).not.toContain(testNodeId);
  });
});

// ─── Schema Node Type Neighborhood Graph ──────────────────────────────────────

describe('specNodeNeighborhoodGraph', () => {
  it('returns empty result for unknown spec node id', () => {
    const result = specNodeNeighborhoodGraph('data-model', 'data-model.unknown', spec);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.empty).toBe(true);
  });

  it('includes the center spec node with isCenter=true', () => {
    const result = specNodeNeighborhoodGraph(
      'data-model',
      'data-model.objectschema',
      spec,
    );
    const centerNode = result.nodes.find((n) => n.isCenter);
    expect(centerNode).toBeDefined();
    expect(centerNode?.id).toBe('data-model.objectschema');
    expect(centerNode?.layer).toBe('data-model');
    expect(centerNode?.kind).toBe('spec node');
  });

  it('includes all related node types with isCenter=false', () => {
    const result = specNodeNeighborhoodGraph(
      'data-model',
      'data-model.objectschema',
      spec,
    );
    const neighbors = result.nodes.filter((n) => !n.isCenter);
    expect(neighbors.length).toBeGreaterThan(0);
    neighbors.forEach((n) => {
      expect(n.isCenter).toBe(false);
      expect(n.id).toBeDefined();
      expect(n.layer).toBeDefined();
      expect(n.kind).toBe('spec node');
    });
  });

  it('includes cross-layer related node types', () => {
    // Create a spec with guaranteed cross-layer relationships
    const syntheticSpec: SpecPayload = {
      ...spec,
      schemas: {
        ...spec?.schemas,
        'layer-a.json': {
          layer: {
            id: 'layer-a',
            number: 1,
            name: 'Layer A',
          },
          nodeSchemas: {
            'node-a': {
              title: 'Node A',
            },
          },
          relationshipSchemas: {
            'rel-1': {
              id: 'rel-1',
              source_spec_node_id: 'layer-a.node-a',
              source_layer: 'layer-a',
              destination_spec_node_id: 'layer-b.node-b',
              destination_layer: 'layer-b',
              predicate: 'links-to',
            },
          },
        },
        'layer-b.json': {
          layer: {
            id: 'layer-b',
            number: 2,
            name: 'Layer B',
          },
          nodeSchemas: {
            'node-b': {
              title: 'Node B',
            },
          },
          relationshipSchemas: {},
        },
      },
    };
    const result = specNodeNeighborhoodGraph(
      'layer-a',
      'layer-a.node-a',
      syntheticSpec,
    );
    const layers = new Set(result.nodes.map((n) => n.layer));
    expect(layers.size).toBeGreaterThan(1);
    expect([...layers]).toContain('layer-a');
    expect([...layers]).toContain('layer-b');
  });

  it('deduplicates node types reachable via multiple predicates', () => {
    const result = specNodeNeighborhoodGraph(
      'data-model',
      'data-model.objectschema',
      spec,
    );
    const neighborIds = result.nodes
      .filter((n) => !n.isCenter)
      .map((n) => n.id);
    const uniqueIds = new Set(neighborIds);
    expect(neighborIds.length).toBe(uniqueIds.size);
  });

  it('creates edges for outgoing relationships', () => {
    const result = specNodeNeighborhoodGraph(
      'data-model',
      'data-model.objectschema',
      spec,
    );
    const outEdges = result.edges.filter((e) => e.direction === 'out');
    expect(outEdges.length).toBeGreaterThan(0);
    outEdges.forEach((e) => {
      expect(e.id).toBeDefined();
      expect(e.predicate).toBeDefined();
      expect(e.targetId).toBeDefined();
    });
  });

  it('creates edges for incoming relationships', () => {
    const result = specNodeNeighborhoodGraph(
      'data-model',
      'data-model.objectschema',
      spec,
    );
    const inEdges = result.edges.filter((e) => e.direction === 'in');
    expect(inEdges.length).toBeGreaterThan(0);
    inEdges.forEach((e) => {
      expect(e.id).toBeDefined();
      expect(e.predicate).toBeDefined();
      expect(e.targetId).toBeDefined();
    });
  });

  it('marks node type with no relationships as empty', () => {
    // Create a synthetic spec with a node type that has no relationships
    const syntheticSpec: SpecPayload = {
      ...spec,
      schemas: {
        ...spec?.schemas,
        'isolated-layer.json': {
          layer: {
            id: 'isolated-layer',
            number: 99,
            name: 'Isolated',
          },
          nodeSchemas: {
            'isolated-node': {
              title: 'Isolated Node',
              description: 'A node with no relationships',
            },
          },
          relationshipSchemas: {},
        },
      },
    };
    const result = specNodeNeighborhoodGraph(
      'isolated-layer',
      'isolated-layer.isolated-node',
      syntheticSpec,
    );
    expect(result.empty).toBe(true);
    expect(result.edges).toEqual([]);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].isCenter).toBe(true);
  });

  it('preserves node title and layer information per neighbor', () => {
    const result = specNodeNeighborhoodGraph(
      'data-model',
      'data-model.objectschema',
      spec,
    );
    result.nodes.forEach((n) => {
      expect(n.name).toBeDefined();
      expect(n.name.length).toBeGreaterThan(0);
      expect(n.layer).toBeDefined();
    });
  });

  it('edge predicates are actual relationship predicates', () => {
    const result = specNodeNeighborhoodGraph(
      'data-model',
      'data-model.objectschema',
      spec,
    );
    result.edges.forEach((e) => {
      expect(e.predicate.length).toBeGreaterThan(0);
      expect(typeof e.predicate).toBe('string');
    });
  });

  it('center spec node appears exactly once even with self-referential relationships', () => {
    // Use a spec node that has self-referential relationships (navigation.route has aggregates and navigates-to itself)
    const result = specNodeNeighborhoodGraph(
      'navigation',
      'navigation.route',
      spec,
    );
    const centerNodes = result.nodes.filter((n) => n.isCenter);
    expect(centerNodes).toHaveLength(1);
    expect(centerNodes[0].id).toBe('navigation.route');
  });

  it('excludes self-referential relationships from neighbors', () => {
    // navigation.route has self-referential relationships (aggregates, navigates-to)
    const result = specNodeNeighborhoodGraph(
      'navigation',
      'navigation.route',
      spec,
    );
    // Verify that navigation.route does not appear as a neighbor (only as center)
    const neighborIds = result.nodes
      .filter((n) => !n.isCenter)
      .map((n) => n.id);
    expect(neighborIds).not.toContain('navigation.route');
  });

  it('self-referential relationships do not create edges in the result', () => {
    // navigation.route has self-referential relationships
    const result = specNodeNeighborhoodGraph(
      'navigation',
      'navigation.route',
      spec,
    );
    // Verify no edges target the center node itself
    result.edges.forEach((e) => {
      expect(e.targetId).not.toBe('navigation.route');
    });
  });
});

// ─── Integration: PageData includes neighborhood graphs ──────────────────────

describe('neighborhoodGraph integration with pageData', () => {
  it('model element page data includes neighborhood graph', async () => {
    const { modelNodePageData } = await import('@/apps/embedded/data/pageData');
    const metaModelId = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';
    const pageData = modelNodePageData('data-model', metaModelId, model, index, spec);
    expect(pageData).not.toBeNull();
    expect(pageData?.neighborhoodGraph).toBeDefined();
    expect(pageData?.neighborhoodGraph?.nodes.length).toBeGreaterThan(0);
    expect(pageData?.neighborhoodGraph?.nodes[0].isCenter).toBe(true);
  });

  it('spec node page data includes neighborhood graph', async () => {
    const { specNodePageData } = await import('@/apps/embedded/data/pageData');
    const pageData = specNodePageData(
      'data-model',
      'data-model.objectschema',
      spec,
      model,
    );
    expect(pageData).not.toBeNull();
    expect(pageData?.neighborhoodGraph).toBeDefined();
  });
});
