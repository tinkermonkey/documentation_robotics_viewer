/**
 * Type definitions for YAML-based instance models (v0.1.0)
 *
 * These types represent the structure of YAML instance data as defined
 * in the documentation-robotics specification v0.1.0.
 */

/**
 * YAML Manifest Structure
 * Represents manifest.yaml which orchestrates the model
 */
export interface YAMLManifest {
  version: string;
  schema: string;
  created: string;
  updated: string;
  project: YAMLProjectInfo;
  documentation?: string;
  layers: Record<string, YAMLLayerConfig>;
  cross_references?: {
    total: number;
    by_type: Record<string, number>;
  };
  statistics?: YAMLStatistics;
  conventions?: YAMLConventions;
}

/**
 * Project information in manifest
 */
export interface YAMLProjectInfo {
  name: string;
  description: string;
  version: string;
}

/**
 * Layer configuration in manifest
 */
export interface YAMLLayerConfig {
  order: number;
  name: string;
  path: string;
  schema: string;
  enabled: boolean;
  elements: Record<string, number>; // Element type -> count mapping
}

/**
 * Model statistics in manifest
 */
export interface YAMLStatistics {
  total_elements: number;
  total_relationships: number;
  completeness: number;
  last_validation: string;
  validation_status: string;
}

/**
 * Naming and ID conventions
 */
export interface YAMLConventions {
  id_format: string; // e.g., '{layer}.{type}.{kebab-case-name}'
  file_naming: Record<string, string>;
}

/**
 * YAML Element Structure
 * Represents a single element in a YAML file
 * Elements are stored as key-value pairs where the key is the element name
 */
export interface YAMLElement {
  name: string;
  description?: string;
  id: string; // Dot-notation format: {layer}.{type}.{name}

  // API-specific properties
  method?: string; // HTTP method (GET, POST, etc.)
  path?: string; // API endpoint path

  // Embedded specifications
  openapi?: unknown; // OpenAPI 3.0 specification object
  $schema?: string; // JSON Schema version
  schemas?: Record<string, unknown>; // JSON Schema definitions

  // Nested relationships (instead of separate array)
  relationships?: YAMLRelationships;

  // Additional custom properties
  [key: string]: unknown;
}

/**
 * Nested relationships within an element
 * Different relationship types are grouped by semantic meaning
 */
export interface YAMLRelationships {
  // ArchiMate-style relationships
  realizes?: string[]; // Element realizes these business concepts
  serves?: string[]; // Element serves these components
  accesses?: string[]; // Element accesses these data stores
  uses?: string[]; // Element uses these services
  composes?: string[]; // Element is composed of these parts
  flows_to?: string[]; // Flow relationships
  assigned_to?: string[]; // Assignment relationships
  aggregates?: string[]; // Aggregation relationships
  specializes?: string[]; // Specialization/inheritance

  // Custom cross-layer references
  supports_goals?: string[]; // Motivation layer
  fulfills_requirements?: string[];
  constrained_by?: string[];

  // Security relationships
  secured_by?: string[];
  requires_permissions?: string[];

  // Generic relationship support
  [key: string]: string[] | undefined;
}

/**
 * Aggregated layer data loaded from YAML files
 * Multiple YAML files can contribute elements to a single layer
 */
export interface YAMLLayerData {
  layerId: string;
  layerName: string;
  elements: Record<string, YAMLElement>; // Element name -> element mapping
  sourceFiles: string[]; // YAML files that contributed to this layer
}

/**
 * Complete YAML model data
 * Combines manifest with loaded layer data
 */
export interface YAMLModelData {
  manifest: YAMLManifest;
  layers: Record<string, YAMLLayerData>;
  projectionRules?: ProjectionRules;
  warnings: string[]; // Accumulated warnings from best-effort parsing
}

/**
 * Projection Rules Structure
 * Represents projection-rules.yaml which defines cross-layer element generation
 */
export interface ProjectionRules {
  version: string;
  projections: ProjectionRule[];
}

/**
 * Individual projection rule
 */
export interface ProjectionRule {
  name: string;
  from: string; // Source layer.type (e.g., 'business.service')
  to: string; // Target layer.type (e.g., 'application.service')
  rules: ProjectionTransformRule[];
}

/**
 * Transformation rule within a projection
 */
export interface ProjectionTransformRule {
  create_type: string; // Type of element to create
  name_template: string; // Template for generating name (supports {{source.*}})
  properties: Record<string, string>; // Property mappings with templates
}

/**
 * File reference for YAML content
 * Used when loading from GitHub or filesystem
 */
export interface YAMLFileReference {
  path: string; // Relative path from model root
  content: string; // YAML file content as string
  layerId?: string; // Associated layer ID (if determined)
}

/**
 * Result of YAML parsing operation
 * Includes parsed model and any warnings encountered
 */
export interface YAMLParseResult {
  model: YAMLModelData;
  warnings: string[];
  errors?: string[]; // Fatal errors that prevented partial parsing
}

/**
 * OpenAPI operation extracted from YAML
 * Subset of OpenAPI 3.0 spec relevant for visualization
 */
export interface OpenAPIOperation {
  operationId: string;
  method: string;
  path: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  tags?: string[];
}

/**
 * OpenAPI parameter
 */
export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  schema?: unknown;
  description?: string;
}

/**
 * JSON Schema extracted from YAML
 * Subset of JSON Schema Draft-07 relevant for visualization
 */
export interface JSONSchemaDefinition {
  schemaName: string;
  title?: string;
  description?: string;
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  $ref?: string;
}
