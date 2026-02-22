/**
 * Custom Edge Components for React Flow
 * Exports all custom edge types and the edgeTypes object for React Flow
 */

import type { EdgeTypes } from '@xyflow/react';

import { ElbowEdge } from './ElbowEdge';
import { BundledCrossLayerEdge } from './BundledCrossLayerEdge';

// Export edge components
export {
  ElbowEdge,
  BundledCrossLayerEdge,
};

// Edge types object for React Flow
// Maps edge type strings to their component implementations
// Note: Built-in types like 'smoothstep', 'step', 'straight', 'default' don't need to be registered here
// They are automatically available when you set type: 'smoothstep' etc. in edge data
// Cast as EdgeTypes to satisfy React Flow's strict type requirements
export const edgeTypes = {
  elbow: ElbowEdge,
  bundledCrossLayer: BundledCrossLayerEdge,
} as EdgeTypes;

// Export pathfinding utilities
export * from './pathfinding';
