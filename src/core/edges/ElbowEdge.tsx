import { memo } from 'react';
import { EdgeProps, BaseEdge, useNodes, useEdges, EdgeLabelRenderer } from '@xyflow/react';
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
  sourceHandleId,
  targetHandleId,
  style = {},
  markerEnd,
  label,
  labelStyle,

}: EdgeProps) => {
  const nodes = useNodes();
  const edges = useEdges();

  // Calculate spacing for multiple edges entering/leaving the same node side
  // Only apply spacing if not using a specific handle (like fields)
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

  // Get all node rectangles as obstacles (excluding source, target, and layer containers)
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

  // Calculate elbow path with obstacle avoidance
  const pathPoints = calculateElbowPath(
    { x: adjustedSourceX, y: adjustedSourceY },
    { x: adjustedTargetX, y: adjustedTargetY },
    obstacles,
    sourcePosition as 'top' | 'bottom' | 'left' | 'right',
    targetPosition as 'top' | 'bottom' | 'left' | 'right'
  );

  // Convert points to SVG path
  const path = pointsToSVGPath(pathPoints);

  // Calculate label position (midpoint of the middle segment)
  let labelX = 0;
  let labelY = 0;
  if (pathPoints.length > 1) {
    // Find the longest segment or the middle segment
    const midIndex = Math.floor((pathPoints.length - 1) / 2);
    const p1 = pathPoints[midIndex];
    const p2 = pathPoints[midIndex + 1];
    labelX = (p1.x + p2.x) / 2;
    labelY = (p1.y + p2.y) / 2;
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: '#6b7280',
          strokeWidth: 2,
          ...style,
        }}
        className="react-flow__edge-path" 
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
              color: '#555',
              border: '1px solid #e5e7eb',
              pointerEvents: 'all',
              zIndex: 10,
              ...labelStyle,
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

ElbowEdge.displayName = 'ElbowEdge';
