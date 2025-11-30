import { Node, Edge } from '@xyflow/react';
import { ModelElement } from './model';
import {
  DataModelField,
  DataModelComponentType,
  HTTPMethod
} from './shapes';

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
  | Node<AssessmentNodeData, 'assessment'>;

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
