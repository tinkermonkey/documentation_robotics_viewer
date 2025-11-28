/**
 * SpecViewer Component
 * Displays JSON Schema files in a readable format
 */

import React, { useState } from 'react';
import { SpecDataResponse } from '../services/embeddedDataLoader';
import './SpecViewer.css';

interface SpecViewerProps {
  specData: SpecDataResponse;
}

const SpecViewer: React.FC<SpecViewerProps> = ({ specData }) => {
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [expandedDefinitions, setExpandedDefinitions] = useState<Set<string>>(new Set());

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
      <div className="spec-viewer empty">
        <p>No spec data loaded</p>
        <p className="debug-info">Debug: specData is null/undefined</p>
      </div>
    );
  }

  if (!specData.schemas) {
    console.warn('[SpecViewer] specData exists but has no schemas property:', specData);
    return (
      <div className="spec-viewer empty">
        <p>No schemas found in spec data</p>
        <p className="debug-info">Debug: specData keys: {Object.keys(specData).join(', ')}</p>
      </div>
    );
  }

  const schemas = specData.schemas || {};
  const schemaNames = Object.keys(schemas).sort();

  console.log('[SpecViewer] Rendering with schemas:', {
    schemaCount: schemaNames.length,
    schemaNames: schemaNames
  });

  const toggleDefinition = (defName: string) => {
    const newExpanded = new Set(expandedDefinitions);
    if (newExpanded.has(defName)) {
      newExpanded.delete(defName);
    } else {
      newExpanded.add(defName);
    }
    setExpandedDefinitions(newExpanded);
  };

  const renderSchemaList = () => (
    <div className="schema-list">
      <div className="schema-list-header">
        <h3>Schema Files</h3>
        <span className="schema-count">{schemaNames.length} files</span>
      </div>
      {schemaNames.map(name => (
        <div
          key={name}
          className={`schema-item ${selectedSchema === name ? 'selected' : ''}`}
          onClick={() => setSelectedSchema(name)}
        >
          <span className="schema-name">{name}</span>
        </div>
      ))}
    </div>
  );

  const renderSchemaDetails = () => {
    if (!selectedSchema) {
      return (
        <div className="schema-details empty">
          <p>Select a schema file to view details</p>
        </div>
      );
    }

    const schema = schemas[selectedSchema];
    const definitions = schema.definitions || {};
    const defNames = Object.keys(definitions);

    return (
      <div className="schema-details">
        <div className="schema-header">
          <h2>{schema.title || selectedSchema}</h2>
          <p className="schema-description">{schema.description}</p>
        </div>

        <div className="schema-info">
          <div className="info-item">
            <span className="info-label">$schema:</span>
            <span className="info-value">{schema.$schema}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Element Types:</span>
            <span className="info-value">{defNames.length}</span>
          </div>
        </div>

        <div className="definitions-section">
          <h3>Element Type Definitions</h3>
          {defNames.map(defName => {
            const definition = definitions[defName];
            const isExpanded = expandedDefinitions.has(defName);

            return (
              <div key={defName} className="definition-item">
                <div
                  className="definition-header"
                  onClick={() => toggleDefinition(defName)}
                >
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  <span className="definition-name">{defName}</span>
                  <span className="definition-type">{definition.type}</span>
                </div>

                {isExpanded && (
                  <div className="definition-details">
                    {definition.description && (
                      <p className="definition-description">{definition.description}</p>
                    )}

                    {definition.properties && (
                      <div className="properties-section">
                        <h4>Properties:</h4>
                        <ul className="properties-list">
                          {Object.entries(definition.properties).map(([propName, propSchema]: [string, any]) => (
                            <li key={propName} className="property-item">
                              <span className="property-name">{propName}</span>
                              <span className="property-type">
                                {propSchema.type || 'object'}
                                {propSchema.format && ` (${propSchema.format})`}
                              </span>
                              {definition.required?.includes(propName) && (
                                <span className="required-badge">required</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="spec-viewer">
      {renderSchemaList()}
      {renderSchemaDetails()}
    </div>
  );
};

export default SpecViewer;
