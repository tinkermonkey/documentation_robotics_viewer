import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BusinessProcessNodeData } from '../types/reactflow';

/**
 * Node dimensions for layout calculation
 */
export const BUSINESS_PROCESS_NODE_WIDTH = 200;
export const BUSINESS_PROCESS_NODE_HEIGHT = 80;

/**
 * Business Process Node Component for React Flow
 * Displays business processes with metadata (owner, criticality, lifecycle, subprocess count)
 */
export const BusinessProcessNode = memo(({ data }: NodeProps<BusinessProcessNodeData>) => {
  return (
    <div
      role="article"
      aria-label={`Business Process: ${data.label}${data.owner ? `, owner: ${data.owner}` : ''}${data.criticality ? `, criticality: ${data.criticality}` : ''}`}
      style={{
        width: BUSINESS_PROCESS_NODE_WIDTH,
        height: BUSINESS_PROCESS_NODE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `2px solid ${data.stroke || '#e65100'}`,
        backgroundColor: data.fill || '#fff3e0',
        borderRadius: 8,
        padding: 12,
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        aria-label="Top connection point"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        aria-label="Bottom connection point"
        style={{ background: '#555' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        aria-label="Left connection point"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        aria-label="Right connection point"
        style={{ background: '#555' }}
      />

      {/* Header with icon and title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 16 }}>⚙️</div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
          title={data.label}
        >
          {data.label}
        </div>
      </div>

      {/* Metadata badges */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {data.owner && (
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              background: '#e0e0e0',
              borderRadius: 4,
              color: '#424242',
            }}
            title="Owner"
          >
            {data.owner}
          </div>
        )}
        {data.criticality && (
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background:
                data.criticality === 'high'
                  ? '#ffebee'
                  : data.criticality === 'medium'
                    ? '#fff3e0'
                    : '#e8f5e9',
              color:
                data.criticality === 'high'
                  ? '#c62828'
                  : data.criticality === 'medium'
                    ? '#e65100'
                    : '#2e7d32',
              fontWeight: 600,
            }}
            title="Criticality"
          >
            {data.criticality}
          </div>
        )}
        {data.subprocessCount !== undefined && data.subprocessCount > 0 && (
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              background: '#e3f2fd',
              borderRadius: 4,
              color: '#1565c0',
            }}
            title="Subprocess count"
          >
            {data.subprocessCount} steps
          </div>
        )}
      </div>
    </div>
  );
});

BusinessProcessNode.displayName = 'BusinessProcessNode';
