/**
 * CoverageSummaryPanel Component
 *
 * Displays coverage analysis summary for goals and requirements.
 * Shows statistics and list of uncovered/partially covered goals.
 */

import { Card, Badge, Button } from 'flowbite-react';
import { CoverageSummary, GoalCoverage, coverageAnalyzer } from '../services/coverageAnalyzer';

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
    <Card className={collapsed ? 'max-w-[250px]' : 'max-w-[400px]'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span className="font-semibold text-gray-900 dark:text-white">Coverage Analysis</span>
        </div>
        {onToggleCollapse && (
          <Button
            color="gray"
            size="xs"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand coverage panel' : 'Collapse coverage panel'}
            aria-expanded={!collapsed}
          >
            {collapsed ? '▼' : '▲'}
          </Button>
        )}
      </div>

      {!collapsed && (
        <div className="space-y-4">
          {/* Overall Statistics */}
          <div>
            <div className="text-center mb-3">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Overall Coverage
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {overallCoverage.toFixed(1)}%
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="text-xl">✓</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                  Complete
                </div>
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {completeCount} ({completePercentage.toFixed(0)}%)
                </div>
              </div>

              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <div className="text-xl">◐</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                  Partial
                </div>
                <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  {partialCount} ({partialPercentage.toFixed(0)}%)
                </div>
              </div>

              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="text-xl">⚠</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                  Uncovered
                </div>
                <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {noneCount} ({nonePercentage.toFixed(0)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Uncovered Goals List */}
          {uncoveredGoals.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Uncovered Goals
                </span>
                <Badge color="failure" size="sm">{uncoveredGoals.length}</Badge>
              </div>
              <div className="space-y-2">
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Partially Covered Goals
                </span>
                <Badge color="warning" size="sm">{partiallyCoveredGoals.length}</Badge>
              </div>
              <div className="space-y-2">
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
            <div className="text-center py-6 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="text-3xl text-green-600 dark:text-green-400 mb-2">✓</div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                All goals have complete requirement coverage!
              </div>
            </div>
          )}

          {/* No Goals Message */}
          {totalGoals === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <div className="text-sm">No goals found in the motivation layer.</div>
            </div>
          )}
        </div>
      )}
    </Card>
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
      className="w-full text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
      onClick={onClick}
      aria-label={`Navigate to goal: ${goal.goalName}. ${goal.requirementCount} requirements linked.`}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0"
        style={{ color: coverageColors.color, backgroundColor: coverageColors.bg }}
      >
        {coverageIcon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
          {goal.goalName}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {goal.requirementCount} requirement{goal.requirementCount !== 1 ? 's' : ''}
          {goal.constraintCount > 0 && (
            <span>
              , {goal.constraintCount} constraint{goal.constraintCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="text-gray-400 dark:text-gray-500 flex-shrink-0">→</div>
    </button>
  );
};
