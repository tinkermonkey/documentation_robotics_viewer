import React, { useMemo } from 'react';
import type { BusinessNode, BusinessGraph } from '../../types/businessLayer';
import './ProcessInspectorPanel.css';

export interface ProcessInspectorPanelProps {
  selectedNode: BusinessNode | null;
  businessGraph: BusinessGraph | null;
  onTraceUpstream: () => void;
  onTraceDownstream: () => void;
  onIsolate: () => void;
}

export const ProcessInspectorPanel: React.FC<ProcessInspectorPanelProps> = ({
  selectedNode,
  businessGraph,
  onTraceUpstream,
  onTraceDownstream,
  onIsolate,
}) => {
  const upstreamCount = useMemo(() => {
    if (!selectedNode || !businessGraph) return 0;
    return Array.from(businessGraph.edges.values()).filter(
      (e) => e.target === selectedNode.id
    ).length;
  }, [selectedNode, businessGraph]);

  const downstreamCount = useMemo(() => {
    if (!selectedNode || !businessGraph) return 0;
    return Array.from(businessGraph.edges.values()).filter(
      (e) => e.source === selectedNode.id
    ).length;
  }, [selectedNode, businessGraph]);

  if (!selectedNode) {
    return (
      <div className="process-inspector-panel" role="complementary" aria-label="Process Inspector">
        <div className="inspector-empty">
          <p>Select a process to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="process-inspector-panel" role="complementary" aria-label="Process Inspector">
      <div className="inspector-header">
        <h3>{selectedNode.name}</h3>
        <div className="node-type-badge" data-type={selectedNode.type}>
          {selectedNode.type}
        </div>
      </div>

      {selectedNode.description && (
        <div className="description-section">
          <p className="description">{selectedNode.description}</p>
        </div>
      )}

      <div className="metadata-section">
        <h4>Metadata</h4>
        <div className="metadata-grid">
          {selectedNode.metadata.owner && (
            <div className="metadata-item">
              <strong>Owner:</strong>
              <span>{selectedNode.metadata.owner}</span>
            </div>
          )}
          {selectedNode.metadata.criticality && (
            <div className="metadata-item">
              <strong>Criticality:</strong>
              <span className={`criticality-badge ${selectedNode.metadata.criticality}`}>
                {selectedNode.metadata.criticality}
              </span>
            </div>
          )}
          {selectedNode.metadata.lifecycle && (
            <div className="metadata-item">
              <strong>Lifecycle:</strong>
              <span>{selectedNode.metadata.lifecycle}</span>
            </div>
          )}
          {selectedNode.metadata.domain && (
            <div className="metadata-item">
              <strong>Domain:</strong>
              <span>{selectedNode.metadata.domain}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relationships-section">
        <h4>Relationships</h4>
        <div className="relationships-grid">
          <div className="relationship-item">
            <strong>Upstream:</strong>
            <span className="count-badge">{upstreamCount}</span>
            <span className="count-label">processes</span>
          </div>
          <div className="relationship-item">
            <strong>Downstream:</strong>
            <span className="count-badge">{downstreamCount}</span>
            <span className="count-label">processes</span>
          </div>
        </div>
      </div>

      {selectedNode.metadata.subprocessCount && selectedNode.metadata.subprocessCount > 0 && (
        <div className="subprocess-section">
          <h4>Subprocesses</h4>
          <div className="subprocess-info">
            <span className="count-badge">{selectedNode.metadata.subprocessCount}</span>
            <span className="count-label">steps</span>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h4>Quick Actions</h4>
        <div className="action-buttons">
          <button
            onClick={onTraceUpstream}
            className="action-button upstream"
            aria-label="Trace upstream dependencies"
            disabled={upstreamCount === 0}
          >
            <span className="button-icon">↑</span>
            Trace Upstream
          </button>
          <button
            onClick={onTraceDownstream}
            className="action-button downstream"
            aria-label="Trace downstream dependencies"
            disabled={downstreamCount === 0}
          >
            <span className="button-icon">↓</span>
            Trace Downstream
          </button>
          <button
            onClick={onIsolate}
            className="action-button isolate"
            aria-label="Isolate this process"
          >
            <span className="button-icon">⊙</span>
            Isolate Process
          </button>
        </div>
      </div>
    </div>
  );
};
