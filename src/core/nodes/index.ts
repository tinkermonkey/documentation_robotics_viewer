/**
 * Custom Node Components for React Flow
 * Exports all custom node types and the nodeTypes object for React Flow
 */

import { DataModelNode } from './DataModelNode';
import { JSONSchemaNode } from './JSONSchemaNode';
import { APIEndpointNode } from './APIEndpointNode';
import { BusinessProcessNode } from './BusinessProcessNode';
import { RoleNode } from './RoleNode';
import { PermissionNode } from './PermissionNode';
import { LayerContainerNode } from './LayerContainerNode';
import SchemaElementNode from './SchemaElementNode';
import {
  StakeholderNode,
  GoalNode,
  RequirementNode,
  ConstraintNode,
  DriverNode,
  OutcomeNode,
  PrincipleNode,
  AssumptionNode,
  ValueStreamNode,
  AssessmentNode,
} from './motivation';
import {
  ContainerNode,
  ComponentNode,
  ExternalActorNode,
} from './c4';

// Export all node components
export {
  DataModelNode,
  JSONSchemaNode,
  APIEndpointNode,
  BusinessProcessNode,
  RoleNode,
  PermissionNode,
  LayerContainerNode,
  SchemaElementNode,
  StakeholderNode,
  GoalNode,
  RequirementNode,
  ConstraintNode,
  DriverNode,
  OutcomeNode,
  PrincipleNode,
  AssumptionNode,
  ValueStreamNode,
  AssessmentNode,
  // C4 nodes
  ContainerNode,
  ComponentNode,
  ExternalActorNode,
};

// Node types object for React Flow
// Maps node type strings to their component implementations
export const nodeTypes = {
  dataModel: DataModelNode,
  jsonSchema: JSONSchemaNode,
  apiEndpoint: APIEndpointNode,
  businessProcess: BusinessProcessNode,
  role: RoleNode,
  permission: PermissionNode,
  layerContainer: LayerContainerNode,
  'schema-element': SchemaElementNode,  // For spec view
  stakeholder: StakeholderNode,
  goal: GoalNode,
  requirement: RequirementNode,
  constraint: ConstraintNode,
  driver: DriverNode,
  outcome: OutcomeNode,
  principle: PrincipleNode,
  assumption: AssumptionNode,
  valueStream: ValueStreamNode,
  assessment: AssessmentNode,
  // C4 node types
  c4Container: ContainerNode,
  c4Component: ComponentNode,
  c4ExternalActor: ExternalActorNode,
};
