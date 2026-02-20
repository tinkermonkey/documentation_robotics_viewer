/**
 * SpecViewer Component
 * Displays JSON Schema files in a readable format
 */

import React from 'react'
import { SpecDataResponse, SchemaDefinition } from '../services/embeddedDataLoader'
import { Badge } from 'flowbite-react'
import ExpandableSection from './common/ExpandableSection'
import MetadataGrid, { MetadataItem } from './common/MetadataGrid'

interface SpecViewerProps {
  specData: SpecDataResponse
  selectedSchemaId: string | null
}

const SpecViewer: React.FC<SpecViewerProps> = ({ specData, selectedSchemaId }) => {

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

    const definitions = (schema.definitions || {}) as Record<string, SchemaDefinition>
    const defNames = Object.keys(definitions)

    const schemaMetadata: MetadataItem[] = [
      { label: 'Element Types', value: defNames.length }
    ]

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Schema Header */}
        <section className="mb-8" data-testid="schema-definitions-section">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {typeof schema.title === 'string' ? schema.title : selectedSchemaId}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{typeof schema.description === 'string' ? schema.description : ''}</p>
          <MetadataGrid items={schemaMetadata} columns={3} />

          <div className="mt-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Element Definitions
            </h4>
            <div className="space-y-2">
              {defNames.map(defName => {
                const definition = definitions[defName]

                return (
                  <ExpandableSection
                    key={defName}
                    title={defName}
                    badge={typeof definition.type === 'string' ? definition.type : Array.isArray(definition.type) ? definition.type.join(', ') : 'object'}
                  >
                    {typeof definition.description === 'string' && definition.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {definition.description}
                      </p>
                    )}

                    {definition.properties && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Properties:
                        </h5>
                        <ul className="space-y-2 ml-4">
                          {Object.entries(definition.properties || {}).map(([propName, propSchema]) => {
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
                                  {(definition.required as string[] | undefined)?.includes(propName) && (
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
