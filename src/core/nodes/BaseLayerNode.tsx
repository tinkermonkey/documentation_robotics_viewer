import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BaseNodeData } from '../types/reactflow';
import { RelationshipBadge } from './motivation/RelationshipBadge';

/**
 * Badge descriptor returned by the getBadges callback.
 * The factory renders these at the specified position.
 */
export interface NodeBadge {
  /** Visible text or icon character */
  label: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Where to place the badge */
  position: 'top-left' | 'top-right' | 'inline';
  /** Fill and text colors */
  colors: { bg: string; text: string };
  /**
   * When true, renders as a small colored circle (for status indicators).
   * Uses `colors.text` as the dot fill color.
   */
  circle?: boolean;
}

/**
 * Configuration for the createLayerNode factory.
 */
export interface BaseLayerNodeConfig<TData extends BaseNodeData> {
  width: number;
  height: number;
  defaultFill: string;
  defaultStroke: string;
  /** Short type label shown at the bottom of the node */
  typeLabel: string;
  /** Optional emoji or character icon */
  icon?: string;
  /**
   * 'centered' — motivation-style: icon above label, all centered.
   * 'left'     — business-style: icon inline with label, left-aligned.
   * @default 'centered'
   */
  layout?: 'centered' | 'left';
  /** Border style for the node container. @default 'solid' */
  borderStyle?: 'solid' | 'dashed';
  /**
   * Return badges for this node. Returning null/undefined items is safe —
   * the factory filters them out.
   */
  getBadges?: (data: TData) => Array<NodeBadge | null | undefined>;
  /**
   * Optionally override the default ARIA label (`"<typeLabel>: <data.label>"`).
   */
  getAriaLabel?: (data: TData) => string;
  /**
   * Optionally suppress the icon based on data (e.g., semantic zoom level).
   * @default always show
   */
  shouldShowIcon?: (data: TData) => boolean;
}

/** Changeset override colors */
function changesetColors(op: 'add' | 'update' | 'delete') {
  switch (op) {
    case 'add':    return { border: '#10b981', bg: '#d1fae5', opacity: 1 as const };
    case 'update': return { border: '#f59e0b', bg: '#fef3c7', opacity: 1 as const };
    case 'delete': return { border: '#ef4444', bg: '#fee2e2', opacity: 0.6 as const };
  }
}

/**
 * Factory that produces a memoized React Flow node component from a config object.
 * Eliminates boilerplate: changeset styling, 4 handles, type label, RelationshipBadge.
 */
export function createLayerNode<TData extends BaseNodeData>(
  config: BaseLayerNodeConfig<TData>
): React.ComponentType<{ data: TData; id?: string }> {
  const { layout = 'centered' } = config;

  const Component = memo(({ data, id: _id }: { data: TData; id?: string }) => {
    let borderColor = data.stroke || config.defaultStroke;
    let backgroundColor = data.fill || config.defaultFill;
    let opacity = data.opacity !== undefined ? data.opacity : 1;

    const op = data.changesetOperation as 'add' | 'update' | 'delete' | undefined;
    if (op) {
      const cs = changesetColors(op);
      borderColor = cs.border;
      backgroundColor = cs.bg;
      opacity = cs.opacity;
    }

    const isDimmed = opacity < 1;
    const showIcon = config.shouldShowIcon ? config.shouldShowIcon(data) : true;
    const ariaLabel = config.getAriaLabel?.(data) ?? `${config.typeLabel}: ${data.label}`;

    const allBadges = (config.getBadges?.(data) ?? []).filter((b): b is NodeBadge => b != null);
    const topLeftBadges  = allBadges.filter(b => b.position === 'top-left');
    const topRightBadges = allBadges.filter(b => b.position === 'top-right');
    const inlineBadges   = allBadges.filter(b => b.position === 'inline');

    if (layout === 'left') {
      // ── Business-style: left-aligned, small icon inline with label ──────────
      return (
        <div
          role="article"
          aria-label={ariaLabel}
          style={{
            width: config.width,
            height: config.height,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, sans-serif',
            border: `2px ${config.borderStyle ?? 'solid'} ${borderColor}`,
            backgroundColor,
            borderRadius: 8,
            padding: 12,
            opacity,
            position: 'relative',
          }}
        >
          <Handle type="target" position={Position.Top}    id="top"    style={{ background: '#555' }} />
          <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#555' }} />
          <Handle type="target" position={Position.Left}   id="left"   style={{ background: '#555' }} />
          <Handle type="source" position={Position.Right}  id="right"  style={{ background: '#555' }} />

          {/* Top-right badges (absolute) */}
          {topRightBadges.map((badge, i) => (
            <div
              key={i}
              role="status"
              aria-label={badge.ariaLabel}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                fontSize: 9,
                textTransform: 'uppercase' as const,
                color: badge.colors.text,
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                backgroundColor: badge.colors.bg,
                padding: '2px 6px',
                borderRadius: 3,
              }}
            >
              {badge.label}
            </div>
          ))}

          {/* Header: small icon + truncating label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {showIcon && config.icon && <div style={{ fontSize: 16 }}>{config.icon}</div>}
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

          {/* Type label */}
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase' as const,
              color: borderColor,
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              marginBottom: inlineBadges.length > 0 ? 8 : 0,
            }}
          >
            {config.typeLabel}
          </div>

          {/* Inline badge row */}
          {inlineBadges.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {inlineBadges.map((badge, i) => (
                <div
                  key={i}
                  aria-label={badge.ariaLabel}
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    background: badge.colors.bg,
                    borderRadius: 4,
                    color: badge.colors.text,
                    fontWeight: 600,
                  }}
                  title={badge.label}
                >
                  {badge.label}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ── Motivation-style: centered, large icon above label ───────────────────
    return (
      <div
        role="article"
        aria-label={ariaLabel}
        style={{
          width: config.width,
          height: config.height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          border: `2px ${config.borderStyle ?? 'solid'} ${borderColor}`,
          backgroundColor,
          borderRadius: 8,
          padding: 12,
          textAlign: 'center',
          opacity,
          position: 'relative',
        }}
      >
        <Handle type="target" position={Position.Top}    id="top"    style={{ left: '50%', background: borderColor, width: 8, height: 8 }} />
        <Handle type="source" position={Position.Bottom} id="bottom" style={{ left: '50%', background: borderColor, width: 8, height: 8 }} />
        <Handle type="target" position={Position.Left}   id="left"   style={{ top: '50%', background: borderColor, width: 8, height: 8 }} />
        <Handle type="source" position={Position.Right}  id="right"  style={{ top: '50%', background: borderColor, width: 8, height: 8 }} />

        {/* Top-left badges */}
        {topLeftBadges.map((badge, i) =>
          badge.circle ? (
            <div
              key={i}
              role="status"
              aria-label={badge.ariaLabel}
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: badge.colors.text,
                border: '2px solid rgba(255,255,255,0.8)',
              }}
              title={badge.label}
            />
          ) : (
            <div
              key={i}
              role="status"
              aria-label={badge.ariaLabel}
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                width: 20,
                height: 20,
                fontSize: 12,
                color: badge.colors.text,
                backgroundColor: badge.colors.bg,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              {badge.label}
            </div>
          )
        )}

        {/* Top-right badges */}
        {topRightBadges.map((badge, i) => (
          <div
            key={i}
            role="status"
            aria-label={badge.ariaLabel}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              fontSize: 9,
              textTransform: 'uppercase' as const,
              color: badge.colors.text,
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              backgroundColor: badge.colors.bg,
              padding: '2px 6px',
              borderRadius: 3,
            }}
          >
            {badge.label}
          </div>
        ))}

        {/* Icon */}
        {showIcon && config.icon && (
          <div style={{ fontSize: 28, marginBottom: 8 }}>{config.icon}</div>
        )}

        {/* Label */}
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', wordBreak: 'break-word' }}>
          {data.label}
        </div>

        {/* Inline badges (centered row, shown between label and type label) */}
        {inlineBadges.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            {inlineBadges.map((badge, i) => (
              <div
                key={i}
                role="status"
                aria-label={badge.ariaLabel}
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase' as const,
                  color: badge.colors.text,
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                  backgroundColor: badge.colors.bg,
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {badge.label}
              </div>
            ))}
          </div>
        )}

        {/* Type label at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            fontSize: 9,
            textTransform: 'uppercase' as const,
            color: '#6b7280',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          {config.typeLabel}
        </div>

        {/* Relationship count badge (shown when node is dimmed in focus mode) */}
        {data.relationshipBadge && (
          <RelationshipBadge badge={data.relationshipBadge} isDimmed={isDimmed} />
        )}
      </div>
    );
  });

  Component.displayName = `${config.typeLabel}Node`;
  return Component;
}
