import type { StoryDefault, Story } from '@ladle/react';
import ModelJSONViewer from './ModelJSONViewer';
import type { MetaModel } from '../../../core/types/model';

export default {
  title: 'Components / ModelJSONViewer',
} satisfies StoryDefault;

const mockModel: MetaModel = {
  layers: {
    'motivation-layer': {
      id: 'motivation-layer',
      type: 'motivation',
      name: 'Motivation',
      elements: [
        {
          id: 'goal-1',
          type: 'Goal',
          name: 'Improve Customer Satisfaction',
          layerId: 'motivation-layer',
          properties: { priority: 'high', status: 'active' },
          visual: {},
        },
        {
          id: 'goal-2',
          type: 'Goal',
          name: 'Reduce Operational Costs',
          layerId: 'motivation-layer',
          properties: { priority: 'medium', status: 'active' },
          visual: {},
        },
      ],
      relationships: [
        { id: 'r1', sourceId: 'goal-1', targetId: 'goal-2', type: 'influences' },
      ],
    },
    'business-layer': {
      id: 'business-layer',
      type: 'business',
      name: 'Business',
      elements: [
        {
          id: 'process-1',
          type: 'BusinessProcess',
          name: 'Order Processing',
          layerId: 'business-layer',
          properties: { automated: true },
          visual: {},
        },
      ],
      relationships: [],
    },
  },
  version: '1.0',
  references: {},
};

export const Default: Story = () => (
  <div className="w-full max-w-4xl p-4 bg-gray-50">
    <ModelJSONViewer model={mockModel} selectedLayer={null} />
  </div>
);

export const WithSelectedLayer: Story = () => (
  <div className="w-full max-w-4xl p-4 bg-gray-50">
    <ModelJSONViewer model={mockModel} selectedLayer="motivation-layer" />
  </div>
);

export const WithPathHighlight: Story = () => (
  <div className="w-full max-w-4xl p-4 bg-gray-50">
    <ModelJSONViewer
      model={mockModel}
      selectedLayer={null}
      onPathHighlight={(path) => console.log('Path highlighted:', path)}
    />
  </div>
);
