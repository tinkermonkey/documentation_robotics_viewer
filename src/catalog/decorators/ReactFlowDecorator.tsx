import { ReactFlowProvider, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ReactElement } from 'react';
import { createElement, isValidElement } from 'react';

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
  /** If true, render story content as edges instead of nodes */
  renderAsEdge?: boolean;
}

/**
 * HOC decorator that wraps a story component with ReactFlowProvider and a configured ReactFlow container.
 * This enables rendering React Flow nodes and edges in isolation for component stories.
 *
 * Note: Storybook and Ladle provide their own error boundary wrappers at the top level, so component
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
export const withReactFlowDecorator = (options: ReactFlowDecoratorOptions = {}) => {
  const {
    width = 200,
    height = 120,
    showBackground = false,
    fitView = false,
    panOnDrag = false,
    zoomOnScroll = false,
    nodesDraggable = false,
    renderAsEdge = false
  } = options;

  return (Story: React.ComponentType<any>): ReactElement => {
    // For edges, we need to render them within the ReactFlow SVG context
    if (renderAsEdge) {
      // Create a single edge instance from the story
      const storyElement = createElement(Story);
      const edgeProps = (isValidElement(storyElement) ? storyElement.props : {}) as Record<string, any>;

      // Get the component type safely
      const edgeComponentType = isValidElement(storyElement) ? storyElement.type : null;
      const edgeTypeName = (edgeComponentType && typeof edgeComponentType === 'object' && 'displayName' in edgeComponentType)
        ? (edgeComponentType as any).displayName
        : 'default';

      // Create a mock edge configuration that ReactFlow can render
      const mockEdge = {
        id: edgeProps.id || 'edge-1',
        source: edgeProps.source || 'source',
        target: edgeProps.target || 'target',
        type: edgeTypeName || 'default',
        data: edgeProps.data,
        animated: edgeProps.animated,
        label: edgeProps.label,
        markerEnd: edgeProps.markerEnd,
        markerStart: edgeProps.markerStart,
        style: edgeProps.style,
      };

      // Create dummy nodes at the source/target positions
      const sourceNode = {
        id: mockEdge.source,
        position: { x: edgeProps.sourceX || 50, y: edgeProps.sourceY || 50 },
        data: {},
        type: 'default',
      };

      const targetNode = {
        id: mockEdge.target,
        position: { x: edgeProps.targetX || 350, y: edgeProps.targetY || 200 },
        data: {},
        type: 'default',
      };

      return (
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
              nodes={[sourceNode, targetNode]}
              edges={[mockEdge]}
              edgeTypes={edgeComponentType ? { [mockEdge.type]: edgeComponentType as any } : {}}
              fitView={fitView}
              panOnDrag={panOnDrag}
              zoomOnScroll={zoomOnScroll}
              minZoom={0.5}
              maxZoom={4}
              nodesDraggable={false}
              elementsSelectable={false}
              nodesFocusable={false}
            >
              {/* Edges are rendered by ReactFlow itself */}
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      );
    }

    // For nodes, render them in a div overlay
    return (
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
};
