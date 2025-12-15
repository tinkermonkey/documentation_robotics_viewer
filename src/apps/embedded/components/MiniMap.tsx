/**
 * MiniMap Component
 * Overview map for graph views using React Flow's MiniMap
 * Displays a miniature version of the graph for quick navigation
 */

import { memo } from 'react';
import { MiniMap as ReactFlowMiniMap } from '@xyflow/react';

export interface MiniMapProps {
  /** Node color function - maps node type to color */
  nodeColor?: (node: any) => string;
  /** Node stroke color */
  nodeStrokeColor?: string;
  /** Node border radius */
  nodeBorderRadius?: number;
  /** Mask color */
  maskColor?: string;
  /** Show mask strokeWidth */
  maskStrokeWidth?: number;
  /** Height of minimap */
  height?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Default node color function
 * Maps layer types to their respective colors
 */
const defaultNodeColor = (node: any): string => {
  const nodeType = node.type || 'default';

  // Layer-based color mapping
  const colorMap: Record<string, string> = {
    // Motivation layer
    stakeholder: '#9333ea',
    driver: '#a855f7',
    assessment: '#c084fc',
    goal: '#d8b4fe',
    outcome: '#e9d5ff',
    principle: '#f3e8ff',

    // Business layer
    actor: '#3b82f6',
    role: '#60a5fa',
    collaboration: '#93c5fd',
    interface: '#bfdbfe',
    process: '#dbeafe',
    function: '#eff6ff',
    interaction: '#3b82f6',
    event: '#60a5fa',
    service: '#93c5fd',
    object: '#bfdbfe',
    contract: '#dbeafe',
    representation: '#eff6ff',
    product: '#3b82f6',

    // Application layer
    applicationComponent: '#10b981',
    applicationInterface: '#34d399',
    applicationFunction: '#6ee7b7',
    applicationInteraction: '#a7f3d0',
    applicationProcess: '#d1fae5',
    applicationEvent: '#ecfdf5',
    applicationService: '#10b981',
    dataObject: '#34d399',

    // Technology layer
    node: '#f59e0b',
    device: '#fbbf24',
    systemSoftware: '#fcd34d',
    technologyCollaboration: '#fde68a',
    technologyInterface: '#fef3c7',
    path: '#fffbeb',
    communicationNetwork: '#f59e0b',
    technologyFunction: '#fbbf24',
    technologyProcess: '#fcd34d',
    technologyInteraction: '#fde68a',
    technologyEvent: '#fef3c7',
    technologyService: '#fffbeb',
    artifact: '#f59e0b',

    // Architecture layer (C4)
    person: '#6366f1',
    softwareSystem: '#8b5cf6',
    container: '#a78bfa',
    component: '#c4b5fd',

    // Default fallback
    default: '#94a3b8',
  };

  return colorMap[nodeType] || colorMap.default;
};

export const MiniMap = memo(
  ({
    nodeColor = defaultNodeColor,
    nodeStrokeColor = '#fff',
    nodeBorderRadius = 4,
    maskColor = 'rgb(240, 240, 240, 0.6)',
    maskStrokeWidth = 2,
    height = 150,
    className = '',
  }: MiniMapProps) => {
    return (
      <div
        className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ${className}`}
        style={{ height: `${height}px` }}
        data-testid="minimap-container"
      >
        <ReactFlowMiniMap
          nodeColor={nodeColor}
          nodeStrokeColor={nodeStrokeColor}
          nodeBorderRadius={nodeBorderRadius}
          maskColor={maskColor}
          maskStrokeWidth={maskStrokeWidth}
          style={{
            backgroundColor: 'transparent',
          }}
          pannable
          zoomable
        />
      </div>
    );
  }
);

MiniMap.displayName = 'MiniMap';
