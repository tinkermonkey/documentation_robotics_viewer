import type { StoryDefault, Story } from '@ladle/react';
import { useState } from 'react';
import { FilterPanel, type FilterSection } from '@/apps/embedded/components/shared/FilterPanel';

export default {
  title: 'A - Primitives / State Panels / FilterPanel',
} satisfies StoryDefault;

const createLayerSection = (): FilterSection => ({
  id: 'layers',
  title: 'A - Primitives / State Panels / FilterPanel',
  items: [
    {
      value: 'motivation',
      label: 'Motivation',
      count: { visible: 15, total: 15 },
    },
    {
      value: 'business',
      label: 'Business',
      count: { visible: 8, total: 12 },
    },
    {
      value: 'technology',
      label: 'Technology',
      count: { visible: 20, total: 25 },
    },
    {
      value: 'c4',
      label: 'C4 Architecture',
      count: { visible: 5, total: 10 },
    },
  ],
  selectedValues: new Set(['motivation', 'business', 'technology']),
  onToggle: (value, selected) => console.log(`Toggle ${value}: ${selected}`),
});

const createElementTypeSection = (): FilterSection => ({
  id: 'elementTypes',
  title: 'A - Primitives / State Panels / FilterPanel',
  items: [
    {
      value: 'goal',
      label: 'Goals',
      count: { visible: 5, total: 5 },
    },
    {
      value: 'requirement',
      label: 'Requirements',
      count: { visible: 8, total: 8 },
    },
    {
      value: 'constraint',
      label: 'Constraints',
      count: { visible: 0, total: 3 },
    },
    {
      value: 'principle',
      label: 'Principles',
      count: { visible: 2, total: 2 },
    },
  ],
  selectedValues: new Set(['goal', 'requirement']),
  onToggle: (value, selected) => console.log(`Toggle ${value}: ${selected}`),
});

export const EmptyFilters: Story = () => (
  <div className="w-80 bg-white border border-gray-200 p-4 rounded">
    <FilterPanel
      sections={[
        {
          id: 'layers',
          title: 'A - Primitives / State Panels / FilterPanel',
          items: [],
          selectedValues: new Set<string>(),
          onToggle: () => {},
        },
      ]}
    />
  </div>
);

export const ActiveFilters: Story = () => (
  <div className="w-80 bg-white border border-gray-200 p-4 rounded">
    <FilterPanel
      sections={[createLayerSection(), createElementTypeSection()]}
      onClearAll={() => console.log('Clear all clicked')}
    />
  </div>
);

export const MultipleCategories: Story = () => {
  const [selectedLayers, setSelectedLayers] = useState(
    new Set(['motivation', 'business', 'technology'])
  );
  const [selectedTypes, setSelectedTypes] = useState(new Set(['goal', 'requirement']));

  return (
    <div className="w-80 bg-white border border-gray-200 p-4 rounded">
      <FilterPanel
        sections={[
          {
            id: 'layers',
            title: 'A - Primitives / State Panels / FilterPanel',
            items: [
              {
                value: 'motivation',
                label: 'Motivation',
                count: { visible: 15, total: 15 },
              },
              {
                value: 'business',
                label: 'Business',
                count: { visible: 8, total: 12 },
              },
              {
                value: 'technology',
                label: 'Technology',
                count: { visible: 20, total: 25 },
              },
              {
                value: 'c4',
                label: 'C4 Architecture',
                count: { visible: 5, total: 10 },
              },
            ],
            selectedValues: selectedLayers,
            onToggle: (value, selected) => {
              const newSelected = new Set(selectedLayers);
              if (selected) newSelected.add(value);
              else newSelected.delete(value);
              setSelectedLayers(newSelected);
            },
          },
          {
            id: 'elementTypes',
            title: 'A - Primitives / State Panels / FilterPanel',
            items: [
              {
                value: 'goal',
                label: 'Goals',
                count: { visible: 5, total: 5 },
              },
              {
                value: 'requirement',
                label: 'Requirements',
                count: { visible: 8, total: 8 },
              },
              {
                value: 'constraint',
                label: 'Constraints',
                count: { visible: 0, total: 3 },
              },
              {
                value: 'principle',
                label: 'Principles',
                count: { visible: 2, total: 2 },
              },
            ],
            selectedValues: selectedTypes,
            onToggle: (value, selected) => {
              const newSelected = new Set(selectedTypes);
              if (selected) newSelected.add(value);
              else newSelected.delete(value);
              setSelectedTypes(newSelected);
            },
          },
        ]}
        onClearAll={() => {
          setSelectedLayers(new Set());
          setSelectedTypes(new Set());
        }}
      />
    </div>
  );
};
