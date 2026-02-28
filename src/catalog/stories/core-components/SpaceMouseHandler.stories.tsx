/**
 * SpaceMouseHandler Component Stories
 *
 * SpaceMouseHandler enables 3D mouse (SpaceMouse) input for React Flow navigation.
 * It handles gamepad input and translates it to viewport pan and zoom operations.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SpaceMouseHandler } from '@/core/components/SpaceMouseHandler';

const meta = {
  title: 'Core Components / SpaceMouseHandler',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default configuration with standard sensitivity and deadzone
 * Shows debug information when a SpaceMouse is connected
 */
export const Default: Story = {
  render: () => (
    <ReactFlowProvider>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <ReactFlow
          nodes={[]}
          edges={[]}
          minZoom={0.1}
          maxZoom={4}
          panOnDrag
          zoomOnScroll
        >
          <SpaceMouseHandler debug={true} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  ),
};

/**
 * High sensitivity for quick navigation
 */
export const HighSensitivity: Story = {
  render: () => (
    <ReactFlowProvider>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <ReactFlow
          nodes={[]}
          edges={[]}
          minZoom={0.1}
          maxZoom={4}
          panOnDrag
          zoomOnScroll
        >
          <SpaceMouseHandler sensitivity={20} debug={true} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  ),
};

/**
 * Low sensitivity for precise control
 */
export const LowSensitivity: Story = {
  render: () => (
    <ReactFlowProvider>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <ReactFlow
          nodes={[]}
          edges={[]}
          minZoom={0.1}
          maxZoom={4}
          panOnDrag
          zoomOnScroll
        >
          <SpaceMouseHandler sensitivity={5} debug={true} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  ),
};

/**
 * Large deadzone to ignore small movements
 */
export const LargeDeadzone: Story = {
  render: () => (
    <ReactFlowProvider>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <ReactFlow
          nodes={[]}
          edges={[]}
          minZoom={0.1}
          maxZoom={4}
          panOnDrag
          zoomOnScroll
        >
          <SpaceMouseHandler deadzone={0.15} debug={true} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  ),
};

/**
 * Silent mode without debug information
 * (Useful for production environments or clean UI)
 */
export const SilentMode: Story = {
  render: () => (
    <ReactFlowProvider>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            SpaceMouseHandler - Silent Mode
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Connect a SpaceMouse device to see it in action.
            <br />
            Debug info is hidden in silent mode.
          </p>
        </div>
        <ReactFlow
          nodes={[]}
          edges={[]}
          minZoom={0.1}
          maxZoom={4}
          panOnDrag
          zoomOnScroll
        >
          <SpaceMouseHandler debug={false} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  ),
};
