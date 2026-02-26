/**
 * MiniMap Component
 * Overview map for graph views using React Flow's MiniMap
 * Displays a miniature version of the graph for quick navigation
 */

import React, { memo } from 'react';
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
  /** Mask stroke color (viewport indicator border) */
  maskStrokeColor?: string;
  /** Show mask strokeWidth */
  maskStrokeWidth?: number;
  /** Custom class name */
  className?: string;
}


export const MiniMap: React.FC<MiniMapProps> = memo(
  ({
    nodeColor,
    nodeStrokeColor = '#fff',
    nodeBorderRadius = 4,
    maskColor = 'rgb(240, 240, 240, 0.6)',
    maskStrokeColor = '#3b82f6',
    maskStrokeWidth = 2,
    className = '',
  }: MiniMapProps) => {
    // Build props object conditionally to avoid passing undefined nodeColor
    const miniMapProps: any = {
      nodeStrokeColor,
      nodeBorderRadius,
      maskColor,
      maskStrokeColor,
      maskStrokeWidth,
      className,
      pannable: true,
      zoomable: true,
      'data-testid': 'minimap-container',
    };

    // Only add nodeColor if explicitly provided
    if (nodeColor) {
      miniMapProps.nodeColor = nodeColor;
    }

    return <ReactFlowMiniMap {...miniMapProps} />;
  }
);

MiniMap.displayName = 'MiniMap';
