/**
 * ModelJSONViewer Component
 * Displays model instance data in a readable JSON format
 * Shows cross-layer links for each element
 */

import React, { useEffect } from 'react';
import { MetaModel } from '../../../core/types';
import { Badge, Accordion, AccordionPanel, AccordionTitle, AccordionContent } from 'flowbite-react';
import AttributesTable, { AttributeRow } from './common/AttributesTable';
import MetadataGrid, { MetadataItem } from './common/MetadataGrid';
import { useAnnotationStore } from '../stores/annotationStore';

interface ModelJSONViewerProps {
  model: MetaModel;
  specData?: {
    schemas: Record<string, any>;
  };
  onPathHighlight?: (path: string | null) => void;
  selectedLayer: string | null;
}

const ModelJSONViewer: React.FC<ModelJSONViewerProps> = ({
  model,
  specData,
  onPathHighlight,
  selectedLayer
}) => {
  const { highlightedElementId } = useAnnotationStore();

  // Watch for highlighted elements and compute their JSON path
  useEffect(() => {
    if (!highlightedElementId || !onPathHighlight) return;

    // Find the element in the model
    let foundPath: string | null = null;

    for (const [layerName, layer] of Object.entries(model.layers)) {
      const elements = layer.elements || [];
      const elementIndex = elements.findIndex((el: any) => el.id === highlightedElementId);

      if (elementIndex !== -1) {
        const element = elements[elementIndex];
        foundPath = `layers.${layerName}.elements[${elementIndex}] (${element.name || element.id})`;
        break;
      }
    }

    if (foundPath) {
      onPathHighlight(foundPath);
    }
  }, [highlightedElementId, model, onPathHighlight]);



  if (!model) {
    return (
      <div className="w-full h-full flex items-center justify-center flex-col text-gray-500 dark:text-gray-400">
        <p>No model data loaded</p>
      </div>
    );
  }

  const layers = model.layers || {};
  const layerNames = Object.keys(layers).sort((a, b) => {
    const orderA = layers[a].order || 999;
    const orderB = layers[b].order || 999;
    return orderA - orderB;
  });

  // Helper to find schema definition for an element type
  const getSchemaForType = (layerId: string, elementType: string) => {
    if (!specData?.schemas) return null;

    // Find the layer schema
    const layerSchemaKey = Object.keys(specData.schemas).find(key =>
      key.toLowerCase().includes(layerId.toLowerCase()) && key.includes('schema.json')
    );

    if (!layerSchemaKey) return null;

    const layerSchema = specData.schemas[layerSchemaKey];

    // Look for the element type in definitions
    if (layerSchema?.definitions) {
      // Try exact match first
      if (layerSchema.definitions[elementType]) {
        return layerSchema.definitions[elementType];
      }

      // Try case-insensitive match
      const typeKey = Object.keys(layerSchema.definitions).find(
        key => key.toLowerCase() === elementType.toLowerCase()
      );

      if (typeKey) {
        return layerSchema.definitions[typeKey];
      }
    }

    return null;
  };

  // Helper to get layer description from schema
  const getLayerDescription = (layerId: string) => {
    if (!specData?.schemas) return null;

    const layerSchemaKey = Object.keys(specData.schemas).find(key =>
      key.toLowerCase().includes(layerId.toLowerCase()) && key.includes('schema.json')
    );

    if (!layerSchemaKey) return null;

    return specData.schemas[layerSchemaKey]?.description;
  };



  const renderLayerDetails = () => {
    if (!selectedLayer) {
      // Calculate total element count from all layers
      const totalElements = Object.values(layers).reduce((sum, layer) => {
        return sum + (layer.elements?.length || 0);
      }, 0);

      const metadataItems: MetadataItem[] = [
        { label: 'Version', value: model.version },
        { label: 'Total Elements', value: totalElements },
        { label: 'Total Layers', value: layerNames.length },
        ...(model.metadata?.loadedAt
          ? [{ label: 'Loaded', value: new Date(model.metadata.loadedAt).toLocaleString() }]
          : [])
      ];

      return (
        <div className="h-full overflow-y-auto p-6">
          <div className="flex items-center justify-center flex-col text-gray-400 dark:text-gray-500 mb-6">
            <p className="text-gray-500 dark:text-gray-400 mb-6">Select a layer from the sidebar to view elements</p>
            <MetadataGrid title="Model Metadata" items={metadataItems} columns={2} />
          </div>
        </div>
      );
    }

    const layer = layers[selectedLayer];
    
    // If layer not found, try with lowercase key (API uses lowercase IDs)
    const layerKey = layer ? selectedLayer : Object.keys(layers).find(
      key => key.toLowerCase() === selectedLayer.toLowerCase()
    );
    
    const actualLayer = layers[layerKey || selectedLayer];
    
    // Guard against undefined layer
    if (!actualLayer) {
      return (
        <div className="h-full overflow-y-auto p-6">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">Layer not found: {selectedLayer}</p>
          </div>
        </div>
      );
    }
    
    const elements = actualLayer.elements || [];

    // Group elements by type
    const elementsByType = elements.reduce((acc: Record<string, any[]>, element: any) => {
      const type = element.type || 'unknown';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(element);
      return acc;
    }, {});

    const sortedTypes = Object.keys(elementsByType).sort();

    const layerMetadata: MetadataItem[] = [
      { label: 'Layer ID', value: actualLayer.id || (layerKey || selectedLayer) },
      { label: 'Elements', value: elements.length },
      { label: 'Order', value: actualLayer.order }
    ];

    const layerSchemaDescription = getLayerDescription(selectedLayer);

    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {actualLayer.name || (layerKey || selectedLayer)}
          </h2>
          {(actualLayer.description || layerSchemaDescription) && (
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
              {actualLayer.description || layerSchemaDescription}
            </p>
          )}
          <MetadataGrid items={layerMetadata} columns={3} />
        </div>

        {elements.length === 0 ? (
          <div className="mt-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
              <p className="text-gray-500 dark:text-gray-400">No elements in this layer</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Elements will appear here when you add them to your model
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Elements ({elements.length})
            </h3>

            {sortedTypes.map((elementType) => {
              const typeElements = elementsByType[elementType];
              const typeKey = `${selectedLayer}-${elementType}`;
              const typeSchema = getSchemaForType(selectedLayer, elementType);

              return (
                <Accordion key={typeKey} collapseAll className="mb-3">
                  <AccordionPanel>
                    <AccordionTitle>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold">
                          {elementType}
                        </span>
                        <Badge color="gray">
                          {typeElements.length}
                        </Badge>
                      </div>
                    </AccordionTitle>
                    <AccordionContent className="bg-white dark:bg-gray-900">
                      {/* Schema Definition */}
                      {typeSchema && (
                        <div className="mb-4 ml-4 pl-4 border-l-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded p-3">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Type Definition:
                          </h5>
                          {typeSchema.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {typeSchema.description}
                            </p>
                          )}
                          {typeSchema.properties && (
                            <div className="text-sm">
                              <strong className="text-gray-900 dark:text-white">Properties:</strong>
                              <ul className="mt-2 space-y-1 ml-4">
                                {Object.entries(typeSchema.properties).map(([propName, propDef]: [string, any]) => (
                                  <li key={propName} className="text-gray-700 dark:text-gray-300">
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{propName}</code>
                                    {propDef.type && <span className="text-gray-500"> ({propDef.type})</span>}
                                    {propDef.description && <span> - {propDef.description}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Elements of this type */}
                      <div className="space-y-3">
                        {typeElements.map((element: any) => {
                          // Build attributes array
                          const attributes: AttributeRow[] = [];

                          // Core attributes
                          if (element.id) attributes.push({ name: 'ID', value: element.id });
                          if (element.name) attributes.push({ name: 'Name', value: element.name });
                          if (element.type) attributes.push({ name: 'Type', value: element.type });

                          // Extract documentation field (ArchiMate standard)
                          const documentation = element.documentation || element.properties?.documentation;

                          // Properties (excluding core fields and documentation)
                          if (element.properties) {
                            Object.entries(element.properties)
                              .filter(([key]) => !['id', 'name', 'type', 'description', 'documentation'].includes(key))
                              .forEach(([key, value]) => {
                                attributes.push({
                                  name: key,
                                  value: value as any,
                                  isObject: typeof value === 'object' && value !== null
                                });
                              });
                          }

                          // Other top-level attributes (relationships, custom fields)
                          Object.entries(element)
                            .filter(([key]) =>
                              !['id', 'name', 'type', 'description', 'documentation', 'properties', 'visual', 'layerId'].includes(key)
                            )
                            .forEach(([key, value]) => {
                              attributes.push({
                                name: key,
                                value: value as any,
                                isObject: typeof value === 'object' && value !== null
                              });
                            });

                          return (
                            <Accordion key={element.id} collapseAll>
                              <AccordionPanel>
                                <AccordionTitle className="text-sm">
                                  {element.name || element.id}
                                </AccordionTitle>
                                <AccordionContent className="bg-white dark:bg-gray-900">
                                  <div className="space-y-4">
                                    {/* Documentation section - prominently displayed */}
                                    {documentation && (
                                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h6 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 uppercase tracking-wide">
                                          Documentation
                                        </h6>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                          {documentation}
                                        </p>
                                      </div>
                                    )}

                                    <AttributesTable attributes={attributes} title="Attributes" />
                                  </div>
                                </AccordionContent>
                              </AccordionPanel>
                            </Accordion>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionPanel>
                </Accordion>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden">
      {renderLayerDetails()}
    </div>
  );
};

export default ModelJSONViewer;
