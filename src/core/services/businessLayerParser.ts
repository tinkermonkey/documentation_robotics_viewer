/**
 * Business Layer Parser
 *
 * Extracts business layer elements from loaded models (JSON Schema or YAML instance formats)
 * and transforms them into an intermediate structure for visualization.
 *
 * Follows the parser-transformer-renderer pipeline pattern established in motivationLayerParser.
 */

import { MetaModel, ModelElement, Relationship } from '../types/model';
import {
  BusinessLayerData,
  BusinessElement,
  BusinessRelationship,
  ValidationResult,
  BusinessNodeType,
} from '../types/businessLayer';

/**
 * BusinessLayerParser - Extracts and validates business layer data from models
 */
export class BusinessLayerParser {
  private elementIndex: Map<string, BusinessElement> = new Map();
  private relationshipIndex: Map<string, BusinessRelationship[]> = new Map();
  private warnings: string[] = [];

  /**
   * Parse business layer from loaded model
   *
   * @param model - The complete documentation model
   * @returns Business layer data with elements and relationships
   */
  parseBusinessLayer(model: MetaModel): BusinessLayerData {
    this.clearState();

    // Find business layer in model
    const businessLayer = this.findBusinessLayer(model);

    if (!businessLayer) {
      throw new Error('No business layer found in model');
    }

    // Extract business elements
    const elements = this.extractBusinessElements(businessLayer.elements);

    // Extract business relationships
    const relationships = this.extractBusinessRelationships(businessLayer.relationships || []);

    // Build indices for fast lookups
    this.buildElementIndex(elements);
    this.buildRelationshipIndex(relationships);

    // Calculate metadata
    const metadata = this.calculateMetadata(elements, relationships);

    return {
      elements,
      relationships,
      metadata,
    };
  }

  /**
   * Extract business elements from model elements
   */
  extractBusinessElements(modelElements: ModelElement[]): BusinessElement[] {
    const elements: BusinessElement[] = [];

    for (const element of modelElements) {
      try {
        // Validate element has required fields
        if (!element.id || !element.name) {
          this.warnings.push(
            `Skipping element with missing id or name: ${JSON.stringify(element)}`
          );
          continue;
        }

        // Convert to BusinessElement
        const businessElement: BusinessElement = {
          id: element.id,
          type: this.normalizeElementType(element.type),
          name: element.name,
          description: element.description,
          properties: element.properties || {},
          relationships: [],
        };

        elements.push(businessElement);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.warnings.push(`Failed to extract element ${element.id}: ${message}`);
      }
    }

    return elements;
  }

  /**
   * Extract business relationships from model relationships
   */
  private extractBusinessRelationships(
    modelRelationships: Relationship[]
  ): BusinessRelationship[] {
    const relationships: BusinessRelationship[] = [];

    for (const rel of modelRelationships) {
      try {
        // Validate relationship has required fields
        if (!rel.id || !rel.sourceId || !rel.targetId) {
          this.warnings.push(
            `Skipping relationship with missing fields: ${JSON.stringify(rel)}`
          );
          continue;
        }

        // Convert to BusinessRelationship
        const businessRelationship: BusinessRelationship = {
          id: rel.id,
          type: this.normalizeRelationshipType(rel.type),
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          properties: rel.properties || {},
        };

        relationships.push(businessRelationship);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.warnings.push(`Failed to extract relationship ${rel.id}: ${message}`);
      }
    }

    return relationships;
  }

  /**
   * Validate business layer data integrity
   *
   * @param elements - Business elements to validate
   * @returns Validation result with errors and warnings
   */
  validateBusinessRelationships(elements: BusinessElement[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Build element ID set for validation
    const elementIds = new Set(elements.map((e) => e.id));

    // Validate relationships reference existing elements
    for (const element of elements) {
      for (const rel of element.relationships) {
        if (!elementIds.has(rel.targetId)) {
          warnings.push(
            `Element ${element.id} has relationship to non-existent element ${rel.targetId}`
          );
        }
      }
    }

    // Check for duplicate IDs
    const idCounts = new Map<string, number>();
    for (const element of elements) {
      idCounts.set(element.id, (idCounts.get(element.id) || 0) + 1);
    }

    for (const [id, count] of idCounts.entries()) {
      if (count > 1) {
        errors.push(`Duplicate element ID found: ${id} (${count} occurrences)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get accumulated warnings
   */
  getWarnings(): string[] {
    return this.warnings;
  }

  /**
   * Get element by ID from index
   */
  getElement(id: string): BusinessElement | undefined {
    return this.elementIndex.get(id);
  }

  /**
   * Get relationships for element from index
   */
  getRelationships(elementId: string): BusinessRelationship[] {
    return this.relationshipIndex.get(elementId) || [];
  }

  /**
   * Find business layer in model (case-insensitive)
   */
  private findBusinessLayer(model: MetaModel): { elements: ModelElement[]; relationships?: Relationship[] } | null {
    const normalizedName = 'business';

    for (const [key, layer] of Object.entries(model.layers)) {
      if (key.toLowerCase() === normalizedName) {
        return layer as { elements: ModelElement[]; relationships?: Relationship[] };
      }
    }

    return null;
  }

  /**
   * Normalize element type to BusinessNodeType
   */
  private normalizeElementType(type: string): string {
    // Map various type names to standard business node types
    const typeMap: Record<string, BusinessNodeType> = {
      function: 'function',
      functions: 'function',
      process: 'process',
      processes: 'process',
      service: 'service',
      services: 'service',
      capability: 'capability',
      capabilities: 'capability',
    };

    const normalized = type.toLowerCase().trim();
    return typeMap[normalized] || type;
  }

  /**
   * Normalize relationship type
   */
  private normalizeRelationshipType(type: string | unknown): string {
    if (typeof type !== 'string') {
      return 'custom';
    }

    // Map various relationship names to standard types
    const typeMap: Record<string, string> = {
      realizes: 'realizes',
      realization: 'realizes',
      supports: 'supports',
      support: 'supports',
      flows_to: 'flows_to',
      flow: 'flows_to',
      depends_on: 'depends_on',
      dependency: 'depends_on',
      serves: 'serves',
      serving: 'serves',
      composes: 'composes',
      composition: 'composes',
      aggregates: 'aggregates',
      aggregation: 'aggregates',
    };

    const normalized = type.toLowerCase().trim().replace(/[-_\s]/g, '_');
    return typeMap[normalized] || type;
  }

  /**
   * Build element index for O(1) lookups
   */
  private buildElementIndex(elements: BusinessElement[]): void {
    this.elementIndex.clear();
    for (const element of elements) {
      this.elementIndex.set(element.id, element);
    }
  }

  /**
   * Build relationship index for fast lookups by source element
   */
  private buildRelationshipIndex(relationships: BusinessRelationship[]): void {
    this.relationshipIndex.clear();

    for (const rel of relationships) {
      const existing = this.relationshipIndex.get(rel.sourceId) || [];
      existing.push(rel);
      this.relationshipIndex.set(rel.sourceId, existing);
    }
  }

  /**
   * Calculate metadata statistics
   */
  private calculateMetadata(
    elements: BusinessElement[],
    relationships: BusinessRelationship[]
  ): BusinessLayerData['metadata'] {
    const elementsByType: Record<string, number> = {};

    for (const element of elements) {
      elementsByType[element.type] = (elementsByType[element.type] || 0) + 1;
    }

    return {
      elementCount: elements.length,
      relationshipCount: relationships.length,
      elementsByType,
    };
  }

  /**
   * Clear internal state for fresh parsing
   */
  private clearState(): void {
    this.elementIndex.clear();
    this.relationshipIndex.clear();
    this.warnings = [];
  }
}
