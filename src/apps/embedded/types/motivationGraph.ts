/**
 * Motivation Graph Types
 *
 * Type definitions for the motivation layer visualization graph model.
 * This intermediate representation decouples business logic from ReactFlow rendering.
 */

import { ModelElement, Relationship } from '../../../core/types';

/**
 * Motivation element types (ArchiMate Motivation Extension)
 */
export enum MotivationElementType {
  Stakeholder = 'stakeholder',
  Driver = 'driver',
  Assessment = 'assessment',
  Goal = 'goal',
  Outcome = 'outcome',
  Principle = 'principle',
  Requirement = 'requirement',
  Constraint = 'constraint',
  Meaning = 'meaning',
  Value = 'value',
  Assumption = 'assumption',
  ValueStream = 'valueStream'
}

/**
 * Motivation relationship types
 */
export enum MotivationRelationshipType {
  // Core ArchiMate motivation relationships
  Influence = 'influence',
  Constrains = 'constrains',
  Realizes = 'realizes',
  Refines = 'refines',

  // Additional semantic relationships
  Conflicts = 'conflicts',
  Motivates = 'motivates',
  SupportsGoals = 'supports_goals',
  FulfillsRequirements = 'fulfills_requirements',
  ConstrainedBy = 'constrained_by',
  HasInterest = 'has_interest',

  // Generic
  Custom = 'custom'
}

/**
 * Relationship direction for influence analysis
 */
export enum RelationshipDirection {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
  Bidirectional = 'bidirectional'
}

/**
 * Motivation graph node with computed metrics
 */
export interface MotivationGraphNode {
  /** Original model element */
  element: ModelElement;

  /** Computed graph metrics */
  metrics: NodeMetrics;

  /** Adjacency information for efficient traversal */
  adjacency: {
    incoming: string[]; // Node IDs
    outgoing: string[]; // Node IDs
  };

  /** Changeset operation if from changeset */
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Node metrics computed from graph analysis
 */
export interface NodeMetrics {
  /** Degree centrality (total connections) */
  degreeCentrality: number;

  /** In-degree (incoming connections) */
  inDegree: number;

  /** Out-degree (outgoing connections) */
  outDegree: number;

  /** Maximum depth of influence chains from this node */
  influenceDepth: number;

  /** Maximum depth of influence chains to this node */
  influenceHeight: number;

  /** Betweenness centrality (0-1, how often node appears on shortest paths) */
  betweennessCentrality?: number;

  /** Clustering coefficient (0-1, how connected neighbors are) */
  clusteringCoefficient?: number;
}

/**
 * Motivation graph edge with relationship metadata
 */
export interface MotivationGraphEdge {
  /** Unique edge identifier */
  id: string;

  /** Source node ID */
  sourceId: string;

  /** Target node ID */
  targetId: string;

  /** Relationship type */
  type: MotivationRelationshipType;

  /** Original relationship data */
  relationship: Relationship;

  /** Relationship direction */
  direction: RelationshipDirection;

  /** Weight/strength of relationship (0-1) */
  weight?: number;

  /** Changeset operation if from changeset */
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Influence path between two nodes
 */
export interface InfluencePath {
  /** Path identifier */
  id: string;

  /** Source node ID */
  sourceId: string;

  /** Target node ID */
  targetId: string;

  /** Node IDs in path order */
  path: string[];

  /** Edge IDs in path order */
  edges: string[];

  /** Path length (number of hops) */
  length: number;

  /** Path type */
  pathType: 'direct' | 'indirect' | 'cyclic';

  /** Whether this is the shortest path (for highlighting differently) */
  isShortestPath?: boolean;
}

/**
 * Conflict detection result
 */
export interface ConflictDetection {
  /** Conflicting node IDs */
  nodes: string[];

  /** Conflict type */
  type: 'goal-conflict' | 'constraint-violation' | 'requirement-incompatibility';

  /** Conflict description */
  description: string;

  /** Severity */
  severity: 'low' | 'medium' | 'high';
}

/**
 * Motivation graph metadata
 */
export interface MotivationGraphMetadata {
  /** Element counts by type */
  elementCounts: Record<MotivationElementType, number>;

  /** Relationship counts by type */
  relationshipCounts: Record<MotivationRelationshipType, number>;

  /** Maximum influence depth in graph */
  maxInfluenceDepth: number;

  /** Average clustering coefficient */
  averageClustering?: number;

  /** Detected conflicts */
  conflicts: ConflictDetection[];

  /** Graph density (0-1, actual edges / possible edges) */
  density: number;

  /** Number of connected components */
  connectedComponents?: number;

  /** Parse warnings */
  warnings: string[];
}

/**
 * Complete motivation graph representation
 */
export interface MotivationGraph {
  /** Graph nodes indexed by element ID */
  nodes: Map<string, MotivationGraphNode>;

  /** Graph edges indexed by edge ID */
  edges: Map<string, MotivationGraphEdge>;

  /** Computed graph metadata */
  metadata: MotivationGraphMetadata;

  /** Adjacency lists for O(1) neighbor lookup */
  adjacencyLists: {
    outgoing: Map<string, Set<string>>; // nodeId -> Set of target nodeIds
    incoming: Map<string, Set<string>>; // nodeId -> Set of source nodeIds
  };

  /** Influence paths cache */
  influencePaths?: Map<string, InfluencePath[]>; // "sourceId:targetId" -> paths
}

/**
 * Graph builder options
 */
export interface MotivationGraphBuilderOptions {
  /** Calculate expensive metrics (betweenness, clustering) */
  calculateAdvancedMetrics?: boolean;

  /** Detect conflicts between goals/requirements */
  detectConflicts?: boolean;

  /** Compute influence paths */
  computeInfluencePaths?: boolean;

  /** Maximum path length for influence analysis */
  maxPathLength?: number;
}
