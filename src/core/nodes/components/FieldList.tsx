import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import FieldTooltip from './FieldTooltip';

export interface FieldItem {
  id: string;
  label: string;
  value?: string;
  required?: boolean;
  tooltip?: string;
}

interface FieldListProps {
  items: FieldItem[];
  nodeId?: string;
  itemHeight: number;
  strokeColor: string;
  handleColor: string;
}

/**
 * FieldList Component
 *
 * Renders a list of fields/properties with per-field handles.
 * Each field can have left and right connection handles.
 * Alternating row backgrounds for visual clarity.
 * Displays required/optional indicators and optional tooltips.
 */
const FieldList = memo<FieldListProps>(({ items, itemHeight, strokeColor, handleColor }) => {
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
              }}
            />

            {/* Field label and required indicator */}
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flex: 1,
                minWidth: 0,
              }}
            >
              {item.required !== undefined && (
                <span
                  style={{
                    color: item.required ? '#dc2626' : '#9ca3af',
                    fontWeight: 'bold',
                    fontSize: 14,
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
            </span>

            {/* Field value (optional) */}
            {item.value && (
              <span
                style={{
                  color: '#666',
                  fontSize: 11,
                  fontFamily: '"Courier New", monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
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
              }}
            />
          </div>
        );
      })}
    </div>
  );
});

FieldList.displayName = 'FieldList';

export default FieldList;
