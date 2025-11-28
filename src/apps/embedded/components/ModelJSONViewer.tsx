/**
 * ModelJSONViewer Component
 * Displays model instance data in a readable JSON format
 */

import React, { useState } from 'react';
import { MetaModel } from '../../../core/types';
import './SpecViewer.css'; // Reuse SpecViewer styles

interface ModelJSONViewerProps {
  model: MetaModel;
}

const ModelJSONViewer: React.FC<ModelJSONViewerProps> = ({ model }) => {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());

  console.log('[ModelJSONViewer] Rendering with model:', {
    hasModel: !!model,
    layerCount: model ? Object.keys(model.layers).length : 0,
    elementCount: model?.metadata?.elementCount || 0
  });

  if (!model) {
    return (
      <div className="spec-viewer empty">
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

  const toggleElement = (elemId: string) => {
    const newExpanded = new Set(expandedElements);
    if (newExpanded.has(elemId)) {
      newExpanded.delete(elemId);
    } else {
      newExpanded.add(elemId);
    }
    setExpandedElements(newExpanded);
  };

  const renderLayerList = () => (
    <div className="schema-list">
      <div className="schema-list-header">
        <h3>Model Layers</h3>
        <span className="schema-count">{layerNames.length} layers</span>
      </div>
      {layerNames.length === 0 ? (
        <div className="empty-state">
          <p>No layers defined</p>
        </div>
      ) : (
        layerNames.map(name => {
          const layer = layers[name];
          const elementCount = layer.elements?.length || 0;

          return (
            <div
              key={name}
              className={`schema-item ${selectedLayer === name ? 'selected' : ''}`}
              onClick={() => setSelectedLayer(name)}
            >
              <span className="schema-name">{layer.name || name}</span>
              <span className="element-count">{elementCount} elements</span>
            </div>
          );
        })
      )}
    </div>
  );

  const renderLayerDetails = () => {
    if (!selectedLayer) {
      return (
        <div className="schema-details empty">
          <p>Select a layer to view elements</p>
          <div className="model-metadata">
            <h4>Model Metadata</h4>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="label">Version:</span>
                <span className="value">{model.version}</span>
              </div>
              <div className="metadata-item">
                <span className="label">Total Elements:</span>
                <span className="value">{model.metadata?.elementCount || 0}</span>
              </div>
              <div className="metadata-item">
                <span className="label">Total Layers:</span>
                <span className="value">{layerNames.length}</span>
              </div>
              {model.metadata?.loadedAt && (
                <div className="metadata-item">
                  <span className="label">Loaded:</span>
                  <span className="value">{new Date(model.metadata.loadedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const layer = layers[selectedLayer];
    const elements = layer.elements || [];

    return (
      <div className="schema-details">
        <div className="schema-header">
          <h2>{layer.name || selectedLayer}</h2>
          {layer.description && <p className="schema-description">{layer.description}</p>}
        </div>

        <div className="schema-info">
          <div className="info-item">
            <span className="info-label">Layer ID:</span>
            <span className="info-value">{layer.id || selectedLayer}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Elements:</span>
            <span className="info-value">{elements.length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Order:</span>
            <span className="info-value">{layer.order || 'N/A'}</span>
          </div>
        </div>

        {elements.length === 0 ? (
          <div className="empty-state">
            <p>No elements in this layer</p>
            <p className="hint">Elements will appear here when you add them to your model</p>
          </div>
        ) : (
          <div className="definitions-section">
            <h3>Elements ({elements.length})</h3>
            {elements.map((element: any) => {
              const isExpanded = expandedElements.has(element.id);

              return (
                <div key={element.id} className="definition-item">
                  <div
                    className="definition-header"
                    onClick={() => toggleElement(element.id)}
                  >
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    <span className="definition-name">{element.name || element.id}</span>
                    <span className="definition-type">{element.type}</span>
                  </div>

                  {isExpanded && (
                    <div className="definition-details">
                      {element.description && (
                        <p className="definition-description">{element.description}</p>
                      )}

                      <div className="properties-section">
                        <h4>Element Data:</h4>
                        <pre className="json-preview">
                          {JSON.stringify(element, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="spec-viewer">
      {renderLayerList()}
      {renderLayerDetails()}
    </div>
  );
};

export default ModelJSONViewer;
