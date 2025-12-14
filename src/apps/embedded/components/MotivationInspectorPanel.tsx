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
import { Card, Badge, Button } from 'flowbite-react';
import { ArrowUp, ArrowDown, X, Share2, Eye } from 'lucide-react';

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
        <Button color="gray" size="xs" onClick={onClose} pill>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="inspector-content">
        {/* Element Metadata */}
        <Card>
          <h4 className="text-lg font-semibold mb-3">Element Details</h4>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
              <span className="text-sm font-semibold">{element.name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
              <Badge color="indigo">
                {formatElementType(element.type)}
              </Badge>
            </div>

            {!!!!element.properties?.description && (
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                <p className="text-sm mt-1">{String(element.properties.description)}</p>
              </div>
            )}

            {/* Type-specific properties */}
            {element.type === MotivationElementType.Goal && !!!!element.properties?.priority && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority:</span>
                <Badge color={
                  String(element.properties.priority).toLowerCase() === 'high' ? 'failure' :
                  String(element.properties.priority).toLowerCase() === 'medium' ? 'warning' :
                  'gray'
                }>
                  {String(element.properties.priority)}
                </Badge>
              </div>
            )}

            {element.type === MotivationElementType.Requirement && !!!!element.properties?.priority && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority:</span>
                <Badge color={
                  String(element.properties.priority).toLowerCase() === 'high' ? 'failure' :
                  String(element.properties.priority).toLowerCase() === 'medium' ? 'warning' :
                  'gray'
                }>
                  {String(element.properties.priority)}
                </Badge>
              </div>
            )}

            {element.type === MotivationElementType.Requirement && !!!!element.properties?.status && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <Badge color={
                  String(element.properties.status).toLowerCase() === 'complete' ? 'success' :
                  String(element.properties.status).toLowerCase() === 'in progress' ? 'warning' :
                  'gray'
                }>
                  {String(element.properties.status)}
                </Badge>
              </div>
            )}

            {element.type === MotivationElementType.Constraint && !!!!element.properties?.negotiability && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Negotiability:</span>
                <span className="text-sm">{String(element.properties.negotiability)}</span>
              </div>
            )}

            {element.type === MotivationElementType.Driver && !!!!element.properties?.category && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Category:</span>
                <span className="text-sm">{String(element.properties.category)}</span>
              </div>
            )}

            {element.type === MotivationElementType.Outcome && !!element.properties?.achievementStatus && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Achievement Status:</span>
                <Badge color={
                  String(element.properties.achievementStatus).toLowerCase() === 'achieved' ? 'success' :
                  String(element.properties.achievementStatus).toLowerCase() === 'in progress' ? 'warning' :
                  'gray'
                }>
                  {String(element.properties.achievementStatus)}
                </Badge>
              </div>
            )}

            {/* Graph Metrics */}
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Connections:</span>
              <span className="text-sm">
                {selectedNode.metrics.degreeCentrality} total ({selectedNode.metrics.inDegree} in, {selectedNode.metrics.outDegree} out)
              </span>
            </div>

            {selectedNode.metrics.influenceDepth > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Influence Depth:</span>
                <span className="text-sm">{selectedNode.metrics.influenceDepth} levels</span>
              </div>
            )}
          </div>
        </Card>

        {/* Relationships */}
        <Card>
          <h4 className="text-lg font-semibold mb-3">
            Relationships ({incomingRelationships.length + outgoingRelationships.length})
          </h4>

          {/* Incoming Relationships */}
          {incomingRelationships.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Incoming ({incomingRelationships.length})
              </h5>
              <ul className="space-y-2">
                {incomingRelationships.map((edge) => {
                  const sourceNode = graph.nodes.get(edge.sourceId);
                  return (
                    <li key={edge.id} className="text-sm border-l-2 border-blue-400 pl-2">
                      <Badge color="info" size="sm" className="mb-1">
                        {edge.type}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-gray-500" />
                        <span className="font-medium">
                          {sourceNode?.element.name || edge.sourceId}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Outgoing Relationships */}
          {outgoingRelationships.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Outgoing ({outgoingRelationships.length})
              </h5>
              <ul className="space-y-2">
                {outgoingRelationships.map((edge) => {
                  const targetNode = graph.nodes.get(edge.targetId);
                  return (
                    <li key={edge.id} className="text-sm border-l-2 border-green-400 pl-2">
                      <Badge color="success" size="sm" className="mb-1">
                        {edge.type}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <ArrowDown className="h-3 w-3 text-gray-500" />
                        <span className="font-medium">
                          {targetNode?.element.name || edge.targetId}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {incomingRelationships.length === 0 && outgoingRelationships.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No relationships</p>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h4 className="text-lg font-semibold mb-3">Quick Actions</h4>

          <div className="flex flex-col gap-2">
            <Button
              color="gray"
              size="sm"
              onClick={() => onTraceUpstream(selectedNodeId)}
              title="Show all elements that influence this element"
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Trace Upstream
            </Button>

            <Button
              color="gray"
              size="sm"
              onClick={() => onTraceDownstream(selectedNodeId)}
              title="Show all elements influenced by this element"
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Trace Downstream
            </Button>

            {isStakeholder && onShowNetwork && (
              <Button
                color="blue"
                size="sm"
                onClick={() => onShowNetwork(selectedNodeId)}
                title="Switch to radial layout centered on this stakeholder"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Show Network
              </Button>
            )}

            {onFocusOnElement && (
              <Button
                color="gray"
                size="sm"
                onClick={() => onFocusOnElement(selectedNodeId)}
                title="Dim other elements to focus on this one"
              >
                <Eye className="mr-2 h-4 w-4" />
                Focus on Element
              </Button>
            )}
          </div>
        </Card>

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
