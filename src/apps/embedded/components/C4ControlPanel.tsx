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
 *
 * Built on BaseControlPanel with slot-based composition for C4-specific sections.
 */

import React, { memo } from 'react';
import { Button, Label, ToggleSwitch, ButtonGroup } from 'flowbite-react';
import { Download } from 'lucide-react';
import { BaseControlPanel, LayoutOption } from '@/core/components/base';
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
 * Layout algorithm options
 */
const LAYOUT_OPTIONS: LayoutOption[] = [
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
 * C4ControlPanel Component
 *
 * Uses BaseControlPanel for common sections and slot-based composition
 * to inject C4-specific sections (view level, scenario presets, changeset filter).
 */
function C4ControlPanelComponent(props: C4ControlPanelProps) {
  const {
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
  } = props;

  // Render view level switcher before layout
  const renderViewLevelSwitcher = () => (
    <div
      className="control-panel-section"
      key="view-level"
      data-testid="c4-view-level-section"
    >
      <Label>View Level</Label>
      <ButtonGroup className="w-full">
        {VIEW_LEVEL_OPTIONS.map((option) => {
          const isDisabled = isLayouting || (option.value === 'component' && !hasSelectedContainer);

          return (
            <Button
              key={option.value}
              color={currentViewLevel === option.value ? 'blue' : 'gray'}
              onClick={() => onViewLevelChange(option.value)}
              disabled={isDisabled}
              size="sm"
              className="flex-1 view-level-button"
              title={option.description}
              data-testid={`c4-view-level-${option.value}`}
            >
              <span className="mr-2">{option.icon}</span>
              <span>{option.label}</span>
            </Button>
          );
        })}
      </ButtonGroup>
    </div>
  );

  // Render scenario presets between layout and focus
  const renderScenarioPresets = () => {
    if (!onScenarioPresetChange) {
      return null;
    }

    return (
      <div
        className="control-panel-section"
        key="scenario-presets"
        data-testid="c4-scenario-section"
      >
        <Label>Scenario Preset</Label>
        <div
          className="scenario-preset-buttons"
          role="radiogroup"
          aria-label="Select scenario preset"
        >
          {C4_SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`scenario-preset-button ${scenarioPreset === preset.id ? 'active' : ''}`}
              onClick={() =>
                onScenarioPresetChange(scenarioPreset === preset.id ? null : preset.id)
              }
              disabled={isLayouting}
              role="radio"
              aria-checked={scenarioPreset === preset.id}
              aria-label={preset.description}
              title={preset.description}
              data-testid={`c4-scenario-${preset.id}`}
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
    );
  };

  // Render changeset filter between focus and clear highlighting
  const renderChangesetFilter = () => {
    if (!onChangesetFilterToggle || !hasChangesetElements) {
      return null;
    }

    return (
      <div
        className="control-panel-section"
        key="changeset-filter"
        data-testid="c4-changeset-filter-section"
      >
        <ToggleSwitch
          checked={showOnlyChangeset}
          label="Show Changeset Only"
          onChange={onChangesetFilterToggle}
          disabled={isLayouting}
          data-testid="c4-changeset-toggle"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Filter to show only new, modified, or deleted elements
        </p>
      </div>
    );
  };

  // Render export controls
  const renderExportControls = () => {
    if (!onExportPNG && !onExportSVG && !onExportGraphData) {
      return null;
    }

    return (
      <div
        className="control-panel-section export-section"
        key="exports"
        data-testid="c4-export-section"
      >
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
              data-testid="c4-export-png"
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
              data-testid="c4-export-svg"
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
              data-testid="c4-export-data"
            >
              <Download className="mr-2 h-4 w-4" />
              Data
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="c4-control-panel">
      <BaseControlPanel
        selectedLayout={selectedLayout}
        onLayoutChange={(layout) => onLayoutChange(layout as C4LayoutAlgorithm)}
        layoutOptions={LAYOUT_OPTIONS}
        onFitToView={onFitToView}
        focusModeEnabled={focusModeEnabled}
        onFocusModeToggle={onFocusModeToggle}
        isHighlightingActive={isHighlightingActive}
        onClearHighlighting={onClearHighlighting}
        isLayouting={isLayouting}
        renderBeforeLayout={renderViewLevelSwitcher}
        renderBetweenViewAndFocus={renderScenarioPresets}
        renderBetweenFocusAndClear={renderChangesetFilter}
        renderControls={renderExportControls}
        testId="c4-control-panel"
      />
    </div>
  );
}

export const C4ControlPanel = memo(C4ControlPanelComponent) as typeof C4ControlPanelComponent & {
  displayName: string;
};

C4ControlPanel.displayName = 'C4ControlPanel';

export default C4ControlPanel;
