import type { Meta, StoryObj } from '@storybook/react';
import { LayerContainerNode } from '@/core/nodes/LayerContainerNode';
import { createLayerContainerNodeData } from '@catalog/fixtures/nodeDataFixtures';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / Base / LayerContainerNode',
  component: LayerContainerNode,
  decorators: [withReactFlowDecorator({ width: 400, height: 300 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof LayerContainerNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: createLayerContainerNodeData({
      label: 'Business Layer',
      layerType: 'business',
      color: '#4caf50'
    }),
    id: 'container-1',
  },
  render: (args) => <LayerContainerNode {...args} />,
};

export const WithChildren: Story = {
  args: {
    data: createLayerContainerNodeData({
      label: 'Technology Layer',
      layerType: 'technology',
      color: '#2196f3'
    }),
    id: 'container-2',
  },
  render: (args) => (
    <div style={{ position: 'relative', width: '600px', height: '400px' }}>
      <LayerContainerNode {...args} />
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '80px',
          width: '100px',
          height: '80px',
          background: '#fff',
          border: '2px solid #ccc',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px'
        }}
      >
        Child Node
      </div>
    </div>
  ),
};

export const Collapsed: Story = {
  args: {
    data: createLayerContainerNodeData({
      label: 'API Layer',
      layerType: 'api',
      color: '#ff9800'
    }),
    id: 'container-3',
  },
  render: (args) => <LayerContainerNode {...args} />,
};

export const Expanded: Story = {
  args: {
    data: createLayerContainerNodeData({
      label: 'Data Model Layer',
      layerType: 'dataModel',
      color: '#9c27b0'
    }),
    id: 'container-4',
  },
  render: (args) => <LayerContainerNode {...args} />,
};

export const ChangesetAdd: Story = {
  args: {
    data: createLayerContainerNodeData({
      label: 'New Security Layer',
      layerType: 'security',
      color: '#f44336',
      changesetOperation: 'add'
    }),
    id: 'container-5',
  },
  render: (args) => <LayerContainerNode {...args} />,
};

export const MotivationLayer: Story = {
  args: {
    data: createLayerContainerNodeData({
      label: 'Motivation Layer',
      layerType: 'motivation',
      color: '#fbc02d'
    }),
    id: 'container-6',
  },
  render: (args) => <LayerContainerNode {...args} />,
};

export const ApplicationLayer: Story = {
  args: {
    data: createLayerContainerNodeData({
      label: 'Application Layer',
      layerType: 'application',
      color: '#00bcd4'
    }),
    id: 'container-7',
  },
  render: (args) => <LayerContainerNode {...args} />,
};

export const Highlighted: Story = {
  args: {
    data: createLayerContainerNodeData({
      label: 'Highlighted Layer',
      layerType: 'business',
      color: '#4caf50',
      strokeWidth: 3
    }),
    id: 'container-8',
  },
  render: (args) => <LayerContainerNode {...args} />,
};
