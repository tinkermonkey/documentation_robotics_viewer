/**
 * Layer-Specific Layout Configuration
 *
 * Defines optimized default layout engines and parameters for each DR layer.
 * Based on layer characteristics and public dataset validation.
 */

import type { DiagramType } from './refinement/layoutParameters';
import type { ELKLayoutParameters, GraphvizLayoutParameters } from './refinement/layoutParameters';
import { DEFAULT_ELK_PARAMETERS, DEFAULT_GRAPHVIZ_PARAMETERS } from './refinement/layoutParameters';

/**
 * Layout engine recommendation for a layer
 */
export interface LayerLayoutConfig {
  /** Recommended primary engine */
  primaryEngine: 'elk' | 'graphviz' | 'dagre' | 'd3-force';
  /** Alternative engines that work well for this layer */
  alternativeEngines: string[];
  /** Optimized parameters for the primary engine */
  parameters: ELKLayoutParameters | GraphvizLayoutParameters | Record<string, unknown>;
  /** Layout characteristics for this layer */
  characteristics: {
    direction: 'horizontal' | 'vertical' | 'radial' | 'matrix';
    edgeStyle: 'orthogonal' | 'curved' | 'straight' | 'bundled';
    grouping: boolean;
    hierarchical: boolean;
  };
}

/**
 * Get optimized layout configuration for a layer
 */
export function getLayerLayoutConfig(layerType: DiagramType): LayerLayoutConfig {
  switch (layerType) {
    case 'motivation':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['d3-force', 'graphviz'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 100,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 40,
          edgeSpacing: 25,
          aspectRatio: 1.4,
          orthogonalRouting: false,
          edgeRouting: 'SPLINES',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'curved',
          grouping: false,
          hierarchical: true,
        },
      };

    case 'business':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['graphviz', 'dagre'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'RIGHT', // Left-to-right flow for business processes
          spacing: 100,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 40,
          edgeSpacing: 30,
          aspectRatio: 2.5, // Wide layout
          orthogonalRouting: true,
          edgeRouting: 'ORTHOGONAL',
        },
        characteristics: {
          direction: 'horizontal',
          edgeStyle: 'orthogonal',
          grouping: true, // Swimlanes
          hierarchical: true,
        },
      };

    case 'c4':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['graphviz', 'dagre'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 80,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 40,
          edgeSpacing: 25,
          aspectRatio: 1.3,
          orthogonalRouting: false,
          edgeRouting: 'POLYLINE',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'curved',
          grouping: true, // System boundaries
          hierarchical: true,
        },
      };

    case 'security':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['graphviz'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 80,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 35,
          edgeSpacing: 20,
          aspectRatio: 1.4,
          orthogonalRouting: false,
          edgeRouting: 'SPLINES',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'curved',
          grouping: true, // Role hierarchies
          hierarchical: true,
        },
      };

    case 'application':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['dagre'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 70,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 35,
          edgeSpacing: 20,
          aspectRatio: 1.3,
          orthogonalRouting: false,
          edgeRouting: 'POLYLINE',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'straight',
          grouping: true, // Component layers
          hierarchical: true,
        },
      };

    case 'technology':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['graphviz'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 80,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 40,
          edgeSpacing: 25,
          aspectRatio: 1.4,
          orthogonalRouting: false,
          edgeRouting: 'SPLINES',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'curved',
          grouping: true, // Technology stack layers
          hierarchical: true,
        },
      };

    case 'api':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['graphviz'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 70,
          layering: 'LONGEST_PATH',
          edgeNodeSpacing: 30,
          edgeSpacing: 20,
          aspectRatio: 1.5,
          orthogonalRouting: false,
          edgeRouting: 'SPLINES',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'curved',
          grouping: true, // API interfaces
          hierarchical: true,
        },
      };

    case 'datamodel':
      return {
        primaryEngine: 'graphviz',
        alternativeEngines: ['elk'],
        parameters: {
          ...DEFAULT_GRAPHVIZ_PARAMETERS,
          algorithm: 'dot',
          rankdir: 'TB',
          nodesep: 0.6,
          ranksep: 1.2,
          splines: 'spline',
          margin: 0.2,
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'curved',
          grouping: false,
          hierarchical: false, // Entity-relationship, not strict hierarchy
        },
      };

    case 'dataset':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['graphviz'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'RIGHT',
          spacing: 90,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 40,
          edgeSpacing: 30,
          aspectRatio: 2.0,
          orthogonalRouting: false,
          edgeRouting: 'SPLINES',
        },
        characteristics: {
          direction: 'horizontal',
          edgeStyle: 'curved',
          grouping: false,
          hierarchical: false, // Data flow graph
        },
      };

    case 'ux':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['dagre'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 70,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 35,
          edgeSpacing: 20,
          aspectRatio: 1.3,
          orthogonalRouting: false,
          edgeRouting: 'POLYLINE',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'straight',
          grouping: true, // Screen grouping
          hierarchical: true,
        },
      };

    case 'navigation':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['graphviz'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 80,
          layering: 'LONGEST_PATH',
          edgeNodeSpacing: 35,
          edgeSpacing: 20,
          aspectRatio: 1.2,
          orthogonalRouting: false,
          edgeRouting: 'SPLINES',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'curved',
          grouping: true, // Menu grouping
          hierarchical: true,
        },
      };

    case 'apm':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['d3-force', 'graphviz'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 80,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 35,
          edgeSpacing: 25,
          aspectRatio: 1.4,
          orthogonalRouting: false,
          edgeRouting: 'SPLINES',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'curved',
          grouping: true, // Metric grouping
          hierarchical: true,
        },
      };

    case 'spec-viewer':
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['dagre'],
        parameters: {
          ...DEFAULT_ELK_PARAMETERS,
          algorithm: 'layered',
          direction: 'DOWN',
          spacing: 80,
          layering: 'NETWORK_SIMPLEX',
          edgeNodeSpacing: 40,
          edgeSpacing: 25,
          aspectRatio: 1.5,
          orthogonalRouting: false,
          edgeRouting: 'POLYLINE',
        },
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'straight',
          grouping: true,
          hierarchical: true,
        },
      };

    default:
      // Default to ELK layered for unknown layer types
      return {
        primaryEngine: 'elk',
        alternativeEngines: ['graphviz', 'dagre'],
        parameters: DEFAULT_ELK_PARAMETERS,
        characteristics: {
          direction: 'vertical',
          edgeStyle: 'curved',
          grouping: false,
          hierarchical: true,
        },
      };
  }
}

/**
 * Get recommended engine type for a layer
 */
export function getRecommendedEngine(layerType: DiagramType): string {
  return getLayerLayoutConfig(layerType).primaryEngine;
}

/**
 * Get optimized parameters for a layer
 */
export function getOptimizedParameters(
  layerType: DiagramType
): ELKLayoutParameters | GraphvizLayoutParameters | Record<string, unknown> {
  return getLayerLayoutConfig(layerType).parameters;
}

/**
 * Check if a layer should use orthogonal routing
 */
export function shouldUseOrthogonalRouting(layerType: DiagramType): boolean {
  const config = getLayerLayoutConfig(layerType);
  return config.characteristics.edgeStyle === 'orthogonal';
}

/**
 * Check if a layer uses hierarchical layout
 */
export function isHierarchicalLayer(layerType: DiagramType): boolean {
  return getLayerLayoutConfig(layerType).characteristics.hierarchical;
}

/**
 * Get layout direction preference for a layer
 */
export function getLayoutDirection(layerType: DiagramType): 'horizontal' | 'vertical' | 'radial' | 'matrix' {
  return getLayerLayoutConfig(layerType).characteristics.direction;
}
