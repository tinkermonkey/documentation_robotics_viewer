/**
 * NodeDetailsPanel Component
 * Displays detailed information about a selected node
 * Used in Graph view right sidebar (conditionally rendered when node is selected)
 */

import React from 'react';
import { Info } from 'lucide-react';
import type { Node } from '@xyflow/react';
import type { MetaModel, Relationship } from '../../../core/types/model';
import type { BaseNodeData } from '../../../core/types/reactflow';

export interface NodeDetailsPanelProps {
  selectedNode: Node | null;
  model: MetaModel;
}

/**
 * Type guard to check if node data is BaseNodeData
 */
function isBaseNodeData(data: unknown): data is BaseNodeData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.label === 'string' &&
    typeof obj.stroke === 'string' &&
    typeof obj.fill === 'string' &&
    typeof obj.elementId === 'string' &&
    typeof obj.layerId === 'string'
  );
}

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ selectedNode, model }) => {
  if (!selectedNode) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm border-b border-gray-200">
        <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>Click on a node to view details</p>
      </div>
    );
  }

  // Count connections (edges) by iterating through all layers
  let incomingEdges = 0;
  let outgoingEdges = 0;

  Object.values(model.layers || {}).forEach((layer) => {
    layer.relationships?.forEach((rel: Relationship) => {
      if (rel.targetId === selectedNode.id) incomingEdges++;
      if (rel.sourceId === selectedNode.id) outgoingEdges++;
    });
  });

  // Extract node data with type safety
  const nodeData = isBaseNodeData(selectedNode.data) ? selectedNode.data : null;
  const nodeColor = nodeData?.stroke || '#999999';
  const nodeLabel = nodeData?.label || selectedNode.id;
  const nodeType = selectedNode.type || 'Unknown';

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-medium mb-3">Node Details</h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Name</p>
          <p className="text-sm text-gray-900">{nodeLabel}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Type</p>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: nodeColor }}
            />
            <p className="text-sm text-gray-900">{nodeType}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">ID</p>
          <p className="text-sm font-mono text-gray-600 break-all">{selectedNode.id}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Position</p>
          <p className="text-sm font-mono text-gray-600">
            ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Connections</p>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="text-gray-500">Incoming: </span>
              <span className="text-gray-700 font-medium">{incomingEdges}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500">Outgoing: </span>
              <span className="text-gray-700 font-medium">{outgoingEdges}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsPanel;
