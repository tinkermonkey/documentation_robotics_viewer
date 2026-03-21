/**
 * SpecViewer Component
 * Displays Spec Schema files in a readable format
 */

import React from 'react'
import { SpecDataResponse, SchemaDefinition } from '../services/embeddedDataLoader'
import { Badge, Table, TableBody, TableCell, TableRow } from 'flowbite-react'
import ExpandableSection from './common/ExpandableSection'
import MetadataGrid, { MetadataItem } from './common/MetadataGrid'
import { useModelStore } from '../../../core/stores/modelStore'

interface SpecViewerProps {
  specData: SpecDataResponse
  selectedSchemaId: string | null
}

const SpecViewer: React.FC<SpecViewerProps> = ({ specData, selectedSchemaId }) => {
  const { specSchemas } = useModelStore();

  if (!specData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No spec data loaded</p>
      </div>
    )
  }

  if (!specData.schemas) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No schemas found in spec data</p>
      </div>
    )
  }

  const schemas = specData.schemas || {}

  // Render relationship schemas for a given layer
  const renderRelationshipSchemas = (layerId: string) => {
    const specSchemaData = specSchemas[layerId];
    const relationshipSchemas = specSchemaData?.relationshipSchemas ?? [];

    if (relationshipSchemas.length === 0) {
      return null;
    }

    // Group relationships by sourceSpecNodeId
    const relsBySourceType = relationshipSchemas.reduce(
      (acc: Record<string, typeof relationshipSchemas>, rel) => {
        const sourceKey = rel.sourceSpecNodeId;
        if (!acc[sourceKey]) {
          acc[sourceKey] = [];
        }
        acc[sourceKey].push(rel);
        return acc;
      },
      {}
    );

    return (
      <section className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8" data-testid="relationship-schemas-section">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Valid Relationships
        </h3>

        <div className="space-y-4">
          {Object.entries(relsBySourceType).map(([sourceNodeId, rels]) => {
            // Extract just the node type name from the full ID (e.g., "motivation.Goal" -> "Goal")
            const nodeTypeName = sourceNodeId.includes('.')
              ? sourceNodeId.split('.').pop()
              : sourceNodeId;

            return (
              <div
                key={sourceNodeId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                data-testid={`relationship-schemas-${sourceNodeId}`}
              >
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {nodeTypeName}
                  </h4>
                </div>

                <Table className="text-sm">
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {rels.map((rel) => {
                      // Extract destination node type name
                      const destNodeTypeName = rel.destinationSpecNodeId.includes('.')
                        ? rel.destinationSpecNodeId.split('.').pop()
                        : rel.destinationSpecNodeId;

                      return (
                        <TableRow
                          key={rel.id}
                          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          data-testid={`relationship-row-${rel.id}`}
                        >
                          <TableCell className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                            {rel.predicate}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {destNodeTypeName}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge color="gray" size="sm">
                              {rel.cardinality}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {rel.strength && (
                              <Badge color="info" size="sm">
                                {rel.strength}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            {rel.required && (
                              <Badge color="failure" size="sm">
                                Required
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // Render schema definitions view
  const renderMergedView = () => {
    if (!selectedSchemaId) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Select a schema to view details</p>
        </div>
      )
    }

    const schema = schemas[selectedSchemaId]
    if (!schema) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Schema not found</p>
        </div>
      )
    }

    // Support both DR CLI format (nodeSchemas + layer) and standard Spec Schema (definitions)
    const layer = schema.layer as { id?: string; name?: string; description?: string } | undefined
    const nodeSchemas = schema.nodeSchemas as Record<string, SchemaDefinition> | undefined
    const definitions = nodeSchemas || (schema.definitions as Record<string, SchemaDefinition> | undefined) || {}
    const defNames = Object.keys(definitions)

    const displayTitle = layer?.name || (typeof schema.title === 'string' ? schema.title : null) || selectedSchemaId
    const displayDescription = layer?.description || (typeof schema.description === 'string' ? schema.description : '')

    // Get layer ID from schema.layer.id or find it from specSchemas
    const layerId = layer?.id || Object.keys(specSchemas).find(schemaKey => {
      const schemaData = specSchemas[schemaKey];
      return schemaData?.layer?.name?.toLowerCase() === layer?.name?.toLowerCase() ||
             schemaData?.layer?.id?.toLowerCase() === layer?.id?.toLowerCase();
    });

    const schemaMetadata: MetadataItem[] = [
      { label: 'Element Types', value: defNames.length }
    ]

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Schema Header */}
        <section className="mb-8" data-testid="schema-definitions-section">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {displayTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{displayDescription}</p>
          <MetadataGrid items={schemaMetadata} columns={3} />

          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Element Definitions
            </h3>
            <div className="space-y-2">
              {defNames.map(defName => {
                const definition = definitions[defName]
                // For DR CLI nodeSchemas, the user-visible attributes are under properties.attributes.properties
                const attrProperties = (definition.properties?.attributes as SchemaDefinition | undefined)?.properties
                const visibleProperties = attrProperties || definition.properties
                const requiredAttrs = (definition.properties?.attributes as SchemaDefinition | undefined)?.required as string[] | undefined
                  || definition.required

                return (
                  <ExpandableSection
                    key={defName}
                    title={typeof definition.title === 'string' ? definition.title : defName}
                    badge={typeof definition.type === 'string' ? definition.type : 'object'}
                  >
                    {typeof definition.description === 'string' && definition.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {definition.description}
                      </p>
                    )}

                    {visibleProperties && Object.keys(visibleProperties).length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Properties:
                        </h5>
                        <ul className="space-y-2 ml-4">
                          {Object.entries(visibleProperties).map(([propName, propSchema]) => {
                            const prop = propSchema as SchemaDefinition
                            return (
                              <li key={propName} className="text-sm">
                                <div className="flex items-start gap-2">
                                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-900 dark:text-white">
                                    {propName}
                                  </code>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {typeof prop.type === 'string' ? prop.type : Array.isArray(prop.type) ? prop.type.join(', ') : 'object'}
                                    {typeof prop.format === 'string' && prop.format && ` (${prop.format})`}
                                  </span>
                                  {requiredAttrs?.includes(propName) && (
                                    <Badge color="failure" size="xs">required</Badge>
                                  )}
                                  {typeof prop.description === 'string' && prop.description && (
                                    <p className="text-gray-600 dark:text-gray-400 ml-2">
                                      {prop.description}
                                    </p>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </ExpandableSection>
                )
              })}
            </div>
          </div>

          {/* Relationship Schemas Section */}
          {layerId && renderRelationshipSchemas(layerId)}
        </section>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden" data-testid="spec-viewer">
      {renderMergedView()}
    </div>
  )
}

export default SpecViewer
