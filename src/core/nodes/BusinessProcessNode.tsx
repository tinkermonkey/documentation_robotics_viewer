import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BusinessProcessNodeData } from '../types/reactflow';

/**
 * Business Process Node Component for React Flow
 * Displays business processes with simple card layout
 */
export const BusinessProcessNode = memo(({ data }: NodeProps<BusinessProcessNodeData>) => {
  return (
    <div
      style={{
        width: 180,
        height: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        border: `1.5px solid ${data.stroke || '#e65100'}`,
        backgroundColor: data.fill || '#fff3e0',
        borderRadius: 4,
        padding: 12,
        textAlign: 'center',
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ left: '50%', background: '#e65100', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: '50%', background: '#e65100', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ top: '50%', background: '#e65100', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ top: '50%', background: '#e65100', width: 8, height: 8 }}
      />

      {/* Process icon */}
      <div style={{ fontSize: 24, marginBottom: 8 }}>⚙️</div>

      {/* Process name */}
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

      {/* Process type badge */}
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          textTransform: 'uppercase',
          color: '#e65100',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
        }}
      >
        Process
      </div>
    </div>
  );
});

BusinessProcessNode.displayName = 'BusinessProcessNode';
