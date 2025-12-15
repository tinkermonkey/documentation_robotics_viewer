/**
 * SchemaInfoPanel Component
 * Displays schema/model metadata and validation status
 */

import React from 'react';
import { useModelStore } from '../../../core/stores/modelStore';

export interface SchemaInfoPanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * SchemaInfoPanel Component
 */
export const SchemaInfoPanel: React.FC<SchemaInfoPanelProps> = ({ className = '' }) => {
  const { model } = useModelStore();

  if (!model) {
    return null;
  }

  // Extract metadata from model
  const version = (model.metadata?.version as string | undefined) || (model.version as string | undefined) || 'Unknown';
  const lastModified = (model.metadata?.lastModified as string | undefined) || (model.metadata?.generatedDate as string | undefined) || (model.metadata?.modified as string | undefined) || 'Unknown';
  const schemaVersion = (model.metadata?.schemaVersion as string | undefined) || 'Unknown';
  const elementCount = (model.metadata?.elementCount as number | undefined) || 0;
  const layerCount = model.layers ? Object.keys(model.layers).length : 0;

  // Determine validation status
  const isValid = (model.metadata?.valid as boolean | undefined) ?? true;
  const validationErrors = (model.metadata?.validationErrors as string[] | undefined) || [];

  // Format last modified date
  const formatDate = (dateString: string) => {
    if (dateString === 'Unknown') return dateString;

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${className}`} data-testid="schema-info-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Schema Info</h3>
        <span
          className={`text-xs px-2 py-1 rounded ${
            isValid
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {isValid ? '✓ Valid' : '✗ Invalid'}
        </span>
      </div>

      {/* Schema Details */}
      <div className="space-y-3">
        {/* Version */}
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Version
          </div>
          <div className="text-sm font-mono text-gray-900 dark:text-white">
            {version}
          </div>
        </div>

        {/* Schema Version */}
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Schema Version
          </div>
          <div className="text-sm font-mono text-gray-900 dark:text-white">
            {schemaVersion}
          </div>
        </div>

        {/* Last Modified */}
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Last Modified
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {formatDate(lastModified)}
          </div>
        </div>

        {/* Statistics */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {layerCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Layers
              </div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {elementCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Elements
              </div>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {!isValid && validationErrors.length > 0 && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
              Validation Errors ({validationErrors.length})
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {validationErrors.slice(0, 5).map((error: string, index: number) => (
                <div
                  key={index}
                  className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded"
                >
                  {error}
                </div>
              ))}
              {validationErrors.length > 5 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                  ... and {validationErrors.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaInfoPanel;
