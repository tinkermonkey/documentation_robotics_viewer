/**
 * search — the topbar's type-ahead over the loaded model and spec (no React).
 *
 * `buildSearchIndex` flattens `/api/model` elements and `/api/spec` node types
 * into one list with each name lower-cased once, so a keystroke only runs
 * `searchIndex`: one pass over the list, with no allocation for a candidate
 * that doesn't match. A name matches in one of five tiers, best first: the
 * whole name, a prefix, the start of a word, anywhere, or in order with gaps
 * (fuzzy, offered only when few names match better). The best `limit` matches
 * are kept and grouped by layer: the group with the best match first, equally
 * good groups in `LAYER_ORDER`, elements before node types within a layer,
 * each hit with the character ranges to highlight.
 */

import { LAYER_ORDER } from '../ui/domain';
import type { ModelNode } from './useModel';
import type { SpecLayerInfo } from './useSpec';
import { typeLabel } from './typeLabel';

export type SearchKind = 'element' | 'type';

export interface SearchEntry {
  kind: SearchKind;
  /** Element UUID, or the node type's spec id (`<layer>.<type>`), as the nav tree uses. */
  id: string;
  /** Layer slug. */
  layer: string;
  name: string;
  /** What to show as the type: the spec's title for an element's type, else its raw type. */
  typeLabel: string;
  /** `name`, lower-cased. */
  key: string;
}

/** Match tiers, best first. */
export const MatchTier = {
  exact: 0,
  prefix: 1,
  wordPrefix: 2,
  substring: 3,
  fuzzy: 4,
} as const;
export type MatchTier = (typeof MatchTier)[keyof typeof MatchTier];

/** Half-open [start, end) character ranges of `name` that matched. */
export type MatchRange = readonly [number, number];

export interface NameMatch {
  tier: MatchTier;
  /** Lower is better within a tier: where the match starts, or how spread out a fuzzy match is. */
  cost: number;
  ranges: MatchRange[];
}

export interface SearchHit {
  entry: SearchEntry;
  match: NameMatch;
}

export interface SearchGroup {
  /** `<layer>:<kind>`. */
  key: string;
  layer: string;
  kind: SearchKind;
  hits: SearchHit[];
}

export interface SearchResult {
  groups: SearchGroup[];
  /** How many entries matched, before the limit. */
  total: number;
}

export const DEFAULT_SEARCH_LIMIT = 50;

/** Fuzzy matches are only offered when fewer than this many names match better. */
export const FUZZY_WHEN_FEWER_THAN = 5;

const EMPTY_RESULT: SearchResult = { groups: [], total: 0 };

export function buildSearchIndex(
  nodes: readonly ModelNode[],
  specByLayer: Readonly<Record<string, SpecLayerInfo>>,
): SearchEntry[] {
  const typeTitles = new Map<string, string>();
  const entries: SearchEntry[] = [];

  for (const [layer, info] of Object.entries(specByLayer)) {
    info.typeIds.forEach((typeId, i) => {
      // The type's display name (typeLabel's full singular, #605): results mix layers.
      const title = typeLabel(info.typeTitles[i] || typeId, layer).singular;
      typeTitles.set(`${layer}.${typeId}`, title);
      entries.push({
        kind: 'type',
        id: `${layer}.${typeId}`,
        layer,
        name: title,
        typeLabel: 'node type',
        key: title.toLowerCase(),
      });
    });
  }

  for (const n of nodes) {
    if (!n.name) continue;
    entries.push({
      kind: 'element',
      id: n.id,
      layer: n.layer_id,
      name: n.name,
      typeLabel: typeTitles.get(`${n.layer_id}.${n.type}`) ?? n.type,
      key: n.name.toLowerCase(),
    });
  }

  return entries;
}

const MID_WORD_FRAGMENT_COST = 20;

function isWordStart(key: string, i: number): boolean {
  if (i === 0) return true;
  const prev = key.charCodeAt(i - 1);
  // Anything that isn't a letter or digit separates words (space, '-', '_', '.', '/', '(' …).
  const isAlnum =
    (prev >= 48 && prev <= 57) || (prev >= 97 && prev <= 122) || prev > 127;
  return !isAlnum;
}

/**
 * Match a lower-cased, trimmed query against a lower-cased name.
 * Returns null when the query's characters don't all appear in order.
 */
export function matchName(key: string, query: string): NameMatch | null {
  const q = query;
  if (!q) return null;
  if (key === q) return { tier: MatchTier.exact, cost: 0, ranges: [[0, q.length]] };

  const first = key.indexOf(q);
  if (first === 0) return { tier: MatchTier.prefix, cost: 0, ranges: [[0, q.length]] };
  if (first > 0) {
    for (let i = first; i !== -1; i = key.indexOf(q, i + 1)) {
      if (isWordStart(key, i)) {
        return { tier: MatchTier.wordPrefix, cost: i, ranges: [[i, i + q.length]] };
      }
    }
    return { tier: MatchTier.substring, cost: first, ranges: [[first, first + q.length]] };
  }

  // Fuzzy: every query character in order, preferring word starts.
  let ki = 0;
  let cost = 0;
  const ranges: [number, number][] = [];
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    if (ch === ' ') continue;
    let found = key.indexOf(ch, ki);
    if (found === -1) return null;
    // Jump to a later word start for this character when there is one, so
    // "mgv" lights up "Model Graph View" rather than letters mid-word.
    const prev = ranges[ranges.length - 1];
    if (!prev || prev[1] !== found) {
      for (let w = found; w !== -1; w = key.indexOf(ch, w + 1)) {
        if (isWordStart(key, w)) {
          found = w;
          break;
        }
      }
    }
    cost += found - ki;
    if (prev && prev[1] === found) prev[1] = found + 1;
    else {
      // A fragment that starts mid-word reads as a coincidence; rank it lower.
      if (!isWordStart(key, found)) cost += MID_WORD_FRAGMENT_COST;
      ranges.push([found, found + 1]);
    }
    ki = found + 1;
  }
  // A query scattered across many fragments of a long name is noise, not a match
  // ("topbar" in "slugifyName > only hyphenates lower→Upper"). Initials still match.
  if (ranges.length === 0 || ranges.length > Math.max(3, Math.ceil(q.length / 3))) return null;
  return { tier: MatchTier.fuzzy, cost: cost + ranges.length, ranges };
}

function compareHits(a: SearchHit, b: SearchHit): number {
  return (
    a.match.tier - b.match.tier ||
    a.match.cost - b.match.cost ||
    a.entry.name.length - b.entry.name.length ||
    a.entry.name.localeCompare(b.entry.name)
  );
}

const LAYER_RANK = new Map<string, number>(LAYER_ORDER.map((slug, i) => [slug, i]));

function layerRank(layer: string): number {
  return LAYER_RANK.get(layer) ?? LAYER_ORDER.length;
}

/**
 * The best `limit` matches for `query`, grouped by layer: by each group's best
 * match tier, then spec order (an unknown layer last, by name), elements before
 * node types, best match first in each.
 */
export function searchIndex(
  index: readonly SearchEntry[],
  query: string,
  limit: number = DEFAULT_SEARCH_LIMIT,
): SearchResult {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return EMPTY_RESULT;

  const hits: SearchHit[] = [];
  for (const entry of index) {
    const match = matchName(entry.key, q);
    if (match) hits.push({ entry, match });
  }
  if (hits.length === 0) return EMPTY_RESULT;

  hits.sort(compareHits);
  // Fuzzy matches fill in for a thin result (initials, a typo'd gap); next to
  // real matches they are noise.
  let better = 0;
  while (better < hits.length && hits[better].match.tier < MatchTier.fuzzy) better++;
  const usable = better >= FUZZY_WHEN_FEWER_THAN ? hits.slice(0, better) : hits;
  const kept = usable.slice(0, limit);

  const groups = new Map<string, SearchGroup>();
  for (const hit of kept) {
    const { layer, kind } = hit.entry;
    const key = `${layer}:${kind}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, layer, kind, hits: [] };
      groups.set(key, group);
    }
    group.hits.push(hit);
  }

  // Groups keep their best hit first (hits arrive sorted), so the group holding
  // the best match leads and Enter picks it; equally good groups go in spec order.
  const ordered = [...groups.values()].sort(
    (a, b) =>
      a.hits[0].match.tier - b.hits[0].match.tier ||
      layerRank(a.layer) - layerRank(b.layer) ||
      a.layer.localeCompare(b.layer) ||
      (a.kind === b.kind ? 0 : a.kind === 'element' ? -1 : 1),
  );
  return { groups: ordered, total: usable.length };
}

/** Split `name` into plain and matched pieces for rendering a highlight. */
export function highlightPieces(
  name: string,
  ranges: readonly MatchRange[],
): { text: string; match: boolean }[] {
  const pieces: { text: string; match: boolean }[] = [];
  let at = 0;
  for (const [start, end] of ranges) {
    if (start > at) pieces.push({ text: name.slice(at, start), match: false });
    pieces.push({ text: name.slice(start, end), match: true });
    at = end;
  }
  if (at < name.length) pieces.push({ text: name.slice(at), match: false });
  return pieces;
}
