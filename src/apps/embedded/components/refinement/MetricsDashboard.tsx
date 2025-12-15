/**
 * MetricsDashboard Component
 *
 * Displays score progression chart, metrics breakdown, and iteration history.
 * Allows users to see trends, compare against baseline/target, and revert to previous iterations.
 */

import React, { useMemo, useCallback } from 'react';
import { MetricsDashboardProps, RefinementIteration } from '../../types/refinement';

// Chart dimensions
const CHART_WIDTH = 400;
const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

/**
 * Calculate chart points from iterations
 */
function calculateChartPoints(
  iterations: RefinementIteration[],
  chartWidth: number,
  chartHeight: number,
  padding: typeof CHART_PADDING
): Array<{ x: number; y: number; score: number; iteration: number }> {
  if (iterations.length === 0) return [];

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const minScore = 0;
  const maxScore = 1;

  return iterations.map((it, index) => {
    const x = padding.left + (index / Math.max(iterations.length - 1, 1)) * plotWidth;
    const y = padding.top + (1 - (it.qualityScore.combinedScore - minScore) / (maxScore - minScore)) * plotHeight;
    return {
      x,
      y,
      score: it.qualityScore.combinedScore,
      iteration: it.iterationNumber,
    };
  });
}

/**
 * Generate SVG path for line chart
 */
function generateLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  iterations,
  targetScore,
  baselineScore,
  selectedIteration,
  onIterationSelect,
  onRevert,
}) => {
  // Calculate derived values
  const currentIteration = useMemo(
    () => iterations[iterations.length - 1],
    [iterations]
  );

  const bestIteration = useMemo(
    () =>
      iterations.reduce(
        (best, it) =>
          it.qualityScore.combinedScore > best.qualityScore.combinedScore ? it : best,
        iterations[0]
      ),
    [iterations]
  );

  const totalImprovement = useMemo(() => {
    if (iterations.length < 2) return 0;
    return currentIteration.qualityScore.combinedScore - baselineScore;
  }, [iterations, currentIteration, baselineScore]);

  // Chart calculations
  const chartPoints = useMemo(
    () => calculateChartPoints(iterations, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING),
    [iterations]
  );

  const linePath = useMemo(() => generateLinePath(chartPoints), [chartPoints]);

  // Horizontal reference lines
  const targetY = useMemo(
    () =>
      CHART_PADDING.top +
      (1 - targetScore) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom),
    [targetScore]
  );

  const baselineY = useMemo(
    () =>
      CHART_PADDING.top +
      (1 - baselineScore) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom),
    [baselineScore]
  );

  // Handlers
  const handlePointClick = useCallback(
    (iterationNumber: number) => {
      onIterationSelect?.(iterationNumber);
    },
    [onIterationSelect]
  );

  const handleRevertClick = useCallback(
    (iterationNumber: number) => {
      onRevert?.(iterationNumber);
    },
    [onRevert]
  );

  // Readability breakdown from current iteration
  const readabilityBreakdown = useMemo(() => {
    const metrics = currentIteration?.qualityScore?.breakdown?.graphMetrics?.metrics;
    if (!metrics) return null;
    return {
      crossingNumber: metrics.crossingNumber,
      crossingAngle: metrics.crossingAngle,
      angularResolutionMin: metrics.angularResolutionMin,
    };
  }, [currentIteration]);

  if (iterations.length === 0) {
    return (
      <div className="metrics-dashboard empty" data-testid="metrics-dashboard">
        <p>No iterations yet. Start the refinement process to see metrics.</p>
      </div>
    );
  }

  return (
    <div className="metrics-dashboard" data-testid="metrics-dashboard">
      {/* Summary stats */}
      <div className="summary-stats" role="region" aria-label="Refinement summary">
        <div className="stat-card">
          <div className="stat-label">Iterations</div>
          <div className="stat-value">{iterations.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Best Score</div>
          <div className="stat-value highlight">
            {(bestIteration.qualityScore.combinedScore * 100).toFixed(1)}%
          </div>
          <div className="stat-sub">Iteration {bestIteration.iterationNumber}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Improvement</div>
          <div className={`stat-value ${totalImprovement >= 0 ? 'positive' : 'negative'}`}>
            {totalImprovement >= 0 ? '+' : ''}
            {(totalImprovement * 100).toFixed(1)}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Target</div>
          <div className="stat-value">{(targetScore * 100).toFixed(0)}%</div>
          <div className="stat-sub">
            {currentIteration.qualityScore.combinedScore >= targetScore ? (
              <span className="target-met">Target Met</span>
            ) : (
              <span className="target-gap">
                {((targetScore - currentIteration.qualityScore.combinedScore) * 100).toFixed(1)}% to go
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Score progression chart */}
      <div className="chart-container" role="img" aria-label="Score progression chart">
        <h3>Score Progression</h3>
        <svg
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          className="score-chart"
          aria-hidden="true"
        >
          {/* Y-axis */}
          <line
            x1={CHART_PADDING.left}
            y1={CHART_PADDING.top}
            x2={CHART_PADDING.left}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
            className="axis"
          />
          {/* X-axis */}
          <line
            x1={CHART_PADDING.left}
            y1={CHART_HEIGHT - CHART_PADDING.bottom}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
            className="axis"
          />

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((val) => {
            const y =
              CHART_PADDING.top +
              (1 - val) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
            return (
              <g key={val}>
                <text x={CHART_PADDING.left - 5} y={y + 4} className="axis-label" textAnchor="end">
                  {(val * 100).toFixed(0)}%
                </text>
                <line
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y2={y}
                  className="grid-line"
                />
              </g>
            );
          })}

          {/* Target line */}
          <line
            x1={CHART_PADDING.left}
            y1={targetY}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y2={targetY}
            className="target-line"
          />
          <text
            x={CHART_WIDTH - CHART_PADDING.right + 5}
            y={targetY + 4}
            className="target-label"
          >
            Target
          </text>

          {/* Baseline line */}
          <line
            x1={CHART_PADDING.left}
            y1={baselineY}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y2={baselineY}
            className="baseline-line"
          />
          <text
            x={CHART_WIDTH - CHART_PADDING.right + 5}
            y={baselineY + 4}
            className="baseline-label"
          >
            Baseline
          </text>

          {/* Score line */}
          <path d={linePath} className="score-line" fill="none" />

          {/* Data points */}
          {chartPoints.map((point) => (
            <circle
              key={point.iteration}
              cx={point.x}
              cy={point.y}
              r={selectedIteration === point.iteration ? 8 : 5}
              className={`data-point ${selectedIteration === point.iteration ? 'selected' : ''} ${
                point.iteration === bestIteration.iterationNumber ? 'best' : ''
              }`}
              onClick={() => handlePointClick(point.iteration)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          {/* X-axis label */}
          <text
            x={CHART_WIDTH / 2}
            y={CHART_HEIGHT - 5}
            className="axis-title"
            textAnchor="middle"
          >
            Iteration
          </text>
        </svg>

        {/* Chart legend */}
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-line score" />
            <span>Score</span>
          </div>
          <div className="legend-item">
            <span className="legend-line target" />
            <span>Target</span>
          </div>
          <div className="legend-item">
            <span className="legend-line baseline" />
            <span>Baseline</span>
          </div>
        </div>
      </div>

      {/* Metric bars: Current vs Baseline */}
      <div className="metric-bars" role="region" aria-label="Metric comparison">
        <h3>Current vs Baseline</h3>
        <div className="metric-bar-row">
          <span className="metric-label">Readability</span>
          <div className="metric-bar-container">
            <div
              className="metric-bar baseline-bar"
              style={{ width: `${baselineScore * 100}%` }}
              title={`Baseline: ${(baselineScore * 100).toFixed(1)}%`}
            />
            <div
              className="metric-bar current-bar"
              style={{ width: `${currentIteration.qualityScore.readabilityScore * 100}%` }}
              title={`Current: ${(currentIteration.qualityScore.readabilityScore * 100).toFixed(1)}%`}
            />
          </div>
          <span className="metric-value">
            {(currentIteration.qualityScore.readabilityScore * 100).toFixed(1)}%
          </span>
        </div>
        <div className="metric-bar-row">
          <span className="metric-label">Similarity</span>
          <div className="metric-bar-container">
            <div
              className="metric-bar current-bar"
              style={{ width: `${currentIteration.qualityScore.similarityScore * 100}%` }}
              title={`Current: ${(currentIteration.qualityScore.similarityScore * 100).toFixed(1)}%`}
            />
          </div>
          <span className="metric-value">
            {(currentIteration.qualityScore.similarityScore * 100).toFixed(1)}%
          </span>
        </div>
        <div className="metric-bar-row">
          <span className="metric-label">Combined</span>
          <div className="metric-bar-container">
            <div
              className="metric-bar baseline-bar"
              style={{ width: `${baselineScore * 100}%` }}
              title={`Baseline: ${(baselineScore * 100).toFixed(1)}%`}
            />
            <div
              className="metric-bar current-bar combined"
              style={{ width: `${currentIteration.qualityScore.combinedScore * 100}%` }}
              title={`Current: ${(currentIteration.qualityScore.combinedScore * 100).toFixed(1)}%`}
            />
          </div>
          <span className="metric-value">
            {(currentIteration.qualityScore.combinedScore * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Readability breakdown */}
      {readabilityBreakdown && (
        <div className="readability-breakdown" role="region" aria-label="Readability metrics breakdown">
          <h3>Readability Breakdown</h3>
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <span className="breakdown-label">Edge Crossings</span>
              <div className="breakdown-bar">
                <div
                  className="bar-fill"
                  style={{ width: `${readabilityBreakdown.crossingNumber * 100}%` }}
                />
              </div>
              <span className="breakdown-value">
                {(readabilityBreakdown.crossingNumber * 100).toFixed(0)}%
              </span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Crossing Angle</span>
              <div className="breakdown-bar">
                <div
                  className="bar-fill"
                  style={{ width: `${readabilityBreakdown.crossingAngle * 100}%` }}
                />
              </div>
              <span className="breakdown-value">
                {(readabilityBreakdown.crossingAngle * 100).toFixed(0)}%
              </span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Angular Resolution</span>
              <div className="breakdown-bar">
                <div
                  className="bar-fill"
                  style={{ width: `${readabilityBreakdown.angularResolutionMin * 100}%` }}
                />
              </div>
              <span className="breakdown-value">
                {(readabilityBreakdown.angularResolutionMin * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Best iteration highlight */}
      {bestIteration.iterationNumber !== currentIteration.iterationNumber && (
        <div className="best-iteration-highlight" role="alert">
          <span>
            Best result was Iteration {bestIteration.iterationNumber} (
            {(bestIteration.qualityScore.combinedScore * 100).toFixed(1)}%)
          </span>
          {onRevert && (
            <button
              className="revert-to-best-btn"
              onClick={() => handleRevertClick(bestIteration.iterationNumber)}
            >
              Revert to Best
            </button>
          )}
        </div>
      )}

      {/* Iteration history table */}
      <div className="iteration-history" role="region" aria-label="Iteration history">
        <h3>Iteration History</h3>
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Score</th>
                <th scope="col">Change</th>
                <th scope="col">Duration</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {iterations.map((it) => (
                <tr
                  key={it.iterationNumber}
                  className={`${selectedIteration === it.iterationNumber ? 'selected' : ''} ${
                    it.iterationNumber === bestIteration.iterationNumber ? 'best' : ''
                  }`}
                  onClick={() => handlePointClick(it.iterationNumber)}
                >
                  <td>{it.iterationNumber}</td>
                  <td className="score-cell">
                    {(it.qualityScore.combinedScore * 100).toFixed(1)}%
                    {it.iterationNumber === bestIteration.iterationNumber && (
                      <span className="best-badge" title="Best score">★</span>
                    )}
                  </td>
                  <td className={it.improved ? 'improved' : 'regressed'}>
                    {it.iterationNumber === 1
                      ? '—'
                      : `${it.improved ? '+' : ''}${(it.improvementDelta * 100).toFixed(1)}%`}
                  </td>
                  <td>{(it.durationMs / 1000).toFixed(2)}s</td>
                  <td>
                    {onRevert && it.iterationNumber < currentIteration.iterationNumber && (
                      <button
                        className="revert-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevertClick(it.iterationNumber);
                        }}
                        title={`Revert to iteration ${it.iterationNumber}`}
                      >
                        Revert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
