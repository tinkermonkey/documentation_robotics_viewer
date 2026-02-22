/**
 * CoverageAnalyzer
 *
 * Provides coverage status helpers used by GoalNode badge rendering.
 */

/**
 * Coverage status for a goal
 */
export type CoverageStatus = 'complete' | 'partial' | 'none';

/**
 * Coverage Analyzer - provides icon and color helpers for CoverageStatus
 */
export class CoverageAnalyzer {
  /**
   * Get coverage icon name based on status
   */
  getCoverageIcon(status: CoverageStatus): string {
    switch (status) {
      case 'complete':
        return '✓'; // Checkmark
      case 'partial':
        return '◐'; // Half-filled circle
      case 'none':
        return '⚠'; // Warning
      default:
        return '?';
    }
  }

  /**
   * Get coverage color based on status
   */
  getCoverageColor(status: CoverageStatus): { bg: string; color: string } {
    switch (status) {
      case 'complete':
        return { bg: '#d1fae5', color: '#059669' }; // Green
      case 'partial':
        return { bg: '#dbeafe', color: '#2563eb' }; // Blue
      case 'none':
        return { bg: '#fef3c7', color: '#f59e0b' }; // Amber
      default:
        return { bg: '#f3f4f6', color: '#6b7280' }; // Gray
    }
  }
}

/**
 * Singleton instance
 */
export const coverageAnalyzer = new CoverageAnalyzer();
