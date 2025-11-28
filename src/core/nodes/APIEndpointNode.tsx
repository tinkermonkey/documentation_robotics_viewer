import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { APIEndpointNodeData, HTTPMethod } from '../types/reactflow';

/**
 * API Endpoint Node Component for React Flow
 * Displays REST API endpoints with HTTP method badges
 */
export const APIEndpointNode = memo(({ data }: NodeProps<APIEndpointNodeData>) => {
  const getMethodColor = (method: HTTPMethod): string => {
    const colorMap: Record<HTTPMethod, string> = {
      'GET': '#4CAF50',      // Green
      'POST': '#2196F3',     // Blue
      'PUT': '#FF9800',      // Orange
      'PATCH': '#9C27B0',    // Purple
      'DELETE': '#F44336',   // Red
      'HEAD': '#607D8B',     // Blue Grey
      'OPTIONS': '#795548'   // Brown
    };
    return colorMap[method] || '#999999';
  };

  return (
    <div
      style={{
        width: 250,
        height: 80,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `1.5px solid ${data.stroke || '#00695c'}`,
        backgroundColor: data.fill || '#e0f2f1',
        borderRadius: 4,
        overflow: 'hidden',
        padding: 8,
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ left: '50%', background: '#00695c', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: '50%', background: '#00695c', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ top: '50%', background: '#00695c', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ top: '50%', background: '#00695c', width: 8, height: 8 }}
      />

      {/* Header with HTTP method badge and label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        {/* HTTP Method badge */}
        <div
          style={{
            backgroundColor: getMethodColor(data.method),
            color: 'white',
            padding: '4px 12px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 'bold',
            minWidth: 60,
            textAlign: 'center',
          }}
        >
          {data.method}
        </div>

        {/* Endpoint name/label */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: '#000',
          }}
        >
          {data.label}
        </span>
      </div>

      {/* API path */}
      <div
        style={{
          fontSize: 11,
          color: '#666',
          fontFamily: '"Courier New", monospace',
          marginTop: 'auto',
        }}
      >
        {data.path}
      </div>

      {/* Operation ID (if exists) */}
      {data.operationId && (
        <div
          style={{
            fontSize: 10,
            color: '#999',
            textAlign: 'right',
            marginTop: 4,
          }}
        >
          ID: {data.operationId}
        </div>
      )}
    </div>
  );
});

APIEndpointNode.displayName = 'APIEndpointNode';
