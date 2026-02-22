import { memo } from 'react';
import { EdgeProps, BaseEdge, useNodes, useEdges, EdgeLabelRenderer } from '@xyflow/react';
import { getControlPoints, pointsToSVGPath, Rectangle, Point } from './pathfinding';
import { EdgeControllers } from './EdgeControllers';
import { ElbowEdgeData } from '../types/reactflow';

/**
 * Elbow Edge Component with A* obstacle avoidance and interactive waypoints.
 *
 * - Routes around nodes using A* pathfinding with rounded corners.
 * - When selected, displays draggable waypoint handles.
 * - When edge.data.waypoints is set (by dragging handles), uses those points directly.
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
  selected,
  data,
}: EdgeProps<ElbowEdgeData>) => {
  const nodes = useNodes();
  const edges = useEdges();

  let adjustedSourceX = sourceX;
  let adjustedSourceY = sourceY;
  let adjustedTargetX = targetX;
  let adjustedTargetY = targetY;

  const spacing = 10;

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

  // If user has stored custom waypoints, use them directly (skip A* re-calculation)
  let pathPoints: Point[];
  const storedWaypoints = data?.waypoints;
  if (storedWaypoints && storedWaypoints.length > 0) {
    pathPoints = [
      { x: adjustedSourceX, y: adjustedSourceY },
      ...storedWaypoints,
      { x: adjustedTargetX, y: adjustedTargetY },
    ];
  } else {
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

    const sourceNode = nodes.find((n) => n.id === source);
    const targetNode = nodes.find((n) => n.id === target);
    const sourceRect: Rectangle | undefined = sourceNode
      ? { x: sourceNode.position.x, y: sourceNode.position.y, width: sourceNode.measured?.width ?? sourceNode.width ?? 200, height: sourceNode.measured?.height ?? sourceNode.height ?? 100 }
      : undefined;
    const targetRect: Rectangle | undefined = targetNode
      ? { x: targetNode.position.x, y: targetNode.position.y, width: targetNode.measured?.width ?? targetNode.width ?? 200, height: targetNode.measured?.height ?? targetNode.height ?? 100 }
      : undefined;

    pathPoints = getControlPoints({
      sourceX: adjustedSourceX,
      sourceY: adjustedSourceY,
      targetX: adjustedTargetX,
      targetY: adjustedTargetY,
      sourcePosition: sourcePosition as string,
      targetPosition: targetPosition as string,
      obstacles,
      sourceRect,
      targetRect,
    });
  }

  const path = pointsToSVGPath(pathPoints);

  let labelX = 0;
  let labelY = 0;
  if (pathPoints.length > 1) {
    const midIndex = Math.floor((pathPoints.length - 1) / 2);
    const p1 = pathPoints[midIndex];
    const p2 = pathPoints[midIndex + 1];
    labelX = (p1.x + p2.x) / 2;
    labelY = (p1.y + p2.y) / 2;
  }

  const ariaLabel = label
    ? `Connection labeled ${label} from node ${source} to node ${target}`
    : `Connection from node ${source} to node ${target}`;

  // Intermediate waypoints (exclude start and end) used for control handles
  const intermediateWaypoints = pathPoints.slice(1, -1);

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
        aria-label={ariaLabel}
        role="img"
      />
      {selected && intermediateWaypoints.length > 0 && (
        <EdgeControllers edgeId={id} waypoints={intermediateWaypoints} />
      )}
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
