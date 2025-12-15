/**
 * SpecViewer Component
 * Displays JSON Schema files in a readable format
 */

import React, { useState } from 'react';
import { SpecDataResponse, LinkType } from '../services/embeddedDataLoader';
import { Card, Badge, Button } from 'flowbite-react';
import SidebarList, { SidebarListItem } from './common/SidebarList';
import ExpandableSection from './common/ExpandableSection';
import MetadataGrid, { MetadataItem } from './common/MetadataGrid';

interface SpecViewerProps {
  specData: SpecDataResponse;
}

type ViewMode = 'schemas' | 'links';

const SpecViewer: React.FC<SpecViewerProps> = ({ specData }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('schemas');
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Helper function to normalize layer names for display
  const normalizeLayerName = (schemaFileName: string): string => {
    // Remove the .schema.json suffix and extract layer name
    const layerName = schemaFileName
      .replace('.schema.json', '')
      .replace(/^\d+-/, ''); // Remove leading numbers like "01-", "02-"
    
    // Convert to proper display format (e.g., "data-model" -> "Data Model")
    return layerName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Add comprehensive logging
  console.log('[SpecViewer] Rendering with specData:', {
    hasData: !!specData,
    dataKeys: specData ? Object.keys(specData) : [],
    hasSchemas: !!(specData?.schemas),
    schemaCount: specData?.schemas ? Object.keys(specData.schemas).length : 0,
    schemaKeys: specData?.schemas ? Object.keys(specData.schemas).slice(0, 3) : []
  });

  if (!specData) {
    console.warn('[SpecViewer] No specData provided');
    return (
      <div className="w-full h-full flex items-center justify-center flex-col text-gray-500 dark:text-gray-400">
        <p>No spec data loaded</p>
        <p className="text-gray-400 dark:text-gray-500">Debug: specData is null/undefined</p>
      </div>
    );
  }

  if (!specData.schemas) {
    console.warn('[SpecViewer] specData exists but has no schemas property:', specData);
    return (
      <div className="w-full h-full flex items-center justify-center flex-col text-gray-500 dark:text-gray-400">
        <p>No schemas found in spec data</p>
        <p className="text-gray-400 dark:text-gray-500">Debug: specData keys: {Object.keys(specData).join(', ')}</p>
      </div>
    );
  }

  const schemas = specData.schemas || {};
  const schemaNames = Object.keys(schemas).sort();

  console.log('[SpecViewer] Rendering with schemas:', {
    schemaCount: schemaNames.length,
    schemaNames: schemaNames
  });

  const renderSchemaList = () => {
    const schemaItems: SidebarListItem[] = schemaNames.map(name => ({
      id: name,
      name: normalizeLayerName(name)
    }));

    return (
      <SidebarList
        title="Schema Files"
        items={schemaItems}
        selectedId={selectedSchema}
        onSelect={setSelectedSchema}
      />
    );
  };

  const renderSchemaDetails = () => {
    if (!selectedSchema) {
      return (
        <div className="flex-1 h-full flex items-center justify-center flex-col text-gray-400 dark:text-gray-500">
          <p className="text-gray-500 dark:text-gray-400">Select a schema file to view details</p>
        </div>
      );
    }

    const schema = schemas[selectedSchema];
    const definitions = schema.definitions || {};
    const defNames = Object.keys(definitions);

    const schemaMetadata: MetadataItem[] = [
      { label: '$schema', value: schema.$schema },
      { label: 'Element Types', value: defNames.length }
    ];

    return (
      <div className="flex-1 h-full overflow-y-auto p-6">
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {schema.title || selectedSchema}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{schema.description}</p>
          <MetadataGrid items={schemaMetadata} columns={2} />
        </Card>

        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Element Type Definitions
          </h3>
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
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Properties:
                      </h4>
                      <ul className="space-y-2 ml-4">
                        {Object.entries(definition.properties).map(([propName, propSchema]: [string, any]) => (
                          <li key={propName} className="text-sm">
                            <div className="flex items-start gap-2">
                              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-900 dark:text-white">
                                {propName}
                              </code>
                              <span className="text-gray-600 dark:text-gray-400">
                                {propSchema.type || 'object'}
                                {propSchema.format && ` (${propSchema.format})`}
                              </span>
                              {definition.required?.includes(propName) && (
                                <Badge color="failure" size="xs">required</Badge>
                              )}
                            </div>
                            {propSchema.description && (
                              <p className="text-gray-600 dark:text-gray-400 ml-2 mt-1">
                                {propSchema.description}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </ExpandableSection>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryList = () => {
    const linkRegistry = specData.linkRegistry;
    if (!linkRegistry) {
      return (
        <SidebarList
          title="Link Categories"
          items={[]}
          selectedId={null}
          onSelect={() => {}}
          emptyMessage="No link registry data available"
        />
      );
    }

    const categories = linkRegistry.categories || {};
    const categoryNames = Object.keys(categories).sort();

    const categoryItems: SidebarListItem[] = categoryNames.map(categoryId => {
      const category = categories[categoryId];
      const linkCount = linkRegistry.linkTypes.filter(lt => lt.category === categoryId).length;

      return {
        id: categoryId,
        name: category.name,
        count: linkCount,
        description: category.description
      };
    });

    return (
      <SidebarList
        title="Link Categories"
        items={categoryItems}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />
    );
  };

  const renderCategoryDetails = () => {
    const linkRegistry = specData.linkRegistry;
    if (!linkRegistry) {
      return (
        <div className="flex-1 h-full flex items-center justify-center flex-col text-gray-400 dark:text-gray-500">
          <p className="text-gray-500 dark:text-gray-400">No link registry data available</p>
        </div>
      );
    }

    if (!selectedCategory) {
      const metadataItems: MetadataItem[] = [
        { label: 'Version', value: linkRegistry.version },
        { label: 'Total Link Types', value: linkRegistry.metadata.totalLinkTypes },
        { label: 'Total Categories', value: linkRegistry.metadata.totalCategories },
        { label: 'Generated', value: new Date(linkRegistry.metadata.generatedDate).toLocaleString() }
      ];

      return (
        <div className="flex-1 h-full flex items-center justify-center flex-col text-gray-400 dark:text-gray-500 p-6">
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Select a category to view link types
          </p>
          <MetadataGrid title="Link Registry Metadata" items={metadataItems} columns={2} />
        </div>
      );
    }

    const category = linkRegistry.categories[selectedCategory];
    const linkTypes = linkRegistry.linkTypes.filter(lt => lt.category === selectedCategory);

    const categoryMetadata: MetadataItem[] = [
      { label: 'Category', value: selectedCategory },
      { label: 'Link Types', value: linkTypes.length }
    ];

    return (
      <div className="flex-1 h-full overflow-y-auto p-6">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            ></span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {category.name}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{category.description}</p>
          <MetadataGrid items={categoryMetadata} columns={2} />
        </Card>

        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Link Types ({linkTypes.length})
          </h3>
          <div className="space-y-2">
            {linkTypes.map((linkType: LinkType) => {
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
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <Button
          color={viewMode === 'schemas' ? 'blue' : 'gray'}
          onClick={() => setViewMode('schemas')}
        >
          📋 Schemas
        </Button>
        <Button
          color={viewMode === 'links' ? 'blue' : 'gray'}
          onClick={() => setViewMode('links')}
        >
          🔗 Cross-Layer Links
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {viewMode === 'schemas' ? (
          <>
            {renderSchemaList()}
            {renderSchemaDetails()}
          </>
        ) : (
          <>
            {renderCategoryList()}
            {renderCategoryDetails()}
          </>
        )}
      </div>
    </div>
  );
};

export default SpecViewer;
