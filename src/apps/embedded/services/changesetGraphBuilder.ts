/**
 * ChangesetGraphBuilder Service
 * Converts changeset changes to temporary MetaModel for graph visualization
 * Applies operation-specific styling and extracts relationships
 */

import { v4 as uuidv4 } from 'uuid';
import { MetaModel, ModelElement, Relationship, Layer } from '../../../core/types';
import type { ChangesetDetails, ChangesetChange } from './embeddedDataLoader';

export type { ChangesetDetails, ChangesetChange };

/**
 * Operation-specific color schemes
 */
const OPERATION_COLORS = {
  add: {
    border: '#10b981',
    background: '#d1fae5',
    text: '#065f46'
  },
  update: {
    border: '#f59e0b',
    background: '#fef3c7',
    text: '#92400e'
  },
  delete: {
    border: '#ef4444',
    background: '#fee2e2',
    text: '#991b1b'
  }
};

export class ChangesetGraphBuilder {
  /**
   * Convert changeset to MetaModel for graph visualization
   */
  buildChangesetModel(changeset: ChangesetDetails): MetaModel {
    console.log('[ChangesetGraphBuilder] Building model from changeset:', changeset.metadata.id);

    const layers: Record<string, Layer> = {};
    const relationships: Relationship[] = [];

    // Extract changes array (handle nested structure from API)
    const changesArray = changeset.changes.changes || [];
    console.log('[ChangesetGraphBuilder] Found', changesArray.length, 'changes');

    // Group changes by layer
    const changesByLayer = this.groupChangesByLayer(changesArray);

    // Process each layer
    for (const [layerName, changes] of Object.entries(changesByLayer)) {
      const layer = this.buildLayer(layerName, changes);
      layers[layerName] = layer;

      // Extract relationships from layer elements
      const layerRelationships = this.extractRelationships(layer.elements, layerName);
      relationships.push(...layerRelationships);
    }

    const metadata = {
      loadedAt: new Date().toISOString(),
      layerCount: Object.keys(layers).length,
      elementCount: changesArray.length,
      type: 'changeset-visualization' as any,
      changesetId: changeset.metadata.id,
      changesetName: changeset.metadata.name,
      changesetStatus: changeset.metadata.status
    };

    console.log('[ChangesetGraphBuilder] Built model:', {
      layers: metadata.layerCount,
      elements: metadata.elementCount,
      relationships: relationships.length
    });

    return {
      version: '1.0.0',
      layers,
      references: [],
      metadata
    };
  }

  /**
   * Group changes by layer
   */
  private groupChangesByLayer(changes: ChangesetChange[]): Record<string, ChangesetChange[]> {
    const grouped: Record<string, ChangesetChange[]> = {};

    for (const change of changes) {
      const layerName = this.normalizeLayerName(change.layer);
      if (!grouped[layerName]) {
        grouped[layerName] = [];
      }
      grouped[layerName].push(change);
    }

    return grouped;
  }

  /**
   * Normalize layer name (capitalize first letter)
   */
  private normalizeLayerName(layer: string): string {
    return layer.charAt(0).toUpperCase() + layer.slice(1).toLowerCase();
  }

  /**
   * Build a layer from changes
   */
  private buildLayer(layerName: string, changes: ChangesetChange[]): Layer {
    const elements: ModelElement[] = [];

    for (const change of changes) {
      const element = this.buildElement(change);
      elements.push(element);
    }

    return {
      id: uuidv4(),
      name: layerName,
      type: 'changeset-layer' as any,
      elements,
      relationships: []
    };
  }

  /**
   * Build an element from a change
   */
  private buildElement(change: ChangesetChange): ModelElement {
    const colors = OPERATION_COLORS[change.operation];

    // Get element data based on operation
    let elementData: any;
    if (change.operation === 'add') {
      elementData = change.data || {};
    } else if (change.operation === 'update') {
      elementData = change.after || change.data || {};
    } else if (change.operation === 'delete') {
      elementData = change.before || change.data || {};
    } else {
      elementData = {};
    }

    const element: ModelElement = {
      id: change.element_id,
      type: change.element_type || 'generic',
      name: elementData.name || change.element_id,
      layerId: change.layer,
      properties: {
        ...elementData,
        _changesetOperation: change.operation,
        _changesetTimestamp: change.timestamp
      },
      visual: {
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        style: {
          borderColor: colors.border,
          backgroundColor: colors.background,
          textColor: colors.text
        }
      }
    };

    return element;
  }

  /**
   * Extract relationships from elements using heuristic-based detection
   */
  private extractRelationships(elements: ModelElement[], _layerName: string): Relationship[] {
    const relationships: Relationship[] = [];

    for (const element of elements) {
      const elementRelationships = this.findRelationshipsInElement(element, elements);
      relationships.push(...elementRelationships);
    }

    return relationships;
  }

  /**
   * Find relationships within an element's properties
   */
  private findRelationshipsInElement(
    element: ModelElement,
    allElements: ModelElement[]
  ): Relationship[] {
    const relationships: Relationship[] = [];
    const elementIdSet = new Set(allElements.map(e => e.id));

    // Search for references in properties
    this.searchForReferences(element.properties, (refId, propertyPath) => {
      // Check if referenced ID exists in our element set
      if (elementIdSet.has(refId)) {
        relationships.push({
          id: uuidv4(),
          type: 'reference',
          sourceId: element.id,
          targetId: refId,
          properties: {
            sourceField: propertyPath
          }
        });
      }
    });

    return relationships;
  }

  /**
   * Recursively search for ID references in object properties
   */
  private searchForReferences(
    obj: any,
    callback: (refId: string, path: string) => void,
    path: string = ''
  ): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Skip internal changeset properties
      if (key.startsWith('_changeset')) {
        continue;
      }

      // Check if property name suggests an ID reference
      if (this.isIdProperty(key) && typeof value === 'string') {
        callback(value, currentPath);
      }

      // Check if value looks like an ID (dot-notation pattern)
      if (typeof value === 'string' && this.looksLikeId(value)) {
        callback(value, currentPath);
      }

      // Recurse into objects and arrays
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'string' && this.looksLikeId(item)) {
              callback(item, `${currentPath}[${index}]`);
            } else if (typeof item === 'object') {
              this.searchForReferences(item, callback, `${currentPath}[${index}]`);
            }
          });
        } else {
          this.searchForReferences(value, callback, currentPath);
        }
      }
    }
  }

  /**
   * Check if property name suggests an ID reference
   */
  private isIdProperty(key: string): boolean {
    const idPatterns = [
      /^id$/i,
      /Id$/,
      /_id$/i,
      /^ref$/i,
      /Ref$/,
      /_ref$/i,
      /^target$/i,
      /^source$/i
    ];

    return idPatterns.some(pattern => pattern.test(key));
  }

  /**
   * Check if string value looks like an element ID (dot-notation pattern)
   */
  private looksLikeId(value: string): boolean {
    // Match patterns like "layer.type.name" or "layer-type-name"
    return /^[a-z_]+\.[a-z_]+\.[a-z0-9_-]+$/i.test(value) ||
           /^[a-z]+-[a-z]+-[a-z0-9-]+$/i.test(value);
  }

  /**
   * Get operation color for legend
   */
  static getOperationColor(operation: 'add' | 'update' | 'delete'): {
    border: string;
    background: string;
    text: string;
  } {
    return OPERATION_COLORS[operation];
  }
}
