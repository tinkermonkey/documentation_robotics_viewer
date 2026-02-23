/**
 * Custom Node Components for React Flow
 * Exports all custom node types and the nodeTypes object for React Flow
 */

import type { NodeTypes } from '@xyflow/react';

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
import { LayerContainerNode } from './LayerContainerNode';
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
import {
  JSONSchemaNode,
  JSON_SCHEMA_NODE_WIDTH,
  JSON_SCHEMA_NODE_MIN_HEIGHT,
} from './JSONSchemaNode';
import { NodeType, isValidNodeType } from './NodeType';
import { nodeConfigLoader } from './nodeConfigLoader';
import type { NodeConfig, NodeStyleConfig, NodeDimensions, NodeColors, ChangesetColors } from './nodeConfig.types';
import {
  UnifiedNode,
  FieldList,
  FieldTooltip,
  RelationshipBadge,
} from './components';
import type {
  UnifiedNodeData,
  UnifiedNodeType,
  NodeBadge,
  DetailLevel,
  ChangesetOperation,
  FieldItem,
  RelationshipBadgeData,
  RelationshipBadgeProps,
} from './components';

// Export all node components
export {
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
  LayerContainerNode,
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
  // Schema nodes
  JSONSchemaNode,
  JSON_SCHEMA_NODE_WIDTH,
  JSON_SCHEMA_NODE_MIN_HEIGHT,
  // Unified node components
  UnifiedNode,
  FieldList,
  FieldTooltip,
  RelationshipBadge,
  // Configuration infrastructure
  NodeType,
  isValidNodeType,
  nodeConfigLoader,
};

// Export types for configuration and unified node
export type {
  NodeConfig,
  NodeStyleConfig,
  NodeDimensions,
  NodeColors,
  ChangesetColors,
  UnifiedNodeData,
  UnifiedNodeType,
  NodeBadge,
  DetailLevel,
  ChangesetOperation,
  FieldItem,
  RelationshipBadgeData,
  RelationshipBadgeProps,
};

// Node types object for React Flow
// Maps node type strings to their component implementations
// Cast as NodeTypes to satisfy React Flow's strict type requirements (components accept subset of Node props)
export const nodeTypes = {
  businessProcess: BusinessProcessNode,
  businessFunction: BusinessFunctionNode,
  businessService: BusinessServiceNode,
  businessCapability: BusinessCapabilityNode,
  layerContainer: LayerContainerNode,
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
  // Schema node types
  jsonSchema: JSONSchemaNode,
  // C4 node types
  c4Container: ContainerNode,
  c4Component: ComponentNode,
  c4ExternalActor: ExternalActorNode,
} as NodeTypes;
