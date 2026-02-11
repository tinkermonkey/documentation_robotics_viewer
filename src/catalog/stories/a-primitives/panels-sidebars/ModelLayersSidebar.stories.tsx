import type { Meta, StoryObj } from '@storybook/react';
import ModelLayersSidebar from '@/apps/embedded/components/ModelLayersSidebar';
import { useModelStore } from '@/core/stores/modelStore';
import type { MetaModel } from '@/core/types/model';
import { useEffect } from 'react';

const meta = {
  title: 'A Primitives / Panels and Sidebars / ModelLayersSidebar',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const mockModel: MetaModel = {
  version: '1.0',
  references: [],
  layers: {
    'motivation': {
      id: 'motivation',
      type: 'motivation',
      name: 'Motivation',
      order: 1,
      elements: Array.from({ length: 12 }, (_, i) => ({ id: `m${i}`, type: 'Goal', name: `Goal ${i}`, layerId: 'motivation', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } })),
      relationships: [],
    },
    'business': {
      id: 'business',
      type: 'business',
      name: 'Business',
      order: 2,
      elements: Array.from({ length: 25 }, (_, i) => ({ id: `b${i}`, type: 'BusinessProcess', name: `Process ${i}`, layerId: 'business', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } })),
      relationships: [],
    },
    'application': {
      id: 'application',
      type: 'application',
      name: 'Application',
      order: 3,
      elements: Array.from({ length: 18 }, (_, i) => ({ id: `a${i}`, type: 'ApplicationComponent', name: `Component ${i}`, layerId: 'application', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } })),
      relationships: [],
    },
    'technology': {
      id: 'technology',
      type: 'technology',
      name: 'Technology',
      order: 4,
      elements: Array.from({ length: 30 }, (_, i) => ({ id: `t${i}`, type: 'Node', name: `Node ${i}`, layerId: 'technology', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } })),
      relationships: [],
    },
  },
};

export const Default: Story = {
  render: () => (
    useEffect(() => {
    useModelStore.setState({ model: mockModel });
  }, []);

  return (
    <div className="w-64 bg-white border border-gray-200">
      <ModelLayersSidebar
        selectedLayerId={null}
        onSelectLayer={(id) => console.log('Selected layer:', id)}
      />
    </div>
  );
  ),
};

export const WithSelection: Story = {
  render: () => (
    useEffect(() => {
    useModelStore.setState({ model: mockModel });
  }, []);

  return (
    <div className="w-64 bg-white border border-gray-200">
      <ModelLayersSidebar
        selectedLayerId="business"
        onSelectLayer={(id) => console.log('Selected layer:', id)}
      />
    </div>
  );
  ),
};

export const EmptyModel: Story = {
  render: () => {
  useEffect(() => {
    useModelStore.setState({ model: { version: '1.0', references: [], layers: {} } });
  }, []);

  return (
    <div className="w-64 bg-white border border-gray-200">
      <ModelLayersSidebar
        selectedLayerId={null}
        onSelectLayer={(id) => console.log('Selected layer:', id)}
      />
    </div>
  );
  },
};
