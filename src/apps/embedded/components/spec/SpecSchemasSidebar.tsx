/**
 * SpecSchemasSidebar Component
 * Simple schema list for selection
 * Follows the pattern from ModelLayersSidebar
 */

import { SpecDataResponse } from '../../services/embeddedDataLoader';
import { getLayerColor } from '../../../../core/utils/layerColors';

interface SpecSchemasSidebarProps {
  specData: SpecDataResponse;
  selectedSchemaId: string | null;
  onSelectSchema: (schemaId: string | null) => void;
}

const SpecSchemasSidebar: React.FC<SpecSchemasSidebarProps> = ({
  specData,
  selectedSchemaId,
  onSelectSchema
}) => {
  if (!specData?.schemas) {
    return (
      <div className="p-4" data-testid="spec-schemas-sidebar">
        <p className="text-sm text-gray-500 dark:text-gray-400">No schemas available</p>
      </div>
    );
  }

  const schemas = Object.keys(specData.schemas);

  return (
    <div className="p-4" data-testid="spec-schemas-sidebar">
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
        Schema Files
      </h3>
      <div className="space-y-1">
        {schemas.map((schemaId) => {
          const schema = specData.schemas[schemaId];
          const isSelected = selectedSchemaId === schemaId;
          const definitionCount = schema.definitions ? Object.keys(schema.definitions).length : 0;

          // Extract layer name from schema ID (e.g., "01-motivation-layer.schema.json" -> "Motivation")
          const layerName = schemaId
            .replace(/^\d+-/, '')              // Remove number prefix
            .replace(/-layer.*$/, '')          // Remove "-layer" suffix and extension
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

          const layerColor = getLayerColor(layerName, 'primary');

          return (
            <button
              key={schemaId}
              onClick={() => onSelectSchema(isSelected ? null : schemaId)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              data-testid={`schema-item-${schemaId}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: layerColor }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium truncate">
                    {schema.title || schemaId}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                  {definitionCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SpecSchemasSidebar;
