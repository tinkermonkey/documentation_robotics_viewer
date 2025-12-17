/**
 * LayerTypesLegend Component
 * Displays a color-coded legend of layer types with element counts
 * Used in Graph view right sidebar
 */

import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { LayerType } from '../../../core/types';
import { getLayerColor, getLayerDisplayName } from '../../../core/utils/layerColors';
import type { MetaModel } from '../../../core/types/model';

export interface LayerTypesLegendProps {
  model: MetaModel;
}

interface LayerTypeInfo {
  name: string;
  color: string;
  count: number;
}

const LayerTypesLegend: React.FC<LayerTypesLegendProps> = ({ model }) => {
  // Count elements per layer
  const layerTypes = useMemo(() => {
    const layerCounts: Record<string, number> = {};

    // Count elements in each layer
    Object.entries(model.layers || {}).forEach(([layerKey, layer]: [string, any]) => {
      layerCounts[layerKey] = layer.elements?.length || 0;
    });

    // Create layer type info array from all LayerType enum values
    const types: LayerTypeInfo[] = Object.values(LayerType).map((layerType) => ({
      name: getLayerDisplayName(layerType),
      color: getLayerColor(layerType, 'primary'),
      count: layerCounts[layerType] || 0,
    }));

    // Filter out layers with 0 elements and sort by count descending
    return types.filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
  }, [model]);

  if (layerTypes.length === 0) {
    return null;
  }

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Info className="w-4 h-4" />
        Layer Types
      </h3>
      <div className="space-y-2">
        {layerTypes.map((layer) => (
          <div key={layer.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-gray-900">{layer.name}</span>
            </div>
            <span className="text-gray-500 text-xs">{layer.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerTypesLegend;
