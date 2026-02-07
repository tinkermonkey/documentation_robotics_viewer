/**
 * Cache Manager Service (Phase 2)
 *
 * Manages TTL-based caching of model metadata and validation results
 * with support for both in-memory and persistent storage.
 *
 * Features:
 * - TTL (Time-To-Live) expiration management
 * - LRU eviction policy
 * - Optional size limits
 * - Statistics tracking (hits, misses, evictions)
 * - Compression support for large entries
 *
 * Usage:
 * ```typescript
 * const cacheManager = new CacheManager({
 *   defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
 *   maxEntries: 100,
 * });
 *
 * // Store item
 * cacheManager.set('model-v1', modelData, 24 * 60 * 60 * 1000);
 *
 * // Retrieve item
 * const model = cacheManager.get('model-v1');
 *
 * // Get statistics
 * const stats = cacheManager.getStats();
 * ```
 */

import { CacheConfig, CacheEntry } from '../../types';

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  avgEntrySize: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = []; // For LRU tracking
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };
  private config: {
    defaultTTL: number;
    maxSize?: number;
    maxEntries: number;
    enableCompression: boolean;
  };

  constructor(config?: CacheConfig) {
    this.config = {
      defaultTTL: config?.defaultTTL ?? 24 * 60 * 60 * 1000, // 24 hours
      maxSize: config?.maxSize,
      maxEntries: config?.maxEntries ?? 1000,
      enableCompression: config?.enableCompression ?? false,
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Store item in cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const duration = ttl || this.config.defaultTTL;
    const now = new Date();
    const expires = new Date(now.getTime() + duration);

    // Check if adding would exceed size limit
    if (this.config.maxSize) {
      const size = this.estimateSize(data);
      const totalSize = this.getTotalSize() + size;
      if (totalSize > this.config.maxSize) {
        this.evictLRU();
      }
    }

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }

    // Check max entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    // Store entry
    const entry: CacheEntry<T> = {
      data,
      created: now,
      expires,
      ttl: duration,
      metadata: {
        size: this.estimateSize(data),
        hits: 0,
      },
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  /**
   * Retrieve item from cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (new Date() > entry.expires) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.misses++;
      return null;
    }

    // Update access tracking
    this.stats.hits++;
    if (entry.metadata) {
      entry.metadata.hits = (entry.metadata.hits || 0) + 1;
    }

    // Move to end of access order (most recent)
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (new Date() > entry.expires) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.removeFromAccessOrder(key);
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys()).filter(key => {
      const entry = this.cache.get(key);
      return entry && new Date() <= entry.expires;
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalSize = this.getTotalSize();
    const totalHits = this.stats.hits;
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    const avgEntrySize = this.cache.size > 0 ? totalSize / this.cache.size : 0;

    return {
      totalEntries: this.cache.size,
      totalSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate,
      avgEntrySize,
    };
  }

  /**
   * Get entry metadata without accessing data
   */
  getMetadata(key: string): { created: Date; expires: Date; hits: number; size: number } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return {
      created: entry.created,
      expires: entry.expires,
      hits: entry.metadata?.hits || 0,
      size: entry.metadata?.size || 0,
    };
  }

  /**
   * Remove all expired entries
   */
  cleanup(): number {
    const now = new Date();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get cache size in bytes (estimated)
   */
  private getTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.metadata?.size || 0;
    }
    return total;
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      // For serializable objects, use JSON stringification as estimate
      return JSON.stringify(data).length;
    } catch {
      // Fallback to rough estimate
      return 1024; // 1KB default
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  /**
   * Remove key from access order tracking
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every hour
    const cleanupInterval = 60 * 60 * 1000;
    setInterval(() => {
      this.cleanup();
    }, cleanupInterval);
  }

  /**
   * Export cache to JSON for persistence
   */
  export(): Record<string, { data: any; expires: string }> {
    const exported: Record<string, { data: any; expires: string }> = {};

    for (const [key, entry] of this.cache.entries()) {
      if (new Date() <= entry.expires) {
        exported[key] = {
          data: entry.data,
          expires: entry.expires.toISOString(),
        };
      }
    }

    return exported;
  }

  /**
   * Import cache from JSON
   */
  import(data: Record<string, { data: any; expires: string }>): void {
    for (const [key, item] of Object.entries(data)) {
      const expires = new Date(item.expires);
      if (new Date() <= expires) {
        const entry: CacheEntry<any> = {
          data: item.data,
          created: new Date(),
          expires,
          ttl: expires.getTime() - Date.now(),
          metadata: {
            size: this.estimateSize(item.data),
            hits: 0,
          },
        };
        this.cache.set(key, entry);
        this.accessOrder.push(key);
      }
    }
  }
}
