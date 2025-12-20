/**
 * Embedded Data Loader
 * REST API client for loading data from the Python CLI server
 * Supports token-based authentication for DR CLI visualization server
 */

import { MetaModel } from '../../../core/types';
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
  } catch (_err) {
    return match.split('=')[1] || null;
  }
}

function setPersistentToken(token: string) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, token);
  } catch (_err) {
    // ignore storage access errors
  }

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } catch (_err) {
    // ignore storage access errors
  }

  if (typeof document !== 'undefined') {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
  }
}

/**
 * Get authentication headers for API requests
 * Checks URL first, then sessionStorage
 */
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  // First, check URL query parameter
  const params = new URLSearchParams(window.location.search);
  let token = params.get('token');

  // If not in URL, check storage (session -> local -> cookie)
  if (!token) {
    token = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY) || getCookieToken();
  }

  // If we found a token in URL, store it for future use in storage and cookie so refreshes persist
  if (params.get('token')) {
    const tokenFromUrl = params.get('token')!;
    setPersistentToken(tokenFromUrl);
  } else if (token) {
    // Refresh cookie/local/session if we only had a cookie
    setPersistentToken(token);
  }

  if (!token) {
    console.log('[Auth] No token found in URL or sessionStorage, request will be unauthenticated');
    return {};
  }

  console.log('[Auth] Token found, adding Authorization header');
  return {
    'Authorization': `Bearer ${token}`
  };
}

export interface LinkType {
  id: string;
  name: string;
  category: string;
  sourceLayers: string[];
  targetLayer: string;
  targetElementTypes: string[];
  fieldPaths: string[];
  cardinality: string;
  format: string;
  description: string;
  examples: string[];
  validationRules: {
    targetExists: boolean;
    targetType: string;
  };
}

export interface LinkCategory {
  name: string;
  description: string;
  color: string;
}

export interface LinkRegistry {
  version: string;
  linkTypes: LinkType[];
  categories: Record<string, LinkCategory>;
  metadata: {
    generatedDate: string;
    generatedFrom: string;
    generator: string;
    totalLinkTypes: number;
    totalCategories: number;
    version: string;
    schemaVersion: string;
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

export interface SpecDataResponse {
  version: string;
  type: string;
  description?: string;
  source?: string;
  schemas: Record<string, any>;
  schema_count?: number;
  schemaCount?: number;
  manifest?: SchemaManifest;
  relationshipCatalog?: RelationshipCatalog;
  relationship_catalog?: RelationshipCatalog;
  linkRegistry?: LinkRegistry;
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

export interface ChangesetChange {
  timestamp: string;
  operation: 'add' | 'update' | 'delete';
  element_id: string;
  layer: string;
  element_type: string;
  data?: any;
  before?: any;
  after?: any;
}

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
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Load the specification (JSON Schema format)
   */
  async loadSpec(): Promise<SpecDataResponse> {
    const response = await fetch(`${API_BASE}/spec`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load spec: ${response.statusText}`);
    }

    const data = await response.json();

    const schemaCount = data.schemaCount ?? data.schema_count ?? (data.schemas ? Object.keys(data.schemas).length : 0);
    const relationshipCatalog: RelationshipCatalog | undefined = data.relationshipCatalog || data.relationship_catalog;

    // Also load link registry
    let linkRegistry: LinkRegistry | undefined;
    try {
      linkRegistry = await this.loadLinkRegistry();
    } catch (err) {
      console.warn('[EmbeddedDataLoader] Failed to load link registry:', err);
    }

    console.log('[EmbeddedDataLoader] Loaded spec from server:', {
      version: data.version,
      type: data.type,
      schemaCount,
      hasLinkRegistry: !!linkRegistry,
      linkTypesCount: linkRegistry?.linkTypes?.length || 0,
      hasRelationshipCatalog: !!relationshipCatalog
    });

    return {
      ...data,
      schemaCount,
      relationshipCatalog,
      linkRegistry
    };
  }

  /**
   * Load link registry
   */
  async loadLinkRegistry(): Promise<LinkRegistry> {
    const response = await fetch(`${API_BASE}/link-registry`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load link registry: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EmbeddedDataLoader] Loaded link registry:', {
      linkTypesCount: data.linkTypes?.length || 0,
      categoriesCount: Object.keys(data.categories || {}).length
    });
    return data;
  }

  /**
   * Load the current model (YAML instance format)
   */
  async loadModel(): Promise<MetaModel> {
    const headers = getAuthHeaders();
    console.log('[DataLoader] Loading model with headers:', Object.keys(headers).join(', ') || 'none');

    const response = await fetch(`${API_BASE}/model`, {
      headers
    });

    if (!response.ok) {
      console.error('[DataLoader] Model load failed:', response.status, response.statusText);
      throw new Error(`Failed to load model: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Loaded model from server:', data.version);
    return data;
  }

  /**
   * Load changeset registry (list of all changesets)
   */
  async loadChangesetRegistry(): Promise<ChangesetRegistry> {
    const response = await fetch(`${API_BASE}/changesets`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load changesets: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Loaded changeset registry:', Object.keys(data.changesets || {}).length, 'changesets');
    return data;
  }

  /**
   * Load specific changeset details
   */
  async loadChangeset(changesetId: string): Promise<ChangesetDetails> {
    const response = await fetch(`${API_BASE}/changesets/${changesetId}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load changeset ${changesetId}: ${response.statusText}`);
    }

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
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load annotations: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Loaded annotations:', data.annotations?.length || 0);
    return data.annotations || [];
  }

  /**
   * Load annotations for a specific element
   */
  async loadAnnotationsForElement(elementId: string): Promise<Annotation[]> {
    const response = await fetch(`${API_BASE}/annotations?elementId=${encodeURIComponent(elementId)}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load annotations for element: ${response.statusText}`);
    }

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
    });

    if (!response.ok) {
      throw new Error(`Failed to create annotation: ${response.statusText}`);
    }

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
    });

    if (!response.ok) {
      throw new Error(`Failed to update annotation: ${response.statusText}`);
    }

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
   * Delete an annotation
   */
  async deleteAnnotation(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/annotations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete annotation: ${response.statusText}`);
    }

    console.log('Deleted annotation:', id);
  }
}

// Export singleton instance
export const embeddedDataLoader = new EmbeddedDataLoader();
