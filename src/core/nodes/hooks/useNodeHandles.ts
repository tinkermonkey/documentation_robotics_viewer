import { useMemo } from 'react';
import { Position } from '@xyflow/react';
import type React from 'react';
import type { NodeLayoutMode } from '../nodeConfig.types';

export interface HandleConfig {
  id: string;
  type: 'target' | 'source';
  position: Position;
  style: React.CSSProperties;
}

interface UseNodeHandlesOptions {
  layout: NodeLayoutMode;
  handleColor: string;
  headerHeight: number;
}

/**
 * Internal pure function that computes handle configurations.
 * This function is extracted to be testable outside of React context.
 * @internal
 */
export function computeHandleConfigs(options: UseNodeHandlesOptions): HandleConfig[] {
  const { layout, handleColor, headerHeight } = options;
  const isLeftLayout = layout === 'left';
  const handleTopValue = isLeftLayout ? headerHeight / 2 : '50%';

  const handleStyle: React.CSSProperties = {
    background: handleColor,
    width: 8,
    height: 8,
  };

  return [
    {
      id: 'top',
      type: 'target' as const,
      position: Position.Top,
      style: handleStyle,
    },
    {
      id: 'bottom',
      type: 'source' as const,
      position: Position.Bottom,
      style: handleStyle,
    },
    {
      id: 'left',
      type: 'target' as const,
      position: Position.Left,
      style: {
        ...handleStyle,
        top: handleTopValue,
      },
    },
    {
      id: 'right',
      type: 'source' as const,
      position: Position.Right,
      style: {
        ...handleStyle,
        top: handleTopValue,
      },
    },
  ];
}

/**
 * useNodeHandles
 *
 * Returns the standard 4-handle configuration for nodes: top, bottom, left, right.
 * This hook computes the handle configuration data based on layout and styling options.
 *
 * Left and right handle positioning adjusts based on layout:
 * - 'left' layout: positioned at headerHeight/2
 * - 'centered' and 'table' layouts: centered vertically (50%)
 *
 * Consuming components are responsible for mapping these configurations to
 * `<Handle>` elements from @xyflow/react.
 *
 * @param options - Configuration object with layout, handleColor, and headerHeight
 * @returns Array of handle configuration objects
 */
export function useNodeHandles(options: UseNodeHandlesOptions): HandleConfig[] {
  const { layout, handleColor, headerHeight } = options;

  return useMemo(() => computeHandleConfigs({ layout, handleColor, headerHeight }), [layout, handleColor, headerHeight]);
}
