/**
 * CrossLayerBreadcrumb Component
 *
 * Displays navigation path when traversing cross-layer links
 * Shows: Root > Source Layer > Source Element > Target Layer > Target Element
 * Includes breadcrumb navigation and clear button
 */

import { memo } from 'react';
import { Breadcrumb, BreadcrumbItem, Badge, Button } from 'flowbite-react';
import { HiHome, HiX } from 'react-icons/hi';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';
import { useModelStore } from '@/core/stores/modelStore';

export const CrossLayerBreadcrumb = memo(() => {
  const navigationHistory = useCrossLayerStore((state) => state.navigationHistory);
  const clearNavigationHistory = useCrossLayerStore((state) => state.clearNavigationHistory);
  const model = useModelStore((state) => state.model);

  // Don't render if no navigation history
  if (!navigationHistory || navigationHistory.length === 0) {
    return null;
  }

  /**
   * Build breadcrumb segments from navigation history
   */
  const segments = navigationHistory.map((step) => {
    // Get the layer name
    const layer = model?.layers?.[step.layerId];
    const layerName = layer?.name || step.layerId;

    return {
      id: step.elementId,
      label: step.elementName,
      layerName,
      timestamp: step.timestamp,
    };
  });

  return (
    <div
      className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      data-testid="cross-layer-breadcrumb"
    >
      <Breadcrumb aria-label="Cross-layer navigation breadcrumb">
        <BreadcrumbItem icon={HiHome} data-testid="breadcrumb-home">
          Root
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const isLast = index === 0;

          return (
            <BreadcrumbItem
              key={segment.id}
              data-testid={`breadcrumb-item-${segment.id}`}
              className={isLast ? 'cursor-default' : 'cursor-pointer'}
            >
              <span className="flex items-center gap-2">
                <Badge color="purple" size="xs" data-testid={`breadcrumb-layer-${segment.layerName}`}>
                  {segment.layerName}
                </Badge>
                <span className={isLast ? 'font-semibold' : ''} data-testid={`breadcrumb-label-${segment.id}`}>
                  {segment.label}
                </span>
              </span>
            </BreadcrumbItem>
          );
        })}
      </Breadcrumb>

      {/* Clear button */}
      <Button
        color="gray"
        size="xs"
        pill
        onClick={clearNavigationHistory}
        title="Clear navigation history"
        data-testid="clear-breadcrumb-btn"
      >
        <HiX className="h-3 w-3" />
      </Button>
    </div>
  );
});

CrossLayerBreadcrumb.displayName = 'CrossLayerBreadcrumb';
