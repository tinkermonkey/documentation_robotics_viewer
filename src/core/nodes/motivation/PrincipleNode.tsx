import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { RelationshipBadge } from './RelationshipBadge';
import { PrincipleNodeData } from '../../types/reactflow';

export const PRINCIPLE_NODE_WIDTH = 180;
export const PRINCIPLE_NODE_HEIGHT = 100;

/**
 * PrincipleNode - Represents guiding principles in the motivation layer
 *
 * Visual Design:
 * - Shield-like appearance to represent foundational guidance
 * - Scope badge (enterprise/domain/application)
 * - Changeset operation styling support
 * - Accessibility: Full ARIA labeling for screen readers
 */
export const PrincipleNode = React.memo(({ data, selected, id: _id }: { data: PrincipleNodeData; selected?: boolean; id?: string }) => {
  const { label, fill = '#fef3c7', stroke = '#f59e0b', scope = 'enterprise', changesetOperation } = data;

  // Changeset styling
  let borderColor = stroke;
  let opacity = data.opacity !== undefined ? data.opacity : 1;
  if (changesetOperation === 'add') {
    borderColor = '#10b981'; // green
  } else if (changesetOperation === 'update') {
    borderColor = '#f59e0b'; // amber
  } else if (changesetOperation === 'delete') {
    borderColor = '#ef4444'; // red
    opacity = 0.5;
  }

  const isDimmed = opacity < 1;

  // Scope badge styling
  const scopeColors: Record<string, string> = {
    enterprise: '#8b5cf6', // purple
    domain: '#3b82f6',     // blue
    application: '#10b981' // green
  };
  const scopeColor = scopeColors[scope] || scopeColors.enterprise;
  const scopeLabel = scope.charAt(0).toUpperCase() + scope.slice(1);

  return (
    <div
      role="article"
      aria-label={`Principle: ${label}, Scope: ${scopeLabel}${changesetOperation ? `, ${changesetOperation} operation` : ''}`}
      style={{
        width: 180,
        height: 100,
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        backgroundColor: fill,
        opacity,
        boxShadow: selected ? '0 0 0 2px #3b82f6' : '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Scope Badge */}
      <div
        aria-label={`Scope: ${scopeLabel}`}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: scopeColor,
          color: 'white',
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 4,
          textTransform: 'uppercase',
        }}
      >
        {scopeLabel}
      </div>

      {/* Label */}
      <div
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 500,
          color: '#1f2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          marginTop: 16,
        }}
      >
        {label}
      </div>

      {/* Type Indicator */}
      <div
        style={{
          fontSize: 10,
          color: '#6b7280',
          fontWeight: 500,
          marginTop: 4,
        }}
      >
        PRINCIPLE
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: borderColor }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: borderColor }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: borderColor }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: borderColor }}
      />

      {/* Relationship badge (when dimmed) */}
      {data.relationshipBadge && (
        <RelationshipBadge badge={data.relationshipBadge} isDimmed={isDimmed} />
      )}
    </div>
  );
});

PrincipleNode.displayName = 'PrincipleNode';
