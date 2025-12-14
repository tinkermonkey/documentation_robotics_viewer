import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { RelationshipBadge } from './RelationshipBadge';
import { AssumptionNodeData } from '../../types/reactflow';

/**
 * AssumptionNode - Represents assumptions in the motivation layer
 *
 * Visual Design:
 * - Question mark icon to indicate uncertainty
 * - Validation status badge (validated/unvalidated/invalidated)
 * - Dashed border to represent tentative nature
 * - Changeset operation styling support
 * - Accessibility: Full ARIA labeling for screen readers
 */
export const AssumptionNode = React.memo(({ data, selected }: NodeProps<Node<AssumptionNodeData>>) => {
  const { label, fill = '#e0e7ff', stroke = '#6366f1', validationStatus = 'unvalidated', changesetOperation } = data;

  // Changeset styling
  let borderColor = stroke;
  let opacity = data.opacity !== undefined ? data.opacity : 1;
  if (changesetOperation === 'add') {
    borderColor = '#10b981'; // green
  } else if (changesetOperation === 'update') {
    borderColor = '#f59e0b'; // amber
  } else if (changesetOperation === 'delete') {
    borderColor = '#ef4444'; // red
    opacity = 0.5;
  }

  const isDimmed = opacity < 1;

  // Validation status styling
  const statusColors: Record<string, string> = {
    validated: '#10b981',    // green
    unvalidated: '#f59e0b',  // amber
    invalidated: '#ef4444'   // red
  };
  const statusColor = statusColors[validationStatus] || statusColors.unvalidated;
  const statusLabel = validationStatus.charAt(0).toUpperCase() + validationStatus.slice(1);

  return (
    <div
      role="article"
      aria-label={`Assumption: ${label}, Status: ${statusLabel}${changesetOperation ? `, ${changesetOperation} operation` : ''}`}
      style={{
        width: 180,
        height: 100,
        border: `2px dashed ${borderColor}`,
        borderRadius: 8,
        backgroundColor: fill,
        opacity,
        boxShadow: selected ? '0 0 0 2px #3b82f6' : '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Validation Status Badge */}
      <div
        aria-label={`Validation status: ${statusLabel}`}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: statusColor,
          color: 'white',
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 4,
          textTransform: 'uppercase',
        }}
      >
        {statusLabel}
      </div>

      {/* Question Mark Indicator */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          fontSize: 16,
          fontWeight: 700,
          color: borderColor,
        }}
      >
        ?
      </div>

      {/* Label */}
      <div
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 500,
          color: '#1f2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          marginTop: 20,
        }}
      >
        {label}
      </div>

      {/* Type Indicator */}
      <div
        style={{
          fontSize: 10,
          color: '#6b7280',
          fontWeight: 500,
          marginTop: 4,
        }}
      >
        ASSUMPTION
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: borderColor }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: borderColor }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: borderColor }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: borderColor }}
      />

      {/* Relationship badge (when dimmed) */}
      {data.relationshipBadge && (
        <RelationshipBadge badge={data.relationshipBadge} isDimmed={isDimmed} />
      )}
    </div>
  );
});

AssumptionNode.displayName = 'AssumptionNode';
