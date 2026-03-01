import type { SpecDataResponse, SchemaDefinition } from '../services/embeddedDataLoader';
import { isLayerSchema, sortLayerSchemas } from '../services/specGraphBuilder';
import { getLayerColor } from '../../../core/utils/layerColors';

export interface LayerBrowserSidebarProps {
  specData: SpecDataResponse | null;
  selectedId: string | null;
  onSelectLayer: (id: string | null) => void;
  getCount?: (schemaId: string) => number;
}

function getSchemaLabel(schemaId: string, schema: Record<string, unknown>): string {
  // CLI v0.8.1: layer name lives inside schema.layer.name
  const layerName = (schema.layer as Record<string, unknown> | undefined)?.name;
  if (typeof layerName === 'string' && layerName) return layerName;
  // Flat title field
  if (typeof schema.title === 'string' && schema.title) return schema.title;
  // Fallback: derive from schema ID
  const parts = schemaId.split('/');
  return parts[parts.length - 1].replace(/\.json$/, '');
}

const LayerBrowserSidebar = ({
  specData,
  selectedId,
  onSelectLayer,
  getCount,
}: LayerBrowserSidebarProps) => {
  if (!specData) return null;

  const allEntries = Object.entries(specData.schemas || {}) as [string, SchemaDefinition][];
  const layerEntries = sortLayerSchemas(allEntries.filter(([, schema]) => isLayerSchema(schema)));

  return (
    <div className="p-4" data-testid="layer-browser-sidebar">
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
        Layers
      </h3>
      <div className="space-y-1">
        {layerEntries.map(([schemaId, schema]) => {
          const isSelected = selectedId === schemaId;
          const label = getSchemaLabel(schemaId, schema as Record<string, unknown>);
          const layerColor = getLayerColor(schemaId, 'primary');
          const count = getCount?.(schemaId);

          return (
            <button
              key={schemaId}
              onClick={() => onSelectLayer(isSelected ? null : schemaId)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              data-testid={`layer-item-${schemaId}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: layerColor }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium truncate">{label}</span>
                </div>
                {count !== undefined && count > 0 && (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LayerBrowserSidebar;
