/**
 * C4ControlPanel Component
 *
 * Provides layout and view controls for C4 visualization:
 * - View level switcher (Context | Container | Component)
 * - Layout algorithm switcher (Hierarchical | Force | Orthogonal | Manual)
 * - Scenario preset selector (Data Flow | Deployment | Technology Stack | API Surface | Dependencies)
 * - "Fit to View" button
 * - Focus mode toggle
 * - Changeset filter toggle
 * - Export controls (PNG, SVG, JSON)
 */

import React from 'react';
import { Button, Select, Label, ToggleSwitch, Spinner, ButtonGroup } from 'flowbite-react';
import { Grid, Download, X } from 'lucide-react';
import './C4ControlPanel.css';
import { C4ViewLevel, C4ScenarioPreset, C4_SCENARIO_PRESETS } from '../types/c4Graph';

export type C4LayoutAlgorithm = 'hierarchical' | 'orthogonal' | 'force' | 'manual';

export interface C4ControlPanelProps {
  /** Currently selected layout algorithm */
  selectedLayout: C4LayoutAlgorithm;

  /** Current view level */
  currentViewLevel: C4ViewLevel;

  /** Callback when layout changes */
  onLayoutChange: (layout: C4LayoutAlgorithm) => void;

  /** Callback when view level changes */
  onViewLevelChange: (level: C4ViewLevel, containerId?: string, componentId?: string) => void;

  /** Callback when "Fit to View" is clicked */
  onFitToView: () => void;

  /** Focus mode enabled */
  focusModeEnabled?: boolean;

  /** Callback when focus mode toggles */
  onFocusModeToggle?: (enabled: boolean) => void;

  /** Callback when "Clear Highlighting" is clicked */
  onClearHighlighting?: () => void;

  /** Whether path highlighting is active */
  isHighlightingActive?: boolean;

  /** Whether layout is currently computing */
  isLayouting?: boolean;

  /** Export callbacks */
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onExportGraphData?: () => void;

  /** Whether a container is selected (enables component view) */
  hasSelectedContainer?: boolean;

  /** Currently active scenario preset */
  scenarioPreset?: C4ScenarioPreset;

  /** Callback when scenario preset changes */
  onScenarioPresetChange?: (preset: C4ScenarioPreset) => void;

  /** Whether changeset filter is active */
  showOnlyChangeset?: boolean;

  /** Callback when changeset filter toggles */
  onChangesetFilterToggle?: (enabled: boolean) => void;

  /** Whether there are changeset elements to show */
  hasChangesetElements?: boolean;
}

/**
 * Layout algorithm labels and descriptions
 */
const LAYOUT_OPTIONS: Array<{
  value: C4LayoutAlgorithm;
  label: string;
  description: string;
}> = [
  {
    value: 'hierarchical',
    label: 'Hierarchical',
    description: 'Top-down tiered layout for architecture diagrams',
  },
  {
    value: 'force',
    label: 'Force-Directed',
    description: 'Network layout using physics simulation',
  },
  {
    value: 'orthogonal',
    label: 'Orthogonal',
    description: 'Right-angle edge routing for clean diagrams',
  },
  {
    value: 'manual',
    label: 'Manual',
    description: 'Preserve user-adjusted node positions',
  },
];

/**
 * View level options
 */
const VIEW_LEVEL_OPTIONS: Array<{
  value: C4ViewLevel;
  label: string;
  icon: React.ReactElement;
  description: string;
}> = [
  {
    value: 'context',
    label: 'Context',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    ),
    description: 'System context with external actors',
  },
  {
    value: 'container',
    label: 'Container',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M2 6h12" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    description: 'Container view with internal components',
  },
  {
    value: 'component',
    label: 'Component',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M6 2v12M10 2v12M2 6h12M2 10h12" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
    description: 'Component internals (select a container first)',
  },
];

/**
 * Scenario preset icons
 */
const getPresetIcon = (iconName: string): React.ReactElement => {
  switch (iconName) {
    case 'database':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <ellipse cx="8" cy="4" rx="5" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'server':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="2" y="8" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="10" cy="4" r="1" fill="currentColor" />
          <circle cx="10" cy="10" r="1" fill="currentColor" />
        </svg>
      );
    case 'layers':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2L2 5l6 3 6-3-6-3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M2 8l6 3 6-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M2 11l6 3 6-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'globe':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M2 8h12M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      );
    case 'git-branch':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M4 6v4M4 8h6c1 0 2-1 2-2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
  }
};

/**
 * C4ControlPanel Component
 */
export const C4ControlPanel: React.FC<C4ControlPanelProps> = ({
  selectedLayout,
  currentViewLevel,
  onLayoutChange,
  onViewLevelChange,
  onFitToView,
  focusModeEnabled = false,
  onFocusModeToggle,
  onClearHighlighting,
  isHighlightingActive = false,
  isLayouting = false,
  onExportPNG,
  onExportSVG,
  onExportGraphData,
  hasSelectedContainer = false,
  scenarioPreset,
  onScenarioPresetChange,
  showOnlyChangeset = false,
  onChangesetFilterToggle,
  hasChangesetElements = false,
}) => {
  return (
    <div className="c4-control-panel">
      {/* View Level Switcher */}
      <div className="control-panel-section">
        <Label>View Level</Label>
        <ButtonGroup className="w-full">
          {VIEW_LEVEL_OPTIONS.map((option) => {
            const isDisabled =
              isLayouting ||
              (option.value === 'component' && !hasSelectedContainer);

            return (
              <Button
                key={option.value}
                color={currentViewLevel === option.value ? 'blue' : 'gray'}
                onClick={() => onViewLevelChange(option.value)}
                disabled={isDisabled}
                size="sm"
                className="flex-1 view-level-button"
                title={option.description}
              >
                <span className="mr-2">{option.icon}</span>
                <span>{option.label}</span>
              </Button>
            );
          })}
        </ButtonGroup>
      </div>

      {/* Layout Algorithm Selector */}
      <div className="control-panel-section">
        <div className="space-y-2">
          <Label htmlFor="c4-layout-selector">Layout Algorithm</Label>
          <Select
            id="c4-layout-selector"
            value={selectedLayout}
            onChange={(e) => onLayoutChange(e.target.value as C4LayoutAlgorithm)}
            disabled={isLayouting}
            className="layout-selector"
          >
            {LAYOUT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {LAYOUT_OPTIONS.find((opt) => opt.value === selectedLayout)?.description}
          </p>
        </div>
      </div>

      {/* Scenario Preset Selector */}
      {onScenarioPresetChange && (
        <div className="control-panel-section">
          <Label>Scenario Preset</Label>
          <div className="scenario-preset-buttons" role="radiogroup" aria-label="Select scenario preset">
            {C4_SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={`scenario-preset-button ${scenarioPreset === preset.id ? 'active' : ''}`}
                onClick={() => onScenarioPresetChange(scenarioPreset === preset.id ? null : preset.id)}
                disabled={isLayouting}
                role="radio"
                aria-checked={scenarioPreset === preset.id}
                aria-label={preset.description}
                title={preset.description}
              >
                <span className="preset-icon">{getPresetIcon(preset.icon)}</span>
                <span className="preset-label">{preset.label}</span>
              </button>
            ))}
          </div>
          {scenarioPreset && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {C4_SCENARIO_PRESETS.find((p) => p.id === scenarioPreset)?.description}
            </p>
          )}
        </div>
      )}

      {/* Changeset Filter Toggle */}
      {onChangesetFilterToggle && hasChangesetElements && (
        <div className="control-panel-section">
          <ToggleSwitch
            checked={showOnlyChangeset}
            label="Show Changeset Only"
            onChange={onChangesetFilterToggle}
            disabled={isLayouting}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Filter to show only new, modified, or deleted elements
          </p>
        </div>
      )}

      {/* Fit to View Button */}
      <div className="control-panel-section">
        <Button
          color="gray"
          onClick={onFitToView}
          disabled={isLayouting}
          size="sm"
          className="w-full control-button"
        >
          <Grid className="mr-2 h-4 w-4" />
          Fit to View
        </Button>
      </div>

      {/* Focus Mode Toggle */}
      {onFocusModeToggle && (
        <div className="control-panel-section">
          <ToggleSwitch
            checked={focusModeEnabled}
            label="Focus Mode"
            onChange={onFocusModeToggle}
            disabled={isLayouting}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dim non-focused elements for clarity
          </p>
        </div>
      )}

      {/* Clear Highlighting Button */}
      {onClearHighlighting && isHighlightingActive && (
        <div className="control-panel-section">
          <Button
            color="gray"
            onClick={onClearHighlighting}
            disabled={isLayouting}
            size="sm"
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Highlighting
          </Button>
        </div>
      )}

      {/* Export Controls */}
      {(onExportPNG || onExportSVG || onExportGraphData) && (
        <div className="control-panel-section export-section">
          <Label>Export</Label>
          <div className="flex flex-col gap-2">
            {onExportPNG && (
              <Button
                color="gray"
                onClick={onExportPNG}
                disabled={isLayouting}
                size="sm"
                title="Export as PNG"
                className="export-button"
              >
                <Download className="mr-2 h-4 w-4" />
                PNG
              </Button>
            )}
            {onExportSVG && (
              <Button
                color="gray"
                onClick={onExportSVG}
                disabled={isLayouting}
                size="sm"
                title="Export as SVG"
                className="export-button"
              >
                <Download className="mr-2 h-4 w-4" />
                SVG
              </Button>
            )}
            {onExportGraphData && (
              <Button
                color="gray"
                onClick={onExportGraphData}
                disabled={isLayouting}
                size="sm"
                title="Export Graph Data"
                className="export-button"
              >
                <Download className="mr-2 h-4 w-4" />
                Data
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLayouting && (
        <div className="control-panel-section">
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Computing layout...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default C4ControlPanel;
