/**
 * Refinement Types
 *
 * Type definitions for the human-in-the-loop feedback interface.
 * Supports iterative layout refinement with human guidance.
 */

import { CombinedQualityScore } from '../../../core/services/comparison/qualityScoreService';

/**
 * Quality tier classification for visual feedback
 */
export type QualityTier = 'excellent' | 'good' | 'acceptable' | 'poor' | 'unacceptable';

/**
 * Aspects of the layout that can receive feedback
 */
export type FeedbackAspect = 'spacing' | 'alignment' | 'grouping' | 'routing' | 'overall';

/**
 * Direction of adjustment for feedback
 */
export type FeedbackDirection = 'increase' | 'decrease' | 'acceptable';

/**
 * Intensity of the adjustment
 */
export type FeedbackIntensity = 'slight' | 'moderate' | 'significant';

/**
 * Human feedback for layout adjustments
 */
export interface HumanFeedback {
  /** Aspect of the layout being addressed */
  aspect: FeedbackAspect;
  /** Direction of adjustment */
  direction: FeedbackDirection;
  /** How much to adjust */
  intensity: FeedbackIntensity;
  /** Optional notes explaining the feedback */
  notes?: string;
  /** Timestamp when feedback was given */
  timestamp?: string;
}

/**
 * A single iteration in the refinement process
 */
export interface RefinementIteration {
  /** Iteration number (1-based) */
  iterationNumber: number;
  /** Quality score for this iteration */
  qualityScore: CombinedQualityScore;
  /** Screenshot URL of the generated diagram */
  screenshotUrl: string;
  /** Whether this iteration improved over the previous */
  improved: boolean;
  /** Change in combined score from previous iteration */
  improvementDelta: number;
  /** Layout parameters used for this iteration */
  parameters: LayoutParameters;
  /** Human feedback received (if any) */
  feedback?: HumanFeedback;
  /** Timestamp of iteration completion */
  timestamp: string;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Layout parameters that can be adjusted
 */
export interface LayoutParameters {
  /** Force-directed layout parameters */
  forceDirected?: ForceDirectedParameters;
  /** Hierarchical layout parameters */
  hierarchical?: HierarchicalParameters;
  /** Generic layout parameters */
  generic?: GenericParameters;
}

/**
 * Force-directed layout specific parameters
 */
export interface ForceDirectedParameters {
  /** Repulsion strength between nodes (-5000 to 0) */
  chargeStrength: number;
  /** Target distance between linked nodes (50 to 500) */
  linkDistance: number;
  /** Strength of centering force (0 to 1) */
  centerForce: number;
  /** Number of simulation iterations (50 to 500) */
  iterations: number;
}

/**
 * Hierarchical layout specific parameters
 */
export interface HierarchicalParameters {
  /** Horizontal spacing between nodes (50 to 200) */
  nodeSpacing: number;
  /** Vertical spacing between ranks (80 to 300) */
  rankSpacing: number;
  /** Direction: TB, BT, LR, RL */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
}

/**
 * Generic layout parameters
 */
export interface GenericParameters {
  /** Overall padding around the graph */
  padding: number;
  /** Minimum node separation */
  minSeparation: number;
}

/**
 * A parameter adjustment suggestion
 */
export interface ParameterSuggestion {
  /** Parameter path (e.g., 'forceDirected.chargeStrength') */
  parameter: string;
  /** Current value */
  currentValue: number;
  /** Suggested new value */
  suggestedValue: number;
  /** Confidence in the suggestion (0 to 1) */
  confidence: number;
  /** Reasoning for the suggestion */
  rationale: string;
}

/**
 * Result of translating feedback to parameter suggestions
 */
export interface FeedbackTranslationResult {
  /** Suggested parameter adjustments */
  suggestions: ParameterSuggestion[];
  /** Overall confidence in the suggestions */
  overallConfidence: number;
  /** Human-readable explanation */
  explanation: string;
}

/**
 * Session state for the refinement process
 */
export interface RefinementSession {
  /** Unique session identifier */
  sessionId: string;
  /** Reference image URL */
  referenceImageUrl: string;
  /** All iterations in order */
  iterations: RefinementIteration[];
  /** Current session status */
  status: RefinementSessionStatus;
  /** Target quality score */
  targetScore: number;
  /** Baseline quality score (from first iteration) */
  baselineScore: number;
  /** Maximum iterations allowed */
  maxIterations: number;
  /** Session start timestamp */
  startedAt: string;
  /** Session end timestamp (if completed) */
  endedAt?: string;
  /** Accumulated feedback for this session */
  accumulatedFeedback: HumanFeedback[];
}

/**
 * Possible states for a refinement session
 */
export type RefinementSessionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'awaiting_feedback'
  | 'completed'
  | 'stopped'
  | 'error';

/**
 * Options for the comparison view
 */
export interface ComparisonViewOptions {
  /** Current view mode */
  mode: ComparisonViewMode;
  /** Overlay opacity (0-1) for overlay mode */
  overlayOpacity: number;
  /** Current zoom level */
  zoom: number;
  /** Pan offset */
  panOffset: { x: number; y: number };
  /** Whether zoom is synchronized between views */
  syncZoom: boolean;
}

/**
 * Available comparison view modes
 */
export type ComparisonViewMode = 'side-by-side' | 'overlay' | 'heatmap' | 'difference';

/**
 * Props for the RefinementFeedbackPanel component
 */
export interface RefinementFeedbackPanelProps {
  /** Current iteration data */
  currentIteration: RefinementIteration;
  /** Reference image URL */
  referenceImageUrl: string;
  /** Generated screenshot URL */
  generatedScreenshotUrl: string;
  /** All previous iterations */
  iterations: RefinementIteration[];
  /** Session status */
  status: RefinementSessionStatus;
  /** Callback when feedback is submitted */
  onFeedback: (feedback: HumanFeedback) => void;
  /** Callback to accept current result and save parameters */
  onApprove: () => void;
  /** Callback to reject current result and revert to previous parameters */
  onReject: () => void;
  /** Callback to continue with auto-optimization */
  onContinue: () => void;
  /** Callback to continue refining with manual adjustments */
  onRefine: () => void;
  /** Callback to stop/abort refinement */
  onStop: () => void;
  /** Callback to revert to a previous iteration */
  onRevert: (iterationNumber: number) => void;
  /** Whether the panel is in a processing state */
  isProcessing?: boolean;
}

/**
 * Layout snapshot for multi-layout comparison
 */
export interface LayoutSnapshot {
  /** Unique identifier for the layout */
  id: string;
  /** Display label */
  label: string;
  /** Screenshot URL */
  screenshotUrl: string;
  /** Quality score for this layout */
  qualityScore: CombinedQualityScore;
  /** Layout parameters used */
  parameters?: LayoutParameters;
  /** Whether this is the best layout */
  isBest?: boolean;
}

/**
 * Props for the MetricsDashboard component
 */
export interface MetricsDashboardProps {
  /** All iterations for the session */
  iterations: RefinementIteration[];
  /** Target score line */
  targetScore: number;
  /** Baseline score line */
  baselineScore: number;
  /** Currently selected iteration (for highlighting) */
  selectedIteration?: number;
  /** Callback when an iteration is selected */
  onIterationSelect?: (iterationNumber: number) => void;
  /** Callback when revert is requested */
  onRevert?: (iterationNumber: number) => void;
}
