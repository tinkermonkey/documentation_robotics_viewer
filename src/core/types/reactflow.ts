import { Node, Edge } from '@xyflow/react';
import { ModelElement, ReferenceType } from './model';
import {
  DataModelField,
  DataModelComponentType,
  HTTPMethod
} from './shapes';
import { LayerType } from './layers';

export type { HTTPMethod };
import { NodeDetailLevel } from '../../core/layout/semanticZoomController';
import { CoverageStatus } from '../../apps/embedded/services/coverageAnalyzer';

/**
 * Relationship badge data (shown when node is dimmed)
 */
export interface RelationshipBadge {
  count: number;
  incoming: number;
  outgoing: number;
}

/**
 * Coverage indicator data for goals
 */
export interface CoverageIndicator {
  status: CoverageStatus;
  requirementCount: number;
  constraintCount: number;
}

/**
 * Base node data shared by all custom nodes
 */
export interface BaseNodeData {
  label: string;
  elementId: string;
  layerId: string;
  fill: string;
  stroke: string;
  modelElement?: ModelElement;

  // Semantic zoom and focus
  opacity?: number;
  strokeWidth?: number;
  detailLevel?: NodeDetailLevel;
  relationshipBadge?: RelationshipBadge;

  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

/**
 * Data Model node data
 */
export interface DataModelNodeData extends BaseNodeData {
  fields: DataModelField[];
  componentType: DataModelComponentType;
}

/**
 * JSONSchema node data
 */
export interface JSONSchemaNodeData extends BaseNodeData {
  schemaElementId: string;
  expanded?: boolean;
  properties?: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}

/**
 * API Endpoint node data
 */
export interface APIEndpointNodeData extends BaseNodeData {
  path: string;
  method: HTTPMethod;
  operationId?: string;
}

/**
 * Subprocess information for expanded nodes
 */
export interface Subprocess {
  id: string;
  name: string;
  description?: string;
}

/**
 * Business Process node data
 */
export interface BusinessProcessNodeData extends BaseNodeData {
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
  subprocessCount?: number;
  stepCount?: number;
  hierarchyLevel?: number;
  subprocesses?: Subprocess[];
}

/**
 * Business Function node data
 */
export interface BusinessFunctionNodeData extends BaseNodeData {
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
}

/**
 * Business Service node data
 */
export interface BusinessServiceNodeData extends BaseNodeData {
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
}

/**
 * Business Capability node data
 */
export interface BusinessCapabilityNodeData extends BaseNodeData {
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
}

/**
 * Role node data
 */
export interface RoleNodeData extends BaseNodeData {
  level?: number;
  inheritsFrom?: string[];
}

/**
 * Permission node data
 */
export interface PermissionNodeData extends BaseNodeData {
  scope: 'global' | 'resource' | 'attribute';
  resource?: string;
  action?: string;
}

/**
 * Layer Container node data
 */
export interface LayerContainerNodeData extends BaseNodeData {
  layerType: string;
  color: string;
}

/**
 * Stakeholder node data (Motivation layer)
 */
export interface StakeholderNodeData extends BaseNodeData {
  stakeholderType?: string; // e.g., "internal", "external", "customer"
  interests?: string[];
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Goal node data (Motivation layer)
 */
export interface GoalNodeData extends BaseNodeData {
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  changesetOperation?: 'add' | 'update' | 'delete';
  coverageIndicator?: CoverageIndicator;
}

/**
 * Requirement node data (Motivation layer)
 */
export interface RequirementNodeData extends BaseNodeData {
  requirementType?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Constraint node data (Motivation layer)
 */
export interface ConstraintNodeData extends BaseNodeData {
  negotiability?: 'fixed' | 'negotiable';
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Driver node data (Motivation layer)
 */
export interface DriverNodeData extends BaseNodeData {
  category?: 'business' | 'technical' | 'regulatory' | 'market';
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Outcome node data (Motivation layer)
 */
export interface OutcomeNodeData extends BaseNodeData {
  achievementStatus?: 'planned' | 'in-progress' | 'achieved' | 'at-risk';
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Principle node data (Motivation layer)
 */
export interface PrincipleNodeData extends BaseNodeData {
  scope?: 'enterprise' | 'domain' | 'application';
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Assumption node data (Motivation layer)
 */
export interface AssumptionNodeData extends BaseNodeData {
  validationStatus?: 'validated' | 'unvalidated' | 'invalidated';
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * ValueStream node data (Motivation layer)
 */
export interface ValueStreamNodeData extends BaseNodeData {
  stageCount?: number;
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Assessment node data (Motivation layer)
 */
export interface AssessmentNodeData extends BaseNodeData {
  rating?: number; // 0-5
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * C4 Container node data
 * Represents a deployable unit (application, service, database, etc.)
 */
export interface C4ContainerNodeData extends BaseNodeData {
  containerType?: 'webApp' | 'mobileApp' | 'service' | 'database' | 'queue' | 'filesystem' | 'other';
  technology?: string[]; // Technology stack (e.g., ["React", "TypeScript"])
  description?: string;
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * C4 Component node data
 * Represents a component within a container
 */
export interface C4ComponentNodeData extends BaseNodeData {
  role?: string; // Architectural role (e.g., "Controller", "Service", "Repository")
  technology?: string[]; // Technology stack
  description?: string;
  interfaces?: string[]; // Exposed interfaces
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * C4 External Actor node data
 * Represents an external system or user
 */
export interface C4ExternalActorNodeData extends BaseNodeData {
  actorType?: 'user' | 'system' | 'service';
  description?: string;
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Union type for all custom node types
 */
export type AppNode =
  | Node<DataModelNodeData, 'dataModel'>
  | Node<JSONSchemaNodeData, 'jsonSchema'>
  | Node<APIEndpointNodeData, 'apiEndpoint'>
  | Node<BusinessProcessNodeData, 'businessProcess'>
  | Node<BusinessFunctionNodeData, 'businessFunction'>
  | Node<BusinessServiceNodeData, 'businessService'>
  | Node<BusinessCapabilityNodeData, 'businessCapability'>
  | Node<RoleNodeData, 'role'>
  | Node<PermissionNodeData, 'permission'>
  | Node<LayerContainerNodeData, 'layerContainer'>
  | Node<StakeholderNodeData, 'stakeholder'>
  | Node<GoalNodeData, 'goal'>
  | Node<RequirementNodeData, 'requirement'>
  | Node<ConstraintNodeData, 'constraint'>
  | Node<DriverNodeData, 'driver'>
  | Node<OutcomeNodeData, 'outcome'>
  | Node<PrincipleNodeData, 'principle'>
  | Node<AssumptionNodeData, 'assumption'>
  | Node<ValueStreamNodeData, 'valueStream'>
  | Node<AssessmentNodeData, 'assessment'>
  | Node<C4ContainerNodeData, 'c4Container'>
  | Node<C4ComponentNodeData, 'c4Component'>
  | Node<C4ExternalActorNodeData, 'c4ExternalActor'>;

/**
 * Edge data for custom edges
 */
export interface ElbowEdgeData {
  /** User-defined intermediate waypoints that override A* routing. */
  waypoints?: Array<{ x: number; y: number }>;
  [key: string]: unknown;
}

/**
 * Motivation edge data
 */
export interface MotivationEdgeData {
  relationshipType: 'influence' | 'constrains' | 'realizes' | 'refines' | 'conflicts' | 'custom';
  label?: string;
  weight?: number;
  changesetOperation?: 'add' | 'update' | 'delete';
  [key: string]: unknown;
}

/**
 * Cross-layer edge data
 * Enforces type safety using enums for layer and relationship types
 */
export interface CrossLayerEdgeData {
  sourceLayer: LayerType;
  targetLayer: LayerType;
  relationshipType: ReferenceType;
  sourceElementName?: string;
  targetElementName?: string;
  label?: string;
  // Optional metadata for enhanced tooltips
  description?: string;
  tags?: string[];
  changesetOperation?: 'add' | 'update' | 'delete';
  [key: string]: unknown;
}

/**
 * Factory function to create and validate cross-layer edge data
 * Enforces the invariant that edges must span different layers
 * @throws Error if sourceLayer equals targetLayer
 */
export function createCrossLayerEdgeData(
  sourceLayer: LayerType,
  targetLayer: LayerType,
  relationshipType: ReferenceType,
  options?: {
    sourceElementName?: string;
    targetElementName?: string;
    label?: string;
    description?: string;
    tags?: string[];
    changesetOperation?: 'add' | 'update' | 'delete';
  }
): CrossLayerEdgeData {
  if (sourceLayer === targetLayer) {
    throw new Error(
      `Cross-layer edge must span different layers. Got source=${sourceLayer}, target=${targetLayer}`
    );
  }

  return {
    sourceLayer,
    targetLayer,
    relationshipType,
    ...options,
  };
}

/**
 * Union type for all custom edge types
 */
export type AppEdge =
  | Edge<ElbowEdgeData, 'elbow'>
  | Edge<CrossLayerEdgeData, 'crossLayer'>
  | Edge<MotivationEdgeData, 'influence'>
  | Edge<MotivationEdgeData, 'constrains'>
  | Edge<MotivationEdgeData, 'realizes'>
  | Edge<MotivationEdgeData, 'refines'>
  | Edge<Record<string, unknown>, 'default'>
  | Edge<Record<string, unknown>, 'smoothstep'>;

/**
 * Result from node transformation
 */
export interface NodeTransformResult {
  nodes: AppNode[];
  edges: AppEdge[];
}
