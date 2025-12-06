/**
 * Metrics Services
 *
 * Exports for graph readability metrics calculation and history tracking.
 */

// Graph readability service
export {
  // Types
  type DiagramType,
  type LayoutType,
  type ReadabilityMetrics,
  type ExtendedMetrics,
  type LayoutQualityReport,
  type MetricWeights,
  type GreadabilityGraph,

  // Functions
  toGreadabilityGraph,
  calculateLayoutQuality,
  calculateEdgeLengthStats,
  calculateNodeOcclusion,
  calculateAspectRatio,
  calculateDensity,
  getMetricWeights,
  calculateOverallScore,
  compareLayoutQuality,
} from './graphReadabilityService';

// Metrics history service
export {
  // Types
  type RegressionSeverity,
  type MetricsSnapshot,
  type RegressionReport,
  type MetricsHistoryConfig,

  // Class
  MetricsHistoryService,

  // Singleton helpers
  getMetricsHistoryService,
  resetMetricsHistoryService,
} from './metricsHistoryService';
