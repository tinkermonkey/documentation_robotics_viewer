import { MetaModel, LayerType, Reference } from '../types';
import { GitHubService } from './githubService';
import { LocalFileLoader } from './localFileLoader';
import { SpecParser } from './specParser';
import { JSONSchemaParser } from './jsonSchemaParser';
import { CrossLayerReferenceExtractor } from './crossLayerReferenceExtractor';
import { YAMLParser } from './yamlParser';
import { YAMLManifest } from '../types/yaml';

/**
 * Helper function to load a model from a local path (for testing)
 * This is primarily for use in Node.js test environments (Playwright, Jest, etc.)
 */
export async function loadModel(path: string): Promise<MetaModel> {
  try {
    // Use dynamic imports for Node.js modules (works in both CJS and ESM contexts)
    const { readFileSync, readdirSync } = await import('fs');
    const { join } = await import('path');

    // Read all files from the directory
    const files = readdirSync(path);
    const schemas: Record<string, unknown> = {};
    const hasManifest = files.some(f => f === 'manifest.yaml' || f === 'manifest.yml');

    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
        const filePath = join(path, file);
        const content = readFileSync(filePath, 'utf-8');

        // For YAML instance models, keep YAML files as strings
        // For JSON Schema models, parse everything
        if (hasManifest && (file.endsWith('.yaml') || file.endsWith('.yml'))) {
          // Keep YAML as string for parseYAMLInstances
          schemas[file] = content;
        } else if (file.endsWith('.json')) {
          schemas[file] = JSON.parse(content);
        } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          // Parse YAML for JSON Schema models
          const yaml = await import('js-yaml');
          schemas[file] = yaml.load(content) as unknown;
        }
      }
    }

    // Create DataLoader instance
    const localFileLoader = new LocalFileLoader();
    const githubService = new GitHubService();
    const specParser = new SpecParser();
    const dataLoader = new DataLoader(githubService, localFileLoader, specParser);

    // Check if this is a YAML instance model (has manifest.yaml)
    if (hasManifest) {
      // This is a YAML instance model - use parseYAMLInstances
      return dataLoader.parseYAMLInstances(schemas, 'test');
    } else {
      // This is a JSON Schema model - use parseSchemaDefinitions
      return dataLoader.parseSchemaDefinitions(schemas, 'test');
    }
  } catch (error) {
    throw new Error(`Failed to load model from path ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Coordinator service for loading data from various sources
 */
export class DataLoader {
  private jsonSchemaParser: JSONSchemaParser;
  private yamlParser: YAMLParser;
  private referenceExtractor: CrossLayerReferenceExtractor;

  constructor(
    private githubService: GitHubService,
    private localFileLoader: LocalFileLoader,
    private specParser: SpecParser
  ) {
    this.jsonSchemaParser = new JSONSchemaParser();
    this.yamlParser = new YAMLParser();
    this.referenceExtractor = new CrossLayerReferenceExtractor();
  }

  /**
   * Load specification from GitHub
   */
  async loadFromGitHub(version: string = 'latest'): Promise<MetaModel> {
    try {
      // Check cache first
      const cached = this.githubService.loadCachedSchemas(version);
      let schemas: Record<string, unknown>;

      if (cached) {
        console.log(`Using cached schemas for version ${version}`);
        schemas = cached;
      } else {
        console.log(`Downloading schemas from GitHub for version ${version}`);
        schemas = await this.githubService.downloadSchemas(version);

        // Cache the downloaded schemas
        this.githubService.cacheSchemas(version, schemas);
      }

      return this.parseSchemas(schemas, version);
    } catch (error) {
      console.error('Error loading from GitHub:', error);
      // Re-throw the original error to preserve helpful messages
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error loading from GitHub');
    }
  }

  /**
   * Load specification from local files
   */
  async loadFromLocal(files: FileList | File): Promise<MetaModel> {
    try {
      // Validate files if FileList
      if (files instanceof FileList) {
        const validation = this.localFileLoader.validateFiles(files);
        if (!validation.valid) {
          throw new Error(`Invalid files: ${validation.errors.join(', ')}`);
        }
      }

      // Load schemas
      const schemas = files instanceof FileList
        ? await this.localFileLoader.loadFromFiles(files)
        : await this.localFileLoader.loadFromZip(files as File);

      return this.parseSchemas(schemas, 'local');
    } catch (error) {
      console.error('Error loading from local files:', error);
      throw new Error(`Failed to load from local files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect if loaded data is schema definitions, instance JSON, or instance YAML
   */
  private detectSchemaType(schemas: Record<string, unknown>): 'schema-definition' | 'instance-json' | 'instance-yaml' {
    // Check for YAML instance model by presence of manifest.yaml
    if ('manifest.yaml' in schemas || 'manifest' in schemas) {
      console.log('Detected YAML instance model (manifest.yaml found)');
      return 'instance-yaml';
    }

    // Check if any file is a manifest structure
    for (const [key, value] of Object.entries(schemas)) {
      if (key.includes('manifest') && typeof value === 'object' && value !== null) {
        const manifest = value as any;
        if (manifest.version && manifest.layers && manifest.project) {
          console.log('Detected YAML instance model (manifest structure found)');
          return 'instance-yaml';
        }
      }
    }

    // Check first schema for JSON Schema indicators
    const firstSchema = Object.values(schemas)[0] as any;

    // JSON Schema has $schema and definitions
    if (firstSchema?.$schema?.includes('json-schema.org') || 'definitions' in firstSchema) {
      console.log('Detected JSON Schema definitions');
      return 'schema-definition';
    }

    // Instance data has elements and relationships
    if ('elements' in firstSchema || 'relationships' in firstSchema) {
      console.log('Detected JSON instance data');
      return 'instance-json';
    }

    // Default to schema definitions (our primary use case)
    console.log('Defaulting to schema definitions');
    return 'schema-definition';
  }

  /**
   * Parse JSON Schema definitions into MetaModel
   * Public method to allow external components to convert schema data to MetaModel
   */
  public parseSchemaDefinitions(
    schemas: Record<string, unknown>,
    version: string
  ): MetaModel {
    console.log('[DataLoader] parseSchemaDefinitions() called with:', {
      schemaCount: Object.keys(schemas).length,
      schemaKeys: Object.keys(schemas).slice(0, 3),
      version
    });

    const layers: Record<string, any> = {};
    const allRelationships: any[] = [];

    console.log(`Parsing ${Object.keys(schemas).length} schema files as definitions`);

    // Parse each schema file as a layer
    for (const [layerName, schemaData] of Object.entries(schemas)) {
      try {
        const layer = this.jsonSchemaParser.parseSchemaLayer(layerName, schemaData);

        // Use layerName as key (not layer.id) so layout system can find it
        // layerName is already cleaned (e.g., "Navigation", "Business")
        layers[layerName] = layer;
        allRelationships.push(...layer.relationships);

        console.log(`Parsed layer ${layerName}: ${layer.elements.length} elements, ${layer.relationships.length} relationships`);
      } catch (error) {
        console.error(`Failed to parse schema ${layerName}:`, error);
      }
    }

    // Build cross-layer references
    const references = this.buildSchemaReferences(Object.values(layers));

    // Extract custom references for metadata
    const extractedRefs = this.jsonSchemaParser.extractCustomCrossLayerReferences(Object.values(layers));
    const layersMap: Record<string, any> = {};
    for (const layer of Object.values(layers)) {
      layersMap[layer.name] = layer;
    }
    const crossLayerMetadata = this.referenceExtractor.resolveReferences(extractedRefs, layersMap);

    const elementCount = Object.values(layers).reduce((sum: number, layer: any) =>
      sum + layer.elements.length, 0);

    console.log('[DataLoader] Returning MetaModel:', {
      layerCount: Object.keys(layers).length,
      elementCount,
      referencesCount: references.length
    });

    return {
      version,
      layers,
      references,
      metadata: {
        loadedAt: new Date().toISOString(),
        layerCount: Object.keys(layers).length,
        elementCount,
        type: 'schema-definitions',
        crossLayerReferences: crossLayerMetadata
      }
    };
  }

  /**
   * Build cross-layer references for schema definitions
   */
  private buildSchemaReferences(layers: any[]): Reference[] {
    console.log('Building cross-layer references...');

    // Extract $ref-based references (original behavior)
    const refBasedReferences: Reference[] = [];
    const crossLayerRefs = this.jsonSchemaParser.resolveCrossLayerReferences(layers);

    // Convert Map entries to array for iteration
    Array.from(crossLayerRefs.entries()).forEach(([elementId, refs]) => {
      refs.forEach((ref, index) => {
        refBasedReferences.push({
          id: `${elementId}-external-${index}`,
          type: 'schema-reference' as any,
          source: {
            elementId,
            property: ref.propertyName  // Include source field name
          },
          target: {
            path: ref.targetDef
          }
        });
      });
    });

    console.log(`Found ${refBasedReferences.length} $ref-based references`);

    // Extract custom x-* cross-layer references (new behavior)
    const extractedRefs = this.jsonSchemaParser.extractCustomCrossLayerReferences(layers);
    console.log(`Extracted ${extractedRefs.length} custom cross-layer references`);

    // Resolve extracted references
    // Build a layers map for resolution
    const layersMap: Record<string, any> = {};
    for (const layer of layers) {
      layersMap[layer.name] = layer;
    }

    const resolutionMetadata = this.referenceExtractor.resolveReferences(extractedRefs, layersMap);
    console.log(`Resolved ${resolutionMetadata.resolvedReferences.length} references`);
    console.log(`Unresolved: ${resolutionMetadata.unresolvedReferences.length}`);

    // Log statistics
    try {
      const stats = this.referenceExtractor.getStatistics(resolutionMetadata);
      console.log('[DataLoader] Reference statistics:', stats);
    } catch (err) {
      console.warn('[DataLoader] Failed to get reference statistics:', err);
    }

    // Combine all references
    return [...refBasedReferences, ...resolutionMetadata.resolvedReferences];
  }

  /**
   * Parse schemas into MetaModel
   */
  private async parseSchemas(schemas: Record<string, unknown>, version: string): Promise<MetaModel> {
    // Detect schema type
    const schemaType = this.detectSchemaType(schemas);

    // Route to appropriate parser
    switch (schemaType) {
      case 'instance-yaml':
        return this.parseYAMLInstances(schemas, version);
      case 'schema-definition':
        return this.parseSchemaDefinitions(schemas, version);
      case 'instance-json':
      default:
        return this.parseInstances(schemas, version);
    }
  }

  /**
   * Parse YAML instance model (v0.1.0)
   */
  public parseYAMLInstances(schemas: Record<string, unknown>, version: string): MetaModel {
    console.log('Parsing YAML instance model...');

    // Find and parse manifest
    let manifestContent: string | null = null;
    let manifestKey = '';

    for (const [key, value] of Object.entries(schemas)) {
      if (key.includes('manifest')) {
        manifestContent = typeof value === 'string' ? value : JSON.stringify(value);
        manifestKey = key;
        break;
      }
    }

    if (!manifestContent) {
      throw new Error('No manifest.yaml found in YAML instance model');
    }

    const manifest = this.yamlParser.parseManifest(manifestContent);
    console.log(`Loaded manifest for project: ${manifest.project.name} v${manifest.project.version}`);

    // Parse projection rules if present
    const projectionRulesKey = Object.keys(schemas).find(k => k.includes('projection-rules'));
    if (projectionRulesKey) {
      const projectionRulesContent = schemas[projectionRulesKey];
      if (typeof projectionRulesContent === 'string') {
        this.yamlParser.parseProjectionRules(projectionRulesContent);
      }
    }

    // Group files by layer based on manifest paths
    const layerFiles = this.groupFilesByLayer(schemas, manifest, manifestKey);

    // Parse each enabled layer
    const layers: Record<string, any> = {};
    const allRelationships: any[] = [];

    for (const [layerId, layerConfig] of Object.entries(manifest.layers)) {
      if (!layerConfig.enabled) {
        console.log(`Skipping disabled layer: ${layerId}`);
        continue;
      }

      const files = layerFiles[layerId] || {};
      if (Object.keys(files).length === 0) {
        console.warn(`No files found for layer: ${layerId}`);
        continue;
      }

      try {
        const layer = this.yamlParser.parseLayerFiles(layerConfig, files, layerId);
        // Use layer.type (LayerType enum) as key, not layerConfig.name
        // This ensures consistency with how layers are keyed in other loading methods
        layers[layer.type] = layer;
        allRelationships.push(...layer.relationships);

        console.log(`Parsed layer ${layerId}: ${layer.elements.length} elements, ${layer.relationships.length} relationships`);
      } catch (error) {
        console.error(`Failed to parse layer ${layerId}:`, error);
      }
    }

    // Resolve dot-notation references to UUIDs
    this.resolveDotNotationReferences(allRelationships, this.yamlParser.getDotNotationLookup());

    // Build cross-layer references
    const references = this.buildYAMLReferences(Object.values(layers), allRelationships);

    // Get warnings from parser
    const warnings = this.yamlParser.getWarnings();
    if (warnings.length > 0) {
      console.warn(`YAML parsing warnings (${warnings.length}):`);
      warnings.forEach(w => console.warn(`  - ${w}`));
    }

    return {
      id: manifest.project.name,
      name: manifest.project.name,
      version: manifest.project.version || version,
      description: manifest.project.description,
      layers,
      references,
      metadata: {
        loadedAt: new Date().toISOString(),
        layerCount: Object.keys(layers).length,
        elementCount: Object.values(layers).reduce((sum: number, layer: any) =>
          sum + layer.elements.length, 0),
        type: 'yaml-instances',
        yamlVersion: manifest.version,
        manifestStatistics: manifest.statistics,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    };
  }

  /**
   * Group YAML files by layer based on manifest paths
   */
  private groupFilesByLayer(
    schemas: Record<string, unknown>,
    manifest: YAMLManifest,
    manifestKey: string
  ): Record<string, Record<string, string>> {
    const layerFiles: Record<string, Record<string, string>> = {};

    // Initialize layer file maps
    for (const layerId of Object.keys(manifest.layers)) {
      layerFiles[layerId] = {};
    }

    // Group files by layer based on path matching
    for (const [filePath, content] of Object.entries(schemas)) {
      // Skip manifest and projection rules
      if (filePath === manifestKey || filePath.includes('projection-rules')) {
        continue;
      }

      // Ensure content is a string
      const fileContent = typeof content === 'string' ? content : JSON.stringify(content);

      // Match file to layer based on path
      for (const [layerId, layerConfig] of Object.entries(manifest.layers)) {
        const layerPath = layerConfig.path;

        // Extract layer directory from path
        // Format: "model/01_motivation/" -> "01_motivation"
        const pathParts = layerPath.split('/').filter(p => p.length > 0);
        const layerDir = pathParts[pathParts.length - 1] || '';

        if (filePath.includes(layerDir) || filePath.includes(layerId)) {
          layerFiles[layerId][filePath] = fileContent;
          break;
        }
      }
    }

    return layerFiles;
  }

  /**
   * Resolve dot-notation references to UUIDs
   */
  private resolveDotNotationReferences(
    relationships: any[],
    dotNotationLookup: Map<string, string>
  ): void {
    for (const relationship of relationships) {
      // Check if this is a dot-notation reference
      if (relationship.properties?.isDotNotation && typeof relationship.targetId === 'string') {
        const uuid = dotNotationLookup.get(relationship.targetId);

        if (uuid) {
          // Replace dot-notation with UUID
          relationship.targetId = uuid;
          relationship.properties.isDotNotation = false;
          relationship.properties.resolvedFrom = relationship.targetId;
        } else {
          console.warn(`Unresolved dot-notation reference: ${relationship.targetId}`);
        }
      }
    }
  }

  /**
   * Build cross-layer references for YAML instances
   */
  private buildYAMLReferences(layers: any[], relationships: any[]): Reference[] {
    const references: Reference[] = [];

    // Convert relationships to references
    for (const rel of relationships) {
      // Find source and target layers
      let sourceLayer = '';
      let targetLayer = '';

      for (const layer of layers) {
        const sourceElement = layer.elements.find((e: any) => e.id === rel.sourceId);
        if (sourceElement) {
          sourceLayer = layer.id;
        }

        const targetElement = layer.elements.find((e: any) => e.id === rel.targetId);
        if (targetElement) {
          targetLayer = layer.id;
        }
      }

      references.push({
        id: rel.id,
        type: rel.type,
        source: {
          elementId: rel.sourceId,
          layerId: sourceLayer,
        },
        target: {
          elementId: rel.targetId,
          layerId: targetLayer,
        },
      });
    }

    console.log(`Built ${references.length} YAML cross-layer references`);
    return references;
  }

  /**
   * Parse instance data (original parseSchemas logic)
   */
  private async parseInstances(schemas: Record<string, unknown>, version: string): Promise<MetaModel> {
    const layers: Record<string, ReturnType<SpecParser['parse']>> = {};
    const parseErrors: string[] = [];

    // Map of layer names to LayerType enum values
    const layerTypeMap: Record<string, LayerType> = {
      'Motivation': LayerType.Motivation,
      'Business': LayerType.Business,
      'Security': LayerType.Security,
      'Application': LayerType.Application,
      'Technology': LayerType.Technology,
      'Api': LayerType.Api,
      'DataModel': LayerType.DataModel,
      'Datastore': LayerType.Datastore,
      'Ux': LayerType.Ux,
      'Navigation': LayerType.Navigation,
      'ApmObservability': LayerType.ApmObservability,
      'FederatedArchitecture': LayerType.FederatedArchitecture
    };

    // Parse each layer
    for (const [layerName, jsonSpec] of Object.entries(schemas)) {
      const layerType = this.mapToLayerType(layerName, layerTypeMap);

      if (layerType) {
        try {
          const layer = this.specParser.parse(jsonSpec, layerType);

          // Validate the parsed layer
          const validation = this.specParser.validateLayer(layer);
          if (!validation.valid) {
            console.warn(`Layer ${layerName} has validation errors:`, validation.errors);
            parseErrors.push(...validation.errors.map(err => `${layerName}: ${err}`));
          }

          layers[layerType] = layer;
        } catch (error) {
          const errorMsg = `Failed to parse layer ${layerName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          parseErrors.push(errorMsg);
        }
      } else {
        console.warn(`Unknown layer type: ${layerName}`);
      }
    }

    // Build cross-references
    const references = this.buildReferences(layers);

    // Create the meta-model
    const model: MetaModel = {
      version,
      layers,
      references,
      metadata: {
        loadedAt: new Date().toISOString(),
        layerCount: Object.keys(layers).length,
        elementCount: Object.values(layers).reduce((sum, layer) => sum + layer.elements.length, 0),
        parseErrors: parseErrors.length > 0 ? parseErrors : undefined
      }
    };

    return model;
  }

  /**
   * Map layer name to LayerType enum
   */
  private mapToLayerType(layerName: string, layerTypeMap: Record<string, LayerType>): LayerType | null {
    // Direct match
    if (layerTypeMap[layerName]) {
      return layerTypeMap[layerName];
    }

    // Case-insensitive match
    const normalizedName = layerName.toLowerCase().replace(/[-_\s]/g, '');
    for (const [key, value] of Object.entries(layerTypeMap)) {
      if (key.toLowerCase().replace(/[-_\s]/g, '') === normalizedName) {
        return value;
      }
    }

    // Special cases
    const specialCases: Record<string, LayerType> = {
      'datamodel': LayerType.DataModel,
      'data': LayerType.DataModel,
      'datastore': LayerType.Datastore,
      'storage': LayerType.Datastore,
      'api': LayerType.Api,
      'apm': LayerType.ApmObservability,
      'apmobservability': LayerType.ApmObservability,
      'monitoring': LayerType.ApmObservability,
      'ux': LayerType.Ux,
      'ui': LayerType.Ux,
      'user': LayerType.Ux,
      'federatedarchitecture': LayerType.FederatedArchitecture,
      'federated': LayerType.FederatedArchitecture
    };

    return specialCases[normalizedName] || null;
  }

  /**
   * Build cross-layer references
   */
  private buildReferences(layers: Record<string, ReturnType<SpecParser['parse']>>): Reference[] {
    const references: Reference[] = [];

    // Find all references in element properties
    for (const [layerId, layer] of Object.entries(layers)) {
      for (const element of layer.elements) {
        // Check if element has references in properties
        if (element.references) {
          for (const [refType, refValue] of Object.entries(element.references)) {
            references.push({
              id: `${element.id}-${refType}`,
              type: refType as Reference['type'],
              source: {
                elementId: element.id,
                layerId: layerId
              },
              target: {
                elementId: refValue as string
              }
            });
          }
        }

        // Check for references in properties
        for (const [key, value] of Object.entries(element.properties)) {
          if (typeof value === 'string' && (key.includes('ref') || key.includes('Ref'))) {
            references.push({
              id: `${element.id}-${key}`,
              type: 'reference' as Reference['type'],
              source: {
                elementId: element.id,
                layerId: layerId,
                property: key
              },
              target: {
                elementId: value
              }
            });
          }
        }
      }
    }

    return references;
  }

  /**
   * Validate model completeness
   */
  validateModel(model: MetaModel): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if we have at least one layer
    if (Object.keys(model.layers).length === 0) {
      errors.push('Model has no layers');
    }

    // Check for empty layers
    for (const [layerId, layer] of Object.entries(model.layers)) {
      if (layer.elements.length === 0) {
        warnings.push(`Layer ${layerId} has no elements`);
      }
    }

    // Validate cross-references
    const allElementIds = new Set<string>();
    for (const layer of Object.values(model.layers)) {
      layer.elements.forEach(el => allElementIds.add(el.id));
    }

    for (const reference of model.references) {
      if (reference.target.elementId && !allElementIds.has(reference.target.elementId)) {
        warnings.push(`Reference ${reference.id} points to non-existent element ${reference.target.elementId}`);
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }
}
