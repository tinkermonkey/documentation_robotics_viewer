/**
 * FloatingChatPanel Component Stories
 *
 * Draggable, resizable floating chat panel that hovers over the main content.
 * Users can move, resize, minimize, and close the panel.
 */
import type { Meta, StoryObj } from '@storybook/react';

import { FloatingChatPanel } from '@/apps/embedded/components/FloatingChatPanel';
import { useFloatingChatStore } from '@/apps/embedded/stores/floatingChatStore';

const meta = {
  title: 'A Primitives / Panels and Sidebars / FloatingChatPanel',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Floating panel in default position
 * Shows the chat panel floating over the main content area
 */
export const Default: Story = {
  render: () => {
    useFloatingChatStore.setState({
      isOpen: true,
      isMinimized: false,
      position: { x: 500, y: 200 },
      size: { width: 400, height: 500 },
    });

    return (
      <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center overflow-hidden">
        {/* Background content */}
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="grid grid-cols-3 gap-4 p-8 h-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow"></div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow"></div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow"></div>
          </div>
        </div>

        {/* Floating chat panel */}
        <FloatingChatPanel />
      </div>
    );
  },
};

/**
 * Minimized panel
 * Shows the chat panel in a minimized/collapsed state
 */
export const Minimized: Story = {
  render: () => {
    useFloatingChatStore.setState({
      isOpen: true,
      isMinimized: true,
      position: { x: 100, y: 100 },
      size: { width: 350, height: 500 },
    });

    return (
      <div className="h-screen w-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <FloatingChatPanel />
      </div>
    );
  },
};

/**
 * Top-right corner positioning
 * Shows the panel positioned in the top-right area
 */
export const TopRight: Story = {
  render: () => {
    useFloatingChatStore.setState({
      isOpen: true,
      isMinimized: false,
      position: { x: window.innerWidth - 420, y: 20 },
      size: { width: 400, height: 500 },
    });

    return (
      <div className="h-screen w-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
        <FloatingChatPanel />
      </div>
    );
  },
};

/**
 * Bottom-left corner positioning
 * Shows the panel positioned in the bottom-left area
 */
export const BottomLeft: Story = {
  render: () => {
    useFloatingChatStore.setState({
      isOpen: true,
      isMinimized: false,
      position: { x: 20, y: window.innerHeight - 520 },
      size: { width: 350, height: 500 },
    });

    return (
      <div className="h-screen w-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
        <FloatingChatPanel />
      </div>
    );
  },
};

/**
 * Closed/hidden state
 * Shows that the panel is not displayed when closed
 */
export const Closed: Story = {
  render: () => {
    useFloatingChatStore.setState({
      isOpen: false,
      isMinimized: false,
      position: { x: 500, y: 200 },
      size: { width: 400, height: 500 },
    });

    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Chat panel is closed
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            (FloatingChatPanel will not render when isOpen is false)
          </p>
        </div>
      </div>
    );
  },
};

/**
 * Compact size
 * Shows the panel in a smaller, compact size
 */
export const CompactSize: Story = {
  render: () => {
    useFloatingChatStore.setState({
      isOpen: true,
      isMinimized: false,
      position: { x: 10, y: 10 },
      size: { width: 300, height: 400 },
    });

    return (
      <div className="h-screen w-screen bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-gray-900 dark:to-gray-800">
        <FloatingChatPanel />
      </div>
    );
  },
};
