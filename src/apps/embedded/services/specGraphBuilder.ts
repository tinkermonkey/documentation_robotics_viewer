/**
 * SpecGraphBuilder Service
 * Converts SpecDataResponse + selected schema → MetaModel for graph visualization
 * Each element type in the schema becomes a node; $ref properties become edges.
 */

import { v4 as uuidv4 } from 'uuid';
import { MetaModel, ModelElement, Relationship, Layer } from '../../../core/types';
import type { SpecDataResponse, SchemaDefinition, RelationshipCatalog, RelationshipType } from './embeddedDataLoader';

/**
 * Returns element type definitions from the modern DR format (nodeSchemas).
 * Returns null when the schema does not contain nodeSchemas (e.g. manifest, base schemas).
 */
function getElementTypes(schema: SchemaDefinition): Record<string, SchemaDefinition> | null {
  if (schema.nodeSchemas && typeof schema.nodeSchemas === 'object') {
    return schema.nodeSchemas as Record<string, SchemaDefinition>;
  }
  return null;
}

/**
 * Extract the final key from a $ref string like "#/nodeSchemas/Foo" → "Foo"
 */
function resolveRefKey(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1] ?? '';
}

/** Returns true if the schema is an architecture layer (not "manifest" or "base"). */
export function isLayerSchema(schema: SchemaDefinition): boolean {
  if (schema.nodeSchemas && typeof schema.nodeSchemas === 'object') return true;
  const layer = schema.layer;
  if (layer && typeof layer === 'object' && typeof (layer as Record<string, unknown>).name === 'string') return true;
  return false;
}

/** Sorts schema entries by their numeric prefix ("01_motivation" → 1). Non-prefixed schemas sort last. */
export function sortLayerSchemas(entries: [string, SchemaDefinition][]): [string, SchemaDefinition][] {
  return [...entries].sort(([a], [b]) => {
    const na = /^(\d+)_/.exec(a)?.[1] ?? null;
    const nb = /^(\d+)_/.exec(b)?.[1] ?? null;
    if (na === null && nb === null) return a.localeCompare(b);
    if (na === null) return 1;
    if (nb === null) return -1;
    return parseInt(na, 10) - parseInt(nb, 10);
  });
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
    if (!elementTypes) return null;
    const keys = Object.keys(elementTypes);
    if (keys.length === 0) return null;

    // Build element map: key → ModelElement
    const elementMap = new Map<string, ModelElement>();
    for (const key of keys) {
      const def = elementTypes[key];
      // Extract attribute properties (stored under properties.attributes.properties in DR spec format)
      const attrDef = def?.properties?.attributes;
      const attributeProps = attrDef?.properties as Record<string, SchemaDefinition> | undefined;
      const element: ModelElement = {
        id: uuidv4(),
        type: 'json-schema-element',
        specNodeId: 'data.jsonSchema',
        name: (typeof def?.title === 'string' ? def.title : null) ?? key,
        description: typeof def?.description === 'string' ? def.description : undefined,
        layerId: selectedSchemaId,
        properties: {
          _schemaKey: key,
          ...(attributeProps || {}),
        },
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

      // Helper to add a relationship edge from a $ref-bearing schema
      const addRef = (ref: string, label: string) => {
        const targetKey = resolveRefKey(ref);
        const targetElement = elementMap.get(targetKey);
        if (targetElement) {
          relationships.push({
            id: uuidv4(),
            type: 'reference',
            sourceId: sourceElement.id,
            targetId: targetElement.id,
            properties: { label },
          });
        }
      };

      // Scan properties.relationships.properties for $ref (DR spec v0.8.1 format)
      const relProps = properties.relationships?.properties;
      if (relProps && typeof relProps === 'object') {
        for (const [relName, relDef] of Object.entries(relProps)) {
          const rel = relDef as SchemaDefinition;
          if (typeof rel.$ref === 'string') addRef(rel.$ref, relName);
          if (rel.items && typeof (rel.items as SchemaDefinition).$ref === 'string') {
            addRef((rel.items as SchemaDefinition).$ref as string, relName);
          }
        }
      }
    }

    // Primary: build edges from relationship catalog (DR spec v0.8.1)
    if (specData.relationshipCatalog) {
      relationships.push(...this.buildCatalogRelationships(specData.relationshipCatalog, elementMap));
    }

    // Primary alternative: build edges from schema.relationshipSchemas dict (actual DR CLI format)
    // Each value has source_spec_node_id, destination_spec_node_id, predicate
    const schemaRelSchemasMap = (schema as Record<string, unknown>).relationshipSchemas;
    if (schemaRelSchemasMap && typeof schemaRelSchemasMap === 'object' && !Array.isArray(schemaRelSchemasMap)) {
      relationships.push(...this.buildRelationshipSchemas(
        schemaRelSchemasMap as Record<string, Record<string, unknown>>,
        elementMap
      ));
    }

    // Secondary: build edges from schema-level relationshipTypes — only when no primary source produced edges
    if (relationships.length === 0) {
      const schemaRelTypes = (schema as Record<string, unknown>).relationshipTypes;
      if (Array.isArray(schemaRelTypes)) {
        const pseudoCatalog: RelationshipCatalog = { relationshipTypes: schemaRelTypes as RelationshipType[] };
        relationships.push(...this.buildCatalogRelationships(pseudoCatalog, elementMap));
      }
    }

    if (relationships.length === 0) {
      const hasCatalog = !!specData.relationshipCatalog;
      const catalogTypes = specData.relationshipCatalog?.relationshipTypes?.length ?? 0;
      const relSchemasCount = schemaRelSchemasMap ? Object.keys(schemaRelSchemasMap).length : 0;
      const sampleKeys = [...elementMap.keys()].slice(0, 5).join(', ');
      console.warn(
        `[SpecGraphBuilder] No relationships found for schema "${selectedSchemaId}". ` +
        `catalog=${hasCatalog}, catalogTypes=${catalogTypes}, relSchemas=${relSchemasCount}, ` +
        `elementKeys=[${sampleKeys}${elementMap.size > 5 ? '...' : ''}]`
      );
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

  private buildCatalogRelationships(
    catalog: RelationshipCatalog,
    elementMap: Map<string, ModelElement>
  ): Relationship[] {
    const relationships: Relationship[] = [];
    for (const relType of catalog.relationshipTypes ?? []) {
      const label = relType.id || relType.name || 'reference';
      for (const sourceType of relType.sourceTypes ?? []) {
        const sourceEl = this.findByType(sourceType, elementMap);
        if (!sourceEl) continue;
        for (const targetType of relType.targetTypes ?? []) {
          const targetEl = this.findByType(targetType, elementMap);
          if (!targetEl) continue;
          relationships.push({
            id: uuidv4(),
            type: label,
            sourceId: sourceEl.id,
            targetId: targetEl.id,
            properties: { label },
          });
        }
      }
    }
    return relationships;
  }

  private buildRelationshipSchemas(
    relSchemas: Record<string, Record<string, unknown>>,
    elementMap: Map<string, ModelElement>
  ): Relationship[] {
    const relationships: Relationship[] = [];
    for (const rel of Object.values(relSchemas)) {
      const sourceType = rel.source_spec_node_id as string | undefined;
      const targetType = rel.destination_spec_node_id as string | undefined;
      const label = (rel.predicate as string | undefined) || 'reference';
      if (!sourceType || !targetType) continue;
      const sourceEl = this.findByType(sourceType, elementMap);
      const targetEl = this.findByType(targetType, elementMap);
      if (!sourceEl || !targetEl) continue;
      relationships.push({
        id: uuidv4(),
        type: label,
        sourceId: sourceEl.id,
        targetId: targetEl.id,
        properties: { label },
      });
    }
    return relationships;
  }

  private findByType(type: string, elementMap: Map<string, ModelElement>): ModelElement | undefined {
    // 1. Exact match (fast path)
    const exact = elementMap.get(type);
    if (exact) return exact;
    // 2. Strip namespace prefix: "motivation.Goal" → "Goal"
    const dotIdx = type.lastIndexOf('.');
    if (dotIdx !== -1) {
      const suffix = type.slice(dotIdx + 1);
      const bySuffix = elementMap.get(suffix);
      if (bySuffix) return bySuffix;
    }
    // 3. Case-insensitive scan (last resort — catalog is small)
    const lower = type.toLowerCase();
    for (const [key, el] of elementMap) {
      if (key.toLowerCase() === lower) return el;
      const keySuffix = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
      if (keySuffix === lower) return el;
    }
    return undefined;
  }
}
