import type { StoryDefault, Story } from '@ladle/react';
import { C4ControlPanel } from '@/apps/embedded/components/C4ControlPanel';

export default {
  title: 'A Primitives / Panels and Sidebars / C4ControlPanel',
} satisfies StoryDefault;

export const ContextLevel: Story = () => (
  <div className="w-96 p-4 bg-white border border-gray-200">
    <C4ControlPanel
      selectedLayout="hierarchical"
      currentViewLevel="context"
      onLayoutChange={(layout) => console.log('Layout changed:', layout)}
      onViewLevelChange={(level) => console.log('View level changed:', level)}
      onFitToView={() => console.log('Fit to view')}
      focusModeEnabled={false}
      onFocusModeToggle={(enabled) => console.log('Focus mode:', enabled)}
      onClearHighlighting={() => console.log('Clear highlighting')}
      isHighlightingActive={false}
      isLayouting={false}
      onExportPNG={() => console.log('Export PNG')}
      onExportSVG={() => console.log('Export SVG')}
      onExportGraphData={() => console.log('Export JSON')}
      hasSelectedContainer={false}
      onScenarioPresetChange={(preset) => console.log('Scenario preset:', preset)}
    />
  </div>
);

export const ContainerLevel: Story = () => (
  <div className="w-96 p-4 bg-white border border-gray-200">
    <C4ControlPanel
      selectedLayout="force"
      currentViewLevel="container"
      onLayoutChange={(layout) => console.log('Layout changed:', layout)}
      onViewLevelChange={(level) => console.log('View level changed:', level)}
      onFitToView={() => console.log('Fit to view')}
      focusModeEnabled={true}
      onFocusModeToggle={(enabled) => console.log('Focus mode:', enabled)}
      onClearHighlighting={() => console.log('Clear highlighting')}
      isHighlightingActive={true}
      isLayouting={false}
      onExportPNG={() => console.log('Export PNG')}
      onExportSVG={() => console.log('Export SVG')}
      onExportGraphData={() => console.log('Export JSON')}
      hasSelectedContainer={true}
      scenarioPreset="dataFlow"
      onScenarioPresetChange={(preset) => console.log('Scenario preset:', preset)}
    />
  </div>
);

export const WithLayouting: Story = () => (
  <div className="w-96 p-4 bg-white border border-gray-200">
    <C4ControlPanel
      selectedLayout="orthogonal"
      currentViewLevel="component"
      onLayoutChange={(layout) => console.log('Layout changed:', layout)}
      onViewLevelChange={(level) => console.log('View level changed:', level)}
      onFitToView={() => console.log('Fit to view')}
      focusModeEnabled={false}
      onFocusModeToggle={(enabled) => console.log('Focus mode:', enabled)}
      onClearHighlighting={() => console.log('Clear highlighting')}
      isHighlightingActive={false}
      isLayouting={true}
      onExportPNG={() => console.log('Export PNG')}
      onExportSVG={() => console.log('Export SVG')}
      onExportGraphData={() => console.log('Export JSON')}
      hasSelectedContainer={false}
      onScenarioPresetChange={(preset) => console.log('Scenario preset:', preset)}
    />
  </div>
);
