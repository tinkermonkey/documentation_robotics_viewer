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

import { MotivationElementType } from '../../apps/embedded/types/motivationGraph';

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
   * Get visible element types based on current zoom level
   *
   * Overview (< 0.4): Stakeholders, Goals (top-level only)
   * Medium (0.4-1.0): + Drivers, Outcomes, Requirements (primary)
   * Detail (>= 1.0): All elements including Constraints, Principles, etc.
   */
  getVisibleElementTypes(zoomLevel: number): Set<MotivationElementType> {
    const category = this.getZoomCategory(zoomLevel);
    const visibleTypes = new Set<MotivationElementType>();

    // Overview: Only core strategic elements
    if (category === 'overview') {
      visibleTypes.add(MotivationElementType.Stakeholder);
      visibleTypes.add(MotivationElementType.Goal);
      return visibleTypes;
    }

    // Medium: Add operational elements
    if (category === 'medium') {
      visibleTypes.add(MotivationElementType.Stakeholder);
      visibleTypes.add(MotivationElementType.Goal);
      visibleTypes.add(MotivationElementType.Driver);
      visibleTypes.add(MotivationElementType.Outcome);
      visibleTypes.add(MotivationElementType.Requirement);
      return visibleTypes;
    }

    // Detail: All elements
    visibleTypes.add(MotivationElementType.Stakeholder);
    visibleTypes.add(MotivationElementType.Goal);
    visibleTypes.add(MotivationElementType.Driver);
    visibleTypes.add(MotivationElementType.Outcome);
    visibleTypes.add(MotivationElementType.Requirement);
    visibleTypes.add(MotivationElementType.Constraint);
    visibleTypes.add(MotivationElementType.Principle);
    visibleTypes.add(MotivationElementType.Assessment);
    visibleTypes.add(MotivationElementType.Meaning);
    visibleTypes.add(MotivationElementType.Value);
    visibleTypes.add(MotivationElementType.Assumption);
    visibleTypes.add(MotivationElementType.ValueStream);

    return visibleTypes;
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
  shouldShowNodeIcons(zoomLevel: number): boolean {
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
   * Filter elements based on importance and zoom level
   * For overview mode, only show "top-level" goals (high priority or root goals)
   *
   * @param elements - All motivation elements
   * @param zoomLevel - Current zoom level
   * @returns Filtered element IDs to show
   */
  filterElementsByImportance(
    elements: Array<{ id: string; type: string; properties?: any }>,
    zoomLevel: number
  ): Set<string> {
    const category = this.getZoomCategory(zoomLevel);
    const visibleTypes = this.getVisibleElementTypes(zoomLevel);
    const filteredIds = new Set<string>();

    for (const element of elements) {
      // Check if element type is visible
      if (!visibleTypes.has(element.type as MotivationElementType)) {
        continue;
      }

      // At overview level, filter goals by priority
      if (category === 'overview' && element.type === MotivationElementType.Goal) {
        // Only show high priority or root goals
        const priority = element.properties?.priority;
        if (priority === 'high' || priority === 'critical') {
          filteredIds.add(element.id);
        }
      } else {
        // Include all elements of visible types at medium/detail levels
        filteredIds.add(element.id);
      }
    }

    return filteredIds;
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
    const detailLevel = this.getNodeDetailLevel(zoomLevel);

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
