import type { Meta, StoryObj } from '@storybook/react';
import LayerTypesLegend from '@/apps/embedded/components/LayerTypesLegend';
import type { MetaModel } from '@/core/types/model';

const meta = {
  title: 'A Primitives / State Panels / LayerTypesLegend',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const mockModel: MetaModel = {
  layers: {
    'motivation': { id: 'motivation', type: 'motivation', name: 'Motivation', elements: Array.from({ length: 5 }, (_, i) => ({ id: `m${i}`, name: `Goal ${i}`, type: 'Goal', layerId: 'motivation', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } })), relationships: [] },
    'business': { id: 'business', type: 'business', name: 'Business', elements: Array.from({ length: 8 }, (_, i) => ({ id: `b${i}`, name: `Req ${i}`, type: 'Requirement', layerId: 'business', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } })), relationships: [] },
  },
  version: '1.0',
  references: [],
};

export const Default: Story = {
  render: () => (
    <div className="p-4 bg-white border border-gray-200 w-64">
    <LayerTypesLegend model={mockModel} />
  </div>
  ),
};

export const ManyTypes: Story = {
  render: () => {
  const largeModel: MetaModel = {
    layers: {
      'motivation': { id: 'motivation', type: 'motivation', name: 'Motivation', elements: Array.from({ length: 5 }, (_, i) => ({ id: `m${i}`, name: `Goal ${i}`, type: 'Goal', layerId: 'motivation', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } })), relationships: [] },
      'business': { id: 'business', type: 'business', name: 'Business', elements: Array.from({ length: 8 }, (_, i) => ({ id: `b${i}`, name: `Req ${i}`, type: 'Requirement', layerId: 'business', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } })), relationships: [] },
      'application': { id: 'application', type: 'application', name: 'Application', elements: Array.from({ length: 12 }, (_, i) => ({ id: `a${i}`, name: `App ${i}`, type: 'Component', layerId: 'application', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } })), relationships: [] },
    },
    version: '1.0',
    references: [],
  };
  return (
    <div className="p-4 bg-white border border-gray-200 w-64">
      <LayerTypesLegend model={largeModel} />
    </div>
  );
  },
};

export const Empty: Story = {
  render: () => (
    <div className="p-4 bg-white border border-gray-200 w-64">
    <LayerTypesLegend model={{ layers: {}, version: '1.0', references: [] }} />
  </div>
  ),
};
