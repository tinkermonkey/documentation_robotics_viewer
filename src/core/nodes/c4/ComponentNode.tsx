import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { C4ComponentNodeData } from '../../types/reactflow';
import { RelationshipBadge } from '../components/RelationshipBadge';

/**
 * Node dimensions for layout calculation
 * CRITICAL: These MUST match the actual rendered component size
 */
export const COMPONENT_NODE_WIDTH = 240;
export const COMPONENT_NODE_HEIGHT = 140;

/**
 * Role configuration for visual styling
 */
const roleConfig: Record<string, { icon: string; color: string }> = {
  Controller: { icon: '🎮', color: '#3b82f6' },
  Service: { icon: '⚡', color: '#10b981' },
  Repository: { icon: '📚', color: '#f59e0b' },
  Handler: { icon: '🔧', color: '#8b5cf6' },
  Middleware: { icon: '🔗', color: '#ec4899' },
  Validator: { icon: '✅', color: '#06b6d4' },
  Transformer: { icon: '🔄', color: '#14b8a6' },
  Gateway: { icon: '🚪', color: '#6366f1' },
  Factory: { icon: '🏭', color: '#78716c' },
  Adapter: { icon: '🔌', color: '#84cc16' },
};

/**
 * C4 Component Node Component
 * Displays components within containers with:
 * - Name and architectural role badge
 * - Technology stack
 * - Description (truncated)
 * - Lighter background for nested appearance
 * - Semantic zoom support
 * - Changeset status visualization
 */
export const ComponentNode = memo(({ data, id: _id }: { data: C4ComponentNodeData; id?: string }) => {
  const detailLevel = data.detailLevel || 'detailed';
  const role = data.role || '';
  const roleConfigEntry = roleConfig[role] || { icon: '📦', color: '#6b7280' };

  // Apply changeset styling if present
  // Components use lighter background for nested appearance
  let borderColor = data.stroke || '#85bbf0';
  let backgroundColor = data.fill || '#f0f9ff';
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
  const showRoleBadge = detailLevel !== 'minimal';
  const showTechnology = detailLevel !== 'minimal' && data.technology && data.technology.length > 0;
  const showDescription = detailLevel === 'detailed' && data.description;

  return (
    <div
      role="article"
      aria-label={`Component: ${data.label}${role ? `, role: ${role}` : ''}`}
      style={{
        width: COMPONENT_NODE_WIDTH,
        height: COMPONENT_NODE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `1.5px ${borderStyle} ${borderColor}`,
        backgroundColor,
        borderRadius: 8,
        padding: 12,
        boxSizing: 'border-box',
        opacity,
        position: 'relative',
        boxShadow,
        overflow: 'hidden',
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

      {/* Header row with icon and name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: showRoleBadge ? 6 : 0,
        }}
      >
        {/* Component icon */}
        <div style={{ fontSize: 18 }}>{roleConfigEntry.icon}</div>

        {/* Component name */}
        <div
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
            wordBreak: 'break-word',
            lineHeight: 1.2,
          }}
        >
          {data.label}
        </div>
      </div>

      {/* Architectural role badge - standard and detailed levels */}
      {showRoleBadge && role && (
        <div
          role="status"
          aria-label={`Role: ${role}`}
          style={{
            alignSelf: 'flex-start',
            fontSize: 9,
            textTransform: 'uppercase',
            color: 'white',
            fontWeight: 600,
            letterSpacing: '0.5px',
            backgroundColor: roleConfigEntry.color,
            padding: '2px 6px',
            borderRadius: 3,
            marginBottom: 6,
            boxSizing: 'border-box',
          }}
        >
          {role}
        </div>
      )}

      {/* Technology stack chips - standard and detailed levels */}
      {showTechnology && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            marginBottom: 6,
          }}
        >
          {(data.technology ?? []).slice(0, 3).map((tech, index) => (
            <span
              key={index}
              style={{
                fontSize: 9,
                color: '#4b5563',
                backgroundColor: '#f9fafb',
                padding: '2px 5px',
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                boxSizing: 'border-box',
              }}
            >
              {tech}
            </span>
          ))}
          {(data.technology?.length ?? 0) > 3 && (
            <span
              style={{
                fontSize: 9,
                color: '#6b7280',
                padding: '2px 5px',
                boxSizing: 'border-box',
              }}
            >
              +{(data.technology?.length ?? 0) - 3}
            </span>
          )}
        </div>
      )}

      {/* Description - detailed level only */}
      {showDescription && (
        <div
          style={{
            flex: 1,
            fontSize: 10,
            color: '#6b7280',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
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

ComponentNode.displayName = 'ComponentNode';
