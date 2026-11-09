/**
 * reach — the Model inspector's "followed across layers" relationships, built
 * on heimdall-ui 0.10's layered-graph framework (`buildLayeredIndex` +
 * `computeReach`).
 *
 * Heimdall's reach: hop 1 is every link of the selected element; with
 * `follow` > 0 it continues from elements reached over cross-layer links,
 * along cross-layer links, into any layer but the selected element's own.
 * The inspector already lists hop 1 (Outgoing / Incoming), so `followed` holds
 * only hop 2+ — each with the element and predicate it was reached through,
 * matching Heimdall's own `reachRelationships().followed` rows.
 */

import {
  buildLayeredIndex,
  computeReach,
  type GraphEdgeData,
  type GraphNodeData,
  type LayeredIndex,
} from '@tinkermonkey/heimdall-ui';
import type { ModelDerived } from './useModel';
import { resolveEndpoint, type ModelIndex } from './modelGraph';
import type { RelationshipLinkWithTooltip } from './relationships';
import { LAYER_ORDER, layerLabel } from '../ui/domain';
import type { FollowDepth } from './followDepth';

export { FOLLOW_DEPTHS, type FollowDepth } from './followDepth';

/** A followed (hop 2+) relationship: the target, how far out it is, and the
 *  element + predicate it was reached through. */
export interface FollowedRelationship extends RelationshipLinkWithTooltip {
  hop: number;
  via: { id: string; title: string; predicate: string };
}

export interface ElementReach {
  /** Hop 2+ relationships, nearest hop first, then layer order, then name. */
  followed: FollowedRelationship[];
  /** Elements reached, the selected one excluded. */
  nodeCount: number;
  /** Distinct layers reached, the selected element's own included. */
  layerCount: number;
  /** Elements reached per layer (the selected one excluded), in layer order. */
  byLayer: { layerId: string; count: number }[];
}

const NO_REACH: ElementReach = { followed: [], nodeCount: 0, layerCount: 0, byLayer: [] };

/**
 * The whole model as a Heimdall layered index, one layer per DR layer slug in
 * spec order. Link endpoints are resolved through the shared dual
 * (UUID + dotted id) index; unresolvable links are skipped, as everywhere else.
 */
export function buildModelLayeredIndex(
  model: ModelDerived,
  index: ModelIndex,
): LayeredIndex {
  const nodes: GraphNodeData[] = model.nodes.map((n) => ({
    id: n.id,
    label: n.name,
    kind: n.type,
    domainColor: n.layer_id,
  }));
  const edges: GraphEdgeData[] = [];
  model.links.forEach((link, i) => {
    const src = resolveEndpoint(index, link.source);
    const tgt = resolveEndpoint(index, link.target);
    if (!src || !tgt) return;
    edges.push({
      id: link.id ?? `link-${i}`,
      sourceId: src.id,
      targetId: tgt.id,
      label: link.type,
    });
  });
  return buildLayeredIndex(nodes, edges, {
    layerBy: 'domainColor',
    layers: LAYER_ORDER.map((id) => ({ id, label: layerLabel(id) })),
  });
}

/** The reach of `elementId` (a node UUID) at `follow` depth. */
export function elementReach(
  layered: LayeredIndex,
  elementId: string,
  follow: FollowDepth,
): ElementReach {
  if (!layered.nodeById.has(elementId)) return NO_REACH;
  const reach = computeReach(layered, elementId, { follow });

  const layers = new Set<string>();
  const perLayer = new Map<string, number>();
  const deep: { rel: FollowedRelationship; rank: number }[] = [];
  for (const [nodeId, hop] of reach.hopOf) {
    const node = layered.nodeById.get(nodeId);
    if (!node) continue;
    layers.add(node.layerId);
    if (hop >= 1) perLayer.set(node.layerId, (perLayer.get(node.layerId) ?? 0) + 1);
    if (hop < 2) continue;

    const v = reach.via.get(nodeId);
    const from = v ? layered.nodeById.get(v.fromId) : undefined;
    const link = v ? layered.linkById.get(v.linkId) : undefined;
    if (!from || !link) continue;

    const direction = link.sourceId === from.id ? 'out' : 'in';
    const predicate = link.predicates.join(' · ');
    // Predicate tooltips describe one predicate between two types; skip them
    // for a bundled link carrying several.
    const single = link.predicates.length === 1;
    deep.push({
      rank: node.layerRank,
      rel: {
        id: `followed-${node.id}`,
        target: node.nodeId,
        targetTitle: node.label,
        targetDomain: node.layerId,
        predicate,
        direction,
        hop,
        via: { id: from.nodeId, title: from.label, predicate },
        sourceTypeLabel: single ? (direction === 'out' ? from.kind : node.kind) : undefined,
        destinationTypeLabel: single ? (direction === 'out' ? node.kind : from.kind) : undefined,
      },
    });
  }

  deep.sort(
    (a, b) =>
      a.rel.hop - b.rel.hop ||
      a.rank - b.rank ||
      a.rel.targetTitle.localeCompare(b.rel.targetTitle),
  );
  return {
    followed: deep.map((d) => d.rel),
    nodeCount: reach.hopOf.size - 1,
    layerCount: layers.size,
    byLayer: layered.layers
      .filter((l) => perLayer.has(l.id))
      .map((l) => ({ layerId: l.id, count: perLayer.get(l.id)! })),
  };
}
