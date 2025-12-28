/**
 * MiniMap Component
 * Overview map for graph views using React Flow's MiniMap
 * Displays a miniature version of the graph for quick navigation
 */

import { memo } from 'react';
import { MiniMap as ReactFlowMiniMap } from '@xyflow/react';
import { LayerType } from '../../../core/types';
import { getLayerColor, FALLBACK_COLOR } from '../../../core/utils/layerColors';

export interface MiniMapProps {
  /** Node color function - maps node type to color */
  nodeColor?: (node: any) => string;
  /** Node stroke color */
  nodeStrokeColor?: string;
  /** Node border radius */
  nodeBorderRadius?: number;
  /** Mask color */
  maskColor?: string;
  /** Show mask strokeWidth */
  maskStrokeWidth?: number;
  /** Height of minimap */
  height?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Maps node types to their layer for color determination
 */
const getNodeLayer = (nodeType: string): LayerType | null => {
  const motivationTypes = ['stakeholder', 'driver', 'assessment', 'goal', 'outcome', 'principle', 'requirement', 'constraint', 'assumption', 'valueStream'];
  const businessTypes = ['actor', 'role', 'collaboration', 'interface', 'process', 'function', 'interaction', 'event', 'service', 'object', 'contract', 'representation', 'product', 'businessCapability', 'businessFunction', 'businessService'];
  const applicationTypes = ['applicationComponent', 'applicationInterface', 'applicationFunction', 'applicationInteraction', 'applicationProcess', 'applicationEvent', 'applicationService', 'dataObject'];
  const technologyTypes = ['node', 'device', 'systemSoftware', 'technologyCollaboration', 'technologyInterface', 'path', 'communicationNetwork', 'technologyFunction', 'technologyProcess', 'technologyInteraction', 'technologyEvent', 'technologyService', 'artifact'];
  const c4Types = ['person', 'softwareSystem', 'container', 'component', 'externalActor'];

  if (motivationTypes.includes(nodeType)) return LayerType.Motivation;
  if (businessTypes.includes(nodeType)) return LayerType.Business;
  if (applicationTypes.includes(nodeType)) return LayerType.Application;
  if (technologyTypes.includes(nodeType)) return LayerType.Technology;
  if (c4Types.includes(nodeType)) return LayerType.Application;  // C4 is application architecture

  return null;
};

/**
 * Default node color function
 * Maps node types to their layer colors from centralized system
 */
const defaultNodeColor = (node: any): string => {
  // Guard against invalid node data
  if (!node || typeof node !== 'object') {
    return FALLBACK_COLOR;
  }

  // Guard against NaN dimensions which can cause SVG rendering errors
  if (node.width !== undefined && (isNaN(node.width) || node.width === null)) {
    return FALLBACK_COLOR;
  }
  if (node.height !== undefined && (isNaN(node.height) || node.height === null)) {
    return FALLBACK_COLOR;
  }

  const nodeType = node.type || 'default';

  // Get the layer for this node type
  const layer = getNodeLayer(nodeType);

  if (layer) {
    return getLayerColor(layer, 'primary');
  }

  // Fallback for unknown node types
  return FALLBACK_COLOR;
};

export const MiniMap = memo(
  ({
    nodeColor = defaultNodeColor,
    nodeStrokeColor = '#fff',
    nodeBorderRadius = 4,
    maskColor = 'rgb(240, 240, 240, 0.6)',
    maskStrokeWidth = 2,
    height = 150,
    className = '',
  }: MiniMapProps) => {
    return (
      <ReactFlowMiniMap
        nodeColor={nodeColor}
        nodeStrokeColor={nodeStrokeColor}
        nodeBorderRadius={nodeBorderRadius}
        maskColor={maskColor}
        maskStrokeWidth={maskStrokeWidth}
        className={className}
        style={{
          backgroundColor: 'transparent',
          height: `${height}px`,
        }}
        pannable
        zoomable
        data-testid="minimap-container"
      />
    );
  }
);

MiniMap.displayName = 'MiniMap';
