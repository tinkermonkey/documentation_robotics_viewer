/**
 * SpecGraphBuilder Service
 * Converts SpecDataResponse + selected schema → MetaModel for graph visualization
 * Each element type in the schema becomes a node; $ref properties become edges.
 */

import { v4 as uuidv4 } from 'uuid';
import { MetaModel, ModelElement, Relationship, Layer } from '../../../core/types';
import type { SpecDataResponse, SchemaDefinition } from './embeddedDataLoader';

// JSON Schema meta-keys to exclude when discovering element types (flat-key format)
const SCHEMA_META_KEYS = new Set([
  '$schema', '$id', 'title', 'description', 'type', 'allOf', 'anyOf',
  'oneOf', 'not', 'definitions', '$defs', 'required', 'additionalProperties',
  'properties', 'examples', 'if', 'then', 'else'
]);

function getElementTypes(schema: SchemaDefinition): Record<string, SchemaDefinition> {
  // CLI v0.8.1 format: element types live inside schema.nodeSchemas
  if (schema.nodeSchemas && typeof schema.nodeSchemas === 'object') {
    return schema.nodeSchemas as Record<string, SchemaDefinition>;
  }
  // Flat-key fallback: element types are top-level keys (excluding JSON Schema meta-keys)
  const flatEntries = Object.entries(schema).filter(
    ([key, val]) => !SCHEMA_META_KEYS.has(key) && val !== null && typeof val === 'object'
  );
  if (flatEntries.length > 0) return Object.fromEntries(flatEntries) as Record<string, SchemaDefinition>;
  // Legacy fallback: definitions/$defs format
  return (schema.definitions || schema.$defs || {}) as Record<string, SchemaDefinition>;
}

/**
 * Extract the final key from a $ref string like "#/nodeSchemas/Foo" → "Foo"
 */
function resolveRefKey(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1] ?? '';
}

export class SpecGraphBuilder {
  /**
   * Convert a SpecDataResponse + selected schema ID → MetaModel for GraphViewer
   * Returns null when there is no data to display.
   */
  buildSpecModel(specData: SpecDataResponse, selectedSchemaId: string | null): MetaModel | null {
    if (!selectedSchemaId || !specData.schemas) return null;

    const schema = specData.schemas[selectedSchemaId];
    if (!schema) return null;

    const elementTypes = getElementTypes(schema);
    const keys = Object.keys(elementTypes);
    if (keys.length === 0) return null;

    // Build element map: key → ModelElement
    const elementMap = new Map<string, ModelElement>();
    for (const key of keys) {
      const def = elementTypes[key];
      const element: ModelElement = {
        id: uuidv4(),
        type: 'json-schema-element',
        name: (typeof def?.title === 'string' ? def.title : null) ?? key,
        description: typeof def?.description === 'string' ? def.description : undefined,
        layerId: selectedSchemaId,
        properties: { schemaKey: key, ...(def as Record<string, unknown>) },
        visual: {
          position: { x: 0, y: 0 },
          size: { width: 240, height: 120 },
          style: {},
        },
      };
      elementMap.set(key, element);
    }

    // Extract relationships by scanning each element type's properties for $ref
    const relationships: Relationship[] = [];
    for (const [sourceKey, def] of Object.entries(elementTypes)) {
      const sourceElement = elementMap.get(sourceKey);
      if (!sourceElement) continue;

      const properties = def?.properties;
      if (!properties || typeof properties !== 'object') continue;

      for (const [propName, propDef] of Object.entries(properties)) {
        const prop = propDef as SchemaDefinition;

        // Direct $ref
        if (typeof prop.$ref === 'string') {
          const targetKey = resolveRefKey(prop.$ref);
          const targetElement = elementMap.get(targetKey);
          if (targetElement) {
            relationships.push({
              id: uuidv4(),
              type: 'reference',
              sourceId: sourceElement.id,
              targetId: targetElement.id,
              properties: { label: propName },
            });
          }
        }

        // Array items $ref
        if (prop.items && typeof (prop.items as SchemaDefinition).$ref === 'string') {
          const targetKey = resolveRefKey((prop.items as SchemaDefinition).$ref as string);
          const targetElement = elementMap.get(targetKey);
          if (targetElement) {
            relationships.push({
              id: uuidv4(),
              type: 'reference',
              sourceId: sourceElement.id,
              targetId: targetElement.id,
              properties: { label: propName },
            });
          }
        }
      }
    }

    const elements = Array.from(elementMap.values());

    const layer: Layer = {
      id: selectedSchemaId,
      name: selectedSchemaId,
      type: 'spec-schema',
      elements,
      relationships,
    };

    return {
      version: specData.version || '0.0.0',
      layers: { [selectedSchemaId]: layer },
      references: [],
      metadata: {
        loadedAt: new Date().toISOString(),
        layerCount: 1,
        elementCount: elements.length,
        type: 'spec-visualization' as any,
      },
    };
  }
}
