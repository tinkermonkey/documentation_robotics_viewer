/**
 * Model Indexer Service (Phase 2)
 *
 * Creates and maintains indexes for fast model element lookup and search.
 * Provides multiple indexing strategies for different query patterns.
 *
 * Features:
 * - Element indexing by layer and type
 * - Relationship indexing by source/target
 * - Full-text search indexes
 * - Keyword search support
 * - Source traceability indexes
 *
 * Usage:
 * ```typescript
 * const indexer = new ModelIndexer();
 * const index = indexer.buildIndex(model);
 *
 * // Find elements
 * const businessElements = index.elementsByLayer.get('business');
 * const services = index.elementsByType.get('Service');
 *
 * // Search elements
 * const results = indexer.search(index, 'User');
 * ```
 */

import { MetaModel, ModelIndex } from '../../types';

export interface SearchResult {
  elementId: string;
  elementName: string;
  layer: string;
  type: string;
  relevance: number;
}

export class ModelIndexer {
  /**
   * Build complete index from model
   */
  buildIndex(model: MetaModel): ModelIndex {
    const index: ModelIndex = {
      elementsByLayer: new Map(),
      elementsByType: new Map(),
      elementIdLookup: new Map(),
      relationshipsBySource: new Map(),
      relationshipsByTarget: new Map(),
      relationshipsByType: new Map(),
      elementToSource: new Map(),
      nameToElements: new Map(),
      keywordIndex: new Map(),
    };

    // Index elements
    this.indexElements(model, index);

    // Index relationships
    this.indexRelationships(model, index);

    // Build search indexes
    this.buildSearchIndexes(model, index);

    return index;
  }

  /**
   * Index all elements by layer and type
   */
  private indexElements(model: MetaModel, index: ModelIndex): void {
    Object.entries(model.layers).forEach(([layerId, layer]) => {
      if (!layer.elements) return;

      // Initialize layer index
      if (!index.elementsByLayer.has(layerId)) {
        index.elementsByLayer.set(layerId, new Set());
      }

      layer.elements.forEach(element => {
        const layerSet = index.elementsByLayer.get(layerId)!;
        layerSet.add(element.id);

        // Index by type
        if (!index.elementsByType.has(element.type)) {
          index.elementsByType.set(element.type, new Set());
        }
        index.elementsByType.get(element.type)!.add(element.id);

        // Create lookup entry
        index.elementIdLookup.set(element.id, {
          layerId,
          elementId: element.id,
        });
      });
    });
  }

  /**
   * Index all relationships
   */
  private indexRelationships(model: MetaModel, index: ModelIndex): void {
    Object.entries(model.layers).forEach(([, layer]) => {
      if (!layer.relationships) return;

      layer.relationships.forEach(relationship => {
        // Index by source
        if (!index.relationshipsBySource.has(relationship.sourceId)) {
          index.relationshipsBySource.set(relationship.sourceId, new Set());
        }
        index.relationshipsBySource.get(relationship.sourceId)!.add(relationship.id);

        // Index by target
        if (!index.relationshipsByTarget.has(relationship.targetId)) {
          index.relationshipsByTarget.set(relationship.targetId, new Set());
        }
        index.relationshipsByTarget.get(relationship.targetId)!.add(relationship.id);

        // Index by type
        if (!index.relationshipsByType.has(relationship.type)) {
          index.relationshipsByType.set(relationship.type, new Set());
        }
        index.relationshipsByType.get(relationship.type)!.add(relationship.id);
      });
    });

    // Index cross-layer references
    if (model.references) {
      model.references.forEach(reference => {
        const sourceId = reference.source.elementId;
        const targetId = reference.target.elementId;

        if (sourceId) {
          if (!index.relationshipsBySource.has(sourceId)) {
            index.relationshipsBySource.set(sourceId, new Set());
          }
          index.relationshipsBySource.get(sourceId)!.add(`ref-${sourceId}-${targetId}`);
        }

        if (targetId) {
          if (!index.relationshipsByTarget.has(targetId)) {
            index.relationshipsByTarget.set(targetId, new Set());
          }
          index.relationshipsByTarget.get(targetId)!.add(`ref-${sourceId}-${targetId}`);
        }

        if (!index.relationshipsByType.has(reference.type)) {
          index.relationshipsByType.set(reference.type, new Set());
        }
        index.relationshipsByType.get(reference.type)!.add(`ref-${sourceId}-${targetId}`);
      });
    }
  }

  /**
   * Build full-text and keyword search indexes
   */
  private buildSearchIndexes(model: MetaModel, index: ModelIndex): void {
    Object.entries(model.layers).forEach(([, layer]) => {
      if (!layer.elements) return;

      layer.elements.forEach(element => {
        // Index by name
        const name = element.name.toLowerCase();
        if (!index.nameToElements.has(name)) {
          index.nameToElements.set(name, new Set());
        }
        index.nameToElements.get(name)!.add(element.id);

        // Extract and index keywords
        const keywords = this.extractKeywords(element);
        keywords.forEach(keyword => {
          if (!index.keywordIndex.has(keyword)) {
            index.keywordIndex.set(keyword, new Set());
          }
          index.keywordIndex.get(keyword)!.add(element.id);
        });
      });
    });
  }

  /**
   * Extract searchable keywords from element
   */
  private extractKeywords(element: any): Set<string> {
    const keywords = new Set<string>();

    // Add name words
    const nameWords = element.name
      .toLowerCase()
      .split(/[\s\-_]+/)
      .filter((w: string) => w.length > 2);
    nameWords.forEach((w: string) => keywords.add(w));

    // Add type
    keywords.add(element.type.toLowerCase());

    // Add description words (if present)
    if (element.description) {
      const descWords = element.description
        .toLowerCase()
        .split(/[\s\-_.,!?]+/)
        .filter((w: string) => w.length > 3);
      descWords.forEach((w: string) => keywords.add(w));
    }

    // Add properties as keywords
    if (element.properties) {
      Object.keys(element.properties).forEach(key => {
        keywords.add(key.toLowerCase());
      });
    }

    return keywords;
  }

  /**
   * Search for elements by name or keyword
   */
  search(
    index: ModelIndex,
    query: string,
    options: { maxResults?: number; minRelevance?: number } = {}
  ): SearchResult[] {
    const { maxResults = 10, minRelevance = 0.5 } = options;
    const results = new Map<string, SearchResult>();
    const queryTerms = query.toLowerCase().split(/[\s\-_]+/).filter(t => t.length > 0);

    // Search by exact name match
    for (const term of queryTerms) {
      const exactMatches = index.nameToElements.get(term);
      if (exactMatches) {
        for (const elementId of exactMatches) {
          this.addSearchResult(results, elementId, index, queryTerms, 1.0);
        }
      }
    }

    // Search by keyword match
    for (const term of queryTerms) {
      const keywordMatches = index.keywordIndex.get(term);
      if (keywordMatches) {
        for (const elementId of keywordMatches) {
          this.addSearchResult(results, elementId, index, queryTerms, 0.7);
        }
      }
    }

    // Sort by relevance and return top results
    return Array.from(results.values())
      .filter(r => r.relevance >= minRelevance)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults);
  }

  /**
   * Add or update search result with relevance scoring
   */
  private addSearchResult(
    results: Map<string, SearchResult>,
    elementId: string,
    index: ModelIndex,
    _queryTerms: string[],
    baseRelevance: number
  ): void {
    const lookup = index.elementIdLookup.get(elementId);
    if (!lookup) return;

    const existingResult = results.get(elementId);
    const newRelevance = baseRelevance;

    if (existingResult) {
      existingResult.relevance = Math.max(existingResult.relevance, newRelevance);
    } else {
      results.set(elementId, {
        elementId,
        elementName: '', // Will be populated from model
        layer: lookup.layerId,
        type: '',
        relevance: newRelevance,
      });
    }
  }

  /**
   * Get all elements in a layer
   */
  getLayerElements(index: ModelIndex, layer: string): string[] {
    const set = index.elementsByLayer.get(layer);
    return set ? Array.from(set) : [];
  }

  /**
   * Get all elements of a type
   */
  getElementsByType(index: ModelIndex, type: string): string[] {
    const set = index.elementsByType.get(type);
    return set ? Array.from(set) : [];
  }

  /**
   * Get all relationships from an element (outgoing)
   */
  getOutgoingRelationships(index: ModelIndex, elementId: string): string[] {
    const set = index.relationshipsBySource.get(elementId);
    return set ? Array.from(set) : [];
  }

  /**
   * Get all relationships to an element (incoming)
   */
  getIncomingRelationships(index: ModelIndex, elementId: string): string[] {
    const set = index.relationshipsByTarget.get(elementId);
    return set ? Array.from(set) : [];
  }

  /**
   * Get all relationships of a type
   */
  getRelationshipsByType(index: ModelIndex, type: string): string[] {
    const set = index.relationshipsByType.get(type);
    return set ? Array.from(set) : [];
  }

  /**
   * Get all layers in index
   */
  getLayers(index: ModelIndex): string[] {
    return Array.from(index.elementsByLayer.keys());
  }

  /**
   * Get all element types in index
   */
  getElementTypes(index: ModelIndex): string[] {
    return Array.from(index.elementsByType.keys());
  }

  /**
   * Get all relationship types in index
   */
  getRelationshipTypes(index: ModelIndex): string[] {
    return Array.from(index.relationshipsByType.keys());
  }

  /**
   * Get index statistics
   */
  getStats(index: ModelIndex): {
    totalElements: number;
    totalRelationships: number;
    layerCount: number;
    typeCount: number;
    relationshipTypeCount: number;
  } {
    let totalElements = 0;
    for (const set of index.elementsByLayer.values()) {
      totalElements += set.size;
    }

    let totalRelationships = 0;
    for (const set of index.relationshipsByType.values()) {
      totalRelationships += set.size;
    }

    return {
      totalElements,
      totalRelationships,
      layerCount: index.elementsByLayer.size,
      typeCount: index.elementsByType.size,
      relationshipTypeCount: index.relationshipsByType.size,
    };
  }
}
