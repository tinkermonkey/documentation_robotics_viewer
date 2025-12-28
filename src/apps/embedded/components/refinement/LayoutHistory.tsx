/**
 * LayoutHistory Component
 *
 * Displays a timeline of layout iterations with thumbnail previews.
 * Supports quick preview and revert to previous layouts.
 *
 * Task 7.4: Implement layout history with thumbnails
 */

import React, { useState, useCallback } from 'react';
import type { RefinementIteration } from '../../types/refinement';

export interface LayoutHistoryProps {
  /** All layout iterations in chronological order */
  iterations: RefinementIteration[];
  /** Currently selected/active iteration */
  currentIterationNumber: number;
  /** Callback when user wants to preview an iteration */
  onPreview: (iterationNumber: number) => void;
  /** Callback when user wants to revert to an iteration */
  onRevert: (iterationNumber: number) => void;
  /** Whether revert actions are enabled */
  enableRevert?: boolean;
}

export const LayoutHistory: React.FC<LayoutHistoryProps> = ({
  iterations,
  currentIterationNumber,
  onPreview,
  onRevert,
  enableRevert = true,
}) => {
  const [hoveredIteration, setHoveredIteration] = useState<number | null>(null);
  const [previewIteration, setPreviewIteration] = useState<number | null>(null);

  // Find the best iteration (highest score)
  const bestIteration = iterations.length > 0
    ? iterations.reduce((best, current) => {
        // Safety check for qualityScore structure
        const currentScore = current.qualityScore?.combinedScore ?? current.score ?? 0;
        const bestScore = best.qualityScore?.combinedScore ?? best.score ?? 0;
        return currentScore > bestScore ? current : best;
      }, iterations[0])
    : null;

  const handlePreview = useCallback(
    (iterationNumber: number) => {
      setPreviewIteration(iterationNumber);
      onPreview(iterationNumber);
    },
    [onPreview]
  );

  const handleRevert = useCallback(
    (iterationNumber: number) => {
      onRevert(iterationNumber);
      setPreviewIteration(null);
    },
    [onRevert]
  );

  const getScoreBadgeColor = (score: number): string => {
    if (score >= 0.85) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 0.70) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 0.55) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div
      className="layout-history p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      data-testid="layout-history"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Layout History
        </h3>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {iterations.length} iteration{iterations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {iterations.map((iteration) => {
          const isCurrent = iteration.iterationNumber === currentIterationNumber;
          const isBest = iteration.iterationNumber === bestIteration?.iterationNumber;
          const isHovered = hoveredIteration === iteration.iterationNumber;
          const isPreview = previewIteration === iteration.iterationNumber;

          return (
            <div
              key={iteration.iterationNumber}
              className={`relative group transition-all duration-200 ${
                isCurrent || isPreview
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                  : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
              }`}
              data-testid={`iteration-${iteration.iterationNumber}`}
              onMouseEnter={() => setHoveredIteration(iteration.iterationNumber)}
              onMouseLeave={() => setHoveredIteration(null)}
            >
              <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer"
                   onClick={() => handlePreview(iteration.iterationNumber)}>
                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  <img
                    src={iteration.screenshotUrl}
                    alt={`Iteration ${iteration.iterationNumber}`}
                    className="w-24 h-18 object-cover rounded border border-gray-300 dark:border-gray-600"
                  />
                  {/* Iteration number badge */}
                  <div className="absolute -top-2 -left-2 bg-gray-700 dark:bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    #{iteration.iterationNumber}
                  </div>
                </div>

                {/* Iteration details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Current
                        </span>
                      )}
                      {isBest && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-yellow-900">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Best
                        </span>
                      )}
                    </div>
                    {/* Quality score */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBadgeColor(
                        iteration.qualityScore.combinedScore
                      )}`}
                    >
                      {iteration.qualityScore.combinedScore.toFixed(2)}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <div>
                      Readability: {iteration.qualityScore.readabilityScore.toFixed(2)}
                    </div>
                    <div>
                      Similarity: {iteration.qualityScore.similarityScore.toFixed(2)}
                    </div>
                  </div>

                  {/* Improvement indicator */}
                  {iteration.improved && (
                    <div className="flex items-center gap-1 text-xs">
                      <svg
                        className="w-3 h-3 text-green-600 dark:text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        +{iteration.improvementDelta.toFixed(3)}
                      </span>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(iteration.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {/* Action buttons (visible on hover or when current) */}
                {enableRevert && !isCurrent && (isHovered || isPreview) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevert(iteration.iterationNumber);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded transition-colors"
                      aria-label={`Revert to iteration ${iteration.iterationNumber}`}
                    >
                      Revert
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {iterations.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">No layout iterations yet</p>
        </div>
      )}
    </div>
  );
};

export default LayoutHistory;
