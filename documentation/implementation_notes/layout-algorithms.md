# Layout Algorithms

## Overview

The viewer uses a hybrid layout strategy to organize the architectural graph. The goal is to create a readable, structured diagram that respects the logical hierarchy of the layers while minimizing edge crossings.

## Strategy: Vertical Layered Layout

The primary layout strategy is **Vertical Layered**, implemented in `src/core/layout/verticalLayerLayout.ts`.

### 1. Layer Ordering
Layers are arranged vertically in a fixed order to reflect the architectural stack:
1. **Motivation** (Top)
2. **Business**
3. **Security**
4. **Application**
5. **Technology**
6. **Infrastructure** (Bottom)

### 2. Intra-Layer Layout (Dagre)
Within each layer, we use **Dagre** (Directed Acyclic Graph Graphviz) to arrange nodes hierarchically.
- **Direction**: Top-to-Bottom (TB) or Left-to-Right (LR) depending on the layer type.
- **Grouping**: Nodes belonging to the same parent (e.g., fields in a data model) are grouped.

### 3. Global Positioning
The layout engine calculates the bounding box of each layer and stacks them vertically with padding.

```typescript
let currentY = 0;

for (const layer of sortedLayers) {
  // 1. Layout nodes within this layer
  const layerBounds = layoutLayer(layer);
  
  // 2. Shift nodes to global Y position
  shiftNodes(layer.nodes, 0, currentY);
  
  // 3. Create Layer Container
  createContainer(layer, currentY, layerBounds);
  
  // 4. Advance Y cursor
  currentY += layerBounds.height + LAYER_PADDING;
}
```

## Layout Configuration

The layout can be tuned via configuration objects:

```typescript
interface LayoutConfig {
  layerPadding: number;    // Space between layers (e.g., 100px)
  nodeSpacing: number;     // Space between nodes (e.g., 50px)
  rankSpacing: number;     // Space between ranks (e.g., 80px)
  direction: 'TB' | 'LR';  // Layout direction
}
```

## Handling Cross-Layer Edges

Cross-layer edges (e.g., Business Process → Application Service) are not used to drive the Dagre layout *within* a layer, to prevent nodes from being pulled out of their logical layer.
- **Intra-layer edges**: Affect layout.
- **Inter-layer edges**: Ignored during layout calculation, drawn afterwards.

## Future Improvements

- **Force-Directed Layout**: For specific layers (like Motivation) where strict hierarchy is less important.
- **Incremental Layout**: Re-layout only affected parts when nodes are added/removed.
- **Manual Overrides**: Allow users to drag nodes and save their positions (persisted in `view-state.json`).
