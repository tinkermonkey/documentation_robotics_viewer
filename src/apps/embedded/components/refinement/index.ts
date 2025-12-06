/**
 * Refinement Components Index
 *
 * Exports all refinement-related components for the human-in-the-loop feedback interface.
 */

export { RefinementFeedbackPanel } from './RefinementFeedbackPanel';
export { SideBySideComparison } from './SideBySideComparison';
export { MetricsDashboard } from './MetricsDashboard';

// Re-export types
export type {
  HumanFeedback,
  RefinementIteration,
  RefinementSession,
  RefinementSessionStatus,
  LayoutParameters,
  ForceDirectedParameters,
  HierarchicalParameters,
  ParameterSuggestion,
  FeedbackTranslationResult,
  ComparisonViewOptions,
  ComparisonViewMode,
  RefinementFeedbackPanelProps,
  SideBySideComparisonProps,
  MetricsDashboardProps,
} from '../../types/refinement';
