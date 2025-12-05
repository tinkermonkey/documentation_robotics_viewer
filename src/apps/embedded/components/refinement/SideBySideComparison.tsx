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
import './SideBySideComparison.css';

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
  viewOptions,
  onViewOptionsChange,
}) => {
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

  // Render different view modes
  const renderViewContent = () => {
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
          </div>
        );

      case 'overlay':
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
      {/* View mode selector */}
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
