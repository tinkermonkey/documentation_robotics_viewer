/**
 * SpecViewer Component
 * Displays JSON Schema files in a readable format with cross-layer links
 */

import React from 'react';
import { SpecDataResponse, LinkType } from '../services/embeddedDataLoader';
import { Badge } from 'flowbite-react';
import ExpandableSection from './common/ExpandableSection';
import MetadataGrid, { MetadataItem } from './common/MetadataGrid';

interface SpecViewerProps {
  specData: SpecDataResponse;
  selectedSchemaId: string | null;
}

/**
 * Raw JSON Schema property definition
 */
interface RawSchemaProperty {
  type?: string | string[];
  description?: string;
  format?: string;
  [key: string]: unknown;
}

const SpecViewer: React.FC<SpecViewerProps> = ({ specData, selectedSchemaId }) => {

  if (!specData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No spec data loaded</p>
      </div>
    );
  }

  if (!specData.schemas) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No schemas found in spec data</p>
      </div>
    );
  }

  const schemas = specData.schemas || {};

  // Render merged view with schema definitions and cross-layer links
  const renderMergedView = () => {
    if (!selectedSchemaId) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Select a schema to view details</p>
        </div>
      );
    }

    const schema = schemas[selectedSchemaId];
    if (!schema) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Schema not found</p>
        </div>
      );
    }

    const definitions = schema.definitions || {};
    const defNames = Object.keys(definitions);

    const schemaMetadata: MetadataItem[] = [
      { label: '$schema', value: schema.$schema },
      { label: 'Element Types', value: defNames.length }
    ];

    // Get cross-layer links for this schema's layer
    const linkRegistry = specData.linkRegistry;
    const relevantLinks: LinkType[] = [];

    if (linkRegistry && linkRegistry.linkTypes) {
      // Extract layer name from schema ID (e.g., 'business.schema.json' -> 'business')
      const layerName = selectedSchemaId.split('.')[0];

      // Find links where this layer is either source or target
      linkRegistry.linkTypes.forEach((linkType: LinkType) => {
        if (
          linkType.sourceLayers.includes(layerName) ||
          linkType.targetLayer === layerName
        ) {
          relevantLinks.push(linkType);
        }
      });
    }

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Schema Definitions Section */}
        <section className="mb-8" data-testid="schema-definitions-section">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Schema Definitions
          </h3>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {schema.title || selectedSchemaId}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{schema.description}</p>
            <MetadataGrid items={schemaMetadata} columns={2} />
          </div>

          <div className="mt-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Element Type Definitions
            </h4>
            <div className="space-y-2">
              {defNames.map(defName => {
                const definition = definitions[defName];

                return (
                  <ExpandableSection
                    key={defName}
                    title={defName}
                    badge={definition.type}
                  >
                    {definition.description && (
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
                          {Object.entries(definition.properties).map(([propName, propSchema]) => {
                            const prop = propSchema as RawSchemaProperty;
                            return (
                              <li key={propName} className="text-sm">
                                <div className="flex items-start gap-2">
                                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-900 dark:text-white">
                                    {propName}
                                  </code>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {prop.type || 'object'}
                                    {prop.format && ` (${prop.format})`}
                                  </span>
                                  {definition.required?.includes(propName) && (
                                    <Badge color="failure" size="xs">required</Badge>
                                  )}
                                </div>
                                {prop.description && (
                                  <p className="text-gray-600 dark:text-gray-400 ml-2 mt-1">
                                    {prop.description}
                                  </p>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </ExpandableSection>
                );
              })}
            </div>
          </div>
        </section>

        {/* Cross-Layer Links Section */}
        <section className="border-t border-gray-200 dark:border-gray-700 pt-6" data-testid="cross-layer-links-section">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Cross-Layer Links
          </h3>

          {relevantLinks.length > 0 ? (
            <div className="space-y-2">
              {relevantLinks.map((linkType: LinkType) => {
                const linkDetailsItems: MetadataItem[] = [
                  { label: 'Source Layers', value: linkType.sourceLayers.join(', ') },
                  { label: 'Target Layer', value: linkType.targetLayer },
                  { label: 'Target Element Types', value: linkType.targetElementTypes.join(', ') },
                  { label: 'Field Paths', value: linkType.fieldPaths.join(', ') },
                  { label: 'Cardinality', value: linkType.cardinality },
                  { label: 'Format', value: linkType.format }
                ];

                return (
                  <ExpandableSection
                    key={linkType.id}
                    title={linkType.name}
                    badge={linkType.cardinality}
                  >
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {linkType.description}
                    </p>
                    <MetadataGrid title="Link Details" items={linkDetailsItems} columns={2} />
                  </ExpandableSection>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No cross-layer links found for this schema.
            </p>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden" data-testid="spec-viewer">
      {renderMergedView()}
    </div>
  );
};

export default SpecViewer;
