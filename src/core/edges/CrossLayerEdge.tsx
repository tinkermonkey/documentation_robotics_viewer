/**
 * Cross-Layer Edge Component
 *
 * Renders dashed edges with distinct colors for cross-layer relationships.
 * Shows visual distinction between business → motivation, application, data model links.
 */

import { memo } from 'react';
import { EdgeProps, BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { CrossLayerEdgeData } from '../types/reactflow';
import { getLayerColor } from '../utils/layerColors';

/**
 * CrossLayerEdge Component
 *
 * Renders smooth step paths with dashed lines to indicate cross-layer relationships.
 * Uses distinct colors per target layer for visual clarity.
 *
 * @param props - React Flow edge props with CrossLayerEdgeData
 * @returns JSX element representing the cross-layer edge
 */
export const CrossLayerEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<CrossLayerEdgeData>) => {
  // Calculate smooth step path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const color = data?.targetLayer ? getLayerColor(data.targetLayer) : '#95a5a6';
  const label = data?.label || data?.relationshipType;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: 2,
          strokeDasharray: '5,5', // Dashed line for cross-layer
          opacity: 0.8,
          ...style,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#ffffff',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 500,
              color: color,
              border: `1px solid ${color}`,
              pointerEvents: 'all',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CrossLayerEdge.displayName = 'CrossLayerEdge';
