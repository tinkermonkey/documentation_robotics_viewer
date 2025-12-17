/**
 * LayerPanel Component
 * Provides UI controls for layer visibility and opacity
 */

import React from 'react';
import { useLayerStore } from '../stores/layerStore';
import { LayerType } from '../types';
import { getLayerColor } from '../utils/layerColors';
import './LayerPanel.css';

/**
 * Layer Panel Component
 */
export const LayerPanel: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(true);
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
    <div className={`layer-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="layer-panel-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="header-title-row">
          <h3>Layers</h3>
          <span className="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
        </div>
        {!isCollapsed && (
          <div className="layer-panel-actions">
            <button
              onClick={(e) => { e.stopPropagation(); showAll(); }}
              className="layer-action-btn"
              title="Show all layers"
            >
              Show All
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); hideAll(); }}
              className="layer-action-btn"
              title="Hide all layers"
            >
              Hide All
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); resetLayers(); }}
              className="layer-action-btn"
              title="Reset to defaults"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
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
                    style={{ backgroundColor: getLayerColor(layerId, 'primary') }}
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
      )}
    </div>
  );
};

export default LayerPanel;
