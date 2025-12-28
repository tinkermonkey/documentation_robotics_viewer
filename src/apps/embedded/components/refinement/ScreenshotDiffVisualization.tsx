/**
 * ScreenshotDiffVisualization Component
 *
 * Displays visual differences between reference and generated layouts
 * using SSIM-based heatmap visualization and difference overlays.
 *
 * Integrates with imageSimilarityService for structural difference detection.
 */

import React, { useMemo } from 'react';

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

export interface ScreenshotDiffVisualizationProps {
  /** Reference image URL */
  referenceImageUrl: string;
  /** Generated image URL */
  generatedImageUrl: string;
  /** Heatmap image URL from SSIM comparison */
  heatmapUrl?: string;
  /** Changed regions detected by difference analysis */
  changedRegions?: DiffRegion[];
  /** SSIM score (0-1, higher is more similar) */
  ssimScore?: number;
  /** Perceptual hash difference (Hamming distance) */
  hammingDistance?: number;
  /** Whether to show region highlights */
  showRegionHighlights?: boolean;
  /** Whether to show metrics panel */
  showMetrics?: boolean;
}

export const ScreenshotDiffVisualization: React.FC<
  ScreenshotDiffVisualizationProps
> = ({
  referenceImageUrl,
  generatedImageUrl,
  heatmapUrl,
  changedRegions = [],
  ssimScore,
  hammingDistance,
  showRegionHighlights = true,
  showMetrics = true,
}) => {
  // Calculate structural difference percentage
  const structuralDifference = useMemo(() => {
    if (ssimScore === undefined) return null;
    return ((1 - ssimScore) * 100).toFixed(1);
  }, [ssimScore]);

  // Sort regions by intensity for highlighting most significant changes
  const sortedRegions = useMemo(() => {
    return [...changedRegions].sort((a, b) => b.intensity - a.intensity);
  }, [changedRegions]);

  // Calculate total changed area percentage
  const changedAreaPercentage = useMemo(() => {
    if (changedRegions.length === 0) return 0;
    const totalArea = changedRegions.reduce(
      (sum, region) => sum + region.width * region.height,
      0
    );
    // Assume 1000x800 image for percentage calculation
    const imageArea = 1000 * 800;
    return ((totalArea / imageArea) * 100).toFixed(1);
  }, [changedRegions]);

  // Get similarity classification
  const getSimilarityClass = (score: number | undefined): string => {
    if (score === undefined) return 'unknown';
    if (score >= 0.95) return 'very-similar';
    if (score >= 0.85) return 'similar';
    if (score >= 0.70) return 'somewhat-similar';
    return 'different';
  };

  const similarityClass = getSimilarityClass(ssimScore);

  return (
    <div
      className="screenshot-diff-visualization"
      data-testid="screenshot-diff-visualization"
    >
      {/* Metrics Panel */}
      {showMetrics && (ssimScore !== undefined || hammingDistance !== undefined) && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Difference Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {ssimScore !== undefined && (
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Structural Similarity (SSIM)
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        ssimScore >= 0.85
                          ? 'bg-green-500'
                          : ssimScore >= 0.70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${ssimScore * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[3rem] text-right">
                    {(ssimScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {structuralDifference}% different
                </div>
              </div>
            )}

            {hammingDistance !== undefined && (
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Perceptual Hash Distance
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        hammingDistance <= 5
                          ? 'bg-green-500'
                          : hammingDistance <= 10
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((hammingDistance / 16) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[3rem] text-right">
                    {hammingDistance}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {hammingDistance <= 5 ? 'Very similar' : hammingDistance <= 10 ? 'Similar' : 'Different'}
                </div>
              </div>
            )}

            {changedRegions.length > 0 && (
              <div className="col-span-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Changed Regions
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {changedRegions.length} regions detected
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {changedAreaPercentage}% of total area
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Similarity badge */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                similarityClass === 'very-similar'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : similarityClass === 'similar'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : similarityClass === 'somewhat-similar'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {similarityClass === 'very-similar' && 'Very Similar'}
              {similarityClass === 'similar' && 'Similar'}
              {similarityClass === 'somewhat-similar' && 'Somewhat Similar'}
              {similarityClass === 'different' && 'Different'}
              {similarityClass === 'unknown' && 'Unknown'}
            </span>
          </div>
        </div>
      )}

      {/* Diff Visualization */}
      <div className="grid grid-cols-3 gap-4">
        {/* Reference */}
        <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <div className="absolute top-2 left-2 z-10 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 px-3 py-1 rounded-md shadow-sm">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              Reference
            </span>
          </div>
          <img
            src={referenceImageUrl}
            alt="Reference layout"
            className="w-full h-auto"
          />
        </div>

        {/* Heatmap (if available) */}
        {heatmapUrl && (
          <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            <div className="absolute top-2 left-2 z-10 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 px-3 py-1 rounded-md shadow-sm">
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                Difference Heatmap
              </span>
            </div>
            <img
              src={heatmapUrl}
              alt="Difference heatmap"
              className="w-full h-auto"
            />
            {/* Heatmap legend */}
            <div className="absolute bottom-2 left-2 right-2 z-10 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 px-3 py-2 rounded-md shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Low</span>
                <div className="flex-1 mx-2 h-2 rounded-full bg-gradient-to-r from-blue-300 via-yellow-300 to-red-500" />
                <span className="text-gray-600 dark:text-gray-400">High</span>
              </div>
            </div>
          </div>
        )}

        {/* Generated with region highlights */}
        <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <div className="absolute top-2 left-2 z-10 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 px-3 py-1 rounded-md shadow-sm">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              Generated
              {changedRegions.length > 0 && ' (with highlights)'}
            </span>
          </div>
          <img
            src={generatedImageUrl}
            alt="Generated layout"
            className="w-full h-auto"
          />

          {/* Region highlights overlay */}
          {showRegionHighlights && sortedRegions.slice(0, 10).map((region, index) => (
            <div
              key={index}
              className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20"
              style={{
                left: `${region.x}px`,
                top: `${region.y}px`,
                width: `${region.width}px`,
                height: `${region.height}px`,
              }}
              title={`Change intensity: ${(region.intensity * 100).toFixed(0)}%`}
            >
              {/* Intensity indicator for top 3 regions */}
              {index < 3 && (
                <div className="absolute -top-6 left-0 bg-red-600 text-white text-xs px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                  {(region.intensity * 100).toFixed(0)}% diff
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top changed regions list */}
      {sortedRegions.length > 0 && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Most Significant Changes
          </h3>
          <div className="space-y-2">
            {sortedRegions.slice(0, 5).map((region, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    #{index + 1}
                  </div>
                  <div className="text-xs text-gray-900 dark:text-white">
                    Position: ({region.x}, {region.y})
                  </div>
                  <div className="text-xs text-gray-900 dark:text-white">
                    Size: {region.width}×{region.height}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-24">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${region.intensity * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white min-w-[3rem] text-right">
                    {(region.intensity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotDiffVisualization;
