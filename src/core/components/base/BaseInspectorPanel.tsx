/**
 * BaseInspectorPanel Component
 *
 * Generic base component that consolidates shared UI structure for inspector panels.
 * Provides header, element details card, relationships list, quick actions, and optional cross-layer links.
 *
 * Supports both Map-based and array-based graph structures through generic type parameters.
 */

import { memo } from 'react';
import { Card, Badge, Button } from 'flowbite-react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import type { BaseGraph, BaseNode, BaseEdge, QuickAction } from './types';
import { wrapRenderProp, wrapRenderProp2 } from './RenderPropErrorBoundary';

export interface BaseInspectorPanelProps<
  TGraph extends BaseGraph<TNode, TEdge>,
  TNode extends BaseNode,
  TEdge extends BaseEdge
> {
  /** Selected node ID */
  selectedNodeId: string | null;

  /** Graph data source */
  graph: TGraph;

  /** Close handler */
  onClose: () => void;

  // Render props for domain-specific content
  /** Render element details section */
  renderElementDetails: (node: TNode) => React.ReactNode;

  /** Render relationship badge content (optional, defaults to edge type) */
  renderRelationshipBadge?: (edge: TEdge) => React.ReactNode;

  /** Get display name for a node */
  getNodeName: (node: TNode) => string;

  /** Get edge relationship type for display */
  getEdgeType: (edge: TEdge) => string;

  /** Quick actions configuration */
  quickActions?: QuickAction<TNode>[];

  /** Optional cross-layer links renderer */
  renderCrossLayerLinks?: (node: TNode, graph: TGraph) => React.ReactNode;

  /** Panel title (default: "Inspector") */
  title?: string;

  /** CSS class for domain-specific styling */
  className?: string;

  /** data-testid for E2E tests (default: "inspector-panel") */
  testId?: string;
}

/**
 * BaseInspectorPanel - Generic inspector panel component
 *
 * Type parameters:
 * - TGraph: The graph structure type (must extend BaseGraph)
 * - TNode: The node type (must extend BaseNode)
 * - TEdge: The edge type (must extend BaseEdge)
 */
function BaseInspectorPanelComponent<
  TGraph extends BaseGraph<TNode, TEdge>,
  TNode extends BaseNode,
  TEdge extends BaseEdge
>(props: BaseInspectorPanelProps<TGraph, TNode, TEdge>) {
    const {
      selectedNodeId,
      graph,
      onClose,
      renderElementDetails,
      renderRelationshipBadge,
      getNodeName,
      getEdgeType,
      quickActions,
      renderCrossLayerLinks,
      title = 'Inspector',
      className = '',
      testId = 'inspector-panel',
    } = props;

    // Get selected node with proper null-safety
    const selectedNode = selectedNodeId && graph?.nodes ? graph.nodes.get(selectedNodeId) ?? null : null;

    // Distinguish between "no selection" and "invalid selection"
    // Case 1: No selection (user hasn't selected anything)
    if (!selectedNodeId) {
      return (
        <div data-testid={testId} className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`} role="region" aria-label={title}>
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <Button color="gray" size="xs" onClick={onClose} pill data-testid={`${testId}-close-button`} aria-label="Close inspector">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Empty State */}
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">No element selected</p>
          </div>
        </div>
      );
    }

    // Case 2: Invalid selection (selectedNodeId exists but node doesn't in graph)
    if (!selectedNode) {
      // Log the error for debugging race conditions, graph corruption, type coercion errors
      console.warn(
        `[BaseInspectorPanel] Invalid node ID: "${selectedNodeId}" not found in graph. ` +
        'This may indicate: (1) invalid node ID passed from parent, (2) graph data corruption, ' +
        '(3) race condition where node was deleted between selection and rendering, or (4) type coercion error.'
      );

      return (
        <div data-testid={testId} className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`} role="region" aria-label={title}>
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <Button color="gray" size="xs" onClick={onClose} pill data-testid={`${testId}-close-button`} aria-label="Close inspector">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Error State */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Element not found</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {selectedNodeId}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Check browser console for details</p>
          </div>
        </div>
      );
    }

    // Get incoming and outgoing edges
    const incomingEdges = (graph?.edges ? Array.from(graph.edges.values()) : []).filter(
      (edge) => edge.targetId === selectedNodeId
    );
    const outgoingEdges = (graph?.edges ? Array.from(graph.edges.values()) : []).filter(
      (edge) => edge.sourceId === selectedNodeId
    );

    return (
      <div data-testid={testId} className={`flex flex-col h-full bg-white dark:bg-gray-900 overflow-y-auto ${className}`} role="region" aria-label={title}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <Button color="gray" size="xs" onClick={onClose} pill data-testid={`${testId}-close-button`} aria-label="Close inspector">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Element Details Card */}
          <Card data-testid={`${testId}-element-details-card`}>
            <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Element Details</h4>
            {wrapRenderProp(renderElementDetails, selectedNode, 'renderElementDetails')}
          </Card>

          {/* Relationships Card */}
          <Card data-testid={`${testId}-relationships-card`}>
            <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
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
                    const sourceNode = graph?.nodes?.get(edge.sourceId) ?? null;
                    return (
                      <li key={edge.id} className="text-sm border-l-2 border-blue-400 pl-2">
                        {renderRelationshipBadge ? (
                          wrapRenderProp(renderRelationshipBadge, edge, 'renderRelationshipBadge')
                        ) : (
                          <Badge color="info" size="sm" className="mb-1">
                            {getEdgeType(edge)}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <ArrowUp className="w-3 h-3 text-gray-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {sourceNode ? getNodeName(sourceNode) : edge.sourceId}
                          </span>
                        </div>
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
                    const targetNode = graph?.nodes?.get(edge.targetId) ?? null;
                    return (
                      <li key={edge.id} className="text-sm border-l-2 border-green-400 pl-2">
                        {renderRelationshipBadge ? (
                          wrapRenderProp(renderRelationshipBadge, edge, 'renderRelationshipBadge')
                        ) : (
                          <Badge color="success" size="sm" className="mb-1">
                            {getEdgeType(edge)}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <ArrowDown className="w-3 h-3 text-gray-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {targetNode ? getNodeName(targetNode) : edge.targetId}
                          </span>
                        </div>
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

          {/* Quick Actions Card */}
          {quickActions && quickActions.length > 0 && (
            <Card data-testid={`${testId}-quick-actions-card`}>
              <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Quick Actions</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickActions
                  .filter((action) => !action.condition || action.condition(selectedNode))
                  .map((action) => (
                    <Button
                      key={action.id}
                      color={action.color || 'gray'}
                      size="sm"
                      onClick={() => action.onClick(selectedNode)}
                      title={action.description}
                      data-testid={action.testId || `${testId}-quick-action-${action.id}`}
                      className="justify-start"
                    >
                      {action.icon && <span className="mr-2 inline-block w-4 h-4">{action.icon}</span>}
                      {action.title}
                    </Button>
                  ))}
              </div>
            </Card>
          )}

          {/* Cross-Layer Links Card (optional) */}
          {(() => {
            if (!renderCrossLayerLinks) return null;
            const crossLayerContent = wrapRenderProp2(renderCrossLayerLinks, selectedNode, graph, 'renderCrossLayerLinks');
            return crossLayerContent ? (
              <Card data-testid={`${testId}-cross-layer-links-card`}>
                {crossLayerContent}
              </Card>
            ) : null;
          })()}
        </div>
      </div>
    );
}

export const BaseInspectorPanel = memo(
  BaseInspectorPanelComponent
) as typeof BaseInspectorPanelComponent & { displayName: string };

BaseInspectorPanel.displayName = 'BaseInspectorPanel';
