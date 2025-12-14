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

import './C4FilterPanel.css';
import { ContainerType } from '../types/c4Graph';
import { Accordion, AccordionPanel, AccordionTitle, AccordionContent, Checkbox, Label, Button } from 'flowbite-react';
import { X } from 'lucide-react';

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
const CONTAINER_TYPE_ICONS: Record<ContainerType, React.ReactElement> = {
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
  // const [containerTypesExpanded, setContainerTypesExpanded] = useState(true);
  // const [technologiesExpanded, setTechnologiesExpanded] = useState(true);

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
  // const totalTechnologyCounts = Object.values(filterCounts.technologies || {}).reduce(
  //   (acc, counts) => ({
  //     visible: acc.visible + (counts?.visible || 0),
  //     total: acc.total + (counts?.total || 0),
  //   }),
  //   { visible: 0, total: 0 }
  // );

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
    <div className="c4-filter-panel" aria-label="C4 element filters">
      <div className="filter-panel-header">
        <h3>Filters</h3>
        <Button
          color="gray"
          size="xs"
          onClick={onClearAllFilters}
          disabled={allContainerTypesSelected && allTechnologiesSelected}
          title="Clear all filters and show all elements"
        >
          <X className="mr-1 h-3 w-3" />
          Clear All
        </Button>
      </div>

      <Accordion collapseAll={false}>
        {/* Container Types Section */}
        <AccordionPanel>
          <AccordionTitle>
            <div className="flex items-center justify-between w-full pr-4">
              <span>Container Types</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {totalContainerCounts.visible} / {totalContainerCounts.total}
              </span>
            </div>
          </AccordionTitle>
          <AccordionContent>
            <div className="flex gap-2 mb-3">
              <Button
                size="xs"
                color="light"
                onClick={handleSelectAllContainerTypes}
                disabled={allContainerTypesSelected}
              >
                Select All
              </Button>
              <Button
                size="xs"
                color="light"
                onClick={handleDeselectAllContainerTypes}
                disabled={selectedContainerTypes.size === 0}
              >
                Deselect All
              </Button>
            </div>

            <div className="space-y-2">
              {Object.values(ContainerType).map((containerType) => {
                const counts = filterCounts.containerTypes?.[containerType];
                const isSelected = selectedContainerTypes.has(containerType);
                const hasElements = counts && counts.total > 0;

                return (
                  <div key={containerType} className="flex items-center justify-between">
                    <Checkbox
                      id={`container-${containerType}`}
                      checked={isSelected}
                      onChange={(e) => onContainerTypeChange(containerType, e.target.checked)}
                      disabled={!hasElements}
                    />
                    <Label
                      htmlFor={`container-${containerType}`}
                      className="flex items-center gap-2 flex-1 ml-2"
                      disabled={!hasElements}
                    >
                      <span className="filter-icon" aria-hidden="true">{CONTAINER_TYPE_ICONS[containerType]}</span>
                      <span className="flex-1">{CONTAINER_TYPE_LABELS[containerType]}</span>
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

      {/* Technologies Section - Separate Accordion */}
      {availableTechnologies.length > 0 && (
        <Accordion collapseAll={false}>
          <AccordionPanel>
            <AccordionTitle>
              <div className="flex items-center justify-between w-full pr-4">
                <span>Technology Stack</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedTechnologyStacks.size} / {availableTechnologies.length}
                </span>
              </div>
            </AccordionTitle>
            <AccordionContent>
              <div className="flex gap-2 mb-3">
                <Button
                  size="xs"
                  color="light"
                  onClick={handleSelectAllTechnologies}
                  disabled={allTechnologiesSelected}
                >
                  Select All
                </Button>
                <Button
                  size="xs"
                  color="light"
                  onClick={handleDeselectAllTechnologies}
                  disabled={selectedTechnologyStacks.size === 0}
                >
                  Deselect All
                </Button>
              </div>

              <div className="space-y-2">
                {availableTechnologies.map((technology) => {
                  const counts = filterCounts.technologies?.[technology];
                  const isSelected = selectedTechnologyStacks.has(technology);

                  return (
                    <div key={technology} className="flex items-center justify-between">
                      <Checkbox
                        id={`tech-${technology}`}
                        checked={isSelected}
                        onChange={(e) => onTechnologyChange(technology, e.target.checked)}
                      />
                      <Label
                        htmlFor={`tech-${technology}`}
                        className="flex items-center gap-2 flex-1 ml-2"
                      >
                        <span className="flex-1">{technology}</span>
                        {counts && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {counts.visible}/{counts.total}
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      )}
    </div>
  );
};

export default C4FilterPanel;
