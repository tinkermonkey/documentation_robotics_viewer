/**
 * neighborhoodGraph — pure builder for the neighborhood graph data (center node
 * + one-hop neighbors) for both Model elements and Schema node types.
 *
 * Given a selected node (Model element or Schema spec node), produces:
 *   - The center node with its layer information for coloring
 *   - Every node directly connected to it (any layer) via outgoing/incoming edges
 *   - Edges between the center and each neighbor
 *   - Deduplication: a neighbor reachable via multiple edges appears once
 *   - Empty result marker when there are zero direct connections
 *
 * All functions are pure, accepting the derived `/api/model` and `/api/spec`
 * payloads and returning deterministic results.
 */

import type { ModelDerived, ModelNode } from './useModel';
import type { ModelIndex } from './modelGraph';
import { resolveEndpoint } from './modelGraph';
import type { SpecPayload, SpecRelationshipSchema, SpecLayerSchema } from './specGraph';
import {
  schemaForLayer,
  titleForSpecNode,
  shortName,
} from './specGraph';

// ─── Neighborhood graph types ─────────────────────────────────────────────────

/**
 * A node in the neighborhood graph — center or neighbor. Carries enough info
 * to render and color it (layer for domain coloring).
 */
export interface NeighborhoodNode {
  /** Unique identifier: UUID for Model elements, spec_node_id for Schema nodes. */
  id: string;
  /** Display name. */
  name: string;
  /** Node type/kind (e.g., the element type or 'spec node'). */
  kind: string;
  /** Layer slug — drives domain coloring via the standard layer color scheme. */
  layer: string;
  /** true if this is the center node; false for neighbors. */
  isCenter: boolean;
}

/**
 * One edge connecting the center node to a neighbor. Carries the predicate
 * and direction (out from center, or in to center).
 */
export interface NeighborhoodEdge {
  /** Unique identifier. */
  id: string;
  /** The predicate/relationship type (e.g., 'aggregates', 'references'). */
  predicate: string;
  /** 'out' if the edge starts from the center; 'in' if it ends at the center. */
  direction: 'out' | 'in';
  /** The neighbor node's id (the OTHER endpoint from the center). */
  targetId: string;
}

/**
 * The complete neighborhood graph data for a single node. When a node has no
 * direct connections, `nodes` contains only the center node and `edges` is
 * empty, so consumers can render an empty-state message (not an error).
 */
export interface NeighborhoodGraph {
  /** Center node + all directly connected neighbors, deduplicated. */
  nodes: NeighborhoodNode[];
  /** Edges from center to each neighbor, one per unique (neighbor, predicate) pair. */
  edges: NeighborhoodEdge[];
  /** true if the center node has zero direct connections. */
  empty: boolean;
}

// ─── Model element neighborhood graph ──────────────────────────────────────────

/**
 * Neighborhood graph for a Model element: the center element plus every model
 * node it's directly connected to (either direction) via a link, regardless of
 * layer. Deduplicates neighbors reachable via multiple predicates.
 */
export function modelElementNeighborhoodGraph(
  elementId: string,
  model: ModelDerived,
  index: ModelIndex,
): NeighborhoodGraph {
  const center = index.byUuid.get(elementId);
  if (!center) {
    return { nodes: [], edges: [], empty: true };
  }

  // Collect all unique neighbors and the predicates connecting to them.
  const neighbors = new Map<string, ModelNode>();
  const edgesByTargetId = new Map<string, NeighborhoodEdge[]>();

  for (const link of model.links) {
    const src = resolveEndpoint(index, link.source);
    const tgt = resolveEndpoint(index, link.target);
    if (!src || !tgt) continue;

    let isOutgoing = false;
    let neighbor: ModelNode | undefined;

    if (src.id === elementId) {
      isOutgoing = true;
      neighbor = tgt;
    } else if (tgt.id === elementId) {
      isOutgoing = false;
      neighbor = src;
    }

    if (!neighbor) continue;

    // Track the neighbor (dedup by UUID).
    neighbors.set(neighbor.id, neighbor);

    // Track the edge.
    if (!edgesByTargetId.has(neighbor.id)) {
      edgesByTargetId.set(neighbor.id, []);
    }
    edgesByTargetId.get(neighbor.id)!.push({
      id: link.id,
      predicate: link.type,
      direction: isOutgoing ? 'out' : 'in',
      targetId: neighbor.id,
    });
  }

  // Build the nodes array: center first, then neighbors.
  const nodes: NeighborhoodNode[] = [
    {
      id: center.id,
      name: center.name,
      kind: center.type,
      layer: center.layer_id,
      isCenter: true,
    },
  ];

  for (const neighbor of neighbors.values()) {
    nodes.push({
      id: neighbor.id,
      name: neighbor.name,
      kind: neighbor.type,
      layer: neighbor.layer_id,
      isCenter: false,
    });
  }

  // Build edges array: one edge per (neighbor, predicate, direction) triple.
  const edges: NeighborhoodEdge[] = [];
  for (const neighborEdges of edgesByTargetId.values()) {
    for (const edge of neighborEdges) {
      edges.push(edge);
    }
  }

  return {
    nodes,
    edges,
    empty: neighbors.size === 0,
  };
}

// ─── Schema node type neighborhood graph ──────────────────────────────────────

/**
 * Helper: fetch all relationship schemas across all layers in the spec. Used to
 * find valid incoming relationships from OTHER layers.
 */
function allRelationshipSchemas(
  spec: SpecPayload | undefined,
): SpecRelationshipSchema[] {
  const out: SpecRelationshipSchema[] = [];
  for (const value of Object.values(spec?.schemas ?? {})) {
    const entry = value as SpecLayerSchema;
    if (!entry?.layer?.id) continue;
    out.push(...Object.values(entry.relationshipSchemas ?? {}));
  }
  return out;
}

/**
 * Neighborhood graph for a Schema node type: the center node type plus every
 * node type it has a valid outgoing or incoming relationship schema to/from,
 * regardless of layer. Deduplicates node types reachable via multiple predicates.
 */
export function specNodeNeighborhoodGraph(
  layerId: string,
  specNodeId: string,
  spec: SpecPayload | undefined,
): NeighborhoodGraph {
  const schema = schemaForLayer(spec, layerId);
  const short = shortName(layerId, specNodeId);
  const nodeSchema = schema?.nodeSchemas?.[short];

  if (!nodeSchema) {
    return { nodes: [], edges: [], empty: true };
  }

  // Collect all unique neighbors and the predicates connecting to them.
  const neighbors = new Map<string, { layerId: string; title: string }>();
  const edgesByTargetId = new Map<string, NeighborhoodEdge[]>();

  const allRels = allRelationshipSchemas(spec);

  // Outgoing relationships: this node is the source.
  for (const rel of allRels) {
    if (rel.source_spec_node_id === specNodeId) {
      const targetId = rel.destination_spec_node_id;
      const targetLayer = rel.destination_layer;
      const title = titleForSpecNode(spec, targetLayer, targetId);

      if (!neighbors.has(targetId)) {
        neighbors.set(targetId, { layerId: targetLayer, title });
      }

      if (!edgesByTargetId.has(targetId)) {
        edgesByTargetId.set(targetId, []);
      }
      edgesByTargetId.get(targetId)!.push({
        id: rel.id,
        predicate: rel.predicate,
        direction: 'out',
        targetId,
      });
    }
  }

  // Incoming relationships: this node is the destination.
  for (const rel of allRels) {
    if (rel.destination_spec_node_id === specNodeId) {
      const targetId = rel.source_spec_node_id;
      const targetLayer = rel.source_layer;
      const title = titleForSpecNode(spec, targetLayer, targetId);

      if (!neighbors.has(targetId)) {
        neighbors.set(targetId, { layerId: targetLayer, title });
      }

      if (!edgesByTargetId.has(targetId)) {
        edgesByTargetId.set(targetId, []);
      }
      edgesByTargetId.get(targetId)!.push({
        id: rel.id,
        predicate: rel.predicate,
        direction: 'in',
        targetId,
      });
    }
  }

  // Build the nodes array: center first, then neighbors.
  const nodes: NeighborhoodNode[] = [
    {
      id: specNodeId,
      name: nodeSchema.title ?? short,
      kind: 'spec node',
      layer: layerId,
      isCenter: true,
    },
  ];

  for (const [targetId, neighborInfo] of neighbors) {
    nodes.push({
      id: targetId,
      name: neighborInfo.title,
      kind: 'spec node',
      layer: neighborInfo.layerId,
      isCenter: false,
    });
  }

  // Build edges array.
  const edges: NeighborhoodEdge[] = [];
  for (const neighborEdges of edgesByTargetId.values()) {
    for (const edge of neighborEdges) {
      edges.push(edge);
    }
  }

  return {
    nodes,
    edges,
    empty: neighbors.size === 0,
  };
}
