/**
 * Validation Services (Phase 2)
 *
 * Central exports for all validation, metadata, and offline support services.
 */

export { GraphElementValidator, ExclusionReason } from './graphElementValidator';
export type {
  MissingElement,
  MissingRelationship,
  ValidationReport,
} from './graphElementValidator';

export { SourceFileValidator } from './sourceFileValidator';

export { CacheManager } from './cacheManager';
export type { CacheStats } from './cacheManager';

export { SourceTracker } from './sourceTracker';

export { ModelIndexer } from './modelIndexer';
export type { SearchResult } from './modelIndexer';

export { MetadataService } from './metadataService';
