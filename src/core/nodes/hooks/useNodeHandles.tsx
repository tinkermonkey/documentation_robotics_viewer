import React, { useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface UseNodeHandlesOptions {
  layout: 'centered' | 'left' | 'table';
  handleColor: string;
  headerHeight: number;
}

/**
 * useNodeHandles
 *
 * Returns the standard 4-handle configuration for nodes: top, bottom, left, right.
 * Handles are always present in the DOM but use the default Tailwind visibility
 * which hides them by default (they appear on node hover via CSS).
 *
 * Left and right handle positioning adjusts based on layout:
 * - 'left' layout: positioned at headerHeight/2
 * - 'centered' and 'table' layouts: centered vertically (50%)
 *
 * @param options - Configuration object with layout, handleColor, and headerHeight
 * @returns Array of Handle components
 */
export function useNodeHandles(options: UseNodeHandlesOptions): React.ReactElement[] {
  const { layout, handleColor, headerHeight } = options;

  return useMemo(() => {
    const isLeftLayout = layout === 'left';
    const handleTopValue = isLeftLayout ? headerHeight / 2 : '50%';
    const handleBottomValue = isLeftLayout ? headerHeight / 2 : '50%';

    const handleStyle: React.CSSProperties = {
      background: handleColor,
      width: 8,
      height: 8,
    };

    return [
      <Handle
        key="top"
        type="target"
        position={Position.Top}
        id="top"
        style={handleStyle}
      />,
      <Handle
        key="bottom"
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={handleStyle}
      />,
      <Handle
        key="left"
        type="target"
        position={Position.Left}
        id="left"
        style={{
          ...handleStyle,
          top: handleTopValue,
        }}
      />,
      <Handle
        key="right"
        type="source"
        position={Position.Right}
        id="right"
        style={{
          ...handleStyle,
          top: handleBottomValue,
        }}
      />,
    ];
  }, [layout, handleColor, headerHeight]);
}
