import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { RelationshipBadge } from './RelationshipBadge';
import { AssessmentNodeData } from '../../types/reactflow';

/**
 * AssessmentNode - Represents assessments in the motivation layer
 *
 * Visual Design:
 * - Clipboard/checklist icon to represent evaluation
 * - Rating indicator (1-5 stars or score)
 * - Changeset operation styling support
 * - Accessibility: Full ARIA labeling for screen readers
 */
export const AssessmentNode = React.memo(({ data, selected }: NodeProps<Node<AssessmentNodeData>>) => {
  const { label, fill = '#f3e8ff', stroke = '#a855f7', rating = 0, changesetOperation } = data;

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

  // Rating color based on score
  let ratingColor = '#6b7280'; // gray
  if (rating >= 4) {
    ratingColor = '#10b981'; // green
  } else if (rating >= 3) {
    ratingColor = '#f59e0b'; // amber
  } else if (rating > 0) {
    ratingColor = '#ef4444'; // red
  }

  const ratingLabel = rating > 0 ? `${rating}/5` : 'N/A';

  return (
    <div
      role="article"
      aria-label={`Assessment: ${label}, Rating: ${ratingLabel}${changesetOperation ? `, ${changesetOperation} operation` : ''}`}
      style={{
        width: 180,
        height: 100,
        border: `2px solid ${borderColor}`,
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
      {/* Rating Badge */}
      <div
        aria-label={`Rating: ${ratingLabel}`}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: ratingColor,
          color: 'white',
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 4,
        }}
      >
        {ratingLabel}
      </div>

      {/* Clipboard Icon Indicator */}
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
        ✓
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
        ASSESSMENT
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        aria-label="Top connection point"
        style={{ background: borderColor }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        aria-label="Bottom connection point"
        style={{ background: borderColor }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        aria-label="Left connection point"
        style={{ background: borderColor }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        aria-label="Right connection point"
        style={{ background: borderColor }}
      />

      {/* Relationship badge (when dimmed) */}
      {data.relationshipBadge && (
        <RelationshipBadge badge={data.relationshipBadge} isDimmed={isDimmed} />
      )}
    </div>
  );
});

AssessmentNode.displayName = 'AssessmentNode';
