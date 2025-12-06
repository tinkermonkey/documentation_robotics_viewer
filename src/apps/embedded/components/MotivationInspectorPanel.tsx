/**
 * MotivationInspectorPanel Component
 *
 * Displays detailed information about the selected motivation element including:
 * - Complete metadata (name, description, type, properties)
 * - All incoming and outgoing relationships with types
 * - Quick action buttons: Trace Influences, Show Network, Focus on Element
 * - Cross-layer navigation links to related elements
 */

import './MotivationInspectorPanel.css';
import { MotivationGraph, MotivationGraphNode, MotivationElementType } from '../types/motivationGraph';

export interface MotivationInspectorPanelProps {
  /** Selected node ID */
  selectedNodeId: string;

  /** Full motivation graph */
  graph: MotivationGraph;

  /** Callback when "Trace Upstream" is clicked */
  onTraceUpstream: (nodeId: string) => void;

  /** Callback when "Trace Downstream" is clicked */
  onTraceDownstream: (nodeId: string) => void;

  /** Callback when "Show Network" is clicked (for stakeholders) */
  onShowNetwork?: (nodeId: string) => void;

  /** Callback when "Focus on Element" is clicked */
  onFocusOnElement?: (nodeId: string) => void;

  /** Callback when inspector panel is closed */
  onClose: () => void;
}

/**
 * MotivationInspectorPanel Component
 */
export const MotivationInspectorPanel: React.FC<MotivationInspectorPanelProps> = ({
  selectedNodeId,
  graph,
  onTraceUpstream,
  onTraceDownstream,
  onShowNetwork,
  onFocusOnElement,
  onClose,
}) => {
  const selectedNode = graph.nodes.get(selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="inspector-panel">
        <div className="inspector-header">
          <h3>Inspector</h3>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close inspector panel"
          >
            ×
          </button>
        </div>
        <div className="inspector-content">
          <p className="inspector-empty">No element selected</p>
        </div>
      </div>
    );
  }

  const element = selectedNode.element;
  const isStakeholder = element.type === MotivationElementType.Stakeholder;

  // Get incoming and outgoing relationships
  const incomingRelationships = Array.from(graph.edges.values()).filter(
    (edge) => edge.targetId === selectedNodeId
  );
  const outgoingRelationships = Array.from(graph.edges.values()).filter(
    (edge) => edge.sourceId === selectedNodeId
  );

  return (
    <div className="inspector-panel">
      {/* Header */}
      <div className="inspector-header">
        <h3>Inspector</h3>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close inspector panel"
        >
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
            <span className="metadata-value">{element.name}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Type:</span>
            <span className="metadata-value type-badge" data-type={element.type}>
              {formatElementType(element.type)}
            </span>
          </div>

          {!!!!element.properties?.description && (
            <div className="metadata-row">
              <span className="metadata-label">Description:</span>
              <span className="metadata-value">{String(element.properties.description)}</span>
            </div>
          )}

          {/* Type-specific properties */}
          {element.type === MotivationElementType.Goal && !!!!element.properties?.priority && (
            <div className="metadata-row">
              <span className="metadata-label">Priority:</span>
              <span className="metadata-value priority-badge" data-priority={String(element.properties.priority)}>
                {String(element.properties.priority)}
              </span>
            </div>
          )}

          {element.type === MotivationElementType.Requirement && !!!!element.properties?.priority && (
            <div className="metadata-row">
              <span className="metadata-label">Priority:</span>
              <span className="metadata-value priority-badge" data-priority={String(element.properties.priority)}>
                {String(element.properties.priority)}
              </span>
            </div>
          )}

          {element.type === MotivationElementType.Requirement && !!!!element.properties?.status && (
            <div className="metadata-row">
              <span className="metadata-label">Status:</span>
              <span className="metadata-value status-badge" data-status={String(element.properties.status)}>
                {String(element.properties.status)}
              </span>
            </div>
          )}

          {element.type === MotivationElementType.Constraint && !!!!element.properties?.negotiability && (
            <div className="metadata-row">
              <span className="metadata-label">Negotiability:</span>
              <span className="metadata-value">{String(element.properties.negotiability)}</span>
            </div>
          )}

          {element.type === MotivationElementType.Driver && !!!!element.properties?.category && (
            <div className="metadata-row">
              <span className="metadata-label">Category:</span>
              <span className="metadata-value">{String(element.properties.category)}</span>
            </div>
          )}

          {element.type === MotivationElementType.Outcome && !!element.properties?.achievementStatus && (
            <div className="metadata-row">
              <span className="metadata-label">Achievement Status:</span>
              <span className="metadata-value status-badge" data-status={String(element.properties.achievementStatus)}>
                {String(element.properties.achievementStatus)}
              </span>
            </div>
          )}

          {/* Graph Metrics */}
          <div className="metadata-row">
            <span className="metadata-label">Connections:</span>
            <span className="metadata-value">
              {selectedNode.metrics.degreeCentrality} total ({selectedNode.metrics.inDegree} in, {selectedNode.metrics.outDegree} out)
            </span>
          </div>

          {selectedNode.metrics.influenceDepth > 0 && (
            <div className="metadata-row">
              <span className="metadata-label">Influence Depth:</span>
              <span className="metadata-value">{selectedNode.metrics.influenceDepth} levels</span>
            </div>
          )}
        </section>

        {/* Relationships */}
        <section className="inspector-section">
          <h4 className="section-title">
            Relationships ({incomingRelationships.length + outgoingRelationships.length})
          </h4>

          {/* Incoming Relationships */}
          {incomingRelationships.length > 0 && (
            <div className="relationship-group">
              <h5 className="relationship-group-title">
                Incoming ({incomingRelationships.length})
              </h5>
              <ul className="relationship-list">
                {incomingRelationships.map((edge) => {
                  const sourceNode = graph.nodes.get(edge.sourceId);
                  return (
                    <li key={edge.id} className="relationship-item">
                      <span className="relationship-type" data-type={edge.type}>
                        {edge.type}
                      </span>
                      <span className="relationship-arrow">←</span>
                      <span className="relationship-element">
                        {sourceNode?.element.name || edge.sourceId}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Outgoing Relationships */}
          {outgoingRelationships.length > 0 && (
            <div className="relationship-group">
              <h5 className="relationship-group-title">
                Outgoing ({outgoingRelationships.length})
              </h5>
              <ul className="relationship-list">
                {outgoingRelationships.map((edge) => {
                  const targetNode = graph.nodes.get(edge.targetId);
                  return (
                    <li key={edge.id} className="relationship-item">
                      <span className="relationship-type" data-type={edge.type}>
                        {edge.type}
                      </span>
                      <span className="relationship-arrow">→</span>
                      <span className="relationship-element">
                        {targetNode?.element.name || edge.targetId}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {incomingRelationships.length === 0 && outgoingRelationships.length === 0 && (
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
              aria-label="Trace upstream influences"
              title="Show all elements that influence this element"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12L8 4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Trace Upstream
            </button>

            <button
              className="action-button"
              onClick={() => onTraceDownstream(selectedNodeId)}
              aria-label="Trace downstream impacts"
              title="Show all elements influenced by this element"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4L8 12M8 12L4 8M8 12L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Trace Downstream
            </button>

            {isStakeholder && onShowNetwork && (
              <button
                className="action-button"
                onClick={() => onShowNetwork(selectedNodeId)}
                aria-label="Show stakeholder network"
                title="Switch to radial layout centered on this stakeholder"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="2" fill="currentColor"/>
                  <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1" fill="none"/>
                  <circle cx="8" cy="3" r="1" fill="currentColor"/>
                  <circle cx="13" cy="8" r="1" fill="currentColor"/>
                  <circle cx="8" cy="13" r="1" fill="currentColor"/>
                  <circle cx="3" cy="8" r="1" fill="currentColor"/>
                </svg>
                Show Network
              </button>
            )}

            {onFocusOnElement && (
              <button
                className="action-button"
                onClick={() => onFocusOnElement(selectedNodeId)}
                aria-label="Focus on this element"
                title="Dim other elements to focus on this one"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M8 2V4M8 12V14M14 8H12M4 8H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Focus on Element
              </button>
            )}
          </div>
        </section>

        {/* Cross-Layer Navigation */}
        {renderCrossLayerLinks(selectedNode, graph)}
      </div>
    </div>
  );
};

/**
 * Render cross-layer navigation links
 */
function renderCrossLayerLinks(node: MotivationGraphNode, graph: MotivationGraph): React.ReactElement | null {
  const element = node.element;
  const crossLayerLinks: Array<{ label: string; targetId: string; targetName: string }> = [];

  // Extract cross-layer references from properties
  if (element.properties) {
    const props = element.properties;

    // Common cross-layer property patterns
    const patterns = [
      { key: 'realizesRequirement', label: 'Realizes Requirement' },
      { key: 'fulfillsGoal', label: 'Fulfills Goal' },
      { key: 'supports', label: 'Supports' },
      { key: 'relatedTo', label: 'Related To' },
      { key: 'influences', label: 'Influences' },
      { key: 'implements', label: 'Implements' },
      { key: 'uses', label: 'Uses' },
      { key: 'stakeholder', label: 'Stakeholder' },
      { key: 'persona', label: 'Persona' },
    ];

    for (const pattern of patterns) {
      const value = props[pattern.key];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(targetId => {
            const targetNode = graph.nodes.get(targetId);
            crossLayerLinks.push({
              label: pattern.label,
              targetId,
              targetName: targetNode?.element.name || targetId,
            });
          });
        } else if (typeof value === 'string') {
          const targetNode = graph.nodes.get(value);
          crossLayerLinks.push({
            label: pattern.label,
            targetId: value,
            targetName: targetNode?.element.name || value,
          });
        }
      }
    }
  }

  if (crossLayerLinks.length === 0) {
    return null;
  }

  return (
    <section className="inspector-section">
      <h4 className="section-title">Cross-Layer Links ({crossLayerLinks.length})</h4>
      <ul className="crosslayer-list">
        {crossLayerLinks.map((link, index) => (
          <li key={index} className="crosslayer-item">
            <span className="crosslayer-label">{link.label}:</span>
            <button
              className="crosslayer-link"
              onClick={() => {
                // TODO: Implement cross-layer navigation
                console.log(`Navigate to ${link.targetId} in other layer`);
              }}
              aria-label={`Navigate to ${link.targetName}`}
              title={`Navigate to ${link.targetName}`}
            >
              {link.targetName}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Format element type for display
 */
function formatElementType(type: string): string {
  // Convert from kebab-case or snake_case to Title Case
  return type
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
