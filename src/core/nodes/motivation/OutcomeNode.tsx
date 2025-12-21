import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { RelationshipBadge } from './RelationshipBadge';
import { OutcomeNodeData } from '../../types/reactflow';

/**
 * Node dimensions for layout calculation
 */
export const OUTCOME_NODE_WIDTH = 180;
export const OUTCOME_NODE_HEIGHT = 110;

/**
 * Outcome Node Component for Motivation Layer
 * Displays outcome elements with achievement status indicator
 */
export const OutcomeNode = memo(({ data, id: _id }: { data: OutcomeNodeData; id?: string }) => {
  // Apply changeset styling if present
  let borderColor = data.stroke || '#0891b2';
  let backgroundColor = data.fill || '#cffafe';
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

  // Achievement status badge color
  const getStatusColor = () => {
    switch (data.achievementStatus) {
      case 'achieved':
        return { bg: '#d1fae5', color: '#059669', icon: '✓' };
      case 'in-progress':
        return { bg: '#fef3c7', color: '#f59e0b', icon: '→' };
      case 'planned':
        return { bg: '#dbeafe', color: '#2563eb', icon: '○' };
      case 'at-risk':
        return { bg: '#fee2e2', color: '#dc2626', icon: '!' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280', icon: '?' };
    }
  };

  const statusInfo = getStatusColor();

  return (
    <div
      role="article"
      aria-label={`Outcome: ${data.label}${data.achievementStatus ? `, status: ${data.achievementStatus.replace('-', ' ')}` : ''}`}
      style={{
        width: OUTCOME_NODE_WIDTH,
        height: OUTCOME_NODE_HEIGHT,
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
        style={{ left: '50%', background: borderColor, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: '50%', background: borderColor, width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ top: '50%', background: borderColor, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ top: '50%', background: borderColor, width: 8, height: 8 }}
      />

      {/* Achievement status badge (top right) */}
      {data.achievementStatus && (
        <div
          role="status"
          aria-label={`Achievement status: ${data.achievementStatus.replace('-', ' ')}`}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 11,
            fontWeight: 'bold',
            color: statusInfo.color,
            backgroundColor: statusInfo.bg,
            padding: '3px 8px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>{statusInfo.icon}</span>
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {data.achievementStatus.replace('-', ' ')}
          </span>
        </div>
      )}

      {/* Outcome icon */}
      <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>

      {/* Outcome name */}
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
        Outcome
      </div>

      {/* Relationship badge (when dimmed) */}
      {data.relationshipBadge && (
        <RelationshipBadge badge={data.relationshipBadge} isDimmed={isDimmed} />
      )}
    </div>
  );
});

OutcomeNode.displayName = 'OutcomeNode';
