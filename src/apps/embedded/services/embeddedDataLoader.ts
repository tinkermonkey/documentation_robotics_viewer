/**
 * Embedded Data Loader
 * REST API client for loading data from the DR CLI server
 * Supports token-based authentication for DR CLI visualization server
 */

import { MetaModel, Layer, Reference, Relationship, ModelElement, ModelMetadata, LayerData } from '../../../core/types';
import { Annotation, AnnotationCreate, AnnotationUpdate } from '../types/annotations';

const API_BASE = '/api';

const AUTH_STORAGE_KEY = 'dr_auth_token';
const AUTH_COOKIE_NAME = 'dr_auth_token';

function getCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.split('=')[1] || '');
  } catch (decodeError) {
    // Log decode failures at warning level to prevent silent auth failures
    console.warn(
      '[Auth] Cookie decode failed - token is malformed and cannot be used:',
      decodeError instanceof Error ? decodeError.message : String(decodeError),
      { cookieName: AUTH_COOKIE_NAME }
    );
    // Return null instead of invalid token since localStorage is primary and cookies are fallback
    return null;
  }
}

async function ensureOk(response: Response, context: string): Promise<void> {
  if (response.ok) return;
  if (response.status === 401 || response.status === 403) {
    console.warn(`[Auth] ${context} failed with ${response.status}; ${context}`);
    // NOTE: Don't clear token on auth failures - the server should handle auth properly
    throw new Error(`Authentication failed (${response.status}). ${context}`);
  }
  throw new Error(`Failed to ${context}: ${response.statusText}`);
}

/**
 * Get authentication headers for API requests
 * Token should already be in localStorage from authStore
 */
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  // Get token from localStorage (populated by authStore on app init)
  const token = localStorage.getItem(AUTH_STORAGE_KEY) || getCookieToken();

  if (!token) {
    console.log('[Auth] No token found in localStorage, request will be unauthenticated');
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`
  };
}

export interface RelationshipType {
  id: string;
  predicate?: string;
  inversePredicate?: string;
  category?: string;
  description?: string;
}

export interface RelationshipCatalog {
  version?: string;
  relationshipTypes?: RelationshipType[];
}

export interface SchemaManifestFileEntry {
  sha256: string;
  size: number;
}

export interface SchemaManifest {
  spec_version?: string;
  source?: string;
  created_at?: string;
  created_by?: string;
  files?: Record<string, SchemaManifestFileEntry>;
}

/**
 * JSON Schema definition with common properties
 * Supports both minimal schemas and full JSON Schema Draft 7+ schemas
 * Note: Explicit properties are intentional and strict. Use type guards for additional properties.
 */
export interface SchemaDefinition {
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: SchemaDefinition;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  examples?: unknown[];
  // Additional JSON Schema properties allowed but not explicitly typed
  // Use type guards to safely access: const maybeMinimum = (obj as Record<string, unknown>).minimum;
  additionalProperties?: boolean | SchemaDefinition;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  $ref?: string;
  definitions?: Record<string, SchemaDefinition>;
  // NOTE: The index signature [key: string]: unknown allows JSON Schema properties not listed above.
  // This is necessary for JSON Schema compatibility but is a TypeScript trade-off: accessing properties
  // via bracket notation may lose type information. Access known properties directly when possible.
  [key: string]: unknown;
}

export interface SpecDataResponse {
  version: string;
  type: string;
  description?: string;
  source?: string;
  schemas: Record<string, SchemaDefinition>;
  schemaCount?: number;
  manifest?: SchemaManifest;
  relationshipCatalog?: RelationshipCatalog;
}

export interface ChangesetSummary {
  name: string;
  status: 'active' | 'applied' | 'abandoned';
  type: 'feature' | 'bugfix' | 'exploration';
  created_at: string;
  elements_count: number;
}

export interface ChangesetRegistry {
  version: string;
  changesets: Record<string, ChangesetSummary>;
}

export interface ChangesetMetadata {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  workflow: string;
  summary: {
    elements_added: number;
    elements_updated: number;
    elements_deleted: number;
  };
}

export type ChangesetChange =
  | {
      timestamp: string;
      operation: 'add';
      element_id: string;
      layer: string;
      element_type: string;
      data: Record<string, unknown>;
      before?: never;
      after?: never;
    }
  | {
      timestamp: string;
      operation: 'update';
      element_id: string;
      layer: string;
      element_type: string;
      before: Record<string, unknown>;
      after: Record<string, unknown>;
      data?: never;
    }
  | {
      timestamp: string;
      operation: 'delete';
      element_id: string;
      layer: string;
      element_type: string;
      before: Record<string, unknown>;
      data?: never;
      after?: never;
    };

export interface ChangesetDetails {
  metadata: ChangesetMetadata;
  changes: {
    version: string;
    changes: ChangesetChange[];
  };
}

export class EmbeddedDataLoader {
  /**
   * Check server health
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await fetch('/health', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, 'health check');

    return await response.json();
  }

  /**
   * Load the specification (JSON Schema format)
   * Normalizes server response to camelCase property names
   */
  async loadSpec(): Promise<SpecDataResponse> {
    const response = await fetch(`${API_BASE}/spec`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, 'load spec');

    const data = await response.json();

    // Normalize snake_case from server to camelCase for TypeScript
    const schemaCount = data.schemaCount ?? data.schema_count ?? (data.schemas ? Object.keys(data.schemas).length : 0);
    const relationshipCatalog: RelationshipCatalog | undefined = data.relationshipCatalog || data.relationship_catalog;

    console.log('[EmbeddedDataLoader] Loaded spec from server:', {
      version: data.version,
      type: data.type,
      schemaCount,
      hasRelationshipCatalog: !!relationshipCatalog
    });

    // Exclude snake_case versions to ensure consistent interface
    const { schema_count: _, relationship_catalog: __, ...rest } = data;
    return {
      ...rest,
      schemaCount,
      relationshipCatalog
    };
  }

  /**
   * Load a specific layer by name
   */
  async loadLayer(layerName: string): Promise<{ name: string; elements: unknown[]; elementCount: number }> {
    const response = await fetch(`${API_BASE}/layers/${encodeURIComponent(layerName)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, `load layer ${layerName}`);

    const data = await response.json();
    console.log(`[DataLoader] Loaded layer ${layerName}:`, {
      elementCount: data.elementCount || data.elements?.length || 0
    });
    return data;
  }

  /**
   * Load a specific element by ID
   */
  async loadElement(elementId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/elements/${encodeURIComponent(elementId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, `load element ${elementId}`);

    const data = await response.json();
    console.log(`[DataLoader] Loaded element ${elementId}`);
    return data;
  }

  /**
   * Load the current model (YAML instance format)
   */
  async loadModel(): Promise<MetaModel> {
    const headers = getAuthHeaders();
    console.log('[DataLoader] Loading model with headers:', Object.keys(headers).join(', ') || 'none');

    const response = await fetch(`${API_BASE}/model`, {
      headers,
      credentials: 'include'
    });

    try {
      await ensureOk(response, 'load model');
    } catch (err) {
      console.error('[DataLoader] Model load failed:', response.status, response.statusText);
      throw err;
    }

    const data = await response.json();
    console.log('[DataLoader] Loaded model from server:', {
      version: data.version,
      totalLayers: data.metadata?.statistics?.total_layers,
      totalElements: data.metadata?.statistics?.total_elements,
      layerCount: Object.keys(data.layers).length
    });

    // Normalize model data: ensure all elements have required visual properties
    const normalized = this.normalizeModel(data);
    console.log('[DataLoader] Normalized model:', {
      version: normalized.version,
      layers: Object.entries(normalized.layers).map(([id, layer]) => ({
        id,
        elementCount: layer.elements?.length || 0,
        relationshipCount: layer.relationships?.length || 0
      }))
    });
    return normalized;
  }

  /**
   * Normalize model data to ensure all required properties are present
   */
  private normalizeModel(data: unknown): MetaModel {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid model data: expected object');
    }
    const modelData = data as Record<string, unknown>;
    const normalized: MetaModel = {
      version: typeof modelData.version === 'string' ? modelData.version : '1.0.0',
      layers: {},
      references: Array.isArray(modelData.references) ? (modelData.references as Reference[]) : []
    };

    // Preserve optional metadata from original data
    if (typeof modelData.id === 'string') normalized.id = modelData.id;
    if (typeof modelData.name === 'string') normalized.name = modelData.name;
    if (typeof modelData.description === 'string') normalized.description = modelData.description;
    if (typeof modelData.metadata === 'object' && modelData.metadata !== null) {
      normalized.metadata = modelData.metadata as ModelMetadata;
    }

    for (const [layerId, layer] of Object.entries(modelData.layers || {})) {
      if (typeof layer !== 'object' || layer === null) {
        continue;
      }
      const layerObj = layer as Record<string, unknown>;
      const normalizedLayer: Layer = {
        id: typeof layerObj.id === 'string' ? layerObj.id : layerId,
        type: typeof layerObj.type === 'string' ? layerObj.type : 'unknown',
        name: typeof layerObj.name === 'string' ? layerObj.name : layerId,
        elements: this.normalizeElements(layerObj.elements),
        relationships: Array.isArray(layerObj.relationships) ? (layerObj.relationships as Relationship[]) : []
      };

      // Preserve optional layer properties
      if (typeof layerObj.description === 'string') normalizedLayer.description = layerObj.description;
      if (typeof layerObj.order === 'number') normalizedLayer.order = layerObj.order;
      if (typeof layerObj.data === 'object' && layerObj.data !== null) {
        normalizedLayer.data = layerObj.data as LayerData;
      }

      normalized.layers[layerId] = normalizedLayer;
    }

    return normalized;
  }

  /**
   * Normalize elements array with default visual properties
   */
  private normalizeElements(elements: unknown): ModelElement[] {
    if (!Array.isArray(elements)) return [];

    return elements
      .filter((element: unknown): element is Record<string, unknown> => {
        // Skip non-object elements (null, numbers, strings, etc.)
        // Valid elements must be objects to have required properties
        if (typeof element !== 'object' || element === null) {
          console.warn('[DataLoader] Skipping non-object element in normalizeElements:', typeof element, element);
          return false;
        }
        return true;
      })
      .map((elementObj: Record<string, unknown>) => {
        return {
          id: typeof elementObj.id === 'string' ? elementObj.id : '',
          type: typeof elementObj.type === 'string' ? elementObj.type : '',
          name: typeof elementObj.name === 'string' ? elementObj.name : '',
          layerId: typeof elementObj.layerId === 'string' ? elementObj.layerId : '',
          properties: typeof elementObj.properties === 'object' && elementObj.properties !== null ? (elementObj.properties as Record<string, unknown>) : {},
          visual: this.normalizeVisual(elementObj.visual)
        } as ModelElement;
      });
  }

  /**
   * Normalize element visual properties with defaults
   */
  private normalizeVisual(visual: unknown): Record<string, unknown> {
    if (typeof visual === 'object' && visual !== null) {
      return visual as Record<string, unknown>;
    }
    return {
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      style: { backgroundColor: '#e3f2fd', borderColor: '#1976d2' }
    };
  }

  /**
   * Load changeset registry (list of all changesets)
   */
  async loadChangesetRegistry(): Promise<ChangesetRegistry> {
    const response = await fetch(`${API_BASE}/changesets`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, 'load changesets');

    const data = await response.json();
    console.log('Loaded changeset registry:', Object.keys(data.changesets || {}).length, 'changesets');
    return data;
  }

  /**
   * Load specific changeset details
   */
  async loadChangeset(changesetId: string): Promise<ChangesetDetails> {
    const response = await fetch(`${API_BASE}/changesets/${changesetId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, `load changeset ${changesetId}`);

    const data = await response.json();
    console.log(`Loaded changeset ${changesetId}:`, data.changes.changes.length, 'changes');
    return data;
  }

  /**
   * Get list of changesets as an array
   */
  async getChangesetList(): Promise<Array<ChangesetSummary & { id: string }>> {
    const registry = await this.loadChangesetRegistry();

    return Object.entries(registry.changesets || {}).map(([id, summary]) => ({
      id,
      ...summary
    }));
  }

  /**
   * Load all annotations
   */
  async loadAnnotations(): Promise<Annotation[]> {
    const response = await fetch(`${API_BASE}/annotations`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, 'load annotations');

    const data = await response.json();
    console.log('Loaded annotations:', data.annotations?.length || 0);
    return data.annotations || [];
  }

  /**
   * Load annotations for a specific element
   */
  async loadAnnotationsForElement(elementId: string): Promise<Annotation[]> {
    const response = await fetch(`${API_BASE}/annotations?elementId=${encodeURIComponent(elementId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, 'load annotations for element');

    const data = await response.json();
    return data.annotations || [];
  }

  /**
   * Create a new annotation
   */
  async createAnnotation(input: AnnotationCreate & { author: string }): Promise<Annotation> {
    const response = await fetch(`${API_BASE}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(input),
      credentials: 'include'
    });

    await ensureOk(response, 'create annotation');

    const data = await response.json();
    console.log('Created annotation:', data.id);
    return data;
  }

  /**
   * Update an existing annotation
   */
  async updateAnnotation(id: string, updates: Omit<AnnotationUpdate, 'id'>): Promise<Annotation> {
    const response = await fetch(`${API_BASE}/annotations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates),
      credentials: 'include'
    });

    await ensureOk(response, 'update annotation');

    const data = await response.json();
    console.log('Updated annotation:', id);
    return data;
  }

  /**
   * Resolve an annotation
   */
  async resolveAnnotation(id: string): Promise<Annotation> {
    return this.updateAnnotation(id, { resolved: true });
  }

  /**
   * Unresolve an annotation
   */
  async unresolveAnnotation(id: string): Promise<Annotation> {
    return this.updateAnnotation(id, { resolved: false });
  }

  /**
   * Load replies for an annotation
   */
  async loadAnnotationReplies(annotationId: string): Promise<import('../types/annotations').AnnotationReply[]> {
    const response = await fetch(`${API_BASE}/annotations/${annotationId}/replies`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, `load replies for annotation ${annotationId}`);

    const data = await response.json();
    console.log(`Loaded ${data.replies?.length || 0} replies for annotation ${annotationId}`);
    return data.replies || [];
  }

  /**
   * Create a reply to an annotation
   */
  async createAnnotationReply(
    annotationId: string,
    input: { author: string; content: string }
  ): Promise<import('../types/annotations').AnnotationReply> {
    const response = await fetch(`${API_BASE}/annotations/${annotationId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(input),
      credentials: 'include'
    });

    await ensureOk(response, 'create annotation reply');

    const data = await response.json();
    console.log('Created annotation reply:', data.id);
    return data;
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/annotations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, 'delete annotation');

    console.log('Deleted annotation:', id);
  }
}

// Export singleton instance
export const embeddedDataLoader = new EmbeddedDataLoader();
