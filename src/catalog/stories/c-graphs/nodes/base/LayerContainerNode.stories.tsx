import type { Meta, StoryObj } from '@storybook/react';
import { LayerContainerNode } from '@/core/nodes/LayerContainerNode';
import { createLayerContainerNodeData } from '@catalog/fixtures/nodeDataFixtures';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / Base / LayerContainerNode',
  decorators: [withReactFlowDecorator({ width: 400, height: 300 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Business Layer',
      layerType: 'business',
      color: '#4caf50'
    });
    return <LayerContainerNode data={data} id="container-1" />;
  },
};

export const WithChildren: Story = {
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Technology Layer',
      layerType: 'technology',
      color: '#2196f3'
    });
    return (
      <div style={{ position: 'relative', width: '600px', height: '400px' }}>
        <LayerContainerNode data={data} id="container-2" />
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
    );
  },
};

export const Collapsed: Story = {
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'API Layer',
      layerType: 'api',
      color: '#ff9800'
    });
    return <LayerContainerNode data={data} id="container-3" />;
  },
};

export const Expanded: Story = {
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Data Model Layer',
      layerType: 'dataModel',
      color: '#9c27b0'
    });
    return <LayerContainerNode data={data} id="container-4" />;
  },
};

export const ChangesetAdd: Story = {
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'New Security Layer',
      layerType: 'security',
      color: '#f44336',
      changesetOperation: 'add'
    });
    return <LayerContainerNode data={data} id="container-5" />;
  },
};

export const MotivationLayer: Story = {
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Motivation Layer',
      layerType: 'motivation',
      color: '#fbc02d'
    });
    return <LayerContainerNode data={data} id="container-6" />;
  },
};

export const ApplicationLayer: Story = {
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Application Layer',
      layerType: 'application',
      color: '#00bcd4'
    });
    return <LayerContainerNode data={data} id="container-7" />;
  },
};

export const Highlighted: Story = {
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Highlighted Layer',
      layerType: 'business',
      color: '#4caf50',
      strokeWidth: 3
    });
    return <LayerContainerNode data={data} id="container-8" />;
  },
};
