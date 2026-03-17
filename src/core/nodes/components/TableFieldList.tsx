import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import FieldTooltip from './FieldTooltip';
import type { FieldItem } from './FieldList';

interface TableFieldListProps {
  items: FieldItem[];
  itemHeight: number;
  strokeColor: string;
  handleColor: string;
}

/**
 * TableFieldList Component
 *
 * Renders a table-like display of fields with label and value columns.
 * Designed for data layer nodes (JSON Schema, Data Model) that display
 * structured data with field names and types.
 *
 * Features:
 * - Two-column layout: label (left), value (right)
 * - Per-field handles for connections
 * - Alternating row backgrounds for visual clarity
 * - Required/optional indicators
 * - Optional tooltips per field
 *
 * NOTE: Uses inline styles for layout and dynamic colors because:
 * - React Flow nodes require dynamic sizing based on field count
 * - Table layout needs precise column control
 * - Colors are data-driven and not theme-dependent
 */
const TableFieldList = memo<TableFieldListProps>(({ items, itemHeight, strokeColor, handleColor }) => {
  if (!items || items.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#9ca3af',
          fontStyle: 'italic',
        }}
      >
        No fields defined
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="list"
      tabIndex={0}
    >
      {items.map((item, idx) => {
        const isEven = idx % 2 === 0;
        const fieldStyle: React.CSSProperties = {
          height: itemHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          backgroundColor: isEven ? 'rgba(0,0,0,0.02)' : 'transparent',
          fontSize: 12,
          borderTop: idx === 0 ? 'none' : `1px solid ${strokeColor}20`,
          position: 'relative',
          gap: 8,
        };

        // Split width between label and value columns
        const labelStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flex: 1,
          minWidth: 0,
        };

        const valueStyle: React.CSSProperties = {
          color: '#666',
          fontSize: 11,
          fontFamily: '"Courier New", monospace',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
          textAlign: 'right',
        };

        return (
          <div
            key={item.id}
            style={fieldStyle}
            role="listitem"
            data-testid={`field-${item.id}`}
          >
            {/* Per-field left handle */}
            <Handle
              type="target"
              position={Position.Left}
              id={`field-${item.id}-left`}
              style={{
                background: handleColor,
                width: 8,
                height: 8,
                left: -4,
              }}
            />

            {/* Label column with required indicator */}
            <div style={labelStyle}>
              {item.required !== undefined && (
                <span
                  style={{
                    color: item.required ? '#dc2626' : '#9ca3af',
                    fontWeight: 'bold',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                  title={item.required ? 'Required' : 'Optional'}
                  role="img"
                  aria-label={item.required ? 'Required field' : 'Optional field'}
                >
                  ●
                </span>
              )}
              <span
                style={{
                  fontWeight: 500,
                  color: '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            </div>

            {/* Value column */}
            {item.value && (
              <span style={valueStyle}>
                {item.value}
              </span>
            )}

            {/* Field tooltip (optional) */}
            {item.tooltip && <FieldTooltip content={item.tooltip} />}

            {/* Per-field right handle */}
            <Handle
              type="source"
              position={Position.Right}
              id={`field-${item.id}-right`}
              style={{
                background: handleColor,
                width: 8,
                height: 8,
                right: -4,
              }}
            />
          </div>
        );
      })}
    </div>
  );
});

TableFieldList.displayName = 'TableFieldList';

export default TableFieldList;
