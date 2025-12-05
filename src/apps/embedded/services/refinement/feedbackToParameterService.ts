/**
 * Feedback to Parameter Service
 *
 * Translates human feedback into concrete parameter adjustment suggestions.
 * Supports force-directed and hierarchical layout parameters with intensity scaling.
 */

import {
  HumanFeedback,
  FeedbackAspect,
  FeedbackDirection,
  FeedbackIntensity,
  LayoutParameters,
  ForceDirectedParameters,
  HierarchicalParameters,
  ParameterSuggestion,
  FeedbackTranslationResult,
} from '../../types/refinement';

/**
 * Parameter ranges for validation and clamping
 */
export interface ParameterRange {
  min: number;
  max: number;
  default: number;
}

/**
 * All parameter ranges
 */
export const PARAMETER_RANGES: Record<string, ParameterRange> = {
  // Force-directed parameters
  'forceDirected.chargeStrength': { min: -5000, max: 0, default: -1000 },
  'forceDirected.linkDistance': { min: 50, max: 500, default: 150 },
  'forceDirected.centerForce': { min: 0, max: 1, default: 0.5 },
  'forceDirected.iterations': { min: 50, max: 500, default: 300 },
  // Hierarchical parameters
  'hierarchical.nodeSpacing': { min: 50, max: 200, default: 100 },
  'hierarchical.rankSpacing': { min: 80, max: 300, default: 150 },
};

/**
 * Intensity multipliers for parameter adjustments
 */
const INTENSITY_MULTIPLIERS: Record<FeedbackIntensity, number> = {
  slight: 0.1,
  moderate: 0.25,
  significant: 0.5,
};

/**
 * Mapping of feedback aspects to relevant parameters for force-directed layouts
 */
const FORCE_DIRECTED_ASPECT_MAPPING: Record<
  FeedbackAspect,
  Array<{
    param: keyof ForceDirectedParameters;
    increaseEffect: 'increase' | 'decrease';
    baseDelta: number;
  }>
> = {
  spacing: [
    { param: 'chargeStrength', increaseEffect: 'decrease', baseDelta: 500 }, // More negative = more spacing
    { param: 'linkDistance', increaseEffect: 'increase', baseDelta: 50 },
  ],
  alignment: [
    { param: 'iterations', increaseEffect: 'increase', baseDelta: 50 },
    { param: 'centerForce', increaseEffect: 'increase', baseDelta: 0.1 },
  ],
  grouping: [
    { param: 'chargeStrength', increaseEffect: 'increase', baseDelta: 300 }, // Less negative = tighter
    { param: 'linkDistance', increaseEffect: 'decrease', baseDelta: 30 },
  ],
  routing: [
    { param: 'iterations', increaseEffect: 'increase', baseDelta: 100 },
  ],
  overall: [
    { param: 'chargeStrength', increaseEffect: 'decrease', baseDelta: 200 },
    { param: 'linkDistance', increaseEffect: 'increase', baseDelta: 25 },
    { param: 'iterations', increaseEffect: 'increase', baseDelta: 50 },
  ],
};

/**
 * Mapping of feedback aspects to relevant parameters for hierarchical layouts
 */
const HIERARCHICAL_ASPECT_MAPPING: Record<
  FeedbackAspect,
  Array<{
    param: keyof HierarchicalParameters;
    increaseEffect: 'increase' | 'decrease';
    baseDelta: number;
  }>
> = {
  spacing: [
    { param: 'nodeSpacing', increaseEffect: 'increase', baseDelta: 20 },
    { param: 'rankSpacing', increaseEffect: 'increase', baseDelta: 30 },
  ],
  alignment: [
    { param: 'nodeSpacing', increaseEffect: 'increase', baseDelta: 10 },
  ],
  grouping: [
    { param: 'nodeSpacing', increaseEffect: 'decrease', baseDelta: 15 },
    { param: 'rankSpacing', increaseEffect: 'decrease', baseDelta: 20 },
  ],
  routing: [
    { param: 'rankSpacing', increaseEffect: 'increase', baseDelta: 25 },
  ],
  overall: [
    { param: 'nodeSpacing', increaseEffect: 'increase', baseDelta: 15 },
    { param: 'rankSpacing', increaseEffect: 'increase', baseDelta: 20 },
  ],
};

/**
 * Clamp a value to its valid range
 */
function clampValue(paramPath: string, value: number): number {
  const range = PARAMETER_RANGES[paramPath];
  if (!range) return value;
  return Math.max(range.min, Math.min(range.max, value));
}

/**
 * Get current value from parameters by path
 */
function getParameterValue(params: LayoutParameters, path: string): number | undefined {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = params;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return typeof current === 'number' ? current : undefined;
}

/**
 * Set parameter value by path
 */
function setParameterValue(params: LayoutParameters, path: string, value: number): void {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = params;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Generate a human-readable explanation for the feedback translation
 */
function generateExplanation(
  feedback: HumanFeedback,
  suggestions: ParameterSuggestion[]
): string {
  if (feedback.direction === 'acceptable') {
    return `The ${feedback.aspect} is acceptable. No parameter changes needed.`;
  }

  const action = feedback.direction === 'increase' ? 'Increasing' : 'Decreasing';
  const paramNames = suggestions.map((s) => s.parameter.split('.')[1]).join(', ');

  return `${action} ${feedback.aspect} by adjusting: ${paramNames} (${feedback.intensity} adjustment).`;
}

/**
 * Translate a single piece of human feedback into parameter suggestions.
 *
 * @param feedback - Human feedback to translate
 * @param currentParams - Current layout parameters
 * @param layoutType - Type of layout algorithm being used
 * @returns FeedbackTranslationResult with suggestions
 */
export function translateFeedback(
  feedback: HumanFeedback,
  currentParams: LayoutParameters,
  layoutType: 'force-directed' | 'hierarchical' = 'force-directed'
): FeedbackTranslationResult {
  const suggestions: ParameterSuggestion[] = [];

  // Handle "acceptable" direction - no changes needed
  if (feedback.direction === 'acceptable') {
    return {
      suggestions: [],
      overallConfidence: 1.0,
      explanation: generateExplanation(feedback, []),
    };
  }

  const intensityMultiplier = INTENSITY_MULTIPLIERS[feedback.intensity];

  // Choose mapping based on layout type
  const aspectMapping =
    layoutType === 'hierarchical'
      ? HIERARCHICAL_ASPECT_MAPPING
      : FORCE_DIRECTED_ASPECT_MAPPING;

  const paramMappings = aspectMapping[feedback.aspect];
  if (!paramMappings || paramMappings.length === 0) {
    return {
      suggestions: [],
      overallConfidence: 0.5,
      explanation: `No parameter mapping found for ${feedback.aspect} in ${layoutType} layout.`,
    };
  }

  const paramPrefix = layoutType === 'hierarchical' ? 'hierarchical' : 'forceDirected';

  for (const mapping of paramMappings) {
    const paramPath = `${paramPrefix}.${mapping.param}`;
    const currentValue =
      getParameterValue(currentParams, paramPath) ?? PARAMETER_RANGES[paramPath]?.default ?? 0;

    // Calculate delta based on direction and mapping
    let delta = mapping.baseDelta * intensityMultiplier;

    // Adjust direction based on feedback and mapping
    const shouldIncrease =
      (feedback.direction === 'increase' && mapping.increaseEffect === 'increase') ||
      (feedback.direction === 'decrease' && mapping.increaseEffect === 'decrease');

    if (!shouldIncrease) {
      delta = -delta;
    }

    const suggestedValue = clampValue(paramPath, currentValue + delta);

    // Only add suggestion if value actually changes
    if (suggestedValue !== currentValue) {
      suggestions.push({
        parameter: paramPath,
        currentValue,
        suggestedValue,
        confidence: 0.8, // Base confidence for direct mapping
        rationale: `${feedback.direction === 'increase' ? 'Increase' : 'Decrease'} ${feedback.aspect} (${feedback.intensity})`,
      });
    }
  }

  // Calculate overall confidence
  const overallConfidence =
    suggestions.length > 0
      ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
      : 0.5;

  return {
    suggestions,
    overallConfidence,
    explanation: generateExplanation(feedback, suggestions),
  };
}

/**
 * Aggregate multiple feedback items and translate to combined suggestions.
 * More recent feedback has higher weight.
 *
 * @param feedbackItems - Array of feedback items (most recent last)
 * @param currentParams - Current layout parameters
 * @param layoutType - Type of layout algorithm
 * @returns Aggregated FeedbackTranslationResult
 */
export function translateAccumulatedFeedback(
  feedbackItems: HumanFeedback[],
  currentParams: LayoutParameters,
  layoutType: 'force-directed' | 'hierarchical' = 'force-directed'
): FeedbackTranslationResult {
  if (feedbackItems.length === 0) {
    return {
      suggestions: [],
      overallConfidence: 0,
      explanation: 'No feedback to process.',
    };
  }

  // Process each feedback item
  const allSuggestions: Map<string, ParameterSuggestion[]> = new Map();
  const weights: number[] = [];

  // Calculate weights with recency bias
  const totalItems = feedbackItems.length;
  for (let i = 0; i < totalItems; i++) {
    // More recent feedback gets higher weight
    weights.push((i + 1) / totalItems);
  }

  for (let i = 0; i < feedbackItems.length; i++) {
    const result = translateFeedback(feedbackItems[i], currentParams, layoutType);
    const weight = weights[i];

    for (const suggestion of result.suggestions) {
      const existing = allSuggestions.get(suggestion.parameter) || [];
      existing.push({
        ...suggestion,
        confidence: suggestion.confidence * weight,
      });
      allSuggestions.set(suggestion.parameter, existing);
    }
  }

  // Aggregate suggestions for each parameter
  const aggregatedSuggestions: ParameterSuggestion[] = [];

  for (const [param, suggestions] of allSuggestions.entries()) {
    const totalWeight = suggestions.reduce((sum, s) => sum + s.confidence, 0);
    const weightedSum = suggestions.reduce(
      (sum, s) => sum + s.suggestedValue * s.confidence,
      0
    );
    const avgSuggested = totalWeight > 0 ? weightedSum / totalWeight : suggestions[0].suggestedValue;

    const clamped = clampValue(param, avgSuggested);
    const currentValue = suggestions[0].currentValue;

    if (clamped !== currentValue) {
      aggregatedSuggestions.push({
        parameter: param,
        currentValue,
        suggestedValue: clamped,
        confidence: Math.min(1, totalWeight / suggestions.length),
        rationale: suggestions.length > 1
          ? `Combined from ${suggestions.length} feedback items`
          : suggestions[0].rationale,
      });
    }
  }

  const overallConfidence =
    aggregatedSuggestions.length > 0
      ? aggregatedSuggestions.reduce((sum, s) => sum + s.confidence, 0) /
        aggregatedSuggestions.length
      : 0.5;

  const aspectsSummary = [...new Set(feedbackItems.map((f) => f.aspect))].join(', ');

  return {
    suggestions: aggregatedSuggestions,
    overallConfidence,
    explanation: `Aggregated ${feedbackItems.length} feedback items for: ${aspectsSummary}.`,
  };
}

/**
 * Apply parameter suggestions to create updated parameters
 *
 * @param currentParams - Current layout parameters
 * @param suggestions - Suggestions to apply
 * @returns New layout parameters with suggestions applied
 */
export function applyParameterSuggestions(
  currentParams: LayoutParameters,
  suggestions: ParameterSuggestion[]
): LayoutParameters {
  // Deep clone current params
  const newParams: LayoutParameters = JSON.parse(JSON.stringify(currentParams));

  for (const suggestion of suggestions) {
    setParameterValue(newParams, suggestion.parameter, suggestion.suggestedValue);
  }

  return newParams;
}

/**
 * Get default parameters for a layout type
 */
export function getDefaultParameters(
  layoutType: 'force-directed' | 'hierarchical'
): LayoutParameters {
  if (layoutType === 'hierarchical') {
    return {
      hierarchical: {
        nodeSpacing: PARAMETER_RANGES['hierarchical.nodeSpacing'].default,
        rankSpacing: PARAMETER_RANGES['hierarchical.rankSpacing'].default,
        direction: 'TB',
      },
    };
  }

  return {
    forceDirected: {
      chargeStrength: PARAMETER_RANGES['forceDirected.chargeStrength'].default,
      linkDistance: PARAMETER_RANGES['forceDirected.linkDistance'].default,
      centerForce: PARAMETER_RANGES['forceDirected.centerForce'].default,
      iterations: PARAMETER_RANGES['forceDirected.iterations'].default,
    },
  };
}

/**
 * Get parameter ranges for documentation/UI
 */
export function getParameterRanges(): Record<string, ParameterRange> {
  return { ...PARAMETER_RANGES };
}
