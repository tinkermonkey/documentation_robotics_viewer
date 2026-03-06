import type { Meta, StoryObj } from '@storybook/react';
import LayerTypesLegend from '@/apps/embedded/components/LayerTypesLegend';
import { LayerType } from '@/core/types/layers';
import type { MetaModel } from '@/core/types/model';

const meta = {
  title: 'Graphs / Panels / LayerTypesLegend',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function makeLayer(type: LayerType, count: number) {
  return {
    id: type,
    type,
    name: type,
    elements: Array.from({ length: count }, (_, i) => ({
      id: `${type}-${i}`,
      name: `${type} Element ${i}`,
      type,
      layerId: type,
      properties: {},
      visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
    })),
    relationships: [],
  };
}

const twoLayerModel: MetaModel = {
  layers: {
    [LayerType.Motivation]: makeLayer(LayerType.Motivation, 6),
    [LayerType.Business]: makeLayer(LayerType.Business, 9),
  },
  references: [],
};

export const Default: Story = {
  render: () => (
    <div className="p-4 bg-white border border-gray-200 w-64">
      <LayerTypesLegend model={twoLayerModel} />
    </div>
  ),
};

const allLayersModel: MetaModel = {
  layers: {
    [LayerType.Motivation]: makeLayer(LayerType.Motivation, 6),
    [LayerType.Business]: makeLayer(LayerType.Business, 9),
    [LayerType.Security]: makeLayer(LayerType.Security, 4),
    [LayerType.Application]: makeLayer(LayerType.Application, 11),
    [LayerType.Technology]: makeLayer(LayerType.Technology, 7),
    [LayerType.Api]: makeLayer(LayerType.Api, 5),
    [LayerType.DataModel]: makeLayer(LayerType.DataModel, 8),
    [LayerType.Ux]: makeLayer(LayerType.Ux, 3),
    [LayerType.Navigation]: makeLayer(LayerType.Navigation, 2),
    [LayerType.ApmObservability]: makeLayer(LayerType.ApmObservability, 6),
  },
  references: [],
};

export const AllLayers: Story = {
  render: () => (
    <div className="p-4 bg-white border border-gray-200 w-64">
      <LayerTypesLegend model={allLayersModel} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="p-4 bg-white border border-gray-200 w-64">
      <LayerTypesLegend model={{ layers: {}, references: [] }} />
    </div>
  ),
};
