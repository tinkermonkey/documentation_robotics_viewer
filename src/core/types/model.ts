import { LayerType, LayerData, LayerVisualConfig } from './layers';

/**
 * Root meta-model containing all layers
 */
export interface MetaModel {
  id?: string;
  name?: string;
  version: string;
  description?: string;
  layers: Record<string, Layer>;
  references: Reference[];
  metadata?: ModelMetadata;
}

/**
 * Individual layer in the meta-model
 */
export interface Layer {
  id: string;
  type: LayerType | string;
  name: string;
  elements: ModelElement[];
  relationships: Relationship[];
  data?: LayerData;
  visual?: LayerVisualConfig;
}

/**
 * Base model element interface
 */
export interface ModelElement {
  id: string;
  type: string;
  name: string;
  description?: string;
  layerId: string;
  properties: Record<string, unknown>;
  visual: ElementVisual;
  relationships?: {
    incoming: string[];
    outgoing: string[];
  };
  references?: ElementReferences;
}

/**
 * Visual properties of an element
 */
export interface ElementVisual {
  position: Point;
  size: Size;
  style: ElementStyle;
  layoutHints?: LayoutHints;
}

/**
 * 2D point
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 2D size
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Visual styling for an element
 */
export interface ElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderStyle?: string;
  icon?: string;
  shape?: ShapeType;
}

/**
 * Shape types
 */
export type ShapeType = 'rectangle' | 'circle' | 'diamond' | 'hexagon' | 'custom';

/**
 * Layout hints for auto-layout
 */
export interface LayoutHints {
  rank?: number;
  group?: string;
  alignment?: 'left' | 'center' | 'right';
}

/**
 * External references for an element
 */
export interface ElementReferences {
  archimateRef?: string;
  specFile?: string;
  schemaRef?: string;
  apiOperationId?: string;
}

/**
 * Relationship between elements
 */
export interface Relationship {
  id: string;
  type: RelationshipType | string;
  sourceId: string;
  targetId: string;
  properties?: Record<string, unknown>;
  visual?: RelationshipVisual;
}

/**
 * Relationship types (ArchiMate + custom)
 */
export enum RelationshipType {
  // ArchiMate relationships
  Composition = 'composition',
  Aggregation = 'aggregation',
  Assignment = 'assignment',
  Realization = 'realization',
  Serving = 'serving',
  Access = 'access',
  Influence = 'influence',
  Triggering = 'triggering',
  Flow = 'flow',

  // Custom relationships
  Reference = 'reference',
  Navigation = 'navigation',
  SecurityControl = 'security-control',
  DataFlow = 'data-flow',
  StateTransition = 'state-transition'
}

/**
 * Visual properties of a relationship
 */
export interface RelationshipVisual {
  routingPoints?: Point[];
  style?: EdgeStyle;
  label?: string;
}

/**
 * Edge/arrow styling
 */
export interface EdgeStyle {
  color?: string;
  width?: number;
  dashArray?: string;
  arrowStart?: ArrowType;
  arrowEnd?: ArrowType;
}

/**
 * Arrow types
 */
export type ArrowType = 'none' | 'arrow' | 'diamond' | 'circle' | 'square';

/**
 * Cross-layer reference
 */
export interface Reference {
  id: string;
  type: ReferenceType;
  source: ReferenceEndpoint;
  target: ReferenceEndpoint;
  isValid?: boolean;
  validationError?: string;
}

/**
 * Reference endpoint
 */
export interface ReferenceEndpoint {
  elementId?: string;
  layerId?: string;
  property?: string;
  file?: string;
  path?: string;
}

/**
 * Reference types
 */
export enum ReferenceType {
  // Core ArchiMate references
  ArchiMateProperty = 'archimate-property',

  // Business layer references
  BusinessObject = 'business-object',
  BusinessService = 'business-service',
  BusinessInterface = 'business-interface',

  // API layer references
  APIOperation = 'api-operation',

  // Schema references
  SchemaReference = 'schema-reference',

  // UX layer references
  UXAction = 'ux-action',

  // Navigation layer references
  NavigationRoute = 'navigation-route',

  // Security layer references
  SecurityPermission = 'security-permission',
  SecurityResource = 'security-resource',

  // Motivation layer references
  Goal = 'goal',
  Requirement = 'requirement',
  Principle = 'principle',
  Constraint = 'constraint',

  // APM/Observability references
  APMTrace = 'apm-trace',
  APMPerformanceMetrics = 'apm-performance-metrics',
  APMDataQualityMetrics = 'apm-data-quality-metrics',
  APMBusinessMetrics = 'apm-business-metrics',

  // Generic references
  Custom = 'custom'
}

/**
 * Extracted cross-layer reference metadata
 * Used during parsing to capture reference information before resolution
 */
export interface ExtractedReference {
  /** The property name containing the reference */
  propertyName: string;

  /** The reference type */
  referenceType: ReferenceType;

  /** Single UUID reference */
  targetId?: string;

  /** Multiple UUID references */
  targetIds?: string[];

  /** String identifier reference (like operationId, route) */
  targetIdentifier?: string;

  /** Path to target definition */
  targetPath?: string;

  /** Source element ID */
  sourceElementId?: string;

  /** Source layer ID */
  sourceLayerId?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Cross-layer reference metadata for tracking
 * Used to track all references discovered in a model
 */
export interface CrossLayerReferenceMetadata {
  /** Total references found */
  totalReferences: number;

  /** References by type */
  referencesByType: Record<string, number>;

  /** References by source layer */
  referencesBySourceLayer: Record<string, number>;

  /** Unresolved references (targets not found) */
  unresolvedReferences: ExtractedReference[];

  /** Successfully resolved references */
  resolvedReferences: Reference[];
}

/**
 * Model metadata
 */
export interface ModelMetadata {
  author?: string;
  created?: string;
  modified?: string;
  tags?: string[];
  loadedAt?: string;
  layerCount?: number;
  elementCount?: number;
  type?: string;
  parseErrors?: string[];
  crossLayerReferences?: CrossLayerReferenceMetadata;
  [key: string]: unknown;
}

/**
 * Data source types
 */
export type DataSource =
  | { type: 'github'; version?: string }
  | { type: 'local'; files: FileList }
  | { type: 'url'; url: string };

/**
 * GitHub release info
 */
export interface Release {
  id: number;
  tag_name: string;
  name: string;
  assets: ReleaseAsset[];
  created_at: string;
  published_at: string;
}

/**
 * GitHub release asset
 */
export interface ReleaseAsset {
  id: number;
  name: string;
  browser_download_url: string;
  size: number;
}
