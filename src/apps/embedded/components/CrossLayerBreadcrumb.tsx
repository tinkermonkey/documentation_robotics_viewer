/**
 * CrossLayerBreadcrumb Component
 *
 * Displays navigation path when traversing cross-layer links
 * Format: {layer-name} / {element-name} with arrow separators
 * Shows last 5 navigation steps, oldest collapse when limit reached
 * Click breadcrumb item to navigate to that layer/element combination
 */

import { memo, useMemo } from 'react';
import { Button } from 'flowbite-react';
import { X } from 'lucide-react';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';
import { useNavigate } from '@tanstack/react-router';

export const CrossLayerBreadcrumb = memo(() => {
  const navigationHistory = useCrossLayerStore((state) => state.navigationHistory);
  const clearNavigationHistory = useCrossLayerStore((state) => state.clearNavigationHistory);
  const setLastError = useCrossLayerStore((state) => state.setLastError);
  const navigate = useNavigate();

  // Don't render if no navigation history
  if (!navigationHistory || navigationHistory.length === 0) {
    return null;
  }

  /**
   * Show last 5 navigation steps (most recent at the end)
   */
  const visibleSteps = useMemo(
    () => navigationHistory.slice(-5),
    [navigationHistory]
  );

  /**
   * Handle breadcrumb item click to navigate to that step
   */
  const handleBreadcrumbClick = async (stepIndex: number) => {
    const targetStep = visibleSteps[stepIndex];
    if (!targetStep) return;

    try {
      // Validate target layer
      if (!targetStep.layerId || !targetStep.elementId) {
        throw new Error('Invalid navigation target: missing layer or element ID');
      }

      // Normalize layer ID to lowercase for route
      const normalizedLayerId = targetStep.layerId.toLowerCase();

      // Navigate to target layer with element selection
      await navigate({
        to: `/${normalizedLayerId}`,
        search: (prev: any) => ({
          ...prev,
          selectedElement: targetStep.elementId,
        }),
      });

      // In a real implementation, you would also truncate the history at this point
      // For now, the breadcrumb just shows navigation, the store tracks full history
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log error for debugging
      console.error('Breadcrumb navigation failed:', {
        targetLayer: targetStep?.layerId,
        targetElement: targetStep?.elementId,
        error: errorMessage,
      });

      // Store error for UI to display via error state
      setLastError({
        message: `Failed to navigate to ${targetStep?.elementName}: ${errorMessage}`,
        timestamp: Date.now(),
        type: 'navigation_failed',
        targetElement: targetStep?.elementName,
      });
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-2 px-2 py-2 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto"
      data-testid="cross-layer-breadcrumb"
    >
      {/* Breadcrumb trail */}
      <div className="flex items-center gap-1 shrink-0 min-w-0 flex-1">
        {visibleSteps.map((step, index) => {
          const isLast = index === visibleSteps.length - 1;
          const displayLabel = `${step.layerId} / ${step.elementName}`;

          return (
            <div
              key={step.timestamp}
              className="flex items-center gap-1 shrink-0"
            >
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`text-xs ${
                  isLast
                    ? 'font-semibold text-gray-900 dark:text-white cursor-default'
                    : 'hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer'
                }`}
                data-testid={`breadcrumb-step-${index}`}
                title={displayLabel}
              >
                {displayLabel}
              </button>
              {!isLast && (
                <span className="text-gray-400 shrink-0">→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Clear button */}
      {navigationHistory.length > 0 && (
        <Button
          color="gray"
          size="xs"
          pill
          onClick={clearNavigationHistory}
          title="Clear navigation history"
          data-testid="clear-breadcrumb-btn"
          className="shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});

CrossLayerBreadcrumb.displayName = 'CrossLayerBreadcrumb';
