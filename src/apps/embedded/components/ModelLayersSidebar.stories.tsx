import type { StoryDefault, Story } from '@ladle/react';
import ModelLayersSidebar from './ModelLayersSidebar';
import { useModelStore } from '../../../core/stores/modelStore';
import type { MetaModel } from '../../../core/types/model';
import { useEffect } from 'react';

export default {
  title: 'Components / ModelLayersSidebar',
} satisfies StoryDefault;

const mockModel: MetaModel = {
  layers: {
    'motivation': {
      id: 'motivation',
      type: 'motivation',
      name: 'Motivation',
      order: 1,
      elements: Array.from({ length: 12 }, (_, i) => ({ id: `m${i}`, name: `Goal ${i}` })),
    },
    'business': {
      id: 'business',
      type: 'business',
      name: 'Business',
      order: 2,
      elements: Array.from({ length: 25 }, (_, i) => ({ id: `b${i}`, name: `Process ${i}` })),
    },
    'application': {
      id: 'application',
      type: 'application',
      name: 'Application',
      order: 3,
      elements: Array.from({ length: 18 }, (_, i) => ({ id: `a${i}`, name: `Component ${i}` })),
    },
    'technology': {
      id: 'technology',
      type: 'technology',
      name: 'Technology',
      order: 4,
      elements: Array.from({ length: 30 }, (_, i) => ({ id: `t${i}`, name: `Node ${i}` })),
    },
  },
};

export const Default: Story = () => {
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
};

export const WithSelection: Story = () => {
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
};

export const EmptyModel: Story = () => {
  useEffect(() => {
    useModelStore.setState({ model: { layers: {} } });
  }, []);

  return (
    <div className="w-64 bg-white border border-gray-200">
      <ModelLayersSidebar
        selectedLayerId={null}
        onSelectLayer={(id) => console.log('Selected layer:', id)}
      />
    </div>
  );
};
