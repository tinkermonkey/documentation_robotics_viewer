/**
 * specGraph — pure transforms of the `/api/spec` payload into per-layer Heimdall
 * Schema (meta-model) view models (node-types + edges) and inspector data.
 *
 * `/api/spec` is a `schema-collection`: `schemas['<slug>.json']` holds each
 * layer schema with `layer`, `nodeSchemas` (keyed by short type name, e.g.
 * `objectschema`), and `relationshipSchemas` (keyed by a fully-qualified rel id).
 *
 * Node-type id is the `spec_node_id` = `<slug>.<shortname>`. Relationships carry
 * `source_spec_node_id` / `destination_spec_node_id` (already in that dotted
 * form), source/destination layer, predicate, and cardinality. Intra-layer
 * relationships (`source_layer === destination_layer === slug`) become graph
 * edges; cross-layer relationships surface only in the inspector (so they can
 * color + navigate across layers).
 *
 * All functions are pure: they accept the raw `/api/spec` payload and a layer
 * slug, returning deterministic results (stable positions via the SAME
 * centered-staggered grid as `modelGraph`).
 */

import type {
  GraphNodeData,
  GraphEdgeData as GraphEdge,
  RelationshipLink,
  GraphNodeMetadata,
} from '@tinkermonkey/heimdall-ui';
import { gridLayout } from './modelGraph';

// ─── Raw /api/spec shapes (only the fields this module reads) ─────────────────

interface SpecLayerBlock {
  id?: string;
  number?: number;
  name?: string;
  description?: string;
  node_types?: string[];
  inspired_by?: { standard?: string; version?: string; url?: string };
}

interface SpecNodeSchema {
  title?: string;
  description?: string;
  required?: string[];
  properties?: {
    spec_node_id?: { const?: string };
    attributes?: {
      required?: string[];
      properties?: Record<string, unknown>;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface SpecRelationshipSchema {
  id: string;
  source_spec_node_id: string;
  source_layer: string;
  destination_spec_node_id: string;
  destination_layer: string;
  predicate: string;
  cardinality?: string;
  strength?: string;
  required?: boolean;
}

export interface SpecLayerSchema {
  specVersion?: string;
  layer?: SpecLayerBlock;
  nodeSchemas?: Record<string, SpecNodeSchema>;
  relationshipSchemas?: Record<string, SpecRelationshipSchema>;
}

export interface SpecPayload {
  version?: string;
  type?: string;
  schemas?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─── Schema lookup ────────────────────────────────────────────────────────────

/** The layer schema for a slug, or undefined when the layer/file is missing. */
export function schemaForLayer(
  spec: SpecPayload | undefined,
  slug: string,
): SpecLayerSchema | undefined {
  const entry = spec?.schemas?.[`${slug}.json`];
  return entry as SpecLayerSchema | undefined;
}

/**
 * The short type name from a `spec_node_id` (`data-model.objectschema` ->
 * `objectschema`) given the owning layer slug. Falls back to the segment after
 * the last dot when the prefix doesn't match (defensive only).
 */
export function shortName(slug: string, specNodeId: string): string {
  const prefix = `${slug}.`;
  if (specNodeId.startsWith(prefix)) return specNodeId.slice(prefix.length);
  const dot = specNodeId.lastIndexOf('.');
  return dot >= 0 ? specNodeId.slice(dot + 1) : specNodeId;
}

/**
 * Resolve a `spec_node_id` to its human title by looking up the destination
 * layer's `nodeSchemas`. Falls back to the short type name when the title (or
 * the destination layer schema) is unavailable — so cross-layer targets still
 * read sensibly.
 */
function titleForSpecNode(
  spec: SpecPayload | undefined,
  layer: string,
  specNodeId: string,
): string {
  const short = shortName(layer, specNodeId);
  const schema = schemaForLayer(spec, layer);
  return schema?.nodeSchemas?.[short]?.title ?? short;
}

// ─── Node-types (graph nodes) ─────────────────────────────────────────────────

/**
 * Node-types for a layer as `GraphNodeData[]`, one per `nodeSchemas` entry:
 *   id -> spec_node_id (`<slug>.<shortname>`)
 *   label -> nodeSchema.title (fall back to the short name)
 *   kind -> 'spec node'
 *   domainColor -> the layer slug (drives the domain swatch CSS)
 *   x/y -> deterministic centered-staggered-grid position
 *
 * Uses `Object.keys(nodeSchemas)` (NOT the possibly-empty `layer.node_types`).
 */
export function nodeTypesForLayer(
  spec: SpecPayload | undefined,
  slug: string,
): GraphNodeData[] {
  const schema = schemaForLayer(spec, slug);
  const nodeSchemas = schema?.nodeSchemas ?? {};
  const entries = Object.entries(nodeSchemas);
  const ids = entries.map(([short]) => `${slug}.${short}`);
  const pos = gridLayout(ids);

  return entries.map(([short, ns]) => {
    const id = `${slug}.${short}`;
    const p = pos.get(id);
    return {
      id,
      label: ns.title ?? short,
      kind: 'spec node',
      domainColor: slug,
      x: p ? p.x : 0,
      y: p ? p.y : 0,
    };
  });
}

// ─── Edges (intra-layer relationships) ────────────────────────────────────────

const CARD_SHORT: Record<string, string> = {
  'many-to-many': 'N:N',
  'one-to-many': '1:N',
  'many-to-one': 'N:1',
  'one-to-one': '1:1',
};

/** Abbreviate a cardinality string for an edge/relationship label. */
export function cardShort(cardinality: string | undefined): string {
  return cardinality ? CARD_SHORT[cardinality] ?? '' : '';
}

/**
 * Edges for a layer as `GraphEdge[]`: intra-layer relationship schemas (both
 * endpoints in this layer), self-loops excluded. Label is the predicate.
 */
export function edgesForLayer(
  spec: SpecPayload | undefined,
  slug: string,
): GraphEdge[] {
  const schema = schemaForLayer(spec, slug);
  const rels = schema?.relationshipSchemas ?? {};
  const edges: GraphEdge[] = [];

  for (const rel of Object.values(rels)) {
    if (rel.source_layer !== slug || rel.destination_layer !== slug) continue;
    if (rel.source_spec_node_id === rel.destination_spec_node_id) continue;
    edges.push({
      id: rel.id,
      sourceId: rel.source_spec_node_id,
      targetId: rel.destination_spec_node_id,
      label: rel.predicate,
    });
  }

  return edges;
}

/** Count of intra-layer relationship schemas for a layer (header meta). */
export function intraRelCount(
  spec: SpecPayload | undefined,
  slug: string,
): number {
  const schema = schemaForLayer(spec, slug);
  const rels = schema?.relationshipSchemas ?? {};
  let n = 0;
  for (const rel of Object.values(rels)) {
    if (rel.source_layer === slug && rel.destination_layer === slug) n += 1;
  }
  return n;
}

// ─── Inspector relationships ──────────────────────────────────────────────────

/**
 * Inspector relationships for a node-type (`spec_node_id`), as Heimdall
 * `RelationshipLink[]`:
 *   - outgoing: every relationship schema with `source_spec_node_id === nodeId`
 *   - incoming: every relationship schema with `destination_spec_node_id === nodeId`
 *
 * `targetTitle` is the OTHER node's title (or short name); `targetDomain` is the
 * other layer's slug (so cross-layer rels color + navigate); `predicate` is the
 * predicate plus the abbreviated cardinality (e.g. `aggregates N:N`).
 */
export function specRelationshipsForNode(
  spec: SpecPayload | undefined,
  slug: string,
  nodeId: string,
): RelationshipLink[] {
  const schema = schemaForLayer(spec, slug);
  const rels = schema?.relationshipSchemas ?? {};

  const links: RelationshipLink[] = [];
  let seq = 0;

  for (const rel of Object.values(rels)) {
    const card = cardShort(rel.cardinality);
    const predicate = card ? `${rel.predicate} ${card}` : rel.predicate;

    if (rel.source_spec_node_id === nodeId) {
      links.push({
        id: `out-${seq++}-${rel.id}`,
        target: rel.destination_spec_node_id,
        targetTitle: titleForSpecNode(
          spec,
          rel.destination_layer,
          rel.destination_spec_node_id,
        ),
        targetDomain: rel.destination_layer,
        predicate,
        direction: 'out',
      });
    } else if (rel.destination_spec_node_id === nodeId) {
      links.push({
        id: `in-${seq++}-${rel.id}`,
        target: rel.source_spec_node_id,
        targetTitle: titleForSpecNode(
          spec,
          rel.source_layer,
          rel.source_spec_node_id,
        ),
        targetDomain: rel.source_layer,
        predicate,
        direction: 'in',
      });
    }
  }

  return links;
}

// ─── Inspector metadata ───────────────────────────────────────────────────────

/**
 * Inspector `GraphNodeMetadata` for a node-type. PROPERTIES surface the
 * node-type's ATTRIBUTES — the attribute names nested at
 * `nodeSchema.properties.attributes.properties`, each value flagged `required`
 * when listed in `nodeSchema.properties.attributes.required`. An attribute's
 * value column reads `—` (or `required`) so the grid stays the ATTRIBUTES list
 * the design's SPEC NODE inspector shows.
 */
export function specMetadataForNode(
  spec: SpecPayload | undefined,
  slug: string,
  nodeId: string,
): GraphNodeMetadata | null {
  const schema = schemaForLayer(spec, slug);
  const short = shortName(slug, nodeId);
  const ns = schema?.nodeSchemas?.[short];
  if (!ns) return null;

  const attrBlock = ns.properties?.attributes;
  const required = new Set(attrBlock?.required ?? []);
  const attrNames = Object.keys(attrBlock?.properties ?? {});

  const metadata: Record<
    string,
    string | number | boolean | null | undefined
  > = {};
  for (const name of attrNames) {
    metadata[name] = required.has(name) ? 'required' : '—';
  }

  return {
    id: nodeId,
    title: ns.title ?? short,
    kind: 'SPEC NODE',
    domain: slug,
    description: ns.description,
    metadata,
  };
}

/**
 * The first node-type id for a layer, used to seed a default selection so the
 * Schema inspector renders a populated SPEC NODE instead of an empty prompt.
 */
export function firstNodeTypeId(
  spec: SpecPayload | undefined,
  slug: string,
): string | undefined {
  const schema = schemaForLayer(spec, slug);
  const first = Object.keys(schema?.nodeSchemas ?? {})[0];
  return first ? `${slug}.${first}` : undefined;
}
