import { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FieldTooltipProps {
  content: string;
}

/**
 * FieldTooltip Component
 *
 * Displays a tooltip on hover for field information.
 * Uses React Portal to render outside node boundaries to avoid clipping.
 * Positioned above the trigger element with a small arrow.
 */
const FieldTooltip = memo<FieldTooltipProps>(({ content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 28, // Position above the trigger
        left: rect.left + rect.width / 2, // Center horizontally
      });
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <span
        ref={triggerRef}
        style={{
          display: 'inline-block',
          cursor: 'help',
          color: '#999',
          marginLeft: 4,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label="More information"
      >
        ℹ️
      </span>
      {isVisible && createPortal(
        <div
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            backgroundColor: '#1f2937',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 4,
            maxWidth: 200,
            zIndex: 10000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {content}
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
});

FieldTooltip.displayName = 'FieldTooltip';

export default FieldTooltip;
