import type { Meta, StoryObj } from '@storybook/react';
import { LayerContainerNode } from '@/core/nodes/LayerContainerNode';
import { createLayerContainerNodeData } from '@catalog/fixtures/nodeDataFixtures';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'Graphs / Nodes / Base / LayerContainerNode',
  component: LayerContainerNode,
  decorators: [withReactFlowDecorator({ width: 400, height: 300 })],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {},
} satisfies Meta<typeof LayerContainerNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: createLayerContainerNodeData({ label: 'Business Layer', layerType: 'business' }),
    id: 'container-1',
  },
};

export const WithChildren: Story = {
  args: {
    data: createLayerContainerNodeData({ label: 'Technology Layer', layerType: 'technology' }),
    id: 'container-2',
  },
};

export const Collapsed: Story = {
  args: {
    data: createLayerContainerNodeData({ label: 'API Layer', layerType: 'api' }),
    id: 'container-3',
  },
};

export const Expanded: Story = {
  args: {
    data: createLayerContainerNodeData({ label: 'Data Model Layer', layerType: 'dataModel' }),
    id: 'container-4',
  },
};

export const MotivationLayer: Story = {
  args: {
    data: createLayerContainerNodeData({ label: 'Motivation Layer', layerType: 'motivation' }),
    id: 'container-6',
  },
};

export const ApplicationLayer: Story = {
  args: {
    data: createLayerContainerNodeData({ label: 'Application Layer', layerType: 'application' }),
    id: 'container-7',
  },
};

export const Highlighted: Story = {
  args: {
    data: createLayerContainerNodeData({ label: 'Business Layer', layerType: 'business', strokeWidth: 3 }),
    id: 'container-8',
  },
};
