import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DriverNodeData } from '../../types/reactflow';

/**
 * Node dimensions for layout calculation
 */
export const DRIVER_NODE_WIDTH = 180;
export const DRIVER_NODE_HEIGHT = 110;

/**
 * Driver Node Component for Motivation Layer
 * Displays driver elements with category badge
 */
export const DriverNode = memo(({ data }: NodeProps<DriverNodeData>) => {
  // Apply changeset styling if present
  let borderColor = data.stroke || '#ea580c';
  let backgroundColor = data.fill || '#ffedd5';
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

  // Category badge color
  const getCategoryColor = () => {
    switch (data.category) {
      case 'business':
        return { bg: '#dbeafe', color: '#2563eb' };
      case 'technical':
        return { bg: '#f3e8ff', color: '#7c3aed' };
      case 'regulatory':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'market':
        return { bg: '#d1fae5', color: '#059669' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const categoryColors = getCategoryColor();

  return (
    <div
      style={{
        width: DRIVER_NODE_WIDTH,
        height: DRIVER_NODE_HEIGHT,
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

      {/* Category badge (top right) */}
      {data.category && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 9,
            textTransform: 'uppercase',
            color: categoryColors.color,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            backgroundColor: categoryColors.bg,
            padding: '2px 6px',
            borderRadius: 3,
          }}
        >
          {data.category}
        </div>
      )}

      {/* Driver icon */}
      <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>

      {/* Driver name */}
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
        Driver
      </div>
    </div>
  );
});

DriverNode.displayName = 'DriverNode';
