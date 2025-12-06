import { Layer, ModelElement, Relationship, LayerType } from '../types';

/**
 * Service for parsing JSON spec files into internal model format
 */
export class SpecParser {
  /**
   * Parse a JSON spec into a Layer
   */
  parse(jsonSpec: unknown, layerType: LayerType | string): Layer {
    // Validate input
    if (!jsonSpec || typeof jsonSpec !== 'object') {
      throw new Error('Invalid JSON spec: must be an object');
    }

    const spec = jsonSpec as Record<string, unknown>;

    // Parse elements and relationships
    const elements = this.parseElements(spec.elements as unknown[] || [], layerType);
    const relationships = this.parseRelationships(spec.relationships as unknown[] || []);

    return {
      id: layerType,
      type: layerType,
      name: this.formatLayerName(layerType),
      elements,
      relationships,
      data: {
        format: (spec.format as string) || 'json',
        version: (spec.version as string) || '0.1.0',
        metadata: (spec.metadata as Record<string, unknown>) || {}
      }
    };
  }

  /**
   * Parse elements from JSON
   */
  private parseElements(elements: unknown[], layerType: string): ModelElement[] {
    if (!Array.isArray(elements)) {
      console.warn('Elements is not an array, returning empty array');
      return [];
    }

    return elements.map((element, index) => {
      const el = element as Record<string, unknown>;

      return {
        id: (el.id as string) || `${layerType}-element-${index}`,
        type: (el.type as string) || 'Unknown',
        name: (el.name as string) || (el.label as string) || `Element ${index}`,
        description: el.description as string | undefined,
        layerId: layerType,
        properties: (el.properties as Record<string, unknown>) || {},
        visual: {
          position: { x: 0, y: 0 }, // Will be set by layout engine
          size: this.getDefaultSize((el.type as string) || 'Unknown'),
          style: this.getDefaultStyle(layerType)
        },
        relationships: {
          incoming: [],
          outgoing: []
        },
        references: el.references as Record<string, string> | undefined
      };
    });
  }

  /**
   * Parse relationships from JSON
   */
  private parseRelationships(relationships: unknown[]): Relationship[] {
    if (!Array.isArray(relationships)) {
      console.warn('Relationships is not an array, returning empty array');
      return [];
    }

    return relationships.map((rel, index) => {
      const r = rel as Record<string, unknown>;

      return {
        id: (r.id as string) || `rel-${index}`,
        type: (r.type as string) || 'reference',
        sourceId: (r.source as string) || (r.sourceId as string) || '',
        targetId: (r.target as string) || (r.targetId as string) || '',
        properties: (r.properties as Record<string, unknown>) || {}
      };
    });
  }

  /**
   * Get default size for an element type
   */
  private getDefaultSize(elementType: string): { width: number; height: number } {
    const sizeMap: Record<string, { width: number; height: number }> = {
      'DataModelComponent': { width: 200, height: 150 },
      'Entity': { width: 200, height: 150 },
      'Interface': { width: 180, height: 120 },
      'Enum': { width: 150, height: 100 },
      'APIEndpoint': { width: 250, height: 80 },
      'Role': { width: 150, height: 80 },
      'Permission': { width: 180, height: 70 },
      'Policy': { width: 200, height: 100 },
      'Screen': { width: 200, height: 120 },
      'Component': { width: 150, height: 80 },
      'Service': { width: 180, height: 80 },
      'default': { width: 160, height: 80 }
    };

    return sizeMap[elementType] || sizeMap.default;
  }

  /**
   * Get default style for a layer
   */
  private getDefaultStyle(layerType: string): {
    backgroundColor?: string;
    borderColor?: string;
    icon?: string;
  } {
    const styleMap: Record<string, { backgroundColor: string; borderColor: string; icon?: string }> = {
      'Motivation': { backgroundColor: '#E8F5E9', borderColor: '#2e7d32', icon: '🎯' },
      'Business': { backgroundColor: '#FFF3E0', borderColor: '#e65100', icon: '💼' },
      'Security': { backgroundColor: '#FCE4EC', borderColor: '#c2185b', icon: '🔐' },
      'Application': { backgroundColor: '#E3F2FD', borderColor: '#1565c0', icon: '📱' },
      'Technology': { backgroundColor: '#F3E5F5', borderColor: '#6a1b9a', icon: '⚙️' },
      'API': { backgroundColor: '#E0F2F1', borderColor: '#00695c', icon: '🔌' },
      'DataModel': { backgroundColor: '#EEEEEE', borderColor: '#424242', icon: '📊' },
      'DataStore': { backgroundColor: '#EFEBE9', borderColor: '#5d4037', icon: '💾' },
      'UX': { backgroundColor: '#E8EAF6', borderColor: '#283593', icon: '🎨' },
      'Navigation': { backgroundColor: '#FFFDE7', borderColor: '#f57f17', icon: '🧭' },
      'APM': { backgroundColor: '#EFEBE9', borderColor: '#4e342e', icon: '📈' },
      'default': { backgroundColor: '#FAFAFA', borderColor: '#999999' }
    };

    return styleMap[layerType] || styleMap.default;
  }

  /**
   * Format layer name for display
   */
  private formatLayerName(layerType: string): string {
    // Add spaces before capital letters
    return layerType.replace(/([A-Z])/g, ' $1').trim();
  }

  /**
   * Validate parsed layer
   */
  validateLayer(layer: Layer): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!layer.id) {
      errors.push('Layer must have an id');
    }

    if (!layer.type) {
      errors.push('Layer must have a type');
    }

    if (!layer.elements || !Array.isArray(layer.elements)) {
      errors.push('Layer must have an elements array');
    }

    if (!layer.relationships || !Array.isArray(layer.relationships)) {
      errors.push('Layer must have a relationships array');
    }

    // Validate element IDs are unique
    const elementIds = new Set<string>();
    layer.elements?.forEach((element) => {
      if (elementIds.has(element.id)) {
        errors.push(`Duplicate element ID: ${element.id}`);
      }
      elementIds.add(element.id);
    });

    // Validate relationships reference existing elements
    layer.relationships?.forEach((rel) => {
      if (!elementIds.has(rel.sourceId)) {
        errors.push(`Relationship references non-existent source: ${rel.sourceId}`);
      }
      if (!elementIds.has(rel.targetId)) {
        errors.push(`Relationship references non-existent target: ${rel.targetId}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
