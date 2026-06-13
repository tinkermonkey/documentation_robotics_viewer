/**
 * relationships — derive a selected element's inbound/outbound relationship
 * links and its inspector metadata from the `/api/model` payload.
 *
 * Relationships are derived from `model.links[]`. Every endpoint is resolved to
 * a node UUID via the shared `ModelIndex` (links reference nodes by dotted id or
 * UUID). Cross-layer links (the endpoints live in different layers) are included
 * with `targetDomain` set to the *other* layer's slug so the inspector renders
 * the right swatch and navigation can cross layers.
 */

import type {
  RelationshipLink,
  GraphNodeMetadata,
} from '@tinkermonkey/heimdall-ui';
import type { ModelDerived, ModelNode } from './useModel';
import { resolveEndpoint, type ModelIndex } from './modelGraph';

/**
 * All relationships touching `elementId` (a node UUID), as Heimdall
 * `RelationshipLink[]`:
 *   - outgoing: links where the source resolves to this element →
 *     `{ target: otherUuid, targetTitle: otherNode.name,
 *        targetDomain: otherNode.layer_id, predicate: link.type, direction: 'out' }`
 *   - incoming: links where the target resolves to this element → `direction: 'in'`
 *
 * Cross-layer links are naturally included: `targetDomain` is always the OTHER
 * endpoint's `layer_id`, so the swatch colors correctly and navigation crosses
 * layers (the Inspector switches `layerId` to that target's layer).
 */
export function relationshipsForElement(
  model: ModelDerived,
  elementId: string,
  index: ModelIndex,
): RelationshipLink[] {
  const self = index.byUuid.get(elementId);
  if (!self) return [];

  const rels: RelationshipLink[] = [];
  let seq = 0;

  for (const link of model.links) {
    const src = resolveEndpoint(index, link.source);
    const tgt = resolveEndpoint(index, link.target);
    if (!src || !tgt) continue;

    if (src.id === elementId) {
      rels.push({
        id: `out-${seq++}-${link.id}`,
        target: tgt.id,
        targetTitle: tgt.name,
        targetDomain: tgt.layer_id,
        predicate: link.type,
        direction: 'out',
      });
    } else if (tgt.id === elementId) {
      rels.push({
        id: `in-${seq++}-${link.id}`,
        target: src.id,
        targetTitle: src.name,
        targetDomain: src.layer_id,
        predicate: link.type,
        direction: 'in',
      });
    }
  }

  return rels;
}

interface SourceReference {
  provenance?: string;
  locations?: Array<{ file?: string; symbol?: string }>;
}

/**
 * Provenance label from a node's `source_reference.provenance` (e.g.
 * `extracted`/`authored`), defaulting to `authored` when absent — matching the
 * design's `e.src ? 'extracted' : 'authored'`.
 */
function provenance(ref: SourceReference | undefined): string {
  return ref?.provenance ?? 'authored';
}

/**
 * Source symbol/file from the first `source_reference` location that has one,
 * matching the design's `e.src.symbol` (prefer the symbol, fall back to file).
 */
function sourceSymbol(ref: SourceReference | undefined): string | undefined {
  const loc = ref?.locations?.find((l) => l.symbol || l.file);
  return loc?.symbol ?? loc?.file;
}

/**
 * Build the inspector `GraphNodeMetadata` for an element with the design's
 * curated, fixed PROPERTIES set (`layer`, `type`, `provenance`, and `source`
 * when a source reference exists) rather than spreading every scalar attribute
 * — this keeps the grid aligned with the design's ELEMENT inspector and avoids
 * rows that collide with the panel title/id (e.g. an attribute named `title`).
 */
export function metadataForElement(
  node: ModelNode,
  layerLabel: string,
): GraphNodeMetadata {
  const ref = node.source_reference as SourceReference | undefined;

  const metadata: Record<string, string | number | boolean | null | undefined> =
    {
      layer: layerLabel,
      type: node.type,
      provenance: provenance(ref),
    };

  const source = sourceSymbol(ref);
  if (source) metadata.source = source;

  return {
    id: node.id,
    title: node.name,
    kind: node.type,
    domain: node.layer_id,
    description: node.description,
    metadata,
  };
}
