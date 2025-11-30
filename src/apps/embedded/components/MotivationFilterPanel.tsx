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

import { useState } from 'react';
import { MotivationElementType, MotivationRelationshipType } from '../types/motivationGraph';
import './MotivationFilterPanel.css';

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
  const [elementTypesExpanded, setElementTypesExpanded] = useState(true);
  const [relationshipTypesExpanded, setRelationshipTypesExpanded] = useState(true);

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
        <button
          className="clear-filters-button"
          onClick={onClearAllFilters}
          disabled={allElementTypesSelected && allRelationshipTypesSelected}
          title="Clear all filters and show all elements"
        >
          Clear All
        </button>
      </div>

      {/* Element Types Section */}
      <div className="filter-section">
        <div
          className="filter-section-header"
          onClick={() => setElementTypesExpanded(!elementTypesExpanded)}
        >
          <span className="expand-icon">{elementTypesExpanded ? '▼' : '▶'}</span>
          <h4>Element Types</h4>
          <span className="filter-count">
            {totalElementCounts.visible} / {totalElementCounts.total}
          </span>
        </div>

        {elementTypesExpanded && (
          <div className="filter-section-content">
            <div className="filter-actions">
              <button
                className="filter-action-button"
                onClick={handleSelectAllElements}
                disabled={allElementTypesSelected}
              >
                Select All
              </button>
              <button
                className="filter-action-button"
                onClick={handleDeselectAllElements}
                disabled={selectedElementTypes.size === 0}
              >
                Deselect All
              </button>
            </div>

            <div className="filter-checkboxes">
              {Object.values(MotivationElementType).map((elementType) => {
                const counts = filterCounts.elements[elementType];
                const isSelected = selectedElementTypes.has(elementType);
                const hasElements = counts && counts.total > 0;

                return (
                  <label
                    key={elementType}
                    className={`filter-checkbox-label ${!hasElements ? 'disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onElementTypeChange(elementType, e.target.checked)}
                      disabled={!hasElements}
                    />
                    <span className="filter-label-text">
                      {ELEMENT_TYPE_LABELS[elementType]}
                    </span>
                    <span className="filter-count-badge">
                      {counts ? `${counts.visible}/${counts.total}` : '0/0'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Relationship Types Section */}
      <div className="filter-section">
        <div
          className="filter-section-header"
          onClick={() => setRelationshipTypesExpanded(!relationshipTypesExpanded)}
        >
          <span className="expand-icon">{relationshipTypesExpanded ? '▼' : '▶'}</span>
          <h4>Relationship Types</h4>
          <span className="filter-count">
            {totalRelationshipCounts.visible} / {totalRelationshipCounts.total}
          </span>
        </div>

        {relationshipTypesExpanded && (
          <div className="filter-section-content">
            <div className="filter-actions">
              <button
                className="filter-action-button"
                onClick={handleSelectAllRelationships}
                disabled={allRelationshipTypesSelected}
              >
                Select All
              </button>
              <button
                className="filter-action-button"
                onClick={handleDeselectAllRelationships}
                disabled={selectedRelationshipTypes.size === 0}
              >
                Deselect All
              </button>
            </div>

            <div className="filter-checkboxes">
              {Object.values(MotivationRelationshipType).map((relationshipType) => {
                const counts = filterCounts.relationships[relationshipType];
                const isSelected = selectedRelationshipTypes.has(relationshipType);
                const hasRelationships = counts && counts.total > 0;

                return (
                  <label
                    key={relationshipType}
                    className={`filter-checkbox-label ${!hasRelationships ? 'disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        onRelationshipTypeChange(relationshipType, e.target.checked)
                      }
                      disabled={!hasRelationships}
                    />
                    <span className="filter-label-text">
                      {RELATIONSHIP_TYPE_LABELS[relationshipType]}
                    </span>
                    <span className="filter-count-badge">
                      {counts ? `${counts.visible}/${counts.total}` : '0/0'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
