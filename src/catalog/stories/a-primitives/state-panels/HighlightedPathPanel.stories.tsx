import type { Meta, StoryObj } from '@storybook/react';
import HighlightedPathPanel from '@/apps/embedded/components/HighlightedPathPanel';

const meta = {
  title: 'A Primitives / State Panels / HighlightedPathPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const WithPath: Story = {
  render: () => (
    <div className="w-80 bg-white border border-gray-200">
    <HighlightedPathPanel highlightedPath="model.layers.motivation-layer.elements[3]" />
  </div>
  ),
};

export const WithLongPath: Story = {
  render: () => (
    <div className="w-80 bg-white border border-gray-200">
    <HighlightedPathPanel highlightedPath="model.layers.application-layer.elements[42].properties.capabilities[0].operations[2]" />
  </div>
  ),
};

export const NoPath: Story = {
  render: () => (
    <div className="w-80 bg-white border border-gray-200">
    <HighlightedPathPanel highlightedPath={null} />
    <div className="p-4 text-sm text-gray-500">Panel is hidden when path is null</div>
  </div>
  ),
};
