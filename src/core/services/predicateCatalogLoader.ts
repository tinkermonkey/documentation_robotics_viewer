/**
 * Predicate Catalog Loader
 *
 * Stateless service that parses the predicate catalog from the base.json spec file.
 * Provides indexed maps for forward and inverse predicate lookups.
 */

import { PredicateDefinition } from '../types/model';

/**
 * Indexed predicate catalog with forward and inverse lookups
 */
export interface PredicateCatalog {
  /** Map of predicate name to definition (e.g., 'supports' -> PredicateDefinition) */
  byPredicate: Map<string, PredicateDefinition>;

  /** Map of inverse predicate name to forward predicate name (e.g., 'supported-by' -> 'supports') */
  byInverse: Map<string, string>;
}

/**
 * Load and index the predicate catalog from base.json
 *
 * The base.json file contains a `predicates` object at the root level where each key is a
 * predicate name and the value contains the predicate definition including its inverse.
 *
 * Example structure:
 * ```json
 * {
 *   "predicates": {
 *     "supports": {
 *       "predicate": "supports",
 *       "inverse": "supported-by",
 *       "category": "motivation",
 *       "description": "Element contributes to achieving or enabling another element",
 *       "archimate_alignment": "Influence",
 *       "semantics": { ... }
 *     }
 *   }
 * }
 * ```
 *
 * @param baseJson - Parsed base.json file as an unknown object
 * @returns PredicateCatalog with indexed forward and inverse lookups
 * @throws Error if input is invalid or missing required predicate fields
 */
export function loadPredicateCatalog(baseJson: unknown): PredicateCatalog {
  const catalog: PredicateCatalog = {
    byPredicate: new Map(),
    byInverse: new Map(),
  };

  // Validate input
  if (!baseJson || typeof baseJson !== 'object') {
    console.warn('loadPredicateCatalog: Invalid input, not an object');
    return catalog;
  }

  const json = baseJson as Record<string, unknown>;

  // Get predicates section from base.json
  // The base.json file has predicates at the root level
  const predicates = json.predicates as Record<string, unknown>;

  if (!predicates || typeof predicates !== 'object') {
    console.warn(
      'loadPredicateCatalog: No predicates section found in base.json'
    );
    return catalog;
  }

  // Process each predicate definition
  for (const [predicateName, definition] of Object.entries(predicates)) {
    if (!definition || typeof definition !== 'object') {
      console.warn(
        `loadPredicateCatalog: Invalid predicate definition for '${predicateName}', skipping`
      );
      continue;
    }

    const def = definition as Record<string, unknown>;

    // Validate required fields
    const predicate = def.predicate as string | undefined;
    const inverse = def.inverse as string | undefined;
    const category = def.category as string | undefined;
    const description = def.description as string | undefined;
    const semantics = def.semantics as Record<string, unknown> | undefined;

    if (!predicate || !inverse || !category || !description || !semantics) {
      console.warn(
        `loadPredicateCatalog: Missing required fields for predicate '${predicateName}', skipping`
      );
      continue;
    }

    // Validate semantics fields
    if (
      typeof semantics.directionality !== 'string' ||
      typeof semantics.transitivity !== 'boolean' ||
      typeof semantics.symmetry !== 'boolean' ||
      typeof semantics.reflexivity !== 'boolean'
    ) {
      console.warn(
        `loadPredicateCatalog: Invalid semantics for predicate '${predicate}', skipping`
      );
      continue;
    }

    // Build PredicateDefinition object
    const predicateDefinition: PredicateDefinition = {
      predicate: predicate as string,
      inverse: inverse as string,
      category: category as string,
      description: description as string,
      archimateAlignment: def.archimate_alignment
        ? (def.archimate_alignment as string)
        : undefined,
      semantics: {
        directionality: semantics.directionality as
          | 'unidirectional'
          | 'bidirectional',
        transitivity: semantics.transitivity as boolean,
        symmetry: semantics.symmetry as boolean,
        reflexivity: semantics.reflexivity as boolean,
      },
      defaultStrength: def.default_strength
        ? (def.default_strength as string)
        : undefined,
    };

    // Add to forward index
    catalog.byPredicate.set(predicate, predicateDefinition);

    // Add to inverse index (inverse name -> forward predicate name)
    catalog.byInverse.set(inverse, predicate);
  }

  return catalog;
}
