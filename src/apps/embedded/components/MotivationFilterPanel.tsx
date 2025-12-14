/**
 * MotivationFilterPanel Component
 *
 * Provides filtering controls for motivation layer visualization:
 * - Element type checkboxes (all 10 types)
 * - Relationship type checkboxes (influences, constrains, realizes, refines, conflicts)
 * - Filter count indicators showing visible/total counts
 * - "Clear All Filters" button
 * - Collapsible sections for organization
 */

import './MotivationFilterPanel.css';
import { MotivationElementType, MotivationRelationshipType } from '../types/motivationGraph';
import { Accordion, AccordionPanel, AccordionTitle, AccordionContent, Checkbox, Label, Button } from 'flowbite-react';
import { X } from 'lucide-react';

export interface FilterCounts {
  elements: Record<MotivationElementType, { visible: number; total: number }>;
  relationships: Record<MotivationRelationshipType, { visible: number; total: number }>;
}

export interface MotivationFilterPanelProps {
  /** Selected element types (filters) */
  selectedElementTypes: Set<MotivationElementType>;

  /** Selected relationship types (filters) */
  selectedRelationshipTypes: Set<MotivationRelationshipType>;

  /** Filter count information */
  filterCounts: FilterCounts;

  /** Callback when element type filter changes */
  onElementTypeChange: (elementType: MotivationElementType, selected: boolean) => void;

  /** Callback when relationship type filter changes */
  onRelationshipTypeChange: (relationshipType: MotivationRelationshipType, selected: boolean) => void;

  /** Callback when "Clear All Filters" is clicked */
  onClearAllFilters: () => void;
}

/**
 * Element type labels for display
 */
const ELEMENT_TYPE_LABELS: Record<MotivationElementType, string> = {
  [MotivationElementType.Stakeholder]: 'Stakeholders',
  [MotivationElementType.Goal]: 'Goals',
  [MotivationElementType.Driver]: 'Drivers',
  [MotivationElementType.Outcome]: 'Outcomes',
  [MotivationElementType.Requirement]: 'Requirements',
  [MotivationElementType.Constraint]: 'Constraints',
  [MotivationElementType.Principle]: 'Principles',
  [MotivationElementType.Assessment]: 'Assessments',
  [MotivationElementType.Meaning]: 'Meanings',
  [MotivationElementType.Value]: 'Values',
  assumption: 'Assumption',
  valueStream: 'Value Stream',
};

/**
 * Relationship type labels for display
 */
const RELATIONSHIP_TYPE_LABELS: Record<MotivationRelationshipType, string> = {
  [MotivationRelationshipType.Influence]: 'Influences',
  [MotivationRelationshipType.Constrains]: 'Constrains',
  [MotivationRelationshipType.Realizes]: 'Realizes',
  [MotivationRelationshipType.Refines]: 'Refines',
  [MotivationRelationshipType.Conflicts]: 'Conflicts',
  [MotivationRelationshipType.Motivates]: 'Motivates',
  [MotivationRelationshipType.SupportsGoals]: 'Supports Goals',
  [MotivationRelationshipType.FulfillsRequirements]: 'Fulfills Requirements',
  [MotivationRelationshipType.ConstrainedBy]: 'Constrained By',
  [MotivationRelationshipType.HasInterest]: 'Has Interest',
  [MotivationRelationshipType.Custom]: 'Custom',
};

/**
 * MotivationFilterPanel Component
 */
export const MotivationFilterPanel: React.FC<MotivationFilterPanelProps> = ({
  selectedElementTypes,
  selectedRelationshipTypes,
  filterCounts,
  onElementTypeChange,
  onRelationshipTypeChange,
  onClearAllFilters,
}) => {
  // const [elementTypesExpanded, setElementTypesExpanded] = useState(true);
  // const [relationshipTypesExpanded, setRelationshipTypesExpanded] = useState(true);

  /**
   * Check if all element types are selected
   */
  const allElementTypesSelected = Object.values(MotivationElementType).every(
    (type) => selectedElementTypes.has(type)
  );

  /**
   * Check if all relationship types are selected
   */
  const allRelationshipTypesSelected = Object.values(MotivationRelationshipType).every(
    (type) => selectedRelationshipTypes.has(type)
  );

  /**
   * Calculate total visible/total elements
   */
  const totalElementCounts = Object.values(filterCounts.elements).reduce(
    (acc, counts) => ({
      visible: acc.visible + counts.visible,
      total: acc.total + counts.total,
    }),
    { visible: 0, total: 0 }
  );

  /**
   * Calculate total visible/total relationships
   */
  const totalRelationshipCounts = Object.values(filterCounts.relationships).reduce(
    (acc, counts) => ({
      visible: acc.visible + counts.visible,
      total: acc.total + counts.total,
    }),
    { visible: 0, total: 0 }
  );

  /**
   * Handle "Select All" element types
   */
  const handleSelectAllElements = () => {
    Object.values(MotivationElementType).forEach((type) => {
      if (!selectedElementTypes.has(type)) {
        onElementTypeChange(type, true);
      }
    });
  };

  /**
   * Handle "Deselect All" element types
   */
  const handleDeselectAllElements = () => {
    Object.values(MotivationElementType).forEach((type) => {
      if (selectedElementTypes.has(type)) {
        onElementTypeChange(type, false);
      }
    });
  };

  /**
   * Handle "Select All" relationship types
   */
  const handleSelectAllRelationships = () => {
    Object.values(MotivationRelationshipType).forEach((type) => {
      if (!selectedRelationshipTypes.has(type)) {
        onRelationshipTypeChange(type, true);
      }
    });
  };

  /**
   * Handle "Deselect All" relationship types
   */
  const handleDeselectAllRelationships = () => {
    Object.values(MotivationRelationshipType).forEach((type) => {
      if (selectedRelationshipTypes.has(type)) {
        onRelationshipTypeChange(type, false);
      }
    });
  };

  return (
    <div className="motivation-filter-panel">
      <div className="filter-panel-header">
        <h3>Filters</h3>
        <Button
          color="gray"
          size="xs"
          onClick={onClearAllFilters}
          disabled={allElementTypesSelected && allRelationshipTypesSelected}
          title="Clear all filters and show all elements"
        >
          <X className="mr-1 h-3 w-3" />
          Clear All
        </Button>
      </div>

      <Accordion collapseAll={false}>
        {/* Element Types Section */}
        <AccordionPanel>
          <AccordionTitle>
            <div className="flex items-center justify-between w-full pr-4">
              <span>Element Types</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {totalElementCounts.visible} / {totalElementCounts.total}
              </span>
            </div>
          </AccordionTitle>
          <AccordionContent>
            <div className="flex gap-2 mb-3">
              <Button
                size="xs"
                color="light"
                onClick={handleSelectAllElements}
                disabled={allElementTypesSelected}
              >
                Select All
              </Button>
              <Button
                size="xs"
                color="light"
                onClick={handleDeselectAllElements}
                disabled={selectedElementTypes.size === 0}
              >
                Deselect All
              </Button>
            </div>

            <div className="space-y-2">
              {Object.values(MotivationElementType).map((elementType) => {
                const counts = filterCounts.elements[elementType];
                const isSelected = selectedElementTypes.has(elementType);
                const hasElements = counts && counts.total > 0;

                return (
                  <div key={elementType} className="flex items-center justify-between">
                    <Checkbox
                      id={`element-${elementType}`}
                      checked={isSelected}
                      onChange={(e) => onElementTypeChange(elementType, e.target.checked)}
                      disabled={!hasElements}
                    />
                    <Label
                      htmlFor={`element-${elementType}`}
                      className="flex items-center gap-2 flex-1 ml-2"
                      disabled={!hasElements}
                    >
                      <span className="flex-1">{ELEMENT_TYPE_LABELS[elementType]}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {counts ? `${counts.visible}/${counts.total}` : '0/0'}
                      </span>
                    </Label>
                  </div>
                );
              })}
              </div>
            </AccordionContent>
          </AccordionPanel>

        {/* Relationship Types Section */}
        <AccordionPanel>
          <AccordionTitle>
            <div className="flex items-center justify-between w-full pr-4">
              <span>Relationship Types</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {totalRelationshipCounts.visible} / {totalRelationshipCounts.total}
              </span>
            </div>
          </AccordionTitle>
          <AccordionContent>
            <div className="flex gap-2 mb-3">
              <Button
                size="xs"
                color="light"
                onClick={handleSelectAllRelationships}
                disabled={allRelationshipTypesSelected}
              >
                Select All
              </Button>
              <Button
                size="xs"
                color="light"
                onClick={handleDeselectAllRelationships}
                disabled={selectedRelationshipTypes.size === 0}
              >
                Deselect All
              </Button>
            </div>

            <div className="space-y-2">
              {Object.values(MotivationRelationshipType).map((relationshipType) => {
                const counts = filterCounts.relationships[relationshipType];
                const isSelected = selectedRelationshipTypes.has(relationshipType);
                const hasRelationships = counts && counts.total > 0;

                return (
                  <div key={relationshipType} className="flex items-center justify-between">
                      <Checkbox
                        id={`relationship-${relationshipType}`}
                        checked={isSelected}
                        onChange={(e) =>
                          onRelationshipTypeChange(relationshipType, e.target.checked)
                        }
                        disabled={!hasRelationships}
                      />
                    <Label
                      htmlFor={`relationship-${relationshipType}`}
                      className="flex items-center gap-2 flex-1 ml-2"
                      disabled={!hasRelationships}
                    >
                      <span className="flex-1">{RELATIONSHIP_TYPE_LABELS[relationshipType]}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {counts ? `${counts.visible}/${counts.total}` : '0/0'}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>
  );
};
