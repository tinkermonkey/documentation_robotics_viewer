import type { ModelDerived, ModelNode } from './useModel';
import type { ModelIndex } from './modelGraph';
import { resolveEndpoint } from './modelGraph';
import type { SpecPayload } from './specGraph';
import {
  schemaForLayer,
  titleForSpecNode,
  shortName,
  allRelationshipSchemas,
} from './specGraph';

// ─── Neighborhood graph types ─────────────────────────────────────────────────

export interface NeighborhoodNode {
  id: string;
  name: string;
  kind: string;
  layer: string;
  isCenter: boolean;
}

export interface NeighborhoodEdge {
  id: string;
  predicate: string;
  direction: 'out' | 'in';
  targetId: string;
}

export interface NeighborhoodGraph {
  nodes: NeighborhoodNode[];
  edges: NeighborhoodEdge[];
  empty: boolean;
}

// ─── Model element neighborhood graph ──────────────────────────────────────────

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
