/**
 * Metrics History Service
 *
 * Provides persistence and history tracking for layout quality metrics.
 * Supports regression detection by comparing current metrics against baselines.
 * Stores metrics in localStorage with configurable retention.
 */

import {
  LayoutQualityReport,
  DiagramType,
  LayoutType,
  ReadabilityMetrics,
} from './graphReadabilityService';

/**
 * Regression severity levels
 */
export type RegressionSeverity = 'none' | 'minor' | 'moderate' | 'severe';

/**
 * Metrics snapshot with additional metadata for history tracking
 */
export interface MetricsSnapshot {
  /**
   * Unique identifier for this snapshot
   */
  id: string;

  /**
   * The layout quality report
   */
  report: LayoutQualityReport;

  /**
   * Optional model identifier for grouping snapshots
   */
  modelId?: string;

  /**
   * Optional label or description
   */
  label?: string;

  /**
   * Whether this snapshot is marked as a baseline
   */
  isBaseline: boolean;
}

/**
 * Regression detection result
 */
export interface RegressionReport {
  /**
   * Overall regression detected
   */
  hasRegression: boolean;

  /**
   * Severity classification of the regression
   */
  severity: RegressionSeverity;

  /**
   * Overall score change (negative means regression)
   */
  overallScoreChange: number;

  /**
   * Percentage change in overall score
   */
  overallPercentageChange: number;

  /**
   * Individual metric regressions
   */
  metricRegressions: {
    metric: keyof ReadabilityMetrics;
    baselineValue: number;
    currentValue: number;
    change: number;
    percentageChange: number;
    hasRegression: boolean;
  }[];

  /**
   * Current report being compared
   */
  current: LayoutQualityReport;

  /**
   * Baseline report used for comparison
   */
  baseline: LayoutQualityReport;

  /**
   * Timestamp of comparison
   */
  timestamp: string;
}

/**
 * Configuration for the metrics history service
 */
export interface MetricsHistoryConfig {
  /**
   * Maximum number of snapshots to retain
   * @default 50
   */
  maxSnapshots: number;

  /**
   * Storage key prefix for localStorage
   * @default 'dr-viewer-metrics'
   */
  storageKeyPrefix: string;

  /**
   * Threshold for minor regression (percentage decrease)
   * @default 5
   */
  minorRegressionThreshold: number;

  /**
   * Threshold for moderate regression (percentage decrease)
   * @default 10
   */
  moderateRegressionThreshold: number;

  /**
   * Threshold for severe regression (percentage decrease)
   * @default 20
   */
  severeRegressionThreshold: number;
}

/**
 * Internal storage structure
 */
interface MetricsStorage {
  snapshots: MetricsSnapshot[];
  baselines: Record<string, MetricsSnapshot>; // keyed by diagramType-layoutType
  version: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MetricsHistoryConfig = {
  maxSnapshots: 50,
  storageKeyPrefix: 'dr-viewer-metrics',
  minorRegressionThreshold: 5,
  moderateRegressionThreshold: 10,
  severeRegressionThreshold: 20,
};

/**
 * Current storage schema version
 */
const STORAGE_VERSION = 1;

/**
 * Metrics History Service class
 *
 * Manages persistent storage of layout quality metrics with history tracking
 * and regression detection capabilities.
 */
export class MetricsHistoryService {
  private config: MetricsHistoryConfig;
  private storageKey: string;

  constructor(config: Partial<MetricsHistoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storageKey = `${this.config.storageKeyPrefix}-history`;
  }

  /**
   * Generate a unique snapshot ID
   */
  private generateId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the storage key for a baseline
   */
  private getBaselineKey(diagramType: DiagramType, layoutType: LayoutType): string {
    return `${diagramType}-${layoutType}`;
  }

  /**
   * Load storage from localStorage
   */
  private loadStorage(): MetricsStorage {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as MetricsStorage;
        // Handle version migrations if needed
        if (data.version === STORAGE_VERSION) {
          return data;
        }
        // Future: Add migration logic for older versions
      }
    } catch (error) {
      console.warn('Failed to load metrics storage:', error);
    }

    // Return default empty storage
    return {
      snapshots: [],
      baselines: {},
      version: STORAGE_VERSION,
    };
  }

  /**
   * Save storage to localStorage
   */
  private saveStorage(storage: MetricsStorage): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    } catch (error) {
      console.warn('Failed to save metrics storage:', error);
      // If storage is full, try to prune old snapshots
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.pruneOldSnapshots(storage, Math.floor(this.config.maxSnapshots / 2));
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(storage));
        } catch {
          console.error('Unable to save metrics even after pruning');
        }
      }
    }
  }

  /**
   * Prune old snapshots to stay within limits
   */
  private pruneOldSnapshots(storage: MetricsStorage, maxToKeep: number): void {
    // Sort by timestamp descending (newest first)
    storage.snapshots.sort(
      (a, b) =>
        new Date(b.report.timestamp).getTime() -
        new Date(a.report.timestamp).getTime()
    );

    // Keep only the most recent ones, preserving baselines
    const baselines = new Set(Object.values(storage.baselines).map((b) => b.id));
    const nonBaselines = storage.snapshots.filter((s) => !baselines.has(s.id));
    const baselineSnapshots = storage.snapshots.filter((s) => baselines.has(s.id));

    // Keep all baselines plus the most recent non-baseline snapshots
    storage.snapshots = [
      ...baselineSnapshots,
      ...nonBaselines.slice(0, maxToKeep - baselineSnapshots.length),
    ];
  }

  /**
   * Save a new metrics snapshot
   *
   * @param report - Layout quality report to save
   * @param options - Optional metadata
   * @returns The created snapshot
   */
  saveSnapshot(
    report: LayoutQualityReport,
    options: { modelId?: string; label?: string; setAsBaseline?: boolean } = {}
  ): MetricsSnapshot {
    const storage = this.loadStorage();

    const snapshot: MetricsSnapshot = {
      id: this.generateId(),
      report,
      modelId: options.modelId,
      label: options.label,
      isBaseline: options.setAsBaseline ?? false,
    };

    storage.snapshots.push(snapshot);

    // Set as baseline if requested
    if (options.setAsBaseline) {
      const baselineKey = this.getBaselineKey(
        report.diagramType,
        report.layoutType
      );
      storage.baselines[baselineKey] = snapshot;
    }

    // Enforce snapshot limit
    if (storage.snapshots.length > this.config.maxSnapshots) {
      this.pruneOldSnapshots(storage, this.config.maxSnapshots);
    }

    this.saveStorage(storage);
    return snapshot;
  }

  /**
   * Get all snapshots, optionally filtered
   *
   * @param filters - Optional filters
   * @returns Array of matching snapshots
   */
  getSnapshots(filters?: {
    diagramType?: DiagramType;
    layoutType?: LayoutType;
    modelId?: string;
    limit?: number;
  }): MetricsSnapshot[] {
    const storage = this.loadStorage();
    let snapshots = [...storage.snapshots];

    // Apply filters
    if (filters?.diagramType) {
      snapshots = snapshots.filter(
        (s) => s.report.diagramType === filters.diagramType
      );
    }
    if (filters?.layoutType) {
      snapshots = snapshots.filter(
        (s) => s.report.layoutType === filters.layoutType
      );
    }
    if (filters?.modelId) {
      snapshots = snapshots.filter((s) => s.modelId === filters.modelId);
    }

    // Sort by timestamp descending
    snapshots.sort(
      (a, b) =>
        new Date(b.report.timestamp).getTime() -
        new Date(a.report.timestamp).getTime()
    );

    // Apply limit
    if (filters?.limit && filters.limit > 0) {
      snapshots = snapshots.slice(0, filters.limit);
    }

    return snapshots;
  }

  /**
   * Get a specific snapshot by ID
   */
  getSnapshot(id: string): MetricsSnapshot | undefined {
    const storage = this.loadStorage();
    return storage.snapshots.find((s) => s.id === id);
  }

  /**
   * Delete a snapshot by ID
   */
  deleteSnapshot(id: string): boolean {
    const storage = this.loadStorage();
    const index = storage.snapshots.findIndex((s) => s.id === id);

    if (index === -1) return false;

    // Remove from snapshots
    storage.snapshots.splice(index, 1);

    // Remove from baselines if it was a baseline
    for (const [key, baseline] of Object.entries(storage.baselines)) {
      if (baseline.id === id) {
        delete storage.baselines[key];
      }
    }

    this.saveStorage(storage);
    return true;
  }

  /**
   * Set a snapshot as the baseline for its diagram/layout type
   */
  setBaseline(snapshotId: string): boolean {
    const storage = this.loadStorage();
    const snapshot = storage.snapshots.find((s) => s.id === snapshotId);

    if (!snapshot) return false;

    const baselineKey = this.getBaselineKey(
      snapshot.report.diagramType,
      snapshot.report.layoutType
    );

    // Update baseline flag on old baseline
    const oldBaseline = storage.baselines[baselineKey];
    if (oldBaseline) {
      const oldSnapshot = storage.snapshots.find((s) => s.id === oldBaseline.id);
      if (oldSnapshot) {
        oldSnapshot.isBaseline = false;
      }
    }

    // Set new baseline
    snapshot.isBaseline = true;
    storage.baselines[baselineKey] = snapshot;

    this.saveStorage(storage);
    return true;
  }

  /**
   * Get the baseline for a specific diagram and layout type
   */
  getBaseline(
    diagramType: DiagramType,
    layoutType: LayoutType
  ): MetricsSnapshot | undefined {
    const storage = this.loadStorage();
    const baselineKey = this.getBaselineKey(diagramType, layoutType);
    return storage.baselines[baselineKey];
  }

  /**
   * Clear all baselines
   */
  clearBaselines(): void {
    const storage = this.loadStorage();

    // Update isBaseline flags
    for (const baseline of Object.values(storage.baselines)) {
      const snapshot = storage.snapshots.find((s) => s.id === baseline.id);
      if (snapshot) {
        snapshot.isBaseline = false;
      }
    }

    storage.baselines = {};
    this.saveStorage(storage);
  }

  /**
   * Classify regression severity based on percentage change
   */
  private classifySeverity(percentageChange: number): RegressionSeverity {
    const absChange = Math.abs(percentageChange);

    if (percentageChange >= 0) return 'none';
    if (absChange < this.config.minorRegressionThreshold) return 'none';
    if (absChange < this.config.moderateRegressionThreshold) return 'minor';
    if (absChange < this.config.severeRegressionThreshold) return 'moderate';
    return 'severe';
  }

  /**
   * Detect regression by comparing current report against baseline
   *
   * @param current - Current layout quality report
   * @param baseline - Optional baseline (uses stored baseline if not provided)
   * @returns Regression report with severity classification
   */
  detectRegression(
    current: LayoutQualityReport,
    baseline?: LayoutQualityReport
  ): RegressionReport {
    // Use stored baseline if not provided
    if (!baseline) {
      const storedBaseline = this.getBaseline(
        current.diagramType,
        current.layoutType
      );
      if (!storedBaseline) {
        // No baseline to compare against - no regression
        return {
          hasRegression: false,
          severity: 'none',
          overallScoreChange: 0,
          overallPercentageChange: 0,
          metricRegressions: [],
          current,
          baseline: current, // Use current as baseline
          timestamp: new Date().toISOString(),
        };
      }
      baseline = storedBaseline.report;
    }

    // Calculate overall changes
    const overallScoreChange = current.overallScore - baseline.overallScore;
    const overallPercentageChange =
      baseline.overallScore > 0
        ? (overallScoreChange / baseline.overallScore) * 100
        : 0;

    // Calculate individual metric regressions
    const metricKeys: (keyof ReadabilityMetrics)[] = [
      'crossingNumber',
      'crossingAngle',
      'angularResolutionMin',
      'angularResolutionDev',
    ];

    const metricRegressions = metricKeys.map((metric) => {
      const baselineValue = baseline!.metrics[metric];
      const currentValue = current.metrics[metric];
      const change = currentValue - baselineValue;
      const percentageChange =
        baselineValue > 0 ? (change / baselineValue) * 100 : 0;

      return {
        metric,
        baselineValue,
        currentValue,
        change,
        percentageChange,
        hasRegression: percentageChange < -this.config.minorRegressionThreshold,
      };
    });

    // Determine overall severity
    const severity = this.classifySeverity(overallPercentageChange);
    const hasRegression = severity !== 'none';

    return {
      hasRegression,
      severity,
      overallScoreChange,
      overallPercentageChange,
      metricRegressions,
      current,
      baseline,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get metrics history for trend analysis
   *
   * @param diagramType - Filter by diagram type
   * @param layoutType - Filter by layout type
   * @param limit - Maximum number of snapshots
   * @returns Array of snapshots sorted by timestamp (oldest first)
   */
  getMetricsHistory(
    diagramType: DiagramType,
    layoutType: LayoutType,
    limit = 50
  ): MetricsSnapshot[] {
    return this.getSnapshots({ diagramType, layoutType, limit }).reverse();
  }

  /**
   * Get statistics across all stored snapshots
   */
  getStorageStats(): {
    totalSnapshots: number;
    baselineCount: number;
    snapshotsByDiagramType: Record<string, number>;
    oldestSnapshot?: string;
    newestSnapshot?: string;
  } {
    const storage = this.loadStorage();
    const snapshots = storage.snapshots;

    const snapshotsByDiagramType: Record<string, number> = {};
    snapshots.forEach((s) => {
      const type = s.report.diagramType;
      snapshotsByDiagramType[type] = (snapshotsByDiagramType[type] || 0) + 1;
    });

    const timestamps = snapshots.map((s) => new Date(s.report.timestamp).getTime());
    const oldestSnapshot =
      timestamps.length > 0
        ? new Date(Math.min(...timestamps)).toISOString()
        : undefined;
    const newestSnapshot =
      timestamps.length > 0
        ? new Date(Math.max(...timestamps)).toISOString()
        : undefined;

    return {
      totalSnapshots: snapshots.length,
      baselineCount: Object.keys(storage.baselines).length,
      snapshotsByDiagramType,
      oldestSnapshot,
      newestSnapshot,
    };
  }

  /**
   * Clear all stored metrics (use with caution)
   */
  clearAll(): void {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Export all metrics data for backup
   */
  exportData(): MetricsStorage {
    return this.loadStorage();
  }

  /**
   * Import metrics data from backup
   */
  importData(data: MetricsStorage): boolean {
    try {
      if (data.version !== STORAGE_VERSION) {
        console.warn('Import data version mismatch, may cause issues');
      }
      this.saveStorage(data);
      return true;
    } catch (error) {
      console.error('Failed to import metrics data:', error);
      return false;
    }
  }
}

/**
 * Singleton instance for convenience
 */
let defaultInstance: MetricsHistoryService | null = null;

/**
 * Get the default metrics history service instance
 */
export function getMetricsHistoryService(): MetricsHistoryService {
  if (!defaultInstance) {
    defaultInstance = new MetricsHistoryService();
  }
  return defaultInstance;
}

/**
 * Reset the default instance (useful for testing)
 */
export function resetMetricsHistoryService(): void {
  defaultInstance = null;
}
