/**
 * GraphToolbar Component
 * Toolbar for graph views with search, filters, zoom controls, and export
 * Matches Figma design with search bar and action buttons
 */

import { memo } from 'react';
import { Button, TextInput, Dropdown, DropdownItem } from 'flowbite-react';
import {
  HiSearch,
  HiFilter,
  HiZoomIn,
  HiZoomOut,
  HiViewGridAdd,
  HiDownload,
} from 'react-icons/hi';

export interface GraphToolbarProps {
  /** Search query value */
  searchQuery?: string;
  /** Search change handler */
  onSearchChange?: (query: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;

  /** Show filters button */
  showFilters?: boolean;
  /** Filters button click handler */
  onFiltersClick?: () => void;

  /** Show zoom controls */
  showZoomControls?: boolean;
  /** Zoom in handler */
  onZoomIn?: () => void;
  /** Zoom out handler */
  onZoomOut?: () => void;
  /** Fit to view handler */
  onFitView?: () => void;

  /** Export options */
  exportOptions?: {
    label: string;
    onClick: () => void;
  }[];
}

export const GraphToolbar = memo(
  ({
    searchQuery = '',
    onSearchChange,
    searchPlaceholder = 'Search nodes...',
    showFilters = true,
    onFiltersClick,
    showZoomControls = true,
    onZoomIn,
    onZoomOut,
    onFitView,
    exportOptions = [],
  }: GraphToolbarProps) => {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
        data-testid="graph-toolbar"
      >
        {/* Search */}
        {onSearchChange && (
          <div className="flex-1 max-w-md">
            <TextInput
              icon={HiSearch}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              sizing="md"
              data-testid="graph-search"
            />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Filters Button */}
        {showFilters && onFiltersClick && (
          <Button
            color="gray"
            size="sm"
            onClick={onFiltersClick}
            data-testid="filters-btn"
          >
            <HiFilter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        )}

        {/* Zoom Controls */}
        {showZoomControls && (
          <div className="flex gap-1" data-testid="zoom-controls">
            {onZoomIn && (
              <Button
                color="gray"
                size="sm"
                onClick={onZoomIn}
                data-testid="zoom-in-btn"
                aria-label="Zoom in"
              >
                <HiZoomIn className="h-4 w-4" />
              </Button>
            )}
            {onZoomOut && (
              <Button
                color="gray"
                size="sm"
                onClick={onZoomOut}
                data-testid="zoom-out-btn"
                aria-label="Zoom out"
              >
                <HiZoomOut className="h-4 w-4" />
              </Button>
            )}
            {onFitView && (
              <Button
                color="gray"
                size="sm"
                onClick={onFitView}
                data-testid="fit-view-btn"
                aria-label="Fit to view"
              >
                <HiViewGridAdd className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Export */}
        {exportOptions.length > 0 && (
          <Dropdown
            label="Export"
            color="gray"
            size="sm"
            data-testid="export-dropdown"
            renderTrigger={() => (
              <Button color="gray" size="sm">
                <HiDownload className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          >
            {exportOptions.map((option, index) => (
              <DropdownItem
                key={index}
                onClick={option.onClick}
                data-testid={`export-option-${index}`}
              >
                {option.label}
              </DropdownItem>
            ))}
          </Dropdown>
        )}
      </div>
    );
  }
);

GraphToolbar.displayName = 'GraphToolbar';
