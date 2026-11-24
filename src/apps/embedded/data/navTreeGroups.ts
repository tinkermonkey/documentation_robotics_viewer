/**
 * navTreeGroups — the nav tree's Layer › Node type › Element grouping (#592),
 * and its Changesets section's Open / Closed groups (#625, at the end).
 *
 * Pure: a layer's model elements grouped by their node type, each group with a
 * count, the groups sorted A–Z by label and the elements A–Z by name inside.
 * The label is `typeLabel`'s short plural ("Components" in Application, #605):
 * the tree is already under one layer, and the by-type lanes use the same name.
 * A type with a single element still gets its own group, so the tree's shape
 * doesn't depend on how many elements a type has.
 */

import type { ModelNode } from './useModel';
import type { SpecLayerInfo } from './useSpec';
import { specTypeLabel } from './typeLabel';

export interface NavTypeGroup {
  /** Stable key for the group's open state: `<layer>.<type>`, the spec node id. */
  key: string;
  /** The element's short type (e.g. `goal`). */
  type: string;
  /** The type's short plural (`typeLabel`), e.g. `Goals`, `Components` in Application. */
  label: string;
  /** The group's elements, A–Z by name. */
  nodes: ModelNode[];
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

/** The open-state key of the group holding an element of `type` in `layer`. */
export function typeGroupKey(layer: string, type: string): string {
  return `${layer}.${type}`;
}

/** Group a layer's elements by node type, groups and elements A–Z. */
export function groupByType(
  layer: string,
  nodes: readonly ModelNode[],
  spec?: SpecLayerInfo,
): NavTypeGroup[] {
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
      label: specTypeLabel(spec, layer, type).short,
      nodes: [...list].sort((a, b) => collator.compare(a.name, b.name) || collator.compare(a.id, b.id)),
    }))
    .sort((a, b) => collator.compare(a.label, b.label) || collator.compare(a.type, b.type));
}

/**
 * The nav tree's Changesets section, grouped (#625): Open holds the staged
 * changesets (the ones that still need someone), Closed everything else
 * (applied, discarded, or a status this viewer doesn't know), as the inbox's
 * History reads it. Each group keeps the list's order (newest first).
 */
export type ChangesetGroupKey = 'open' | 'closed';

export interface NavChangesetGroup<T> {
  key: ChangesetGroupKey;
  /** "Open" or "Closed". */
  label: string;
  changesets: T[];
}

/** Which group a changeset of this status sits in. */
export function changesetGroupKey(status: string): ChangesetGroupKey {
  return status === 'staged' ? 'open' : 'closed';
}

/** Split the changeset list into Open then Closed. Both are returned, empty or not. */
export function groupChangesetsByState<T extends { status: string }>(
  list: readonly T[],
): [NavChangesetGroup<T>, NavChangesetGroup<T>] {
  const open: NavChangesetGroup<T> = { key: 'open', label: 'Open', changesets: [] };
  const closed: NavChangesetGroup<T> = { key: 'closed', label: 'Closed', changesets: [] };
  for (const cs of list) (changesetGroupKey(cs.status) === 'open' ? open : closed).changesets.push(cs);
  return [open, closed];
}
