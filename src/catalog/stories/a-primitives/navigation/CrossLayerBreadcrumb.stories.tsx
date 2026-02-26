/**
 * CrossLayerBreadcrumb Component Stories
 *
 * Navigation breadcrumb for cross-layer relationship traversal.
 * Helps users understand their current position in layer navigation.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { CrossLayerBreadcrumb } from '@/apps/embedded/components/CrossLayerBreadcrumb';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';

const meta = {
  title: 'A Primitives / Navigation / CrossLayerBreadcrumb',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single layer breadcrumb
 * Shows navigation from one layer
 */
export const SingleLayer: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      sourceElementId: 'elem-1',
      targetLayerFilters: ['application'],
      navigationHistory: [],
    });

    return (
      <div className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded">
        <div className="max-w-2xl">
          <CrossLayerBreadcrumb data-testid="cross-layer-breadcrumb-single" />
        </div>
      </div>
    );
  },
};

/**
 * Multiple layer breadcrumb
 * Shows navigation through several layers
 */
export const MultipleLayers: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: true,
      sourceElementId: 'elem-1',
      targetLayerFilters: ['business', 'application', 'technology'],
      navigationHistory: [
        { elementId: 'elem-1', layerType: 'business' },
        { elementId: 'elem-2', layerType: 'application' },
      ],
    });

    return (
      <div className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded">
        <div className="max-w-2xl">
          <CrossLayerBreadcrumb data-testid="cross-layer-breadcrumb-multiple" />
        </div>
      </div>
    );
  },
};

/**
 * Empty breadcrumb
 * Shows the breadcrumb when no cross-layer navigation is active
 */
export const Empty: Story = {
  render: () => {
    useCrossLayerStore.setState({
      visible: false,
      sourceElementId: null,
      targetLayerFilters: [],
      navigationHistory: [],
    });

    return (
      <div className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded">
        <div className="max-w-2xl text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No cross-layer navigation active
          </p>
          <CrossLayerBreadcrumb data-testid="cross-layer-breadcrumb-empty" />
        </div>
      </div>
    );
  },
};
