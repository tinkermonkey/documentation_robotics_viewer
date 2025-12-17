/**
 * ModelLayersSidebar Component
 * Simple layer list for selection (no visibility controls)
 * Matches design prototype pattern
 */

import React, { useMemo } from 'react';
import { useModelStore } from '../../../core/stores/modelStore';
import { getLayerColor } from '../../../core/utils/layerColors';

interface ModelLayersSidebarProps {
  selectedLayerId?: string | null;
  onSelectLayer?: (layerId: string | null) => void;
}

const ModelLayersSidebar: React.FC<ModelLayersSidebarProps> = ({
  selectedLayerId = null,
  onSelectLayer = () => {}
}) => {
  const { model } = useModelStore();

  // Extract layer information from model
  const layerInfo = useMemo(() => {
    if (!model?.layers) return [];

    return Object.values(model.layers)
      .map(layer => ({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        count: layer.elements?.length || 0,
        order: layer.order || 999
      }))
      .sort((a, b) => a.order - b.order);
  }, [model]);

  if (!model) {
    return null;
  }

  return (
    <div className="p-4" data-testid="model-layers-sidebar">
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
        Model Layers
      </h3>
      <div className="space-y-1">
        {layerInfo.map((layer) => {
          const layerColor = getLayerColor(layer.type, 'primary');
          const isSelected = selectedLayerId === layer.type;

          return (
            <button
              key={layer.id}
              onClick={() => onSelectLayer(isSelected ? null : layer.type)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              data-testid={`layer-item-${layer.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: layerColor }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium truncate">{layer.name}</span>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                  {layer.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModelLayersSidebar;
