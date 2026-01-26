/**
 * MotivationControlPanel Component
 *
 * Provides layout and view controls for motivation layer visualization:
 * - Layout algorithm switcher (Force-Directed | Hierarchical | Stakeholder Radial | Manual)
 * - "Fit to View" button
 * - Focus mode toggle
 * - Export and visualization controls
 *
 * Built on BaseControlPanel with slot-based composition for domain-specific sections.
 */

import { memo } from 'react';
import { Button, Label } from 'flowbite-react';
import { Download, FileText } from 'lucide-react';
import { BaseControlPanel, LayoutOption } from '@/core/components/base';

export type LayoutAlgorithm = 'force' | 'hierarchical' | 'radial' | 'manual';

export interface MotivationControlPanelProps {
  /** Currently selected layout algorithm */
  selectedLayout: LayoutAlgorithm;

  /** Callback when layout changes */
  onLayoutChange: (layout: LayoutAlgorithm) => void;

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

  /** Whether changeset visualization is enabled */
  changesetVisualizationEnabled?: boolean;

  /** Callback when changeset visualization toggles */
  onChangesetVisualizationToggle?: (enabled: boolean) => void;

  /** Whether changesets are available */
  hasChangesets?: boolean;

  /** Export callbacks */
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onExportGraphData?: () => void;
  onExportTraceabilityReport?: () => void;
}

/**
 * Layout algorithm options
 */
const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    value: 'force',
    label: 'Force-Directed',
    description: 'Network layout using physics simulation',
  },
  {
    value: 'hierarchical',
    label: 'Hierarchical',
    description: 'Top-down tree structure for goal hierarchies',
  },
  {
    value: 'radial',
    label: 'Stakeholder Radial',
    description: 'Radial layout centered on selected stakeholder',
  },
  {
    value: 'manual',
    label: 'Manual',
    description: 'Preserve user-adjusted node positions',
  },
];

/**
 * MotivationControlPanel Component
 *
 * Uses BaseControlPanel for common sections and slot-based composition
 * to inject changeset visualization and export controls.
 */
function MotivationControlPanelComponent(props: MotivationControlPanelProps) {
  const {
    selectedLayout,
    onLayoutChange,
    onFitToView,
    focusModeEnabled = false,
    onFocusModeToggle,
    onClearHighlighting,
    isHighlightingActive = false,
    isLayouting = false,
    changesetVisualizationEnabled = false,
    onChangesetVisualizationToggle,
    hasChangesets = false,
    onExportPNG,
    onExportSVG,
    onExportGraphData,
    onExportTraceabilityReport,
  } = props;

  // Render changeset visualization section
  const renderChangesetVisualization = () => {
    if (!onChangesetVisualizationToggle || !hasChangesets) {
      return null;
    }

    return (
      <div
        className="control-panel-section"
        key="changeset-viz"
        data-testid="motivation-changeset-viz-section"
      >
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={changesetVisualizationEnabled}
            onChange={(e) => onChangesetVisualizationToggle(e.target.checked)}
            disabled={isLayouting}
            data-testid="motivation-changeset-toggle"
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Show Changesets</span>
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Highlight added, updated, and deleted elements
        </p>
      </div>
    );
  };

  // Render export controls section
  const renderExportControls = () => {
    if (!onExportPNG && !onExportSVG && !onExportGraphData && !onExportTraceabilityReport) {
      return null;
    }

    return (
      <div
        className="control-panel-section export-section"
        key="exports"
        data-testid="motivation-export-section"
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
              data-testid="motivation-export-png"
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
              data-testid="motivation-export-svg"
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
              data-testid="motivation-export-data"
            >
              <Download className="mr-2 h-4 w-4" />
              Data
            </Button>
          )}
          {onExportTraceabilityReport && (
            <Button
              color="gray"
              onClick={onExportTraceabilityReport}
              disabled={isLayouting}
              size="sm"
              title="Export Traceability Report"
              data-testid="motivation-export-report"
            >
              <FileText className="mr-2 h-4 w-4" />
              Report
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="motivation-control-panel">
      <BaseControlPanel
        selectedLayout={selectedLayout}
        onLayoutChange={(layout) => onLayoutChange(layout as LayoutAlgorithm)}
        layoutOptions={LAYOUT_OPTIONS}
        onFitToView={onFitToView}
        focusModeEnabled={focusModeEnabled}
        onFocusModeToggle={onFocusModeToggle}
        isHighlightingActive={isHighlightingActive}
        onClearHighlighting={onClearHighlighting}
        isLayouting={isLayouting}
        renderBetweenFocusAndClear={renderChangesetVisualization}
        renderControls={renderExportControls}
        testId="motivation-control-panel"
      />
    </div>
  );
}

export const MotivationControlPanel = memo(
  MotivationControlPanelComponent
) as typeof MotivationControlPanelComponent & { displayName: string };

MotivationControlPanel.displayName = 'MotivationControlPanel';
