import type { StoryDefault, Story } from '@ladle/react';
import { LayerContainerNode } from '@/core/nodes/LayerContainerNode';
import { createLayerContainerNodeData } from '@/catalog/fixtures/nodeDataFixtures';

export default {
  title: 'C - Graphs / Nodes / Base / LayerContainerNode',
} satisfies StoryDefault;

export const Default: Story = () => {
  const data = createLayerContainerNodeData({
    label: 'Business Layer',
    layerType: 'business',
    color: '#4caf50'
  });
  return <LayerContainerNode data={data} id="container-1" />;
};

export const WithChildren: Story = () => {
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
};

export const Collapsed: Story = () => {
  const data = createLayerContainerNodeData({
    label: 'API Layer',
    layerType: 'api',
    color: '#ff9800'
  });
  return <LayerContainerNode data={data} id="container-3" />;
};

export const Expanded: Story = () => {
  const data = createLayerContainerNodeData({
    label: 'Data Model Layer',
    layerType: 'dataModel',
    color: '#9c27b0'
  });
  return <LayerContainerNode data={data} id="container-4" />;
};

export const ChangesetAdd: Story = () => {
  const data = createLayerContainerNodeData({
    label: 'New Security Layer',
    layerType: 'security',
    color: '#f44336',
    changesetOperation: 'add'
  });
  return <LayerContainerNode data={data} id="container-5" />;
};

export const MotivationLayer: Story = () => {
  const data = createLayerContainerNodeData({
    label: 'Motivation Layer',
    layerType: 'motivation',
    color: '#fbc02d'
  });
  return <LayerContainerNode data={data} id="container-6" />;
};

export const ApplicationLayer: Story = () => {
  const data = createLayerContainerNodeData({
    label: 'Application Layer',
    layerType: 'application',
    color: '#00bcd4'
  });
  return <LayerContainerNode data={data} id="container-7" />;
};
