/**
 * SemanticZoomController
 *
 * Manages progressive detail disclosure based on zoom level.
 * Controls which element types are visible and how much detail to show in nodes.
 *
 * Zoom Thresholds:
 * - Overview (0.1-0.4): Show only stakeholders and top-level goals
 * - Medium (0.4-1.0): Add drivers, outcomes, primary requirements
 * - Detail (1.0-2.0+): Show all elements including constraints
 *
 * Detail Levels:
 * - Minimal: Name only
 * - Standard: Name + type badge
 * - Detailed: Name + type + metadata (priority, status, etc.)
 */

/**
 * Zoom level thresholds
 */
export const ZOOM_THRESHOLDS = {
  OVERVIEW_MIN: 0.1,
  OVERVIEW_MAX: 0.4,
  MEDIUM_MIN: 0.4,
  MEDIUM_MAX: 1.0,
  DETAIL_MIN: 1.0,
  DETAIL_MAX: 2.0,
} as const;

/**
 * Node detail level
 */
export type NodeDetailLevel = 'minimal' | 'standard' | 'detailed';

/**
 * Zoom level category
 */
export type ZoomLevelCategory = 'overview' | 'medium' | 'detail';

/**
 * Semantic Zoom Controller
 */
export class SemanticZoomController {
  /**
   * Get the zoom level category for a given zoom value
   */
  getZoomCategory(zoomLevel: number): ZoomLevelCategory {
    if (zoomLevel < ZOOM_THRESHOLDS.MEDIUM_MIN) {
      return 'overview';
    } else if (zoomLevel < ZOOM_THRESHOLDS.DETAIL_MIN) {
      return 'medium';
    } else {
      return 'detail';
    }
  }

  /**
   * Get node detail level based on zoom
   *
   * Minimal (< 0.4): Name only
   * Standard (0.4-1.0): Name + type badge
   * Detailed (>= 1.0): Name + type + metadata (priority, status, etc.)
   */
  getNodeDetailLevel(zoomLevel: number): NodeDetailLevel {
    const category = this.getZoomCategory(zoomLevel);

    switch (category) {
      case 'overview':
        return 'minimal';
      case 'medium':
        return 'standard';
      case 'detail':
        return 'detailed';
      default:
        return 'standard';
    }
  }

  /**
   * Determine whether edge labels should be shown
   *
   * Edge labels only appear at detail zoom level to reduce clutter
   */
  shouldShowEdgeLabels(zoomLevel: number): boolean {
    return this.getZoomCategory(zoomLevel) === 'detail';
  }

  /**
   * Get recommended font size multiplier based on zoom
   * Ensures text remains readable at different zoom levels
   */
  getFontSizeMultiplier(zoomLevel: number): number {
    const category = this.getZoomCategory(zoomLevel);

    switch (category) {
      case 'overview':
        return 1.2; // Slightly larger for readability when zoomed out
      case 'medium':
        return 1.0; // Normal size
      case 'detail':
        return 0.9; // Slightly smaller to fit more detail
      default:
        return 1.0;
    }
  }

  /**
   * Determine whether to show node icons based on zoom
   */
  shouldShowNodeIcons(_zoomLevel: number): boolean {
    // Icons are helpful at all zoom levels for quick identification
    return true;
  }

  /**
   * Determine whether to show metadata badges (priority, status, etc.)
   */
  shouldShowMetadataBadges(zoomLevel: number): boolean {
    const category = this.getZoomCategory(zoomLevel);
    // Only show badges at medium and detail levels
    return category !== 'overview';
  }

  /**
   * Get maximum visible edge count recommendation
   * Beyond this threshold, edge bundling should be applied
   */
  getMaxVisibleEdges(zoomLevel: number): number {
    const category = this.getZoomCategory(zoomLevel);

    switch (category) {
      case 'overview':
        return 50; // Aggressive filtering at overview
      case 'medium':
        return 100; // Moderate filtering
      case 'detail':
        return 200; // Show more edges when zoomed in
      default:
        return 100;
    }
  }

  /**
   * Get transition duration for smooth detail level changes
   */
  getTransitionDuration(): number {
    return 300; // 300ms smooth transition
  }

  /**
   * Get description of current zoom level for accessibility
   */
  getZoomLevelDescription(zoomLevel: number): string {
    const category = this.getZoomCategory(zoomLevel);


    switch (category) {
      case 'overview':
        return 'Overview mode: Showing strategic elements (stakeholders and goals)';
      case 'medium':
        return 'Medium detail: Showing operational elements (drivers, requirements, outcomes)';
      case 'detail':
        return 'Detail mode: Showing all elements with complete metadata';
      default:
        return 'Standard view';
    }
  }
}

/**
 * Singleton instance
 */
export const semanticZoomController = new SemanticZoomController();
