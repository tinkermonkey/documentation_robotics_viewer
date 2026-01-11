// @ts-nocheck
/**
 * Parameter Adjustment Panel Component
 *
 * Provides real-time parameter adjustment UI with live preview capabilities.
 * Features:
 * - Live parameter sliders with debounced recalculation
 * - Real-time quality score updates
 * - Manual parameter override controls
 * - Parameter locking mechanism
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LayoutParameters } from '../../../../core/services/refinement/layoutParameters';
import { DiagramType } from '../../../../core/services/refinement/layoutParameters';

/**
 * Parameter definition for UI rendering
 */
interface ParameterDefinition {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  description?: string;
}

/**
 * Parameter state with lock status
 */
interface ParameterState {
  value: number;
  locked: boolean;
  userOverridden: boolean;
}

export interface ParameterAdjustmentPanelProps {
  /** Current diagram type (for quality scoring) */
  diagramType?: DiagramType;
  /** Current layout engine (for parameter definitions) */
  layoutEngine?: 'd3-force' | 'elk' | 'graphviz' | 'dagre';
  /** Current parameters */
  currentParameters: Record<string, any>;
  /** Current quality score (0-1) */
  currentScore: number;
  /** Callback when parameters change */
  onParametersChange: (parameters: Record<string, any>) => void;
  /** Callback when preview is requested */
  onPreviewRequest?: (parameters: Record<string, any>) => void;
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
  /** Whether the panel is disabled */
  disabled?: boolean;
}

/**
 * Get parameter definitions based on layout engine
 */
function getParameterDefinitions(layoutEngine?: string): ParameterDefinition[] {
  // D3 Force-Directed parameters
  if (layoutEngine === 'd3-force') {
    return [
      {
        key: 'strength',
        label: 'Repulsion Force',
        min: -1000,
        max: -50,
        step: 10,
        defaultValue: -300,
        description: 'Strength of repulsion between nodes',
      },
      {
        key: 'distance',
        label: 'Link Distance',
        min: 50,
        max: 500,
        step: 10,
        defaultValue: 150,
        unit: 'px',
        description: 'Target distance between connected nodes',
      },
      {
        key: 'iterations',
        label: 'Simulation Iterations',
        min: 50,
        max: 500,
        step: 10,
        defaultValue: 300,
        description: 'Number of force simulation iterations',
      },
    ];
  }

  // ELK Orthogonal parameters
  if (layoutEngine === 'elk') {
    return [
      {
        key: 'nodeSpacing',
        label: 'Node Spacing',
        min: 30,
        max: 200,
        step: 5,
        defaultValue: 100,
        unit: 'px',
        description: 'Horizontal spacing between nodes',
      },
      {
        key: 'layerSpacing',
        label: 'Layer Spacing',
        min: 50,
        max: 300,
        step: 10,
        defaultValue: 150,
        unit: 'px',
        description: 'Vertical spacing between layers',
      },
      {
        key: 'edgeSpacing',
        label: 'Edge Spacing',
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 30,
        unit: 'px',
        description: 'Spacing between parallel edges',
      },
    ];
  }

  // Graphviz parameters
  if (layoutEngine === 'graphviz') {
    return [
      {
        key: 'nodesep',
        label: 'Node Spacing',
        min: 0.1,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.0,
        description: 'Horizontal spacing between nodes',
      },
      {
        key: 'ranksep',
        label: 'Rank Spacing',
        min: 0.1,
        max: 5.0,
        step: 0.1,
        defaultValue: 1.5,
        description: 'Vertical spacing between ranks',
      },
    ];
  }

  // Dagre parameters
  if (layoutEngine === 'dagre') {
    return [
      {
        key: 'nodesep',
        label: 'Node Spacing',
        min: 20,
        max: 200,
        step: 5,
        defaultValue: 50,
        unit: 'px',
        description: 'Horizontal spacing between nodes',
      },
      {
        key: 'ranksep',
        label: 'Rank Spacing',
        min: 20,
        max: 200,
        step: 5,
        defaultValue: 50,
        unit: 'px',
        description: 'Vertical spacing between ranks',
      },
    ];
  }

  // Default fallback - return empty array
  return [];
}

export const ParameterAdjustmentPanel: React.FC<ParameterAdjustmentPanelProps> = ({
  diagramType,
  layoutEngine,
  currentParameters,
  currentScore,
  onParametersChange,
  onPreviewRequest,
  debounceMs = 500,
  disabled = false,
}) => {
  const parameterDefinitions = useMemo(
    () => getParameterDefinitions(layoutEngine),
    [layoutEngine]
  );

  // Initialize parameter states
  const [parameterStates, setParameterStates] = useState<Record<string, ParameterState>>(() => {
    const states: Record<string, ParameterState> = {};
    parameterDefinitions.forEach((def) => {
      states[def.key] = {
        value: currentParameters[def.key] ?? def.defaultValue,
        locked: false,
        userOverridden: false,
      };
    });
    return states;
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Reset parameter states when layout engine/parameter definitions change
  // Only reset when the parameter definitions change (layout engine change), not when values change
  useEffect(() => {
    // Cancel any pending parameter updates
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }

    const newStates: Record<string, ParameterState> = {};
    parameterDefinitions.forEach((def) => {
      newStates[def.key] = {
        value: currentParameters[def.key] ?? def.defaultValue,
        locked: false,
        userOverridden: false,
      };
    });
    setParameterStates(newStates);
  }, [parameterDefinitions]); // Remove currentParameters from dependencies to avoid reset loops

  // Calculate quality score percentage
  const scorePercentage = useMemo(() => {
    return (currentScore * 100).toFixed(1);
  }, [currentScore]);

  // Get quality tier for color coding
  const qualityTier = useMemo(() => {
    if (currentScore >= 0.9) return 'excellent';
    if (currentScore >= 0.8) return 'good';
    if (currentScore >= 0.7) return 'acceptable';
    if (currentScore >= 0.5) return 'poor';
    return 'unacceptable';
  }, [currentScore]);

  // Handle parameter value change
  const handleParameterChange = useCallback(
    (key: string, value: number) => {
      setParameterStates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          value,
          userOverridden: true,
        },
      }));

      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new debounced timer for parameter change callback
      const timer = setTimeout(() => {
        const newParameters = { ...currentParameters };
        let hasInvalidValue = false;

        Object.entries(parameterStates).forEach(([k, state]) => {
          const paramValue = k === key ? value : state?.value;

          // Validate the value
          if (paramValue === undefined || (typeof paramValue === 'number' && (isNaN(paramValue) || !isFinite(paramValue)))) {
            console.warn(`[ParameterAdjustmentPanel] Invalid parameter value for ${k}: ${paramValue}`);
            hasInvalidValue = true;
            return;
          }

          newParameters[k] = paramValue;
        });

        // Only call callbacks if all parameters are valid
        if (!hasInvalidValue && Object.keys(newParameters).length > 0) {
          onParametersChange(newParameters);
          onPreviewRequest?.(newParameters);
        }
      }, debounceMs);

      setDebounceTimer(timer);
    },
    [currentParameters, parameterStates, debounceMs, debounceTimer, onParametersChange, onPreviewRequest]
  );

  // Handle parameter lock toggle
  const handleLockToggle = useCallback((key: string) => {
    setParameterStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        locked: !prev[key].locked,
      },
    }));
  }, []);

  // Handle parameter reset
  const handleReset = useCallback(
    (key: string) => {
      const definition = parameterDefinitions.find((def) => def.key === key);
      if (!definition) return;

      setParameterStates((prev) => ({
        ...prev,
        [key]: {
          value: definition.defaultValue,
          locked: false,
          userOverridden: false,
        },
      }));

      const newParameters = { ...currentParameters, [key]: definition.defaultValue };
      onParametersChange(newParameters);
    },
    [parameterDefinitions, currentParameters, onParametersChange]
  );

  // Handle reset all
  const handleResetAll = useCallback(() => {
    const newStates: Record<string, ParameterState> = {};
    const newParameters = { ...currentParameters };

    parameterDefinitions.forEach((def) => {
      newStates[def.key] = {
        value: def.defaultValue,
        locked: false,
        userOverridden: false,
      };
      newParameters[def.key] = def.defaultValue;
    });

    setParameterStates(newStates);
    onParametersChange(newParameters);
  }, [parameterDefinitions, currentParameters, onParametersChange]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div
      className="parameter-adjustment-panel bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
      data-testid="parameter-adjustment-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Parameter Adjustment
        </h3>
        <button
          onClick={handleResetAll}
          disabled={disabled}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          aria-label="Reset all parameters to defaults"
        >
          Reset All
        </button>
      </div>

      {/* Quality Score Display */}
      <div
        className="quality-score-display mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
        aria-label="Current quality score"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Quality Score</span>
          <span
            className={`text-2xl font-bold ${
              qualityTier === 'excellent'
                ? 'text-green-600 dark:text-green-400'
                : qualityTier === 'good'
                  ? 'text-blue-600 dark:text-blue-400'
                  : qualityTier === 'acceptable'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : qualityTier === 'poor'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-red-600 dark:text-red-400'
            }`}
            data-tier={qualityTier}
          >
            {scorePercentage}%
          </span>
        </div>
      </div>

      {/* Parameter Controls */}
      <div className="parameter-controls space-y-4">
        {parameterDefinitions.map((definition) => {
          const state = parameterStates[definition.key];
          if (!state) return null;

          return (
            <div
              key={definition.key}
              className="parameter-control"
              data-testid={`parameter-${definition.key}`}
            >
              {/* Parameter Label and Controls */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`param-${definition.key}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {definition.label}
                  </label>
                  {state.userOverridden && (
                    <span
                      className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded"
                      title="User overridden"
                    >
                      Override
                    </span>
                  )}
                  {state.locked && (
                    <span
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded"
                      title="Locked from automatic adjustment"
                    >
                      Locked
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {state.value}
                    {definition.unit}
                  </span>
                  <button
                    onClick={() => handleLockToggle(definition.key)}
                    disabled={disabled}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                    aria-label={state.locked ? 'Unlock parameter' : 'Lock parameter'}
                    title={state.locked ? 'Unlock parameter' : 'Lock parameter'}
                  >
                    {state.locked ? '🔒' : '🔓'}
                  </button>
                  <button
                    onClick={() => handleReset(definition.key)}
                    disabled={disabled}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs disabled:opacity-50"
                    aria-label="Reset parameter to default"
                    title="Reset to default"
                  >
                    ↺
                  </button>
                </div>
              </div>

              {/* Slider */}
              <input
                id={`param-${definition.key}`}
                type="range"
                min={definition.min}
                max={definition.max}
                step={definition.step}
                value={state.value}
                onChange={(e) => handleParameterChange(definition.key, parseFloat(e.target.value))}
                disabled={disabled || state.locked}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`${definition.label} slider`}
              />

              {/* Range Labels */}
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>
                  {definition.min}
                  {definition.unit}
                </span>
                <span>
                  {definition.max}
                  {definition.unit}
                </span>
              </div>

              {/* Description */}
              {definition.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {definition.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="help-text mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 Tip: Adjust parameters in real-time to see quality score updates. Lock parameters to
          prevent automatic adjustments during optimization.
        </p>
      </div>
    </div>
  );
};

export default ParameterAdjustmentPanel;
