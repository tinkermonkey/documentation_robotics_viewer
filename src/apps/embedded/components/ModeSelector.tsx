/**
 * ModeSelector Component
 * Allows switching between Spec, Model, Motivation, and Changeset views
 */

import React from 'react';
import './ModeSelector.css';

type ViewMode = 'spec' | 'model' | 'changesets' | 'motivation';

interface ModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="mode-selector">
      <button
        className={`mode-button ${currentMode === 'spec' ? 'active' : ''}`}
        onClick={() => onModeChange('spec')}
        title="View specification structure"
      >
        📋 Spec
      </button>

      <button
        className={`mode-button ${currentMode === 'model' ? 'active' : ''}`}
        onClick={() => onModeChange('model')}
        title="View current model"
      >
        🏗️ Model
      </button>

      <button
        className={`mode-button ${currentMode === 'motivation' ? 'active' : ''}`}
        onClick={() => onModeChange('motivation')}
        title="View motivation layer ontology"
      >
        🎯 Motivation
      </button>

      <button
        className={`mode-button ${currentMode === 'changesets' ? 'active' : ''}`}
        onClick={() => onModeChange('changesets')}
        title="View changesets"
      >
        📝 Changesets
      </button>
    </div>
  );
};

export default ModeSelector;
