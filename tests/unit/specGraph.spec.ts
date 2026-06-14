import { describe, it, expect } from 'vitest';
import {
  schemaForLayer,
  shortName,
  nodeTypesForLayer,
  cardShort,
  edgesForLayer,
  intraRelCount,
  specRelationshipsForNode,
  specMetadataForNode,
  firstNodeTypeId,
  type SpecPayload,
} from '@/apps/embedded/data/specGraph';
import specFixture from '../fixtures/spec.json';

const spec = specFixture as unknown as SpecPayload;

// ─── schemaForLayer ───────────────────────────────────────────────────────────

describe('schemaForLayer', () => {
  it('resolves the {slug}.json schema entry', () => {
    const s = schemaForLayer(spec, 'data-model');
    expect(s).toBeDefined();
    expect(s?.nodeSchemas).toBeDefined();
  });
  it('returns undefined for an unknown layer', () => {
    expect(schemaForLayer(spec, 'no-such-layer')).toBeUndefined();
  });
  it('returns undefined for an undefined spec', () => {
    expect(schemaForLayer(undefined, 'data-model')).toBeUndefined();
  });
});

// ─── shortName ────────────────────────────────────────────────────────────────

describe('shortName', () => {
  it('strips the owning-layer prefix', () => {
    expect(shortName('data-model', 'data-model.objectschema')).toBe('objectschema');
  });
  it('falls back to the segment after the last dot when prefix differs', () => {
    expect(shortName('api', 'data-model.objectschema')).toBe('objectschema');
  });
  it('returns the id unchanged when there is no dot', () => {
    expect(shortName('api', 'response')).toBe('response');
  });
});

// ─── REGRESSION: node-types from Object.keys(nodeSchemas), NOT layer.node_types ─

describe('nodeTypesForLayer (uses nodeSchemas even when layer.node_types is [])', () => {
  it('data-model has an EMPTY layer.node_types but non-empty nodeSchemas', () => {
    const s = schemaForLayer(spec, 'data-model')!;
    // The bug this guards: deriving node-types from layer.node_types would be empty.
    expect(s.layer?.node_types ?? []).toHaveLength(0);
    expect(Object.keys(s.nodeSchemas ?? {}).length).toBeGreaterThan(0);
  });

  it('returns one node-type per nodeSchemas entry (count matches)', () => {
    const s = schemaForLayer(spec, 'data-model')!;
    const nodes = nodeTypesForLayer(spec, 'data-model');
    expect(nodes.length).toBe(Object.keys(s.nodeSchemas ?? {}).length);
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('id is {slug}.{shortname}; label is the title; domainColor is the slug', () => {
    const s = schemaForLayer(spec, 'data-model')!;
    const nodes = nodeTypesForLayer(spec, 'data-model');
    for (const n of nodes) {
      expect(n.id.startsWith('data-model.')).toBe(true);
      const short = shortName('data-model', n.id);
      expect(s.nodeSchemas?.[short]).toBeDefined();
      expect(n.label).toBe(s.nodeSchemas?.[short]?.title ?? short);
      expect(n.kind).toBe('spec node');
      expect(n.domainColor).toBe('data-model');
    }
  });

  it('returns [] for a layer with no schema', () => {
    expect(nodeTypesForLayer(spec, 'no-such-layer')).toEqual([]);
  });
});

// ─── cardShort ────────────────────────────────────────────────────────────────

describe('cardShort', () => {
  const cases: Array<[string | undefined, string]> = [
    ['many-to-many', 'N:N'],
    ['one-to-many', '1:N'],
    ['many-to-one', 'N:1'],
    ['one-to-one', '1:1'],
    ['weird', ''], // unknown cardinality → ''
    [undefined, ''], // missing → ''
  ];
  it.each(cases)('cardShort(%j) === %j', (card, expected) => {
    expect(cardShort(card)).toBe(expected);
  });
});

// ─── edgesForLayer (intra-layer only) ─────────────────────────────────────────

describe('edgesForLayer', () => {
  it('includes only intra-layer relationships (source_layer === dest_layer === slug)', () => {
    const slug = 'data-model';
    const schema = schemaForLayer(spec, slug)!;
    const edges = edgesForLayer(spec, slug);
    const nodeIds = new Set(nodeTypesForLayer(spec, slug).map((n) => n.id));

    expect(edges.length).toBeGreaterThan(0);
    for (const e of edges) {
      // both endpoints are this layer's spec nodes; no self-loops.
      expect(nodeIds.has(e.sourceId)).toBe(true);
      expect(nodeIds.has(e.targetId)).toBe(true);
      expect(e.sourceId).not.toBe(e.targetId);
    }

    // Cross-layer rels must NOT appear as edges.
    const rels = Object.values(schema.relationshipSchemas ?? {});
    const crossLayerIds = new Set(
      rels
        .filter((r) => r.source_layer !== slug || r.destination_layer !== slug)
        .map((r) => r.id),
    );
    for (const e of edges) expect(crossLayerIds.has(e.id)).toBe(false);
  });

  it('label is the predicate', () => {
    const slug = 'data-model';
    const schema = schemaForLayer(spec, slug)!;
    const edges = edgesForLayer(spec, slug);
    const e = edges[0];
    const rel = Object.values(schema.relationshipSchemas ?? {}).find((r) => r.id === e.id)!;
    expect(e.label).toBe(rel.predicate);
  });

  it('edge count == intraRelCount minus self-loops', () => {
    const slug = 'data-model';
    const schema = schemaForLayer(spec, slug)!;
    const selfLoops = Object.values(schema.relationshipSchemas ?? {}).filter(
      (r) =>
        r.source_layer === slug &&
        r.destination_layer === slug &&
        r.source_spec_node_id === r.destination_spec_node_id,
    ).length;
    expect(edgesForLayer(spec, slug)).toHaveLength(intraRelCount(spec, slug) - selfLoops);
  });
});

// ─── specRelationshipsForNode (cross-layer carries the OTHER layer slug) ───────

describe('specRelationshipsForNode', () => {
  it('outgoing rels point at the destination; predicate carries cardinality', () => {
    const slug = 'data-model';
    const schema = schemaForLayer(spec, slug)!;
    // pick a node that has at least one outgoing rel
    const rels = Object.values(schema.relationshipSchemas ?? {});
    const outRel = rels.find((r) => r.source_layer === slug)!;
    const nodeId = outRel.source_spec_node_id;

    const links = specRelationshipsForNode(spec, slug, nodeId);
    const out = links.filter((l) => l.direction === 'out');
    expect(out.length).toBeGreaterThan(0);
    const match = out.find((l) => l.target === outRel.destination_spec_node_id)!;
    expect(match).toBeDefined();
    const card = cardShort(outRel.cardinality);
    expect(match.predicate).toBe(card ? `${outRel.predicate} ${card}` : outRel.predicate);
    // targetDomain is the destination layer (so cross-layer colors correctly).
    expect(match.targetDomain).toBe(outRel.destination_layer);
  });

  it('a cross-layer outgoing rel carries the OTHER layer slug as targetDomain', () => {
    const slug = 'data-model';
    const schema = schemaForLayer(spec, slug)!;
    const crossRel = Object.values(schema.relationshipSchemas ?? {}).find(
      (r) => r.source_layer === slug && r.destination_layer !== slug,
    )!;
    expect(crossRel).toBeDefined(); // fixture has a cross-layer data-model rel

    const links = specRelationshipsForNode(spec, slug, crossRel.source_spec_node_id);
    const cross = links.find(
      (l) => l.direction === 'out' && l.target === crossRel.destination_spec_node_id,
    )!;
    expect(cross.targetDomain).toBe(crossRel.destination_layer);
    expect(cross.targetDomain).not.toBe(slug);
  });

  it('incoming rels are surfaced with direction "in" and the source as target', () => {
    const slug = 'data-model';
    const schema = schemaForLayer(spec, slug)!;
    const inRel = Object.values(schema.relationshipSchemas ?? {}).find(
      (r) => r.destination_layer === slug && r.source_spec_node_id !== r.destination_spec_node_id,
    )!;
    const links = specRelationshipsForNode(spec, slug, inRel.destination_spec_node_id);
    const inn = links.find(
      (l) => l.direction === 'in' && l.target === inRel.source_spec_node_id,
    );
    expect(inn).toBeDefined();
    expect(inn!.targetDomain).toBe(inRel.source_layer);
  });

  it('every relationship link has a unique id', () => {
    const nodes = nodeTypesForLayer(spec, 'data-model');
    const links = specRelationshipsForNode(spec, 'data-model', nodes[0].id);
    expect(new Set(links.map((l) => l.id)).size).toBe(links.length);
  });
});

// ─── specMetadataForNode ──────────────────────────────────────────────────────

describe('specMetadataForNode', () => {
  it('surfaces the node-type ATTRIBUTES as the metadata grid', () => {
    const slug = 'data-model';
    const schema = schemaForLayer(spec, slug)!;
    const short = Object.keys(schema.nodeSchemas ?? {}).find((k) => {
      const attrs = schema.nodeSchemas?.[k]?.properties?.attributes?.properties;
      return attrs && Object.keys(attrs).length > 0;
    })!;
    const nodeId = `${slug}.${short}`;
    const meta = specMetadataForNode(spec, slug, nodeId)!;

    expect(meta).not.toBeNull();
    expect(meta.kind).toBe('SPEC NODE');
    expect(meta.domain).toBe(slug);
    const attrProps = schema.nodeSchemas?.[short]?.properties?.attributes?.properties ?? {};
    const required = new Set(
      schema.nodeSchemas?.[short]?.properties?.attributes?.required ?? [],
    );
    for (const name of Object.keys(attrProps)) {
      expect(meta.metadata?.[name]).toBe(required.has(name) ? 'required' : '—');
    }
  });

  it('returns null when the node-type has no schema', () => {
    expect(specMetadataForNode(spec, 'data-model', 'data-model.nope')).toBeNull();
  });
});

// ─── firstNodeTypeId ──────────────────────────────────────────────────────────

describe('firstNodeTypeId', () => {
  it('returns the first {slug}.{shortname} for a populated layer', () => {
    const schema = schemaForLayer(spec, 'data-model')!;
    const first = Object.keys(schema.nodeSchemas ?? {})[0];
    expect(firstNodeTypeId(spec, 'data-model')).toBe(`data-model.${first}`);
  });
  it('returns undefined for a layer with no schema', () => {
    expect(firstNodeTypeId(spec, 'no-such-layer')).toBeUndefined();
  });
});
