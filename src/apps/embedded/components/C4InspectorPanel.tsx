/**
 * C4InspectorPanel Component
 *
 * Displays detailed information about the selected C4 element.
 * Uses BaseInspectorPanel for shared structure with domain-specific adapters.
 */

import { memo } from 'react';
import { BaseInspectorPanel } from '@/core/components/base/BaseInspectorPanel';
import type { QuickAction } from '@/core/components/base';
import { C4Graph, C4Type, ContainerType } from '../types/c4Graph';
import type { C4Node, C4Edge } from '../types/c4Graph';
import { Badge } from 'flowbite-react';
import { ArrowUp, ArrowDown, ZoomIn } from 'lucide-react';

export interface C4InspectorPanelProps {
  /** Selected node ID */
  selectedNodeId: string | null;

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
 * C4 Type labels
 */
const C4_TYPE_CONFIG: Record<C4Type, { label: string; badgeColor: string }> = {
  [C4Type.System]: { label: 'System', badgeColor: 'indigo' },
  [C4Type.Container]: { label: 'Container', badgeColor: 'success' },
  [C4Type.Component]: { label: 'Component', badgeColor: 'warning' },
  [C4Type.External]: { label: 'External', badgeColor: 'gray' },
  [C4Type.Deployment]: { label: 'Deployment', badgeColor: 'purple' },
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
 * Render element details for C4 layer
 */
// @ts-ignore - Type constraint complexity with C4Node missing index signature
function renderC4ElementDetails(node: C4Node): React.ReactNode {
  const typeConfig = C4_TYPE_CONFIG[node.c4Type];

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
        <span className="text-sm font-semibold">{node.name}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
        <Badge color={typeConfig.badgeColor as any}>{typeConfig.label}</Badge>
      </div>

      {node.containerType && (
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Container Type:</span>
          <span className="text-sm">{CONTAINER_TYPE_LABELS[node.containerType]}</span>
        </div>
      )}

      {node.description && (
        <div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
          <p className="text-sm mt-1">{node.description}</p>
        </div>
      )}

      {node.technology.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Technology:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {node.technology.map((tech) => (
              <Badge key={tech} color="info" size="sm">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {node.boundary && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Boundary:</span>
          <Badge color={node.boundary === 'internal' ? 'success' : 'warning'}>
            {node.boundary === 'internal' ? 'Internal' : 'External'}
          </Badge>
        </div>
      )}

      {node.sourceElement && (
        <div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Source Element:</span>
          <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 space-y-1">
            <div className="flex justify-between">
              <span>ID:</span>
              <code>{node.sourceElement.id}</code>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <code>{node.sourceElement.type}</code>
            </div>
          </div>
        </div>
      )}

      {node.changesetStatus && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Changeset:</span>
          <Badge
            color={
              node.changesetStatus === 'new'
                ? 'success'
                : node.changesetStatus === 'modified'
                  ? 'warning'
                  : node.changesetStatus === 'deleted'
                    ? 'failure'
                    : 'gray'
            }
          >
            {node.changesetStatus}
          </Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Render relationship badge for C4
 */
function renderC4RelationshipBadge(edge: C4Edge): React.ReactNode {
  return (
    <>
      <Badge color="info" size="sm" className="mb-1">
        {edge.protocol}
      </Badge>
      {edge.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{edge.description}</p>
      )}
    </>
  );
}

/**
 * Create quick actions for C4 inspector
 */
// @ts-ignore - QuickAction constraint issue with C4Node missing index signature
function createC4QuickActions(
  selectedNodeId: string | null,
  node: C4Node | null,
  graph: C4Graph,
  callbacks: {
    onTraceUpstream: (nodeId: string) => void;
    onTraceDownstream: (nodeId: string) => void;
    onDrillDown?: (nodeId: string) => void;
  }
): QuickAction<C4Node>[] {
  if (!selectedNodeId || !node) return [];

  const isContainer = node.c4Type === C4Type.Container;
  const componentIds = graph.indexes.containerComponents.get(selectedNodeId);
  const componentCount = componentIds?.size || 0;

  return [
    {
      id: 'trace-upstream',
      title: 'Trace Upstream',
      icon: <ArrowUp className="w-4 h-4" />,
      onClick: () => callbacks.onTraceUpstream(selectedNodeId),
      description: 'Show all containers that this element depends on',
    },
    {
      id: 'trace-downstream',
      title: 'Trace Downstream',
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: () => callbacks.onTraceDownstream(selectedNodeId),
      description: 'Show all containers that depend on this element',
    },
    {
      id: 'drill-down',
      title: `Drill Down (${componentCount})`,
      icon: <ZoomIn className="w-4 h-4" />,
      color: 'blue',
      onClick: () => callbacks.onDrillDown?.(selectedNodeId),
      condition: () => isContainer && !!callbacks.onDrillDown && componentCount > 0,
      description: `View ${componentCount} components in this container`,
    },
  ];
}

/**
 * C4InspectorPanel Component
 */
function C4InspectorPanelComponent({
  selectedNodeId,
  graph,
  onTraceUpstream,
  onTraceDownstream,
  onDrillDown,
  onClose,
}: C4InspectorPanelProps) {
  const selectedNode = selectedNodeId ? graph.nodes.get(selectedNodeId) || null : null;

  const quickActions = createC4QuickActions(selectedNodeId, selectedNode || null, graph, {
    onTraceUpstream,
    onTraceDownstream,
    onDrillDown,
  });

  return (
    <BaseInspectorPanel<any, any, any>
      selectedNodeId={selectedNodeId}
      graph={graph as any}
      onClose={onClose}
      renderElementDetails={renderC4ElementDetails}
      renderRelationshipBadge={renderC4RelationshipBadge}
      getNodeName={(node) => node.name}
      getEdgeType={(edge) => edge.protocol}
      quickActions={quickActions}
      title="Inspector"
      testId="c4-inspector-panel"
    />
  );
}

export const C4InspectorPanel = memo(C4InspectorPanelComponent);
C4InspectorPanel.displayName = 'C4InspectorPanel';

export default C4InspectorPanel;
