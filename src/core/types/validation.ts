/**
 * Validation and Source File Type Definitions (Phase 2)
 *
 * Defines types for:
 * - Source file validation (manifest, elements, relationships)
 * - Validation issues and severity levels
 * - Offline metadata storage and caching
 * - Source traceability and file modification tracking
 */

/**
 * Severity levels for validation issues
 */
export enum ValidationSeverity {
  Error = 'error',        // Prevents model from loading
  Warning = 'warning',    // Can load but indicates quality issues
  Info = 'info',          // Informational only
}

/**
 * Validation issue types
 */
export enum ValidationIssueType {
  // Manifest validation
  ManifestMissing = 'manifest_missing',
  ManifestInvalid = 'manifest_invalid',
  InvalidManifestVersion = 'invalid_manifest_version',
  InvalidProjectInfo = 'invalid_project_info',

  // Layer configuration validation
  LayerConfigMissing = 'layer_config_missing',
  LayerFileMissing = 'layer_file_missing',
  InvalidLayerPath = 'invalid_layer_path',
  InvalidLayerSchema = 'invalid_layer_schema',
  LayerMetadataInconsistent = 'layer_metadata_inconsistent',

  // Element validation
  ElementSyntaxError = 'element_syntax_error',
  InvalidElementId = 'invalid_element_id',
  DuplicateElementId = 'duplicate_element_id',
  MissingRequiredField = 'missing_required_field',
  InvalidElementType = 'invalid_element_type',

  // Relationship validation
  RelationshipSyntaxError = 'relationship_syntax_error',
  MissingRelationshipTarget = 'missing_relationship_target',
  InvalidRelationshipType = 'invalid_relationship_type',
  OrphanedRelationship = 'orphaned_relationship',

  // Cross-layer validation
  CrossLayerReferenceFailed = 'cross_layer_reference_failed',
  InvalidCrossLayerTarget = 'invalid_cross_layer_target',
  CircularDependency = 'circular_dependency',

  // Naming convention validation
  NamingConventionViolation = 'naming_convention_violation',
  FileNamingInconsistent = 'file_naming_inconsistent',

  // Integrity validation
  IdUniquenessViolation = 'id_uniqueness_violation',
  DataInconsistency = 'data_inconsistency',
}

/**
 * A single validation issue
 */
export interface ValidationIssue {
  type: ValidationIssueType;
  severity: ValidationSeverity;
  message: string;
  location?: {
    file?: string;
    layer?: string;
    element?: string;
    line?: number;
  };
  suggestedFix?: string;
}

/**
 * Comprehensive validation report for source files
 */
export interface SourceValidationReport {
  isValid: boolean;
  timestamp: Date;
  summary: string;

  // Manifest validation
  manifestValid: boolean;
  manifestIssues: ValidationIssue[];

  // File validation
  filesChecked: number;
  filesValid: number;
  fileIssues: ValidationIssue[];

  // Element validation
  elementsFound: number;
  elementsValid: number;
  elementIssues: ValidationIssue[];

  // Relationship validation
  relationshipsFound: number;
  relationshipsValid: number;
  relationshipIssues: ValidationIssue[];

  // Aggregate statistics
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;

  // All issues
  issues: ValidationIssue[];
}

/**
 * Source file metadata tracking
 */
export interface SourceFileMetadata {
  filePath: string;
  fileName: string;
  layer?: string;
  fileSize: number;
  lastModified: Date;
  checksum?: string;  // For detecting changes
  loadedAt: Date;
  elementCount: number;
  relationshipCount: number;
  validationStatus: 'valid' | 'invalid' | 'unknown';
  validationErrors?: string[];
}

/**
 * Model metadata with offline support
 */
export interface ModelMetadataRecord {
  modelId: string;
  version: string;
  created: Date;
  lastModified: Date;
  lastValidated: Date;
  validationStatus: 'valid' | 'invalid' | 'unknown';

  // Statistics
  elementCount: number;
  relationshipCount: number;
  crossReferenceCount: number;
  completenessScore: number;  // 0-100%

  // Source tracking
  sourceFiles: SourceFileMetadata[];
  totalSourceSize: number;

  // Validation summary
  lastValidationReport?: SourceValidationReport;
  validationIssueCount: number;
  validationErrorCount: number;
  validationWarningCount: number;

  // Offline support
  isCached: boolean;
  cachedAt?: Date;
  cacheExpiration?: Date;
  offlineSupported: boolean;
}

/**
 * Cache metadata for TTL management
 */
export interface CacheEntry<T> {
  data: T;
  created: Date;
  expires: Date;
  ttl: number;  // milliseconds
  metadata?: {
    size?: number;
    hits?: number;
  };
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  defaultTTL?: number;  // milliseconds (default: 24 hours)
  maxSize?: number;    // bytes, optional max cache size
  maxEntries?: number; // optional max number of entries (default: 1000)
  enableCompression?: boolean; // optional compression (default: false)
}

/**
 * Source tracking record
 */
export interface SourceTracingRecord {
  elementId: string;
  elementName: string;
  sourceFile: string;
  layer: string;
  originalPosition?: {
    line?: number;
    column?: number;
  };
  modificationHistory: Array<{
    date: Date;
    changeType: 'created' | 'modified' | 'deleted';
    previousValue?: unknown;
    newValue?: unknown;
    reason?: string;
  }>;
}

/**
 * Model index for fast lookups
 */
export interface ModelIndex {
  // Element indexes
  elementsByLayer: Map<string, Set<string>>;
  elementsByType: Map<string, Set<string>>;
  elementIdLookup: Map<string, { layerId: string; elementId: string }>;

  // Relationship indexes
  relationshipsBySource: Map<string, Set<string>>;
  relationshipsByTarget: Map<string, Set<string>>;
  relationshipsByType: Map<string, Set<string>>;

  // Source tracing
  elementToSource: Map<string, SourceFileMetadata>;

  // Search indexes
  nameToElements: Map<string, Set<string>>;  // Full-text search index
  keywordIndex: Map<string, Set<string>>;    // Keyword search index
}

/**
 * Result of incremental model update
 */
export interface IncrementalUpdateResult {
  success: boolean;
  timestamp: Date;
  changedFiles: string[];
  addedElements: number;
  modifiedElements: number;
  deletedElements: number;
  addedRelationships: number;
  modifiedRelationships: number;
  deletedRelationships: number;
  validationReport: SourceValidationReport;
}

/**
 * Element validation context for detailed error reporting
 */
export interface ElementValidationContext {
  elementId: string;
  elementName: string;
  elementType: string;
  layer: string;
  file: string;
  lineNumber?: number;
}

/**
 * Relationship validation context
 */
export interface RelationshipValidationContext {
  relationshipId: string;
  relationshipType: string;
  sourceId: string;
  targetId: string;
  layer?: string;
  file: string;
  lineNumber?: number;
}

/**
 * Validation options for fine-grained control
 */
export interface ValidationOptions {
  // Manifest validation
  validateManifest?: boolean;
  validateManifestVersion?: boolean;

  // File validation
  validateFileExistence?: boolean;
  validateFileSyntax?: boolean;
  validateFileSize?: boolean;
  maxFileSize?: number;

  // Element validation
  validateElementIds?: boolean;
  validateElementTypes?: boolean;
  validateNamingConventions?: boolean;
  enforceIdFormat?: boolean;

  // Relationship validation
  validateRelationshipTargets?: boolean;
  validateRelationshipTypes?: boolean;
  detectCircularDependencies?: boolean;

  // Cross-layer validation
  validateCrossLayerReferences?: boolean;

  // Performance
  stopOnFirstError?: boolean;
  includeWarnings?: boolean;
  maxIssues?: number;
}
