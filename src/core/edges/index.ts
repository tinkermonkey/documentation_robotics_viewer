/**
 * Custom Edge Components for React Flow
 * Exports all custom edge types and the edgeTypes object for React Flow
 */

import { ElbowEdge } from './ElbowEdge';

// Export edge components
export { ElbowEdge };

// Edge types object for React Flow
// Maps edge type strings to their component implementations
// Note: Built-in types like 'smoothstep', 'step', 'straight', 'default' don't need to be registered here
// They are automatically available when you set type: 'smoothstep' etc. in edge data
export const edgeTypes = {
  elbow: ElbowEdge,
};

// Export pathfinding utilities
export * from './pathfinding';
