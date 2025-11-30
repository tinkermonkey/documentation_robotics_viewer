import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GoalNodeData } from '../../types/reactflow';

/**
 * Node dimensions for layout calculation
 */
export const GOAL_NODE_WIDTH = 180;
export const GOAL_NODE_HEIGHT = 110;

/**
 * Goal Node Component for Motivation Layer
 * Displays goal elements with priority badge
 */
export const GoalNode = memo(({ data }: NodeProps<GoalNodeData>) => {
  // Apply changeset styling if present
  let borderColor = data.stroke || '#059669';
  let backgroundColor = data.fill || '#d1fae5';
  let opacity = 1;

  if (data.changesetOperation) {
    switch (data.changesetOperation) {
      case 'add':
        borderColor = '#10b981';
        backgroundColor = '#d1fae5';
        break;
      case 'update':
        borderColor = '#f59e0b';
        backgroundColor = '#fef3c7';
        break;
      case 'delete':
        borderColor = '#ef4444';
        backgroundColor = '#fee2e2';
        opacity = 0.6;
        break;
    }
  }

  // Priority badge color
  const getPriorityColor = () => {
    switch (data.priority) {
      case 'high':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'medium':
        return { bg: '#fef3c7', color: '#f59e0b' };
      case 'low':
        return { bg: '#dbeafe', color: '#2563eb' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const priorityColors = getPriorityColor();

  return (
    <div
      style={{
        width: GOAL_NODE_WIDTH,
        height: GOAL_NODE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        border: `2px solid ${borderColor}`,
        backgroundColor,
        borderRadius: 8,
        padding: 12,
        textAlign: 'center',
        opacity,
        position: 'relative',
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ left: '50%', background: borderColor, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: '50%', background: borderColor, width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ top: '50%', background: borderColor, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ top: '50%', background: borderColor, width: 8, height: 8 }}
      />

      {/* Priority badge (top right) */}
      {data.priority && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 9,
            textTransform: 'uppercase',
            color: priorityColors.color,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            backgroundColor: priorityColors.bg,
            padding: '2px 6px',
            borderRadius: 3,
          }}
        >
          {data.priority}
        </div>
      )}

      {/* Goal icon */}
      <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>

      {/* Goal name */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#1f2937',
          wordBreak: 'break-word',
        }}
      >
        {data.label}
      </div>

      {/* Element type label */}
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          fontSize: 9,
          textTransform: 'uppercase',
          color: '#6b7280',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}
      >
        Goal
      </div>
    </div>
  );
});

GoalNode.displayName = 'GoalNode';
