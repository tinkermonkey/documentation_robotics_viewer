/**
 * Embedded Data Loader
 * REST API client for loading data from the Python CLI server
 */

import { MetaModel } from '../../../core/types';
import { Annotation } from '../types/annotations';

const API_BASE = '/api';

export interface SpecDataResponse {
  version: string;
  type: string;
  description?: string;
  source?: string;
  schemas: Record<string, any>;
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
    const response = await fetch('/health');

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Load the specification (JSON Schema format)
   */
  async loadSpec(): Promise<SpecDataResponse> {
    const response = await fetch(`${API_BASE}/spec`);

    if (!response.ok) {
      throw new Error(`Failed to load spec: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EmbeddedDataLoader] Loaded spec from server:', {
      version: data.version,
      type: data.type,
      schemaCount: data.schemas ? Object.keys(data.schemas).length : 0
    });
    return data;
  }

  /**
   * Load the current model (YAML instance format)
   */
  async loadModel(): Promise<MetaModel> {
    const response = await fetch(`${API_BASE}/model`);

    if (!response.ok) {
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
    const response = await fetch(`${API_BASE}/changesets`);

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
    const response = await fetch(`${API_BASE}/changesets/${changesetId}`);

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
    const response = await fetch(`${API_BASE}/annotations`);

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
    const response = await fetch(`${API_BASE}/annotations?elementId=${encodeURIComponent(elementId)}`);

    if (!response.ok) {
      throw new Error(`Failed to load annotations for element: ${response.statusText}`);
    }

    const data = await response.json();
    return data.annotations || [];
  }
}

// Export singleton instance
export const embeddedDataLoader = new EmbeddedDataLoader();
