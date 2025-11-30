/**
 * MotivationControlPanel Component
 *
 * Provides layout and view controls for motivation layer visualization:
 * - Layout algorithm switcher (Force-Directed | Hierarchical | Stakeholder Radial | Manual)
 * - "Fit to View" button
 * - Focus mode toggle (for Phase 4)
 * - Export and visualization controls
 */

import './MotivationControlPanel.css';
import { LayoutAlgorithmType } from '../types/layoutAlgorithm';

export type LayoutAlgorithm = 'force' | 'hierarchical' | 'radial' | 'manual';

export interface MotivationControlPanelProps {
  /** Currently selected layout algorithm */
  selectedLayout: LayoutAlgorithm;

  /** Callback when layout changes */
  onLayoutChange: (layout: LayoutAlgorithm) => void;

  /** Callback when "Fit to View" is clicked */
  onFitToView: () => void;

  /** Focus mode enabled (for Phase 4) */
  focusModeEnabled?: boolean;

  /** Callback when focus mode toggles (for Phase 4) */
  onFocusModeToggle?: (enabled: boolean) => void;

  /** Callback when "Clear Highlighting" is clicked (for Phase 4) */
  onClearHighlighting?: () => void;

  /** Whether path highlighting is active */
  isHighlightingActive?: boolean;

  /** Whether layout is currently computing */
  isLayouting?: boolean;

  /** Whether changeset visualization is enabled (Phase 5) */
  changesetVisualizationEnabled?: boolean;

  /** Callback when changeset visualization toggles (Phase 5) */
  onChangesetVisualizationToggle?: (enabled: boolean) => void;

  /** Whether changesets are available */
  hasChangesets?: boolean;

  /** Export callbacks (Phase 6) */
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
      <div className="control-panel-section">
        <label htmlFor="layout-selector" className="control-label">
          Layout Algorithm
        </label>
        <select
          id="layout-selector"
          className="layout-selector"
          value={selectedLayout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutAlgorithm)}
          disabled={isLayouting}
          aria-label="Select layout algorithm"
          aria-describedby="layout-description"
        >
          {LAYOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div id="layout-description" className="control-description" role="status" aria-live="polite">
          {LAYOUT_OPTIONS.find((opt) => opt.value === selectedLayout)?.description}
        </div>
      </div>

      <div className="control-panel-section">
        <button
          className="control-button"
          onClick={onFitToView}
          disabled={isLayouting}
          aria-label="Fit graph to viewport"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              x="2"
              y="2"
              width="12"
              height="12"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M5 5L7 7M11 5L9 7M5 11L7 9M11 11L9 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>Fit to View</span>
        </button>
      </div>

      {/* Focus Mode Toggle (Phase 4) */}
      {onFocusModeToggle && (
        <div className="control-panel-section">
          <label className="control-checkbox-label">
            <input
              type="checkbox"
              checked={focusModeEnabled}
              onChange={(e) => onFocusModeToggle(e.target.checked)}
              disabled={isLayouting}
              aria-label="Focus mode: dim non-focused elements for clarity"
              aria-describedby="focus-mode-description"
            />
            <span>Focus Mode</span>
          </label>
          <div id="focus-mode-description" className="control-description">Dim non-focused elements for clarity</div>
        </div>
      )}

      {/* Clear Highlighting Button (Phase 4) */}
      {onClearHighlighting && isHighlightingActive && (
        <div className="control-panel-section">
          <button
            className="control-button clear-button"
            onClick={onClearHighlighting}
            disabled={isLayouting}
            aria-label="Clear path highlighting"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>Clear Highlighting</span>
          </button>
        </div>
      )}

      {/* Changeset Visualization Toggle (Phase 5) */}
      {onChangesetVisualizationToggle && hasChangesets && (
        <div className="control-panel-section">
          <label className="control-checkbox-label">
            <input
              type="checkbox"
              checked={changesetVisualizationEnabled}
              onChange={(e) => onChangesetVisualizationToggle(e.target.checked)}
              disabled={isLayouting}
              aria-label="Show changeset modifications: highlight added, updated, and deleted elements"
              aria-describedby="changeset-viz-description"
            />
            <span>Show Changesets</span>
          </label>
          <div id="changeset-viz-description" className="control-description">
            Highlight added, updated, and deleted elements
          </div>
        </div>
      )}

      {/* Export Controls (Phase 6) */}
      {(onExportPNG || onExportSVG || onExportGraphData || onExportTraceabilityReport) && (
        <div className="control-panel-section export-section">
          <label className="control-label">Export</label>
          <div className="export-buttons">
            {onExportPNG && (
              <button
                className="control-button export-button"
                onClick={onExportPNG}
                disabled={isLayouting}
                aria-label="Export current view as PNG image"
                title="Export as PNG"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M8 2v8M8 10l-3-3M8 10l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 12h10v2H3z" fill="currentColor"/>
                </svg>
                <span>PNG</span>
              </button>
            )}
            {onExportSVG && (
              <button
                className="control-button export-button"
                onClick={onExportSVG}
                disabled={isLayouting}
                aria-label="Export current view as SVG vector image"
                title="Export as SVG"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M8 2v8M8 10l-3-3M8 10l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="2" y="11" width="12" height="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span>SVG</span>
              </button>
            )}
            {onExportGraphData && (
              <button
                className="control-button export-button"
                onClick={onExportGraphData}
                disabled={isLayouting}
                aria-label="Export filtered graph data as JSON"
                title="Export Graph Data"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M3 3h10M3 6h10M3 9h7M3 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
                <span>Data</span>
              </button>
            )}
            {onExportTraceabilityReport && (
              <button
                className="control-button export-button"
                onClick={onExportTraceabilityReport}
                disabled={isLayouting}
                aria-label="Export traceability report showing requirement to goal mapping"
                title="Export Traceability Report"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M7 4.5h5M7 4.5l2 2M9 11.5H4M9 11.5l-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Report</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLayouting && (
        <div className="control-panel-section">
          <div className="layout-progress">
            <div className="spinner-small"></div>
            <span>Computing layout...</span>
          </div>
        </div>
      )}
    </div>
  );
};
