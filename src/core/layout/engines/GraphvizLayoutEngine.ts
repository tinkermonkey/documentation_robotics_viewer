/**
 * Graphviz WASM Layout Engine Adapter
 *
 * Wraps the Graphviz WASM library to provide DOT-based layout algorithms
 * through the common LayoutEngine interface. Graphviz offers multiple algorithms:
 * - dot: Hierarchical/layered layout for directed graphs
 * - neato: Spring model layout (force-directed)
 * - fdp: Force-directed with clustering
 * - circo: Circular layout
 * - twopi: Radial layout
 *
 * Graphviz is particularly strong at directed graph layouts and has been
 * the industry standard for graph visualization for decades.
 */

import { Graphviz } from '@hpcc-js/wasm';
// @ts-ignore - GraphvizInstance type is from Graphviz import
type GraphvizInstance = Awaited<ReturnType<typeof Graphviz.load>>;
import {
  BaseLayoutEngine,
  LayoutGraphInput,
  LayoutResult,
  ParameterValidation,
  EngineCapabilities,
} from './LayoutEngine';

/**
 * Graphviz algorithm types
 */
export type GraphvizAlgorithm = 'dot' | 'neato' | 'fdp' | 'circo' | 'twopi';

/**
 * Graphviz rank direction (for dot algorithm)
 */
export type GraphvizRankDir = 'TB' | 'LR' | 'BT' | 'RL';

/**
 * Graphviz spline types (edge routing)
 */
export type GraphvizSplines = 'none' | 'line' | 'polyline' | 'curved' | 'ortho' | 'spline';

/**
 * Graphviz-specific layout parameters
 */
export interface GraphvizParameters {
  /** Layout algorithm */
  algorithm?: GraphvizAlgorithm;

  /** Rank direction (for dot algorithm) */
  rankdir?: GraphvizRankDir;

  /** Node separation (in inches) */
  nodesep?: number;

  /** Rank separation (in inches) */
  ranksep?: number;

  /** Spline edge routing type */
  splines?: GraphvizSplines;

  /** Graph padding (in inches) */
  margin?: number;

  /** DPI scaling factor */
  dpi?: number;
}

/**
 * Graphviz node position parsed from SVG output
 */
interface GraphvizNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Graphviz edge path parsed from SVG output
 */
interface GraphvizEdge {
  id: string;
  source: string;
  target: string;
  points: Array<{ x: number; y: number }>;
}

/**
 * Graphviz Layout Engine
 *
 * Provides classic graph layout algorithms using Graphviz WASM.
 * Particularly effective for directed graphs, hierarchies, and complex network topologies.
 */
export class GraphvizLayoutEngine extends BaseLayoutEngine {
  readonly name = 'Graphviz Layout Engine';
  readonly version = '1.0.0';
  readonly capabilities: EngineCapabilities = {
    hierarchical: true, // dot algorithm
    forceDirected: true, // neato, fdp algorithms
    orthogonal: false, // ortho splines are available but not a primary capability
    circular: true, // circo, twopi algorithms
  };

  private graphvizInstance: GraphvizInstance | null = null;

  async initialize(): Promise<void> {
    await super.initialize();
    this.graphvizInstance = await Graphviz.load();
    console.log('[GraphvizLayoutEngine] Initialized with Graphviz WASM');
  }

  async calculateLayout(
    graph: LayoutGraphInput,
    parameters: Record<string, any> = {}
  ): Promise<LayoutResult> {
    if (!this.graphvizInstance) {
      throw new Error('Graphviz engine not initialized. Call initialize() first.');
    }

    const startTime = performance.now();
    const params = this.normalizeParameters(parameters);

    // Convert React Flow graph to DOT format
    const dotSource = this.convertToDOT(graph, params);

    // Calculate layout using Graphviz
    const svgOutput = this.graphvizInstance.layout(dotSource, 'svg', params.algorithm || 'dot');

    // Parse SVG output and convert back to React Flow format
    const result = this.parseGraphvizSVG(svgOutput, graph);

    const calculationTime = performance.now() - startTime;

    console.log(
      `[GraphvizLayoutEngine] Layout calculated in ${calculationTime.toFixed(2)}ms for ${graph.nodes.length} nodes using ${params.algorithm} algorithm`
    );

    return {
      ...result,
      metadata: {
        calculationTime,
        usedWorker: false,
        algorithm: params.algorithm,
      },
    };
  }

  getParameters(): GraphvizParameters {
    return {
      algorithm: 'dot',
      rankdir: 'TB',
      nodesep: 0.5,
      ranksep: 1.0,
      splines: 'spline',
      margin: 0.2,
      dpi: 72,
    };
  }

  validateParameters(parameters: Record<string, any>): ParameterValidation {
    const schema = {
      algorithm: { type: 'string', values: ['dot', 'neato', 'fdp', 'circo', 'twopi'] },
      rankdir: { type: 'string', values: ['TB', 'LR', 'BT', 'RL'] },
      nodesep: { type: 'number', min: 0.1, max: 5.0 },
      ranksep: { type: 'number', min: 0.1, max: 5.0 },
      splines: { type: 'string', values: ['none', 'line', 'polyline', 'curved', 'ortho', 'spline'] },
      margin: { type: 'number', min: 0.0, max: 2.0 },
      dpi: { type: 'number', min: 36, max: 300 },
    };

    return this.validateCommonParameters(parameters, schema);
  }

  async cleanup(): Promise<void> {
    await super.cleanup();
    this.graphvizInstance = null;
    console.log('[GraphvizLayoutEngine] Cleaned up');
  }

  /**
   * Convert React Flow graph to DOT format
   */
  private convertToDOT(graph: LayoutGraphInput, params: GraphvizParameters): string {
    const lines: string[] = [];

    // Graph header
    lines.push('digraph G {');

    // Graph attributes
    if (params.rankdir) {
      lines.push(`  rankdir="${params.rankdir}";`);
    }
    if (params.nodesep !== undefined) {
      lines.push(`  nodesep=${params.nodesep};`);
    }
    if (params.ranksep !== undefined) {
      lines.push(`  ranksep=${params.ranksep};`);
    }
    if (params.splines) {
      lines.push(`  splines="${params.splines}";`);
    }
    if (params.margin !== undefined) {
      lines.push(`  margin=${params.margin};`);
    }
    if (params.dpi !== undefined) {
      lines.push(`  dpi=${params.dpi};`);
    }

    // Default node attributes
    lines.push('  node [shape=box];');

    // Add nodes with dimensions (convert pixels to inches at 72 DPI)
    for (const node of graph.nodes) {
      const widthInches = (node.width / 72).toFixed(3);
      const heightInches = (node.height / 72).toFixed(3);
      const label = node.data?.label || node.id;
      const escapedLabel = this.escapeDOTString(label);

      lines.push(
        `  "${node.id}" [width=${widthInches}, height=${heightInches}, fixedsize=true, label="${escapedLabel}"];`
      );
    }

    // Add edges
    for (const edge of graph.edges) {
      const label = edge.data?.label ? `label="${this.escapeDOTString(edge.data.label)}"` : '';
      lines.push(`  "${edge.source}" -> "${edge.target}" [${label}];`);
    }

    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Escape special characters in DOT strings
   */
  private escapeDOTString(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  /**
   * Parse Graphviz SVG output and convert back to React Flow format
   */
  private parseGraphvizSVG(svgOutput: string, originalGraph: LayoutGraphInput): LayoutResult {
    // Create maps of original data
    const nodeDataMap = new Map(originalGraph.nodes.map((n) => [n.id, n.data]));
    const nodeDimensionsMap = new Map(
      originalGraph.nodes.map((n) => [n.id, { width: n.width, height: n.height }])
    );
    const edgeDataMap = new Map(originalGraph.edges.map((e) => [e.id, e.data]));

    // Parse nodes and edges from SVG
    const parsedNodes = this.parseSVGNodes(svgOutput);
    const parsedEdges = this.parseSVGEdges(svgOutput);

    // Find global bounds from SVG viewBox
    const viewBoxMatch = svgOutput.match(/viewBox="([\d.-]+)\s+([\d.-]+)\s+([\d.]+)\s+([\d.]+)"/);
    let svgHeight = 800;

    if (viewBoxMatch) {
      svgHeight = parseFloat(viewBoxMatch[4]);
    }

    // Convert nodes to React Flow format
    // Graphviz uses top-left origin, need to flip Y and adjust coordinates
    const nodes = parsedNodes.map((gvNode) => {
      const dimensions = nodeDimensionsMap.get(gvNode.id) || { width: 100, height: 50 };

      // Graphviz positions are center-based, convert to top-left for React Flow
      // Also flip Y coordinate (SVG has Y increasing downward)
      const x = gvNode.x - dimensions.width / 2;
      const y = svgHeight - gvNode.y - dimensions.height / 2;

      return {
        id: gvNode.id,
        position: { x, y },
        data: nodeDataMap.get(gvNode.id),
      };
    });

    // Convert edges to React Flow format
    // If SVG parsing didn't find edges, fall back to original edges
    const edges =
      parsedEdges.length > 0
        ? parsedEdges.map((gvEdge) => {
            const originalEdge = originalGraph.edges.find(
              (e) => e.source === gvEdge.source && e.target === gvEdge.target
            );

            return {
              id: originalEdge?.id || `${gvEdge.source}-${gvEdge.target}`,
              source: gvEdge.source,
              target: gvEdge.target,
              points: gvEdge.points.map((p) => ({
                x: p.x,
                y: svgHeight - p.y, // Flip Y coordinate
              })),
              data: edgeDataMap.get(originalEdge?.id || ''),
            };
          })
        : originalGraph.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            data: edge.data,
          }));

    // Calculate bounds
    const nodesWithDimensions = nodes.map((node) => {
      const dims = nodeDimensionsMap.get(node.id) || { width: 100, height: 50 };
      return {
        ...node,
        width: dims.width,
        height: dims.height,
      };
    });

    const bounds = this.calculateBounds(nodesWithDimensions);

    return {
      nodes,
      edges,
      bounds,
    };
  }

  /**
   * Parse node positions from Graphviz SVG output
   */
  private parseSVGNodes(svg: string): GraphvizNode[] {
    const nodes: GraphvizNode[] = [];

    // Extract node groups with title and position
    // Pattern: <g id="node*" class="node"><title>ID</title>...<ellipse/polygon/rect with position>
    const nodeGroupPattern = /<g\s+id="node\d+"\s+class="node">([\s\S]*?)<\/g>/g;

    let match;
    while ((match = nodeGroupPattern.exec(svg)) !== null) {
      const nodeContent = match[1];

      // Extract node ID from title
      const titleMatch = nodeContent.match(/<title>([^<]+)<\/title>/);
      if (!titleMatch) continue;

      const id = titleMatch[1];
      let x = 0;
      let y = 0;

      // Try to find ellipse position (most common for Graphviz nodes)
      const ellipseMatch = nodeContent.match(/<ellipse[^>]+cx="([\d.-]+)"[^>]+cy="([\d.-]+)"/);
      if (ellipseMatch) {
        x = parseFloat(ellipseMatch[1]);
        y = parseFloat(ellipseMatch[2]);
      } else {
        // Try to find polygon position
        const polygonMatch = nodeContent.match(/<polygon[^>]+points="([\d., -]+)"/);
        if (polygonMatch) {
          const points = polygonMatch[1].split(/[\s,]+/).map(parseFloat);
          if (points.length >= 2) {
            // Calculate center from polygon points
            let sumX = 0;
            let sumY = 0;
            let count = 0;
            for (let i = 0; i < points.length; i += 2) {
              if (i + 1 < points.length) {
                sumX += points[i];
                sumY += points[i + 1];
                count++;
              }
            }
            x = count > 0 ? sumX / count : 0;
            y = count > 0 ? sumY / count : 0;
          }
        }
      }

      nodes.push({
        id,
        x,
        y,
        width: 100,
        height: 50,
      });
    }

    return nodes;
  }

  /**
   * Parse edge paths from Graphviz SVG output
   */
  private parseSVGEdges(svg: string): GraphvizEdge[] {
    const edges: GraphvizEdge[] = [];

    // Extract edge groups with title and path
    const edgeGroupPattern = /<g\s+id="edge\d+"\s+class="edge">([\s\S]*?)<\/g>/g;

    let match;
    while ((match = edgeGroupPattern.exec(svg)) !== null) {
      const edgeContent = match[1];

      // Extract edge source and target from title
      const titleMatch = edgeContent.match(/<title>([^-]+)->([^<]+)<\/title>/);
      if (!titleMatch) continue;

      const source = titleMatch[1].trim();
      const target = titleMatch[2].trim();

      // Extract path data
      const pathMatch = edgeContent.match(/<path[^>]+d="([^"]+)"/);
      const pathData = pathMatch ? pathMatch[1] : '';

      // Parse path data to extract points
      const points = this.parseSVGPath(pathData);

      edges.push({
        id: `${source}-${target}`,
        source,
        target,
        points,
      });
    }

    return edges;
  }

  /**
   * Parse SVG path data to extract coordinate points
   */
  private parseSVGPath(pathData: string): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];

    // Extract coordinates from path commands (M, L, C, etc.)
    const coordPattern = /([ML])\s*([\d.-]+),([\d.-]+)|C\s*([\d., -]+)/g;
    let match;

    while ((match = coordPattern.exec(pathData)) !== null) {
      if (match[1] === 'M' || match[1] === 'L') {
        // Move or Line command
        points.push({
          x: parseFloat(match[2]),
          y: parseFloat(match[3]),
        });
      } else if (match[4]) {
        // Curve command - extract all control points
        const coords = match[4].split(/[\s,]+/).map(parseFloat);
        for (let i = 0; i < coords.length; i += 2) {
          if (i + 1 < coords.length) {
            points.push({
              x: coords[i],
              y: coords[i + 1],
            });
          }
        }
      }
    }

    return points;
  }

  /**
   * Normalize parameters to ensure all values are valid
   */
  private normalizeParameters(parameters: Record<string, any>): GraphvizParameters {
    const defaults = this.getParameters();
    const validated: GraphvizParameters = { ...defaults };

    if (parameters.algorithm) validated.algorithm = parameters.algorithm;
    if (parameters.rankdir) validated.rankdir = parameters.rankdir;
    if (typeof parameters.nodesep === 'number') validated.nodesep = parameters.nodesep;
    if (typeof parameters.ranksep === 'number') validated.ranksep = parameters.ranksep;
    if (parameters.splines) validated.splines = parameters.splines;
    if (typeof parameters.margin === 'number') validated.margin = parameters.margin;
    if (typeof parameters.dpi === 'number') validated.dpi = parameters.dpi;

    return validated;
  }
}
