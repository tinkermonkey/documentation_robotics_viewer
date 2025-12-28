/**
 * QualityMetricsOverlay Component
 *
 * Overlays quality scores on comparison views with side-by-side metrics,
 * improvement indicators, and color-coded quality classifications.
 *
 * Task 7.6: Add quality metrics overlay
 */

import React from 'react';
import type { CombinedQualityScore } from '../../../../core/services/comparison/qualityScoreService';

export interface QualityMetricsOverlayProps {
  /** Current layout metrics */
  currentMetrics: CombinedQualityScore;
  /** Baseline/reference metrics (optional) */
  baselineMetrics?: CombinedQualityScore;
  /** Label for current layout */
  currentLabel?: string;
  /** Label for baseline layout */
  baselineLabel?: string;
  /** Position of the overlay */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether to show detailed breakdown */
  showDetails?: boolean;
}

export const QualityMetricsOverlay: React.FC<QualityMetricsOverlayProps> = ({
  currentMetrics,
  baselineMetrics,
  currentLabel = 'Current',
  baselineLabel = 'Baseline',
  position = 'top-right',
  showDetails = true,
}) => {
  const getQualityClass = (score: number): { color: string; label: string } => {
    if (score >= 0.90) return { color: 'text-green-600 dark:text-green-400', label: 'Excellent' };
    if (score >= 0.75) return { color: 'text-blue-600 dark:text-blue-400', label: 'Good' };
    if (score >= 0.60) return { color: 'text-yellow-600 dark:text-yellow-400', label: 'Acceptable' };
    if (score >= 0.40) return { color: 'text-orange-600 dark:text-orange-400', label: 'Poor' };
    return { color: 'text-red-600 dark:text-red-400', label: 'Unacceptable' };
  };

  const calculateImprovement = (current: number, baseline: number): number => {
    return current - baseline;
  };

  const formatDelta = (delta: number): string => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(3)}`;
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const currentQuality = getQualityClass(currentMetrics.combinedScore);
  const baselineQuality = baselineMetrics ? getQualityClass(baselineMetrics.combinedScore) : null;

  return (
    <div
      className={`absolute ${positionClasses[position]} z-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[280px] max-w-[400px]`}
      data-testid="quality-metrics-overlay"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Quality Metrics
        </h3>
        <span className={`text-xs font-bold ${currentQuality.color}`}>
          {currentQuality.label}
        </span>
      </div>

      {/* Combined Score Comparison */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Combined Score
          </span>
          {baselineMetrics && (
            <span
              className={`text-xs font-semibold ${
                calculateImprovement(currentMetrics.combinedScore, baselineMetrics.combinedScore) > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatDelta(
                calculateImprovement(currentMetrics.combinedScore, baselineMetrics.combinedScore)
              )}
            </span>
          )}
        </div>

        {baselineMetrics ? (
          <div className="space-y-1.5">
            {/* Baseline */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-16">{baselineLabel}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gray-400 dark:bg-gray-500"
                  style={{ width: `${baselineMetrics.combinedScore * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                {baselineMetrics.combinedScore.toFixed(2)}
              </span>
            </div>

            {/* Current */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-900 dark:text-white font-medium w-16">
                {currentLabel}
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    currentMetrics.combinedScore >= 0.75
                      ? 'bg-green-500'
                      : currentMetrics.combinedScore >= 0.60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${currentMetrics.combinedScore * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white w-12 text-right">
                {currentMetrics.combinedScore.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  currentMetrics.combinedScore >= 0.75
                    ? 'bg-green-500'
                    : currentMetrics.combinedScore >= 0.60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${currentMetrics.combinedScore * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {currentMetrics.combinedScore.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Detailed Metrics Breakdown */}
      {showDetails && (
        <div className="space-y-3">
          {/* Readability Score */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Readability
              </span>
              <div className="flex items-center gap-2">
                {baselineMetrics && (
                  <span
                    className={`text-xs font-semibold ${
                      calculateImprovement(
                        currentMetrics.readabilityScore,
                        baselineMetrics.readabilityScore
                      ) > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatDelta(
                      calculateImprovement(
                        currentMetrics.readabilityScore,
                        baselineMetrics.readabilityScore
                      )
                    )}
                  </span>
                )}
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {currentMetrics.readabilityScore.toFixed(2)}
                </span>
              </div>
            </div>
            {/* Readability sub-metrics */}
            <div className="pl-2 space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Edge Crossings:</span>
                <span className="font-medium">{currentMetrics.readabilityMetrics.edgeCrossings}</span>
              </div>
              <div className="flex justify-between">
                <span>Node Occlusion:</span>
                <span className="font-medium">{currentMetrics.readabilityMetrics.nodeOcclusion}</span>
              </div>
              <div className="flex justify-between">
                <span>Aspect Ratio:</span>
                <span className="font-medium">
                  {currentMetrics.readabilityMetrics.aspectRatioScore.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Similarity Score */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Similarity
              </span>
              <div className="flex items-center gap-2">
                {baselineMetrics && (
                  <span
                    className={`text-xs font-semibold ${
                      calculateImprovement(
                        currentMetrics.similarityScore,
                        baselineMetrics.similarityScore
                      ) > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatDelta(
                      calculateImprovement(
                        currentMetrics.similarityScore,
                        baselineMetrics.similarityScore
                      )
                    )}
                  </span>
                )}
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {currentMetrics.similarityScore.toFixed(2)}
                </span>
              </div>
            </div>
            {/* Similarity sub-metrics */}
            {currentMetrics.similarityMetrics && (
              <div className="pl-2 space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Structural (SSIM):</span>
                  <span className="font-medium">
                    {currentMetrics.similarityMetrics.structuralSimilarity.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Layout:</span>
                  <span className="font-medium">
                    {currentMetrics.similarityMetrics.layoutSimilarity.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Improvement Indicator */}
      {baselineMetrics && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          {calculateImprovement(currentMetrics.combinedScore, baselineMetrics.combinedScore) > 0 ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-semibold">Improved</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-semibold">Regressed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QualityMetricsOverlay;
