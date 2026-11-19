/**
 * typeBands — one DR layer's elements grouped by node type, for the Model
 * view's Lanes by type and Hive by type (#594).
 *
 * Terminology: Heimdall's layered framework calls its groups "layers". Here
 * each of those groups is a DR **node type** within one DR layer, so this
 * module calls them type bands. `layerId` only ever means a DR layer; a band
 * is keyed by the element's short type (`GraphNodeData.kind`, e.g. `goal`).
 *
 * Pure: no React, no store. The components pass the band order and labels to
 * `useLayeredGraph` as its `layering`.
 */

import type { BuildLayeredIndexOptions, GraphEdgeData, GraphNodeData } from '@tinkermonkey/heimdall-ui';
import { layerLabel } from '../ui/domain';
import type { SpecLayerInfo } from './useSpec';

export interface TypeBand {
  /** The element's short type, as `GraphNodeData.kind` carries it (e.g. `applicationservice`). */
  id: string;
  /** Plural display name without the layer's own word (e.g. `Services`). */
  label: string;
  /** Elements of this type in the layer. */
  count: number;
}

/** Order types by brute force up to this many (7! = 5040 orders). */
const EXHAUSTIVE_MAX = 7;

/** A lane shows at most this many elements before the rest fold into a "+N more" node. */
export const BAND_CAP = 48;

/** Id prefix of a band's "+N more" node; the rest of the id is the band's type. */
export const MORE_PREFIX = 'more:';

function splitWords(title: string): string[] {
  return title
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean);
}

function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  return `${word}s`;
}

/**
 * A band's display name: the spec's title for the type, split into words, the
 * layer's own leading word dropped when something is left ("ApplicationService"
 * in Application → "Services"), and the last word made plural.
 */
export function typeBandLabel(title: string, layerId: string): string {
  let words = splitWords(title);
  if (words.length === 0) return title;
  const layerWords = splitWords(layerLabel(layerId)).map((w) => w.toLowerCase());
  const lead = words.slice(0, layerWords.length).map((w) => w.toLowerCase());
  if (words.length > layerWords.length && lead.join(' ') === layerWords.join(' ')) {
    words = words.slice(layerWords.length);
  }
  words = words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w));
  words[words.length - 1] = pluralize(words[words.length - 1]);
  return words.join(' ');
}

/** The spec's title for a short type id, else the id itself. */
function specTitle(type: string, spec: SpecLayerInfo | undefined): string {
  const i = spec?.typeIds.indexOf(type) ?? -1;
  return i >= 0 ? spec!.typeTitles[i] ?? type : type;
}

/** Links between two different types, counted per unordered type pair. */
function typePairCounts(nodes: readonly GraphNodeData[], edges: readonly GraphEdgeData[]): Map<string, number> {
  const kindOf = new Map(nodes.map((n) => [n.id, n.kind ?? '']));
  const pairs = new Map<string, number>();
  for (const e of edges) {
    const a = kindOf.get(e.sourceId);
    const b = kindOf.get(e.targetId);
    if (a === undefined || b === undefined || a === b) continue;
    const key = a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
    pairs.set(key, (pairs.get(key) ?? 0) + 1);
  }
  return pairs;
}

/** Lanes a whole order makes links skip: sum of links × (lanes between their ends). */
export function bandSpan(order: readonly string[], pairs: ReadonlyMap<string, number>): number {
  const rank = new Map(order.map((t, i) => [t, i]));
  let cost = 0;
  for (const [key, n] of pairs) {
    const [a, b] = key.split('\u0000');
    const ra = rank.get(a);
    const rb = rank.get(b);
    if (ra === undefined || rb === undefined) continue;
    cost += n * (Math.abs(ra - rb) - 1);
  }
  return cost;
}

/**
 * Types in lane order: the order that makes linked types sit next to each
 * other (least `bandSpan`). Ties keep the busiest-first order, so the result
 * is stable. Above `EXHAUSTIVE_MAX` types, each type in busiest-first order is
 * inserted where it adds the least span.
 */
export function orderTypes(
  counts: ReadonlyMap<string, number>,
  pairs: ReadonlyMap<string, number>,
): string[] {
  const busiest = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b));
  if (busiest.length <= 2) return busiest;
  if (busiest.length > EXHAUSTIVE_MAX) {
    let order: string[] = [];
    for (const t of busiest) {
      let best = order.length;
      let bestCost = Infinity;
      for (let i = 0; i <= order.length; i++) {
        const trial = [...order.slice(0, i), t, ...order.slice(i)];
        const cost = bandSpan(trial, pairs);
        if (cost < bestCost) {
          bestCost = cost;
          best = i;
        }
      }
      order = [...order.slice(0, best), t, ...order.slice(best)];
    }
    return order;
  }
  let best = busiest;
  let bestCost = bandSpan(busiest, pairs);
  const permute = (rest: string[], acc: string[]) => {
    if (bestCost === 0) return;
    if (rest.length === 0) {
      const cost = bandSpan(acc, pairs);
      if (cost < bestCost) {
        bestCost = cost;
        best = acc;
      }
      return;
    }
    rest.forEach((t, i) => permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, t]));
  };
  permute(busiest, []);
  return best;
}

export interface TypeBandsResult {
  bands: TypeBand[];
  /** `useLayeredGraph`'s layering: one Heimdall "layer" per node type, in band order. */
  layering: BuildLayeredIndexOptions;
}

/** A layer's elements as type bands. Memoize on its inputs: a new `layering` rebuilds the index. */
export function typeBands(
  layerId: string,
  nodes: readonly GraphNodeData[],
  edges: readonly GraphEdgeData[],
  spec?: SpecLayerInfo,
): TypeBandsResult {
  const counts = new Map<string, number>();
  for (const n of nodes) {
    const t = n.kind ?? '';
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const order = orderTypes(counts, typePairCounts(nodes, edges));
  const bands = order.map((id) => ({ id, label: typeBandLabel(specTitle(id, spec), layerId), count: counts.get(id)! }));
  return {
    bands,
    layering: {
      layerBy: 'kind',
      // The lane tint follows Heimdall's palette so neighbouring bands stay
      // apart. The title carries the type's full count: Heimdall's own count
      // is of the nodes drawn, which a capped lane ("+N more") undercounts, so
      // TypeLanesView hides it.
      layers: bands.map((b) => ({ id: b.id, label: `${b.label} · ${b.count}` })),
    },
  };
}

export interface CappedBands {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  /** Per band type: elements hidden behind its "+N more" node. */
  hidden: Map<string, number>;
}

/**
 * Folds every band over `cap` elements: the `cap - 1` busiest stay (and
 * anything in `keep`, such as the selection), the rest become one
 * `more:<type>` node labelled "+N more". Bands in `expanded` show everything.
 * Edges to a folded element are dropped (the band's own count still says how
 * many there are).
 */
export function capBands(
  nodes: readonly GraphNodeData[],
  edges: readonly GraphEdgeData[],
  bands: readonly TypeBand[],
  opts: { cap?: number; keep?: ReadonlySet<string>; expanded?: ReadonlySet<string> } = {},
): CappedBands {
  const cap = opts.cap ?? BAND_CAP;
  const keep = opts.keep ?? new Set<string>();
  const expanded = opts.expanded ?? new Set<string>();
  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.sourceId, (degree.get(e.sourceId) ?? 0) + 1);
    degree.set(e.targetId, (degree.get(e.targetId) ?? 0) + 1);
  }
  const labelOf = new Map(bands.map((b) => [b.id, b.label]));
  const byType = new Map<string, GraphNodeData[]>();
  for (const n of nodes) {
    const t = n.kind ?? '';
    const list = byType.get(t);
    if (list) list.push(n);
    else byType.set(t, [n]);
  }
  const shown: GraphNodeData[] = [];
  const hidden = new Map<string, number>();
  for (const [type, list] of byType) {
    if (list.length <= cap || expanded.has(type)) {
      shown.push(...list);
      continue;
    }
    const ranked = [...list].sort(
      (a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.label.localeCompare(b.label),
    );
    const kept = ranked.filter((n, i) => i < cap - 1 || keep.has(n.id));
    const rest = list.length - kept.length;
    shown.push(...kept);
    if (rest > 0) {
      hidden.set(type, rest);
      const plural = (labelOf.get(type) ?? type).toLowerCase();
      shown.push({ ...kept[0], id: `${MORE_PREFIX}${type}`, label: `+${rest} more ${plural}`, kind: type });
    }
  }
  const ids = new Set(shown.map((n) => n.id));
  return { nodes: shown, edges: edges.filter((e) => ids.has(e.sourceId) && ids.has(e.targetId)), hidden };
}
