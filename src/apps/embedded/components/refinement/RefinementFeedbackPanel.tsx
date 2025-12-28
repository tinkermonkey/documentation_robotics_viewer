/**
 * RefinementFeedbackPanel Component
 *
 * Interactive panel for human feedback during the refinement process.
 * Provides quick feedback buttons, custom feedback form, and action controls.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  RefinementFeedbackPanelProps,
  FeedbackAspect,
  FeedbackDirection,
  FeedbackIntensity,
  QualityTier,
} from '../../types/refinement';

/**
 * Get quality tier from combined score
 */
function getQualityTier(score: number): QualityTier {
  if (score >= 0.9) return 'excellent';
  if (score >= 0.8) return 'good';
  if (score >= 0.7) return 'acceptable';
  if (score >= 0.5) return 'poor';
  return 'unacceptable';
}

/**
 * Quick feedback button configuration
 */
interface QuickFeedbackButton {
  label: string;
  aspect: FeedbackAspect;
  direction: FeedbackDirection;
  intensity: FeedbackIntensity;
  icon: string;
}

const QUICK_FEEDBACK_BUTTONS: QuickFeedbackButton[] = [
  { label: 'More Spacing', aspect: 'spacing', direction: 'increase', intensity: 'moderate', icon: '↔' },
  { label: 'Less Spacing', aspect: 'spacing', direction: 'decrease', intensity: 'moderate', icon: '↕' },
  { label: 'Better Alignment', aspect: 'alignment', direction: 'increase', intensity: 'moderate', icon: '⊞' },
  { label: 'Tighter Groups', aspect: 'grouping', direction: 'increase', intensity: 'moderate', icon: '⊡' },
  { label: 'Cleaner Routing', aspect: 'routing', direction: 'increase', intensity: 'moderate', icon: '⤻' },
  { label: 'Overall Better', aspect: 'overall', direction: 'increase', intensity: 'moderate', icon: '✦' },
];

export const RefinementFeedbackPanel: React.FC<RefinementFeedbackPanelProps> = ({
  currentIteration,
  iterations,
  status,
  onFeedback,
  onApprove,
  onReject,
  onContinue,
  onRefine,
  onStop,
  onRevert,
  isProcessing = false,
}) => {
  // State for custom feedback form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customAspect, setCustomAspect] = useState<FeedbackAspect>('spacing');
  const [customDirection, setCustomDirection] = useState<FeedbackDirection>('increase');
  const [customIntensity, setCustomIntensity] = useState<FeedbackIntensity>('moderate');
  const [customNotes, setCustomNotes] = useState('');
  const [showRevertMenu, setShowRevertMenu] = useState(false);

  // Calculate derived values
  const qualityTier = useMemo(
    () => getQualityTier(currentIteration.qualityScore.combinedScore),
    [currentIteration.qualityScore.combinedScore]
  );

  const scorePercentage = useMemo(
    () => (currentIteration.qualityScore.combinedScore * 100).toFixed(1),
    [currentIteration.qualityScore.combinedScore]
  );

  const deltaPercentage = useMemo(
    () => Math.abs(currentIteration.improvementDelta * 100).toFixed(1),
    [currentIteration.improvementDelta]
  );

  // Handlers
  const handleQuickFeedback = useCallback(
    (button: QuickFeedbackButton) => {
      onFeedback({
        aspect: button.aspect,
        direction: button.direction,
        intensity: button.intensity,
        timestamp: new Date().toISOString(),
      });
    },
    [onFeedback]
  );

  const handleCustomFeedbackSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onFeedback({
        aspect: customAspect,
        direction: customDirection,
        intensity: customIntensity,
        notes: customNotes || undefined,
        timestamp: new Date().toISOString(),
      });
      // Reset form
      setShowCustomForm(false);
      setCustomNotes('');
    },
    [customAspect, customDirection, customIntensity, customNotes, onFeedback]
  );

  const handleRevert = useCallback(
    (iterationNumber: number) => {
      setShowRevertMenu(false);
      onRevert(iterationNumber);
    },
    [onRevert]
  );

  const previousIterations = useMemo(
    () => iterations.filter((it) => it.iterationNumber < currentIteration.iterationNumber),
    [iterations, currentIteration.iterationNumber]
  );

  const isAwaitingFeedback = status === 'awaiting_feedback';
  const isDisabled = isProcessing || status === 'running';

  return (
    <div className="refinement-feedback-panel" data-testid="refinement-feedback-panel">
      {/* Processing indicator */}
      {isProcessing && (
        <div className="processing-indicator" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Processing...</span>
        </div>
      )}

      {/* Score summary */}
      <div className="score-summary" aria-label="Quality score summary">
        <div
          className="score-badge"
          data-tier={qualityTier}
          aria-label={`Quality score: ${scorePercentage}%, tier: ${qualityTier}`}
        >
          {scorePercentage}%
        </div>
        <div
          className={`score-change ${currentIteration.improved ? 'improved' : 'regressed'}`}
          aria-label={`Score ${currentIteration.improved ? 'improved' : 'regressed'} by ${deltaPercentage}%`}
        >
          {currentIteration.improved ? '↑' : '↓'}
          {deltaPercentage}%
        </div>
        <div className="iteration-info">
          Iteration {currentIteration.iterationNumber}
        </div>
      </div>

      {/* Quick feedback buttons */}
      <div className="feedback-section">
        <h3>Quick Feedback</h3>
        <div className="feedback-buttons" role="group" aria-label="Quick feedback options">
          {QUICK_FEEDBACK_BUTTONS.map((button) => (
            <button
              key={`${button.aspect}-${button.direction}`}
              className="feedback-btn"
              onClick={() => handleQuickFeedback(button)}
              disabled={isDisabled}
              aria-label={button.label}
              title={`${button.label} (${button.intensity} adjustment)`}
            >
              <span className="feedback-icon" aria-hidden="true">{button.icon}</span>
              <span className="feedback-label">{button.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom feedback form toggle */}
      <button
        className="toggle-custom-form"
        onClick={() => setShowCustomForm(!showCustomForm)}
        aria-expanded={showCustomForm}
        aria-controls="custom-feedback-form"
      >
        {showCustomForm ? 'Hide Custom Feedback' : 'Custom Feedback...'}
      </button>

      {/* Custom feedback form */}
      {showCustomForm && (
        <form
          id="custom-feedback-form"
          className="custom-feedback-form"
          onSubmit={handleCustomFeedbackSubmit}
          aria-label="Custom feedback form"
        >
          <div className="form-row">
            <label htmlFor="feedback-aspect">Aspect:</label>
            <select
              id="feedback-aspect"
              value={customAspect}
              onChange={(e) => setCustomAspect(e.target.value as FeedbackAspect)}
              disabled={isDisabled}
            >
              <option value="spacing">Spacing</option>
              <option value="alignment">Alignment</option>
              <option value="grouping">Grouping</option>
              <option value="routing">Routing</option>
              <option value="overall">Overall</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="feedback-direction">Direction:</label>
            <select
              id="feedback-direction"
              value={customDirection}
              onChange={(e) => setCustomDirection(e.target.value as FeedbackDirection)}
              disabled={isDisabled}
            >
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
              <option value="acceptable">Acceptable</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="feedback-intensity">Intensity:</label>
            <select
              id="feedback-intensity"
              value={customIntensity}
              onChange={(e) => setCustomIntensity(e.target.value as FeedbackIntensity)}
              disabled={isDisabled}
            >
              <option value="slight">Slight</option>
              <option value="moderate">Moderate</option>
              <option value="significant">Significant</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="feedback-notes">Notes (optional):</label>
            <textarea
              id="feedback-notes"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Add any additional notes..."
              disabled={isDisabled}
              rows={3}
            />
          </div>

          <button type="submit" className="submit-custom-feedback" disabled={isDisabled}>
            Submit Feedback
          </button>
        </form>
      )}

      {/* Status indicator for awaiting feedback */}
      {isAwaitingFeedback && (
        <div className="awaiting-feedback-banner" role="alert">
          <span className="alert-icon" aria-hidden="true">⏸</span>
          <span>Awaiting your feedback before continuing...</span>
        </div>
      )}

      {/* Action buttons - Accept/Reject/Refine workflow */}
      <div className="action-buttons" role="group" aria-label="Refinement actions">
        <button
          className="action-btn approve bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={onApprove}
          disabled={isDisabled}
          aria-label="Accept current result and save parameters"
          title="Accept: Save current parameters and end session"
        >
          <span aria-hidden="true">✓</span> Accept
        </button>

        <button
          className="action-btn reject bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={onReject}
          disabled={isDisabled}
          aria-label="Reject current result and revert to previous parameters"
          title="Reject: Revert to previous parameters"
        >
          <span aria-hidden="true">✗</span> Reject
        </button>

        <button
          className="action-btn refine bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={onRefine}
          disabled={isDisabled}
          aria-label="Continue refining with manual adjustments"
          title="Refine: Continue with manual adjustments or automated optimization"
        >
          <span aria-hidden="true">⚙</span> Refine
        </button>

        <button
          className="action-btn continue bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={onContinue}
          disabled={isDisabled}
          aria-label="Continue with automatic optimization"
          title="Continue automated optimization"
        >
          <span aria-hidden="true">▶</span> Auto
        </button>

        <div className="revert-dropdown">
          <button
            className="action-btn revert"
            onClick={() => setShowRevertMenu(!showRevertMenu)}
            disabled={isDisabled || previousIterations.length === 0}
            aria-expanded={showRevertMenu}
            aria-haspopup="listbox"
            aria-label="Revert to previous iteration"
          >
            <span aria-hidden="true">↩</span> Revert
          </button>

          {showRevertMenu && previousIterations.length > 0 && (
            <ul className="revert-menu" role="listbox" aria-label="Select iteration to revert to">
              {previousIterations.map((iteration) => (
                <li key={iteration.iterationNumber}>
                  <button
                    role="option"
                    onClick={() => handleRevert(iteration.iterationNumber)}
                    aria-label={`Revert to iteration ${iteration.iterationNumber} (${(iteration.qualityScore.combinedScore * 100).toFixed(1)}%)`}
                  >
                    Iteration {iteration.iterationNumber}
                    <span className="iteration-score">
                      {(iteration.qualityScore.combinedScore * 100).toFixed(1)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="action-btn stop"
          onClick={onStop}
          disabled={isProcessing}
          aria-label="Stop refinement process"
        >
          <span aria-hidden="true">■</span> Stop
        </button>
      </div>
    </div>
  );
};

export default RefinementFeedbackPanel;
