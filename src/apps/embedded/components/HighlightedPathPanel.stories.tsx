import type { StoryDefault, Story } from '@ladle/react';
import HighlightedPathPanel from './HighlightedPathPanel';

export default {
  title: 'Panels / HighlightedPathPanel',
} satisfies StoryDefault;

export const WithPath: Story = () => (
  <div className="w-80 bg-white border border-gray-200">
    <HighlightedPathPanel highlightedPath="model.layers.motivation-layer.elements[3]" />
  </div>
);

export const WithLongPath: Story = () => (
  <div className="w-80 bg-white border border-gray-200">
    <HighlightedPathPanel highlightedPath="model.layers.application-layer.elements[42].properties.capabilities[0].operations[2]" />
  </div>
);

export const NoPath: Story = () => (
  <div className="w-80 bg-white border border-gray-200">
    <HighlightedPathPanel highlightedPath={null} />
    <div className="p-4 text-sm text-gray-500">Panel is hidden when path is null</div>
  </div>
);
