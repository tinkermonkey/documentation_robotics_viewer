/**
 * CrossLayerFilterPanel Component Stories
 *
 * Allows filtering cross-layer relationships by layer type and relationship type.
 * Provides controls for showing/hiding specific connection types.
 */
import type { Meta, StoryObj } from '@storybook/react';

import { CrossLayerFilterPanel } from '@/apps/embedded/components/CrossLayerFilterPanel';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';
import { LayerType } from '@/core/types/layers';

const meta = {
  title: 'A Primitives / State Panels / CrossLayerFilterPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default filter panel
 * Shows all layers available for filtering
 */
export const Default: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      targetLayerFilters: new Set([LayerType.Application, LayerType.Technology]),
    });

    return (
      <div className="w-full max-w-sm p-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cross-Layer Filters
          </h3>
          <CrossLayerFilterPanel />
        </div>
      </div>
    );
  },
};

/**
 * With all layers selected
 * Shows filter panel with all layer types selected
 */
export const AllLayersSelected: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      targetLayerFilters: new Set([
        LayerType.Motivation,
        LayerType.Business,
        LayerType.Application,
        LayerType.Technology,
        LayerType.Datastore,
      ]),
    });

    return (
      <div className="w-full max-w-sm p-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cross-Layer Filters
          </h3>
          <CrossLayerFilterPanel />
        </div>
      </div>
    );
  },
};

/**
 * With no layers selected
 * Shows filter panel with no selections
 */
export const NoLayersSelected: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      targetLayerFilters: new Set(),
    });

    return (
      <div className="w-full max-w-sm p-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cross-Layer Filters
          </h3>
          <CrossLayerFilterPanel />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            No layers selected - no cross-layer relationships will be shown
          </p>
        </div>
      </div>
    );
  },
};

/**
 * With single layer selected
 * Shows filter with only one layer type selected
 */
export const SingleLayerSelected: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      targetLayerFilters: new Set([LayerType.Application]),
    });

    return (
      <div className="w-full max-w-sm p-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cross-Layer Filters
          </h3>
          <CrossLayerFilterPanel />
        </div>
      </div>
    );
  },
};
