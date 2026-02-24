/**
 * UnifiedNode Component
 *
 * Unified node implementation that replaces layer-specific node factories.
 * Uses JSON configuration system to drive rendering and supports all existing features:
 * changeset styling, badges, semantic zoom, field lists, per-field handles, and
 * RelationshipBadge integration.
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
import { Handle, Position } from '@xyflow/react';
import { NodeType } from '../NodeType';
import { nodeConfigLoader } from '../nodeConfigLoader';
import { RelationshipBadge, RelationshipBadgeData } from './RelationshipBadge';
import FieldList, { FieldItem } from './FieldList';
import TableFieldList from './TableFieldList';
import BadgeRenderer from './BadgeRenderer';
import { useShouldHideFields } from '../../stores/fieldVisibilityStore';

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
  layerId: string;
  elementId: string;
  items?: FieldItem[];
  hideFields?: boolean;
  badges?: NodeBadge[];
  detailLevel?: DetailLevel;
  changesetOperation?: ChangesetOperation;
  relationshipBadge?: RelationshipBadgeData;
  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

function UnifiedNodeComponent({ data, id }: { data: UnifiedNodeData; id?: string }): React.ReactElement {
  const {
    nodeType,
    label,
    items = [],
    hideFields: nodeHideFields = false,
    badges = [],
    detailLevel = 'standard',
    changesetOperation,
    relationshipBadge,
  } = data;

  // Get visibility from store (graph-level overrides node-level)
  const storeHideFields = useShouldHideFields(id);

  // Final decision: fields are hidden if either store or data prop indicates hiding
  const hideFields = storeHideFields || nodeHideFields;

  // Load style config from JSON
  const styleConfig = nodeConfigLoader.getStyleConfig(nodeType);
  if (!styleConfig) {
    // Error logging is done by nodeConfigLoader - this is a fallback guard
    // to ensure the component can render even with missing config
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
        data-testid="unified-node-error"
      >
        Invalid node type: {nodeType}
      </div>
    );
  }

  const { layout, icon, typeLabel, colors, dimensions, borderStyle = 'solid' } = styleConfig;

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
    borderStyle: borderStyle,
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
      <BadgeRenderer badges={badges} position="top-left" />

      {/* Top-right badges */}
      <BadgeRenderer badges={badges} position="top-right" />

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
          <BadgeRenderer badges={badges} position="inline" />
        </div>
      )}

      {/* Field list - rendered when items exist and fields not hidden */}
      {showFields && !isMinimal && layout === 'table' && (
        <TableFieldList
          items={items}
          itemHeight={itemHeight}
          strokeColor={finalStrokeColor}
          handleColor={colors.handle || colors.stroke}
        />
      )}

      {/* Regular field list - for centered and left layouts */}
      {showFields && !isMinimal && layout !== 'table' && (
        <FieldList
          items={items}
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
