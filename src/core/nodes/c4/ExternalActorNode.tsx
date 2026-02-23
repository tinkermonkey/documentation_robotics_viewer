import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { C4ExternalActorNodeData } from '../../types/reactflow';
import { RelationshipBadge } from '../components/RelationshipBadge';

/**
 * Node dimensions for layout calculation
 * CRITICAL: These MUST match the actual rendered component size
 */
export const EXTERNAL_ACTOR_NODE_WIDTH = 160;
export const EXTERNAL_ACTOR_NODE_HEIGHT = 120;

/**
 * Actor type configuration for visual styling
 */
const actorTypeConfig: Record<string, { icon: string; color: string }> = {
  user: { icon: '👤', color: '#6b7280' },
  system: { icon: '🖥️', color: '#4b5563' },
  service: { icon: '🔗', color: '#374151' },
};

/**
 * C4 External Actor Node Component
 * Displays external actors (users, systems, services) with:
 * - Icon representing actor type
 * - Name
 * - Description (truncated)
 * - Gray tone styling to distinguish from internal elements
 * - Semantic zoom support
 * - Changeset status visualization
 */
export const ExternalActorNode = memo(({ data, id: _id }: { data: C4ExternalActorNodeData; id?: string }) => {
  const detailLevel = data.detailLevel || 'detailed';
  const actorType = data.actorType || 'user';
  const typeConfig = actorTypeConfig[actorType] || actorTypeConfig.user;

  // Apply changeset styling if present
  // External actors use gray tones to distinguish from internal elements
  let borderColor = data.stroke || '#9ca3af';
  let backgroundColor = data.fill || '#f9fafb';
  let opacity = data.opacity !== undefined ? data.opacity : 1;
  let borderStyle: 'solid' | 'dashed' = 'solid';
  let boxShadow = 'none';

  if (data.changesetOperation) {
    switch (data.changesetOperation) {
      case 'add':
        borderColor = '#10b981';
        backgroundColor = '#ecfdf5';
        borderStyle = 'dashed';
        break;
      case 'update':
        borderColor = '#f59e0b';
        backgroundColor = '#fffbeb';
        boxShadow = '0 0 6px rgba(245, 158, 11, 0.4)';
        break;
      case 'delete':
        borderColor = '#ef4444';
        backgroundColor = '#fef2f2';
        opacity = 0.6;
        break;
    }
  }

  // Check if node is dimmed (for focus mode)
  const isDimmed = opacity < 1;

  // Determine what to show based on detail level
  const showDescription = detailLevel === 'detailed' && data.description;
  const showTypeBadge = detailLevel !== 'minimal';

  return (
    <div
      role="article"
      aria-label={`External ${actorType}: ${data.label}`}
      style={{
        width: EXTERNAL_ACTOR_NODE_WIDTH,
        height: EXTERNAL_ACTOR_NODE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        border: `2px ${borderStyle} ${borderColor}`,
        backgroundColor,
        borderRadius: 12,
        padding: 12,
        boxSizing: 'border-box',
        textAlign: 'center',
        opacity,
        position: 'relative',
        boxShadow,
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

      {/* Actor type badge (top right) - standard and detailed levels */}
      {showTypeBadge && (
        <div
          role="status"
          aria-label={`Type: ${actorType}`}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 8,
            textTransform: 'uppercase',
            color: typeConfig.color,
            fontWeight: 700,
            letterSpacing: '0.5px',
            backgroundColor: '#e5e7eb',
            padding: '2px 5px',
            borderRadius: 3,
            boxSizing: 'border-box',
          }}
        >
          {actorType}
        </div>
      )}

      {/* Icon */}
      <div style={{ fontSize: 32, marginBottom: 6 }}>{typeConfig.icon}</div>

      {/* Actor name */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#1f2937',
          wordBreak: 'break-word',
          lineHeight: 1.2,
          maxWidth: '100%',
        }}
      >
        {data.label}
      </div>

      {/* Description - detailed level only */}
      {showDescription && (
        <div
          style={{
            marginTop: 4,
            fontSize: 9,
            color: '#6b7280',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            maxWidth: '100%',
          }}
        >
          {data.description}
        </div>
      )}

      {/* Relationship badge (shown when dimmed) */}
      {data.relationshipBadge && (
        <RelationshipBadge badge={data.relationshipBadge} isDimmed={isDimmed} />
      )}
    </div>
  );
});

ExternalActorNode.displayName = 'ExternalActorNode';
