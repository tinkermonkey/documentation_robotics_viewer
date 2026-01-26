/**
 * BaseControlPanel Component
 *
 * Generic base component that consolidates shared UI structure for control panels.
 * Provides layout algorithm selector, fit to view button, focus mode toggle, highlighting controls,
 * and customizable export/domain-specific sections via render props (slots).
 *
 * Supports multiple layout algorithms and optional domain-specific sections through composition.
 */

import { memo } from 'react';
import { Button, Select, Label, ToggleSwitch, Spinner } from 'flowbite-react';
import { Grid, X } from 'lucide-react';

/**
 * Layout option configuration
 */
export interface LayoutOption {
  /** Layout identifier */
  value: string;
  /** Display label */
  label: string;
  /** Description shown below selector */
  description: string;
}

/**
 * Render prop for custom sections
 */
export type ControlPanelRenderSlot = () => React.ReactNode;

/**
 * BaseControlPanel Props
 *
 * Uses generic layout type (string) to support any layout algorithm naming.
 * Domain-specific sections provided via render props for slot-based composition.
 */
export interface BaseControlPanelProps {
  // Layout section
  /** Currently selected layout algorithm */
  selectedLayout: string;

  /** Callback when layout changes */
  onLayoutChange: (layout: string) => void;

  /** Available layout options */
  layoutOptions: LayoutOption[];

  // Navigation section
  /** Callback when "Fit to View" is clicked */
  onFitToView: () => void;

  // Focus & Highlighting section
  /** Focus mode enabled */
  focusModeEnabled?: boolean;

  /** Callback when focus mode toggles */
  onFocusModeToggle?: (enabled: boolean) => void;

  /** Whether path highlighting is active */
  isHighlightingActive?: boolean;

  /** Callback when "Clear Highlighting" is clicked */
  onClearHighlighting?: () => void;

  // State section
  /** Whether layout is currently computing */
  isLayouting?: boolean;

  // Render prop slots for domain-specific sections
  /** Render content before layout selector */
  renderBeforeLayout?: ControlPanelRenderSlot;

  /** Render content between layout selector and fit to view button */
  renderBetweenLayoutAndView?: ControlPanelRenderSlot;

  /** Render content between fit to view and focus mode */
  renderBetweenViewAndFocus?: ControlPanelRenderSlot;

  /** Render content between focus mode and clear highlighting */
  renderBetweenFocusAndClear?: ControlPanelRenderSlot;

  /** Render export or other control buttons */
  renderControls?: ControlPanelRenderSlot;

  // Styling & Testing
  /** CSS class for domain-specific styling */
  className?: string;

  /** data-testid for E2E tests */
  testId?: string;
}

/**
 * BaseControlPanel - Generic control panel component
 *
 * Implements slot-based composition pattern following BaseInspectorPanel approach.
 * Common sections (layout, fit to view, focus, highlighting) are built-in.
 * Domain-specific sections can be inserted via optional render props.
 */
function BaseControlPanelComponent(props: BaseControlPanelProps) {
  const {
    selectedLayout,
    onLayoutChange,
    layoutOptions,
    onFitToView,
    focusModeEnabled = false,
    onFocusModeToggle,
    isHighlightingActive = false,
    onClearHighlighting,
    isLayouting = false,
    renderBeforeLayout,
    renderBetweenLayoutAndView,
    renderBetweenViewAndFocus,
    renderBetweenFocusAndClear,
    renderControls,
    className = '',
    testId = 'control-panel',
  } = props;

  const selectedLayoutOption = layoutOptions.find((opt) => opt.value === selectedLayout);

  return (
    <div data-testid={testId} className={`control-panel space-y-4 ${className}`}>
      {/* Custom content before layout selector */}
      {renderBeforeLayout && renderBeforeLayout()}

      {/* Layout Algorithm Selector */}
      <div className="control-section" data-testid={`${testId}-layout-section`}>
        <div className="space-y-2">
          <Label htmlFor={`${testId}-layout-selector`}>Layout Algorithm</Label>
          <Select
            id={`${testId}-layout-selector`}
            className="layout-selector"
            value={selectedLayout}
            onChange={(e) => onLayoutChange(e.target.value)}
            disabled={isLayouting}
            data-testid={`${testId}-layout-select`}
          >
            {layoutOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {selectedLayoutOption && (
            <p
              className="text-sm text-gray-500 dark:text-gray-400"
              data-testid={`${testId}-layout-description`}
            >
              {selectedLayoutOption.description}
            </p>
          )}
        </div>
      </div>

      {/* Custom content between layout and view controls */}
      {renderBetweenLayoutAndView && renderBetweenLayoutAndView()}

      {/* Fit to View Button */}
      <div className="control-panel-section" data-testid={`${testId}-fit-view-section`}>
        <Button
          color="gray"
          onClick={onFitToView}
          disabled={isLayouting}
          size="sm"
          className="w-full"
          data-testid={`${testId}-fit-view-button`}
        >
          <Grid className="mr-2 h-4 w-4" />
          Fit to View
        </Button>
      </div>

      {/* Custom content between view and focus */}
      {renderBetweenViewAndFocus && renderBetweenViewAndFocus()}

      {/* Focus Mode Toggle */}
      {onFocusModeToggle && (
        <div className="control-panel-section" data-testid={`${testId}-focus-section`}>
          <ToggleSwitch
            checked={focusModeEnabled}
            label="Focus Mode"
            onChange={onFocusModeToggle}
            disabled={isLayouting}
            data-testid={`${testId}-focus-toggle`}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dim non-focused elements for clarity
          </p>
        </div>
      )}

      {/* Custom content between focus and clear highlighting */}
      {renderBetweenFocusAndClear && renderBetweenFocusAndClear()}

      {/* Clear Highlighting Button */}
      {onClearHighlighting && isHighlightingActive && (
        <div className="control-panel-section" data-testid={`${testId}-clear-section`}>
          <Button
            color="gray"
            onClick={onClearHighlighting}
            disabled={isLayouting}
            size="sm"
            className="w-full"
            data-testid={`${testId}-clear-button`}
          >
            <X className="mr-2 h-4 w-4" />
            Clear Highlighting
          </Button>
        </div>
      )}

      {/* Export and other controls */}
      {renderControls && renderControls()}

      {/* Loading Indicator */}
      {isLayouting && (
        <div className="control-panel-section" data-testid={`${testId}-loading-section`}>
          <div className="flex items-center gap-2">
            <Spinner size="sm" data-testid={`${testId}-spinner`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Computing layout...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export const BaseControlPanel = memo(BaseControlPanelComponent) as typeof BaseControlPanelComponent & {
  displayName: string;
};

BaseControlPanel.displayName = 'BaseControlPanel';
