/**
 * C4FilterPanel Component
 *
 * Provides filtering controls for C4 visualization:
 * - Container type checkboxes (WebApp, API, Database, etc.)
 * - Technology stack checkboxes (React, Node.js, PostgreSQL, etc.)
 * - Filter count indicators showing visible/total counts
 * - "Clear All Filters" button
 * - Collapsible sections for organization
 */

import { useState } from 'react';
import './C4FilterPanel.css';
import { ContainerType } from '../types/c4Graph';

export interface C4FilterCounts {
  containerTypes: Record<ContainerType, { visible: number; total: number }>;
  technologies: Record<string, { visible: number; total: number }>;
}

export interface C4FilterPanelProps {
  /** Selected container types (filters) */
  selectedContainerTypes: Set<ContainerType>;

  /** Selected technology stacks (filters) */
  selectedTechnologyStacks: Set<string>;

  /** Filter count information */
  filterCounts: C4FilterCounts;

  /** Available technology stacks from the graph */
  availableTechnologies: string[];

  /** Callback when container type filter changes */
  onContainerTypeChange: (containerType: ContainerType, selected: boolean) => void;

  /** Callback when technology filter changes */
  onTechnologyChange: (technology: string, selected: boolean) => void;

  /** Callback when "Clear All Filters" is clicked */
  onClearAllFilters: () => void;
}

/**
 * Container type labels for display
 */
const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  [ContainerType.WebApp]: 'Web Application',
  [ContainerType.MobileApp]: 'Mobile App',
  [ContainerType.DesktopApp]: 'Desktop App',
  [ContainerType.Api]: 'API',
  [ContainerType.Database]: 'Database',
  [ContainerType.MessageQueue]: 'Message Queue',
  [ContainerType.Cache]: 'Cache',
  [ContainerType.FileStorage]: 'File Storage',
  [ContainerType.Service]: 'Service',
  [ContainerType.Function]: 'Function',
  [ContainerType.Custom]: 'Custom',
};

/**
 * Container type icons
 */
const CONTAINER_TYPE_ICONS: Record<ContainerType, JSX.Element> = {
  [ContainerType.WebApp]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2z" />
      <path d="M2 4h12v1H2V4z" />
    </svg>
  ),
  [ContainerType.MobileApp]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <path d="M7 12h2v1H7v-1z" />
    </svg>
  ),
  [ContainerType.DesktopApp]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z" />
      <path d="M6 12h4v1H6v-1zm-2 2h8v1H4v-1z" />
    </svg>
  ),
  [ContainerType.Api]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4z" />
      <path d="M6 5h4v1H6V5zm0 2h4v1H6V7zm0 2h2v1H6V9z" />
    </svg>
  ),
  [ContainerType.Database]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2c3.314 0 6 1.119 6 2.5v7c0 1.381-2.686 2.5-6 2.5S2 12.881 2 11.5v-7C2 3.119 4.686 2 8 2zM8 3C5.243 3 3 3.895 3 4.5S5.243 6 8 6s5-.895 5-1.5S10.757 3 8 3z" />
      <path d="M3 7c0 .605 2.243 1.5 5 1.5s5-.895 5-1.5v4c0 .605-2.243 1.5-5 1.5s-5-.895-5-1.5V7z" />
    </svg>
  ),
  [ContainerType.MessageQueue]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 4h12v2H2V4zm0 3h12v2H2V7zm0 3h12v2H2v-2z" />
    </svg>
  ),
  [ContainerType.Cache]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v10a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1z" />
      <path d="M4 4h2v1H4V4zm0 2h2v1H4V6zm0 2h2v1H4V8zm6-4h2v1h-2V4zm0 2h2v1h-2V6zm0 2h2v1h-2V8z" />
    </svg>
  ),
  [ContainerType.FileStorage]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293L10.586 3H13a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2z" />
    </svg>
  ),
  [ContainerType.Service]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z" />
      <path d="M8 5v6M5 8h6" />
    </svg>
  ),
  [ContainerType.Function]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V3zM2 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z" />
      <path d="M6 7h4v2H6V7z" />
    </svg>
  ),
  [ContainerType.Custom]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l7 3v8l-7 3-7-3V4l7-3zm0 1.236L2 5v6l6 2.573L14 11V5L8 2.236z" />
    </svg>
  ),
};

/**
 * C4FilterPanel Component
 */
export const C4FilterPanel: React.FC<C4FilterPanelProps> = ({
  selectedContainerTypes,
  selectedTechnologyStacks,
  filterCounts,
  availableTechnologies,
  onContainerTypeChange,
  onTechnologyChange,
  onClearAllFilters,
}) => {
  const [containerTypesExpanded, setContainerTypesExpanded] = useState(true);
  const [technologiesExpanded, setTechnologiesExpanded] = useState(true);

  /**
   * Check if all container types are selected
   */
  const allContainerTypesSelected = Object.values(ContainerType).every((type) =>
    selectedContainerTypes.has(type)
  );

  /**
   * Check if all technologies are selected
   */
  const allTechnologiesSelected = availableTechnologies.every((tech) =>
    selectedTechnologyStacks.has(tech)
  );

  /**
   * Calculate total visible/total for container types
   */
  const totalContainerCounts = Object.values(filterCounts.containerTypes || {}).reduce(
    (acc, counts) => ({
      visible: acc.visible + (counts?.visible || 0),
      total: acc.total + (counts?.total || 0),
    }),
    { visible: 0, total: 0 }
  );

  /**
   * Calculate total visible/total for technologies
   */
  const totalTechnologyCounts = Object.values(filterCounts.technologies || {}).reduce(
    (acc, counts) => ({
      visible: acc.visible + (counts?.visible || 0),
      total: acc.total + (counts?.total || 0),
    }),
    { visible: 0, total: 0 }
  );

  /**
   * Handle "Select All" container types
   */
  const handleSelectAllContainerTypes = () => {
    Object.values(ContainerType).forEach((type) => {
      if (!selectedContainerTypes.has(type)) {
        onContainerTypeChange(type, true);
      }
    });
  };

  /**
   * Handle "Deselect All" container types
   */
  const handleDeselectAllContainerTypes = () => {
    Object.values(ContainerType).forEach((type) => {
      if (selectedContainerTypes.has(type)) {
        onContainerTypeChange(type, false);
      }
    });
  };

  /**
   * Handle "Select All" technologies
   */
  const handleSelectAllTechnologies = () => {
    availableTechnologies.forEach((tech) => {
      if (!selectedTechnologyStacks.has(tech)) {
        onTechnologyChange(tech, true);
      }
    });
  };

  /**
   * Handle "Deselect All" technologies
   */
  const handleDeselectAllTechnologies = () => {
    availableTechnologies.forEach((tech) => {
      if (selectedTechnologyStacks.has(tech)) {
        onTechnologyChange(tech, false);
      }
    });
  };

  return (
    <div className="c4-filter-panel">
      <div className="filter-panel-header">
        <h3>Filters</h3>
        <button
          className="clear-filters-button"
          onClick={onClearAllFilters}
          disabled={allContainerTypesSelected && allTechnologiesSelected}
          title="Clear all filters and show all elements"
        >
          Clear All
        </button>
      </div>

      {/* Container Types Section */}
      <div className="filter-section">
        <div
          className="filter-section-header"
          onClick={() => setContainerTypesExpanded(!containerTypesExpanded)}
          role="button"
          tabIndex={0}
          aria-expanded={containerTypesExpanded}
          aria-controls="container-types-content"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setContainerTypesExpanded(!containerTypesExpanded);
            }
          }}
        >
          <span className="expand-icon" aria-hidden="true">
            {containerTypesExpanded ? '▼' : '▶'}
          </span>
          <h4>Container Types</h4>
          <span
            className="filter-count"
            aria-label={`${totalContainerCounts.visible} of ${totalContainerCounts.total} container types visible`}
          >
            {totalContainerCounts.visible} / {totalContainerCounts.total}
          </span>
        </div>

        {containerTypesExpanded && (
          <div
            className="filter-section-content"
            id="container-types-content"
            role="region"
            aria-label="Container type filters"
          >
            <div className="filter-actions">
              <button
                className="filter-action-button"
                onClick={handleSelectAllContainerTypes}
                disabled={allContainerTypesSelected}
                aria-label="Select all container types"
              >
                Select All
              </button>
              <button
                className="filter-action-button"
                onClick={handleDeselectAllContainerTypes}
                disabled={selectedContainerTypes.size === 0}
                aria-label="Deselect all container types"
              >
                Deselect All
              </button>
            </div>

            <div className="filter-checkboxes" role="group" aria-label="Container type checkboxes">
              {Object.values(ContainerType).map((containerType) => {
                const counts = filterCounts.containerTypes?.[containerType];
                const isSelected = selectedContainerTypes.has(containerType);
                const hasElements = counts && counts.total > 0;

                return (
                  <label
                    key={containerType}
                    className={`filter-checkbox-label ${!hasElements ? 'disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onContainerTypeChange(containerType, e.target.checked)}
                      disabled={!hasElements}
                      aria-label={`${CONTAINER_TYPE_LABELS[containerType]}: ${counts ? `${counts.visible} of ${counts.total} visible` : 'none available'}`}
                    />
                    <span className="filter-icon">{CONTAINER_TYPE_ICONS[containerType]}</span>
                    <span className="filter-label-text">{CONTAINER_TYPE_LABELS[containerType]}</span>
                    <span className="filter-count-badge" aria-hidden="true">
                      {counts ? `${counts.visible}/${counts.total}` : '0/0'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Technologies Section */}
      {availableTechnologies.length > 0 && (
        <div className="filter-section">
          <div
            className="filter-section-header"
            onClick={() => setTechnologiesExpanded(!technologiesExpanded)}
            role="button"
            tabIndex={0}
            aria-expanded={technologiesExpanded}
            aria-controls="technologies-content"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setTechnologiesExpanded(!technologiesExpanded);
              }
            }}
          >
            <span className="expand-icon" aria-hidden="true">
              {technologiesExpanded ? '▼' : '▶'}
            </span>
            <h4>Technology Stack</h4>
            <span
              className="filter-count"
              aria-label={`${totalTechnologyCounts.visible} of ${totalTechnologyCounts.total} technologies visible`}
            >
              {selectedTechnologyStacks.size} / {availableTechnologies.length}
            </span>
          </div>

          {technologiesExpanded && (
            <div
              className="filter-section-content"
              id="technologies-content"
              role="region"
              aria-label="Technology stack filters"
            >
              <div className="filter-actions">
                <button
                  className="filter-action-button"
                  onClick={handleSelectAllTechnologies}
                  disabled={allTechnologiesSelected}
                  aria-label="Select all technologies"
                >
                  Select All
                </button>
                <button
                  className="filter-action-button"
                  onClick={handleDeselectAllTechnologies}
                  disabled={selectedTechnologyStacks.size === 0}
                  aria-label="Deselect all technologies"
                >
                  Deselect All
                </button>
              </div>

              <div
                className="filter-checkboxes technology-list"
                role="group"
                aria-label="Technology checkboxes"
              >
                {availableTechnologies.map((technology) => {
                  const counts = filterCounts.technologies?.[technology];
                  const isSelected = selectedTechnologyStacks.has(technology);

                  return (
                    <label key={technology} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onTechnologyChange(technology, e.target.checked)}
                        aria-label={`${technology}: ${counts ? `${counts.visible} of ${counts.total} visible` : 'available'}`}
                      />
                      <span className="filter-label-text technology-name">{technology}</span>
                      {counts && (
                        <span className="filter-count-badge" aria-hidden="true">
                          {counts.visible}/{counts.total}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default C4FilterPanel;
