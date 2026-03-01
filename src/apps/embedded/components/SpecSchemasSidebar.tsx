import React from 'react';
import type { SpecDataResponse, SchemaDefinition } from '../services/embeddedDataLoader';
import { isLayerSchema, sortLayerSchemas } from '../services/specGraphBuilder';

interface SpecSchemasSidebarProps {
  specData: SpecDataResponse;
  selectedSchemaId: string | null;
  onSelectSchema: (schemaId: string | null) => void;
}

const SCHEMA_META_KEYS = new Set([
  '$schema', '$id', 'title', 'description', 'type', 'allOf', 'anyOf',
  'oneOf', 'not', 'definitions', '$defs', 'required', 'additionalProperties',
  'properties', 'examples', 'if', 'then', 'else'
]);

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

const SpecSchemasSidebar: React.FC<SpecSchemasSidebarProps> = ({
  specData,
  selectedSchemaId,
  onSelectSchema,
}) => {
  const allEntries = Object.entries(specData.schemas || {}) as [string, SchemaDefinition][];
  const schemaEntries = sortLayerSchemas(allEntries.filter(([, schema]) => isLayerSchema(schema)));

  return (
    <div className="p-4" data-testid="spec-schemas-sidebar">
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
        Schemas
      </h3>
      <div className="space-y-1">
        {schemaEntries.map(([schemaId, schema]) => {
          const isSelected = selectedSchemaId === schemaId;
          const label = getSchemaLabel(schemaId, schema as Record<string, unknown>);
          // CLI v0.8.1: element types live inside nodeSchemas
          const nodeSchemas = schema.nodeSchemas as Record<string, unknown> | undefined;
          const flatCount = nodeSchemas
            ? Object.keys(nodeSchemas).length
            : Object.keys(schema).filter(k => !SCHEMA_META_KEYS.has(k) && typeof schema[k as keyof typeof schema] === 'object').length;
          const defCount = flatCount || Object.keys((schema.definitions || schema.$defs || {}) as Record<string, unknown>).length;

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
                <span className="text-sm font-medium truncate">{label}</span>
                {defCount > 0 && (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                    {defCount}
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

export default SpecSchemasSidebar;
