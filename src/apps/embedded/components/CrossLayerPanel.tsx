/**
 * CrossLayerPanel Component
 *
 * Top-level wrapper component for cross-layer link visualization controls
 * Combines:
 * - Master toggle switch with edge count badge
 * - Filter panel (target layers and relationship types)
 * - Navigation breadcrumb
 */

import React, { memo, useMemo } from 'react';
import { Badge, ToggleSwitch, Label } from 'flowbite-react';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';
import { useModelStore } from '@/core/stores/modelStore';
import { CrossLayerFilterPanel } from './CrossLayerFilterPanel';
import { CrossLayerBreadcrumb } from './CrossLayerBreadcrumb';

export const CrossLayerPanel: React.FC = memo(() => {
  const model = useModelStore((state) => state.model);
  const visible = useCrossLayerStore((state) => state.visible);
  const toggleVisible = useCrossLayerStore((state) => state.toggleVisible);

  // Calculate total cross-layer edge count
  const totalEdges = useMemo(() => {
    if (!model?.references) return 0;
    return model.references.filter(
      (ref) => ref.source?.layerId && ref.target?.layerId && ref.source.layerId !== ref.target.layerId
    ).length;
  }, [model]);

  // Don't render if there are no cross-layer references
  if (totalEdges === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border-b border-gray-200 dark:border-gray-700" data-testid="cross-layer-panel">
      {/* Master toggle with count badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="cross-layer-visible-toggle"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            Show Cross-Layer Links
          </Label>
          <Badge color="gray" size="sm" data-testid="cross-layer-edge-count">
            {totalEdges}
          </Badge>
        </div>
        <ToggleSwitch
          id="cross-layer-visible-toggle"
          checked={visible}
          onChange={toggleVisible}
          data-testid="cross-layer-toggle"
        />
      </div>

      {/* Filter panel (only visible when toggle is on) */}
      {visible && <CrossLayerFilterPanel />}

      {/* Breadcrumb navigation */}
      <CrossLayerBreadcrumb />
    </div>
  );
});

CrossLayerPanel.displayName = 'CrossLayerPanel';
