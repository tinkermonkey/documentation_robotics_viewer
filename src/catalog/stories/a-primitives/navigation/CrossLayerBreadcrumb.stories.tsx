/**
 * CrossLayerBreadcrumb Component Stories
 *
 * Navigation breadcrumb for cross-layer relationship traversal.
 * Helps users understand their current position in layer navigation.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { CrossLayerBreadcrumb } from '@/apps/embedded/components/CrossLayerBreadcrumb';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';
import { LayerType } from '@/core/types/layers';

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
      navigationHistory: [
        { layerId: LayerType.Application, elementId: 'elem-1', elementName: 'Application Component', timestamp: Date.now() },
      ],
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
      navigationHistory: [
        { layerId: LayerType.Business, elementId: 'elem-1', elementName: 'Business Process', timestamp: Date.now() - 1000 },
        { layerId: LayerType.Application, elementId: 'elem-2', elementName: 'Application Service', timestamp: Date.now() },
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
