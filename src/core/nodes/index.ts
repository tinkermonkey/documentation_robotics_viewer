/**
 * Custom Node Components for React Flow
 * Exports all custom node types and the nodeTypes object for React Flow
 */

import type { NodeTypes } from '@xyflow/react';

import { LayerContainerNode } from './LayerContainerNode';
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
import {
  useChangesetStyling,
  useNodeHandles,
} from './hooks';
import type { HandleConfig } from './hooks';

// Export all node components
export {
  LayerContainerNode,
  // Unified node components
  UnifiedNode,
  FieldList,
  FieldTooltip,
  RelationshipBadge,
  // Configuration infrastructure
  NodeType,
  isValidNodeType,
  nodeConfigLoader,
  // Node hooks
  useChangesetStyling,
  useNodeHandles,
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
  HandleConfig,
};

// Node types object for React Flow
// Maps node type strings to their component implementations
// Cast as NodeTypes to satisfy React Flow's strict type requirements (components accept subset of Node props)
export const nodeTypes = {
  unified: UnifiedNode,
  layerContainer: LayerContainerNode,
} as NodeTypes;
