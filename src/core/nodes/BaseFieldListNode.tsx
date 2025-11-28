import { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from '@xyflow/react';

/**
 * Common field/property interface for base component
 */
export interface FieldItem {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

/**
 * Tooltip component for field indicators
 * Uses portal to render outside node boundaries to avoid clipping
 */
const FieldTooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (showTooltip && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 28, // Position above the trigger
        left: rect.left + rect.width / 2, // Center horizontally
      });
    }
  }, [showTooltip]);

  return (
    <>
      <span
        ref={triggerRef}
        style={{ display: 'inline-block' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </span>
      {showTooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            backgroundColor: '#1f2937',
            color: 'white',
            fontSize: 11,
            fontWeight: 500,
            borderRadius: 4,
            whiteSpace: 'nowrap',
            zIndex: 10000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {text}
          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #1f2937',
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
};

/**
 * Configuration for the base field list node
 */
export interface BaseFieldListNodeConfig {
  label: string;
  typeLabel: string;
  items: FieldItem[];
  colors: {
    border: string;
    background: string;
    header: string;
    handle: string;
  };
  width?: number;
  headerHeight?: number;
  itemHeight?: number;
}

/**
 * Base Field List Node Component
 * Shared implementation for DataModelNode and JSONSchemaNode
 * Displays a header with a list of fields/properties and field-level handles
 */
export const BaseFieldListNode = memo(({
  label,
  typeLabel,
  items,
  colors,
  width = 280,
  headerHeight = 36,
  itemHeight = 24,
}: BaseFieldListNodeConfig) => {
  // Calculate total height
  const totalHeight = items.length > 0
    ? headerHeight + items.length * itemHeight
    : headerHeight + 60; // Header + "no items" message

  return (
    <div
      style={{
        width,
        height: totalHeight,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `1.5px solid ${colors.border}`,
        backgroundColor: colors.background,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Component-level handles - Top */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          left: '50%',
          background: colors.handle,
          width: 8,
          height: 8,
        }}
      />

      {/* Header */}
      <div
        style={{
          height: headerHeight,
          backgroundColor: colors.header,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        <span>{label}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.5px',
            opacity: 0.85,
            textTransform: 'uppercase' as const,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Items with field-level handles */}
      {items && items.length > 0 ? (
        items.map((item, index) => {
          return (
            <div
              key={item.id}
              style={{
                position: 'relative',
                height: itemHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                backgroundColor: index % 2 === 1 ? '#f9fafb' : 'transparent',
                borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                fontSize: 13,
              }}
            >
              {/* Left handle for this item - centered in row */}
              <Handle
                type="target"
                position={Position.Left}
                id={`field-${item.id}-left`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: colors.handle,
                  width: 8,
                  height: 8,
                }}
              />

              {/* Item content */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FieldTooltip text={item.required ? 'Required' : 'Optional'}>
                  <span
                    style={{
                      color: item.required ? '#dc2626' : '#9ca3af',
                      fontWeight: 'bold',
                      cursor: 'help'
                    }}
                  >
                    ●
                  </span>
                </FieldTooltip>
                <span style={{ fontWeight: 500, color: '#1f2937' }}>
                  {item.name}
                </span>
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  fontFamily: '"Courier New", monospace',
                }}
              >
                {item.type}
              </span>

              {/* Right handle for this item - centered in row */}
              <Handle
                type="source"
                position={Position.Right}
                id={`field-${item.id}-right`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: colors.handle,
                  width: 8,
                  height: 8,
                }}
              />
            </div>
          );
        })
      ) : (
        /* No items message */
        <div
          style={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#9ca3af',
            fontStyle: 'italic',
          }}
        >
          No properties defined
        </div>
      )}

      {/* Component-level handles - Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          left: '50%',
          background: colors.handle,
          width: 8,
          height: 8,
        }}
      />

      {/* Component-level handles - Left & Right (positioned on header to avoid field conflicts) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          top: headerHeight / 2,
          background: colors.header,
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          top: headerHeight / 2,
          background: colors.header,
          width: 8,
          height: 8,
        }}
      />
    </div>
  );
});

BaseFieldListNode.displayName = 'BaseFieldListNode';
