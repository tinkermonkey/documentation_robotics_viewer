/**
 * Predicate to RelationshipType Mapper Utility
 *
 * Provides a single source of truth for mapping predicate strings to relationship type strings.
 * Used by both yamlParser and relationshipsYamlParser to ensure consistency across the codebase.
 */

import { RelationshipType } from '../types/model';

/**
 * Maps predicate strings to RelationshipType string values
 * Normalizes predicates by converting underscores to hyphens for catalog compatibility.
 * Unrecognized predicates default to 'reference'
 *
 * @param predicate - The predicate string from YAML (e.g., 'influence', 'flow', 'serves')
 * @returns The corresponding relationship type string value
 */
export function mapPredicateToType(predicate: string): RelationshipType {
  // Normalize predicate: convert underscores to hyphens for catalog alignment
  const normalizedPredicate = predicate.replace(/_/g, '-').toLowerCase();

  const typeMap: Record<string, string> = {
    // ArchiMate-style relationships
    'realizes': 'realization',
    'serves': 'serving',
    'accesses': 'access',
    'uses': 'access',
    'composes': 'composition',
    'flows-to': 'flow',
    'flow': 'flow',
    'assigned-to': 'assignment',
    'aggregates': 'aggregation',
    'specializes': 'reference',

    // Motivation layer (catalog-aligned names with hyphens)
    'supports': 'influence',
    'supports-goals': 'influence',
    'influence': 'influence',
    'fulfills': 'reference',
    'fulfills-requirements': 'reference',
    'constrained-by': 'reference',

    // Security
    'secured-by': 'access',
    'requires-permissions': 'access',

    // General relationships
    'reference': 'reference',
    'dependency': 'reference',
    'relationship': 'relationship',
  };

  return typeMap[normalizedPredicate] || 'reference';
}
