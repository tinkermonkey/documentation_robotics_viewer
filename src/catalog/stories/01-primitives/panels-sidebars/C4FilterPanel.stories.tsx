import type { StoryDefault, Story } from '@ladle/react';
import { C4FilterPanel } from '@/apps/embedded/components/C4FilterPanel';
import type { C4FilterCounts } from '@/apps/embedded/components/C4FilterPanel';
import { ContainerType } from '@/apps/embedded/types/c4Graph';
import { useState } from 'react';

export default {
  title: '01 Primitives / Panels and Sidebars / C4FilterPanel',
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
    'Redis': { visible: 0, total: 2 },
    'RabbitMQ': { visible: 1, total: 1 },
  },
};

const availableTechnologies = ['React', 'Node.js', 'PostgreSQL', 'Redis', 'RabbitMQ', 'MongoDB', 'AWS S3'];

export const Default: Story = () => {
  const [selectedTypes, setSelectedTypes] = useState<Set<ContainerType>>(new Set());
  const [selectedTechs, setSelectedTechs] = useState<Set<string>>(new Set());

  return (
    <div className="w-80 bg-white border border-gray-200">
      <C4FilterPanel
        selectedContainerTypes={selectedTypes}
        selectedTechnologyStacks={selectedTechs}
        filterCounts={mockFilterCounts}
        availableTechnologies={availableTechnologies}
        onContainerTypeChange={(type, selected) => {
          const newSet = new Set(selectedTypes);
          if (selected) {
            newSet.add(type);
          } else {
            newSet.delete(type);
          }
          setSelectedTypes(newSet);
        }}
        onTechnologyChange={(tech, selected) => {
          const newSet = new Set(selectedTechs);
          if (selected) {
            newSet.add(tech);
          } else {
            newSet.delete(tech);
          }
          setSelectedTechs(newSet);
        }}
        onClearAllFilters={() => {
          setSelectedTypes(new Set());
          setSelectedTechs(new Set());
        }}
      />
    </div>
  );
};

export const WithFiltersApplied: Story = () => {
  const [selectedTypes, setSelectedTypes] = useState<Set<ContainerType>>(
    new Set([ContainerType.WebApp, ContainerType.Api])
  );
  const [selectedTechs, setSelectedTechs] = useState<Set<string>>(
    new Set(['React', 'Node.js'])
  );

  return (
    <div className="w-80 bg-white border border-gray-200">
      <C4FilterPanel
        selectedContainerTypes={selectedTypes}
        selectedTechnologyStacks={selectedTechs}
        filterCounts={mockFilterCounts}
        availableTechnologies={availableTechnologies}
        onContainerTypeChange={(type, selected) => {
          const newSet = new Set(selectedTypes);
          if (selected) {
            newSet.add(type);
          } else {
            newSet.delete(type);
          }
          setSelectedTypes(newSet);
        }}
        onTechnologyChange={(tech, selected) => {
          const newSet = new Set(selectedTechs);
          if (selected) {
            newSet.add(tech);
          } else {
            newSet.delete(tech);
          }
          setSelectedTechs(newSet);
        }}
        onClearAllFilters={() => {
          setSelectedTypes(new Set());
          setSelectedTechs(new Set());
        }}
      />
    </div>
  );
};
