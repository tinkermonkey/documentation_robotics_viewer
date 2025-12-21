import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { C4ContainerNodeData } from '../../types/reactflow';
import { RelationshipBadge } from '../motivation/RelationshipBadge';

/**
 * Node dimensions for layout calculation
 * CRITICAL: These MUST match the actual rendered component size
 */
export const CONTAINER_NODE_WIDTH = 280;
export const CONTAINER_NODE_HEIGHT = 180;

/**
 * Container type configuration for visual styling
 */
const containerTypeConfig: Record<string, { icon: string; color: string }> = {
  webApp: { icon: '🌐', color: '#3b82f6' },
  mobileApp: { icon: '📱', color: '#8b5cf6' },
  service: { icon: '⚙️', color: '#10b981' },
  database: { icon: '🗄️', color: '#f59e0b' },
  queue: { icon: '📨', color: '#ec4899' },
  filesystem: { icon: '📁', color: '#6b7280' },
  other: { icon: '📦', color: '#6b7280' },
};

/**
 * C4 Container Node Component
 * Displays containers (applications, services, databases) with:
 * - Name and container type badge
 * - Technology stack chips
 * - Description (truncated)
 * - Semantic zoom support (minimal, standard, detailed)
 * - Changeset status visualization
 */
export const ContainerNode = memo(({ data, id: _id }: { data: C4ContainerNodeData; id?: string }) => {
  const detailLevel = data.detailLevel || 'detailed';
  const containerType = data.containerType || 'other';
  const typeConfig = containerTypeConfig[containerType] || containerTypeConfig.other;

  // Apply changeset styling if present
  let borderColor = data.stroke || '#438dd5';
  let backgroundColor = data.fill || '#e1f5fe';
  let opacity = data.opacity !== undefined ? data.opacity : 1;
  let borderStyle: 'solid' | 'dashed' = 'solid';
  let boxShadow = 'none';

  if (data.changesetOperation) {
    switch (data.changesetOperation) {
      case 'add':
        borderColor = '#10b981';
        backgroundColor = '#d1fae5';
        borderStyle = 'dashed';
        break;
      case 'update':
        borderColor = '#f59e0b';
        backgroundColor = '#fef3c7';
        boxShadow = '0 0 8px rgba(245, 158, 11, 0.5)';
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

  // Determine what to show based on detail level
  const showTypeBadge = detailLevel !== 'minimal';
  const showTechnology = detailLevel !== 'minimal' && data.technology && data.technology.length > 0;
  const showDescription = detailLevel === 'detailed' && data.description;

  return (
    <div
      role="article"
      aria-label={`Container: ${data.label}${containerType ? `, type: ${containerType}` : ''}`}
      style={{
        width: CONTAINER_NODE_WIDTH,
        height: CONTAINER_NODE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `2px ${borderStyle} ${borderColor}`,
        backgroundColor,
        borderRadius: 10,
        padding: 14,
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
        style={{ left: '50%', background: borderColor, width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: '50%', background: borderColor, width: 10, height: 10 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ top: '50%', background: borderColor, width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ top: '50%', background: borderColor, width: 10, height: 10 }}
      />

      {/* Header row with icon and name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: showTypeBadge ? 8 : 0,
        }}
      >
        {/* Container icon */}
        <div style={{ fontSize: 24 }}>{typeConfig.icon}</div>

        {/* Container name */}
        <div
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: 700,
            color: '#1f2937',
            wordBreak: 'break-word',
            lineHeight: 1.2,
          }}
        >
          {data.label}
        </div>
      </div>

      {/* Container type badge - standard and detailed levels */}
      {showTypeBadge && (
        <div
          role="status"
          aria-label={`Type: ${containerType}`}
          style={{
            alignSelf: 'flex-start',
            fontSize: 10,
            textTransform: 'uppercase',
            color: 'white',
            fontWeight: 600,
            letterSpacing: '0.5px',
            backgroundColor: typeConfig.color,
            padding: '3px 8px',
            borderRadius: 4,
            marginBottom: 8,
            boxSizing: 'border-box',
          }}
        >
          {containerType}
        </div>
      )}

      {/* Technology stack chips - standard and detailed levels */}
      {showTechnology && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginBottom: 8,
          }}
        >
          {(data.technology ?? []).slice(0, 4).map((tech, index) => (
            <span
              key={index}
              style={{
                fontSize: 10,
                color: '#4b5563',
                backgroundColor: '#f3f4f6',
                padding: '2px 6px',
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                boxSizing: 'border-box',
              }}
            >
              {tech}
            </span>
          ))}
          {(data.technology?.length ?? 0) > 4 && (
            <span
              style={{
                fontSize: 10,
                color: '#6b7280',
                padding: '2px 6px',
                boxSizing: 'border-box',
              }}
            >
              +{(data.technology?.length ?? 0) - 4} more
            </span>
          )}
        </div>
      )}

      {/* Description - detailed level only */}
      {showDescription && (
        <div
          style={{
            flex: 1,
            fontSize: 11,
            color: '#6b7280',
            lineHeight: 1.4,
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

ContainerNode.displayName = 'ContainerNode';
