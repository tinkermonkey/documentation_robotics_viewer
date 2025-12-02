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
