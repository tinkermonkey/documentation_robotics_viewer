/**
 * UnifiedNode Component
 *
 * Core component that merges capabilities from BaseLayerNode, BaseFieldListNode,
 * and custom implementations. Uses JSON configuration system to drive rendering
 * and supports all existing features: changeset styling, badges, semantic zoom,
 * field lists, per-field handles, and RelationshipBadge integration.
 *
 * Accepts a NodeType enum parameter that drives all styling and behavioral
 * variations through external JSON configuration.
 *
 * NOTE: Uses inline styles for dimensions and colors (not Tailwind) because:
 * - React Flow nodes require dynamic sizing based on content
 * - Colors come from JSON configuration to support multiple themes
 * - Inline styles provide consistent rendering across light/dark modes
 *   (the node colors are theme-agnostic from the config system)
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { NodeType } from '../NodeType';
import { nodeConfigLoader } from '../nodeConfigLoader';
import { RelationshipBadge, RelationshipBadgeData } from './RelationshipBadge';
import FieldList, { FieldItem } from './FieldList';

export interface NodeBadge {
  position: 'top-left' | 'top-right' | 'inline';
  content: string;
  className?: string;
  ariaLabel?: string;
}

export type DetailLevel = 'minimal' | 'standard' | 'detailed';
export type ChangesetOperation = 'add' | 'update' | 'delete';

export interface UnifiedNodeData {
  nodeType: NodeType;
  label: string;
  items?: FieldItem[];
  hideFields?: boolean;
  badges?: NodeBadge[];
  detailLevel?: DetailLevel;
  changesetOperation?: ChangesetOperation;
  relationshipBadge?: RelationshipBadgeData;
}

export type UnifiedNodeType = Node<UnifiedNodeData>;

function UnifiedNodeComponent(props: any): React.ReactElement {
  const { data, id } = props as NodeProps<UnifiedNodeData>;
  const {
    nodeType,
    label,
    items = [],
    hideFields = false,
    badges = [],
    detailLevel = 'standard',
    changesetOperation,
    relationshipBadge,
  } = data;

  // Load style config from JSON
  const styleConfig = nodeConfigLoader.getStyleConfig(nodeType);
  if (!styleConfig) {
    console.error(`No style config found for NodeType: ${nodeType}`);
    return (
      <div
        style={{
          padding: 12,
          backgroundColor: '#fee2e2',
          border: '2px solid #dc2626',
          borderRadius: 8,
          fontSize: 12,
          color: '#dc2626',
        }}
        role="alert"
      >
        Invalid node type: {nodeType}
      </div>
    );
  }

  const { layout, icon, typeLabel, colors, dimensions } = styleConfig;

  // Determine if fields should be visible
  const showFields = !hideFields && items.length > 0;

  // Calculate dynamic height
  const headerHeight = dimensions.headerHeight || 40;
  const itemHeight = dimensions.itemHeight || 24;
  const calculatedHeight = showFields
    ? headerHeight + items.length * itemHeight
    : dimensions.height;

  // Apply changeset styling overrides
  const changesetColors = changesetOperation
    ? nodeConfigLoader.getChangesetColors(changesetOperation)
    : null;

  let finalFillColor = colors.fill;
  let finalStrokeColor = colors.stroke;
  let finalOpacity = 1;

  if (changesetColors) {
    finalFillColor = changesetColors.bg;
    finalStrokeColor = changesetColors.border;
    finalOpacity = changesetColors.opacity || 1;
  }

  // Build inline styles
  const nodeStyle: React.CSSProperties = {
    width: dimensions.width,
    height: calculatedHeight,
    backgroundColor: finalFillColor,
    borderColor: finalStrokeColor,
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: 8,
    opacity: finalOpacity,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, sans-serif',
    position: 'relative',
  };

  const headerStyle: React.CSSProperties = {
    height: headerHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: layout === 'centered' ? 'center' : 'flex-start',
    padding: '0 12px',
    color: colors.header || colors.stroke,
    fontWeight: 600,
    fontSize: 14,
    borderBottom: showFields ? `1px solid ${finalStrokeColor}` : 'none',
    gap: 8,
  };

  // Render badges by position
  const topLeftBadges = badges.filter((b: NodeBadge) => b.position === 'top-left');
  const topRightBadges = badges.filter((b: NodeBadge) => b.position === 'top-right');
  const inlineBadges = badges.filter((b: NodeBadge) => b.position === 'inline');

  // Semantic zoom: hide content at minimal level
  const isMinimal = detailLevel === 'minimal';

  // Determine handle positions based on layout
  const isLeftLayout = layout === 'left';
  const handleTopValue = isLeftLayout ? headerHeight / 2 : '50%';
  const handleBottomValue = isLeftLayout ? headerHeight / 2 : '50%';

  return (
    <div
      style={nodeStyle}
      role="article"
      aria-label={`${typeLabel}: ${label}`}
      data-testid={`unified-node-${nodeType}`}
    >
      {/* Relationship badge - displays in top-right when node is dimmed */}
      {relationshipBadge && (
        <RelationshipBadge badge={relationshipBadge} isDimmed={finalOpacity < 1} />
      )}

      {/* Component-level handles - always present */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: colors.handle || colors.stroke,
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: colors.handle || colors.stroke,
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          top: handleTopValue,
          background: colors.handle || colors.stroke,
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          top: handleBottomValue,
          background: colors.handle || colors.stroke,
          width: 8,
          height: 8,
        }}
      />

      {/* Top-left badges */}
      {topLeftBadges.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            display: 'flex',
            gap: 4,
          }}
        >
          {topLeftBadges.map((badge: NodeBadge, idx: number) => (
            <span
              key={idx}
              className={badge.className}
              aria-label={badge.ariaLabel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {badge.content}
            </span>
          ))}
        </div>
      )}

      {/* Top-right badges */}
      {topRightBadges.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            display: 'flex',
            gap: 4,
          }}
        >
          {topRightBadges.map((badge: NodeBadge, idx: number) => (
            <span
              key={idx}
              className={badge.className}
              aria-label={badge.ariaLabel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {badge.content}
            </span>
          ))}
        </div>
      )}

      {/* Header - hidden at minimal detail level */}
      {!isMinimal && (
        <div style={headerStyle}>
          {icon && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 16,
              }}
            >
              {icon}
            </span>
          )}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
          {inlineBadges.map((badge: NodeBadge, idx: number) => (
            <span
              key={idx}
              className={badge.className}
              aria-label={badge.ariaLabel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 'auto',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {badge.content}
            </span>
          ))}
        </div>
      )}

      {/* Field list - rendered when items exist and fields not hidden */}
      {showFields && !isMinimal && (
        <FieldList
          items={items}
          nodeId={id}
          itemHeight={itemHeight}
          strokeColor={finalStrokeColor}
          handleColor={colors.handle || colors.stroke}
        />
      )}
    </div>
  );
}

const UnifiedNode = memo(UnifiedNodeComponent);
UnifiedNode.displayName = 'UnifiedNode';

export default UnifiedNode;
