/**
 * Business Layer Layout Engines
 */

export { HierarchicalBusinessLayout } from './HierarchicalBusinessLayout';
export { SwimlaneBusinessLayout } from './SwimlaneBusinessLayout';
export { MatrixBusinessLayout } from './MatrixBusinessLayout';
export { ForceDirectedBusinessLayout } from './ForceDirectedBusinessLayout';
export { BusinessLayoutEngine, LayoutOptions, LayoutResult, DEFAULT_LAYOUT_OPTIONS } from './types';
export type { SwimlaneGroupBy, SwimlaneOrientation, SwimlaneLayoutOptions } from './SwimlaneBusinessLayout';

import { HierarchicalBusinessLayout } from './HierarchicalBusinessLayout';
import { SwimlaneBusinessLayout } from './SwimlaneBusinessLayout';
import { MatrixBusinessLayout } from './MatrixBusinessLayout';
import { ForceDirectedBusinessLayout } from './ForceDirectedBusinessLayout';
import { BusinessLayoutEngine } from './types';

/**
 * Layout factory function to get the correct layout engine based on algorithm selection
 */
export function getLayoutEngine(
  algorithm: 'hierarchical' | 'swimlane' | 'matrix' | 'force' | 'manual'
): BusinessLayoutEngine {
  switch (algorithm) {
    case 'hierarchical':
      return new HierarchicalBusinessLayout();
    case 'swimlane':
      return new SwimlaneBusinessLayout();
    case 'matrix':
      return new MatrixBusinessLayout();
    case 'force':
      return new ForceDirectedBusinessLayout();
    case 'manual':
      throw new Error('Manual layout does not use a layout engine');
    default:
      return new HierarchicalBusinessLayout();
  }
}
