/**
 * FilterPanel Component
 * Unified filter panel for all graph views (C4, Motivation, etc.)
 * Supports multiple filter sections with checkboxes, bulk actions, and item counts
 */

import { memo } from 'react';
import {
  Accordion,
  AccordionPanel,
  AccordionTitle,
  AccordionContent,
  Checkbox,
  Label,
  Button,
} from 'flowbite-react';
import { X } from 'lucide-react';

/**
 * Individual filter item
 */
export interface FilterItem<T extends string = string> {
  /** Unique value identifier */
  value: T;
  /** Display label */
  label: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Item counts (visible/total) */
  count?: {
    visible: number;
    total: number;
  };
}

/**
 * Filter section configuration
 */
export interface FilterSection<T extends string = string> {
  /** Unique section ID */
  id: string;
  /** Section title */
  title: string;
  /** Filter items in this section */
  items: FilterItem<T>[];
  /** Currently selected values */
  selectedValues: Set<T>;
  /** Callback when item selection changes */
  onToggle: (value: T, selected: boolean) => void;
}

export interface FilterPanelProps<T extends string = string> {
  /** Filter sections */
  sections: FilterSection<T>[];
  /** Callback to clear all filters */
  onClearAll?: () => void;
  /** Show Clear All button */
  showClearAll?: boolean;
  /** Custom class name */
  className?: string;
}

const FilterPanelComponent = <T extends string = string>({
  sections,
  onClearAll,
  showClearAll = true,
  className = '',
}: FilterPanelProps<T>) => {
    /**
     * Check if all filters are selected
     */
    const allFiltersSelected = sections.every((section) =>
      section.items.every((item) => section.selectedValues.has(item.value))
    );

    /**
     * Calculate total counts across all sections
     */
    const totalCounts = sections.reduce(
      (acc, section) => {
        section.items.forEach((item) => {
          if (item.count) {
            acc.visible += item.count.visible;
            acc.total += item.count.total;
          }
        });
        return acc;
      },
      { visible: 0, total: 0 }
    );

    /**
     * Handle "Select All" for a section
     */
    const handleSelectAll = (section: FilterSection<T>) => {
      section.items.forEach((item) => {
        if (!section.selectedValues.has(item.value) && (!item.count || item.count.total > 0)) {
          section.onToggle(item.value, true);
        }
      });
    };

    /**
     * Handle "Deselect All" for a section
     */
    const handleDeselectAll = (section: FilterSection<T>) => {
      section.items.forEach((item) => {
        if (section.selectedValues.has(item.value)) {
          section.onToggle(item.value, false);
        }
      });
    };

    /**
     * Calculate section totals
     */
    const getSectionCounts = (section: FilterSection<T>) => {
      return section.items.reduce(
        (acc, item) => {
          if (item.count) {
            acc.visible += item.count.visible;
            acc.total += item.count.total;
          }
          return acc;
        },
        { visible: 0, total: 0 }
      );
    };

    /**
     * Check if all items in a section are selected
     */
    const isSectionFullySelected = (section: FilterSection<T>) => {
      return section.items
        .filter((item) => !item.count || item.count.total > 0)
        .every((item) => section.selectedValues.has(item.value));
    };

    return (
      <div className={`space-y-4 ${className}`} data-testid="filter-panel">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Filters
            {totalCounts.total > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                ({totalCounts.visible} / {totalCounts.total})
              </span>
            )}
          </h3>
          {showClearAll && onClearAll && (
            <Button
              color="gray"
              size="xs"
              onClick={onClearAll}
              disabled={allFiltersSelected}
              title="Clear all filters and show all elements"
              data-testid="clear-all-filters-btn"
            >
              <X className="mr-1 h-3 w-3" />
              Clear All
            </Button>
          )}
        </div>

        {/* Filter Sections */}
        <Accordion collapseAll={false}>
          {sections.map((section) => {
            const sectionCounts = getSectionCounts(section);
            const allSelected = isSectionFullySelected(section);
            const noneSelected = section.selectedValues.size === 0;

            return (
              <AccordionPanel key={section.id}>
                <AccordionTitle>
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{section.title}</span>
                    {sectionCounts.total > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {sectionCounts.visible} / {sectionCounts.total}
                      </span>
                    )}
                  </div>
                </AccordionTitle>
                <AccordionContent>
                  {/* Bulk Actions */}
                  <div className="flex gap-2 mb-3">
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => handleSelectAll(section)}
                      disabled={allSelected}
                      data-testid={`select-all-${section.id}`}
                    >
                      Select All
                    </Button>
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => handleDeselectAll(section)}
                      disabled={noneSelected}
                      data-testid={`deselect-all-${section.id}`}
                    >
                      Deselect All
                    </Button>
                  </div>

                  {/* Filter Items */}
                  <div className="space-y-2">
                    {section.items.map((item) => {
                      const isSelected = section.selectedValues.has(item.value);
                      const hasElements = !item.count || item.count.total > 0;

                      return (
                        <div
                          key={item.value}
                          className="flex items-center justify-between"
                          data-testid={`filter-item-${item.value}`}
                        >
                          <Checkbox
                            id={`filter-${section.id}-${item.value}`}
                            checked={isSelected}
                            onChange={(e) => section.onToggle(item.value, e.target.checked)}
                            disabled={!hasElements}
                          />
                          <Label
                            htmlFor={`filter-${section.id}-${item.value}`}
                            className="flex items-center gap-2 flex-1 ml-2 cursor-pointer"
                            disabled={!hasElements}
                          >
                            {item.icon && (
                              <span className="flex-shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true">
                                {item.icon}
                              </span>
                            )}
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                              {item.label}
                            </span>
                            {item.count && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {item.count.visible}/{item.count.total}
                              </span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionPanel>
            );
          })}
        </Accordion>
      </div>
    );
};

export const FilterPanel = memo(FilterPanelComponent) as typeof FilterPanelComponent;

FilterPanelComponent.displayName = 'FilterPanel';
