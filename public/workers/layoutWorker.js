/**
 * Web Worker for Layout Calculations
 *
 * Handles heavy layout calculations off the main thread to keep UI responsive.
 * Used for graphs with >100 nodes.
 */

// Import dagre from CDN
importScripts('https://unpkg.com/dagre@0.8.5/dist/dagre.min.js');

self.onmessage = function(e) {
  const { graph, options } = e.data;

  try {
    // Create dagre graph
    const g = new dagre.graphlib.Graph();

    // Configure graph layout
    g.setGraph({
      rankdir: options.direction || 'TB',
      nodesep: options.spacing?.node || 80,
      ranksep: options.spacing?.rank || 120,
      marginx: 30,
      marginy: 30,
      align: 'UL',
      ranker: 'tight-tree',
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to dagre graph
    graph.nodes.forEach(node => {
      g.setNode(node.id, {
        width: node.dimensions.width,
        height: node.dimensions.height,
        label: node.name,
      });
    });

    // Add edges to dagre graph
    graph.edges.forEach(edge => {
      const weight = getEdgeWeight(edge);
      g.setEdge(edge.source, edge.target, {
        label: edge.label || edge.type,
        weight,
      });
    });

    // Run dagre layout
    dagre.layout(g);

    // Extract positions
    const positions = {};
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    graph.nodes.forEach(node => {
      const dagreNode = g.node(node.id);

      if (dagreNode) {
        // Convert from center to top-left
        const x = dagreNode.x - node.dimensions.width / 2;
        const y = dagreNode.y - node.dimensions.height / 2;

        positions[node.id] = { x, y };

        // Track bounds
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + node.dimensions.width);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + node.dimensions.height);
      }
    });

    // Send result back to main thread
    self.postMessage({
      success: true,
      positions,
      bounds: {
        width: maxX - minX,
        height: maxY - minY,
        minX,
        maxX,
        minY,
        maxY,
      },
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      success: false,
      error: error.message || 'Unknown error in layout worker',
    });
  }
};

/**
 * Get edge weight for layout (higher weight = closer together)
 */
function getEdgeWeight(edge) {
  // Hierarchy edges get higher weight to keep parents/children close
  if (edge.type === 'composes' || edge.type === 'aggregates') {
    return 10;
  }

  // Other relationship types get default weight
  return 1;
}
