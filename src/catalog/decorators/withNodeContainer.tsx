import type { ReactNode } from 'react';

/**
 * Options for the node container decorator
 */
export interface NodeContainerOptions {
  showBorder?: boolean;
  backgroundColor?: string;
  borderColor?: string;
}

/**
 * Decorator that wraps a node component in a fixed-size container
 * Essential for React Flow nodes which need specific dimensions
 *
 * Usage:
 * ```typescript
 * import { GOAL_NODE_WIDTH, GOAL_NODE_HEIGHT } from '@core/nodes/motivation/GoalNode';
 *
 * export const GoalNodeStory: Story = () => (
 *   <GoalNode data={goalNodeData} />
 * );
 *
 * GoalNodeStory.decorators = [
 *   withNodeContainer(GOAL_NODE_WIDTH, GOAL_NODE_HEIGHT)
 * ];
 * ```
 *
 * @param width The width of the container in pixels
 * @param height The height of the container in pixels
 * @param options Additional styling options
 * @returns A decorator function that wraps a story component
 */
export const withNodeContainer = (
  width: number,
  height: number,
  options: NodeContainerOptions = {}
) => {
  const {
    showBorder = true,
    backgroundColor = '#f9fafb',
    borderColor = '#e5e7eb'
  } = options;

  return (Story: React.ComponentType<any>): ReactNode => (
    <div
      style={{
        width: width + 40,
        height: height + 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: showBorder ? `1px dashed ${borderColor}` : 'none',
        borderRadius: 8,
        background: backgroundColor,
        padding: 20,
        boxSizing: 'border-box',
        position: 'relative'
      }}
      data-testid="node-container-decorator"
    >
      {/* Inner container to match exact node dimensions */}
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        data-testid="node-inner-container"
      >
        <Story />
      </div>
    </div>
  );
};

/**
 * Decorator that wraps a node in a centered container with grid background
 * Useful for visualizing node placement and alignment
 *
 * @param width The width of the container in pixels
 * @param height The height of the container in pixels
 * @returns A decorator function that wraps a story component
 */
export const withGridContainer = (width: number, height: number) => (Story: React.ComponentType<any>): ReactNode => {
  const gridSize = 20;
  const svgGrid = `url("data:image/svg+xml,%3Csvg width='${gridSize}' height='${gridSize}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M ${gridSize} 0 L 0 0 0 ${gridSize}' fill='none' stroke='%23e5e7eb' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div
      style={{
        width: width + 40,
        height: height + 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed #d1d5db',
        borderRadius: 8,
        background: `${svgGrid}, #ffffff`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        padding: 20,
        boxSizing: 'border-box'
      }}
      data-testid="grid-container-decorator"
    >
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        data-testid="grid-inner-container"
      >
        <Story />
      </div>
    </div>
  );
};

/**
 * Decorator that shows node dimensions with labels
 * Helpful for debugging node sizing issues
 *
 * @param width The width of the container in pixels
 * @param height The height of the container in pixels
 * @returns A decorator function that wraps a story component
 */
export const withDimensionLabels = (width: number, height: number) => (Story: React.ComponentType<any>): ReactNode => (
  <div
    style={{
      position: 'relative',
      display: 'inline-block'
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -20,
        left: 0,
        fontSize: '12px',
        color: '#666666',
        fontFamily: 'monospace'
      }}
    >
      {width}px
    </div>
    <div
      style={{
        position: 'absolute',
        left: -40,
        top: 0,
        fontSize: '12px',
        color: '#666666',
        fontFamily: 'monospace',
        writingMode: 'vertical-rl' as const,
        transform: 'rotate(180deg)'
      }}
    >
      {height}px
    </div>
    {/* Node container */}
    <div
      style={{
        width: width + 40,
        height: height + 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed #e5e7eb',
        borderRadius: 8,
        background: '#f9fafb',
        padding: 20,
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid #d1d5db',
          borderRadius: 4
        }}
      >
        <Story />
      </div>
    </div>
  </div>
);
