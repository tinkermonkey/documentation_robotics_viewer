/**
 * Custom Node Components for React Flow
 * Exports all custom node types and the nodeTypes object for React Flow
 */

import type { NodeTypes } from '@xyflow/react';

import { LayerContainerNode } from './LayerContainerNode';
// Motivation layer nodes are now using UnifiedNode
// Original node components kept for backwards compatibility in exports
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
  NodeBadge,
  DetailLevel,
  ChangesetOperation,
  FieldItem,
  RelationshipBadgeData,
  RelationshipBadgeProps,
} from './components';

// Export all node components
export {
  LayerContainerNode,
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
  unified: UnifiedNode,
  layerContainer: LayerContainerNode,
  // Schema node types
  jsonSchema: JSONSchemaNode,
  // C4 node types
  c4Container: ContainerNode,
  c4Component: ComponentNode,
  c4ExternalActor: ExternalActorNode,
} as NodeTypes;
