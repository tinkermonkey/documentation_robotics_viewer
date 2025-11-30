import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { ValueStreamNodeData } from '../../types/reactflow';

/**
 * ValueStreamNode - Represents value streams in the motivation layer
 *
 * Visual Design:
 * - Flow arrow indicator to represent value flow
 * - Stage count badge
 * - Gradient background to suggest flow
 * - Changeset operation styling support
 * - Accessibility: Full ARIA labeling for screen readers
 */
export const ValueStreamNode = React.memo(({ data, selected }: NodeProps<Node<ValueStreamNodeData>>) => {
  const { label, fill = '#dbeafe', stroke = '#3b82f6', stageCount = 0, changesetOperation } = data;

  // Changeset styling
  let borderColor = stroke;
  let opacity = 1;
  if (changesetOperation === 'add') {
    borderColor = '#10b981'; // green
  } else if (changesetOperation === 'update') {
    borderColor = '#f59e0b'; // amber
  } else if (changesetOperation === 'delete') {
    borderColor = '#ef4444'; // red
    opacity = 0.5;
  }

  return (
    <div
      role="article"
      aria-label={`Value Stream: ${label}, ${stageCount} stages${changesetOperation ? `, ${changesetOperation} operation` : ''}`}
      style={{
        width: 200,
        height: 100,
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${fill} 0%, #ffffff 100%)`,
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
      {/* Stage Count Badge */}
      <div
        aria-label={`Number of stages: ${stageCount}`}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: '#3b82f6',
          color: 'white',
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 4,
        }}
      >
        {stageCount} STAGES
      </div>

      {/* Flow Arrow Indicator */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          fontSize: 18,
          fontWeight: 700,
          color: borderColor,
        }}
      >
        →
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
        VALUE STREAM
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
    </div>
  );
});

ValueStreamNode.displayName = 'ValueStreamNode';
