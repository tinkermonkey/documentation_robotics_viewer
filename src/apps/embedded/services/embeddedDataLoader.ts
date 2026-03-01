/**
 * Embedded Data Loader
 * REST API client for loading data from the DR CLI server
 * Supports token-based authentication for DR CLI visualization server
 *
 * NOTE: Uses generated types from src/core/services/generatedApiClient.ts
 * to ensure consistency with OpenAPI spec. This replaces manual type definitions
 * that can drift from the actual API contract.
 */

import { MetaModel, Layer, Reference, Relationship, ModelElement, ModelMetadata } from '../../../core/types';
import { Annotation, AnnotationCreate, AnnotationUpdate } from '../types/annotations';
import { logError } from './errorTracker';
import { ERROR_IDS } from '@/constants/errorIds';

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
    // Use structured error logging for consistent error tracking
    logError(
      ERROR_IDS.AUTH_COOKIE_DECODE_FAILED,
      'Cookie decode failed - token is malformed and cannot be used',
      { cookieName: AUTH_COOKIE_NAME },
      decodeError instanceof Error ? decodeError : new Error(String(decodeError))
    );
    // Return null instead of invalid token. Auth architecture uses localStorage as the primary
    // source (populated by authStore on app init) with cookies as a fallback mechanism.
    // Failing to decode the cookie gracefully falls back to localStorage for the token.
    return null;
  }
}

async function ensureOk(response: Response, context: string): Promise<void> {
  if (response.ok) return;
  if (response.status === 401 || response.status === 403) {
    const errorMessage = `Authentication failed (${response.status}). ${context}`;
    logError(
      ERROR_IDS.AUTH_REQUEST_FAILED,
      errorMessage,
      { context, statusCode: response.status },
      new Error(errorMessage)
    );
    // NOTE: Don't clear token on auth failures - the server should handle auth properly
    throw new Error(errorMessage);
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
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`
  };
}

export interface RelationshipType {
  id: string;
  name?: string;
  predicate?: string;
  inversePredicate?: string;
  category?: string;
  description?: string;
  sourceTypes?: string[];
  targetTypes?: string[];
  cardinality?: string;
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
  specVersion?: string;
  source?: string;
  createdAt?: string;
  createdBy?: string;
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
  // JSON Schema Draft 7 style definitions
  definitions?: Record<string, SchemaDefinition>;
  // JSON Schema Draft 2019-09+ style definitions (modern standard)
  $defs?: Record<string, SchemaDefinition>;
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

/**
 * Base fields common to all changeset operations
 */
interface ChangesetChangeBase {
  timestamp: string;
  element_id: string;
  layer: string;
  element_type: string;
}

/**
 * ChangesetChange - Discriminated union type for changeset operations
 *
 * NOTE: Type design
 * This manual definition uses a proper discriminated union with `never` types
 * to enforce mutual exclusivity of operation-specific fields:
 * - 'add' requires 'data', forbids 'before'/'after'
 * - 'update' requires 'before'/'after', forbids 'data'
 * - 'delete' requires 'before', forbids 'data'/'after'
 *
 * The generated type in src/core/types/api-client.ts uses optional properties
 * (data?, before?, after?) which is less type-safe. This manual definition is
 * preferred for runtime type checking. See validateChangesetChanges() for usage.
 */
export type ChangesetChange =
  | (ChangesetChangeBase & {
      operation: 'add';
      data: Record<string, unknown>;
      before?: never;
      after?: never;
    })
  | (ChangesetChangeBase & {
      operation: 'update';
      before: Record<string, unknown>;
      after: Record<string, unknown>;
      data?: never;
    })
  | (ChangesetChangeBase & {
      operation: 'delete';
      before: Record<string, unknown>;
      data?: never;
      after?: never;
    });

/**
 * Type guard for ChangesetChange discriminated union
 * Validates that JSON deserialized from API conforms to expected ChangesetChange type
 */
export function isChangesetChange(value: unknown): value is ChangesetChange {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;
  const operation = obj.operation;

  // Validate common required fields
  if (
    typeof obj.timestamp !== 'string' ||
    typeof obj.element_id !== 'string' ||
    typeof obj.layer !== 'string' ||
    typeof obj.element_type !== 'string'
  ) {
    return false;
  }

  // Validate based on discriminator
  switch (operation) {
    case 'add':
      return typeof obj.data === 'object' && obj.data !== null;
    case 'update':
      return (
        typeof obj.before === 'object' &&
        obj.before !== null &&
        typeof obj.after === 'object' &&
        obj.after !== null
      );
    case 'delete':
      return typeof obj.before === 'object' && obj.before !== null;
    default:
      return false;
  }
}

/**
 * Validate an array of changes from API response
 * @throws Error if any change is invalid
 */
export function validateChangesetChanges(
  changes: unknown[]
): asserts changes is ChangesetChange[] {
  if (!Array.isArray(changes)) {
    throw new Error('Changes must be an array');
  }

  for (let i = 0; i < changes.length; i++) {
    if (!isChangesetChange(changes[i])) {
      throw new Error(
        `Invalid change at index ${i}: ${JSON.stringify(changes[i])}`
      );
    }
  }
}

export interface ChangesetDetails {
  metadata: ChangesetMetadata;
  changes: {
    version: string;
    changes: ChangesetChange[];
  };
}

// ─── API response types (scoped to this file) ─────────────────────────────────

interface ApiNode {
  id: string;
  spec_node_id: string;
  type: string;
  layer_id: string;
  name: string;
  description?: string;
  attributes?: Record<string, unknown>;
}

interface ApiLink {
  id: string;
  source: string;
  target: string;
  type: string;
  /** Present for intra-layer links */
  layer_id?: string;
  /** Present for cross-layer links */
  source_layer_id?: string;
  /** Present for cross-layer links */
  target_layer_id?: string;
}

interface ApiModelResponse {
  version?: string;  // Not required by spec; adaptApiModel defaults to '1.0.0'
  nodes: ApiNode[];
  links: ApiLink[];
  metadata?: Record<string, unknown>;
}

/**
 * Adapt the new structured API response to the internal MetaModel format.
 * Groups nodes by layer, routes intra-layer links → layer.relationships,
 * and cross-layer links → model.references.
 */
function adaptApiModel(data: ApiModelResponse): MetaModel {
  if (!Array.isArray(data?.nodes) || !Array.isArray(data?.links)) {
    throw new Error(
      'The model API returned an unexpected response format. ' +
      `Expected { nodes: [], links: [] } but got nodes=${JSON.stringify(data?.nodes === undefined ? 'missing' : typeof data.nodes)}, ` +
      `links=${JSON.stringify(data?.links === undefined ? 'missing' : typeof data.links)}. ` +
      'Please check that the DR CLI server is running a compatible version.'
    );
  }

  // Build a lookup from node id → layer_id for reference resolution
  const nodeLayerMap = new Map<string, string>();
  for (const node of data.nodes) {
    if (!node.id || !node.layer_id) {
      console.warn('[adaptApiModel] Node missing required id or layer_id — skipping', { nodeId: node.id, layerId: node.layer_id, name: node.name });
      continue;
    }
    nodeLayerMap.set(node.id, node.layer_id);
  }

  // Group nodes by layer
  const layerNodes = new Map<string, ApiNode[]>();
  for (const node of data.nodes) {
    if (!node.id || !node.layer_id) continue; // already warned above
    const group = layerNodes.get(node.layer_id) ?? [];
    group.push(node);
    layerNodes.set(node.layer_id, group);
  }

  // Separate intra-layer vs cross-layer links
  const intraLayerLinks: ApiLink[] = [];
  const crossLayerLinks: ApiLink[] = [];
  for (const link of data.links) {
    if (link.source_layer_id && link.target_layer_id) {
      crossLayerLinks.push(link);
    } else {
      intraLayerLinks.push(link);
    }
  }

  // Build layers map
  const layers: Record<string, Layer> = {};
  for (const [layerId, nodes] of layerNodes) {
    const elements: ModelElement[] = nodes.map((node) => ({
      id: node.id,
      type: node.type,
      specNodeId: node.spec_node_id,
      name: node.name,
      description: node.description,
      layerId: node.layer_id,
      properties: node.attributes ?? {},
      visual: {
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        style: {},
      },
    }));

    const relationships: Relationship[] = intraLayerLinks
      .filter((link) => {
        const srcLayer = nodeLayerMap.get(link.source);
        if (srcLayer === undefined) {
          console.warn('[adaptApiModel] Intra-layer link references unknown source node — skipping', { linkId: link.id, source: link.source });
          return false;
        }
        return srcLayer === layerId;
      })
      .map((link) => ({
        id: link.id,
        type: link.type,
        sourceId: link.source,
        targetId: link.target,
      }));

    layers[layerId] = {
      id: layerId,
      type: layerId,
      name: layerId,
      elements,
      relationships,
    };
  }

  // Build cross-layer references
  const references: Reference[] = crossLayerLinks.map((link) => ({
    id: link.id,
    type: link.type as import('../../../core/types/model').ReferenceType,
    source: {
      elementId: link.source,
      layerId: link.source_layer_id,
    },
    target: {
      elementId: link.target,
      layerId: link.target_layer_id,
    },
  }));

  const computedLayerCount = Object.keys(layers).length;
  const computedElementCount = data.nodes.filter((n) => n.id && n.layer_id).length;
  const metadata: ModelMetadata | undefined = data.metadata
    ? {
        ...(data.metadata as ModelMetadata),
        // Computed values always win over server-provided values for correctness
        loadedAt: new Date().toISOString(),
        layerCount: computedLayerCount,
        elementCount: computedElementCount,
      }
    : {
        loadedAt: new Date().toISOString(),
        layerCount: computedLayerCount,
        elementCount: computedElementCount,
      };

  return {
    layers,
    references,
    metadata,
  };
}

export class EmbeddedDataLoader {
  /**
   * Generic fetch helper that combines common pattern: fetch -> ensureOk -> json -> log
   *
   * IMPORTANT: This method uses a type assertion (as T) without runtime validation.
   * The response is NOT validated to match the expected type T. Unlike ChangesetChange
   * which uses runtime validation (validateChangesetChanges), this method assumes the
   * server response matches the declared type. Use only for endpoints with stable,
   * well-documented response schemas. For new endpoints, consider adding runtime validation.
   *
   * @param url - URL to fetch
   * @param context - Context string for error logging
   * @param options - Additional fetch options
   * @returns Parsed JSON response (type assertion only, not validated)
   */
  private async fetchJson<T>(
    url: string,
    context: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include',
      ...options
    });

    await ensureOk(response, context);

    const data = await response.json();
    return data as T;
  }

  /**
   * Check server health
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.fetchJson<{ status: string; version: string }>(
      '/health',
      'health check'
    );
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

    // Type the raw response to narrow the untyped JSON
    const data = (await response.json()) as Record<string, unknown> & {
      version?: string;
      type?: string;
      schemas?: Record<string, unknown>;
      schemaCount?: number;
      schema_count?: number;
      relationshipCatalog?: RelationshipCatalog;
      relationship_catalog?: RelationshipCatalog;
    };

    // Normalize snake_case from server to camelCase for TypeScript
    const schemaCount = data.schemaCount ?? data.schema_count ?? (data.schemas ? Object.keys(data.schemas).length : 0);
    const relationshipCatalog: RelationshipCatalog | undefined = data.relationshipCatalog || data.relationship_catalog;

    const result: SpecDataResponse = {
      version: data.version ?? '',
      type: data.type ?? '',
      schemas: (data.schemas ?? {}) as Record<string, SchemaDefinition>,
      schemaCount,
      relationshipCatalog
    };

    if (typeof data.description === 'string') {
      result.description = data.description;
    }
    if (typeof data.source === 'string') {
      result.source = data.source;
    }
    if (data.manifest && typeof data.manifest === 'object') {
      result.manifest = data.manifest as SchemaManifest;
    }

    return result;
  }

  /**
   * Load a specific layer by name
   */
  async loadLayer(layerName: string): Promise<{ name: string; elements: unknown[]; elementCount: number }> {
    const data = await this.fetchJson<{ name: string; elements: unknown[]; elementCount: number }>(
      `${API_BASE}/layers/${encodeURIComponent(layerName)}`,
      `load layer ${layerName}`
    );
    return data;
  }

  /**
   * Load the current model from the DR CLI server's structured nodes/links API
   */
  async loadModel(): Promise<MetaModel> {
    const data = await this.fetchJson<ApiModelResponse>(`${API_BASE}/model`, 'load model');
    return adaptApiModel(data);
  }

  /**
   * Load changeset registry (list of all changesets)
   */
  async loadChangesetRegistry(): Promise<ChangesetRegistry> {
    const data = await this.fetchJson<ChangesetRegistry>(
      `${API_BASE}/changesets`,
      'load changesets'
    );
    return data;
  }

  /**
   * Load specific changeset details
   */
  async loadChangeset(changesetId: string): Promise<ChangesetDetails> {
    const data = await this.fetchJson<ChangesetDetails>(
      `${API_BASE}/changesets/${encodeURIComponent(changesetId)}`,
      `load changeset ${changesetId}`
    );

    // Validate changes array at runtime
    if (data.changes && Array.isArray(data.changes.changes)) {
      validateChangesetChanges(data.changes.changes);
    }

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
    return data;
  }

  /**
   * Update an existing annotation
   */
  async updateAnnotation(id: string, updates: Omit<AnnotationUpdate, 'id'>): Promise<Annotation> {
    const response = await fetch(`${API_BASE}/annotations/${encodeURIComponent(id)}`, {
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
    const response = await fetch(`${API_BASE}/annotations/${encodeURIComponent(annotationId)}/replies`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, `load replies for annotation ${annotationId}`);

    const data = await response.json();
    return data.replies || [];
  }

  /**
   * Create a reply to an annotation
   */
  async createAnnotationReply(
    annotationId: string,
    input: { author: string; content: string }
  ): Promise<import('../types/annotations').AnnotationReply> {
    const response = await fetch(`${API_BASE}/annotations/${encodeURIComponent(annotationId)}/replies`, {
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
    return data;
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/annotations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    await ensureOk(response, 'delete annotation');
  }
}

// Export singleton instance
export const embeddedDataLoader = new EmbeddedDataLoader();
