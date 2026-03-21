/**
 * Predicate to RelationshipType Mapper Utility
 *
 * Provides a single source of truth for mapping predicate strings to relationship type strings.
 * Used by both yamlParser and relationshipsYamlParser to ensure consistency across the codebase.
 */

import { RelationshipType } from '../types/model';

/**
 * Maps predicate strings to RelationshipType string values
 * Unrecognized predicates default to 'reference'
 *
 * @param predicate - The predicate string from YAML (e.g., 'influence', 'flow', 'serves')
 * @returns The corresponding relationship type string value
 */
export function mapPredicateToType(predicate: string): RelationshipType {
  const typeMap: Record<string, string> = {
    // ArchiMate-style relationships
    realizes: 'realization',
    serves: 'serving',
    accesses: 'access',
    uses: 'access',
    composes: 'composition',
    flows_to: 'flow',
    flow: 'flow',
    assigned_to: 'assignment',
    aggregates: 'aggregation',
    specializes: 'reference',

    // Motivation layer
    supports_goals: 'influence',
    influence: 'influence',
    fulfills_requirements: 'reference',
    constrained_by: 'reference',

    // Security
    secured_by: 'access',
    requires_permissions: 'access',

    // General relationships
    reference: 'reference',
    dependency: 'reference',
    relationship: 'reference',
  };

  return typeMap[predicate] || 'reference';
}
