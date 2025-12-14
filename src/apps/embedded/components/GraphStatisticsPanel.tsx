/**
 * GraphStatisticsPanel Component
 * Displays graph-level statistics (nodes, edges, layers)
 * Used in Graph view right sidebar as a footer section
 */

import React, { useMemo } from 'react';
import type { MetaModel } from '../../../core/types/model';

export interface GraphStatisticsPanelProps {
  model: MetaModel;
}

const GraphStatisticsPanel: React.FC<GraphStatisticsPanelProps> = ({ model }) => {
  // Calculate statistics from layers
  const stats = useMemo(() => {
    let totalNodes = 0;
    let totalEdges = 0;
    const layerCount = Object.keys(model.layers || {}).length;

    Object.values(model.layers || {}).forEach((layer: any) => {
      totalNodes += layer.elements?.length || 0;
      totalEdges += layer.relationships?.length || 0;
    });

    return { totalNodes, totalEdges, layerCount };
  }, [model]);

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-sm font-medium mb-3">Graph Statistics</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Total Nodes</span>
          <span className="text-gray-900 font-medium">{stats.totalNodes}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total Edges</span>
          <span className="text-gray-900 font-medium">{stats.totalEdges}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Layers</span>
          <span className="text-gray-900 font-medium">{stats.layerCount}</span>
        </div>
      </div>
    </div>
  );
};

export default GraphStatisticsPanel;
