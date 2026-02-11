// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { MotivationControlPanel } from '@/apps/embedded/components/MotivationControlPanel';

const meta = {
  title: 'A Primitives / Panels and Sidebars / MotivationControlPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="w-96 p-4 bg-white border border-gray-200">
    <MotivationControlPanel
      selectedLayout="force"
      onLayoutChange={(layout) => console.log('Layout changed:', layout)}
      onFitToView={() => console.log('Fit to view')}
      focusModeEnabled={false}
      onFocusModeToggle={(enabled) => console.log('Focus mode:', enabled)}
      onClearHighlighting={() => console.log('Clear highlighting')}
      isHighlightingActive={false}
      isLayouting={false}
      changesetVisualizationEnabled={false}
      onChangesetVisualizationToggle={(enabled) => console.log('Changeset viz:', enabled)}
      hasChangesets={true}
      onExportPNG={() => console.log('Export PNG')}
      onExportSVG={() => console.log('Export SVG')}
      onExportGraphData={() => console.log('Export JSON')}
      onExportTraceabilityReport={() => console.log('Export traceability')}
    />
  </div>
  ),
};

export const WithFocusMode: Story = {
  render: () => (
    <div className="w-96 p-4 bg-white border border-gray-200">
    <MotivationControlPanel
      selectedLayout="hierarchical"
      onLayoutChange={(layout) => console.log('Layout changed:', layout)}
      onFitToView={() => console.log('Fit to view')}
      focusModeEnabled={true}
      onFocusModeToggle={(enabled) => console.log('Focus mode:', enabled)}
      onClearHighlighting={() => console.log('Clear highlighting')}
      isHighlightingActive={true}
      isLayouting={false}
      changesetVisualizationEnabled={false}
      onChangesetVisualizationToggle={(enabled) => console.log('Changeset viz:', enabled)}
      hasChangesets={true}
      onExportPNG={() => console.log('Export PNG')}
      onExportSVG={() => console.log('Export SVG')}
      onExportGraphData={() => console.log('Export JSON')}
      onExportTraceabilityReport={() => console.log('Export traceability')}
    />
  </div>
  ),
};

export const WithChangesetVisualization: Story = {
  render: () => (
    <div className="w-96 p-4 bg-white border border-gray-200">
    <MotivationControlPanel
      selectedLayout="radial"
      onLayoutChange={(layout) => console.log('Layout changed:', layout)}
      onFitToView={() => console.log('Fit to view')}
      focusModeEnabled={false}
      onFocusModeToggle={(enabled) => console.log('Focus mode:', enabled)}
      onClearHighlighting={() => console.log('Clear highlighting')}
      isHighlightingActive={false}
      isLayouting={false}
      changesetVisualizationEnabled={true}
      onChangesetVisualizationToggle={(enabled) => console.log('Changeset viz:', enabled)}
      hasChangesets={true}
      onExportPNG={() => console.log('Export PNG')}
      onExportSVG={() => console.log('Export SVG')}
      onExportGraphData={() => console.log('Export JSON')}
      onExportTraceabilityReport={() => console.log('Export traceability')}
    />
  </div>
  ),
};

export const WithLayouting: Story = {
  render: () => (
    <div className="w-96 p-4 bg-white border border-gray-200">
    <MotivationControlPanel
      selectedLayout="force"
      onLayoutChange={(layout) => console.log('Layout changed:', layout)}
      onFitToView={() => console.log('Fit to view')}
      focusModeEnabled={false}
      onFocusModeToggle={(enabled) => console.log('Focus mode:', enabled)}
      onClearHighlighting={() => console.log('Clear highlighting')}
      isHighlightingActive={false}
      isLayouting={true}
      changesetVisualizationEnabled={false}
      onChangesetVisualizationToggle={(enabled) => console.log('Changeset viz:', enabled)}
      hasChangesets={false}
      onExportPNG={() => console.log('Export PNG')}
      onExportSVG={() => console.log('Export SVG')}
      onExportGraphData={() => console.log('Export JSON')}
      onExportTraceabilityReport={() => console.log('Export traceability')}
    />
  </div>
  ),
};
