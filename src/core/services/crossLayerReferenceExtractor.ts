import { v4 as uuidv4 } from 'uuid';
import {
  ExtractedReference,
  ReferenceType,
  Reference,
  ReferenceEndpoint,
  Layer,
  ModelElement,
  CrossLayerReferenceMetadata
} from '../types/model';
import { PredicateCatalog } from './predicateCatalogLoader';

/**
 * Service for extracting and resolving cross-layer references
 * Handles all patterns of cross-layer links including:
 * - UUID references (x-archimate-ref, x-business-object-ref, etc.)
 * - Array references (x-supports-goals, x-fulfills-requirements, etc.)
 * - String identifier references discovered via predicate catalog fieldPaths
 * - Nested references (security.resourceRef, api.operationId, etc.)
 *
 * Field discovery is catalog-driven: predicates define which fields should be scanned for references
 * via the fieldPaths property in the predicate definition. When a catalog is provided, the extractor
 * uses fieldPaths entries (e.g., "operationId", "route") to discover identifier fields for resolution.
 * Without a catalog, the extractor falls back to common identifier properties.
 */
export class CrossLayerReferenceExtractor {
  private predicateCatalog: PredicateCatalog | null = null;

  /**
   * Create a new cross-layer reference extractor
   * @param catalog - Optional predicate catalog for catalog-driven field discovery
   */
  constructor(catalog?: PredicateCatalog) {
    this.predicateCatalog = catalog || null;
  }

  /**
   * Set the predicate catalog for catalog-driven field discovery
   * @param catalog - The loaded predicate catalog
   *
   * @deprecated Use constructor parameter instead for explicit catalog dependency
   */
  setPredicateCatalog(catalog: PredicateCatalog): void {
    this.predicateCatalog = catalog;
  }

  /**
   * Resolve extracted references to create Reference objects
   * @param extractedRefs - Array of extracted references from schema parsing
   * @param layers - All model layers for resolution
   * @returns Object containing resolved references and metadata
   */
  resolveReferences(
    extractedRefs: ExtractedReference[],
    layers: Record<string, Layer>
  ): CrossLayerReferenceMetadata {
    const resolved: Reference[] = [];
    const unresolved: ExtractedReference[] = [];
    const referencesByType: Record<string, number> = {};
    const referencesBySourceLayer: Record<string, number> = {};

    // Build lookup maps for efficient resolution
    const elementById = this.buildElementLookup(layers);
    const elementsByIdentifier = this.buildIdentifierLookup(layers);

    for (const extracted of extractedRefs) {
      // Track statistics
      referencesByType[extracted.referenceType] = (referencesByType[extracted.referenceType] || 0) + 1;
      if (extracted.sourceLayerId) {
        referencesBySourceLayer[extracted.sourceLayerId] = (referencesBySourceLayer[extracted.sourceLayerId] || 0) + 1;
      }

      // Resolve the reference
      const resolvedRefs = this.resolveExtractedReference(
        extracted,
        elementById,
        elementsByIdentifier,
        layers
      );

      if (resolvedRefs.length > 0) {
        resolved.push(...resolvedRefs);
      } else {
        unresolved.push(extracted);
      }
    }

    return {
      totalReferences: extractedRefs.length,
      referencesByType,
      referencesBySourceLayer,
      unresolvedReferences: unresolved,
      resolvedReferences: resolved
    };
  }

  /**
   * Resolve a single extracted reference
   * @param extracted - Extracted reference to resolve
   * @param elementById - Lookup map of elements by ID
   * @param elementsByIdentifier - Lookup map of elements by identifier
   * @param layers - All model layers
   * @returns Array of resolved References (can be multiple for array references)
   */
  private resolveExtractedReference(
    extracted: ExtractedReference,
    elementById: Map<string, { element: ModelElement; layerId: string }>,
    elementsByIdentifier: Map<string, { element: ModelElement; layerId: string }>,
    layers: Record<string, Layer>
  ): Reference[] {
    const references: Reference[] = [];

    // Handle single UUID reference
    if (extracted.targetId) {
      const target = elementById.get(extracted.targetId);
      if (target) {
        references.push(this.createReference(
          extracted,
          extracted.sourceElementId,
          extracted.sourceLayerId,
          target.element.id,
          target.layerId
        ));
      }
    }

    // Handle multiple UUID references (array)
    if (extracted.targetIds && extracted.targetIds.length > 0) {
      for (const targetId of extracted.targetIds) {
        const target = elementById.get(targetId);
        if (target) {
          references.push(this.createReference(
            extracted,
            extracted.sourceElementId,
            extracted.sourceLayerId,
            target.element.id,
            target.layerId
          ));
        }
      }
    }

    // Handle string identifier reference (like operationId, route)
    if (extracted.targetIdentifier) {
      const target = elementsByIdentifier.get(extracted.targetIdentifier);
      if (target) {
        references.push(this.createReference(
          extracted,
          extracted.sourceElementId,
          extracted.sourceLayerId,
          target.element.id,
          target.layerId
        ));
      }
    }

    // Handle path reference (for external references)
    if (extracted.targetPath) {
      // Try to resolve by definition key
      const target = this.findElementByDefinitionKey(extracted.targetPath, layers);
      if (target) {
        references.push(this.createReference(
          extracted,
          extracted.sourceElementId,
          extracted.sourceLayerId,
          target.element.id,
          target.layerId
        ));
      }
    }

    return references;
  }

  /**
   * Create a Reference object from extracted reference and resolved target
   */
  private createReference(
    extracted: ExtractedReference,
    sourceElementId: string | undefined,
    sourceLayerId: string | undefined,
    targetElementId: string,
    targetLayerId: string
  ): Reference {
    const source: ReferenceEndpoint = {
      elementId: sourceElementId,
      layerId: sourceLayerId,
      property: extracted.propertyName
    };

    const target: ReferenceEndpoint = {
      elementId: targetElementId,
      layerId: targetLayerId
    };

    return {
      id: uuidv4(),
      type: extracted.referenceType,
      source,
      target,
      isValid: true
    };
  }

  /**
   * Build a lookup map of all elements by their ID
   */
  private buildElementLookup(
    layers: Record<string, Layer>
  ): Map<string, { element: ModelElement; layerId: string }> {
    const lookup = new Map<string, { element: ModelElement; layerId: string }>();

    for (const [layerId, layer] of Object.entries(layers)) {
      for (const element of layer.elements) {
        lookup.set(element.id, { element, layerId });

        // Also index by properties that might be used as IDs
        if (element.properties.id && typeof element.properties.id === 'string') {
          lookup.set(element.properties.id, { element, layerId });
        }
      }
    }

    return lookup;
  }

  /**
   * Build a lookup map of elements by their identifiers
   * Catalog-driven: uses fieldPaths from predicate definitions to discover which properties to index
   * Falls back to common identifiers if catalog is not available
   */
  private buildIdentifierLookup(
    layers: Record<string, Layer>
  ): Map<string, { element: ModelElement; layerId: string }> {
    const lookup = new Map<string, { element: ModelElement; layerId: string }>();

    // Build set of field paths to index from catalog
    const catalogFieldPaths = new Set<string>();
    if (this.predicateCatalog) {
      for (const def of this.predicateCatalog.byPredicate.values()) {
        if (def.fieldPaths) {
          for (const path of def.fieldPaths) {
            catalogFieldPaths.add(path);
          }
        }
      }
    }

    for (const [layerId, layer] of Object.entries(layers)) {
      for (const element of layer.elements) {
        // Collect identifiers from catalog field paths and fallback identifiers
        const identifiers: (string | undefined)[] = [];

        if (catalogFieldPaths.size > 0) {
          // Use catalog-driven field discovery
          for (const fieldPath of catalogFieldPaths) {
            const value = this.getNestedProperty(element.properties, fieldPath);
            if (value) {
              identifiers.push(value);
            }
          }
        } else {
          // Fallback to common identifier properties when no catalog available
          identifiers.push(
            element.properties.operationId as string | undefined,
            element.properties.route as string | undefined,
            element.properties.resourceRef as string | undefined,
            element.properties.name as string | undefined,
            element.name
          );
        }

        // Index each identifier
        for (const identifier of identifiers) {
          if (identifier && typeof identifier === 'string') {
            lookup.set(identifier, { element, layerId });
          }
        }

        // Always index by definition key for schema elements
        if (element.properties.definitionKey && typeof element.properties.definitionKey === 'string') {
          lookup.set(element.properties.definitionKey, { element, layerId });
        }
      }
    }

    return lookup;
  }

  /**
   * Get a nested property from an object using dot notation path
   * @param obj - Object to traverse
   * @param path - Dot-notation path (e.g., "api.operationId", "security.resourceRef")
   * @returns Property value if found, undefined otherwise
   */
  private getNestedProperty(obj: Record<string, unknown>, path: string): string | undefined {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Find an element by its definition key (for resolving external $ref paths)
   */
  private findElementByDefinitionKey(
    definitionKey: string,
    layers: Record<string, Layer>
  ): { element: ModelElement; layerId: string } | null {
    for (const [layerId, layer] of Object.entries(layers)) {
      for (const element of layer.elements) {
        if (element.properties.definitionKey === definitionKey) {
          return { element, layerId };
        }
      }
    }
    return null;
  }

  /**
   * Get statistics about cross-layer references
   */
  getStatistics(metadata: CrossLayerReferenceMetadata): string {
    const lines: string[] = [
      `Cross-Layer References Statistics:`,
      `  Total References: ${metadata.totalReferences}`,
      `  Resolved: ${metadata.resolvedReferences.length}`,
      `  Unresolved: ${metadata.unresolvedReferences.length}`,
      ``,
      `References by Type:`,
    ];

    for (const [type, count] of Object.entries(metadata.referencesByType).sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${type}: ${count}`);
    }

    lines.push(``);
    lines.push(`References by Source Layer:`);

    for (const [layer, count] of Object.entries(metadata.referencesBySourceLayer).sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${layer}: ${count}`);
    }

    if (metadata.unresolvedReferences.length > 0) {
      lines.push(``);
      lines.push(`Unresolved References (first 10):`);
      for (const ref of metadata.unresolvedReferences.slice(0, 10)) {
        lines.push(`  ${ref.propertyName}: ${ref.targetId || ref.targetIdentifier || ref.targetPath || 'unknown'}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Filter references by type
   */
  filterByType(references: Reference[], type: ReferenceType): Reference[] {
    return references.filter(ref => ref.type === type);
  }

  /**
   * Filter references by source layer
   */
  filterBySourceLayer(references: Reference[], layerId: string): Reference[] {
    return references.filter(ref => ref.source.layerId === layerId);
  }

  /**
   * Filter references by target layer
   */
  filterByTargetLayer(references: Reference[], layerId: string): Reference[] {
    return references.filter(ref => ref.target.layerId === layerId);
  }

  /**
   * Get all references involving a specific element
   */
  getElementReferences(references: Reference[], elementId: string): {
    incoming: Reference[];
    outgoing: Reference[];
  } {
    const incoming = references.filter(ref => ref.target.elementId === elementId);
    const outgoing = references.filter(ref => ref.source.elementId === elementId);
    return { incoming, outgoing };
  }
}
