/**
 * Bundled Cross-Layer Edge Component
 *
 * Renders bundled cross-layer edges with click-to-expand functionality.
 * Shows a badge with the count of bundled edges. Clicking expands to show individual edges.
 * Clicking outside collapsed the bundle back to its initial state.
 */

import { memo, useState } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, Edge } from '@xyflow/react';
import { CrossLayerEdgeData } from '../types/reactflow';
import { getLayerColor } from '../utils/layerColors';

interface BundledEdgeData extends CrossLayerEdgeData {
  bundledEdgeIds: string[];
  bundleCount: number;
  originalEdges?: Edge[];
}

/**
 * BundledCrossLayerEdge Component
 *
 * Renders a single bundled edge representing multiple parallel cross-layer relationships.
 * Features:
 * - Click to expand and see individual edges with slight vertical offset
 * - Badge showing the count of bundled edges
 * - Bezier curve path for visual differentiation from straight intra-layer edges
 * - Click outside to collapse back to bundle
 *
 * @param props - React Flow edge props with BundledEdgeData
 * @returns JSX element representing the bundled cross-layer edge
 */
export const BundledCrossLayerEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}: EdgeProps<Edge<BundledEdgeData>>) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate bezier path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color = data?.targetLayer ? getLayerColor(data.targetLayer) : '#95a5a6';
  const bundleCount = data?.bundleCount || 1;

  const handleBundleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleCollapseBgClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  if (isExpanded) {
    return (
      <g onClick={handleCollapseBgClick} data-testid={`bundled-edge-expanded-${id}`}>
        {/* Render individual edges with slight vertical offset */}
        {data?.originalEdges?.map((edge, index) => {
          const offset = (index - (bundleCount - 1) / 2) * 8;
          const adjustedSourceY = sourceY + offset;
          const adjustedTargetY = targetY + offset;

          const [expandedPath] = getBezierPath({
            sourceX,
            sourceY: adjustedSourceY,
            sourcePosition,
            targetX,
            targetY: adjustedTargetY,
            targetPosition,
          });

          return (
            <path
              key={edge.id}
              d={expandedPath}
              stroke={color}
              strokeWidth={1.5}
              fill="none"
              opacity={0.6}
              className="react-flow__edge-path"
              strokeDasharray="5,5"
              data-testid={`expanded-edge-${edge.id}`}
              onClick={(e) => e.stopPropagation()}
            />
          );
        })}
      </g>
    );
  }

  return (
    <>
      {/* Bundled edge path */}
      <path
        id={id}
        d={edgePath}
        stroke={color}
        strokeWidth={3}
        fill="none"
        strokeDasharray="5 5"
        opacity={0.8}
        style={{
          cursor: 'pointer',
          transition: 'stroke-width 200ms ease-out',
          ...style,
        }}
        onClick={handleBundleClick}
        data-testid={`bundled-edge-${id}`}
        markerEnd={markerEnd}
      />

      {/* Bundle count badge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#2563eb',
            color: '#ffffff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'all',
            zIndex: 10,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          className="nodrag nopan"
          onClick={handleBundleClick}
          title={`${bundleCount} linked relationships`}
          data-testid={`bundle-badge-${id}`}
        >
          {bundleCount}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

BundledCrossLayerEdge.displayName = 'BundledCrossLayerEdge';
