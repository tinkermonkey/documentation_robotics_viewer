/**
 * navTreeGroups — the nav tree's Layer › Node type › Element grouping (#592).
 *
 * Pure: a layer's model elements grouped by their node type, each group with a
 * count, the groups sorted A–Z by label and the elements A–Z by name inside.
 * A type with a single element still gets its own group, so the tree's shape
 * doesn't depend on how many elements a type has.
 */

import type { ModelNode } from './useModel';
import type { SpecLayerInfo } from './useSpec';

export interface NavTypeGroup {
  /** Stable key for the group's open state: `<layer>.<type>`, the spec node id. */
  key: string;
  /** The element's short type (e.g. `goal`). */
  type: string;
  /** The spec's title for the type (e.g. `Goal`), else the type itself. */
  label: string;
  /** The group's elements, A–Z by name. */
  nodes: ModelNode[];
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

/** The open-state key of the group holding an element of `type` in `layer`. */
export function typeGroupKey(layer: string, type: string): string {
  return `${layer}.${type}`;
}

/** The spec's title for each of the layer's short type ids. */
function titlesOf(spec: SpecLayerInfo | undefined): Map<string, string> {
  const titles = new Map<string, string>();
  spec?.typeIds.forEach((id, i) => titles.set(id, spec.typeTitles[i] ?? id));
  return titles;
}

/** Group a layer's elements by node type, groups and elements A–Z. */
export function groupByType(
  layer: string,
  nodes: readonly ModelNode[],
  spec?: SpecLayerInfo,
): NavTypeGroup[] {
  const titles = titlesOf(spec);
  const byType = new Map<string, ModelNode[]>();
  for (const node of nodes) {
    const list = byType.get(node.type);
    if (list) list.push(node);
    else byType.set(node.type, [node]);
  }
  return [...byType]
    .map(([type, list]) => ({
      key: typeGroupKey(layer, type),
      type,
      label: titles.get(type) ?? type,
      nodes: [...list].sort((a, b) => collator.compare(a.name, b.name) || collator.compare(a.id, b.id)),
    }))
    .sort((a, b) => collator.compare(a.label, b.label) || collator.compare(a.type, b.type));
}
