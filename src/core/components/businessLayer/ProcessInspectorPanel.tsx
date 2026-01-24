/**
 * ProcessInspectorPanel Component
 *
 * Displays detailed information about the selected business process.
 * Note: This component is NOT refactored to use BaseInspectorPanel yet because it has a different
 * structure and edge types compared to Motivation and C4 layers.
 * It uses 'target' and 'source' instead of 'targetId' and 'sourceId'.
 * TODO: Refactor when BusinessLayer types are aligned with BaseInspectorPanel structure.
 */

import { useMemo, memo } from 'react';
import type { BusinessNode, BusinessGraph, CrossLayerLink } from '../../types/businessLayer';
import { getLayerColor, getLayerDisplayName } from '../../utils/layerColors';
import { Badge, Card, Button } from 'flowbite-react';
import { ArrowUp, ArrowDown, Target, X } from 'lucide-react';
import './ProcessInspectorPanel.css';

export interface ProcessInspectorPanelProps {
  selectedNode: BusinessNode | null;
  businessGraph: BusinessGraph | null;
  onTraceUpstream: () => void;
  onTraceDownstream: () => void;
  onIsolate: () => void;
  onNavigateToCrossLayer?: (layer: string, elementId: string) => void;
  onClose?: () => void;
}

function ProcessInspectorPanelComponent({
  selectedNode,
  businessGraph,
  onTraceUpstream,
  onTraceDownstream,
  onIsolate,
  onNavigateToCrossLayer,
  onClose,
}: ProcessInspectorPanelProps) {
  const upstreamCount = useMemo(() => {
    if (!selectedNode || !businessGraph) return 0;
    return Array.from(businessGraph.edges.values()).filter((e) => e.target === selectedNode.id).length;
  }, [selectedNode, businessGraph]);

  const downstreamCount = useMemo(() => {
    if (!selectedNode || !businessGraph) return 0;
    return Array.from(businessGraph.edges.values()).filter((e) => e.source === selectedNode.id).length;
  }, [selectedNode, businessGraph]);

  // Get cross-layer links for selected node
  const crossLayerLinks = useMemo<CrossLayerLink[]>(() => {
    if (!selectedNode || !businessGraph) return [];
    return businessGraph.crossLayerLinks.filter((link) => link.source === selectedNode.id);
  }, [selectedNode, businessGraph]);

  // Group cross-layer links by target layer
  const linksByLayer = useMemo(() => {
    const grouped = new Map<string, CrossLayerLink[]>();
    for (const link of crossLayerLinks) {
      const existing = grouped.get(link.targetLayer) || [];
      existing.push(link);
      grouped.set(link.targetLayer, existing);
    }
    return grouped;
  }, [crossLayerLinks]);

  if (!selectedNode) {
    return (
      <div
        className="process-inspector-panel"
        role="complementary"
        aria-label="Process Inspector"
        data-testid="process-inspector-panel"
      >
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inspector</h3>
          {onClose && (
            <Button color="gray" size="xs" onClick={onClose} pill data-testid="process-inspector-close">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-center p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">No element selected</p>
        </div>
      </div>
    );
  }

  const typeColorMap: Record<string, string> = {
    process: 'indigo',
    function: 'warning',
    service: 'purple',
    capability: 'success',
  };

  const typeColor = (typeColorMap[selectedNode.type] || 'gray') as any;

  return (
    <div
      className="process-inspector-panel"
      role="complementary"
      aria-label="Process Inspector"
      data-testid="process-inspector-panel"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedNode.name}</h3>
          <Badge color={typeColor} className="mt-1">
            {selectedNode.type}
          </Badge>
        </div>
        {onClose && (
          <Button color="gray" size="xs" onClick={onClose} pill data-testid="process-inspector-close">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Description */}
        {selectedNode.description && (
          <Card>
            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedNode.description}</p>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Metadata</h4>
          <div className="space-y-2">
            {selectedNode.metadata.owner && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Owner:</span>
                <span className="text-sm text-gray-900 dark:text-white">{selectedNode.metadata.owner}</span>
              </div>
            )}
            {selectedNode.metadata.criticality && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Criticality:</span>
                <Badge
                  color={
                    selectedNode.metadata.criticality === 'high'
                      ? 'failure'
                      : selectedNode.metadata.criticality === 'medium'
                        ? 'warning'
                        : 'success'
                  }
                >
                  {selectedNode.metadata.criticality}
                </Badge>
              </div>
            )}
            {selectedNode.metadata.lifecycle && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Lifecycle:</span>
                <span className="text-sm text-gray-900 dark:text-white">{selectedNode.metadata.lifecycle}</span>
              </div>
            )}
            {selectedNode.metadata.domain && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Domain:</span>
                <span className="text-sm text-gray-900 dark:text-white">{selectedNode.metadata.domain}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Relationships */}
        <Card>
          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Relationships</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Upstream:</span>
              <Badge color="info">{upstreamCount}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Downstream:</span>
              <Badge color="success">{downstreamCount}</Badge>
            </div>
            {selectedNode.metadata.subprocessCount && selectedNode.metadata.subprocessCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subprocesses:</span>
                <Badge color="warning">{selectedNode.metadata.subprocessCount}</Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Cross-Layer References */}
        {crossLayerLinks.length > 0 && (
          <Card>
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
                          {onNavigateToCrossLayer && (
                            <button
                              onClick={() => onNavigateToCrossLayer(link.targetLayer, link.target)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                              title={`Navigate to ${link.target}`}
                            >
                              View
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Quick Actions</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              color="gray"
              size="sm"
              onClick={onTraceUpstream}
              disabled={upstreamCount === 0}
              title="Show all processes that lead to this process"
            >
              <ArrowUp className="mr-2 w-4 h-4" />
              Trace Upstream
            </Button>
            <Button
              color="gray"
              size="sm"
              onClick={onTraceDownstream}
              disabled={downstreamCount === 0}
              title="Show all processes that follow this process"
            >
              <ArrowDown className="mr-2 w-4 h-4" />
              Trace Downstream
            </Button>
            <Button color="blue" size="sm" onClick={onIsolate} title="Isolate this process to focus on it">
              <Target className="mr-2 w-4 h-4" />
              Isolate Process
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export const ProcessInspectorPanel = memo(ProcessInspectorPanelComponent);
ProcessInspectorPanel.displayName = 'ProcessInspectorPanel';
