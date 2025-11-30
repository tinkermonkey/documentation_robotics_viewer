import { memo } from 'react';
import { EdgeProps, BaseEdge, useNodes, useEdges, EdgeLabelRenderer } from '@xyflow/react';
import { calculateElbowPath, pointsToSVGPath, Rectangle } from '../pathfinding';

/**
 * Conflicts Edge Component
 * Zigzag/wavy line for conflict relationships in motivation layer
 * Visual distinction: Red color, zigzag pattern to indicate tension/conflict
 */
export const ConflictsEdge = memo(({
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

  // Get obstacles (all nodes except source, target, and layer containers)
  const obstacles: Rectangle[] = nodes
    .filter((node) =>
      node.id !== source &&
      node.id !== target &&
      node.type !== 'layerContainer'
    )
    .map((node) => ({
      x: node.position.x,
      y: node.position.y,
      width: node.measured?.width || (node as any).width || 200,
      height: node.measured?.height || (node as any).height || 100,
    }));

  // Calculate elbow path
  const pathPoints = calculateElbowPath(
    { x: adjustedSourceX, y: adjustedSourceY, position: sourcePosition || 'right' },
    { x: adjustedTargetX, y: adjustedTargetY, position: targetPosition || 'left' },
    obstacles
  );

  // Convert to SVG path
  const pathString = pointsToSVGPath(pathPoints);

  // Changeset operation styling
  let strokeColor = '#ef4444'; // red for conflicts
  let opacity = 1;
  if (data?.changesetOperation === 'add') {
    strokeColor = '#10b981'; // green
  } else if (data?.changesetOperation === 'delete') {
    opacity = 0.5;
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={pathString}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: 2.5,
          opacity,
          // Zigzag pattern using stroke-dasharray
          strokeDasharray: '6 4',
        }}
        markerEnd={markerEnd}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(adjustedSourceX + adjustedTargetX) / 2}px, ${(adjustedSourceY + adjustedTargetY) / 2}px)`,
              pointerEvents: 'all',
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: 'white',
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${strokeColor}`,
              color: strokeColor,
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

ConflictsEdge.displayName = 'ConflictsEdge';
