/**
 * YAML Parser Service
 *
 * Parses YAML-based instance models (v0.1.0) into the internal MetaModel format.
 * Implements best-effort parsing: logs warnings for malformed elements but continues processing.
 */

import * as yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import {
  YAMLManifest,
  YAMLLayerConfig,
  YAMLElement,
  YAMLRelationships,
  ProjectionRules,
  OpenAPIOperation,
  JSONSchemaDefinition,
} from '../types/yaml';
import { ModelElement, Layer, Relationship, ReferenceType } from '../types/model';
import { LayerType } from '../types/layers';
import { getLayerColor } from '../utils/layerColors';

/**
 * Maps YAML layer IDs to internal LayerType
 */
const LAYER_TYPE_MAP: Record<string, LayerType> = {
  motivation: LayerType.Motivation,
  business: LayerType.Business,
  security: LayerType.Security,
  application: LayerType.Application,
  technology: LayerType.Technology,
  api: LayerType.Api,
  data_model: LayerType.DataModel,
  datastore: LayerType.Datastore,
  ux: LayerType.Ux,
  navigation: LayerType.Navigation,
  apm: LayerType.ApmObservability,
};

/**
 * YAMLParser - Parses YAML instance models
 */
export class YAMLParser {
  private warnings: string[] = [];
  private dotNotationLookup: Map<string, string> = new Map(); // dot-notation ID -> UUID

  /**
   * Parse manifest.yaml content
   */
  parseManifest(yamlContent: string): YAMLManifest {
    try {
      const manifest = yaml.load(yamlContent) as YAMLManifest;

      // Validate required fields
      if (!manifest.version) {
        throw new Error('Manifest missing required field: version');
      }
      if (!manifest.layers) {
        throw new Error('Manifest missing required field: layers');
      }
      if (!manifest.project) {
        throw new Error('Manifest missing required field: project');
      }

      return manifest;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse manifest: ${message}`);
    }
  }

  /**
   * Parse projection-rules.yaml content
   */
  parseProjectionRules(yamlContent: string): ProjectionRules | null {
    try {
      const rules = yaml.load(yamlContent) as ProjectionRules;

      if (!rules.version || !rules.projections) {
        this.warnings.push('Projection rules malformed: missing version or projections');
        return null;
      }

      return rules;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.warnings.push(`Failed to parse projection rules: ${message}`);
      return null;
    }
  }

  /**
   * Parse layer YAML files and convert to Layer
   *
   * @param layerConfig - Layer configuration from manifest
   * @param files - Map of file paths to YAML content
   * @param layerId - Layer identifier
   * @returns Parsed Layer with elements and relationships
   */
  parseLayerFiles(
    layerConfig: YAMLLayerConfig,
    files: Record<string, string>,
    layerId: string
  ): Layer {
    const layerType = LAYER_TYPE_MAP[layerId] || layerId;
    const elements: ModelElement[] = [];
    const relationships: Relationship[] = [];

    // Parse each YAML file in the layer
    for (const [filePath, content] of Object.entries(files)) {
      try {
        const parsed = yaml.load(content);

        if (!parsed || typeof parsed !== 'object') {
          this.warnings.push(`Skipped ${filePath}: not a valid YAML object`);
          continue;
        }

        // YAML elements are stored as key-value pairs
        const yamlElements = parsed as Record<string, unknown>;

        for (const [elementKey, elementData] of Object.entries(yamlElements)) {
          try {
            const yamlElement = this.normalizeYAMLElement(elementKey, elementData);
            const modelElement = this.convertYAMLElementToModelElement(
              yamlElement,
              layerId,
              layerType,
              filePath
            );

            elements.push(modelElement);

            // Extract and convert relationships
            const elementRelationships = this.extractRelationshipsFromElement(
              yamlElement,
              modelElement.id,
              layerId
            );
            relationships.push(...elementRelationships);

            // Store dot-notation -> UUID mapping
            // Build full dot-notation ID: {layer}.{type}.{id}
            if (yamlElement.id) {
              // Store short form
              this.dotNotationLookup.set(yamlElement.id, modelElement.id);

              // Determine full dot-notation
              let fullDotNotation: string;

              // Check if ID is already in full dot-notation format (contains layer.type prefix)
              if (yamlElement.id.startsWith(`${layerId}.${modelElement.type}.`)) {
                // Already in full format
                fullDotNotation = yamlElement.id;
              } else if (yamlElement.id.includes('.')) {
                // Has dots but might be in different format, use as-is
                fullDotNotation = yamlElement.id;
              } else {
                // Short form, build full notation: layer.type.id
                fullDotNotation = `${layerId}.${modelElement.type}.${yamlElement.id}`;
              }

              this.dotNotationLookup.set(fullDotNotation, modelElement.id);
              console.log(`Mapped "${fullDotNotation}" -> ${modelElement.id}`);
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.warnings.push(`Skipped element "${elementKey}" in ${filePath}: ${message}`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.warnings.push(`Failed to parse file ${filePath}: ${message}`);
      }
    }

    return {
      id: layerId,
      type: layerType,
      name: layerConfig.name,
      elements,
      relationships,
      data: {
        metadata: {
          order: layerConfig.order,
        },
      },
      visual: {
        color: getLayerColor(layerType, 'primary'),
        icon: '',
        opacity: 1,
      },
    };
  }

  /**
   * Normalize YAML element data to YAMLElement interface
   */
  private normalizeYAMLElement(key: string, data: unknown): YAMLElement {
    if (typeof data !== 'object' || data === null) {
      throw new Error(`Element data is not an object`);
    }

    const element = data as Record<string, unknown>;

    // Ensure required fields
    const name = (element.name as string) || key;
    const id = (element.id as string) || this.generateDotNotationId(key);

    // Known non-relationship fields
    const knownFields = ['name', 'id', 'description', 'method', 'path', 'openapi', '$schema', 'schemas', 'relationships', 'type', 'category', 'priority', 'stakeholders'];

    // Detect relationship properties (arrays of strings) and collect them
    const relationships: YAMLRelationships = {};
    const additionalProps: Record<string, unknown> = {};

    for (const [propKey, value] of Object.entries(element)) {
      if (knownFields.includes(propKey)) {
        continue; // Skip known fields
      }

      // Check if this looks like a relationship (array of strings)
      if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string')) {
        relationships[propKey] = value as string[];
      } else {
        additionalProps[propKey] = value;
      }
    }

    // Merge with explicit relationships if present
    const explicitRels = element.relationships as YAMLRelationships | undefined;
    const mergedRelationships = explicitRels ? { ...relationships, ...explicitRels } : relationships;

    return {
      name,
      id,
      description: element.description as string | undefined,
      method: element.method as string | undefined,
      path: element.path as string | undefined,
      openapi: element.openapi,
      $schema: element.$schema as string | undefined,
      schemas: element.schemas as Record<string, unknown> | undefined,
      relationships: Object.keys(mergedRelationships).length > 0 ? mergedRelationships : undefined,
      ...additionalProps,
    };
  }

  /**
   * Generate a dot-notation ID from element key if not provided
   */
  private generateDotNotationId(key: string): string {
    // Convert to kebab-case
    return key
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_.]/g, '');
  }

  /**
   * Convert YAMLElement to ModelElement
   */
  convertYAMLElementToModelElement(
    yamlElement: YAMLElement,
    layerId: string,
    layerType: string,
    filePath: string
  ): ModelElement {
    const uuid = uuidv4();
    const elementType = this.inferElementType(yamlElement, layerId, filePath);

    // Extract OpenAPI details if present
    const openApiDetails = yamlElement.openapi ? this.extractOpenAPIDetails(yamlElement) : null;

    // Extract JSON Schema details if present
    const schemaDetails =
      yamlElement.$schema && yamlElement.schemas
        ? this.extractJSONSchemaDetails(yamlElement)
        : null;

    // Build properties object
    const properties: Record<string, unknown> = {
      dotNotationId: yamlElement.id, // Preserve for reference resolution
    };

    if (yamlElement.method) properties.method = yamlElement.method;
    if (yamlElement.path) properties.path = yamlElement.path;
    if (openApiDetails) properties.openApiDetails = openApiDetails;
    if (schemaDetails) properties.schemaDetails = schemaDetails;
    if (yamlElement.openapi) properties.openapi = yamlElement.openapi;
    if (yamlElement.schemas) properties.schemas = yamlElement.schemas;

    // Copy additional custom properties (excluding known fields)
    const knownFields = new Set([
      'name',
      'description',
      'id',
      'method',
      'path',
      'openapi',
      '$schema',
      'schemas',
      'relationships',
    ]);

    for (const [key, value] of Object.entries(yamlElement)) {
      if (!knownFields.has(key)) {
        properties[key] = value;
      }
    }

    return {
      id: uuid,
      type: elementType,
      name: yamlElement.name,
      description: yamlElement.description,
      layerId: layerType, // Use mapped LayerType (e.g., "Motivation") not raw layerId (e.g., "motivation")
      properties,
      visual: {
        position: { x: 0, y: 0 }, // Will be set by layout algorithm
        size: { width: 200, height: 100 },
        style: {
          backgroundColor: getLayerColor(layerType, 'light'),
          borderColor: getLayerColor(layerType, 'dark'),
        },
      },
    };
  }

  /**
   * Infer element type from YAML element and layer context
   */
  private inferElementType(yamlElement: YAMLElement, layerId: string, filePath: string): string {
    // Extract type from dot-notation ID if available
    // Format: {layer}.{type}.{name}
    if (yamlElement.id && yamlElement.id.includes('.')) {
      const parts = yamlElement.id.split('.');
      if (parts.length >= 2) {
        return parts[1]; // Return the type part
      }
    }

    // Infer from element properties
    if (yamlElement.method && yamlElement.path) {
      return 'operation';
    }

    if (yamlElement.$schema || yamlElement.schemas) {
      return 'schema';
    }

    // Extract type from filename
    // e.g., "model/01_motivation/goals.yaml" -> "goal"
    // e.g., "functions.yaml" -> "function"
    if (filePath) {
      const fileName = filePath.split('/').pop() || '';
      const fileNameWithoutExt = fileName.replace(/\.(yaml|yml)$/, '');

      if (fileNameWithoutExt && fileNameWithoutExt !== 'manifest' && fileNameWithoutExt !== 'projection-rules') {
        // Convert plural to singular (simple heuristic: remove trailing 's')
        // goals -> goal, functions -> function, services -> service
        let elementType = fileNameWithoutExt;
        if (elementType.endsWith('s') && elementType.length > 1) {
          elementType = elementType.slice(0, -1);
        }
        return elementType;
      }
    }

    // Default to layer name
    return layerId;
  }

  /**
   * Extract relationships from YAML element
   */
  extractRelationshipsFromElement(
    yamlElement: YAMLElement,
    elementId: string,
    _layerId: string
  ): Relationship[] {
    const relationships: Relationship[] = [];

    if (!yamlElement.relationships) {
      return relationships;
    }

    const relMap = yamlElement.relationships;

    // Process each relationship type
    for (const [relType, targets] of Object.entries(relMap)) {
      if (!Array.isArray(targets)) {
        continue;
      }

      for (const targetRef of targets) {
        if (typeof targetRef !== 'string') {
          continue;
        }

        try {
          relationships.push({
            id: uuidv4(),
            sourceId: elementId,
            targetId: targetRef, // Initially dot-notation, will be resolved later
            type: this.mapRelationshipType(relType),
            properties: {
              isDotNotation: true, // Flag for later resolution
              originalType: relType,
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.warnings.push(
            `Failed to create relationship ${relType} -> ${targetRef}: ${message}`
          );
        }
      }
    }

    return relationships;
  }

  /**
   * Map YAML relationship type to internal ReferenceType
   */
  private mapRelationshipType(yamlType: string): ReferenceType {
    const typeMap: Record<string, ReferenceType> = {
      // ArchiMate-style relationships mapped to available types
      realizes: ReferenceType.BusinessService,
      serves: ReferenceType.BusinessService,
      accesses: ReferenceType.SchemaReference,
      uses: ReferenceType.APIOperation,
      composes: ReferenceType.Custom,
      flows_to: ReferenceType.NavigationRoute,
      assigned_to: ReferenceType.Custom,
      aggregates: ReferenceType.Custom,
      specializes: ReferenceType.Custom,

      // Motivation layer
      supports_goals: ReferenceType.Goal,
      fulfills_requirements: ReferenceType.Requirement,
      constrained_by: ReferenceType.Constraint,

      // Security
      secured_by: ReferenceType.SecurityResource,
      requires_permissions: ReferenceType.SecurityPermission,
    };

    return typeMap[yamlType] || ReferenceType.Custom;
  }

  /**
   * Extract OpenAPI operation details
   */
  private extractOpenAPIDetails(yamlElement: YAMLElement): OpenAPIOperation | null {
    try {
      const spec = yamlElement.openapi as any;

      if (!spec || !spec.paths) {
        return null;
      }

      // Extract first operation from paths
      const paths = Object.entries(spec.paths);
      if (paths.length === 0) {
        return null;
      }

      const [path, pathItem] = paths[0];
      const pathObj = pathItem as any;

      // Find first HTTP method
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
      for (const method of methods) {
        if (pathObj[method]) {
          const operation = pathObj[method];
          return {
            operationId: operation.operationId || yamlElement.id,
            method: method.toUpperCase(),
            path,
            summary: operation.summary,
            description: operation.description,
            parameters: operation.parameters,
            requestBody: operation.requestBody,
            responses: operation.responses,
            tags: operation.tags,
          };
        }
      }

      return null;
    } catch (error) {
      this.warnings.push(`Failed to extract OpenAPI details: ${error}`);
      return null;
    }
  }

  /**
   * Extract JSON Schema details
   */
  private extractJSONSchemaDetails(yamlElement: YAMLElement): JSONSchemaDefinition[] {
    const schemas: JSONSchemaDefinition[] = [];

    try {
      if (!yamlElement.schemas) {
        return schemas;
      }

      for (const [schemaName, schemaDef] of Object.entries(yamlElement.schemas)) {
        const def = schemaDef as any;

        schemas.push({
          schemaName,
          title: def.title,
          description: def.description,
          type: def.type,
          properties: def.properties,
          required: def.required,
          $ref: def.$ref,
        });
      }
    } catch (error) {
      this.warnings.push(`Failed to extract JSON Schema details: ${error}`);
    }

    return schemas;
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

  /**
   * Get dot-notation to UUID lookup map
   */
  getDotNotationLookup(): Map<string, string> {
    return this.dotNotationLookup;
  }

}
