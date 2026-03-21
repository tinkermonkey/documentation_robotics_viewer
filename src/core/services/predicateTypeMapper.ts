/**
 * Predicate to RelationshipType Mapper Utility
 *
 * Provides a single source of truth for mapping predicate strings to RelationshipType enums.
 * Used by both yamlParser and relationshipsYamlParser to ensure consistency across the codebase.
 */

import { RelationshipType } from '../types/model';

/**
 * Maps predicate strings to RelationshipType enum values
 * Unrecognized predicates default to RelationshipType.Reference
 *
 * @param predicate - The predicate string from YAML (e.g., 'influence', 'flow', 'serves')
 * @returns The corresponding RelationshipType enum value
 */
export function mapPredicateToType(predicate: string): RelationshipType {
  const typeMap: Record<string, RelationshipType> = {
    // ArchiMate-style relationships
    realizes: RelationshipType.Realization,
    serves: RelationshipType.Serving,
    accesses: RelationshipType.Access,
    uses: RelationshipType.Access,
    composes: RelationshipType.Composition,
    flows_to: RelationshipType.Flow,
    flow: RelationshipType.Flow,
    assigned_to: RelationshipType.Assignment,
    aggregates: RelationshipType.Aggregation,
    specializes: RelationshipType.Reference,

    // Motivation layer
    supports_goals: RelationshipType.Influence,
    influence: RelationshipType.Influence,
    fulfills_requirements: RelationshipType.Reference,
    constrained_by: RelationshipType.Reference,

    // Security
    secured_by: RelationshipType.Access,
    requires_permissions: RelationshipType.Access,

    // General relationships
    reference: RelationshipType.Reference,
    dependency: RelationshipType.Reference,
    relationship: RelationshipType.Reference,
  };

  return typeMap[predicate] || RelationshipType.Reference;
}
