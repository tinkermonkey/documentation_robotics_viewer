/**
 * BaseControlPanel Component
 *
 * Generic base component that consolidates shared UI structure for control panels.
 * Provides layout algorithm selector, fit to view button, focus mode toggle, highlighting controls,
 * and customizable export/domain-specific sections via children slot or render props.
 *
 * Supports multiple layout algorithms with type-safe layout selection via generic type parameter.
 * Domain-specific sections can be injected via children prop (rendered before layout selector)
 * or via render props for more granular control.
 */

import { memo } from 'react';
import { Card, Button, Select, Label, ToggleSwitch, Spinner } from 'flowbite-react';
import { Grid, X } from 'lucide-react';
import { LayoutOption, ExportOption } from './types';
import { wrapRenderPropVoid } from './RenderPropErrorBoundary';

/**
 * Render prop for custom sections
 */
export type ControlPanelRenderSlot = () => React.ReactNode;

/**
 * BaseControlPanel Props
 *
 * Generic type parameter TLayout enables type-safe layout selection.
 * Domain-specific sections provided via children slot (rendered before layout selector)
 * or via render props for fine-grained control.
 *
 * @template TLayout - Layout algorithm type (e.g., 'force' | 'hierarchical')
 */
export interface BaseControlPanelProps<TLayout extends string = string> {
  // Layout section
  /** Currently selected layout algorithm */
  selectedLayout: TLayout;

  /** Callback when layout changes - receives type-safe layout value */
  onLayoutChange: (layout: TLayout) => void;

  /** Available layout options for this layout type */
  layoutOptions: LayoutOption<TLayout>[];

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

  // Export configuration
  /** Available export options for this control panel */
  exportOptions?: ExportOption[];

  // Changeset controls
  /** Whether this domain has changesets */
  hasChangesets?: boolean;

  /** Changeset visualization enabled */
  changesetVisualizationEnabled?: boolean;

  /** Callback when changeset visualization toggles */
  onChangesetVisualizationToggle?: (enabled: boolean) => void;

  // Slot for domain-specific controls (rendered BEFORE layout selector)
  /** Domain-specific controls to render at top of panel */
  children?: React.ReactNode;

  // Render prop slots for additional fine-grained customization
  /** Render content before layout selector */
  renderBeforeLayout?: ControlPanelRenderSlot;

  /** Render content between layout selector and fit to view button */
  renderBetweenLayoutAndView?: ControlPanelRenderSlot;

  /** Render content between fit to view and focus mode */
  renderBetweenViewAndFocus?: ControlPanelRenderSlot;

  /** Render content between focus mode and clear highlighting */
  renderBetweenFocusAndClear?: ControlPanelRenderSlot;

  /** Render custom controls section (typically export buttons or other final controls) */
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
 * Domain-specific sections can be injected via:
 * - children prop (rendered before layout selector in a Card)
 * - render props for fine-grained control
 * - exportOptions for standardized export button rendering
 */
function BaseControlPanelComponent<TLayout extends string = string>(
  props: BaseControlPanelProps<TLayout>
) {
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
    exportOptions,
    hasChangesets = false,
    changesetVisualizationEnabled = false,
    onChangesetVisualizationToggle,
    children,
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
      {/* Custom render slot before layout selector */}
      {wrapRenderPropVoid(renderBeforeLayout, 'renderBeforeLayout')}

      {/* Domain-specific controls slot (rendered BEFORE layout selector) */}
      {children && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid={`${testId}-domain-controls`}>
          {children}
        </Card>
      )}

      {/* Layout Algorithm Selector */}
      <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid={`${testId}-layout-card`}>
        <div className="space-y-2">
          <Label htmlFor={`${testId}-layout-selector`}>Layout Algorithm</Label>
          <Select
            id={`${testId}-layout-selector`}
            className="layout-selector"
            value={selectedLayout}
            onChange={(e) => {
              const newValue = e.target.value;
              if (layoutOptions.some((opt) => opt.value === newValue)) {
                onLayoutChange(newValue as TLayout);
              } else {
                // Log warning for debugging - helps identify malformed select values
                console.warn(`[BaseControlPanel] Invalid layout value rejected: ${newValue}`);
              }
            }}
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
      </Card>

      {/* Custom content between layout and view controls */}
      {wrapRenderPropVoid(renderBetweenLayoutAndView, 'renderBetweenLayoutAndView')}

      {/* Fit to View Button */}
      <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid={`${testId}-fit-view-card`}>
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
      </Card>

      {/* Custom content between view and focus */}
      {wrapRenderPropVoid(renderBetweenViewAndFocus, 'renderBetweenViewAndFocus')}

      {/* Focus Mode Toggle */}
      {onFocusModeToggle && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid={`${testId}-focus-card`}>
          <ToggleSwitch
            checked={focusModeEnabled}
            label="Focus Mode"
            onChange={onFocusModeToggle}
            disabled={isLayouting}
            data-testid={`${testId}-focus-toggle`}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Dim non-focused elements for clarity
          </p>
        </Card>
      )}

      {/* Custom content between focus and clear highlighting */}
      {wrapRenderPropVoid(renderBetweenFocusAndClear, 'renderBetweenFocusAndClear')}

      {/* Clear Highlighting Button */}
      {onClearHighlighting && isHighlightingActive && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid={`${testId}-clear-card`}>
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
        </Card>
      )}

      {/* Changeset Visualization Toggle */}
      {hasChangesets && onChangesetVisualizationToggle && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid={`${testId}-changeset-card`}>
          <ToggleSwitch
            checked={changesetVisualizationEnabled}
            label="Show Changesets"
            onChange={onChangesetVisualizationToggle}
            disabled={isLayouting}
            data-testid={`${testId}-changeset-toggle`}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Visualize active changesets
          </p>
        </Card>
      )}

      {/* Export Controls */}
      {exportOptions && exportOptions.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid={`${testId}-export-card`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Export</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exportOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <Button
                  key={option.type}
                  color="gray"
                  size="sm"
                  onClick={option.onClick}
                  disabled={isLayouting}
                  data-testid={`${testId}-export-${option.type}-button`}
                >
                  <IconComponent className="mr-2 h-4 w-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Custom render slot for controls (e.g., export buttons from render prop) */}
      {wrapRenderPropVoid(renderControls, 'renderControls')}

      {/* Loading Indicator */}
      {isLayouting && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid={`${testId}-loading-card`}>
          <div className="flex items-center gap-2">
            <Spinner size="sm" data-testid={`${testId}-spinner`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Computing layout...</span>
          </div>
        </Card>
      )}
    </div>
  );
}

export const BaseControlPanel = memo(BaseControlPanelComponent) as <TLayout extends string = string>(
  props: BaseControlPanelProps<TLayout>
) => React.ReactElement;

// Set displayName for debugging
Object.defineProperty(BaseControlPanel, 'displayName', {
  value: 'BaseControlPanel',
  configurable: true,
});
