import { Node, Edge } from '@xyflow/react';
import { ModelElement } from './model';
import {
  DataModelField,
  DataModelComponentType,
  HTTPMethod
} from './shapes';
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
 * Business Process node data
 */
export interface BusinessProcessNodeData extends BaseNodeData {
  // Additional business process specific properties if needed
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
  // Can add custom data for edges if needed
}

/**
 * Motivation edge data
 */
export interface MotivationEdgeData {
  relationshipType: 'influence' | 'constrains' | 'realizes' | 'refines' | 'conflicts' | 'custom';
  label?: string;
  weight?: number;
  changesetOperation?: 'add' | 'update' | 'delete';
}

/**
 * Union type for all custom edge types
 */
export type AppEdge =
  | Edge<ElbowEdgeData, 'elbow'>
  | Edge<MotivationEdgeData, 'influence'>
  | Edge<MotivationEdgeData, 'constrains'>
  | Edge<MotivationEdgeData, 'realizes'>
  | Edge<MotivationEdgeData, 'refines'>
  | Edge<undefined, 'default'>
  | Edge<undefined, 'smoothstep'>;

/**
 * Result from node transformation
 */
export interface NodeTransformResult {
  nodes: AppNode[];
  edges: AppEdge[];
}
