/**
 * C4BreadcrumbNav Component
 * Displays hierarchical navigation breadcrumb for C4 view levels
 * Enables quick navigation between Context, Container, and Component views
 */

import React from 'react';
import './C4BreadcrumbNav.css';
import { C4ViewLevel, C4BreadcrumbSegment } from '../types/c4Graph';

export interface C4BreadcrumbNavProps {
  /** Current breadcrumb segments */
  breadcrumb: C4BreadcrumbSegment[];

  /** Current view level */
  currentViewLevel: C4ViewLevel;

  /** Callback when navigating to a specific level */
  onNavigate: (level: C4ViewLevel, containerId?: string, componentId?: string) => void;
}

/**
 * Icons for each view level
 */
const VIEW_LEVEL_ICONS: Record<C4ViewLevel, React.ReactElement> = {
  context: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  ),
  container: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M2 6h12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  component: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M6 2v12M10 2v12M2 6h12M2 10h12" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  code: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 4L1 8l4 4M11 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/**
 * C4BreadcrumbNav Component
 */
export const C4BreadcrumbNav: React.FC<C4BreadcrumbNavProps> = ({
  breadcrumb,
  currentViewLevel,
  onNavigate,
}) => {
  /**
   * Handle clicking on a breadcrumb segment
   */
  const handleSegmentClick = (segment: C4BreadcrumbSegment, _index: number) => {
    // Extract containerId and componentId based on segment position
    if (segment.level === 'context') {
      onNavigate('context');
    } else if (segment.level === 'container') {
      onNavigate('container', segment.nodeId);
    } else if (segment.level === 'component') {
      // For component, we need the parent container ID
      const containerSegment = breadcrumb.find((s) => s.level === 'container');
      onNavigate('component', containerSegment?.nodeId, segment.nodeId);
    }
  };

  /**
   * Handle keyboard navigation on breadcrumb
   */
  const handleKeyDown = (
    event: React.KeyboardEvent,
    segment: C4BreadcrumbSegment,
    _index: number
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSegmentClick(segment, _index);
    }
  };

  // Always show at least the context level
  const effectiveBreadcrumb =
    breadcrumb.length > 0 ? breadcrumb : [{ level: 'context' as C4ViewLevel, label: 'Context' }];

  return (
    <nav className="c4-breadcrumb-nav" aria-label="C4 diagram navigation">
      <ol className="c4-breadcrumb-list" role="list">
        {/* Home icon */}
        <li className="c4-breadcrumb-home">
          <button
            onClick={() => onNavigate('context')}
            className="c4-breadcrumb-home-button"
            aria-label="Navigate to system context view"
            title="System Context"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 8l6-6 6 6M4 7v6h3V10h2v3h3V7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {effectiveBreadcrumb.length > 0 && <span className="c4-breadcrumb-separator">/</span>}
        </li>

        {/* Breadcrumb segments */}
        {effectiveBreadcrumb.map((segment, index) => {
          const isLast = index === effectiveBreadcrumb.length - 1;
          const isCurrent = segment.level === currentViewLevel;

          return (
            <li
              key={`${segment.level}-${segment.nodeId || 'root'}`}
              className={`c4-breadcrumb-item ${isCurrent ? 'current' : ''}`}
            >
              {isLast ? (
                // Current segment - not clickable
                <span
                  className="c4-breadcrumb-current"
                  aria-current="page"
                  title={`Current view: ${segment.label}`}
                >
                  <span className="c4-breadcrumb-icon">{VIEW_LEVEL_ICONS[segment.level]}</span>
                  <span className="c4-breadcrumb-label">{segment.label}</span>
                </span>
              ) : (
                // Clickable segment
                <>
                  <button
                    className="c4-breadcrumb-link"
                    onClick={() => handleSegmentClick(segment, index)}
                    onKeyDown={(e) => handleKeyDown(e, segment, index)}
                    aria-label={`Navigate to ${segment.label}`}
                    title={`Navigate to ${segment.label}`}
                  >
                    <span className="c4-breadcrumb-icon">{VIEW_LEVEL_ICONS[segment.level]}</span>
                    <span className="c4-breadcrumb-label">{segment.label}</span>
                  </button>
                  <span className="c4-breadcrumb-separator" aria-hidden="true">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>

      {/* View level indicator */}
      <div className="c4-view-level-indicator" role="status" aria-live="polite">
        <span className="c4-view-level-badge" data-level={currentViewLevel}>
          {currentViewLevel === 'context' && 'System Context View'}
          {currentViewLevel === 'container' && 'Container View'}
          {currentViewLevel === 'component' && 'Component View'}
          {currentViewLevel === 'code' && 'Code View'}
        </span>
      </div>
    </nav>
  );
};

export default C4BreadcrumbNav;
