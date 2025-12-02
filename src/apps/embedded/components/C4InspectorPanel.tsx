/**
 * C4InspectorPanel Component
 *
 * Displays detailed information about the selected C4 element including:
 * - Complete metadata (name, description, type, technology stack)
 * - All incoming and outgoing relationships with protocols
 * - Quick action buttons: Trace Upstream, Trace Downstream, Drill Down
 * - Container-specific details (API endpoints, deployment info)
 */

import './C4InspectorPanel.css';
import { C4Graph, C4Node, C4Type, ContainerType, ProtocolType } from '../types/c4Graph';

export interface C4InspectorPanelProps {
  /** Selected node ID */
  selectedNodeId: string;

  /** Full C4 graph */
  graph: C4Graph;

  /** Callback when "Trace Upstream" is clicked */
  onTraceUpstream: (nodeId: string) => void;

  /** Callback when "Trace Downstream" is clicked */
  onTraceDownstream: (nodeId: string) => void;

  /** Callback when "Drill Down" is clicked (for containers) */
  onDrillDown?: (nodeId: string) => void;

  /** Callback when inspector panel is closed */
  onClose: () => void;
}

/**
 * C4 Type labels and colors
 */
const C4_TYPE_CONFIG: Record<C4Type, { label: string; color: string }> = {
  [C4Type.System]: { label: 'System', color: '#1e40af' },
  [C4Type.Container]: { label: 'Container', color: '#166534' },
  [C4Type.Component]: { label: 'Component', color: '#92400e' },
  [C4Type.External]: { label: 'External', color: '#6b7280' },
  [C4Type.Deployment]: { label: 'Deployment', color: '#6b21a8' },
};

/**
 * Container type labels
 */
const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  [ContainerType.WebApp]: 'Web Application',
  [ContainerType.MobileApp]: 'Mobile App',
  [ContainerType.DesktopApp]: 'Desktop App',
  [ContainerType.Api]: 'API',
  [ContainerType.Database]: 'Database',
  [ContainerType.MessageQueue]: 'Message Queue',
  [ContainerType.Cache]: 'Cache',
  [ContainerType.FileStorage]: 'File Storage',
  [ContainerType.Service]: 'Service',
  [ContainerType.Function]: 'Function',
  [ContainerType.Custom]: 'Custom',
};

/**
 * C4InspectorPanel Component
 */
export const C4InspectorPanel: React.FC<C4InspectorPanelProps> = ({
  selectedNodeId,
  graph,
  onTraceUpstream,
  onTraceDownstream,
  onDrillDown,
  onClose,
}) => {
  const selectedNode = graph.nodes.get(selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="c4-inspector-panel">
        <div className="inspector-header">
          <h3>Inspector</h3>
          <button className="close-button" onClick={onClose} aria-label="Close inspector panel">
            ×
          </button>
        </div>
        <div className="inspector-content">
          <p className="inspector-empty">No element selected</p>
        </div>
      </div>
    );
  }

  // Get incoming and outgoing edges
  const incomingEdges = Array.from(graph.edges.values()).filter(
    (edge) => edge.targetId === selectedNodeId
  );
  const outgoingEdges = Array.from(graph.edges.values()).filter(
    (edge) => edge.sourceId === selectedNodeId
  );

  // Get component count if this is a container
  const componentIds = graph.indexes.containerComponents.get(selectedNodeId);
  const componentCount = componentIds?.size || 0;

  // Get parent container if this is a component
  const parentContainerId = graph.indexes.componentContainer.get(selectedNodeId);
  const parentContainer = parentContainerId ? graph.nodes.get(parentContainerId) : undefined;

  const typeConfig = C4_TYPE_CONFIG[selectedNode.c4Type];
  const isContainer = selectedNode.c4Type === C4Type.Container;

  return (
    <div className="c4-inspector-panel">
      {/* Header */}
      <div className="inspector-header">
        <h3>Inspector</h3>
        <button className="close-button" onClick={onClose} aria-label="Close inspector panel">
          ×
        </button>
      </div>

      {/* Content */}
      <div className="inspector-content">
        {/* Element Metadata */}
        <section className="inspector-section">
          <h4 className="section-title">Element Details</h4>

          <div className="metadata-row">
            <span className="metadata-label">Name:</span>
            <span className="metadata-value element-name">{selectedNode.name}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Type:</span>
            <span
              className="metadata-value type-badge"
              style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
            >
              {typeConfig.label}
            </span>
          </div>

          {selectedNode.containerType && (
            <div className="metadata-row">
              <span className="metadata-label">Container Type:</span>
              <span className="metadata-value">{CONTAINER_TYPE_LABELS[selectedNode.containerType]}</span>
            </div>
          )}

          {selectedNode.description && (
            <div className="metadata-row description-row">
              <span className="metadata-label">Description:</span>
              <span className="metadata-value">{selectedNode.description}</span>
            </div>
          )}

          {/* Technology Stack */}
          {selectedNode.technology.length > 0 && (
            <div className="metadata-row">
              <span className="metadata-label">Technology:</span>
              <div className="technology-chips">
                {selectedNode.technology.map((tech) => (
                  <span key={tech} className="technology-chip">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Boundary */}
          {selectedNode.boundary && (
            <div className="metadata-row">
              <span className="metadata-label">Boundary:</span>
              <span className={`metadata-value boundary-badge ${selectedNode.boundary}`}>
                {selectedNode.boundary === 'internal' ? 'Internal' : 'External'}
              </span>
            </div>
          )}

          {/* Parent Container (for components) */}
          {parentContainer && (
            <div className="metadata-row">
              <span className="metadata-label">Parent Container:</span>
              <span className="metadata-value">{parentContainer.name}</span>
            </div>
          )}

          {/* Component Count (for containers) */}
          {isContainer && componentCount > 0 && (
            <div className="metadata-row">
              <span className="metadata-label">Components:</span>
              <span className="metadata-value">{componentCount} components</span>
            </div>
          )}

          {/* Connection Stats */}
          <div className="metadata-row">
            <span className="metadata-label">Connections:</span>
            <span className="metadata-value">
              {incomingEdges.length + outgoingEdges.length} total ({incomingEdges.length} in,{' '}
              {outgoingEdges.length} out)
            </span>
          </div>

          {/* Changeset Status */}
          {selectedNode.changesetStatus && (
            <div className="metadata-row">
              <span className="metadata-label">Changeset:</span>
              <span className={`metadata-value changeset-badge ${selectedNode.changesetStatus}`}>
                {selectedNode.changesetStatus}
              </span>
            </div>
          )}
        </section>

        {/* Relationships */}
        <section className="inspector-section">
          <h4 className="section-title">
            Relationships ({incomingEdges.length + outgoingEdges.length})
          </h4>

          {/* Incoming Relationships */}
          {incomingEdges.length > 0 && (
            <div className="relationship-group">
              <h5 className="relationship-group-title">Incoming ({incomingEdges.length})</h5>
              <ul className="relationship-list">
                {incomingEdges.map((edge) => {
                  const sourceNode = graph.nodes.get(edge.sourceId);
                  return (
                    <li key={edge.id} className="relationship-item">
                      <span className="relationship-protocol" data-protocol={edge.protocol}>
                        {edge.protocol}
                      </span>
                      <span className="relationship-arrow">←</span>
                      <span className="relationship-element">{sourceNode?.name || edge.sourceId}</span>
                      {edge.description && (
                        <span className="relationship-description">{edge.description}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Outgoing Relationships */}
          {outgoingEdges.length > 0 && (
            <div className="relationship-group">
              <h5 className="relationship-group-title">Outgoing ({outgoingEdges.length})</h5>
              <ul className="relationship-list">
                {outgoingEdges.map((edge) => {
                  const targetNode = graph.nodes.get(edge.targetId);
                  return (
                    <li key={edge.id} className="relationship-item">
                      <span className="relationship-protocol" data-protocol={edge.protocol}>
                        {edge.protocol}
                      </span>
                      <span className="relationship-arrow">→</span>
                      <span className="relationship-element">{targetNode?.name || edge.targetId}</span>
                      {edge.description && (
                        <span className="relationship-description">{edge.description}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {incomingEdges.length === 0 && outgoingEdges.length === 0 && (
            <p className="relationship-empty">No relationships</p>
          )}
        </section>

        {/* Quick Actions */}
        <section className="inspector-section">
          <h4 className="section-title">Quick Actions</h4>

          <div className="action-buttons">
            <button
              className="action-button"
              onClick={() => onTraceUpstream(selectedNodeId)}
              aria-label="Trace upstream dependencies"
              title="Show all containers that this element depends on"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 12L8 4M8 4L4 8M8 4L12 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Trace Upstream
            </button>

            <button
              className="action-button"
              onClick={() => onTraceDownstream(selectedNodeId)}
              aria-label="Trace downstream dependents"
              title="Show all containers that depend on this element"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 4L8 12M8 12L4 8M8 12L12 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Trace Downstream
            </button>

            {isContainer && onDrillDown && componentCount > 0 && (
              <button
                className="action-button drill-down-button"
                onClick={() => onDrillDown(selectedNodeId)}
                aria-label="Drill down to view components"
                title={`View ${componentCount} components in this container`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="2"
                    y="2"
                    width="12"
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Drill Down ({componentCount})
              </button>
            )}
          </div>
        </section>

        {/* Source Element Reference */}
        {selectedNode.sourceElement && (
          <section className="inspector-section">
            <h4 className="section-title">Source Element</h4>
            <div className="source-element-info">
              <div className="metadata-row">
                <span className="metadata-label">ID:</span>
                <code className="metadata-value id-value">{selectedNode.sourceElement.id}</code>
              </div>
              <div className="metadata-row">
                <span className="metadata-label">Element Type:</span>
                <span className="metadata-value">{selectedNode.sourceElement.type}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default C4InspectorPanel;
