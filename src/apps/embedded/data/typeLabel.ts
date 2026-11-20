/**
 * typeLabel — one display name for a DR node type, used everywhere a type is
 * named (#605): the nav tree's type groups, the by-type lanes and hive, the
 * Impact tab's group nodes, the Schema view, page headers and search.
 *
 * From the spec's title (else the type id) and the type's layer it gives:
 *   - `singular`: the title split into words ("ApplicationComponent" →
 *     "Application Component");
 *   - `plural`: the same with the last word made plural ("Application
 *     Components");
 *   - `short`: the plural without the layer's own leading word ("Components"
 *     in Application), when something is left.
 *
 * Use `short` only where the view is already scoped to one layer (the nav
 * tree under a layer, the by-type lanes, the hive); where layers mix (search,
 * Impact, Schema, page headers) use `singular` / `plural`. A count goes after
 * the label as "Components · 37" (`withCount`).
 *
 * Type ids stay ids wherever they are ids (dotted ids, `NodeTypeBadge`, spec
 * facts): this is only the name a person reads.
 *
 * Pure: no React, no store.
 */

import { layerLabel } from '../ui/domain';
import type { SpecLayerInfo } from './useSpec';

export interface TypeLabel {
  /** "Application Component" */
  singular: string;
  /** "Application Components" */
  plural: string;
  /** "Components": the plural without the layer's own leading word. */
  short: string;
}

/** Words that a camel-case split would break apart but read as one. */
const COMPOUND_WORDS = ['OAuth', 'OpenAPI', 'GraphQL', 'JavaScript', 'TypeScript'];

/** Nouns whose plural isn't the regular one (lower-case singular → plural). */
const IRREGULAR_PLURALS: Record<string, string> = {
  analysis: 'analyses',
  criterion: 'criteria',
  data: 'data',
  evidence: 'evidence',
  info: 'info',
  information: 'information',
  metadata: 'metadata',
  series: 'series',
};

function rawSplit(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_.-]+/)
    .filter(Boolean);
}

const COMPOUND_PARTS = COMPOUND_WORDS.map((w) => ({ word: w, parts: rawSplit(w) }));

/** Split a title into words at camel case, spaces, `_`, `-` and `.`, keeping known compounds whole. */
export function splitWords(title: string): string[] {
  const words = rawSplit(title);
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const compound = COMPOUND_PARTS.find(
      ({ parts }) => parts.length > 1 && parts.every((p, j) => words[i + j] === p),
    );
    if (compound) {
      out.push(compound.word);
      i += compound.parts.length - 1;
    } else {
      out.push(words[i]);
    }
  }
  return out;
}

/** Keep the case of the word's first letter on the irregular plural. */
function matchCase(word: string, plural: string): string {
  return word.charAt(0) === word.charAt(0).toUpperCase()
    ? plural.charAt(0).toUpperCase() + plural.slice(1)
    : plural;
}

/** The plural of one English word, leaving a word that is already plural ("Paths") alone. */
export function pluralize(word: string): string {
  const irregular = IRREGULAR_PLURALS[word.toLowerCase()];
  if (irregular) return matchCase(word, irregular);
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(ss|us|is|as|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/s$/i.test(word)) return word;
  return `${word}s`;
}

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

function pluralOf(words: readonly string[]): string {
  return [...words.slice(0, -1), pluralize(words[words.length - 1])].join(' ');
}

/**
 * A node type's display names, from the spec's title for it (else its id) and
 * the layer it belongs to.
 */
export function typeLabel(title: string | undefined, layerId: string): TypeLabel {
  const layerName = splitWords(layerLabel(layerId));
  const layerWords = layerName.map((w) => w.toLowerCase());
  let words = splitWords(title ?? '');
  if (words.length === 0) {
    const raw = title ?? '';
    return { singular: raw, plural: raw, short: raw };
  }
  // A bare lower-case type id ("applicationservice") has no word breaks; the
  // layer's own word is the one break we can still find.
  const layerJoined = layerWords.join('');
  const [only] = words;
  if (
    words.length === 1 &&
    layerJoined &&
    only === only.toLowerCase() &&
    only.length > layerJoined.length &&
    only.startsWith(layerJoined)
  ) {
    words = [...layerName, only.slice(layerJoined.length)];
  }
  words = words.map(capitalize);
  const lead = words.slice(0, layerWords.length).map((w) => w.toLowerCase());
  const own =
    layerWords.length > 0 && words.length > layerWords.length && lead.join(' ') === layerWords.join(' ')
      ? words.slice(layerWords.length)
      : words;
  return { singular: words.join(' '), plural: pluralOf(words), short: pluralOf(own) };
}

/** The spec's title for a layer's short type id, else the id itself. */
export function specTitleOf(spec: SpecLayerInfo | undefined, typeId: string): string {
  const i = spec?.typeIds.indexOf(typeId) ?? -1;
  return i >= 0 ? spec!.typeTitles[i] || typeId : typeId;
}

/** A type's display names from the layer's spec info (the id stands in for a missing title). */
export function specTypeLabel(spec: SpecLayerInfo | undefined, layerId: string, typeId: string): TypeLabel {
  return typeLabel(specTitleOf(spec, typeId), layerId);
}

/** A label with its count, as every view shows it: "Components · 37". */
export function withCount(label: string, count: number): string {
  return `${label} · ${count}`;
}
