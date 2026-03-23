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
import { ModelElement, Layer, Relationship, RelationshipTypeValue, SourceReference, ElementMetadata } from '../types/model';
import { LayerType } from '../types/layers';
import { mapPredicateToType } from './predicateTypeMapper';
import { getLayerColor } from '../utils/layerColors';
import type { PredicateCatalog } from './predicateCatalogLoader';

/**
 * Type guard: validates that an unknown value is a YAMLManifest
 */
function isYAMLManifest(value: unknown): value is YAMLManifest {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.version === 'string' &&
    typeof obj.project === 'object' &&
    obj.project !== null &&
    typeof (obj.project as Record<string, unknown>).name === 'string' &&
    typeof (obj.project as Record<string, unknown>).description === 'string' &&
    typeof (obj.project as Record<string, unknown>).version === 'string' &&
    typeof obj.layers === 'object' &&
    obj.layers !== null
  );
}

/**
 * Type guard: validates that an unknown value is ProjectionRules
 */
function isProjectionRules(value: unknown): value is ProjectionRules {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.version === 'string' &&
    Array.isArray(obj.projections)
  );
}

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
  'data-model': LayerType.DataModel,
  data_model: LayerType.DataModel,
  datastore: LayerType.Datastore,
  ux: LayerType.Ux,
  navigation: LayerType.Navigation,
  apm: LayerType.ApmObservability,
  testing: LayerType.Testing,
};

/**
 * YAMLParser - Parses YAML instance models
 *
 * The parser uses a predicate catalog (when provided) to determine which YAML fields
 * should be treated as relationship properties. The catalog's fieldPaths entries
 * (e.g., "x-supports", "x-fulfills-requirements") define field aliases for each predicate.
 *
 * If no catalog is provided, the parser falls back to heuristic behavior:
 * any array-of-strings property is treated as a relationship. This allows the parser
 * to work without a catalog but with reduced accuracy.
 */
export class YAMLParser {
  private warnings: string[] = [];
  private dotNotationLookup: Map<string, string> = new Map(); // dot-notation ID -> UUID
  private predicateCatalog: PredicateCatalog | null = null;
  private validRelationshipFields: Set<string> = new Set();
  private validPredicates: Set<string> = new Set();

  /**
   * Create a new YAML parser
   * @param catalog - Optional predicate catalog for field discovery
   */
  constructor(catalog?: PredicateCatalog) {
    this.predicateCatalog = catalog || null;
    this.initializeValidFields();
  }

  /**
   * Initialize the valid relationship fields and predicates sets from the catalog.
   * Computed once in the constructor and cached to avoid redundant reconstruction.
   */
  private initializeValidFields(): void {
    this.validRelationshipFields.clear();
    this.validPredicates.clear();

    if (this.predicateCatalog) {
      for (const def of this.predicateCatalog.byPredicate.values()) {
        // Add the predicate name itself
        this.validPredicates.add(def.predicate);
        this.validRelationshipFields.add(def.predicate);
        // Add all field path aliases for this predicate
        if (def.fieldPaths) {
          for (const fieldPath of def.fieldPaths) {
            this.validRelationshipFields.add(fieldPath);
          }
        }
      }
    }
  }

  /**
   * Set the predicate catalog for dynamic field discovery
   * Used to identify relationship fields based on catalog predicates instead of hardcoded lists
   *
   * @deprecated Use constructor parameter instead for explicit catalog dependency
   */
  setPredicateCatalog(catalog: PredicateCatalog): void {
    this.predicateCatalog = catalog;
    this.initializeValidFields();
  }

  /**
   * Parse manifest.yaml content
   */
  parseManifest(yamlContent: string): YAMLManifest {
    try {
      const parsed = yaml.load(yamlContent);

      // Validate structure before type casting
      if (!isYAMLManifest(parsed)) {
        throw new Error(
          'Manifest does not match expected structure. Required fields: ' +
          'version (string), project (object with name, description, version), layers (object)'
        );
      }

      return parsed;
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
      const parsed = yaml.load(yamlContent);

      // Validate structure before type casting
      if (!isProjectionRules(parsed)) {
        this.warnings.push('Projection rules malformed: missing version (string) or projections (array)');
        return null;
      }

      return parsed;
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
    // Do NOT clear dot-notation lookup - we need to accumulate mappings across all layers
    // for cross-layer reference resolution. Clear is called by DataLoader.parseYAMLInstances()
    // at the beginning of the layer parsing loop to reset before parsing all layers.

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
      order: layerConfig.order,
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

    // Known non-relationship fields (metadata that should not be treated as relationships)
    const knownFields = new Set([
      'name', 'id', 'description', 'method', 'path', 'openapi', '$schema', 'schemas', 'relationships',
      'type', 'category', 'priority', 'stakeholders',
      // Motivation layer metadata
      'kpis', 'concerns', 'role', 'timeframe', 'scope', 'impact', 'influence_level',
      // v0.8.3 spec fields
      'spec_node_id', 'layer_id', 'attributes', 'source_reference', 'metadata'
    ]);

    // Detect relationship properties (arrays of strings) and collect them
    const relationships: YAMLRelationships = {};
    const additionalProps: Record<string, unknown> = {};

    for (const [propKey, value] of Object.entries(element)) {
      if (knownFields.has(propKey)) {
        continue; // Skip known fields
      }

      // Check if this looks like a relationship
      // If catalog is available, check if propKey matches a valid relationship field
      // (predicate name or fieldPath alias). Otherwise, check if it's an array of strings (heuristic).
      const isRelationship = this.validRelationshipFields.size > 0
        ? this.validRelationshipFields.has(propKey)
        : Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string');

      if (isRelationship && Array.isArray(value)) {
        // Store relationship using the fieldPath key as-is, not the canonical predicate name
        // This preserves field aliases and allows for predicate resolution during relationship extraction
        relationships[propKey] = value as string[];
      } else if (!isRelationship) {
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
      // v0.8.3 spec fields
      spec_node_id: element.spec_node_id as string | undefined,
      layer_id: element.layer_id as string | undefined,
      attributes: element.attributes as Record<string, unknown> | undefined,
      source_reference: element.source_reference,
      metadata: element.metadata,
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

    // Copy additional custom properties (excluding known fields and predicates)
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
      // v0.8.3 spec fields
      'spec_node_id',
      'layer_id',
      'attributes',
      'source_reference',
      'metadata',
    ]);

    for (const [key, value] of Object.entries(yamlElement)) {
      // Skip known fields and all relationship fields (both canonical predicate names and fieldPath aliases)
      // Use validRelationshipFields instead of only predicate names to exclude aliases like 'x-supports', 'x-fulfills-requirements'
      if (!knownFields.has(key) && !this.validRelationshipFields.has(key)) {
        properties[key] = value;
      }
    }

    // Parse v0.8.3 spec fields
    const sourceRef = yamlElement.source_reference
      ? Array.isArray(yamlElement.source_reference)
        ? // If array, use the first element (spec requires singular, optional scalar)
          this.parseSourceReference(yamlElement.source_reference[0])
        : this.parseSourceReference(yamlElement.source_reference)
      : undefined;
    const metadata = yamlElement.metadata
      ? this.parseElementMetadata(yamlElement.metadata)
      : undefined;

    return {
      id: uuid,
      type: elementType,
      name: yamlElement.name,
      description: yamlElement.description,
      layerId: layerType, // Use mapped LayerType (e.g., "Motivation") not raw layerId (e.g., "motivation")
      path: yamlElement.id, // Preserve dot-notation path
      specNodeId: yamlElement.spec_node_id,
      attributes: yamlElement.attributes,
      sourceReference: sourceRef,
      metadata,
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
   * Convert plural noun to singular form
   * Uses common English pluralization rules
   * Examples: goals->goal, functions->function, statuses->status, business->business
   */
  private singularizeWord(word: string): string {
    // Handle empty string
    if (word.length === 0) {
      return word;
    }

    // Words ending in 'ss', 'us', 'is' don't change (status, business, basis)
    if (word.endsWith('ss') || word.endsWith('us') || word.endsWith('is')) {
      return word;
    }

    // Words ending in 'ies' -> 'y' (activities -> activity)
    if (word.endsWith('ies') && word.length > 3) {
      return word.slice(0, -3) + 'y';
    }

    // Words ending in 'xes', 'zes', 'ches', 'shes' -> remove 'es' (boxes -> box, churches -> church)
    if ((word.endsWith('xes') || word.endsWith('zes') || word.endsWith('ches') || word.endsWith('shes')) && word.length > 2) {
      return word.slice(0, -2);
    }

    // Words ending in 'oes' -> 'o' (heroes -> hero)
    if (word.endsWith('oes') && word.length > 3) {
      return word.slice(0, -2);
    }

    // Words ending in 'ves' -> 'f' (leaves -> leaf)
    if (word.endsWith('ves') && word.length > 3) {
      return word.slice(0, -3) + 'f';
    }

    // Default: remove trailing 's' only if word ends in 's' (goals -> goal, functions -> function)
    if (word.endsWith('s') && word.length > 1) {
      return word.slice(0, -1);
    }

    // Word doesn't look plural
    return word;
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
        // Convert plural to singular using proper English pluralization rules
        return this.singularizeWord(fileNameWithoutExt);
      }
    }

    // Default to layer name
    return layerId;
  }

  /**
   * Extract relationships from YAML element
   *
   * This method resolves fieldPath aliases (e.g., 'x-supports') to their canonical
   * predicate names (e.g., 'supports') using the predicate catalog. This allows
   * YAML elements to use convenient field aliases while maintaining consistent
   * predicate naming in the model.
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
    for (const [fieldKey, targets] of Object.entries(relMap)) {
      if (!Array.isArray(targets)) {
        continue;
      }

      // Resolve fieldPath key to canonical predicate name
      // e.g., 'x-supports' -> 'supports', 'supports' -> 'supports'
      let canonicalPredicate = fieldKey;
      if (this.predicateCatalog) {
        // Check if fieldKey is a direct predicate name
        if (this.predicateCatalog.byPredicate.has(fieldKey)) {
          canonicalPredicate = fieldKey;
        } else {
          // Check if fieldKey is a fieldPath alias for some predicate
          for (const [predName, def] of this.predicateCatalog.byPredicate) {
            if (def.fieldPaths && def.fieldPaths.includes(fieldKey)) {
              canonicalPredicate = predName;
              break;
            }
          }
        }
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
            type: this.mapRelationshipType(canonicalPredicate),
            predicate: canonicalPredicate, // Store canonical predicate for consistency
            properties: {
              isDotNotation: true, // Flag for later resolution
              originalType: fieldKey, // Track the original field name for reference
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.warnings.push(
            `Failed to create relationship ${fieldKey} -> ${targetRef}: ${message}`
          );
        }
      }
    }

    return relationships;
  }

  /**
   * Map YAML relationship type to internal RelationshipType
   */
  private mapRelationshipType(yamlType: string): RelationshipTypeValue {
    return mapPredicateToType(yamlType);
  }

  /**
   * Parse source reference from YAML data
   */
  private parseSourceReference(data: unknown): SourceReference | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const ref = data as Record<string, unknown>;
    const provenance = ref.provenance as 'extracted' | 'manual' | 'inferred' | 'generated' | undefined;

    if (!provenance) {
      return undefined;
    }

    const locations = Array.isArray(ref.locations)
      ? (ref.locations as Array<Record<string, unknown>>).map(loc => ({
          file: typeof loc.file === 'string' ? loc.file : '',
          symbol: typeof loc.symbol === 'string' ? loc.symbol : undefined,
        }))
      : [];

    const repository = typeof ref.repository === 'object' && ref.repository !== null
      ? {
          url: typeof (ref.repository as Record<string, unknown>).url === 'string'
            ? (ref.repository as Record<string, unknown>).url as string
            : '',
          commit: typeof (ref.repository as Record<string, unknown>).commit === 'string'
            ? (ref.repository as Record<string, unknown>).commit as string
            : '',
        }
      : undefined;

    return {
      provenance,
      locations,
      repository,
    };
  }

  /**
   * Parse element metadata from YAML data
   */
  private parseElementMetadata(data: unknown): ElementMetadata | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const meta = data as Record<string, unknown>;

    return {
      createdAt: typeof meta.createdAt === 'string' ? meta.createdAt :
                 typeof meta.created_at === 'string' ? meta.created_at : undefined,
      updatedAt: typeof meta.updatedAt === 'string' ? meta.updatedAt :
                 typeof meta.updated_at === 'string' ? meta.updated_at : undefined,
      createdBy: typeof meta.createdBy === 'string' ? meta.createdBy :
                 typeof meta.created_by === 'string' ? meta.created_by : undefined,
      version: typeof meta.version === 'number' ? meta.version : undefined,
    };
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
   * Add a warning message
   */
  addWarning(warning: string): void {
    this.warnings.push(warning);
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

  /**
   * Clear dot-notation to UUID lookup map
   * Called at the start of parsing all layers to reset the lookup
   */
  clearDotNotationLookup(): void {
    this.dotNotationLookup.clear();
  }

}
