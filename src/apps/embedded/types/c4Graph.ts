/**
 * C4 Graph Types
 *
 * Type definitions for C4 model visualization graph.
 * This intermediate representation decouples C4 parsing logic from ReactFlow rendering.
 *
 * The C4 model provides four levels of abstraction:
 * 1. System Context - Shows the system and its external dependencies
 * 2. Container - Shows the high-level technical building blocks
 * 3. Component - Shows the components within a container
 * 4. Code - Shows code-level structure (optional, not currently implemented)
 */

import { ModelElement, Relationship } from '../../../core/types';

/**
 * C4 abstraction types
 */
export enum C4Type {
  System = 'system',
  Container = 'container',
  Component = 'component',
  External = 'external',
  Deployment = 'deployment',
}

/**
 * Container types for classification
 */
export enum ContainerType {
  WebApp = 'webApp',
  MobileApp = 'mobileApp',
  DesktopApp = 'desktopApp',
  Api = 'api',
  Database = 'database',
  MessageQueue = 'messageQueue',
  Cache = 'cache',
  FileStorage = 'fileStorage',
  Service = 'service',
  Function = 'function',
  Custom = 'custom',
}

/**
 * Protocol types for container communication
 */
export enum ProtocolType {
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
  REST = 'REST',
  GraphQL = 'GraphQL',
  gRPC = 'gRPC',
  WebSocket = 'WebSocket',
  AMQP = 'AMQP',
  Kafka = 'Kafka',
  MQTT = 'MQTT',
  JDBC = 'JDBC',
  ODBC = 'ODBC',
  Redis = 'Redis',
  Custom = 'Custom',
}

/**
 * Communication direction
 */
export enum CommunicationDirection {
  Sync = 'sync',
  Async = 'async',
  Bidirectional = 'bidirectional',
}

/**
 * C4 graph node representing a system, container, component, or external actor
 */
export interface C4Node {
  /** Unique identifier (from source element) */
  id: string;

  /** C4 abstraction type */
  c4Type: C4Type;

  /** Display name */
  name: string;

  /** Detailed description */
  description: string;

  /** Technology stack (e.g., ["React", "TypeScript", "Node.js"]) */
  technology: string[];

  /** Original DR model element */
  sourceElement: ModelElement;

  /** Changeset status if from changeset */
  changesetStatus?: 'new' | 'modified' | 'deleted';

  /** Container type classification (for containers only) */
  containerType?: ContainerType;

  /** Brief responsibility description */
  responsibleFor?: string;

  /** Whether this is an internal (within system boundary) or external element */
  boundary: 'internal' | 'external';

  /** Container ID if this is a component */
  parentContainerId?: string;

  /** Additional metadata */
  metadata?: {
    /** Number of API endpoints exposed (for containers) */
    apiEndpointCount?: number;

    /** Number of components (for containers) */
    componentCount?: number;

    /** Deployment environment (e.g., "AWS", "Azure", "On-Premise") */
    deploymentEnvironment?: string;

    /** Programming language/framework */
    primaryLanguage?: string;

    /** Whether this element is external to the system */
    isExternal?: boolean;
  };
}

/**
 * C4 graph edge representing communication between elements
 */
export interface C4Edge {
  /** Unique edge identifier */
  id: string;

  /** Source node ID */
  sourceId: string;

  /** Target node ID */
  targetId: string;

  /** Communication protocol */
  protocol: ProtocolType;

  /** Communication direction */
  direction: CommunicationDirection;

  /** Human-readable description (e.g., "Creates user records") */
  description: string;

  /** HTTP method if applicable */
  method?: string;

  /** API path if applicable */
  path?: string;

  /** Original DR relationship */
  relationship: Relationship;

  /** Changeset status if from changeset */
  changesetStatus?: 'new' | 'modified' | 'deleted';

  /** Whether this is a deployment relationship */
  isDeploymentRelation?: boolean;

  /** Data format (e.g., "JSON", "XML", "Protobuf") */
  dataFormat?: string;
}

/**
 * C4 hierarchy representing containment relationships
 */
export interface C4Hierarchy {
  /** Container IDs within the system boundary */
  systemBoundary: string[];

  /** Map of container ID to array of component IDs */
  containers: Map<string, string[]>;

  /** External actor IDs (systems/users outside boundary) */
  externalActors: string[];

  /** Map tracking parent-child relationships */
  parentChildMap: Map<string, string>; // childId -> parentId
}

/**
 * Indexes for O(1) filtering operations
 */
export interface C4GraphIndexes {
  /** Index by C4 type */
  byType: Map<C4Type, Set<string>>;

  /** Index by technology (e.g., "React" -> Set of node IDs) */
  byTechnology: Map<string, Set<string>>;

  /** Index by container type */
  byContainerType: Map<ContainerType, Set<string>>;

  /** Map of container ID to component IDs */
  containerComponents: Map<string, Set<string>>;

  /** Map of component ID to container ID */
  componentContainer: Map<string, string>;

  /** Map of node IDs that have outgoing edges */
  nodesWithOutgoingEdges: Set<string>;

  /** Map of node IDs that have incoming edges */
  nodesWithIncomingEdges: Set<string>;
}

/**
 * C4 graph metadata
 */
export interface C4GraphMetadata {
  /** Count of elements by C4 type */
  elementCounts: Record<C4Type, number>;

  /** Count of containers by type */
  containerTypeCounts: Record<ContainerType, number>;

  /** Technologies used in the system */
  technologies: string[];

  /** Maximum depth of component hierarchy */
  maxComponentDepth: number;

  /** Parse warnings */
  warnings: string[];

  /** Validation errors */
  validationErrors: string[];

  /** Whether the graph contains cycles */
  hasCycles: boolean;

  /** Performance metrics */
  performance?: {
    parseTimeMs: number;
    elementCount: number;
  };
}

/**
 * Complete C4 graph representation
 */
export interface C4Graph {
  /** Graph nodes indexed by element ID */
  nodes: Map<string, C4Node>;

  /** Graph edges indexed by edge ID */
  edges: Map<string, C4Edge>;

  /** Hierarchy information */
  hierarchy: C4Hierarchy;

  /** Deployment mapping (container ID -> deployment node ID) */
  deploymentMap: Map<string, string>;

  /** Pre-built indexes for efficient filtering */
  indexes: C4GraphIndexes;

  /** Graph metadata and statistics */
  metadata: C4GraphMetadata;
}

/**
 * Options for C4 graph builder
 */
export interface C4GraphBuilderOptions {
  /** Include external systems in the graph */
  includeExternal?: boolean;

  /** Include deployment information */
  includeDeployment?: boolean;

  /** Validate graph structure (detect cycles, orphans) */
  validateStructure?: boolean;

  /** Maximum component depth to extract */
  maxComponentDepth?: number;

  /** Technology stack inference from dependencies */
  inferTechnology?: boolean;
}

/**
 * Container detection rule result
 */
export interface ContainerDetectionResult {
  /** Whether the element is a container */
  isContainer: boolean;

  /** Container type classification */
  containerType?: ContainerType;

  /** Confidence score (0-1) */
  confidence: number;

  /** Reasoning for classification */
  reason: string;
}

/**
 * Component extraction result
 */
export interface ComponentExtractionResult {
  /** Extracted components */
  components: C4Node[];

  /** Parent container ID */
  parentContainerId: string;

  /** Warnings during extraction */
  warnings: string[];
}

/**
 * Validation result for C4 graph
 */
export interface C4ValidationResult {
  /** Whether the graph is valid */
  isValid: boolean;

  /** Validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: string[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error type */
  type: 'cycle' | 'orphan' | 'missing-reference' | 'invalid-hierarchy' | 'duplicate-id';

  /** Error message */
  message: string;

  /** Affected node/edge IDs */
  affectedIds: string[];

  /** Severity */
  severity: 'error' | 'warning';
}

/**
 * Technology stack extraction result
 */
export interface TechnologyStackResult {
  /** Extracted technology names */
  technologies: string[];

  /** Source of technology information */
  source: 'explicit' | 'inferred' | 'mixed';

  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * C4 view levels for drill-down navigation
 */
export type C4ViewLevel = 'context' | 'container' | 'component' | 'code';

/**
 * C4 layout algorithm options
 */
export type C4LayoutAlgorithm = 'hierarchical' | 'orthogonal' | 'force' | 'manual';

/**
 * Path highlighting mode for dependency tracing
 */
export type C4PathHighlightingMode = 'upstream' | 'downstream' | 'between' | 'none';

/**
 * Semantic zoom detail level
 */
export type C4NodeDetailLevel = 'minimal' | 'medium' | 'full';

/**
 * Filter options for C4 view
 */
export interface C4FilterOptions {
  /** Filter by container types (e.g., "database", "webApp") */
  containerTypes?: Set<ContainerType>;

  /** Filter by technology stack (e.g., "React", "PostgreSQL") */
  technologyStack?: Set<string>;

  /** Show deployment overlay nodes */
  showDeployment?: boolean;
}

/**
 * Focus+context configuration
 */
export interface C4FocusContext {
  /** Enable focus+context visualization */
  enabled: boolean;

  /** Focused node ID - shown at full detail, others dimmed */
  focusedNodeId?: string;

  /** Opacity for non-focused nodes (default: 0.3) */
  dimmedOpacity?: number;
}

/**
 * Path highlighting configuration for dependency tracing
 */
export interface C4PathHighlighting {
  /** Path highlighting mode */
  mode: C4PathHighlightingMode;

  /** Source node ID for path tracing */
  sourceId?: string;

  /** Target node ID for 'between' mode */
  targetId?: string;

  /** Highlighted node IDs from path tracing */
  highlightedNodeIds?: Set<string>;

  /** Highlighted edge IDs from path tracing */
  highlightedEdgeIds?: Set<string>;
}

/**
 * Semantic zoom configuration
 */
export interface C4SemanticZoom {
  /** Enable semantic zoom */
  enabled: boolean;

  /** Current ReactFlow viewport scale */
  currentScale: number;
}

/**
 * Transformer options for converting C4Graph to ReactFlow
 */
export interface C4TransformerOptions {
  /** C4 view level for drill-down navigation */
  viewLevel: C4ViewLevel;

  /** Selected container ID for drill-down to container view */
  selectedContainerId?: string;

  /** Selected component ID for drill-down to code view */
  selectedComponentId?: string;

  /** Layout algorithm to use */
  layoutAlgorithm: C4LayoutAlgorithm;

  /** Filter options for view customization */
  filterOptions: C4FilterOptions;

  /** Focus+context visualization settings */
  focusContext?: C4FocusContext;

  /** Path highlighting configuration */
  pathHighlighting?: C4PathHighlighting;

  /** Semantic zoom configuration */
  semanticZoom: C4SemanticZoom;

  /** Existing node positions for manual layout restoration */
  existingPositions?: Map<string, { x: number; y: number }>;

  /** Canvas dimensions */
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * Default transformer options
 */
export const DEFAULT_C4_TRANSFORMER_OPTIONS: C4TransformerOptions = {
  viewLevel: 'context',
  layoutAlgorithm: 'hierarchical',
  filterOptions: {},
  semanticZoom: {
    enabled: true,
    currentScale: 1.0,
  },
  canvasWidth: 1200,
  canvasHeight: 800,
};

/**
 * C4 transform result containing ReactFlow nodes and edges
 */
export interface C4TransformResult {
  /** ReactFlow nodes */
  nodes: any[]; // Node[] from @xyflow/react

  /** ReactFlow edges */
  edges: any[]; // Edge[] from @xyflow/react

  /** Computed layout bounds */
  bounds: {
    width: number;
    height: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };

  /** Breadcrumb path for navigation */
  breadcrumb: C4BreadcrumbSegment[];

  /** Visible node count (after filtering) */
  visibleNodeCount: number;

  /** Visible edge count (after filtering) */
  visibleEdgeCount: number;
}

/**
 * Breadcrumb segment for hierarchical navigation
 */
export interface C4BreadcrumbSegment {
  /** C4 view level */
  level: C4ViewLevel;

  /** Display label */
  label: string;

  /** Node ID (undefined for root context) */
  nodeId?: string;
}

/**
 * Layout options for C4-specific layout algorithms
 */
export interface C4LayoutOptions {
  /** Canvas width */
  width?: number;

  /** Canvas height */
  height?: number;

  /** Padding around the layout */
  padding?: number;

  /** Horizontal spacing between nodes */
  nodeSep?: number;

  /** Vertical spacing between ranks/levels */
  rankSep?: number;

  /** Layout direction: 'TB' (top-bottom), 'LR' (left-right) */
  rankDir?: 'TB' | 'LR' | 'BT' | 'RL';

  /** Force-directed iterations */
  iterations?: number;

  /** Link distance for force layout */
  linkDistance?: number;

  /** Charge strength for force layout */
  chargeStrength?: number;
}

/**
 * Default C4 layout options optimized for architectural diagrams
 */
export const DEFAULT_C4_LAYOUT_OPTIONS: C4LayoutOptions = {
  width: 1200,
  height: 800,
  padding: 50,
  nodeSep: 120, // Wider horizontal spacing for larger C4 nodes
  rankSep: 150, // Taller vertical spacing for readability
  rankDir: 'TB',
  iterations: 150,
  linkDistance: 250,
  chargeStrength: -600,
};
