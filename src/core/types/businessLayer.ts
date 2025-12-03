/**
 * Business Layer Types
 *
 * Type definitions for business layer parser infrastructure.
 * Defines the intermediate data structures used for business layer visualization.
 */

/**
 * Business node types
 */
export type BusinessNodeType = 'function' | 'process' | 'service' | 'capability';

/**
 * Business edge relationship types
 */
export type BusinessEdgeType =
  | 'realizes'
  | 'supports'
  | 'flows_to'
  | 'depends_on'
  | 'serves'
  | 'composes'
  | 'aggregates';

/**
 * Business node metadata
 */
export interface BusinessNodeMetadata {
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
  subprocessCount?: number;
  stepCount?: number;
}

/**
 * Business node in the intermediate graph structure
 */
export interface BusinessNode {
  id: string;
  type: BusinessNodeType;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
  metadata: BusinessNodeMetadata;
  hierarchyLevel: number;
  parentId?: string;
  childIds: string[];
  dimensions?: { width: number; height: number };
}

/**
 * Business edge in the intermediate graph structure
 */
export interface BusinessEdge {
  id: string;
  source: string;
  target: string;
  type: BusinessEdgeType;
  label?: string;
  properties?: Record<string, unknown>;
}

/**
 * Cross-layer link information
 */
export interface CrossLayerLink {
  source: string;
  target: string;
  sourceLayer: 'business';
  targetLayer: 'motivation' | 'application' | 'data_model' | 'security' | 'api' | 'ux';
  type: string;
  properties?: Record<string, unknown>;
}

/**
 * Hierarchy information for business processes
 */
export interface HierarchyInfo {
  maxDepth: number;
  rootNodes: string[];
  leafNodes: string[];
  nodesByLevel: Map<number, Set<string>>;
  parentChildMap: Map<string, string[]>;
  childParentMap: Map<string, string>;
}

/**
 * Graph metrics for analytics
 */
export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  averageConnectivity: number;
  maxHierarchyDepth: number;
  circularDependencies: CircularDependency[];
  orphanedNodes: string[];
  criticalNodes: string[];
}

/**
 * Circular dependency detection result
 */
export interface CircularDependency {
  cycle: string[];
  type: string;
}

/**
 * Filter indices for fast querying
 */
export interface BusinessGraphIndices {
  byType: Map<BusinessNodeType, Set<string>>;
  byDomain: Map<string, Set<string>>;
  byLifecycle: Map<string, Set<string>>;
  byCriticality: Map<string, Set<string>>;
}

/**
 * Complete business graph intermediate structure
 */
export interface BusinessGraph {
  nodes: Map<string, BusinessNode>;
  edges: Map<string, BusinessEdge>;
  hierarchy: HierarchyInfo;
  metrics: GraphMetrics;
  crossLayerLinks: CrossLayerLink[];
  indices: BusinessGraphIndices;
}

/**
 * Validation result for business layer data
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Business element from model (before graph construction)
 */
export interface BusinessElement {
  id: string;
  type: string;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
  relationships: BusinessRelationship[];
}

/**
 * Business relationship from model
 */
export interface BusinessRelationship {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  properties?: Record<string, unknown>;
}

/**
 * Business layer data extracted from model
 */
export interface BusinessLayerData {
  elements: BusinessElement[];
  relationships: BusinessRelationship[];
  metadata: {
    elementCount: number;
    relationshipCount: number;
    elementsByType: Record<string, number>;
  };
}
