/**
 * LayoutPreferencesPanel Component
 *
 * Provides UI for managing layout engine preferences, custom parameter presets,
 * and configuration export/import.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useLayoutPreferencesStore } from '../../../core/stores/layoutPreferencesStore';
import type { DiagramType } from '../../../core/types/diagram';
import type { LayoutEngineType } from '../../../core/layout/engines/LayoutEngine';

export interface LayoutPreferencesPanelProps {
  /** Additional CSS classes */
  className?: string;

  /** Optional callback when preferences change */
  onChange?: () => void;
}

/**
 * Available diagram types for preference configuration
 */
const DIAGRAM_TYPES: Array<{ value: DiagramType; label: string }> = [
  { value: 'motivation', label: 'Motivation' },
  { value: 'business', label: 'Business Process' },
  { value: 'security', label: 'Security' },
  { value: 'application', label: 'Application' },
  { value: 'technology', label: 'Technology' },
  { value: 'api', label: 'API' },
  { value: 'datamodel', label: 'Data Model' },
  { value: 'dataset', label: 'Dataset' },
  { value: 'ux', label: 'UX' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'apm', label: 'APM' },
  { value: 'c4', label: 'C4 Architecture' },
];

/**
 * Available layout engines
 */
const LAYOUT_ENGINES: Array<{ value: LayoutEngineType; label: string }> = [
  { value: 'elk', label: 'ELK (Eclipse)' },
];

/**
 * Type guard to validate layout engine type values
 */
const isValidLayoutEngine = (value: unknown): value is LayoutEngineType => {
  return LAYOUT_ENGINES.some((opt) => opt.value === value);
};

/**
 * LayoutPreferencesPanel Component
 */
export const LayoutPreferencesPanel: React.FC<LayoutPreferencesPanelProps> = ({
  className = '',
  onChange,
}) => {
  const {
    defaultEngines,
    presets,
    setDefaultEngine,
    clearDefaultEngine,
    removePreset,
    exportConfig,
    importConfig,
  } = useLayoutPreferencesStore();

  // Local state
  const [activeTab, setActiveTab] = useState<'engines' | 'presets' | 'import-export'>('engines');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedConfig, setExportedConfig] = useState('');

  // Handle engine selection change
  const handleEngineChange = useCallback(
    (diagramType: DiagramType, engineType: string) => {
      if (engineType === '') {
        clearDefaultEngine(diagramType);
      } else if (isValidLayoutEngine(engineType)) {
        setDefaultEngine(diagramType, engineType);
      } else {
        // Log warning for debugging - helps identify malformed engine values
        console.warn(`[LayoutPreferencesPanel] Invalid layout engine rejected for ${diagramType}: ${engineType}`);
      }
      onChange?.();
    },
    [setDefaultEngine, clearDefaultEngine, onChange]
  );

  // Handle preset deletion
  const handleDeletePreset = useCallback(
    (presetId: string) => {
      if (confirm('Are you sure you want to delete this preset?')) {
        removePreset(presetId);
        onChange?.();
      }
    },
    [removePreset, onChange]
  );

  // Handle export
  const handleExport = useCallback(() => {
    try {
      const config = exportConfig();
      setExportedConfig(config);
      setShowExportModal(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during export';
      console.error('[LayoutPreferencesPanel] Export failed:', errorMessage);
      alert(`Failed to export configuration: ${errorMessage}`);
    }
  }, [exportConfig]);

  // Handle import
  const handleImport = useCallback(() => {
    try {
      setImportError('');
      const success = importConfig(importText);

      if (success) {
        setImportText('');
        alert('Configuration imported successfully!');
        onChange?.();
      } else {
        setImportError('Invalid configuration format. Please check your JSON and try again.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during import';
      console.error('[LayoutPreferencesPanel] Import failed:', errorMessage);
      setImportError(`Import failed: ${errorMessage}`);
    }
  }, [importText, importConfig, onChange]);

  // Copy exported config to clipboard
  const handleCopyToClipboard = useCallback(() => {
    try {
      navigator.clipboard.writeText(exportedConfig)
        .then(() => {
          alert('Configuration copied to clipboard!');
        })
        .catch((error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error during clipboard operation';
          console.error('[LayoutPreferencesPanel] Clipboard copy failed:', errorMessage);
          alert(`Failed to copy to clipboard: ${errorMessage}`);
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during clipboard operation';
      console.error('[LayoutPreferencesPanel] Clipboard copy failed:', errorMessage);
      alert(`Failed to copy to clipboard: ${errorMessage}`);
    }
  }, [exportedConfig]);

  // Download exported config
  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([exportedConfig], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `layout-preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during download';
      console.error('[LayoutPreferencesPanel] Download failed:', errorMessage);
      alert(`Failed to download configuration: ${errorMessage}`);
    }
  }, [exportedConfig]);

  // Count presets per diagram type (used for future analytics)
  useMemo(() => {
    const counts: Partial<Record<DiagramType, number>> = {};
    presets.forEach((preset) => {
      counts[preset.diagramType] = (counts[preset.diagramType] || 0) + 1;
    });
    return counts;
  }, [presets]);

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}
      data-testid="layout-preferences-panel"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Layout Preferences
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure default layout engines and manage parameter presets
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'engines'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('engines')}
          data-testid="tab-engines"
        >
          Default Engines
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'presets'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('presets')}
          data-testid="tab-presets"
        >
          Presets ({presets.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'import-export'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('import-export')}
          data-testid="tab-import-export"
        >
          Import/Export
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Default Engines Tab */}
        {activeTab === 'engines' && (
          <div className="space-y-4" data-testid="engines-content">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select the default layout engine for each diagram type. Leave blank to use system defaults.
            </p>

            <div className="space-y-3">
              {DIAGRAM_TYPES.map(({ value, label }) => (
                <div key={value} className="flex items-center justify-between">
                  <label
                    htmlFor={`engine-${value}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px]"
                  >
                    {label}
                  </label>
                  <select
                    id={`engine-${value}`}
                    value={defaultEngines[value] || ''}
                    onChange={(e) => handleEngineChange(value, e.target.value)}
                    className="flex-1 ml-3 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid={`engine-select-${value}`}
                  >
                    <option value="">System Default</option>
                    {LAYOUT_ENGINES.map(({ value: engineValue, label: engineLabel }) => (
                      <option key={engineValue} value={engineValue}>
                        {engineLabel}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="space-y-4" data-testid="presets-content">
            {presets.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No custom presets yet.</p>
                <p className="text-xs mt-2">
                  Create layout presets to save your preferred layout configurations.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg"
                    data-testid={`preset-${preset.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {preset.name}
                        </h4>
                        {preset.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {preset.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                            {DIAGRAM_TYPES.find((t) => t.value === preset.diagramType)?.label}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                            {LAYOUT_ENGINES.find((e) => e.value === preset.engineType)?.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Object.keys(preset.parameters).length} params
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="ml-3 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        data-testid={`delete-preset-${preset.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import/Export Tab */}
        {activeTab === 'import-export' && (
          <div className="space-y-6" data-testid="import-export-content">
            {/* Export Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Export Configuration
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Export your layout preferences and presets to a JSON file.
              </p>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
                data-testid="export-button"
              >
                Export Configuration
              </button>
            </div>

            {/* Import Section */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Import Configuration
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Import layout preferences from a previously exported JSON file.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste exported configuration JSON here..."
                className="w-full h-32 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                data-testid="import-textarea"
              />
              {importError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" data-testid="import-error">
                  {importError}
                </p>
              )}
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md"
                data-testid="import-button"
              >
                Import Configuration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowExportModal(false)}
          data-testid="export-modal"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Exported Configuration
            </h3>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-xs text-gray-800 dark:text-gray-200 mb-4 max-h-96">
              {exportedConfig}
            </pre>
            <div className="flex gap-3">
              <button
                onClick={handleCopyToClipboard}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
                data-testid="copy-button"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md"
                data-testid="download-button"
              >
                Download File
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white text-sm font-medium rounded-md"
                data-testid="close-modal-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
