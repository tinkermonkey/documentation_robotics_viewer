import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { ConstraintNodeData } from '../../types/reactflow';
import { RelationshipBadge } from './RelationshipBadge';

/**
 * Node dimensions for layout calculation
 */
export const CONSTRAINT_NODE_WIDTH = 180;
export const CONSTRAINT_NODE_HEIGHT = 110;

/**
 * Constraint Node Component for Motivation Layer
 * Displays constraint elements with negotiability indicator
 */
export const ConstraintNode = memo(({ data }: NodeProps<Node<ConstraintNodeData>>) => {
  // Apply changeset styling if present
  let borderColor = data.stroke || '#dc2626';
  let backgroundColor = data.fill || '#fee2e2';
  let opacity = data.opacity !== undefined ? data.opacity : 1;

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

  const isDimmed = opacity < 1;

  // Negotiability icon
  const negotiabilityLabel = data.negotiability === 'fixed' ? 'FIXED' : 'NEGOTIABLE';
  const negotiabilityColor = data.negotiability === 'fixed' ? '#ef4444' : '#10b981';

  return (
    <div
      role="article"
      aria-label={`Constraint: ${data.label}${data.negotiability ? `, ${data.negotiability}` : ''}${data.changesetOperation ? `, ${data.changesetOperation} operation` : ''}`}
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
        aria-label="Top connection point"
        style={{ left: '50%', background: borderColor, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        aria-label="Bottom connection point"
        style={{ left: '50%', background: borderColor, width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        aria-label="Left connection point"
        style={{ top: '50%', background: borderColor, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        aria-label="Right connection point"
        style={{ top: '50%', background: borderColor, width: 8, height: 8 }}
      />

      {/* Negotiability badge (top right) */}
      {data.negotiability && (
        <div
          role="status"
          aria-label={`Constraint is ${data.negotiability}`}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: negotiabilityColor,
            color: 'white',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {negotiabilityLabel}
        </div>
      )}

      {/* Constraint type label */}
      <div
        style={{
          fontSize: 10,
          color: '#6b7280',
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        CONSTRAINT
      </div>

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

      {/* Relationship badge (when dimmed) */}
      {data.relationshipBadge && (
        <RelationshipBadge badge={data.relationshipBadge} isDimmed={isDimmed} />
      )}
    </div>
  );
});

ConstraintNode.displayName = 'ConstraintNode';
