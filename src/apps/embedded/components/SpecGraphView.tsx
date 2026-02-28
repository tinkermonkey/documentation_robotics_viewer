/**
 * SpecGraphView Component
 * Displays spec schema element types as an interactive graph using GraphViewer
 * Converts SpecDataResponse to MetaModel using SpecGraphBuilder
 */

import { useState, useEffect, useMemo } from 'react';
import GraphViewer from '../../../core/components/GraphViewer';
import { SpecGraphBuilder } from '../services/specGraphBuilder';
import type { SpecDataResponse } from '../services/embeddedDataLoader';
import type { MetaModel } from '../../../core/types';

export interface SpecGraphViewProps {
  specData: SpecDataResponse;
  selectedSchemaId: string | null;
}

const SpecGraphView: React.FC<SpecGraphViewProps> = ({ specData, selectedSchemaId }) => {
  const [model, setModel] = useState<MetaModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const builder = useMemo(() => new SpecGraphBuilder(), []);

  useEffect(() => {
    try {
      setLoading(true);
      setError('');
      const metamodel = builder.buildSpecModel(specData, selectedSchemaId);
      setModel(metamodel);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to build spec graph';
      console.error('[SpecGraphView] Error building model:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [specData, selectedSchemaId, builder]);

  if (loading) {
    return (
      <div className="relative w-full h-full">
        <div className="message-overlay">
          <div className="message-box">
            <div className="spinner"></div>
            <p>Building spec graph...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full h-full">
        <div className="message-overlay">
          <div className="message-box error">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedSchemaId) {
    return (
      <div className="relative w-full h-full">
        <div className="message-overlay">
          <div className="message-box">
            <p>Select a schema to view its graph</p>
          </div>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="relative w-full h-full">
        <div className="message-overlay">
          <div className="message-box">
            <p>No element types to display</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GraphViewer model={model} selectedLayerId={selectedSchemaId} />
    </div>
  );
};

export default SpecGraphView;
