/**
 * Relationships YAML Parser Service
 *
 * Parses the flat relationships.yaml format (v0.8.3) containing cross-layer relationships.
 * Each relationship is represented as an object with source, target, and predicate fields.
 * Resolves dot-notation IDs to UUIDs using a lookup map provided at parse time.
 */

import * as yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { Relationship, RelationshipType } from '../types/model';
import { mapPredicateToType } from './predicateTypeMapper';

/**
 * Entry in the relationships.yaml file
 */
export interface RelationshipsYamlEntry {
  source: string;       // dot-notation path (e.g., 'motivation.stakeholder.architecture-team')
  target: string;       // dot-notation path (e.g., 'motivation.goal.visualize-multi-layer-architecture-models')
  predicate: string;    // relationship type (e.g., 'influence')
  layer?: string;       // intra-layer indicator
  category?: string;    // relationship category (e.g., 'structural')
  properties?: Record<string, unknown>;
}

/**
 * Relationships YAML Parser
 * Parses relationships.yaml files and resolves dot-notation references to UUIDs
 */
export class RelationshipsYamlParser {
  private warnings: string[] = [];

  /**
   * Parse relationships.yaml content and resolve references
   *
   * @param yamlContent - YAML file content as string
   * @param dotNotationLookup - Map of dot-notation ID -> UUID
   * @returns Array of Relationship objects with resolved IDs
   */
  parse(
    yamlContent: string,
    dotNotationLookup: Map<string, string>
  ): Relationship[] {
    this.warnings = [];

    try {
      const entries = yaml.load(yamlContent) as RelationshipsYamlEntry[];

      if (!Array.isArray(entries)) {
        this.warnings.push('relationships.yaml must contain an array of relationship entries');
        return [];
      }

      const relationships: Relationship[] = [];

      for (const entry of entries) {
        try {
          const relationship = this.parseRelationshipEntry(entry, dotNotationLookup);
          if (relationship) {
            relationships.push(relationship);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.warnings.push(`Failed to parse relationship entry: ${message}`);
        }
      }

      return relationships;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.warnings.push(`Failed to parse relationships.yaml: ${message}`);
      return [];
    }
  }

  /**
   * Parse a single relationship entry
   */
  private parseRelationshipEntry(
    entry: RelationshipsYamlEntry,
    dotNotationLookup: Map<string, string>
  ): Relationship | null {
    const { source, target, predicate, category, properties, layer: _layer } = entry;

    // Validate required fields
    if (!source || !target || !predicate) {
      throw new Error('Relationship entry missing required fields: source, target, or predicate');
    }

    // Resolve dot-notation IDs to UUIDs
    const sourceId = dotNotationLookup.get(source);
    const targetId = dotNotationLookup.get(target);

    if (!sourceId) {
      this.warnings.push(`Unresolvable source reference: ${source}`);
      return null;
    }

    if (!targetId) {
      this.warnings.push(`Unresolvable target reference: ${target}`);
      return null;
    }

    // Determine layer IDs from dot-notation paths
    const sourceLayerId = this.extractLayerId(source);
    const targetLayerId = this.extractLayerId(target);

    // Build properties object
    const relProperties: Record<string, unknown> = {};
    if (category) {
      relProperties.category = category;
    }
    if (properties) {
      Object.assign(relProperties, properties);
    }

    return {
      id: uuidv4(),
      sourceId,
      targetId,
      predicate,
      sourceLayerId,
      targetLayerId,
      // Map predicate string to RelationshipType enum
      type: this.mapPredicateToTypeLocal(predicate),
      properties: Object.keys(relProperties).length > 0 ? relProperties : undefined,
    };
  }

  /**
   * Extract layer ID from dot-notation path
   * Format: layer.type.name -> layer
   */
  private extractLayerId(dotNotation: string): string {
    const parts = dotNotation.split('.');
    return parts[0] || '';
  }

  /**
   * Map predicate string to RelationshipType enum
   */
  private mapPredicateToTypeLocal(predicate: string): RelationshipType {
    return mapPredicateToType(predicate);
  }

  /**
   * Get warnings accumulated during parsing
   */
  getWarnings(): string[] {
    return this.warnings;
  }

  /**
   * Clear accumulated warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }
}
