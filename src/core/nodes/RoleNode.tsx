import { memo } from 'react';
import { Handle, Position, NodeProps , Node} from '@xyflow/react';
import { RoleNodeData } from '../types/reactflow';

/**
 * Role Node Component for React Flow
 * Displays security roles with hierarchy information
 */
export const RoleNode = memo(({ data }: NodeProps<Node<RoleNodeData>>) => {
  return (
    <div
      style={{
        width: 160,
        height: 90,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `1.5px solid ${data.stroke || '#6d28d9'}`,
        backgroundColor: data.fill || '#f5f3ff',
        borderRadius: 4,
        padding: 10,
      }}
    >
      {/* Handles - positioned on header area (icon + label) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ left: '50%', background: '#6d28d9', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: '50%', background: '#6d28d9', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ top: 20, background: '#6d28d9', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ top: 20, background: '#6d28d9', width: 8, height: 8 }}
      />

      {/* Header with icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 20 }}>👤</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
            flex: 1,
          }}
        >
          {data.label}
        </span>
      </div>

      {/* Role level */}
      {data.level !== undefined && (
        <div
          style={{
            fontSize: 11,
            color: '#6b7280',
            marginBottom: 4,
          }}
        >
          Level: {data.level}
        </div>
      )}

      {/* Inheritance indicator */}
      {data.inheritsFrom && data.inheritsFrom.length > 0 && (
        <div
          style={{
            fontSize: 10,
            color: '#6d28d9',
            fontWeight: 'bold',
          }}
        >
          ↑ Inherits: {data.inheritsFrom.length}
        </div>
      )}
    </div>
  );
});

RoleNode.displayName = 'RoleNode';
