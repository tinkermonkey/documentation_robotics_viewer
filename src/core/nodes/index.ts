/**
 * Custom Node Components for React Flow
 * Exports all custom node types and the nodeTypes object for React Flow
 */

import { DataModelNode } from './DataModelNode';
import { JSONSchemaNode } from './JSONSchemaNode';
import { APIEndpointNode } from './APIEndpointNode';
import {
  BusinessProcessNode,
  BUSINESS_PROCESS_NODE_WIDTH,
  BUSINESS_PROCESS_NODE_HEIGHT,
} from './BusinessProcessNode';
import {
  BusinessFunctionNode,
  BusinessServiceNode,
  BusinessCapabilityNode,
  BUSINESS_FUNCTION_NODE_WIDTH,
  BUSINESS_FUNCTION_NODE_HEIGHT,
  BUSINESS_SERVICE_NODE_WIDTH,
  BUSINESS_SERVICE_NODE_HEIGHT,
  BUSINESS_CAPABILITY_NODE_WIDTH,
  BUSINESS_CAPABILITY_NODE_HEIGHT,
} from './business';
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

// Export all node components
export {
  DataModelNode,
  JSONSchemaNode,
  APIEndpointNode,
  BusinessProcessNode,
  BUSINESS_PROCESS_NODE_WIDTH,
  BUSINESS_PROCESS_NODE_HEIGHT,
  BusinessFunctionNode,
  BUSINESS_FUNCTION_NODE_WIDTH,
  BUSINESS_FUNCTION_NODE_HEIGHT,
  BusinessServiceNode,
  BUSINESS_SERVICE_NODE_WIDTH,
  BUSINESS_SERVICE_NODE_HEIGHT,
  BusinessCapabilityNode,
  BUSINESS_CAPABILITY_NODE_WIDTH,
  BUSINESS_CAPABILITY_NODE_HEIGHT,
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
};

// Node types object for React Flow
// Maps node type strings to their component implementations
export const nodeTypes = {
  dataModel: DataModelNode,
  jsonSchema: JSONSchemaNode,
  apiEndpoint: APIEndpointNode,
  businessProcess: BusinessProcessNode,
  businessFunction: BusinessFunctionNode,
  businessService: BusinessServiceNode,
  businessCapability: BusinessCapabilityNode,
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
};
