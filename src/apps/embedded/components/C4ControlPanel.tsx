/**
 * C4ControlPanel Component
 *
 * Provides layout and view controls for C4 visualization:
 * - View level switcher (Context | Container | Component)
 * - Layout algorithm switcher (Hierarchical | Force | Orthogonal | Manual)
 * - "Fit to View" button
 * - Focus mode toggle
 * - Export controls (PNG, SVG, JSON)
 */

import React from 'react';
import './C4ControlPanel.css';
import { C4ViewLevel } from '../types/c4Graph';

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
  icon: JSX.Element;
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
}) => {
  return (
    <div className="c4-control-panel">
      {/* View Level Switcher */}
      <div className="control-panel-section">
        <label className="control-label">View Level</label>
        <div className="view-level-buttons" role="radiogroup" aria-label="Select view level">
          {VIEW_LEVEL_OPTIONS.map((option) => {
            const isDisabled =
              isLayouting ||
              (option.value === 'component' && !hasSelectedContainer);

            return (
              <button
                key={option.value}
                className={`view-level-button ${currentViewLevel === option.value ? 'active' : ''}`}
                onClick={() => onViewLevelChange(option.value)}
                disabled={isDisabled}
                role="radio"
                aria-checked={currentViewLevel === option.value}
                aria-label={option.description}
                title={option.description}
              >
                <span className="view-level-icon">{option.icon}</span>
                <span className="view-level-label">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout Algorithm Selector */}
      <div className="control-panel-section">
        <label htmlFor="c4-layout-selector" className="control-label">
          Layout Algorithm
        </label>
        <select
          id="c4-layout-selector"
          className="layout-selector"
          value={selectedLayout}
          onChange={(e) => onLayoutChange(e.target.value as C4LayoutAlgorithm)}
          disabled={isLayouting}
          aria-label="Select layout algorithm"
          aria-describedby="c4-layout-description"
        >
          {LAYOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div id="c4-layout-description" className="control-description" role="status" aria-live="polite">
          {LAYOUT_OPTIONS.find((opt) => opt.value === selectedLayout)?.description}
        </div>
      </div>

      {/* Fit to View Button */}
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

      {/* Focus Mode Toggle */}
      {onFocusModeToggle && (
        <div className="control-panel-section">
          <label className="control-checkbox-label">
            <input
              type="checkbox"
              checked={focusModeEnabled}
              onChange={(e) => onFocusModeToggle(e.target.checked)}
              disabled={isLayouting}
              aria-label="Focus mode: dim non-focused elements for clarity"
              aria-describedby="c4-focus-mode-description"
            />
            <span>Focus Mode</span>
          </label>
          <div id="c4-focus-mode-description" className="control-description">
            Dim non-focused elements for clarity
          </div>
        </div>
      )}

      {/* Clear Highlighting Button */}
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

      {/* Export Controls */}
      {(onExportPNG || onExportSVG || onExportGraphData) && (
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M8 2v8M8 10l-3-3M8 10l3-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M3 12h10v2H3z" fill="currentColor" />
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M8 2v8M8 10l-3-3M8 10l3-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect x="2" y="11" width="12" height="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span>SVG</span>
              </button>
            )}
            {onExportGraphData && (
              <button
                className="control-button export-button"
                onClick={onExportGraphData}
                disabled={isLayouting}
                aria-label="Export C4 graph data as JSON"
                title="Export Graph Data"
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
                    d="M3 3h10M3 6h10M3 9h7M3 12h7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
                <span>Data</span>
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

export default C4ControlPanel;
