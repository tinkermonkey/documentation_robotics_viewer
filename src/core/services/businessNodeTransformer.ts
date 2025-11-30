/**
 * Business Node Transformer
 *
 * Transforms BusinessGraph nodes to React Flow node data.
 * Pre-calculates dimensions and extracts metadata for visualization.
 */

import { BusinessNode } from '../types/businessLayer';
import {
  BusinessProcessNodeData,
  BusinessFunctionNodeData,
  BusinessServiceNodeData,
  BusinessCapabilityNodeData,
} from '../types/reactflow';

/**
 * BusinessNodeTransformer - Transforms business nodes to React Flow format
 */
export class BusinessNodeTransformer {
  /**
   * Pre-calculate dimensions for all nodes in a graph
   * CRITICAL: These dimensions MUST match the actual rendered component sizes
   */
  precalculateDimensions(nodes: Map<string, BusinessNode>): void {
    for (const node of nodes.values()) {
      node.dimensions = this.getNodeDimensions(node);
    }
  }

  /**
   * Get node dimensions based on type
   * MUST match the width/height in the corresponding node component
   */
  getNodeDimensions(node: BusinessNode): { width: number; height: number } {
    switch (node.type) {
      case 'process':
        return { width: 200, height: 80 };
      case 'function':
        return { width: 180, height: 100 };
      case 'service':
        return { width: 180, height: 90 };
      case 'capability':
        return { width: 160, height: 70 };
      default:
        return { width: 200, height: 100 };
    }
  }

  /**
   * Get node type string for React Flow
   */
  getNodeType(node: BusinessNode): string {
    switch (node.type) {
      case 'process':
        return 'businessProcess';
      case 'function':
        return 'businessFunction';
      case 'service':
        return 'businessService';
      case 'capability':
        return 'businessCapability';
      default:
        return 'businessProcess';
    }
  }

  /**
   * Extract node data for React Flow based on node type
   */
  extractNodeData(
    node: BusinessNode
  ):
    | BusinessProcessNodeData
    | BusinessFunctionNodeData
    | BusinessServiceNodeData
    | BusinessCapabilityNodeData {
    const nodeType = this.getNodeType(node);

    const baseData = {
      label: node.name,
      elementId: node.id,
      layerId: 'business',
      fill: this.getFillColor(node),
      stroke: this.getStrokeColor(node),
      owner: node.metadata.owner,
      criticality: node.metadata.criticality,
      lifecycle: node.metadata.lifecycle,
      domain: node.metadata.domain,
    };

    // Add type-specific data
    if (nodeType === 'businessProcess') {
      return {
        ...baseData,
        subprocessCount: node.metadata.subprocessCount || node.childIds.length,
        stepCount: node.metadata.stepCount,
        hierarchyLevel: node.hierarchyLevel,
      } as BusinessProcessNodeData;
    } else if (nodeType === 'businessFunction') {
      return baseData as BusinessFunctionNodeData;
    } else if (nodeType === 'businessService') {
      return baseData as BusinessServiceNodeData;
    } else if (nodeType === 'businessCapability') {
      return baseData as BusinessCapabilityNodeData;
    }

    return baseData as BusinessProcessNodeData;
  }

  /**
   * Get fill color based on node type and lifecycle
   */
  getFillColor(node: BusinessNode): string {
    // Base colors by type
    const baseColors: Record<string, string> = {
      process: '#FFF3E0', // Light orange
      function: '#E3F2FD', // Light blue
      service: '#F3E5F5', // Light purple
      capability: '#E8F5E9', // Light green
    };

    let color = baseColors[node.type] || '#F5F5F5';

    // Dim color for deprecated lifecycle
    if (node.metadata.lifecycle === 'deprecated') {
      color = '#EEEEEE';
    }

    return color;
  }

  /**
   * Get stroke color based on node type and criticality
   */
  getStrokeColor(node: BusinessNode): string {
    // High criticality gets red stroke
    if (node.metadata.criticality === 'high') {
      return '#D32F2F';
    }

    // Base colors by type
    const baseColors: Record<string, string> = {
      process: '#E65100', // Dark orange
      function: '#1565C0', // Dark blue
      service: '#6A1B9A', // Dark purple
      capability: '#2E7D32', // Dark green
    };

    return baseColors[node.type] || '#424242';
  }
}
