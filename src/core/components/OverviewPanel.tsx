/**
 * OverviewPanel Component
 * Wraps the React Flow MiniMap widget in a labeled panel with Flowbite design system styling
 * Matches design.png reference with border, shadow, rounded corners, and dark mode support
 */

import { Panel, MiniMap as ReactFlowMiniMap, Node } from '@xyflow/react';

/**
 * Type-safe node data interface for layer-based coloring
 */
export interface NodeWithLayerData extends Node {
  data: {
    layer?: string;
    fill?: string;
    [key: string]: any;
  };
}

interface OverviewPanelProps {
  /** Optional color mapping function for nodes */
  nodeColor?: (node: NodeWithLayerData) => string;
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
          <ReactFlowMiniMap
            nodeColor={nodeColor}
            nodeStrokeColor="#fff"
            nodeBorderRadius={4}
            maskColor="rgb(240, 240, 240, 0.6)"
            maskStrokeWidth={2}
            style={{
              backgroundColor: 'transparent',
              height: '120px',
            }}
            pannable
            zoomable
          />
        </div>
      </div>
    </Panel>
  );
}
