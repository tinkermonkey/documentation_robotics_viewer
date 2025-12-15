/**
 * C4InspectorPanel Component
 *
 * Displays detailed information about the selected C4 element including:
 * - Complete metadata (name, description, type, technology stack)
 * - All incoming and outgoing relationships with protocols
 * - Quick action buttons: Trace Upstream, Trace Downstream, Drill Down
 * - Container-specific details (API endpoints, deployment info)
 */

import { C4Graph,  C4Type, ContainerType } from '../types/c4Graph';
import { Card, Badge, Button } from 'flowbite-react';
import { ArrowUp, ArrowDown, X, ZoomIn } from 'lucide-react';

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
              <span className="text-sm font-semibold">{selectedNode.name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
              <Badge color={typeConfig.color === '#1e40af' ? 'indigo' : typeConfig.color === '#166534' ? 'success' : 'gray'}>
                {typeConfig.label}
              </Badge>
            </div>

            {selectedNode.containerType && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Container Type:</span>
                <span className="text-sm">{CONTAINER_TYPE_LABELS[selectedNode.containerType]}</span>
              </div>
            )}

            {selectedNode.description && (
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                <p className="text-sm mt-1">{selectedNode.description}</p>
              </div>
            )}

            {selectedNode.technology.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Technology:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedNode.technology.map((tech) => (
                    <Badge key={tech} color="info" size="sm">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.boundary && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Boundary:</span>
                <Badge color={selectedNode.boundary === 'internal' ? 'success' : 'warning'}>
                  {selectedNode.boundary === 'internal' ? 'Internal' : 'External'}
                </Badge>
              </div>
            )}

            {parentContainer && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Parent Container:</span>
                <span className="text-sm">{parentContainer.name}</span>
              </div>
            )}

            {isContainer && componentCount > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Components:</span>
                <span className="text-sm">{componentCount} components</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Connections:</span>
              <span className="text-sm">
                {incomingEdges.length + outgoingEdges.length} total ({incomingEdges.length} in,{' '}
                {outgoingEdges.length} out)
              </span>
            </div>

            {selectedNode.changesetStatus && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Changeset:</span>
                <Badge color={
                  selectedNode.changesetStatus === 'new' ? 'success' :
                  selectedNode.changesetStatus === 'modified' ? 'warning' :
                  selectedNode.changesetStatus === 'deleted' ? 'failure' : 'gray'
                }>
                  {selectedNode.changesetStatus}
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Relationships */}
        <Card>
          <h4 className="text-lg font-semibold mb-3">
            Relationships ({incomingEdges.length + outgoingEdges.length})
          </h4>

          {/* Incoming Relationships */}
          {incomingEdges.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Incoming ({incomingEdges.length})
              </h5>
              <ul className="space-y-2">
                {incomingEdges.map((edge) => {
                  const sourceNode = graph.nodes.get(edge.sourceId);
                  return (
                    <li key={edge.id} className="text-sm border-l-2 border-blue-400 pl-2">
                      <Badge color="info" size="sm" className="mb-1">{edge.protocol}</Badge>
                      <div className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-gray-500" />
                        <span className="font-medium">{sourceNode?.name || edge.sourceId}</span>
                      </div>
                      {edge.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{edge.description}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Outgoing Relationships */}
          {outgoingEdges.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Outgoing ({outgoingEdges.length})
              </h5>
              <ul className="space-y-2">
                {outgoingEdges.map((edge) => {
                  const targetNode = graph.nodes.get(edge.targetId);
                  return (
                    <li key={edge.id} className="text-sm border-l-2 border-green-400 pl-2">
                      <Badge color="success" size="sm" className="mb-1">{edge.protocol}</Badge>
                      <div className="flex items-center gap-1">
                        <ArrowDown className="h-3 w-3 text-gray-500" />
                        <span className="font-medium">{targetNode?.name || edge.targetId}</span>
                      </div>
                      {edge.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{edge.description}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {incomingEdges.length === 0 && outgoingEdges.length === 0 && (
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
              title="Show all containers that this element depends on"
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Trace Upstream
            </Button>

            <Button
              color="gray"
              size="sm"
              onClick={() => onTraceDownstream(selectedNodeId)}
              title="Show all containers that depend on this element"
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Trace Downstream
            </Button>

            {isContainer && onDrillDown && componentCount > 0 && (
              <Button
                color="blue"
                size="sm"
                onClick={() => onDrillDown(selectedNodeId)}
                title={`View ${componentCount} components in this container`}
              >
                <ZoomIn className="mr-2 h-4 w-4" />
                Drill Down ({componentCount})
              </Button>
            )}
          </div>
        </Card>

        {/* Source Element Reference */}
        {selectedNode.sourceElement && (
          <Card>
            <h4 className="text-lg font-semibold mb-3">Source Element</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID:</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {selectedNode.sourceElement.id}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Element Type:</span>
                <span className="text-sm">{selectedNode.sourceElement.type}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default C4InspectorPanel;
