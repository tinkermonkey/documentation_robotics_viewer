# Layout Algorithms

## Layout Engine Architecture

The layout engine provides automatic arrangement of shapes using various algorithms optimized for different diagram types.

## Core Layout Interface

```typescript
interface LayoutEngine {
  // Apply layout to shapes
  layout(
    shapes: LayoutNode[],
    edges: LayoutEdge[],
    options?: LayoutOptions
  ): Promise<LayoutResult>;
  
  // Check if algorithm supports given diagram type
  supports(diagramType: DiagramType): boolean;
  
  // Get default options for algorithm
  getDefaultOptions(): LayoutOptions;
  
  // Validate layout options
  validateOptions(options: LayoutOptions): ValidationResult;
}

interface LayoutNode {
  id: string;
  width: number;
  height: number;
  
  // Optional constraints
  layer?: number;
  rank?: number;
  group?: string;
  fixed?: boolean;
  position?: { x: number; y: number };
}

interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  
  // Optional properties
  weight?: number;
  minLength?: number;
  type?: string;
}

interface LayoutResult {
  nodes: Map<string, Position>;
  edges?: Map<string, RoutingPoints>;
  bounds: BoundingBox;
  success: boolean;
  warnings?: string[];
}
```

## Dagre Layout (Hierarchical)

Best for: ArchiMate diagrams, dependency graphs, org charts

```typescript
import dagre from 'dagre';

class DagreLayoutEngine implements LayoutEngine {
  async layout(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    options: DagreOptions = {}
  ): Promise<LayoutResult> {
    // Create dagre graph
    const g = new dagre.graphlib.Graph({
      directed: options.directed ?? true,
      multigraph: options.multigraph ?? false,
      compound: options.compound ?? false,
    });
    
    // Set default layout options
    g.setGraph({
      rankdir: options.direction || 'TB', // TB, BT, LR, RL
      align: options.align || 'UL',
      nodesep: options.nodeSpacing || 50,
      edgesep: options.edgeSpacing || 10,
      ranksep: options.rankSpacing || 50,
      marginx: options.marginX || 20,
      marginy: options.marginY || 20,
      acyclicer: options.acyclicer || 'greedy',
      ranker: options.ranker || 'network-simplex',
    });
    
    // Add nodes
    for (const node of nodes) {
      g.setNode(node.id, {
        width: node.width,
        height: node.height,
        // Custom properties
        layer: node.layer,
        rank: node.rank,
      });
      
      // Handle fixed positions
      if (node.fixed && node.position) {
        g.node(node.id).x = node.position.x;
        g.node(node.id).y = node.position.y;
        g.node(node.id).fixed = true;
      }
    }
    
    // Add edges
    for (const edge of edges) {
      g.setEdge(edge.source, edge.target, {
        weight: edge.weight || 1,
        minlen: edge.minLength || 1,
        // Custom properties
        type: edge.type,
      });
    }
    
    // Run layout
    dagre.layout(g);
    
    // Extract results
    const nodePositions = new Map<string, Position>();
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    
    g.nodes().forEach(nodeId => {
      const node = g.node(nodeId);
      nodePositions.set(nodeId, {
        x: node.x - node.width / 2,
        y: node.y - node.height / 2,
      });
      
      // Update bounds
      bounds.minX = Math.min(bounds.minX, node.x - node.width / 2);
      bounds.minY = Math.min(bounds.minY, node.y - node.height / 2);
      bounds.maxX = Math.max(bounds.maxX, node.x + node.width / 2);
      bounds.maxY = Math.max(bounds.maxY, node.y + node.height / 2);
    });
    
    // Extract edge routing
    const edgeRouting = new Map<string, RoutingPoints>();
    g.edges().forEach(edgeObj => {
      const edge = g.edge(edgeObj);
      if (edge.points) {
        edgeRouting.set(`${edgeObj.v}-${edgeObj.w}`, edge.points);
      }
    });
    
    return {
      nodes: nodePositions,
      edges: edgeRouting,
      bounds,
      success: true,
    };
  }
  
  getDefaultOptions(): DagreOptions {
    return {
      direction: 'TB',
      nodeSpacing: 50,
      rankSpacing: 50,
      align: 'UL',
    };
  }
}

interface DagreOptions extends LayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  align?: 'UL' | 'UR' | 'DL' | 'DR';
  nodeSpacing?: number;
  edgeSpacing?: number;
  rankSpacing?: number;
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
}
```

## Force-Directed Layout

Best for: Network diagrams, relationship graphs, security policies

```typescript
import * as d3 from 'd3-force';

class ForceDirectedLayoutEngine implements LayoutEngine {
  async layout(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    options: ForceOptions = {}
  ): Promise<LayoutResult> {
    // Prepare nodes for d3
    const d3Nodes = nodes.map(node => ({
      id: node.id,
      width: node.width,
      height: node.height,
      fx: node.fixed ? node.position?.x : null,
      fy: node.fixed ? node.position?.y : null,
      group: node.group,
    }));
    
    // Prepare edges for d3
    const d3Links = edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      strength: edge.weight,
    }));
    
    // Create force simulation
    const simulation = d3.forceSimulation(d3Nodes)
      .force('link', d3.forceLink(d3Links)
        .id(d => d.id)
        .distance(options.linkDistance || 100)
        .strength(d => d.strength || 1)
      )
      .force('charge', d3.forceManyBody()
        .strength(options.chargeStrength || -300)
      )
      .force('center', d3.forceCenter(
        options.centerX || 0,
        options.centerY || 0
      ))
      .force('collision', d3.forceCollide()
        .radius(d => Math.max(d.width, d.height) / 2 + 10)
      );
    
    // Add custom forces
    if (options.useGroups) {
      simulation.force('group', this.createGroupForce());
    }
    
    // Run simulation
    return new Promise((resolve) => {
      simulation.on('end', () => {
        const nodePositions = new Map<string, Position>();
        const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
        
        d3Nodes.forEach(node => {
          nodePositions.set(node.id, {
            x: node.x - node.width / 2,
            y: node.y - node.height / 2,
          });
          
          bounds.minX = Math.min(bounds.minX, node.x - node.width / 2);
          bounds.minY = Math.min(bounds.minY, node.y - node.height / 2);
          bounds.maxX = Math.max(bounds.maxX, node.x + node.width / 2);
          bounds.maxY = Math.max(bounds.maxY, node.y + node.height / 2);
        });
        
        resolve({
          nodes: nodePositions,
          bounds,
          success: true,
        });
      });
      
      // Run for specified iterations
      simulation.tick(options.iterations || 300);
    });
  }
  
  // Custom force to cluster nodes by group
  createGroupForce() {
    return (alpha: number) => {
      return (nodes: any[]) => {
        const groups = new Map<string, { x: number; y: number; count: number }>();
        
        // Calculate group centers
        nodes.forEach(node => {
          if (node.group) {
            const group = groups.get(node.group) || { x: 0, y: 0, count: 0 };
            group.x += node.x;
            group.y += node.y;
            group.count++;
            groups.set(node.group, group);
          }
        });
        
        // Apply force toward group center
        nodes.forEach(node => {
          if (node.group) {
            const group = groups.get(node.group);
            if (group && group.count > 1) {
              const centerX = group.x / group.count;
              const centerY = group.y / group.count;
              
              node.vx += (centerX - node.x) * alpha * 0.1;
              node.vy += (centerY - node.y) * alpha * 0.1;
            }
          }
        });
      };
    };
  }
}

interface ForceOptions extends LayoutOptions {
  linkDistance?: number;
  chargeStrength?: number;
  centerX?: number;
  centerY?: number;
  iterations?: number;
  useGroups?: boolean;
}
```

## Tree Layout

Best for: Hierarchical data, navigation structures, org charts

```typescript
class TreeLayoutEngine implements LayoutEngine {
  async layout(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    options: TreeOptions = {}
  ): Promise<LayoutResult> {
    // Build tree structure
    const tree = this.buildTree(nodes, edges);
    
    // Apply tree layout algorithm
    const positions = this.calculateTreeLayout(
      tree,
      options.orientation || 'vertical',
      options.levelSpacing || 100,
      options.nodeSpacing || 50
    );
    
    return {
      nodes: positions,
      bounds: this.calculateBounds(positions),
      success: true,
    };
  }
  
  private calculateTreeLayout(
    tree: TreeNode,
    orientation: 'vertical' | 'horizontal',
    levelSpacing: number,
    nodeSpacing: number
  ): Map<string, Position> {
    const positions = new Map<string, Position>();
    
    // Use walker's algorithm for optimal tree layout
    this.walkTree(tree, 0, 0, (node, x, y) => {
      if (orientation === 'vertical') {
        positions.set(node.id, {
          x: x * nodeSpacing,
          y: y * levelSpacing,
        });
      } else {
        positions.set(node.id, {
          x: y * levelSpacing,
          y: x * nodeSpacing,
        });
      }
    });
    
    return positions;
  }
}
```

## Grid Layout

Best for: Dashboards, card layouts, uniform components

```typescript
class GridLayoutEngine implements LayoutEngine {
  async layout(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    options: GridOptions = {}
  ): Promise<LayoutResult> {
    const columns = options.columns || Math.ceil(Math.sqrt(nodes.length));
    const padding = options.padding || 20;
    const cellWidth = options.cellWidth || 200;
    const cellHeight = options.cellHeight || 150;
    
    const positions = new Map<string, Position>();
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      positions.set(node.id, {
        x: col * (cellWidth + padding),
        y: row * (cellHeight + padding),
      });
    });
    
    return {
      nodes: positions,
      bounds: this.calculateBounds(positions, nodes),
      success: true,
    };
  }
}
```

## Layered Layout (Custom for Meta-Model)

Best for: Multi-layer architectural diagrams

```typescript
class LayeredLayoutEngine implements LayoutEngine {
  async layout(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    options: LayeredOptions = {}
  ): Promise<LayoutResult> {
    // Group nodes by layer
    const layers = this.groupByLayer(nodes);
    
    // Layout each layer independently
    const layerLayouts = new Map<number, LayoutResult>();
    
    for (const [layerId, layerNodes] of layers) {
      const layerEdges = edges.filter(e => 
        layerNodes.some(n => n.id === e.source) &&
        layerNodes.some(n => n.id === e.target)
      );
      
      // Use appropriate algorithm for layer type
      const algorithm = this.getAlgorithmForLayer(layerId);
      const result = await algorithm.layout(layerNodes, layerEdges, options);
      layerLayouts.set(layerId, result);
    }
    
    // Combine results with layer offsets
    return this.combineLayerLayouts(layerLayouts, options);
  }
  
  private getAlgorithmForLayer(layerId: number): LayoutEngine {
    // Select best algorithm based on layer type
    switch(layerId) {
      case LayerType.Business:
      case LayerType.Application:
        return new DagreLayoutEngine();
      case LayerType.Security:
        return new ForceDirectedLayoutEngine();
      case LayerType.UX:
        return new GridLayoutEngine();
      case LayerType.Navigation:
        return new TreeLayoutEngine();
      default:
        return new DagreLayoutEngine();
    }
  }
}
```

## Layout Manager

```typescript
class LayoutManager {
  private engines: Map<string, LayoutEngine> = new Map();
  private currentLayout: string = 'dagre';
  private layoutCache: Map<string, LayoutResult> = new Map();
  
  constructor() {
    // Register layout engines
    this.registerEngine('dagre', new DagreLayoutEngine());
    this.registerEngine('force', new ForceDirectedLayoutEngine());
    this.registerEngine('tree', new TreeLayoutEngine());
    this.registerEngine('grid', new GridLayoutEngine());
    this.registerEngine('layered', new LayeredLayoutEngine());
  }
  
  // Apply layout to current view
  async applyLayout(
    algorithm?: string,
    options?: LayoutOptions
  ): Promise<void> {
    const engine = this.engines.get(algorithm || this.currentLayout);
    
    if (!engine) {
      throw new Error(`Unknown layout algorithm: ${algorithm}`);
    }
    
    // Get current shapes and edges
    const { nodes, edges } = this.prepareLayoutData();
    
    // Check cache
    const cacheKey = this.getCacheKey(nodes, edges, algorithm, options);
    let result = this.layoutCache.get(cacheKey);
    
    if (!result) {
      // Apply layout
      result = await engine.layout(nodes, edges, options);
      this.layoutCache.set(cacheKey, result);
    }
    
    // Apply positions to shapes
    await this.applyLayoutResult(result);
  }
  
  // Incremental layout for new nodes
  async layoutIncremental(
    newNodes: LayoutNode[],
    algorithm?: string
  ): Promise<void> {
    // Get existing layout
    const existingPositions = this.getCurrentPositions();
    
    // Find good positions for new nodes
    const positions = await this.findIncrementalPositions(
      newNodes,
      existingPositions,
      algorithm
    );
    
    // Apply with animation
    await this.animateToPositions(positions);
  }
  
  // Smart layout selection based on diagram
  async autoLayout(): Promise<void> {
    const analysis = this.analyzeDiagram();
    const bestAlgorithm = this.selectBestAlgorithm(analysis);
    
    await this.applyLayout(bestAlgorithm);
  }
  
  private selectBestAlgorithm(analysis: DiagramAnalysis): string {
    if (analysis.isHierarchical) return 'dagre';
    if (analysis.isTree) return 'tree';
    if (analysis.isDense) return 'force';
    if (analysis.isGrid) return 'grid';
    if (analysis.hasLayers) return 'layered';
    
    return 'dagre'; // Default
  }
}
```

## Layout Animation

```typescript
class LayoutAnimator {
  async animateLayout(
    from: Map<string, Position>,
    to: Map<string, Position>,
    duration: number = 500
  ): Promise<void> {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutCubic(progress);
      
      // Interpolate positions
      for (const [id, fromPos] of from) {
        const toPos = to.get(id);
        if (!toPos) continue;
        
        const currentPos = {
          x: fromPos.x + (toPos.x - fromPos.x) * eased,
          y: fromPos.y + (toPos.y - fromPos.y) * eased,
        };
        
        this.updateShapePosition(id, currentPos);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
```

## Layout Constraints

```typescript
interface LayoutConstraints {
  // Alignment constraints
  alignments: AlignmentConstraint[];
  
  // Spacing constraints  
  spacing: SpacingConstraint[];
  
  // Grouping constraints
  groups: GroupConstraint[];
  
  // Order constraints
  ordering: OrderConstraint[];
}

interface AlignmentConstraint {
  nodes: string[];
  axis: 'x' | 'y';
  alignment: 'start' | 'center' | 'end';
}

interface SpacingConstraint {
  node1: string;
  node2: string;
  minDistance?: number;
  maxDistance?: number;
  exactDistance?: number;
}

class ConstraintLayoutEngine {
  applyConstraints(
    positions: Map<string, Position>,
    constraints: LayoutConstraints
  ): Map<string, Position> {
    // Apply alignment constraints
    for (const constraint of constraints.alignments) {
      this.applyAlignment(positions, constraint);
    }
    
    // Apply spacing constraints
    for (const constraint of constraints.spacing) {
      this.applySpacing(positions, constraint);
    }
    
    return positions;
  }
}
```