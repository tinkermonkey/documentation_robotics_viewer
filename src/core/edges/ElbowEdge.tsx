import { memo, useState } from 'react';
import { EdgeProps, BaseEdge, useNodes, useEdges, EdgeLabelRenderer, Edge } from '@xyflow/react';
import { useNavigate } from '@tanstack/react-router';
import { getControlPoints, pointsToSVGPath, Rectangle, Point } from './pathfinding';
import { EdgeControllers } from './EdgeControllers';
import { ElbowEdgeData } from '../types/reactflow';
import { getLayerColor, getLayerDisplayName } from '../utils/layerColors';
import { useCrossLayerStore } from '../stores/crossLayerStore';

/**
 * Elbow Edge Component with A* obstacle avoidance and interactive waypoints.
 *
 * - Routes around nodes using A* pathfinding with rounded corners.
 * - When selected, displays draggable waypoint handles.
 * - When edge.data.waypoints is set (by dragging handles), uses those points directly.
 * - When edge.data.targetLayer is set, acts as a navigable cross-layer edge with
 *   hover tooltips, focus ring, and click/keyboard navigation.
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
}: EdgeProps<Edge<ElbowEdgeData, 'elbow'>>) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const pushNavigation = useCrossLayerStore((state) => state.pushNavigation);
  const setLastError = useCrossLayerStore((state) => state.setLastError);
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

  // Cross-layer mode: activated when targetLayer is present in data
  const isCrossLayer = !!data?.targetLayer;
  const targetLayerDisplayName = isCrossLayer ? getLayerDisplayName(data!.targetLayer!) : undefined;

  // Style resolution: cross-layer overrides color/dash; then data overrides; then defaults
  const strokeColor = isCrossLayer
    ? getLayerColor(data!.targetLayer!)
    : (data?.color ?? '#6b7280');
  const strokeDasharray = isCrossLayer ? '5,5' : (data?.strokeDasharray ?? undefined);
  const strokeWidth = isHovered || isFocused ? 3 : 2;

  // Navigation handler — only active for cross-layer edges
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCrossLayer || !data?.targetLayer || !target) return;

    try {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      pushNavigation({
        layerId: data.targetLayer,
        elementId: target,
        elementName: data.targetElementName || 'Unknown Element',
        timestamp: Date.now(),
      });
      await navigate({
        to: `/${data.targetLayer.toLowerCase()}`,
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          selectedElement: target,
          skipAnimation: prefersReducedMotion,
        }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to navigate via cross-layer edge:', {
        sourceElement: data?.sourceElementName,
        targetElement: data?.targetElementName,
        targetLayer: data?.targetLayer,
        error: errorMessage,
      });
      setLastError({
        message: `Failed to navigate to ${data?.targetElementName || 'target'}: ${errorMessage}`,
        timestamp: Date.now(),
        type: 'navigation_failed',
        sourceElement: data?.sourceElementName,
        targetElement: data?.targetElementName,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent).catch((error) => {
        console.error('Keyboard navigation failed:', error);
      });
    }
  };

  const ariaLabel = isCrossLayer
    ? `Cross-layer link from ${data?.sourceElementName || 'Unknown'} to ${data?.targetElementName || 'Unknown'} in ${targetLayerDisplayName}, relationship type ${data?.relationshipType || 'Unknown'}. Press Enter to navigate.`
    : (label
        ? `Connection labeled ${label} from node ${source} to node ${target}`
        : `Connection from node ${source} to node ${target}`);

  // Intermediate waypoints (exclude start and end) used for control handles
  const intermediateWaypoints = pathPoints.slice(1, -1);

  // Format cross-layer tooltip label
  const crossLayerLabel = isCrossLayer
    ? (data?.relationshipType && data?.targetElementName
        ? `${data.relationshipType}: ${data.targetElementName}`
        : (data?.label || data?.relationshipType))
    : undefined;

  const truncatedCrossLayerLabel = crossLayerLabel && crossLayerLabel.length > 30
    ? `${crossLayerLabel.slice(0, 27)}...`
    : crossLayerLabel;

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
          opacity: isCrossLayer ? 0.8 : undefined,
          cursor: isCrossLayer ? 'pointer' : undefined,
          transition: isFocused ? 'none' : (isCrossLayer ? 'stroke-width 200ms ease-out' : undefined),
          ...style,
        }}
        className="react-flow__edge-path"
        aria-label={ariaLabel}
        role={isCrossLayer ? 'button' : 'img'}
        onClick={isCrossLayer ? handleClick : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Focus ring for keyboard accessibility (cross-layer only) */}
      {isFocused && isCrossLayer && (
        <BaseEdge
          id={`${id}-focus-ring`}
          path={path}
          style={{
            stroke: '#3b82f6',
            strokeWidth: strokeWidth + 2,
            strokeDasharray: '5,5',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
      )}

      {selected && intermediateWaypoints.length > 0 && (
        <EdgeControllers edgeId={id} waypoints={intermediateWaypoints} />
      )}

      {/* Cross-layer edge label */}
      {isCrossLayer && truncatedCrossLayerLabel && (
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
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
            title={crossLayerLabel}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            tabIndex={-1}
          >
            {truncatedCrossLayerLabel}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Standard edge label (non-cross-layer) */}
      {!isCrossLayer && label && (
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
              ...labelStyle,
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Hover tooltip (cross-layer only) */}
      {isHovered && isCrossLayer && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, calc(-100% - 10px)) translate(${labelX}px,${labelY}px)`,
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 12,
              zIndex: 20,
              pointerEvents: 'none',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              maxWidth: 280,
            }}
            className="nodrag nopan"
          >
            <div className="font-semibold text-gray-900 mb-2">
              {data?.relationshipType || 'Relationship'}
            </div>
            <div className="text-gray-700 space-y-1 text-xs">
              <div><strong>From:</strong> {data?.sourceElementName || 'Unknown'}</div>
              <div><strong>To:</strong> {data?.targetElementName || 'Unknown'}</div>
              <div><strong>Target Layer:</strong> {targetLayerDisplayName}</div>
              {data?.label && <div><strong>Details:</strong> {data.label}</div>}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Invisible wide hit-target for keyboard focus and click (cross-layer only) */}
      {isCrossLayer && (
        <path
          d={path}
          stroke="transparent"
          strokeWidth={8}
          fill="none"
          style={{
            cursor: 'pointer',
            pointerEvents: 'stroke',
          }}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={ariaLabel}
          data-testid={`cross-layer-edge-${id}`}
        />
      )}
    </>
  );
});

ElbowEdge.displayName = 'ElbowEdge';
