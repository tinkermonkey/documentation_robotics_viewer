/**
 * ProcessInspectorPanel Component
 *
 * Displays detailed information about the selected business process.
 * Uses BaseInspectorPanel for shared structure with domain-specific adapters.
 */

import { memo } from 'react';
import { BaseInspectorPanel } from '@/core/components/base/BaseInspectorPanel';
import type { QuickAction } from '@/core/components/base';
import type { BusinessNode, BusinessGraph, BusinessEdge } from '../../types/businessLayer';
import { getLayerColor, getLayerDisplayName } from '../../utils/layerColors';
import { Badge } from 'flowbite-react';
import { ArrowUp, ArrowDown, Target } from 'lucide-react';

export interface ProcessInspectorPanelProps {
  selectedNode: BusinessNode | null;
  businessGraph: BusinessGraph | null;
  onTraceUpstream: () => void;
  onTraceDownstream: () => void;
  onIsolate: () => void;
  onNavigateToCrossLayer?: (layer: string, elementId: string) => void;
  onClose?: () => void;
}

/**
 * Get criticality badge color based on criticality level
 */
function getCriticalityBadgeColor(criticality: string): 'failure' | 'warning' | 'success' {
  if (criticality === 'high') return 'failure';
  if (criticality === 'medium') return 'warning';
  return 'success';
}

/**
 * Render element details for Business/Process layer
 */
function renderProcessElementDetails(node: BusinessNode): React.ReactNode {
  const typeColorMap: Record<string, string> = {
    process: 'indigo',
    function: 'warning',
    service: 'purple',
    capability: 'success',
  };

  const typeColor = (typeColorMap[node.type] || 'gray') as any; // Flowbite Badge color type

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
        <span className="text-sm font-semibold">{node.name}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
        <Badge color={typeColor}>{node.type}</Badge>
      </div>

      {node.description && (
        <div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
          <p className="text-sm mt-1">{node.description}</p>
        </div>
      )}

      {node.metadata.owner && (
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Owner:</span>
          <span className="text-sm text-gray-900 dark:text-white">{node.metadata.owner}</span>
        </div>
      )}

      {node.metadata.criticality && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Criticality:</span>
          <Badge color={getCriticalityBadgeColor(node.metadata.criticality)}>
            {node.metadata.criticality}
          </Badge>
        </div>
      )}

      {node.metadata.lifecycle && (
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Lifecycle:</span>
          <span className="text-sm text-gray-900 dark:text-white">{node.metadata.lifecycle}</span>
        </div>
      )}

      {node.metadata.domain && (
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Domain:</span>
          <span className="text-sm text-gray-900 dark:text-white">{node.metadata.domain}</span>
        </div>
      )}

      {node.metadata.subprocessCount && node.metadata.subprocessCount > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subprocesses:</span>
          <Badge color="warning">{node.metadata.subprocessCount}</Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Render cross-layer links for Business layer
 */
function renderProcessCrossLayerLinks(
  node: BusinessNode,
  graph: BusinessGraph
): React.ReactNode {
  const crossLayerLinks = graph.crossLayerLinks.filter((link) => link.source === node.id);

  if (crossLayerLinks.length === 0) {
    return null;
  }

  // Group by target layer
  const linksByLayer = new Map<string, typeof crossLayerLinks>();
  for (const link of crossLayerLinks) {
    const existing = linksByLayer.get(link.targetLayer) || [];
    existing.push(link);
    linksByLayer.set(link.targetLayer, existing);
  }

  return (
    <>
      <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        Cross-Layer References ({crossLayerLinks.length})
      </h4>
      <div className="space-y-3">
        {Array.from(linksByLayer.entries()).map(([layerId, links]) => (
          <div key={layerId} className="border-l-2 pl-3" style={{ borderColor: getLayerColor(layerId) }}>
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {getLayerDisplayName(layerId)} ({links.length})
            </h5>
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.target} className="text-xs">
                  <div className="flex justify-between items-center gap-1">
                    <Badge color="gray" size="sm">
                      {link.type}
                    </Badge>
                    <button
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                      title={`Navigate to ${link.target}`}
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Create quick actions for Process inspector
 */
function createProcessQuickActions(
  selectedNode: BusinessNode | null,
  businessGraph: BusinessGraph | null,
  callbacks: {
    onTraceUpstream: () => void;
    onTraceDownstream: () => void;
    onIsolate: () => void;
  }
): QuickAction<BusinessNode>[] {
  if (!selectedNode || !businessGraph) return [];

  const upstreamCount = Array.from(businessGraph.edges.values()).filter(
    (e) => e.target === selectedNode.id
  ).length;

  const downstreamCount = Array.from(businessGraph.edges.values()).filter(
    (e) => e.source === selectedNode.id
  ).length;

  return [
    {
      id: 'trace-upstream',
      title: 'Trace Upstream',
      icon: <ArrowUp className="w-4 h-4" />,
      onClick: () => callbacks.onTraceUpstream(),
      description: 'Show all processes that lead to this process',
      condition: () => upstreamCount > 0,
    },
    {
      id: 'trace-downstream',
      title: 'Trace Downstream',
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: () => callbacks.onTraceDownstream(),
      description: 'Show all processes that follow this process',
      condition: () => downstreamCount > 0,
    },
    {
      id: 'isolate',
      title: 'Isolate Process',
      icon: <Target className="w-4 h-4" />,
      onClick: () => callbacks.onIsolate(),
      color: 'blue',
      description: 'Isolate this process to focus on it',
    },
  ];
}

/**
 * Adapter graph for BaseInspectorPanel compatibility
 * Converts BusinessEdge (source/target) to BaseEdge (sourceId/targetId)
 */
function adaptBusinessGraph(graph: BusinessGraph): BusinessGraph & {
  edges: Map<string, BusinessEdge & { sourceId: string; targetId: string }>;
} {
  const adaptedEdges = new Map<string, BusinessEdge & { sourceId: string; targetId: string }>();

  for (const [id, edge] of graph.edges) {
    adaptedEdges.set(id, {
      ...edge,
      sourceId: edge.source,
      targetId: edge.target,
    });
  }

  return {
    ...graph,
    edges: adaptedEdges,
  };
}

/**
 * ProcessInspectorPanel Component
 */
function ProcessInspectorPanelComponent({
  selectedNode,
  businessGraph,
  onTraceUpstream,
  onTraceDownstream,
  onIsolate,
  onClose,
}: ProcessInspectorPanelProps) {
  if (!selectedNode || !businessGraph) {
    return (
      <div
        className="flex flex-col h-full bg-white dark:bg-gray-900"
        role="complementary"
        aria-label="Process Inspector"
        data-testid="process-inspector-panel"
      >
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inspector</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              data-testid="process-inspector-close"
              aria-label="Close inspector"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">No element selected</p>
        </div>
      </div>
    );
  }

  const adaptedGraph = adaptBusinessGraph(businessGraph);
  const selectedNodeId = selectedNode.id;

  const quickActions = createProcessQuickActions(selectedNode, businessGraph, {
    onTraceUpstream,
    onTraceDownstream,
    onIsolate,
  });

  return (
    <BaseInspectorPanel<any, any, any>
      selectedNodeId={selectedNodeId}
      graph={adaptedGraph as any} // Graph type conversion: BusinessGraph satisfies BaseGraph interface
      onClose={onClose ?? (() => {})} // Use nullish coalescing to handle optional onClose
      renderElementDetails={renderProcessElementDetails}
      getNodeName={(node) => node.name}
      getEdgeType={(edge) => edge.type}
      renderCrossLayerLinks={(node) => renderProcessCrossLayerLinks(node, businessGraph)}
      quickActions={quickActions}
      title="Inspector"
      testId="process-inspector-panel"
    />
  );
}

export const ProcessInspectorPanel = memo(ProcessInspectorPanelComponent);
ProcessInspectorPanel.displayName = 'ProcessInspectorPanel';
