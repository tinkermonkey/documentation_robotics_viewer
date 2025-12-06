import { memo } from 'react';
import { Handle, Position, NodeProps , Node} from '@xyflow/react';
import { BusinessFunctionNodeData } from '../../types/reactflow';

/**
 * Node dimensions for layout calculation
 */
export const BUSINESS_FUNCTION_NODE_WIDTH = 180;
export const BUSINESS_FUNCTION_NODE_HEIGHT = 100;

/**
 * Business Function Node Component for React Flow
 * Displays business functions with metadata (owner, criticality, lifecycle)
 */
export const BusinessFunctionNode = memo(({ data }: NodeProps<Node<BusinessFunctionNodeData>>) => {
  return (
    <div
      role="article"
      aria-label={`Business Function: ${data.label}${data.owner ? `, owner: ${data.owner}` : ''}${data.domain ? `, domain: ${data.domain}` : ''}`}
      style={{
        width: BUSINESS_FUNCTION_NODE_WIDTH,
        height: BUSINESS_FUNCTION_NODE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `2px solid ${data.stroke || '#1565c0'}`,
        backgroundColor: data.fill || '#e3f2fd',
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
        <div style={{ fontSize: 16 }}>📊</div>
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

      {/* Type badge */}
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          color: '#1565c0',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          marginBottom: 8,
        }}
      >
        Function
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
        {data.domain && (
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              background: '#f3e5f5',
              borderRadius: 4,
              color: '#6a1b9a',
            }}
            title="Domain"
          >
            {data.domain}
          </div>
        )}
      </div>
    </div>
  );
});

BusinessFunctionNode.displayName = 'BusinessFunctionNode';
