import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ConstraintNodeData } from '../../types/reactflow';

/**
 * Node dimensions for layout calculation
 */
export const CONSTRAINT_NODE_WIDTH = 180;
export const CONSTRAINT_NODE_HEIGHT = 110;

/**
 * Constraint Node Component for Motivation Layer
 * Displays constraint elements with negotiability indicator
 */
export const ConstraintNode = memo(({ data }: NodeProps<ConstraintNodeData>) => {
  // Apply changeset styling if present
  let borderColor = data.stroke || '#dc2626';
  let backgroundColor = data.fill || '#fee2e2';
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

  // Negotiability icon
  const negotiabilityIcon = data.negotiability === 'fixed' ? '🔒' : '🔓';

  return (
    <div
      style={{
        width: CONSTRAINT_NODE_WIDTH,
        height: CONSTRAINT_NODE_HEIGHT,
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

      {/* Negotiability indicator (top right) */}
      {data.negotiability && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 16,
          }}
          title={data.negotiability === 'fixed' ? 'Fixed constraint' : 'Negotiable constraint'}
        >
          {negotiabilityIcon}
        </div>
      )}

      {/* Constraint icon */}
      <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>

      {/* Constraint name */}
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
        Constraint
      </div>
    </div>
  );
});

ConstraintNode.displayName = 'ConstraintNode';
