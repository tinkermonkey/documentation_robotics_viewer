import { ReactFlowProvider, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ReactElement } from 'react';

/**
 * Options for ReactFlowDecorator
 */
export interface ReactFlowDecoratorOptions {
  width?: number;
  height?: number;
  showBackground?: boolean;
  fitView?: boolean;
  panOnDrag?: boolean;
  zoomOnScroll?: boolean;
  nodesDraggable?: boolean;
}

/**
 * HOC decorator that wraps a story component with ReactFlowProvider and a configured ReactFlow container.
 * This enables rendering React Flow nodes in isolation for component stories.
 *
 * Note: Storybook provides an error boundary wrapper at the top level, so component
 * errors will be caught and displayed by the story framework. If a Story component throws, the error
 * will be caught by the framework's error boundary.
 *
 * Usage:
 * ```typescript
 * export const NodeStory: Story = () => (
 *   <GoalNode data={goalNodeData} />
 * );
 *
 * NodeStory.decorators = [
 *   withReactFlowDecorator({ width: 180, height: 100 })
 * ];
 * ```
 *
 * @param options Configuration options for the decorator
 * @returns A decorator function that wraps a story component
 */
export const withReactFlowDecorator = (
  options: ReactFlowDecoratorOptions = {}
) => {
  const {
    showBackground = false,
    fitView = false,
    panOnDrag = false,
    zoomOnScroll = false,
    nodesDraggable = false,
  } = options;

  return (Story: React.ComponentType<any>): ReactElement => (
    <ReactFlowProvider>
      <div
        style={{
          width: '100%',
          height: '100vh',
          background: showBackground ? '#f9fafb' : 'transparent',
        }}
        data-testid="react-flow-decorator-container"
      >
        <ReactFlow
          nodes={[]}
          edges={[]}
          fitView={fitView}
          panOnDrag={panOnDrag}
          zoomOnScroll={zoomOnScroll}
          nodesDraggable={nodesDraggable}
          minZoom={0.1}
          maxZoom={4}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <Story />
            </div>
          </div>
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};
