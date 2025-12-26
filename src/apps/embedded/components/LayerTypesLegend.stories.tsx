import type { StoryDefault, Story } from '@ladle/react';
import LayerTypesLegend from './LayerTypesLegend';
import type { MetaModel } from '../../../core/types/model';

export default {
  title: 'Components / LayerTypesLegend',
} satisfies StoryDefault;

const mockModel: MetaModel = {
  layers: {
    'motivation': { id: 'motivation', type: 'motivation', name: 'Motivation', elements: Array.from({ length: 5 }, (_, i) => ({ id: `m${i}`, name: `Goal ${i}`, type: 'Goal', layerId: 'motivation', properties: {}, visual: {} })), relationships: [] },
    'business': { id: 'business', type: 'business', name: 'Business', elements: Array.from({ length: 8 }, (_, i) => ({ id: `b${i}`, name: `Req ${i}`, type: 'Requirement', layerId: 'business', properties: {}, visual: {} })), relationships: [] },
  },
  version: '1.0',
  references: {},
};

export const Default: Story = () => (
  <div className="p-4 bg-white border border-gray-200 w-64">
    <LayerTypesLegend model={mockModel} />
  </div>
);

export const ManyTypes: Story = () => {
  const largeModel: MetaModel = {
    layers: {
      'motivation': { id: 'motivation', type: 'motivation', name: 'Motivation', elements: Array.from({ length: 5 }, (_, i) => ({ id: `m${i}`, name: `Goal ${i}`, type: 'Goal', layerId: 'motivation', properties: {}, visual: {} })), relationships: [] },
      'business': { id: 'business', type: 'business', name: 'Business', elements: Array.from({ length: 8 }, (_, i) => ({ id: `b${i}`, name: `Req ${i}`, type: 'Requirement', layerId: 'business', properties: {}, visual: {} })), relationships: [] },
      'application': { id: 'application', type: 'application', name: 'Application', elements: Array.from({ length: 12 }, (_, i) => ({ id: `a${i}`, name: `App ${i}`, type: 'Component', layerId: 'application', properties: {}, visual: {} })), relationships: [] },
    },
    version: '1.0',
    references: {},
  };
  return (
    <div className="p-4 bg-white border border-gray-200 w-64">
      <LayerTypesLegend model={largeModel} />
    </div>
  );
};

export const Empty: Story = () => (
  <div className="p-4 bg-white border border-gray-200 w-64">
    <LayerTypesLegend model={{ layers: {}, version: '1.0', references: {} }} />
  </div>
);
