import { memo } from 'react';
import { EdgeProps, BaseEdge, useNodes, useEdges, EdgeLabelRenderer } from '@xyflow/react';
import { calculateElbowPath, pointsToSVGPath, Rectangle } from '../pathfinding';

/**
 * Realizes Edge Component
 * Dotted blue line for realization relationships in motivation layer
 */
export const RealizesEdge = memo(({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  targetHandleId,
  style = {},
  markerEnd,
  label,
  data,
}: EdgeProps) => {
  const nodes = useNodes();
  const edges = useEdges();

  // Calculate spacing for multiple edges
  let adjustedSourceX = sourceX;
  let adjustedSourceY = sourceY;
  let adjustedTargetX = targetX;
  let adjustedTargetY = targetY;

  const spacing = 10;

  // Adjust source position if no specific handle
  if (!sourceHandleId) {
    const sourceEdges = edges.filter(
      (e) => e.source === source && !e.sourceHandle
    ).sort((a, b) => a.id.localeCompare(b.id));

    const index = sourceEdges.findIndex((e) => e.id === id);
    if (index !== -1 && sourceEdges.length > 1) {
      const offset = (index - (sourceEdges.length - 1) / 2) * spacing;
      if (sourcePosition === 'top' || sourcePosition === 'bottom') {
        adjustedSourceX += offset;
      } else {
        adjustedSourceY += offset;
      }
    }
  }

  // Adjust target position if no specific handle
  if (!targetHandleId) {
    const targetEdges = edges.filter(
      (e) => e.target === target && !e.targetHandle
    ).sort((a, b) => a.id.localeCompare(b.id));

    const index = targetEdges.findIndex((e) => e.id === id);
    if (index !== -1 && targetEdges.length > 1) {
      const offset = (index - (targetEdges.length - 1) / 2) * spacing;
      if (targetPosition === 'top' || targetPosition === 'bottom') {
        adjustedTargetX += offset;
      } else {
        adjustedTargetY += offset;
      }
    }
  }

  // Get obstacles
  const obstacles: Rectangle[] = nodes
    .filter((node) =>
      node.id !== source &&
      node.id !== target &&
      node.type !== 'layerContainer'
    )
    .map((node) => ({
      x: node.position.x,
      y: node.position.y,
      width: node.measured?.width ?? node.width ?? 200,
      height: node.measured?.height ?? node.height ?? 100,
    }));

  // Calculate elbow path
  const pathPoints = calculateElbowPath(
    { x: adjustedSourceX, y: adjustedSourceY },
    { x: adjustedTargetX, y: adjustedTargetY },
    obstacles,
    sourcePosition as 'top' | 'bottom' | 'left' | 'right',
    targetPosition as 'top' | 'bottom' | 'left' | 'right'
  );

  // Convert to SVG path
  const path = pointsToSVGPath(pathPoints);

  // Calculate label position
  let labelX = 0;
  let labelY = 0;
  if (pathPoints.length > 1) {
    const midIndex = Math.floor((pathPoints.length - 1) / 2);
    const p1 = pathPoints[midIndex];
    const p2 = pathPoints[midIndex + 1];
    labelX = (p1.x + p2.x) / 2;
    labelY = (p1.y + p2.y) / 2;
  }

  // Style for realizes edge - dotted, blue
  let strokeColor = '#2563eb'; // Blue for realizes
  let strokeWidth = 2;
  let strokeDasharray = '2,4'; // Dotted pattern

  if (data?.changesetOperation) {
    switch (data.changesetOperation) {
      case 'add':
        strokeColor = '#10b981';
        break;
      case 'update':
        strokeColor = '#f59e0b';
        break;
      case 'delete':
        strokeColor = '#ef4444';
        strokeDasharray = '5,5';
        break;
    }
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
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
              color: strokeColor,
              border: `1px solid ${strokeColor}`,
              pointerEvents: 'all',
              zIndex: 10,
            }}
            className="nodrag nopan"
          >
            {label || 'realizes'}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

RealizesEdge.displayName = 'RealizesEdge';
