import type { Meta, StoryObj } from '@storybook/react';
import { LayerRightSidebar } from '@/apps/embedded/components/shared/LayerRightSidebar';
import type { FilterSection } from '@/apps/embedded/components/shared/FilterPanel';
import { useState } from 'react';

const meta = {
  title: 'A Primitives / Panels and Sidebars / LayerRightSidebar',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const makeMotivationSections = (
  selectedElements: Set<string>,
  onElementToggle: (v: string, s: boolean) => void,
  selectedRelationships: Set<string>,
  onRelToggle: (v: string, s: boolean) => void,
): FilterSection<string>[] => [
  {
    id: 'elements',
    title: 'Element Types',
    items: [
      { value: 'goal', label: 'Goals', count: { visible: selectedElements.has('goal') ? 5 : 0, total: 5 } },
      { value: 'requirement', label: 'Requirements', count: { visible: selectedElements.has('requirement') ? 8 : 0, total: 8 } },
      { value: 'stakeholder', label: 'Stakeholders', count: { visible: selectedElements.has('stakeholder') ? 2 : 0, total: 2 } },
      { value: 'driver', label: 'Drivers', count: { visible: selectedElements.has('driver') ? 3 : 0, total: 3 } },
    ],
    selectedValues: selectedElements,
    onToggle: onElementToggle,
  },
  {
    id: 'relationships',
    title: 'Relationship Types',
    items: [
      { value: 'influence', label: 'Influences', count: { visible: selectedRelationships.has('influence') ? 10 : 0, total: 10 } },
      { value: 'constrains', label: 'Constrains', count: { visible: selectedRelationships.has('constrains') ? 5 : 0, total: 5 } },
      { value: 'realizes', label: 'Realizes', count: { visible: selectedRelationships.has('realizes') ? 8 : 0, total: 8 } },
    ],
    selectedValues: selectedRelationships,
    onToggle: onRelToggle,
  },
];

export const MotivationLayer: Story = {
  render: () => {
    const [selectedElements, setSelectedElements] = useState(
      new Set(['goal', 'requirement', 'stakeholder', 'driver'])
    );
    const [selectedRelationships, setSelectedRelationships] = useState(
      new Set(['influence', 'constrains', 'realizes'])
    );

    const onElementToggle = (v: string, s: boolean) => {
      const next = new Set(selectedElements);
      s ? next.add(v) : next.delete(v);
      setSelectedElements(next);
    };

    const onRelToggle = (v: string, s: boolean) => {
      const next = new Set(selectedRelationships);
      s ? next.add(v) : next.delete(v);
      setSelectedRelationships(next);
    };

    return (
      <div className="w-80 h-screen bg-gray-50">
        <LayerRightSidebar
          filterSections={makeMotivationSections(selectedElements, onElementToggle, selectedRelationships, onRelToggle)}
          onClearFilters={() => {
            setSelectedElements(new Set(['goal', 'requirement', 'stakeholder', 'driver']));
            setSelectedRelationships(new Set(['influence', 'constrains', 'realizes']));
          }}
          controlContent={<div className="p-4 text-sm text-gray-600">Control panel placeholder</div>}
          annotationContent={<div className="p-4 text-sm text-gray-600">Annotations placeholder</div>}
          crossLayerContent={<div className="p-3 bg-blue-50 text-xs text-blue-700 border-b">Cross-layer panel</div>}
          testId="motivation-right-sidebar"
        />
      </div>
    );
  },
};

export const C4ArchitectureLayer: Story = {
  render: () => {
    const [selectedContainerTypes, setSelectedContainerTypes] = useState(
      new Set(['webApp', 'api', 'database'])
    );
    const [selectedTechs, setSelectedTechs] = useState(
      new Set(['React', 'Node.js', 'PostgreSQL'])
    );

    const onContainerToggle = (v: string, s: boolean) => {
      const next = new Set(selectedContainerTypes);
      s ? next.add(v) : next.delete(v);
      setSelectedContainerTypes(next);
    };

    const onTechToggle = (v: string, s: boolean) => {
      const next = new Set(selectedTechs);
      s ? next.add(v) : next.delete(v);
      setSelectedTechs(next);
    };

    const sections: FilterSection<string>[] = [
      {
        id: 'containerTypes',
        title: 'Container Types',
        items: [
          { value: 'webApp', label: 'Web Application', count: { visible: selectedContainerTypes.has('webApp') ? 3 : 0, total: 3 } },
          { value: 'api', label: 'API', count: { visible: selectedContainerTypes.has('api') ? 4 : 0, total: 4 } },
          { value: 'database', label: 'Database', count: { visible: selectedContainerTypes.has('database') ? 2 : 0, total: 2 } },
        ],
        selectedValues: selectedContainerTypes,
        onToggle: onContainerToggle,
      },
      {
        id: 'technologies',
        title: 'Technology Stack',
        items: [
          { value: 'React', label: 'React', count: { visible: selectedTechs.has('React') ? 3 : 0, total: 3 } },
          { value: 'Node.js', label: 'Node.js', count: { visible: selectedTechs.has('Node.js') ? 4 : 0, total: 4 } },
          { value: 'PostgreSQL', label: 'PostgreSQL', count: { visible: selectedTechs.has('PostgreSQL') ? 2 : 0, total: 2 } },
        ],
        selectedValues: selectedTechs,
        onToggle: onTechToggle,
      },
    ];

    return (
      <div className="w-80 h-screen bg-gray-50">
        <LayerRightSidebar
          filterSections={sections}
          onClearFilters={() => {
            setSelectedContainerTypes(new Set(['webApp', 'api', 'database']));
            setSelectedTechs(new Set(['React', 'Node.js', 'PostgreSQL']));
          }}
          controlContent={<div className="p-4 text-sm text-gray-600">C4 control panel placeholder</div>}
          crossLayerContent={<div className="p-3 bg-blue-50 text-xs text-blue-700 border-b">Cross-layer panel</div>}
          testId="c4-right-sidebar"
        />
      </div>
    );
  },
};

export const WithInspector: Story = {
  render: () => {
    const [selected, setSelected] = useState(new Set(['goal', 'requirement']));

    const sections: FilterSection<string>[] = [
      {
        id: 'elements',
        title: 'Element Types',
        items: [
          { value: 'goal', label: 'Goals', count: { visible: selected.has('goal') ? 5 : 0, total: 5 } },
          { value: 'requirement', label: 'Requirements', count: { visible: selected.has('requirement') ? 8 : 0, total: 8 } },
        ],
        selectedValues: selected,
        onToggle: (v, s) => {
          const next = new Set(selected);
          s ? next.add(v) : next.delete(v);
          setSelected(next);
        },
      },
    ];

    return (
      <div className="w-80 h-screen bg-gray-50">
        <LayerRightSidebar
          filterSections={sections}
          onClearFilters={() => setSelected(new Set(['goal', 'requirement']))}
          controlContent={<div className="p-4 text-sm text-gray-600">Control panel</div>}
          inspectorContent={
            <div className="p-4 space-y-2">
              <div className="text-sm font-semibold">Improve Customer Satisfaction</div>
              <div className="text-xs text-gray-500">Type: Goal</div>
              <div className="text-xs text-gray-600">Strategic goal to improve NPS score by 20%</div>
            </div>
          }
          testId="layer-right-sidebar-with-inspector"
        />
      </div>
    );
  },
};

export const EmptyGraph: Story = {
  render: () => (
    <div className="w-80 h-screen bg-gray-50">
      <LayerRightSidebar
        filterSections={[]}
        onClearFilters={() => {}}
        controlContent={<div className="p-4 text-sm text-gray-600">Control panel placeholder</div>}
        testId="layer-right-sidebar-empty"
      />
    </div>
  ),
};
