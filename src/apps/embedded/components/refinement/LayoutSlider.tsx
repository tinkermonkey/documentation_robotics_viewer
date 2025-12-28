/**
 * LayoutSlider Component
 *
 * Implements a draggable slider for before/after layout comparison.
 * Synchronizes viewport position and zoom between layouts.
 *
 * Task 7.5: Create before/after slider component
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface LayoutSliderProps {
  /** Before image URL (reference) */
  beforeImageUrl: string;
  /** After image URL (generated) */
  afterImageUrl: string;
  /** Initial slider position (0-100) */
  initialPosition?: number;
  /** Labels for before/after */
  beforeLabel?: string;
  afterLabel?: string;
  /** Zoom level (shared between both images) */
  zoom?: number;
  /** Pan offset (shared between both images) */
  panOffset?: { x: number; y: number };
}

export const LayoutSlider: React.FC<LayoutSliderProps> = ({
  beforeImageUrl,
  afterImageUrl,
  initialPosition = 50,
  beforeLabel = 'Before',
  afterLabel = 'After',
  zoom = 1,
  panOffset = { x: 0, y: 0 },
}) => {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse/touch drag
  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  }, [updateSliderPosition]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        updateSliderPosition(e.clientX);
      }
    },
    [isDragging, updateSliderPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + 1));
    }
  }, []);

  // Synchronized transform style
  const imageTransform = {
    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
    transformOrigin: 'center center',
  };

  return (
    <div
      ref={containerRef}
      className="layout-slider relative w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-lg select-none"
      data-testid="layout-slider"
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="Before/after comparison slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(sliderPosition)}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* After image (full width) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div style={imageTransform}>
          <img
            src={afterImageUrl}
            alt={afterLabel}
            draggable={false}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        {/* After label */}
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-lg text-sm font-medium">
          {afterLabel}
        </div>
      </div>

      {/* Before image (clipped to slider position) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <div style={imageTransform}>
          <img
            src={beforeImageUrl}
            alt={beforeLabel}
            draggable={false}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        {/* Before label */}
        <div className="absolute top-4 left-4 bg-gray-700 text-white px-3 py-1.5 rounded-md shadow-lg text-sm font-medium">
          {beforeLabel}
        </div>
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Handle grip */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl border-4 border-blue-500 pointer-events-auto cursor-grab flex items-center justify-center">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1zm-3 0a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1zm6 0a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Slider position indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-md text-xs font-medium">
        {Math.round(sliderPosition)}% {beforeLabel} / {Math.round(100 - sliderPosition)}% {afterLabel}
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
        ← → to adjust
      </div>
    </div>
  );
};

export default LayoutSlider;
