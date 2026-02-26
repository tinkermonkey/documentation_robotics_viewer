/**
 * CrossLayerPanel Component Stories
 *
 * Main container panel for cross-layer relationship visualization and management.
 * Combines relationship display, filtering, and navigation controls.
 */
import type { Meta, StoryObj } from '@storybook/react';

import { CrossLayerPanel } from '@/apps/embedded/components/CrossLayerPanel';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';

const meta = {
  title: 'A Primitives / Panels and Sidebars / CrossLayerPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default cross-layer panel
 * Shows the panel with typical cross-layer relationships
 */
export const Default: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      targetLayerFilters: new Set(['application', 'technology']),
      relationshipTypeFilters: new Set(),
    });

    return (
      <div className="w-full max-w-2xl h-96 p-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg h-full flex flex-col">
          <CrossLayerPanel />
        </div>
      </div>
    );
  },
};

/**
 * Expanded view
 * Shows the panel in an expanded state with full content
 */
export const Expanded: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      targetLayerFilters: new Set(['business', 'application', 'technology', 'infrastructure']),
      relationshipTypeFilters: new Set(),
    });

    return (
      <div className="w-full max-w-3xl h-96 p-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg h-full flex flex-col">
          <CrossLayerPanel />
        </div>
      </div>
    );
  },
};

/**
 * Minimal view
 * Shows the panel in a compact state
 */
export const Compact: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      targetLayerFilters: new Set(['technology']),
      relationshipTypeFilters: new Set(),
    });

    return (
      <div className="w-full max-w-md h-60 p-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg h-full flex flex-col">
          <CrossLayerPanel />
        </div>
      </div>
    );
  },
};

/**
 * Hidden state
 * Shows the panel when visibility is toggled off
 */
export const Hidden: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: false,
      targetLayerFilters: new Set(),
    });

    return (
      <div className="w-full max-w-2xl p-4">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cross-layer panel is hidden when no element is selected
          </p>
          <CrossLayerPanel />
        </div>
      </div>
    );
  },
};

/**
 * Loading state
 * Shows the panel while cross-layer data is loading
 */
export const Loading: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      targetLayerFilters: new Set(['application']),
    });

    return (
      <div className="w-full max-w-2xl h-96 p-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg h-full flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border border-blue-500 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading cross-layer relationships...
            </p>
          </div>
        </div>
      </div>
    );
  },
};
