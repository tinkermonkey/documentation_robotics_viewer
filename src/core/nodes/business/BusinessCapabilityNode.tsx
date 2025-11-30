import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BusinessCapabilityNodeData } from '../../types/reactflow';

/**
 * Business Capability Node Component for React Flow
 * Displays business capabilities with metadata (owner, criticality, lifecycle)
 */
export const BusinessCapabilityNode = memo(({ data }: NodeProps<BusinessCapabilityNodeData>) => {
  return (
    <div
      style={{
        width: 160, // Must match precalculateDimensions in BusinessNodeTransformer
        height: 70,
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
