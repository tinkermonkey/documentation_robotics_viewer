/**
 * Test Data Loader Helper
 *
 * Provides utilities for loading test data, including the example-implementation model.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { MetaModel, Layer, ModelElement, Relationship, LayerType } from '../../src/core/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load the example-implementation YAML model for testing
 */
export async function loadExampleImplementation(): Promise<MetaModel> {
  const exampleImplPath = path.join(__dirname, '..', '..', 'example-implementation', 'model');
  const manifestPath = path.join(exampleImplPath, 'manifest.yaml');

  // Read manifest
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = yaml.load(manifestContent) as any;

  // Build MetaModel from manifest and layer files
  const layers: Record<string, Layer> = {};

  // Map layer names to LayerType enum
  const layerTypeMap: Record<string, LayerType> = {
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

  // Load each layer
  for (const [layerId, layerConfig] of Object.entries(manifest.layers) as any) {
    if (!layerConfig.enabled) {
      continue;
    }

    const layerPath = path.join(exampleImplPath, layerConfig.path.replace('documentation-robotics/model/', ''));
    const elements: ModelElement[] = [];
    const relationships: Relationship[] = [];

    // Read all YAML files in the layer directory
    if (fs.existsSync(layerPath)) {
      const files = fs.readdirSync(layerPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

      for (const file of files) {
        const filePath = path.join(layerPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        try {
          const data = yaml.load(fileContent) as any;

          // Parse elements from YAML
          if (data && typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
              if (typeof value === 'object' && value !== null) {
                const element = parseYAMLElement(key, value as any, layerId);
                if (element) {
                  elements.push(element);

                  // Extract relationships if present
                  const elementRelationships = extractRelationshipsFromElement(element, value as any);
                  relationships.push(...elementRelationships);
                }
              }
            }
          }
        } catch (error) {
          // Best-effort parsing - skip files with YAML errors
          console.warn(`[testDataLoader] Skipping file ${file} due to YAML error:`, error instanceof Error ? error.message : error);
        }
      }
    }

    // Create layer
    const layerType = layerTypeMap[layerId] || layerId;
    layers[layerId] = {
      id: layerId,
      type: layerType,
      name: layerConfig.name,
      elements,
      relationships,
    };
  }

  return {
    version: manifest.version,
    name: manifest.project?.name,
    description: manifest.project?.description,
    layers,
    references: [],
    metadata: {
      type: 'instance-yaml',
      layerCount: Object.keys(layers).length,
      elementCount: manifest.statistics?.total_elements || 0,
    },
  };
}

/**
 * Parse a YAML element into ModelElement
 */
function parseYAMLElement(key: string, data: any, layerId: string): ModelElement | null {
  if (!data.id) {
    return null; // Skip elements without IDs
  }

  // Extract element type from ID (e.g., "application.service.name" -> "service")
  const idParts = data.id.split('.');
  const elementType = idParts.length >= 2 ? idParts[1] : 'unknown';

  return {
    id: data.id,
    type: elementType,
    name: data.name || key,
    description: data.description || '',
    layerId,
    properties: {
      ...data,
      // Remove redundant fields
      id: undefined,
      name: undefined,
      description: undefined,
      relationships: undefined,
    },
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      style: {},
    },
    relationships: {
      incoming: [],
      outgoing: [],
    },
  };
}

/**
 * Extract relationships from YAML element
 */
function extractRelationshipsFromElement(element: ModelElement, data: any): Relationship[] {
  const relationships: Relationship[] = [];

  // Check for relationships object
  if (data.relationships && typeof data.relationships === 'object') {
    for (const [relType, targets] of Object.entries(data.relationships)) {
      if (Array.isArray(targets)) {
        for (const target of targets) {
          if (typeof target === 'string') {
            relationships.push({
              id: `${element.id}-${relType}-${target}`,
              type: relType,
              sourceId: element.id,
              targetId: target,
            });
          }
        }
      }
    }
  }

  // Check for common relationship properties
  const relationshipProps = [
    'realizes',
    'realizes-services',
    'supports_goals',
    'accesses',
    'uses',
    'calls',
    'deployed_on',
    'runs_on',
    'parent',
  ];

  for (const propName of relationshipProps) {
    const value = data[propName];
    if (typeof value === 'string') {
      relationships.push({
        id: `${element.id}-${propName}-${value}`,
        type: propName,
        sourceId: element.id,
        targetId: value,
      });
    } else if (Array.isArray(value)) {
      for (const target of value) {
        if (typeof target === 'string') {
          relationships.push({
            id: `${element.id}-${propName}-${target}`,
            type: propName,
            sourceId: element.id,
            targetId: target,
          });
        }
      }
    }
  }

  // Check nested relationship objects (e.g., business.realizes-services)
  if (data.business && typeof data.business === 'object') {
    if (Array.isArray(data.business['realizes-services'])) {
      for (const target of data.business['realizes-services']) {
        relationships.push({
          id: `${element.id}-realizes-${target}`,
          type: 'realizes',
          sourceId: element.id,
          targetId: target,
        });
      }
    }
  }

  // Check datastore access
  if (data.datastore && typeof data.datastore === 'object') {
    if (Array.isArray(data.datastore.accesses)) {
      for (const target of data.datastore.accesses) {
        relationships.push({
          id: `${element.id}-accesses-${target}`,
          type: 'access',
          sourceId: element.id,
          targetId: `datastore.database.${target}`, // Construct full ID
        });
      }
    }
  }

  return relationships;
}

/**
 * Create a simple test MetaModel with minimal data
 */
export function createSimpleTestModel(
  applicationElements: ModelElement[] = [],
  apiElements: ModelElement[] = []
): MetaModel {
  const layers: Record<string, Layer> = {};

  if (applicationElements.length > 0) {
    layers['application'] = {
      id: 'application',
      type: LayerType.Application,
      name: 'Application',
      elements: applicationElements,
      relationships: [],
    };
  }

  if (apiElements.length > 0) {
    layers['api'] = {
      id: 'api',
      type: LayerType.Api,
      name: 'API',
      elements: apiElements,
      relationships: [],
    };
  }

  return {
    version: '1.0.0',
    layers,
    references: [],
    metadata: {},
  };
}
