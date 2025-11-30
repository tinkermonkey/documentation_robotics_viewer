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

  /** Whether layout is currently computing */
  isLayouting?: boolean;
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
  isLayouting = false,
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
