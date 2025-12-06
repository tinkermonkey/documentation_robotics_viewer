import { memo } from 'react';
import { Handle, Position, NodeProps , Node} from '@xyflow/react';
import { PermissionNodeData } from '../types/reactflow';

/**
 * Permission Node Component for React Flow
 * Displays security permissions with scope indicators
 */
export const PermissionNode = memo(({ data }: NodeProps<Node<PermissionNodeData>>) => {
  const getScopeColor = (scope: string): string => {
    const colorMap: Record<string, string> = {
      'global': '#7c3aed',    // Purple
      'resource': '#2563eb',  // Blue
      'attribute': '#059669'  // Green
    };
    return colorMap[scope] || '#6b7280';
  };

  return (
    <div
      style={{
        width: 180,
        height: 90,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `1.5px solid ${data.stroke || '#059669'}`,
        backgroundColor: data.fill || '#ecfdf5',
        borderRadius: 4,
        padding: 10,
      }}
    >
      {/* Handles - positioned on header area (icon + label) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ left: '50%', background: '#059669', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: '50%', background: '#059669', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ top: 20, background: '#059669', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ top: 20, background: '#059669', width: 8, height: 8 }}
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
        <span style={{ fontSize: 18 }}>🔑</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#1f2937',
            flex: 1,
          }}
        >
          {data.label}
        </span>
      </div>

      {/* Scope badge */}
      <div
        style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          backgroundColor: getScopeColor(data.scope),
          color: 'white',
          padding: '2px 8px',
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {data.scope}
      </div>

      {/* Resource/Action info */}
      <div style={{ fontSize: 10, color: '#6b7280' }}>
        {data.resource && <div>Resource: {data.resource}</div>}
        {data.action && <div>Action: {data.action}</div>}
      </div>
    </div>
  );
});

PermissionNode.displayName = 'PermissionNode';
