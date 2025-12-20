import { ReactFlowProvider, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ReactNode } from 'react';

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
 * This enables rendering React Flow nodes and edges in isolation for component stories.
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
export const withReactFlowDecorator = (options: ReactFlowDecoratorOptions = {}) => {
  const {
    width = 200,
    height = 120,
    showBackground = false,
    fitView = false,
    panOnDrag = false,
    zoomOnScroll = false,
    nodesDraggable = false
  } = options;

  return (Story: React.ComponentType<any>): ReactNode => (
    <ReactFlowProvider>
      <div
        style={{
          width: width + 40,
          height: height + 40,
          border: '1px dashed #e5e7eb',
          borderRadius: 8,
          padding: 20,
          background: showBackground ? '#f9fafb' : 'transparent',
          position: 'relative',
          overflow: 'hidden'
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
          minZoom={0.5}
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
