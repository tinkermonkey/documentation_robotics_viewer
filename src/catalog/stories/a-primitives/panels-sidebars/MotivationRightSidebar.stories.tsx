// @ts-nocheck
import type { StoryDefault, Story } from '@ladle/react';
import { MotivationRightSidebar } from '@/apps/embedded/components/MotivationRightSidebar';
import { MotivationElementType, MotivationRelationshipType } from '../types/motivationGraph';
import { useState } from 'react';

export default {
  title: 'A Primitives / Panels and Sidebars / MotivationRightSidebar',
} satisfies StoryDefault;

const mockFilterCounts = {
  elements: {
    [MotivationElementType.Goal]: { visible: 5, total: 5 },
    [MotivationElementType.Requirement]: { visible: 8, total: 8 },
    [MotivationElementType.Driver]: { visible: 3, total: 3 },
    [MotivationElementType.Stakeholder]: { visible: 2, total: 2 },
    [MotivationElementType.Assessment]: { visible: 1, total: 1 },
    [MotivationElementType.Principle]: { visible: 2, total: 2 },
    [MotivationElementType.Constraint]: { visible: 4, total: 4 },
    [MotivationElementType.Outcome]: { visible: 3, total: 3 },
    [MotivationElementType.Meaning]: { visible: 1, total: 1 },
    [MotivationElementType.Value]: { visible: 2, total: 2 },
    [MotivationElementType.Assumption]: { visible: 0, total: 0 },
    [MotivationElementType.ValueStream]: { visible: 0, total: 0 },
  },
  relationships: {
    [MotivationRelationshipType.Influence]: { visible: 10, total: 10 },
    [MotivationRelationshipType.Constrains]: { visible: 5, total: 5 },
    [MotivationRelationshipType.Realizes]: { visible: 8, total: 8 },
    [MotivationRelationshipType.Refines]: { visible: 6, total: 6 },
    [MotivationRelationshipType.Conflicts]: { visible: 2, total: 2 },
    [MotivationRelationshipType.Motivates]: { visible: 3, total: 3 },
    [MotivationRelationshipType.SupportsGoals]: { visible: 4, total: 4 },
    [MotivationRelationshipType.FulfillsRequirements]: { visible: 2, total: 2 },
    [MotivationRelationshipType.ConstrainedBy]: { visible: 1, total: 1 },
    [MotivationRelationshipType.HasInterest]: { visible: 0, total: 0 },
    [MotivationRelationshipType.Custom]: { visible: 0, total: 0 },
  },
};

export const Default: Story = () => {
  const [selectedTypes, setSelectedTypes] = useState<Set<MotivationElementType>>(new Set());
  const [selectedRelTypes, setSelectedRelTypes] = useState<Set<MotivationRelationshipType>>(new Set());

  return (
    <div className="w-80 h-screen bg-gray-50">
      <MotivationRightSidebar
        selectedElementTypes={selectedTypes}
        onElementTypesChange={(type, selected) => {
          const newSet = new Set(selectedTypes);
          if (selected) newSet.add(type);
          else newSet.delete(type);
          setSelectedTypes(newSet);
        }}
        selectedRelationshipTypes={selectedRelTypes}
        onRelationshipTypesChange={(type, selected) => {
          const newSet = new Set(selectedRelTypes);
          if (selected) newSet.add(type);
          else newSet.delete(type);
          setSelectedRelTypes(newSet);
        }}
        filterCounts={mockFilterCounts}
        onClearAllFilters={() => {
          setSelectedTypes(new Set());
          setSelectedRelTypes(new Set());
        }}
        selectedLayout="force"
        onLayoutChange={(layout) => console.log('Layout:', layout)}
        onFitToView={() => console.log('Fit to view')}
        focusModeEnabled={false}
        onFocusModeToggle={(enabled) => console.log('Focus:', enabled)}
        onClearHighlighting={() => console.log('Clear highlight')}
        isHighlightingActive={false}
        isLayouting={false}
        onExportPNG={() => console.log('Export PNG')}
        onExportSVG={() => console.log('Export SVG')}
        onExportGraphData={() => console.log('Export JSON')}
        onExportTraceabilityReport={() => console.log('Export report')}
      />
    </div>
  );
};
