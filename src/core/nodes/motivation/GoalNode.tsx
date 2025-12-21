import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GoalNodeData } from '../../types/reactflow';
import { RelationshipBadge } from './RelationshipBadge';
import { coverageAnalyzer } from '../../../apps/embedded/services/coverageAnalyzer';

/**
 * Node dimensions for layout calculation
 */
export const GOAL_NODE_WIDTH = 180;
export const GOAL_NODE_HEIGHT = 110;

/**
 * Goal Node Component for Motivation Layer
 * Displays goal elements with priority badge, coverage indicators, and semantic zoom support
 */
export const GoalNode = memo(({ data, id: _id }: { data: GoalNodeData; id?: string }) => {
  const detailLevel = data.detailLevel || 'detailed';
  // Apply changeset styling if present
  let borderColor = data.stroke || '#059669';
  let backgroundColor = data.fill || '#d1fae5';
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

  // Check if node is dimmed (for focus mode)
  const isDimmed = opacity < 1;

  // Priority badge color
  const getPriorityColor = () => {
    switch (data.priority) {
      case 'high':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'medium':
        return { bg: '#fef3c7', color: '#f59e0b' };
      case 'low':
        return { bg: '#dbeafe', color: '#2563eb' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const priorityColors = getPriorityColor();

  // Coverage indicator
  const coverageIndicator = data.coverageIndicator;
  const coverageColors = coverageIndicator
    ? coverageAnalyzer.getCoverageColor(coverageIndicator.status)
    : null;
  const coverageIcon = coverageIndicator
    ? coverageAnalyzer.getCoverageIcon(coverageIndicator.status)
    : null;

  // Determine what to show based on detail level
  const showIcon = detailLevel !== 'minimal';
  const showTypeBadge = detailLevel === 'detailed';
  const showPriority = detailLevel === 'detailed' && data.priority;
  const showCoverage = detailLevel !== 'minimal' && coverageIndicator;

  return (
    <div
      role="article"
      aria-label={`Goal: ${data.label}${data.priority ? `, priority: ${data.priority}` : ''}`}
      style={{
        width: GOAL_NODE_WIDTH,
        height: GOAL_NODE_HEIGHT,
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

      {/* Priority badge (top right) - detailed level only */}
      {showPriority && (
        <div
          role="status"
          aria-label={`Priority: ${data.priority}`}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 9,
            textTransform: 'uppercase',
            color: priorityColors.color,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            backgroundColor: priorityColors.bg,
            padding: '2px 6px',
            borderRadius: 3,
          }}
        >
          {data.priority}
        </div>
      )}

      {/* Coverage indicator (top left) - standard and detailed levels */}
      {showCoverage && coverageColors && coverageIcon && (
        <div
          role="status"
          aria-label={`Coverage: ${coverageIndicator.status}, ${coverageIndicator.requirementCount} requirements`}
          title={`${coverageIndicator.requirementCount} requirement(s), ${coverageIndicator.constraintCount} constraint(s)`}
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            width: 20,
            height: 20,
            fontSize: 12,
            color: coverageColors.color,
            backgroundColor: coverageColors.bg,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}
        >
          {coverageIcon}
        </div>
      )}

      {/* Goal icon - standard and detailed levels */}
      {showIcon && <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>}

      {/* Goal name */}
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

      {/* Element type label - detailed level only */}
      {showTypeBadge && (
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
          Goal
        </div>
      )}

      {/* Relationship badge (shown when dimmed) */}
      {data.relationshipBadge && (
        <RelationshipBadge badge={data.relationshipBadge} isDimmed={isDimmed} />
      )}
    </div>
  );
});

GoalNode.displayName = 'GoalNode';
