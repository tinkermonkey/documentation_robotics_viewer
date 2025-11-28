import { memo } from 'react';
import { EdgeProps, BaseEdge, useNodes } from '@xyflow/react';
import { calculateElbowPath, pointsToSVGPath, Rectangle } from './pathfinding';

/**
 * Elbow Edge Component with Obstacle Avoidance
 * Creates elbow-style paths that route around nodes
 */
export const ElbowEdge = memo(({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const nodes = useNodes();

  // Get all node rectangles as obstacles (excluding source and target)
  const obstacles: Rectangle[] = nodes
    .filter((node) => node.id !== source && node.id !== target)
    .map((node) => ({
      x: node.position.x,
      y: node.position.y,
      width: node.width || 200,
      height: node.height || 100,
    }));

  // Calculate elbow path with obstacle avoidance
  const pathPoints = calculateElbowPath(
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
    obstacles,
    sourcePosition as 'top' | 'bottom' | 'left' | 'right',
    targetPosition as 'top' | 'bottom' | 'left' | 'right'
  );

  // Convert points to SVG path
  const path = pointsToSVGPath(pathPoints);

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{
        stroke: '#6b7280',
        strokeWidth: 2,
        ...style,
      }}
    />
  );
});

ElbowEdge.displayName = 'ElbowEdge';
