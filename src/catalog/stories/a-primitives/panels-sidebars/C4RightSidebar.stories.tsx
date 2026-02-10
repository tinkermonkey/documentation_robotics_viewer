// @ts-nocheck
import type { StoryDefault, Story } from '@ladle/react';
import { C4RightSidebar } from '@/apps/embedded/components/C4RightSidebar';
import type { C4FilterCounts } from '@/apps/embedded/components/C4FilterPanel';
import type { C4Graph } from '@/apps/embedded/types/c4Graph';
import { ContainerType, C4Type } from '@/apps/embedded/types/c4Graph';
import { useState } from 'react';

export default {
  title: 'A Primitives / Panels and Sidebars / C4RightSidebar',
} satisfies StoryDefault;

const mockFilterCounts: C4FilterCounts = {
  containerTypes: {
    [ContainerType.WebApp]: { visible: 3, total: 5 },
    [ContainerType.Api]: { visible: 4, total: 4 },
    [ContainerType.Database]: { visible: 2, total: 3 },
    [ContainerType.MessageQueue]: { visible: 1, total: 1 },
    [ContainerType.Cache]: { visible: 0, total: 2 },
    [ContainerType.Service]: { visible: 5, total: 5 },
    [ContainerType.MobileApp]: { visible: 0, total: 0 },
    [ContainerType.DesktopApp]: { visible: 0, total: 0 },
    [ContainerType.FileStorage]: { visible: 0, total: 0 },
    [ContainerType.Function]: { visible: 0, total: 0 },
    [ContainerType.Custom]: { visible: 0, total: 0 },
  },
  technologies: {
    'React': { visible: 3, total: 3 },
    'Node.js': { visible: 4, total: 5 },
    'PostgreSQL': { visible: 2, total: 2 },
  },
};

const mockGraph: C4Graph = {
  nodes: new Map([
    ['web-app', {
      id: 'web-app',
      c4Type: C4Type.Container,
      containerType: ContainerType.WebApp,
      name: 'Web Application',
      description: 'React SPA',
      technology: ['React'],
      boundary: 'internal',
      sourceElement: {
        id: 'web-app',
        layer: 'application',
        type: 'application',
        properties: { name: 'Web Application' },
      },
    }],
  ]),
  edges: new Map(),
  systems: new Map(),
};

export const Default: Story = () => {
  const [selectedTypes, setSelectedTypes] = useState<Set<ContainerType>>(new Set());
  const [selectedTechs, setSelectedTechs] = useState<Set<string>>(new Set());

  return (
    <div className="w-80 h-screen bg-gray-50">
      <C4RightSidebar
        selectedContainerTypes={selectedTypes}
        onContainerTypeChange={(type, selected) => {
          const newSet = new Set(selectedTypes);
          if (selected) newSet.add(type);
          else newSet.delete(type);
          setSelectedTypes(newSet);
        }}
        selectedTechnologyStacks={selectedTechs}
        onTechnologyChange={(tech, selected) => {
          const newSet = new Set(selectedTechs);
          if (selected) newSet.add(tech);
          else newSet.delete(tech);
          setSelectedTechs(newSet);
        }}
        onClearAllFilters={() => {
          setSelectedTypes(new Set());
          setSelectedTechs(new Set());
        }}
        filterCounts={mockFilterCounts}
        availableTechnologies={['React', 'Node.js', 'PostgreSQL']}
        selectedLayout="hierarchical"
        currentViewLevel="context"
        onLayoutChange={(layout) => console.log('Layout:', layout)}
        onViewLevelChange={(level) => console.log('View level:', level)}
        onFitToView={() => console.log('Fit to view')}
        focusModeEnabled={false}
        onFocusModeToggle={(enabled) => console.log('Focus:', enabled)}
        onClearHighlighting={() => console.log('Clear highlight')}
        isHighlightingActive={false}
        isLayouting={false}
        onExportPNG={() => console.log('Export PNG')}
        onExportSVG={() => console.log('Export SVG')}
        onExportGraphData={() => console.log('Export JSON')}
        hasSelectedContainer={false}
        onScenarioPresetChange={(preset) => console.log('Preset:', preset)}
        graph={mockGraph}
      />
    </div>
  );
};
