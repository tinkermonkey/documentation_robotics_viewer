/**
 * Metadata Service (Phase 2)
 *
 * Comprehensive service for managing model metadata with offline support.
 * Coordinates metadata storage, caching, validation results, and source tracking.
 *
 * Features:
 * - Metadata persistence to IndexedDB
 * - In-memory caching with TTL
 * - Validation result storage
 * - Statistics tracking
 * - Offline model support
 * - Incremental update support
 *
 * Usage:
 * ```typescript
 * const metadataService = new MetadataService();
 * await metadataService.initialize();
 *
 * // Save metadata
 * await metadataService.saveMetadata(modelId, metadata);
 *
 * // Load metadata
 * const metadata = await metadataService.loadMetadata(modelId);
 *
 * // Query offline models
 * const offlineModels = await metadataService.getOfflineModels();
 * ```
 */

import {
  ModelMetadataRecord,
  SourceValidationReport,
  SourceFileMetadata,
  CacheConfig,
} from '../../types';
import { CacheManager } from './cacheManager';
import { SourceTracker } from './sourceTracker';

interface MetadataStoreEntry {
  modelId: string;
  data: ModelMetadataRecord;
  timestamp: number;
}

export class MetadataService {
  private cacheManager: CacheManager;
  private sourceTracker: SourceTracker;
  private db: IDBDatabase | null = null;
  private initialized = false;
  private readonly DB_NAME = 'documentation_robotics_metadata';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'model_metadata';

  constructor(cacheConfig?: CacheConfig) {
    this.cacheManager = new CacheManager(cacheConfig);
    this.sourceTracker = new SourceTracker();
  }

  /**
   * Initialize the metadata service
   * Opens IndexedDB connection and sets up schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          this.initialized = true;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'modelId' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('validationStatus', 'data.validationStatus', { unique: false });
          }
        };
      });
    } catch (error) {
      console.warn('Failed to initialize IndexedDB:', error);
      // Continue with in-memory cache only
      this.initialized = true;
    }
  }

  /**
   * Save model metadata
   */
  async saveMetadata(modelId: string, metadata: ModelMetadataRecord): Promise<void> {
    // Validate metadata
    this.validateMetadata(metadata);

    // Save to cache
    this.cacheManager.set(`metadata-${modelId}`, metadata);

    // Save to IndexedDB if available
    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        const entry: MetadataStoreEntry = {
          modelId,
          data: metadata,
          timestamp: Date.now(),
        };

        const request = store.put(entry);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Load model metadata
   */
  async loadMetadata(modelId: string): Promise<ModelMetadataRecord | null> {
    // Try cache first
    const cached = this.cacheManager.get<ModelMetadataRecord>(`metadata-${modelId}`);
    if (cached) {
      return cached;
    }

    // Try IndexedDB
    if (this.db) {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(modelId);

        request.onsuccess = () => {
          const entry = request.result as MetadataStoreEntry | undefined;
          if (entry) {
            // Cache the loaded metadata
            this.cacheManager.set(`metadata-${modelId}`, entry.data);
            resolve(entry.data);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => resolve(null);
      });
    }

    return null;
  }

  /**
   * Delete model metadata
   */
  async deleteMetadata(modelId: string): Promise<void> {
    // Remove from cache
    this.cacheManager.delete(`metadata-${modelId}`);

    // Remove from IndexedDB
    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(modelId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Get all offline models (models with cached metadata)
   */
  async getOfflineModels(): Promise<ModelMetadataRecord[]> {
    const models: ModelMetadataRecord[] = [];

    if (this.db) {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const entries = request.result as MetadataStoreEntry[];
          resolve(entries.map(e => e.data));
        };

        request.onerror = () => resolve([]);
      });
    }

    return models;
  }

  /**
   * Get models with valid status
   */
  async getValidModels(): Promise<ModelMetadataRecord[]> {
    const allModels = await this.getOfflineModels();
    return allModels.filter(m => m.validationStatus === 'valid');
  }

  /**
   * Get models with invalid status
   */
  async getInvalidModels(): Promise<ModelMetadataRecord[]> {
    const allModels = await this.getOfflineModels();
    return allModels.filter(m => m.validationStatus === 'invalid');
  }

  /**
   * Save validation report
   */
  async saveValidationReport(
    modelId: string,
    report: SourceValidationReport
  ): Promise<void> {
    const metadata = await this.loadMetadata(modelId);
    if (metadata) {
      metadata.lastValidationReport = report;
      metadata.lastValidated = report.timestamp;
      metadata.validationStatus = report.isValid ? 'valid' : 'invalid';
      metadata.validationIssueCount = report.totalIssues;
      metadata.validationErrorCount = report.errorCount;
      metadata.validationWarningCount = report.warningCount;

      await this.saveMetadata(modelId, metadata);
    }
  }

  /**
   * Track source file metadata
   */
  trackSourceFile(
    _modelId: string,
    sourceFile: SourceFileMetadata
  ): void {
    // Store in source tracker
    this.sourceTracker.trackElement(
      sourceFile.filePath,
      sourceFile.filePath,
      sourceFile.layer || 'unknown',
      { id: sourceFile.filePath, name: sourceFile.fileName, type: 'source' } as any
    );
  }

  /**
   * Record element change for traceability
   */
  recordElementChange(
    elementId: string,
    changeType: 'created' | 'modified' | 'deleted',
    previousValue?: unknown,
    newValue?: unknown,
    reason?: string
  ): void {
    this.sourceTracker.recordModification(
      elementId,
      changeType,
      previousValue,
      newValue,
      reason
    );
  }

  /**
   * Get element source information
   */
  getElementSource(elementId: string) {
    return this.sourceTracker.getSource(elementId);
  }

  /**
   * Get element modification history
   */
  getElementHistory(elementId: string) {
    return this.sourceTracker.getModificationHistory(elementId);
  }

  /**
   * Calculate model completeness score
   */
  calculateCompletenessScore(metadata: ModelMetadataRecord): number {
    if (metadata.elementCount === 0) {
      return 0;
    }

    // Score based on validation status, relationships, and cross-references
    let score = 100;

    // Deduct for validation errors
    score -= metadata.validationErrorCount * 10;
    score -= metadata.validationWarningCount * 2;

    // Check relationship coverage
    const relationshipRatio = metadata.relationshipCount / (metadata.elementCount * 2);
    if (relationshipRatio < 0.3) {
      score -= 15;
    } else if (relationshipRatio < 0.5) {
      score -= 8;
    }

    // Check cross-reference coverage
    if (metadata.crossReferenceCount === 0) {
      score -= 10;
    }

    // Check source files
    if (!metadata.sourceFiles || metadata.sourceFiles.length === 0) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * Clear all metadata cache
   */
  async clearCache(): Promise<void> {
    this.cacheManager.clear();

    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    this.cacheManager.clear();
    this.sourceTracker.clear();

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.initialized = false;
  }

  /**
   * Validate metadata structure
   */
  private validateMetadata(metadata: ModelMetadataRecord): void {
    if (!metadata.modelId) {
      throw new Error('Metadata missing required field: modelId');
    }
    if (!metadata.version) {
      throw new Error('Metadata missing required field: version');
    }
    if (typeof metadata.elementCount !== 'number') {
      throw new Error('Metadata missing required field: elementCount');
    }
  }

  /**
   * Export all metadata and cache for backup
   */
  async export(): Promise<{
    cacheData: Record<string, any>;
    metadata: ModelMetadataRecord[];
    sourceTracking: any;
  }> {
    const cacheData = this.cacheManager.export();
    const metadata = await this.getOfflineModels();
    const sourceTracking = this.sourceTracker.export();

    return {
      cacheData,
      metadata,
      sourceTracking,
    };
  }

  /**
   * Import cached data from backup
   */
  async import(data: {
    cacheData?: Record<string, any>;
    metadata?: ModelMetadataRecord[];
    sourceTracking?: any;
  }): Promise<void> {
    if (data.cacheData) {
      this.cacheManager.import(data.cacheData);
    }

    if (data.metadata) {
      for (const metadata of data.metadata) {
        await this.saveMetadata(metadata.modelId, metadata);
      }
    }

    if (data.sourceTracking) {
      this.sourceTracker.import(data.sourceTracking);
    }
  }
}
