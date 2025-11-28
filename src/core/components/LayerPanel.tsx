/**
 * LayerPanel Component
 * Provides UI controls for layer visibility and opacity
 */

import React from 'react';
import { useLayerStore } from '../stores/layerStore';
import { LayerType } from '../types';
import './LayerPanel.css';

/**
 * Get display color for each layer
 */
const getLayerColor = (layerType: string): string => {
  const colors: Record<string, string> = {
    [LayerType.Motivation]: '#2e7d32',
    [LayerType.Business]: '#e65100',
    [LayerType.Security]: '#c2185b',
    [LayerType.Application]: '#1565c0',
    [LayerType.Technology]: '#6a1b9a',
    [LayerType.Api]: '#00695c',
    [LayerType.DataModel]: '#424242',
    [LayerType.Datastore]: '#5d4037',
    [LayerType.Ux]: '#283593',
    [LayerType.Navigation]: '#f57f17',
    [LayerType.ApmObservability]: '#4e342e',
    [LayerType.FederatedArchitecture]: '#00897b'
  };
  return colors[layerType] || '#999999';
};

/**
 * Layer Panel Component
 */
export const LayerPanel: React.FC = () => {
  const {
    layers,
    toggleLayer,
    setLayerOpacity,
    showAll,
    hideAll,
    resetLayers
  } = useLayerStore();

  // Define layer order for display
  const layerOrder = [
    LayerType.Motivation,
    LayerType.Business,
    LayerType.Security,
    LayerType.Application,
    LayerType.Technology,
    LayerType.Api,
    LayerType.DataModel,
    LayerType.Datastore,
    LayerType.Ux,
    LayerType.Navigation,
    LayerType.ApmObservability,
    LayerType.FederatedArchitecture
  ];

  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <h3>Layers</h3>
        <div className="layer-panel-actions">
          <button
            onClick={showAll}
            className="layer-action-btn"
            title="Show all layers"
          >
            Show All
          </button>
          <button
            onClick={hideAll}
            className="layer-action-btn"
            title="Hide all layers"
          >
            Hide All
          </button>
          <button
            onClick={resetLayers}
            className="layer-action-btn"
            title="Reset to defaults"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="layer-list">
        {layerOrder.map((layerId) => {
          const layerState = layers[layerId];
          if (!layerState) return null;

          return (
            <div
              key={layerId}
              className={`layer-item ${layerState.visible ? 'visible' : 'hidden'}`}
            >
              <div className="layer-item-header">
                <div
                  className="layer-color-indicator"
                  style={{ backgroundColor: getLayerColor(layerId) }}
                />
                <label className="layer-checkbox">
                  <input
                    type="checkbox"
                    checked={layerState.visible}
                    onChange={() => toggleLayer(layerId)}
                  />
                  <span className="layer-name">{layerId}</span>
                </label>
              </div>

              <div className="layer-controls">
                <div className="layer-opacity-control">
                  <label className="opacity-label">
                    Opacity: {Math.round(layerState.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layerState.opacity}
                    onChange={(e) =>
                      setLayerOpacity(layerId, parseFloat(e.target.value))
                    }
                    className="opacity-slider"
                    disabled={!layerState.visible}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel;
