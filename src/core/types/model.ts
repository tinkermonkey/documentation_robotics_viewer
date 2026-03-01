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
  description?: string;
  order?: number;
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
  /** Spec node identifier from API (e.g. 'motivation.goal'). Used directly as NodeType key. */
  specNodeId?: string;
  name: string;
  description?: string;
  layerId: string;
  properties: Record<string, unknown>;
  visual: ElementVisual;
  relationships?: {
    incoming: string[];
    outgoing: string[];
  };
  detailLevel?: 'minimal' | 'standard' | 'detailed';
  changesetOperation?: 'add' | 'update' | 'delete';
  relationshipBadge?: { count: number; incoming: number; outgoing: number };
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
  textColor?: string;
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
  [key: string]: unknown;
}
