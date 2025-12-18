/**
 * OverviewPanel Component
 * Wraps the React Flow MiniMap widget in a labeled panel with Flowbite design system styling
 * Matches design.png reference with border, shadow, rounded corners, and dark mode support
 */

import { Panel } from '@xyflow/react';
import { Node } from '@xyflow/react';
import { MiniMap } from './MiniMap';

interface OverviewPanelProps {
  /** Optional color mapping function for nodes */
  nodeColor?: (node: Node) => string;
}

/**
 * OverviewPanel - Styled container for MiniMap with "Overview" header
 * Positioned in bottom-right corner using React Flow's Panel component
 */
export function OverviewPanel({ nodeColor }: OverviewPanelProps) {
  return (
    <Panel position="bottom-right" className="m-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200
                   dark:border-gray-700 shadow-sm overflow-hidden"
        data-testid="overview-panel"
      >
        <div
          className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400
                     border-b border-gray-200 dark:border-gray-700 bg-gray-50
                     dark:bg-gray-900"
        >
          Overview
        </div>
        <div className="p-2">
          <MiniMap
            nodeColor={nodeColor}
            height={120}
          />
        </div>
      </div>
    </Panel>
  );
}
