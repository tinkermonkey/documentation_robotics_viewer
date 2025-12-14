/**
 * MotivationControlPanel Component
 *
 * Provides layout and view controls for motivation layer visualization:
 * - Layout algorithm switcher (Force-Directed | Hierarchical | Stakeholder Radial | Manual)
 * - "Fit to View" button
 * - Focus mode toggle
 * - Export and visualization controls
 */

import './MotivationControlPanel.css';
import { Button, Select, Label, ToggleSwitch, Spinner } from 'flowbite-react';
import { Grid, Download, X, FileText } from 'lucide-react';
import {  } from '../types/layoutAlgorithm';

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
 * Layout algorithm labels and descriptions
 */
const LAYOUT_OPTIONS: Array<{
  value: LayoutAlgorithm;
  label: string;
  description: string;
}> = [
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
 */
export const MotivationControlPanel: React.FC<MotivationControlPanelProps> = ({
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
}) => {
  return (
    <div className="motivation-control-panel">
      {/* Layout Algorithm Selector */}
      <div className="control-section">
        <div className="space-y-2">
          <Label htmlFor="layout-selector">Layout Algorithm</Label>
          <Select
            id="layout-selector"
            className="layout-selector"
            value={selectedLayout}
            onChange={(e) => onLayoutChange(e.target.value as LayoutAlgorithm)}
            disabled={isLayouting}
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

      {/* Fit to View Button */}
      <div className="control-panel-section">
        <Button
          color="gray"
          onClick={onFitToView}
          disabled={isLayouting}
          size="sm"
          className="w-full"
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

      {/* Changeset Visualization Toggle */}
      {onChangesetVisualizationToggle && hasChangesets && (
        <div className="control-panel-section">
          <ToggleSwitch
            checked={changesetVisualizationEnabled}
            label="Show Changesets"
            onChange={onChangesetVisualizationToggle}
            disabled={isLayouting}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Highlight added, updated, and deleted elements
          </p>
        </div>
      )}

      {/* Export Controls */}
      {(onExportPNG || onExportSVG || onExportGraphData || onExportTraceabilityReport) && (
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
              >
                <FileText className="mr-2 h-4 w-4" />
                Report
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
