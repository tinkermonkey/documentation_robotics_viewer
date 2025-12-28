/**
 * SideBySideComparison Component
 *
 * Displays reference and generated diagrams with multiple view modes:
 * - Side-by-side: Reference and generated shown next to each other
 * - Overlay: Slider-based blending of reference and generated
 * - Heatmap: Difference heatmap visualization
 * - Difference: Generated with heatmap overlay
 *
 * Supports synchronized zoom/pan between views.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  SideBySideComparisonProps,
  ComparisonViewMode,
} from '../../types/refinement';

interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

export const SideBySideComparison: React.FC<SideBySideComparisonProps> = ({
  referenceImageUrl,
  generatedScreenshotUrl,
  heatmapUrl,
  layouts,
  viewOptions,
  onViewOptionsChange,
  onLayoutSelect,
}) => {
  // Determine if we're in multi-layout mode (3+ layouts)
  const isMultiLayoutMode = layouts && layouts.length >= 3;
  const layoutCount = layouts?.length || 0;
  // Local view state for smoother interactions
  const [viewState, setViewState] = useState<ViewState>({
    zoom: viewOptions.zoom,
    panX: viewOptions.panOffset.x,
    panY: viewOptions.panOffset.y,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync local state with external options
  useEffect(() => {
    setViewState({
      zoom: viewOptions.zoom,
      panX: viewOptions.panOffset.x,
      panY: viewOptions.panOffset.y,
    });
  }, [viewOptions.zoom, viewOptions.panOffset.x, viewOptions.panOffset.y]);

  // Mode change handler
  const handleModeChange = useCallback(
    (mode: ComparisonViewMode) => {
      onViewOptionsChange({
        ...viewOptions,
        mode,
      });
    },
    [viewOptions, onViewOptionsChange]
  );

  // Overlay opacity handler
  const handleOverlayOpacityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const opacity = parseFloat(e.target.value);
      onViewOptionsChange({
        ...viewOptions,
        overlayOpacity: opacity,
      });
    },
    [viewOptions, onViewOptionsChange]
  );

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(viewState.zoom + ZOOM_STEP, MAX_ZOOM);
    setViewState((prev) => ({ ...prev, zoom: newZoom }));
    onViewOptionsChange({
      ...viewOptions,
      zoom: newZoom,
    });
  }, [viewState.zoom, viewOptions, onViewOptionsChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(viewState.zoom - ZOOM_STEP, MIN_ZOOM);
    setViewState((prev) => ({ ...prev, zoom: newZoom }));
    onViewOptionsChange({
      ...viewOptions,
      zoom: newZoom,
    });
  }, [viewState.zoom, viewOptions, onViewOptionsChange]);

  const handleZoomReset = useCallback(() => {
    setViewState({ zoom: 1, panX: 0, panY: 0 });
    onViewOptionsChange({
      ...viewOptions,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
    });
  }, [viewOptions, onViewOptionsChange]);

  // Wheel zoom handler (Ctrl+Scroll)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewState.zoom + delta));
        setViewState((prev) => ({ ...prev, zoom: newZoom }));
        onViewOptionsChange({
          ...viewOptions,
          zoom: newZoom,
        });
      }
    },
    [viewState.zoom, viewOptions, onViewOptionsChange]
  );

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - viewState.panX, y: e.clientY - viewState.panY });
      }
    },
    [viewState.panX, viewState.panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const newPanX = e.clientX - dragStart.x;
        const newPanY = e.clientY - dragStart.y;
        setViewState((prev) => ({ ...prev, panX: newPanX, panY: newPanY }));
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onViewOptionsChange({
        ...viewOptions,
        panOffset: { x: viewState.panX, y: viewState.panY },
      });
    }
  }, [isDragging, viewState.panX, viewState.panY, viewOptions, onViewOptionsChange]);

  // Sync zoom toggle
  const handleSyncZoomToggle = useCallback(() => {
    onViewOptionsChange({
      ...viewOptions,
      syncZoom: !viewOptions.syncZoom,
    });
  }, [viewOptions, onViewOptionsChange]);

  // Image transform style
  const imageTransform = useMemo(
    () => ({
      transform: `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.zoom})`,
      transformOrigin: 'center center',
    }),
    [viewState.panX, viewState.panY, viewState.zoom]
  );

  // Calculate grid columns based on layout count
  const getGridColumns = useCallback((count: number): string => {
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-2';
    if (count === 5 || count === 6) return 'grid-cols-3';
    return 'grid-cols-2'; // Fallback
  }, []);

  // Render grid layout for multi-layout comparison
  const renderGridLayout = () => {
    if (!layouts || layouts.length < 3) return null;

    const gridCols = getGridColumns(layouts.length);

    return (
      <div
        className={`grid ${gridCols} gap-4 p-4 h-full overflow-auto`}
        data-testid="multi-layout-grid"
      >
        {layouts.map((layout) => (
          <div
            key={layout.id}
            className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => onLayoutSelect && onLayoutSelect(layout.id)}
            data-testid={`layout-snapshot-${layout.id}`}
          >
            {/* Layout label and quality score */}
            <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
              <div className="bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 px-3 py-1 rounded-md shadow-sm">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {layout.label}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 px-3 py-1 rounded-md shadow-sm">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Score: {layout.qualityScore.combinedScore.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Best badge */}
            {layout.isBest && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Best
                </span>
              </div>
            )}

            {/* Layout screenshot */}
            <div className="w-full h-full flex items-center justify-center p-2">
              <div className="image-container" style={imageTransform}>
                <img
                  src={layout.screenshotUrl}
                  alt={`${layout.label} layout`}
                  draggable={false}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {/* Quality metrics summary */}
            <div className="absolute bottom-2 left-2 right-2 z-10 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 px-3 py-2 rounded-md shadow-sm">
              <div className="flex gap-3 text-xs">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Readability:</span>{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {layout.qualityScore.readabilityScore.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Similarity:</span>{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {layout.qualityScore.similarityScore.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render different view modes
  const renderViewContent = () => {
    // Multi-layout grid mode takes precedence
    if (isMultiLayoutMode) {
      return renderGridLayout();
    }
    switch (viewOptions.mode) {
      case 'side-by-side':
        return (
          <div className="side-by-side-view">
            <div className="image-panel reference">
              <div className="panel-label">Reference</div>
              <div className="image-container" style={imageTransform}>
                <img
                  src={referenceImageUrl}
                  alt="Reference diagram"
                  draggable={false}
                />
              </div>
            </div>
            {generatedScreenshotUrl && (
              <div className="image-panel generated">
                <div className="panel-label">Generated</div>
                <div className="image-container" style={imageTransform}>
                  <img
                    src={generatedScreenshotUrl}
                    alt="Generated diagram"
                    draggable={false}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'overlay':
        if (!generatedScreenshotUrl) return null;
        return (
          <div className="overlay-view">
            <div className="overlay-container" style={imageTransform}>
              <img
                src={referenceImageUrl}
                alt="Reference diagram"
                className="reference-layer"
                draggable={false}
              />
              <img
                src={generatedScreenshotUrl}
                alt="Generated diagram"
                className="generated-layer"
                style={{ opacity: viewOptions.overlayOpacity }}
                draggable={false}
              />
            </div>
            <div className="overlay-slider-container">
              <label htmlFor="overlay-opacity">
                Reference
                <input
                  type="range"
                  id="overlay-opacity"
                  min="0"
                  max="1"
                  step="0.01"
                  value={viewOptions.overlayOpacity}
                  onChange={handleOverlayOpacityChange}
                  aria-label="Overlay opacity slider"
                />
                Generated
              </label>
              <span className="opacity-value">
                {Math.round(viewOptions.overlayOpacity * 100)}%
              </span>
            </div>
          </div>
        );

      case 'heatmap':
        return (
          <div className="heatmap-view">
            <div className="image-panel heatmap-panel">
              <div className="panel-label">Difference Heatmap</div>
              <div className="image-container" style={imageTransform}>
                {heatmapUrl ? (
                  <img
                    src={heatmapUrl}
                    alt="Difference heatmap showing areas of divergence"
                    draggable={false}
                  />
                ) : (
                  <div className="heatmap-placeholder">
                    <p>Heatmap not available</p>
                    <p className="hint">Heatmap is generated during comparison analysis</p>
                  </div>
                )}
              </div>
            </div>
            <div className="heatmap-legend">
              <div className="legend-title">Difference Intensity</div>
              <div className="legend-gradient">
                <span className="legend-low">Low</span>
                <div className="gradient-bar" />
                <span className="legend-high">High</span>
              </div>
            </div>
          </div>
        );

      case 'difference':
        if (!generatedScreenshotUrl) return null;
        return (
          <div className="difference-view">
            <div className="image-panel generated-panel">
              <div className="panel-label">Generated</div>
              <div className="image-container" style={imageTransform}>
                <img
                  src={generatedScreenshotUrl}
                  alt="Generated diagram"
                  draggable={false}
                />
              </div>
            </div>
            <div className="image-panel heatmap-panel">
              <div className="panel-label">Difference</div>
              <div className="image-container" style={imageTransform}>
                {heatmapUrl ? (
                  <img
                    src={heatmapUrl}
                    alt="Difference heatmap"
                    draggable={false}
                  />
                ) : (
                  <div className="heatmap-placeholder">
                    <p>Heatmap not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="side-by-side-comparison"
      data-testid="side-by-side-comparison"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Multi-layout mode info banner */}
      {isMultiLayoutMode && (
        <div className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Comparing {layoutCount} layouts - Click any layout for detailed comparison
              </span>
            </div>
          </div>
        </div>
      )}

      {/* View mode selector - hidden in multi-layout mode */}
      {!isMultiLayoutMode && (
        <div className="view-controls" role="tablist" aria-label="Comparison view modes">
        <button
          role="tab"
          aria-selected={viewOptions.mode === 'side-by-side'}
          className={`mode-btn ${viewOptions.mode === 'side-by-side' ? 'active' : ''}`}
          onClick={() => handleModeChange('side-by-side')}
        >
          Side by Side
        </button>
        <button
          role="tab"
          aria-selected={viewOptions.mode === 'overlay'}
          className={`mode-btn ${viewOptions.mode === 'overlay' ? 'active' : ''}`}
          onClick={() => handleModeChange('overlay')}
        >
          Overlay
        </button>
        <button
          role="tab"
          aria-selected={viewOptions.mode === 'heatmap'}
          className={`mode-btn ${viewOptions.mode === 'heatmap' ? 'active' : ''}`}
          onClick={() => handleModeChange('heatmap')}
        >
          Heatmap
        </button>
        <button
          role="tab"
          aria-selected={viewOptions.mode === 'difference'}
          className={`mode-btn ${viewOptions.mode === 'difference' ? 'active' : ''}`}
          onClick={() => handleModeChange('difference')}
        >
          Difference
        </button>
        </div>
      )}

      {/* Zoom controls */}
      <div className="zoom-controls" role="group" aria-label="Zoom controls">
        <button
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out (Ctrl+Scroll down)"
          disabled={viewState.zoom <= MIN_ZOOM}
        >
          −
        </button>
        <span className="zoom-level" aria-live="polite">
          {Math.round(viewState.zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in (Ctrl+Scroll up)"
          disabled={viewState.zoom >= MAX_ZOOM}
        >
          +
        </button>
        <button
          onClick={handleZoomReset}
          aria-label="Reset zoom"
          title="Reset zoom and pan"
          className="reset-btn"
        >
          Reset
        </button>
        <label className="sync-zoom-label">
          <input
            type="checkbox"
            checked={viewOptions.syncZoom}
            onChange={handleSyncZoomToggle}
            aria-label="Synchronize zoom between views"
          />
          Sync Zoom
        </label>
      </div>

      {/* View content */}
      <div className="comparison-content" role="img" aria-label="Diagram comparison view">
        {renderViewContent()}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="shortcuts-hint" aria-hidden="true">
        <span>Ctrl+Scroll to zoom</span>
        <span>Drag to pan</span>
      </div>
    </div>
  );
};

export default SideBySideComparison;
