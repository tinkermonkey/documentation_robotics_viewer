import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BusinessCapabilityNodeData } from '../../types/reactflow';

/**
 * Node dimensions for layout calculation
 */
export const BUSINESS_CAPABILITY_NODE_WIDTH = 160;
export const BUSINESS_CAPABILITY_NODE_HEIGHT = 70;

/**
 * Business Capability Node Component for React Flow
 * Displays business capabilities with metadata (owner, criticality, lifecycle)
 */
export const BusinessCapabilityNode = memo(({ data, id: _id }: { data: BusinessCapabilityNodeData; id?: string }) => {
  return (
    <div
      role="article"
      aria-label={`Business Capability: ${data.label}${data.criticality ? `, criticality: ${data.criticality}` : ''}`}
      style={{
        width: BUSINESS_CAPABILITY_NODE_WIDTH,
        height: BUSINESS_CAPABILITY_NODE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `2px solid ${data.stroke || '#2e7d32'}`,
        backgroundColor: data.fill || '#e8f5e9',
        borderRadius: 8,
        padding: 12,
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#555' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#555' }}
      />

      {/* Header with icon and title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 14 }}>⭐</div>
        <div
          style={{
            fontSize: 13,
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
        <div
          style={{
            fontSize: 9,
            textTransform: 'uppercase',
            color: '#2e7d32',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
          }}
        >
          Capability
        </div>
        {data.criticality && (
          <div
            style={{
              fontSize: 9,
              padding: '1px 4px',
              borderRadius: 3,
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
      </div>
    </div>
  );
});

BusinessCapabilityNode.displayName = 'BusinessCapabilityNode';
