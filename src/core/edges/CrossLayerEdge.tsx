/**
 * Cross-Layer Edge Component
 *
 * Renders dashed edges with distinct colors for cross-layer relationships.
 * Includes click-to-navigate functionality, hover tooltips, keyboard accessibility,
 * and WCAG 2.1 AA compliant colors with dashed visual differentiation.
 */

import { memo, useState } from 'react';
import { EdgeProps, BaseEdge, getBezierPath, EdgeLabelRenderer, Edge } from '@xyflow/react';
import { useNavigate } from '@tanstack/react-router';
import { CrossLayerEdgeData } from '../types/reactflow';
import { getLayerColor, getLayerDisplayName } from '../utils/layerColors';
import { useCrossLayerStore } from '../stores/crossLayerStore';

/**
 * CrossLayerEdge Component
 *
 * Renders smooth step paths with dashed lines to indicate cross-layer relationships.
 * Supports click navigation, hover tooltips, keyboard accessibility, and ARIA labels.
 * Colors meet WCAG 2.1 AA contrast requirements (3:1 minimum).
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
  target,
  style = {},
  markerEnd,
  data,
}: EdgeProps<Edge<CrossLayerEdgeData>>) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const pushNavigation = useCrossLayerStore((state) => state.pushNavigation);
  const setLastError = useCrossLayerStore((state) => state.setLastError);

  // Validate required edge data and coordinates
  if (!data || !target) {
    console.warn('[CrossLayerEdge] Missing required edge data:', { id, hasData: !!data, hasTarget: !!target });
    // Return minimal error indicator
    return (
      <g data-testid={`cross-layer-edge-error-${id}`}>
        <circle cx={sourceX} cy={sourceY} r={4} fill="#ef4444" opacity={0.5} />
      </g>
    );
  }

  if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY) || !Number.isFinite(targetX) || !Number.isFinite(targetY)) {
    console.warn('[CrossLayerEdge] Invalid coordinates:', { id, sourceX, sourceY, targetX, targetY });
    return null;
  }

  // Calculate bezier path for cross-layer edges to differentiate from intra-layer straight edges
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  try {
    const pathResult = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    edgePath = pathResult[0];
    labelX = pathResult[1];
    labelY = pathResult[2];
  } catch (error) {
    console.error('[CrossLayerEdge] Failed to calculate path:', { id, error });
    return null;
  }

  const color = data?.targetLayer ? getLayerColor(data.targetLayer) : '#95a5a6';
  const targetLayerDisplayName = data?.targetLayer ? getLayerDisplayName(data.targetLayer) : 'Unknown';

  // Format edge label: "{relationshipType}: {targetElementName}"
  const labelText = data?.relationshipType && data?.targetElementName
    ? `${data.relationshipType}: ${data.targetElementName}`
    : data?.label || data?.relationshipType;

  // Truncate label if exceeds 30 characters
  const truncatedLabel = labelText && labelText.length > 30
    ? `${labelText.slice(0, 27)}...`
    : labelText;

  // Stroke width increases on hover/focus for better visibility
  const strokeWidth = isHovered || isFocused ? 3 : 2;

  // Handle edge click for navigation
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data?.targetLayer || !target) return;

    try {
      // Check for prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Push to navigation history before navigation
      // targetLayer is guaranteed to be a valid LayerType enum value by createCrossLayerEdgeData
      pushNavigation({
        layerId: data.targetLayer,
        elementId: target,
        elementName: data.targetElementName || 'Unknown Element',
        timestamp: Date.now(),
      });

      // Navigate to target layer view with selected element
      await navigate({
        to: `/${data.targetLayer.toLowerCase()}`,
        search: (prev: any) => ({
          ...prev,
          selectedElement: target,
          skipAnimation: prefersReducedMotion,
        }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log error for debugging
      console.error('Failed to navigate via cross-layer edge:', {
        sourceElement: data?.sourceElementName,
        targetElement: data?.targetElementName,
        targetLayer: data?.targetLayer,
        error: errorMessage,
      });

      // Store error for UI to display via error state
      setLastError({
        message: `Failed to navigate to ${data?.targetElementName || 'target'}: ${errorMessage}`,
        timestamp: Date.now(),
        type: 'navigation_failed',
        sourceElement: data?.sourceElementName,
        targetElement: data?.targetElementName,
      });
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any).catch((error) => {
        console.error('Keyboard navigation failed:', error);
      });
    }
  };

  // Accessibility: ARIA label with full details
  const ariaLabel = `Cross-layer link from ${data?.sourceElementName || 'Unknown'} to ${data?.targetElementName || 'Unknown'} in ${targetLayerDisplayName}, relationship type ${data?.relationshipType || 'Unknown'}. Press Enter to navigate.`;

  return (
    <>
      {/* Edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: strokeWidth,
          strokeDasharray: '5,5', // Dashed line for cross-layer (non-color visual differentiation)
          opacity: 0.8,
          cursor: 'pointer',
          transition: isFocused ? 'none' : 'stroke-width 200ms ease-out',
          ...style,
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Focus ring for keyboard accessibility */}
      {isFocused && (
        <BaseEdge
          id={`${id}-focus-ring`}
          path={edgePath}
          style={{
            stroke: '#3b82f6',
            strokeWidth: strokeWidth + 2,
            strokeDasharray: '5,5',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Edge label with tooltip */}
      {truncatedLabel && (
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
            title={labelText}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            tabIndex={-1}
          >
            {truncatedLabel}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Hover tooltip */}
      {isHovered && (
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

      {/* Invisible interactive path for keyboard and click targeting */}
      <path
        d={edgePath}
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
    </>
  );
});

CrossLayerEdge.displayName = 'CrossLayerEdge';
