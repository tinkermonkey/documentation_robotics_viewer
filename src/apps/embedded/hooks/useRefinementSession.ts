/**
 * useRefinementSession Hook
 *
 * Custom React hook for managing a refinement session.
 * Handles session lifecycle, iteration management, and feedback processing.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  RefinementSession,
  RefinementSessionStatus,
  RefinementIteration,
  HumanFeedback,
  LayoutParameters,
  FeedbackTranslationResult,
} from '../types/refinement';
import {
  translateFeedback,
  translateAccumulatedFeedback,
  applyParameterSuggestions,
  getDefaultParameters,
} from '../services/refinement/feedbackToParameterService';

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook options
 */
export interface UseRefinementSessionOptions {
  /** Target quality score to aim for */
  targetScore?: number;
  /** Maximum iterations before stopping */
  maxIterations?: number;
  /** Layout type for parameter translation */
  layoutType?: 'force-directed' | 'hierarchical';
  /** Callback when status changes */
  onStatusChange?: (status: RefinementSessionStatus) => void;
  /** Callback when a new iteration completes */
  onIterationComplete?: (iteration: RefinementIteration) => void;
}

/**
 * Hook return type
 */
export interface UseRefinementSessionReturn {
  /** Current session state */
  session: RefinementSession | null;
  /** Current session status */
  status: RefinementSessionStatus;
  /** Current iteration (last in list) */
  currentIteration: RefinementIteration | null;
  /** All previous iterations */
  previousIterations: RefinementIteration[];
  /** Best iteration so far */
  bestIteration: RefinementIteration | null;
  /** Whether session is processing */
  isProcessing: boolean;
  /** Start a new session */
  startSession: (referenceImageUrl: string, initialParams?: LayoutParameters) => void;
  /** End the current session (approve) */
  endSession: () => void;
  /** Stop the current session (abort) */
  stopSession: () => void;
  /** Start a new iteration */
  startIteration: (params: LayoutParameters) => void;
  /** Complete the current iteration with results */
  completeIteration: (result: Omit<RefinementIteration, 'iterationNumber' | 'improved' | 'improvementDelta'>) => void;
  /** Submit human feedback */
  submitFeedback: (feedback: HumanFeedback) => FeedbackTranslationResult;
  /** Get suggested parameters based on accumulated feedback */
  getSuggestedParameters: () => LayoutParameters;
  /** Revert to a previous iteration */
  revertToIteration: (iterationNumber: number) => void;
  /** Pause for human feedback */
  pauseForFeedback: () => void;
  /** Resume auto-optimization */
  continueAutoOptimization: () => void;
}

/**
 * Custom hook for managing refinement sessions
 */
export function useRefinementSession(
  options: UseRefinementSessionOptions = {}
): UseRefinementSessionReturn {
  const {
    targetScore = 0.85,
    maxIterations = 20,
    layoutType = 'force-directed',
    onStatusChange,
    onIterationComplete,
  } = options;

  // Session state
  const [session, setSession] = useState<RefinementSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Derived values
  const status = session?.status ?? 'idle';

  const currentIteration = useMemo(
    () => (session?.iterations.length ? session.iterations[session.iterations.length - 1] : null),
    [session?.iterations]
  );

  const previousIterations = useMemo(
    () => (session?.iterations ? session.iterations.slice(0, -1) : []),
    [session?.iterations]
  );

  const bestIteration = useMemo(() => {
    if (!session?.iterations.length) return null;
    return session.iterations.reduce((best, it) =>
      it.qualityScore.combinedScore > best.qualityScore.combinedScore ? it : best
    );
  }, [session?.iterations]);

  // Update status helper
  const updateStatus = useCallback(
    (newStatus: RefinementSessionStatus) => {
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, status: newStatus };
      });
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  // Start a new session
  const startSession = useCallback(
    (referenceImageUrl: string, initialParams?: LayoutParameters) => {
      const newSession: RefinementSession = {
        sessionId: generateSessionId(),
        referenceImageUrl,
        iterations: [],
        status: 'running',
        targetScore,
        baselineScore: 0, // Will be set after first iteration
        maxIterations,
        startedAt: new Date().toISOString(),
        accumulatedFeedback: [],
      };

      setSession(newSession);
      onStatusChange?.('running');

      // Return initial parameters
      return initialParams ?? getDefaultParameters(layoutType);
    },
    [targetScore, maxIterations, layoutType, onStatusChange]
  );

  // End session (approve current result)
  const endSession = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'completed',
        endedAt: new Date().toISOString(),
      };
    });
    onStatusChange?.('completed');
  }, [onStatusChange]);

  // Stop session (abort)
  const stopSession = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'stopped',
        endedAt: new Date().toISOString(),
      };
    });
    onStatusChange?.('stopped');
  }, [onStatusChange]);

  // Start a new iteration
  const startIteration = useCallback((_params: LayoutParameters) => {
    setIsProcessing(true);
    updateStatus('running');
  }, [updateStatus]);

  // Complete an iteration
  const completeIteration = useCallback(
    (result: Omit<RefinementIteration, 'iterationNumber' | 'improved' | 'improvementDelta'>) => {
      setSession((prev) => {
        if (!prev) return prev;

        const iterationNumber = prev.iterations.length + 1;
        const previousScore =
          prev.iterations.length > 0
            ? prev.iterations[prev.iterations.length - 1].qualityScore.combinedScore
            : prev.baselineScore;

        const improved = result.qualityScore.combinedScore > previousScore;
        const improvementDelta = result.qualityScore.combinedScore - previousScore;

        const newIteration: RefinementIteration = {
          ...result,
          iterationNumber,
          improved,
          improvementDelta,
        };

        // Update baseline on first iteration
        const newBaselineScore =
          iterationNumber === 1 ? result.qualityScore.combinedScore : prev.baselineScore;

        const newIterations = [...prev.iterations, newIteration];

        // Check if target reached or max iterations
        let newStatus: RefinementSessionStatus = 'awaiting_feedback';
        if (result.qualityScore.combinedScore >= prev.targetScore) {
          newStatus = 'completed';
        } else if (newIterations.length >= prev.maxIterations) {
          newStatus = 'stopped';
        }

        onIterationComplete?.(newIteration);

        return {
          ...prev,
          iterations: newIterations,
          baselineScore: newBaselineScore,
          status: newStatus,
          endedAt: newStatus === 'completed' || newStatus === 'stopped' ? new Date().toISOString() : undefined,
        };
      });

      setIsProcessing(false);
    },
    [onIterationComplete]
  );

  // Submit feedback
  const submitFeedback = useCallback(
    (feedback: HumanFeedback): FeedbackTranslationResult => {
      // Get current parameters
      const currentParams = currentIteration?.parameters ?? getDefaultParameters(layoutType);

      // Translate feedback to parameter suggestions
      const result = translateFeedback(feedback, currentParams, layoutType);

      // Add feedback to accumulated list
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          accumulatedFeedback: [...prev.accumulatedFeedback, { ...feedback, timestamp: new Date().toISOString() }],
        };
      });

      return result;
    },
    [currentIteration?.parameters, layoutType]
  );

  // Get suggested parameters based on all accumulated feedback
  const getSuggestedParameters = useCallback((): LayoutParameters => {
    const currentParams = currentIteration?.parameters ?? getDefaultParameters(layoutType);

    if (!session?.accumulatedFeedback.length) {
      return currentParams;
    }

    const result = translateAccumulatedFeedback(
      session.accumulatedFeedback,
      currentParams,
      layoutType
    );

    return applyParameterSuggestions(currentParams, result.suggestions);
  }, [session?.accumulatedFeedback, currentIteration?.parameters, layoutType]);

  // Revert to a previous iteration
  const revertToIteration = useCallback(
    (iterationNumber: number) => {
      setSession((prev) => {
        if (!prev) return prev;

        const targetIndex = prev.iterations.findIndex((it) => it.iterationNumber === iterationNumber);
        if (targetIndex === -1) return prev;

        // Keep iterations up to and including the target
        const newIterations = prev.iterations.slice(0, targetIndex + 1);

        return {
          ...prev,
          iterations: newIterations,
          status: 'awaiting_feedback',
          // Clear accumulated feedback since we're reverting
          accumulatedFeedback: [],
        };
      });
    },
    []
  );

  // Pause for human feedback
  const pauseForFeedback = useCallback(() => {
    updateStatus('awaiting_feedback');
  }, [updateStatus]);

  // Continue with auto-optimization
  const continueAutoOptimization = useCallback(() => {
    updateStatus('running');
  }, [updateStatus]);

  return {
    session,
    status,
    currentIteration,
    previousIterations,
    bestIteration,
    isProcessing,
    startSession,
    endSession,
    stopSession,
    startIteration,
    completeIteration,
    submitFeedback,
    getSuggestedParameters,
    revertToIteration,
    pauseForFeedback,
    continueAutoOptimization,
  };
}

export default useRefinementSession;
