import type { StoryDefault, Story } from '@ladle/react';
import GraphStatisticsPanel from './GraphStatisticsPanel';
import type { MetaModel } from '../../../core/types/model';

export default {
  title: 'Panels / GraphStatisticsPanel',
} satisfies StoryDefault;

const mockModelSmall: MetaModel = {
  layers: {
    'motivation-layer': {
      id: 'motivation-layer',
      type: 'motivation',
      name: 'Motivation',
      elements: [
        { id: '1', type: 'Goal', name: 'Goal 1', layerId: 'motivation-layer', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } },
        { id: '2', type: 'Goal', name: 'Goal 2', layerId: 'motivation-layer', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } },
      ],
      relationships: [
        { id: 'r1', sourceId: '1', targetId: '2', type: 'influences' },
      ],
    },
  },
  version: '1.0',
  references: [],
};

const mockModelLarge: MetaModel = {
  layers: {
    'motivation-layer': {
      id: 'motivation-layer',
      type: 'motivation',
      name: 'Motivation',
      elements: Array.from({ length: 25 }, (_, i) => ({
        id: `goal-${i}`,
        type: 'Goal',
        name: `Goal ${i + 1}`,
        layerId: 'motivation-layer',
        properties: {},
        visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} },
      })),
      relationships: Array.from({ length: 40 }, (_, i) => ({
        id: `r-${i}`,
        sourceId: `goal-${i % 25}`,
        targetId: `goal-${(i + 1) % 25}`,
        type: 'influences',
      })),
    },
    'business-layer': {
      id: 'business-layer',
      type: 'business',
      name: 'Business',
      elements: Array.from({ length: 30 }, (_, i) => ({
        id: `process-${i}`,
        type: 'BusinessProcess',
        name: `Process ${i + 1}`,
        layerId: 'business-layer',
        properties: {},
        visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} },
      })),
      relationships: Array.from({ length: 35 }, (_, i) => ({
        id: `rb-${i}`,
        sourceId: `process-${i % 30}`,
        targetId: `process-${(i + 1) % 30}`,
        type: 'flow',
      })),
    },
    'application-layer': {
      id: 'application-layer',
      type: 'application',
      name: 'Application',
      elements: Array.from({ length: 20 }, (_, i) => ({
        id: `app-${i}`,
        type: 'ApplicationComponent',
        name: `Component ${i + 1}`,
        layerId: 'application-layer',
        properties: {},
        visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} },
      })),
      relationships: Array.from({ length: 28 }, (_, i) => ({
        id: `ra-${i}`,
        sourceId: `app-${i % 20}`,
        targetId: `app-${(i + 1) % 20}`,
        type: 'serves',
      })),
    },
  },
  version: '1.0',
  references: [],
};

export const SmallGraph: Story = () => (
  <div className="w-80 bg-white">
    <GraphStatisticsPanel model={mockModelSmall} />
  </div>
);

export const LargeGraph: Story = () => (
  <div className="w-80 bg-white">
    <GraphStatisticsPanel model={mockModelLarge} />
  </div>
);

export const EmptyGraph: Story = () => (
  <div className="w-80 bg-white">
    <GraphStatisticsPanel model={{ layers: {}, version: '1.0', references: [] }} />
  </div>
);

export const InSidebar: Story = () => (
  <div className="w-80 bg-gray-50 border border-gray-200">
    <div className="p-4 bg-white">
      <h3 className="text-lg font-semibold mb-2">Graph View</h3>
      <p className="text-sm text-gray-600">Other sidebar content here...</p>
    </div>
    <GraphStatisticsPanel model={mockModelLarge} />
  </div>
);
