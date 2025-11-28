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
 * Union type for all custom node types
 */
export type AppNode =
  | Node<DataModelNodeData, 'dataModel'>
  | Node<JSONSchemaNodeData, 'jsonSchema'>
  | Node<APIEndpointNodeData, 'apiEndpoint'>
  | Node<BusinessProcessNodeData, 'businessProcess'>
  | Node<RoleNodeData, 'role'>
  | Node<PermissionNodeData, 'permission'>
  | Node<LayerContainerNodeData, 'layerContainer'>;

/**
 * Edge data for custom edges
 */
export interface ElbowEdgeData {
  // Can add custom data for edges if needed
}

/**
 * Union type for all custom edge types
 */
export type AppEdge =
  | Edge<ElbowEdgeData, 'elbow'>
  | Edge<undefined, 'default'>
  | Edge<undefined, 'smoothstep'>;

/**
 * Result from node transformation
 */
export interface NodeTransformResult {
  nodes: AppNode[];
  edges: AppEdge[];
}
