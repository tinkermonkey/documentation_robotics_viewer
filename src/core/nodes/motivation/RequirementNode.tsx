import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { RequirementNodeData } from '../../types/reactflow';
import { RelationshipBadge } from './RelationshipBadge';

/**
 * Node dimensions for layout calculation
 */
export const REQUIREMENT_NODE_WIDTH = 180;
export const REQUIREMENT_NODE_HEIGHT = 110;

/**
 * Requirement Node Component for Motivation Layer
 * Displays requirement elements with status indicator
 */
export const RequirementNode = memo(({ data }: NodeProps<RequirementNodeData>) => {
  // Apply changeset styling if present
  let borderColor = data.stroke || '#2563eb';
  let backgroundColor = data.fill || '#dbeafe';
  let opacity = data.opacity !== undefined ? data.opacity : 1;

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

  const isDimmed = opacity < 1;

  // Status indicator color
  const getStatusColor = () => {
    if (!data.status) return '#9ca3af';
    const status = data.status.toLowerCase();
    if (status.includes('complete') || status.includes('done')) return '#10b981';
    if (status.includes('progress') || status.includes('active')) return '#f59e0b';
    if (status.includes('pending') || status.includes('planned')) return '#6b7280';
    return '#9ca3af';
  };

  const statusColor = getStatusColor();

  return (
    <div
      role="article"
      aria-label={`Requirement: ${data.label}${data.status ? `, status: ${data.status}` : ''}${data.changesetOperation ? `, ${data.changesetOperation} operation` : ''}`}
      style={{
        width: REQUIREMENT_NODE_WIDTH,
        height: REQUIREMENT_NODE_HEIGHT,
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

      {/* Status indicator (top left) */}
      <div
        role="status"
        aria-label={`Status: ${data.status || 'No status'}`}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: statusColor,
          border: '2px solid rgba(255,255,255,0.8)',
        }}
        title={data.status || 'No status'}
      />

      {/* Requirement type label */}
      <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>REQUIREMENT</div>

      {/* Requirement name */}
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
        Requirement
      </div>

      {/* Relationship badge (when dimmed) */}
      {data.relationshipBadge && (
        <RelationshipBadge badge={data.relationshipBadge} isDimmed={isDimmed} />
      )}
    </div>
  );
});

RequirementNode.displayName = 'RequirementNode';
