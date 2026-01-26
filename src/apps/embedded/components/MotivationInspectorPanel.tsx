/**
 * MotivationInspectorPanel Component
 *
 * Displays detailed information about the selected motivation element.
 * Uses BaseInspectorPanel for shared structure with domain-specific adapters.
 */

import { memo } from 'react';
import { BaseInspectorPanel } from '@/core/components/base/BaseInspectorPanel';
import type { QuickAction } from '@/core/components/base';
import { MotivationGraph, MotivationGraphNode, MotivationGraphEdge, MotivationElementType } from '../types/motivationGraph';
import { Badge } from 'flowbite-react';
import { ArrowUp, ArrowDown, Share2, Eye } from 'lucide-react';

export interface MotivationInspectorPanelProps {
  /** Selected node ID */
  selectedNodeId: string | null;

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
 * Render element details for Motivation layer
 */
function renderMotivationElementDetails(node: MotivationGraphNode): React.ReactNode | null {
  const element = node.element;

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
        <span className="text-sm font-semibold">{element.name}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
        <Badge color="indigo">{formatElementType(element.type)}</Badge>
      </div>

      {element.properties?.description ? (
        <div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
          <p className="text-sm mt-1">{String(element.properties.description)}</p>
        </div>
      ) : null}

      {/* Type-specific properties */}
      {(element.type === MotivationElementType.Goal || element.type === MotivationElementType.Requirement) &&
      element.properties?.priority ? (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority:</span>
          <Badge color={getPriorityBadgeColor(String(element.properties.priority))}>
            {String(element.properties.priority)}
          </Badge>
        </div>
      ) : null}

      {element.type === MotivationElementType.Requirement && element.properties?.status ? (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
          <Badge
            color={
              String(element.properties.status).toLowerCase() === 'complete'
                ? 'success'
                : String(element.properties.status).toLowerCase() === 'in progress'
                  ? 'warning'
                  : 'gray'
            }
          >
            {String(element.properties.status)}
          </Badge>
        </div>
      ) : null}

      {element.type === MotivationElementType.Constraint && element.properties?.negotiability ? (
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Negotiability:</span>
          <span className="text-sm">{String(element.properties.negotiability)}</span>
        </div>
      ) : null}

      {element.type === MotivationElementType.Driver && element.properties?.category ? (
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Category:</span>
          <span className="text-sm">{String(element.properties.category)}</span>
        </div>
      ) : null}

      {element.type === MotivationElementType.Outcome && element.properties?.achievementStatus ? (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Achievement Status:</span>
          <Badge
            color={
              String(element.properties.achievementStatus).toLowerCase() === 'achieved'
                ? 'success'
                : String(element.properties.achievementStatus).toLowerCase() === 'in progress'
                  ? 'warning'
                  : 'gray'
            }
          >
            {String(element.properties.achievementStatus)}
          </Badge>
        </div>
      ) : null}

      {/* Graph Metrics */}
      <div className="flex justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Connections:</span>
        <span className="text-sm">
          {node.metrics.degreeCentrality} total ({node.metrics.inDegree} in, {node.metrics.outDegree} out)
        </span>
      </div>

      {node.metrics.influenceDepth > 0 ? (
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Influence Depth:</span>
          <span className="text-sm">{node.metrics.influenceDepth} levels</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Render cross-layer navigation links
 */
function renderMotivationCrossLayerLinks(
  node: MotivationGraphNode,
  graph: MotivationGraph
): React.ReactNode {
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
          value.forEach((targetId) => {
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
    <>
      <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        Cross-Layer Links ({crossLayerLinks.length})
      </h4>
      <ul className="space-y-2">
        {crossLayerLinks.map((link, index) => (
          <li key={index} className="text-sm border-l-2 border-purple-400 pl-2">
            <div className="flex justify-between items-start">
              <span className="font-medium text-gray-900 dark:text-white">{link.label}:</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {link.targetName}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Create quick actions for Motivation inspector
 */
function createQuickActions(
  selectedNodeId: string | null,
  node: MotivationGraphNode | null,
  callbacks: {
    onTraceUpstream: (nodeId: string) => void;
    onTraceDownstream: (nodeId: string) => void;
    onShowNetwork?: (nodeId: string) => void;
    onFocusOnElement?: (nodeId: string) => void;
  }
): QuickAction<MotivationGraphNode>[] {
  if (!selectedNodeId || !node) return [];

  const isStakeholder = node.element.type === MotivationElementType.Stakeholder;

  return [
    {
      id: 'trace-upstream',
      title: 'Trace Upstream',
      icon: <ArrowUp className="w-4 h-4" />,
      onClick: () => callbacks.onTraceUpstream(selectedNodeId),
      description: 'Show all elements that influence this element',
    },
    {
      id: 'trace-downstream',
      title: 'Trace Downstream',
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: () => callbacks.onTraceDownstream(selectedNodeId),
      description: 'Show all elements influenced by this element',
    },
    {
      id: 'show-network',
      title: 'Show Network',
      icon: <Share2 className="w-4 h-4" />,
      color: 'blue',
      onClick: () => callbacks.onShowNetwork?.(selectedNodeId),
      condition: () => isStakeholder && !!callbacks.onShowNetwork,
      description: 'Switch to radial layout centered on this stakeholder',
    },
    {
      id: 'focus-element',
      title: 'Focus on Element',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => callbacks.onFocusOnElement?.(selectedNodeId),
      condition: () => !!callbacks.onFocusOnElement,
      description: 'Dim other elements to focus on this one',
    },
  ];
}

/**
 * Get priority badge color based on priority level
 */
function getPriorityBadgeColor(priority: string): 'failure' | 'warning' | 'gray' {
  const normalized = priority.toLowerCase();
  if (normalized === 'high') return 'failure';
  if (normalized === 'medium') return 'warning';
  return 'gray';
}

/**
 * Format element type for display
 */
function formatElementType(type: string): string {
  return type
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * MotivationInspectorPanel Component
 */
function MotivationInspectorPanelComponent({
  selectedNodeId,
  graph,
  onTraceUpstream,
  onTraceDownstream,
  onShowNetwork,
  onFocusOnElement,
  onClose,
}: MotivationInspectorPanelProps) {
  const selectedNode = selectedNodeId ? graph.nodes.get(selectedNodeId) || null : null;

  const quickActions = createQuickActions(selectedNodeId, selectedNode || null, {
    onTraceUpstream,
    onTraceDownstream,
    onShowNetwork,
    onFocusOnElement,
  });

  return (
    <BaseInspectorPanel<MotivationGraph, MotivationGraphNode, MotivationGraphEdge>
      selectedNodeId={selectedNodeId}
      graph={graph}
      onClose={onClose}
      renderElementDetails={renderMotivationElementDetails}
      getNodeName={(node) => node.element.name}
      getEdgeType={(edge) => edge.type}
      renderCrossLayerLinks={renderMotivationCrossLayerLinks}
      quickActions={quickActions}
      title="Inspector"
      testId="motivation-inspector-panel"
    />
  );
}

export const MotivationInspectorPanel = memo(MotivationInspectorPanelComponent);
MotivationInspectorPanel.displayName = 'MotivationInspectorPanel';
