import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { StakeholderNodeData } from '../../types/reactflow';

/**
 * Node dimensions for layout calculation
 */
export const STAKEHOLDER_NODE_WIDTH = 180;
export const STAKEHOLDER_NODE_HEIGHT = 120;

/**
 * Stakeholder Node Component for Motivation Layer
 * Displays stakeholder elements with hexagon-inspired visual and type indicator
 */
export const StakeholderNode = memo(({ data }: NodeProps<StakeholderNodeData>) => {
  // Apply changeset styling if present
  let borderColor = data.stroke || '#7c3aed';
  let backgroundColor = data.fill || '#f3e8ff';
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

  return (
    <div
      role="article"
      aria-label={`Stakeholder: ${data.label}${data.stakeholderType ? `, type: ${data.stakeholderType}` : ''}`}
      style={{
        width: STAKEHOLDER_NODE_WIDTH,
        height: STAKEHOLDER_NODE_HEIGHT,
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

      {/* Stakeholder icon */}
      <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>

      {/* Stakeholder name */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#1f2937',
          wordBreak: 'break-word',
          marginBottom: 6,
        }}
      >
        {data.label}
      </div>

      {/* Stakeholder type badge */}
      {data.stakeholderType && (
        <div
          role="status"
          aria-label={`Stakeholder type: ${data.stakeholderType}`}
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            color: borderColor,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {data.stakeholderType}
        </div>
      )}

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
        Stakeholder
      </div>
    </div>
  );
});

StakeholderNode.displayName = 'StakeholderNode';
