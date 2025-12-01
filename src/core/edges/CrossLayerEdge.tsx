/**
 * Cross-Layer Edge Component
 *
 * Renders dashed edges with distinct colors for cross-layer relationships.
 * Shows visual distinction between business → motivation, application, data model links.
 */

import { memo } from 'react';
import { EdgeProps, BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';

/**
 * Cross-layer edge data
 */
export interface CrossLayerEdgeData {
  targetLayer: 'motivation' | 'application' | 'data_model' | 'security' | 'api' | 'ux';
  relationshipType: string;
  label?: string;
}

/**
 * Get color for target layer
 */
function getLayerColor(targetLayer: string): string {
  switch (targetLayer) {
    case 'motivation':
      return '#9b59b6'; // Purple for motivation
    case 'application':
      return '#3498db'; // Blue for application
    case 'data_model':
      return '#2ecc71'; // Green for data model
    case 'security':
      return '#e74c3c'; // Red for security
    case 'api':
      return '#f39c12'; // Orange for API
    case 'ux':
      return '#1abc9c'; // Teal for UX
    default:
      return '#95a5a6'; // Gray for unknown
  }
}

/**
 * CrossLayerEdge Component
 *
 * Renders smooth step paths with dashed lines to indicate cross-layer relationships
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
