/**
 * CoverageSummaryPanel Component
 *
 * Displays coverage analysis summary for goals and requirements.
 * Shows statistics and list of uncovered/partially covered goals.
 */

import { CoverageSummary, GoalCoverage, coverageAnalyzer } from '../services/coverageAnalyzer';
import './CoverageSummaryPanel.css';

export interface CoverageSummaryPanelProps {
  /** Coverage summary data */
  summary: CoverageSummary;

  /** Callback when a goal is clicked for navigation */
  onGoalClick?: (goalId: string) => void;

  /** Whether the panel is collapsed */
  collapsed?: boolean;

  /** Callback when collapse toggle is clicked */
  onToggleCollapse?: () => void;
}

/**
 * CoverageSummaryPanel Component
 */
export const CoverageSummaryPanel: React.FC<CoverageSummaryPanelProps> = ({
  summary,
  onGoalClick,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { totalGoals, completeCount, partialCount, noneCount, overallCoverage, uncoveredGoals, partiallyCoveredGoals } = summary;

  // Calculate percentages
  const completePercentage = totalGoals > 0 ? (completeCount / totalGoals) * 100 : 0;
  const partialPercentage = totalGoals > 0 ? (partialCount / totalGoals) * 100 : 0;
  const nonePercentage = totalGoals > 0 ? (noneCount / totalGoals) * 100 : 0;

  const handleGoalClick = (goalId: string) => {
    if (onGoalClick) {
      onGoalClick(goalId);
    }
  };

  return (
    <div className={`coverage-summary-panel ${collapsed ? 'coverage-summary-panel--collapsed' : ''}`}>
      {/* Header */}
      <div className="coverage-summary-panel__header">
        <div className="coverage-summary-panel__title">
          <span className="coverage-summary-panel__icon">📊</span>
          <span>Coverage Analysis</span>
        </div>
        {onToggleCollapse && (
          <button
            className="coverage-summary-panel__toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand coverage panel' : 'Collapse coverage panel'}
            aria-expanded={!collapsed}
          >
            {collapsed ? '▼' : '▲'}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="coverage-summary-panel__content">
          {/* Overall Statistics */}
          <div className="coverage-stats">
            <div className="coverage-stats__overall">
              <div className="coverage-stats__label">Overall Coverage</div>
              <div className="coverage-stats__value">{overallCoverage.toFixed(1)}%</div>
            </div>

            <div className="coverage-stats__breakdown">
              <div className="coverage-stat-item coverage-stat-item--complete">
                <div className="coverage-stat-item__icon">✓</div>
                <div className="coverage-stat-item__content">
                  <div className="coverage-stat-item__label">Complete</div>
                  <div className="coverage-stat-item__value">
                    {completeCount} ({completePercentage.toFixed(0)}%)
                  </div>
                </div>
              </div>

              <div className="coverage-stat-item coverage-stat-item--partial">
                <div className="coverage-stat-item__icon">◐</div>
                <div className="coverage-stat-item__content">
                  <div className="coverage-stat-item__label">Partial</div>
                  <div className="coverage-stat-item__value">
                    {partialCount} ({partialPercentage.toFixed(0)}%)
                  </div>
                </div>
              </div>

              <div className="coverage-stat-item coverage-stat-item--none">
                <div className="coverage-stat-item__icon">⚠</div>
                <div className="coverage-stat-item__content">
                  <div className="coverage-stat-item__label">Uncovered</div>
                  <div className="coverage-stat-item__value">
                    {noneCount} ({nonePercentage.toFixed(0)}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Uncovered Goals List */}
          {uncoveredGoals.length > 0 && (
            <div className="coverage-section">
              <div className="coverage-section__header">
                <span className="coverage-section__title">Uncovered Goals</span>
                <span className="coverage-section__count">{uncoveredGoals.length}</span>
              </div>
              <div className="coverage-section__list">
                {uncoveredGoals.map((goal) => (
                  <GoalCoverageItem
                    key={goal.goalId}
                    goal={goal}
                    onClick={() => handleGoalClick(goal.goalId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Partially Covered Goals List */}
          {partiallyCoveredGoals.length > 0 && (
            <div className="coverage-section">
              <div className="coverage-section__header">
                <span className="coverage-section__title">Partially Covered Goals</span>
                <span className="coverage-section__count">{partiallyCoveredGoals.length}</span>
              </div>
              <div className="coverage-section__list">
                {partiallyCoveredGoals.map((goal) => (
                  <GoalCoverageItem
                    key={goal.goalId}
                    goal={goal}
                    onClick={() => handleGoalClick(goal.goalId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Covered Message */}
          {uncoveredGoals.length === 0 && partiallyCoveredGoals.length === 0 && totalGoals > 0 && (
            <div className="coverage-all-covered">
              <div className="coverage-all-covered__icon">✓</div>
              <div className="coverage-all-covered__message">
                All goals have complete requirement coverage!
              </div>
            </div>
          )}

          {/* No Goals Message */}
          {totalGoals === 0 && (
            <div className="coverage-empty">
              <div className="coverage-empty__message">No goals found in the motivation layer.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Individual goal coverage item
 */
interface GoalCoverageItemProps {
  goal: GoalCoverage;
  onClick: () => void;
}

const GoalCoverageItem: React.FC<GoalCoverageItemProps> = ({ goal, onClick }) => {
  const coverageColors = coverageAnalyzer.getCoverageColor(goal.status);
  const coverageIcon = coverageAnalyzer.getCoverageIcon(goal.status);

  return (
    <button
      className="goal-coverage-item"
      onClick={onClick}
      aria-label={`Navigate to goal: ${goal.goalName}. ${goal.requirementCount} requirements linked.`}
    >
      <div
        className="goal-coverage-item__icon"
        style={{ color: coverageColors.color, backgroundColor: coverageColors.bg }}
      >
        {coverageIcon}
      </div>
      <div className="goal-coverage-item__content">
        <div className="goal-coverage-item__name">{goal.goalName}</div>
        <div className="goal-coverage-item__details">
          {goal.requirementCount} requirement{goal.requirementCount !== 1 ? 's' : ''}
          {goal.constraintCount > 0 && (
            <span className="goal-coverage-item__constraints">
              , {goal.constraintCount} constraint{goal.constraintCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="goal-coverage-item__arrow">→</div>
    </button>
  );
};
