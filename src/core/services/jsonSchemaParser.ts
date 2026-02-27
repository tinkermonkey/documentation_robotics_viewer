import { v4 as uuidv4 } from 'uuid';
import {
  JSONSchemaElement,
  JSONSchemaLayer,
  SchemaProperty,
  SchemaReference
} from '../types/jsonSchema';
import { Relationship, RelationshipType, ExtractedReference, ReferenceType } from '../types/model';

/**
 * Parser for JSON Schema definition files
 * Transforms schema definitions into visual model elements
 */
export class JSONSchemaParser {
  /**
   * Parse a JSON Schema file into a layer with elements
   * @param layerName - Layer name from filename (e.g., "Business", "DataModel")
   * @param schemaData - Raw JSON Schema object
   * @returns Parsed layer with schema elements
   */
  parseSchemaLayer(layerName: string, schemaData: any): JSONSchemaLayer {
    const schemaId = schemaData.$id || `schema:${layerName}`;
    const version = this.extractSchemaVersion(schemaData.$schema);

    // Extract elements from definitions
    const elements = this.extractDefinitions(schemaData.definitions || {}, schemaId, layerName);

    // Check if the top-level schema itself is a definition (has properties or type)
    // and no definitions were found (or even if they were, maybe it's a mixed file)
    // Usually if 'definitions' exists, the top level is just a container.
    // But if 'definitions' is missing or empty, the top level might be the definition.
    if (elements.length === 0 && (schemaData.properties || schemaData.type === 'object')) {
      try {
        // Use the layer name or title as the key
        const key = schemaData.title || layerName;
        const element = this.parseDefinition(key, schemaData, schemaId, layerName);
        elements.push(element);
      } catch (error) {
        console.warn(`Failed to parse top-level definition:`, error);
      }
    }

    // Build relationships from references
    const relationships = this.buildRelationships(elements);

    const layer: JSONSchemaLayer = {
      id: uuidv4(),
      type: 'json-schema',
      name: layerName,
      elements,
      relationships,
      schemaMetadata: {
        schemaId,
        version,
        title: schemaData.title || layerName,
        description: schemaData.description
      }
    };

    return layer;
  }

  /**
   * Extract schema version from $schema URL
   */
  private extractSchemaVersion(schemaUrl?: string): string {
    if (!schemaUrl) return 'unknown';
    const match = schemaUrl.match(/draft-(\d+)/);
    return match ? `draft-${match[1]}` : 'unknown';
  }

  /**
   * Extract individual elements from schema definitions
   * @param definitions - The definitions object from schema
   * @param schemaId - Parent schema $id
   * @param layerName - Layer name for element layerId
   * @returns Array of schema elements
   */
  private extractDefinitions(
    definitions: any,
    schemaId: string,
    layerName: string
  ): JSONSchemaElement[] {
    const elements: JSONSchemaElement[] = [];

    for (const [key, definition] of Object.entries(definitions)) {
      try {
        const element = this.parseDefinition(key, definition as any, schemaId, layerName);
        elements.push(element);
      } catch (error) {
        console.warn(`Failed to parse definition "${key}":`, error);
      }
    }

    return elements;
  }

  /**
   * Parse a single schema definition into an element
   * @param key - Definition key (e.g., "BusinessActor")
   * @param definition - Definition object
   * @param schemaId - Parent schema $id
   * @param layerName - Layer name
   * @returns Schema element
   */
  private parseDefinition(
    key: string,
    definition: any,
    schemaId: string,
    layerName: string
  ): JSONSchemaElement {
    const title = definition.title || key;
    const description = definition.description || '';
    const required = definition.required || [];
    const properties = this.extractProperties(definition.properties || {}, required);
    const references = this.extractReferences(definition, key);

    const element: JSONSchemaElement = {
      id: uuidv4(),
      type: 'json-schema-element',
      name: title,
      description,
      layerId: layerName,
      properties: {
        definitionKey: key,
        ...definition
      },
      visual: {
        position: { x: 0, y: 0 },
        size: { width: 250, height: 150 },
        style: {
          backgroundColor: '#f5f5f5',
          borderColor: '#333',
          shape: 'rectangle'
        }
      },
      schemaInfo: {
        schemaId,
        definitionKey: key,
        title,
        required,
        additionalProperties: definition.additionalProperties,
        properties,
        references
      }
    };

    return element;
  }

  /**
   * Extract property information with constraints
   * @param properties - Properties object from definition
   * @param required - Array of required property names
   * @returns Array of schema properties with constraints
   */
  private extractProperties(properties: any, required: string[]): SchemaProperty[] {
    const props: SchemaProperty[] = [];

    for (const [name, propDef] of Object.entries(properties)) {
      const def = propDef as any;
      const prop: SchemaProperty = {
        name,
        type: def.type || 'any',
        description: def.description,
        required: required.includes(name),
        format: def.format,
        pattern: def.pattern,
        minLength: def.minLength,
        maxLength: def.maxLength,
        minimum: def.minimum,
        maximum: def.maximum,
        enum: def.enum
      };

      // Handle $ref references
      if (def.$ref) {
        prop.ref = def.$ref;
      }

      // Handle array items
      if (def.items) {
        prop.items = {
          type: def.items.type,
          ref: def.items.$ref
        };
      }

      // Handle nested properties (1 level deep for MVP)
      if (def.type === 'object' && def.properties) {
        prop.properties = this.extractProperties(def.properties, def.required || []);
      }

      props.push(prop);
    }

    return props;
  }

  /**
   * Find all $ref references in a definition
   * @param definition - Schema definition object
   * @param definitionKey - Key of the definition being parsed
   * @returns Array of schema references
   */
  private extractReferences(definition: any, definitionKey: string): SchemaReference[] {
    const references: SchemaReference[] = [];
    const properties = definition.properties || {};

    for (const [propName, propDef] of Object.entries(properties)) {
      const def = propDef as any;

      // Direct $ref
      if (def.$ref) {
        const ref = this.parseRef(def.$ref, propName, definitionKey);
        if (ref) references.push(ref);
      }

      // $ref in array items
      if (def.items?.$ref) {
        const ref = this.parseRef(def.items.$ref, propName, definitionKey, 'many');
        if (ref) references.push(ref);
      }
    }

    return references;
  }

  /**
   * Parse a $ref string into a SchemaReference
   */
  private parseRef(
    refValue: string,
    propName: string,
    _fromDefinition: string,
    cardinality: '1' | 'many' = '1'
  ): SchemaReference | null {
    // Internal reference: #/definitions/BusinessActor
    if (refValue.startsWith('#/definitions/')) {
      const targetDef = refValue.replace('#/definitions/', '');
      return {
        from: propName,
        to: targetDef,
        refType: 'definition',
        cardinality
      };
    }

    // External reference: ../05-technology-layer.json#/definitions/Server
    if (refValue.includes('#/definitions/')) {
      const [, defPart] = refValue.split('#/definitions/');
      return {
        from: propName,
        to: defPart,
        refType: 'external',
        cardinality
      };
    }

    return null;
  }

  /**
   * Build relationships from schema references
   * @param elements - All schema elements in layer
   * @returns Array of relationships
   */
  private buildRelationships(elements: JSONSchemaElement[]): Relationship[] {
    const relationships: Relationship[] = [];
    const elementsByKey = new Map<string, JSONSchemaElement>();

    // Index elements by definition key
    for (const element of elements) {
      elementsByKey.set(element.schemaInfo.definitionKey, element);
    }

    // Build relationships from references
    for (const element of elements) {
      for (const ref of element.schemaInfo.references) {
        // Only create relationships for internal references (same layer)
        if (ref.refType === 'definition') {
          const targetElement = elementsByKey.get(ref.to);
          if (targetElement) {
            // Determine target field - look for 'id' field in target schema
            let targetField: string | undefined = 'id'; // Default assumption for foreign key references

            // Check if target schema has an 'id' property
            const hasIdField = targetElement.schemaInfo.properties.some(
              prop => prop.name === 'id'
            );

            // If no 'id' field, use the first property or undefined
            if (!hasIdField) {
              if (targetElement.schemaInfo.properties.length > 0) {
                targetField = targetElement.schemaInfo.properties[0].name;
              } else {
                // No fields available, don't use field-level connection
                targetField = undefined;
              }
            }

            const relationship: Relationship = {
              id: uuidv4(),
              type: RelationshipType.Reference,
              sourceId: element.id,
              targetId: targetElement.id,
              properties: {
                // Use field-level connection names
                sourceField: ref.from,          // Source property name
                targetField: targetField,       // Target field (usually 'id')

                // Keep legacy field for backward compatibility
                propertyName: ref.from,
                cardinality: ref.cardinality,
                refType: ref.refType
              },
              visual: {
                label: ref.from,
                style: {
                  color: ref.cardinality === 'many' ? '#4CAF50' : '#2196F3',
                  width: 2,
                  arrowEnd: ref.cardinality === 'many' ? 'arrow' : 'arrow'
                }
              }
            };
            relationships.push(relationship);
          }
        }
        // External references will be handled in cross-layer reference building
      }
    }

    return relationships;
  }

  /**
   * Resolve cross-layer references
   * @param allLayers - All parsed schema layers
   * @returns Map of element ID to array of external references with field info
   */
  resolveCrossLayerReferences(layers: JSONSchemaLayer[]): Map<string, Array<{ propertyName: string; targetDef: string }>> {
    const crossLayerRefs = new Map<string, Array<{ propertyName: string; targetDef: string }>>();

    for (const layer of layers) {
      for (const element of layer.elements) {
        // Type guard to ensure we have a JSONSchemaElement
        if (element.type === 'json-schema-element') {
          const schemaElement = element as JSONSchemaElement;
          const externalRefs = schemaElement.schemaInfo.references
            .filter(ref => ref.refType === 'external')
            .map(ref => ({
              propertyName: ref.from,  // Source property name
              targetDef: ref.to        // Target definition name
            }));

          if (externalRefs.length > 0) {
            crossLayerRefs.set(element.id, externalRefs);
          }
        }
      }
    }

    return crossLayerRefs;
  }

  /**
   * Extract all custom x-* cross-layer references from schema definitions
   * @param layers - All parsed schema layers
   * @returns Array of extracted cross-layer references
   */
  extractCustomCrossLayerReferences(layers: JSONSchemaLayer[]): ExtractedReference[] {
    const references: ExtractedReference[] = [];

    for (const layer of layers) {
      for (const element of layer.elements) {
        if (element.type === 'json-schema-element') {
          const schemaElement = element as JSONSchemaElement;
          const elementRefs = this.extractReferencesFromDefinition(
            schemaElement.properties,
            schemaElement.id,
            layer.name
          );
          references.push(...elementRefs);
        }
      }
    }

    return references;
  }

  /**
   * Extract references from a schema definition object
   * @param definition - Schema definition properties
   * @param sourceElementId - Source element ID
   * @param sourceLayerId - Source layer ID
   * @returns Array of extracted references
   */
  private extractReferencesFromDefinition(
    definition: any,
    sourceElementId: string,
    sourceLayerId: string
  ): ExtractedReference[] {
    const references: ExtractedReference[] = [];

    if (!definition || typeof definition !== 'object') {
      return references;
    }

    // Single UUID reference properties
    const singleRefProperties: Array<{ prop: string; type: ReferenceType }> = [
      { prop: 'x-archimate-ref', type: ReferenceType.ArchiMateProperty },
      { prop: 'x-business-object-ref', type: ReferenceType.BusinessObject },
      { prop: 'x-business-service-ref', type: ReferenceType.BusinessService },
      { prop: 'x-business-interface-ref', type: ReferenceType.BusinessInterface },
      { prop: 'x-security-resource', type: ReferenceType.SecurityResource },
    ];

    for (const { prop, type } of singleRefProperties) {
      if (definition[prop] && typeof definition[prop] === 'string') {
        references.push({
          propertyName: prop,
          referenceType: type,
          targetId: definition[prop],
          sourceElementId,
          sourceLayerId
        });
      }
    }

    // Array UUID reference properties
    const arrayRefProperties: Array<{ prop: string; type: ReferenceType }> = [
      { prop: 'x-supports-goals', type: ReferenceType.Goal },
      { prop: 'x-fulfills-requirements', type: ReferenceType.Requirement },
      { prop: 'x-governed-by-principles', type: ReferenceType.Principle },
      { prop: 'x-constrained-by', type: ReferenceType.Constraint },
    ];

    for (const { prop, type } of arrayRefProperties) {
      if (Array.isArray(definition[prop])) {
        const targetIds = definition[prop].filter((id: any) => typeof id === 'string');
        if (targetIds.length > 0) {
          references.push({
            propertyName: prop,
            referenceType: type,
            targetIds,
            sourceElementId,
            sourceLayerId
          });
        }
      }
    }

    // Nested references in security object
    if (definition.security && typeof definition.security === 'object') {
      const security = definition.security;

      if (security.resourceRef && typeof security.resourceRef === 'string') {
        references.push({
          propertyName: 'security.resourceRef',
          referenceType: ReferenceType.SecurityResource,
          targetIdentifier: security.resourceRef,
          sourceElementId,
          sourceLayerId
        });
      }

      if (Array.isArray(security.requiredPermissions)) {
        const permissions = security.requiredPermissions.filter((p: any) => typeof p === 'string');
        if (permissions.length > 0) {
          references.push({
            propertyName: 'security.requiredPermissions',
            referenceType: ReferenceType.SecurityPermission,
            targetIds: permissions,
            sourceElementId,
            sourceLayerId
          });
        }
      }
    }

    // API operation reference (from UX layer)
    if (definition.api && typeof definition.api === 'object' && definition.api.operationId) {
      references.push({
        propertyName: 'api.operationId',
        referenceType: ReferenceType.APIOperation,
        targetIdentifier: definition.api.operationId,
        sourceElementId,
        sourceLayerId
      });
    }

    // Navigation route reference (from UX layer)
    if (definition.route && typeof definition.route === 'string') {
      references.push({
        propertyName: 'route',
        referenceType: ReferenceType.NavigationRoute,
        targetIdentifier: definition.route,
        sourceElementId,
        sourceLayerId
      });
    }

    // APM/Observability references
    const apmProperties: Array<{ prop: string; type: ReferenceType }> = [
      { prop: 'x-apm-performance-metrics', type: ReferenceType.APMPerformanceMetrics },
      { prop: 'x-apm-data-quality-metrics', type: ReferenceType.APMDataQualityMetrics },
      { prop: 'x-apm-business-metrics', type: ReferenceType.APMBusinessMetrics },
    ];

    for (const { prop, type } of apmProperties) {
      if (definition[prop]) {
        // APM properties can be objects or references
        if (typeof definition[prop] === 'string') {
          references.push({
            propertyName: prop,
            referenceType: type,
            targetId: definition[prop],
            sourceElementId,
            sourceLayerId
          });
        } else if (typeof definition[prop] === 'object') {
          references.push({
            propertyName: prop,
            referenceType: type,
            sourceElementId,
            sourceLayerId,
            metadata: definition[prop]
          });
        }
      }
    }

    // Recursively check nested properties
    for (const [key, value] of Object.entries(definition)) {
      if (key === 'properties' && value && typeof value === 'object') {
        // Check property-level references
        for (const [_propKey, propValue] of Object.entries(value)) {
          if (propValue && typeof propValue === 'object') {
            const nestedRefs = this.extractReferencesFromDefinition(
              propValue,
              sourceElementId,
              sourceLayerId
            );
            references.push(...nestedRefs);
          }
        }
      }
    }

    return references;
  }
}
