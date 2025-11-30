# Viewer Architecture

## Overview

The Viewer is a React-based application that renders the architectural meta-model using **React Flow**. It is designed to be embedded in other applications (like the Orchestrator) or run as a standalone debug tool.

## Core Components

### 1. GraphViewer (`src/core/components/GraphViewer.tsx`)
The main entry point for the visualization.
- Initializes the React Flow instance
- Manages state (nodes, edges, viewport)
- Handles user interactions (selection, navigation)
- Registers custom node and edge types

### 2. NodeTransformer (`src/core/services/nodeTransformer.ts`)
Responsible for converting the domain-specific `MetaModel` into React Flow primitives (`Node` and `Edge`).
- **Input**: `MetaModel` (layers, entities, relationships)
- **Output**: `{ nodes: Node[], edges: Edge[] }`
- **Responsibilities**:
  - Maps entity types to React Flow node types
  - Calculates initial positions (via Layout Engine)
  - Generates edges for relationships
  - Creates layer container nodes

### 3. Layout Engine (`src/core/layout/`)
Calculates the automatic positioning of nodes.
- **VerticalLayerLayout**: Arranges layers vertically (Motivation → Business → Application → Technology)
- **Dagre Integration**: Uses `dagre` for hierarchical layout within each layer
- **Cross-Layer Routing**: Optimizes positions to minimize edge crossing between layers

### 4. Custom Nodes (`src/core/nodes/`)
React components that render specific architectural entities.
- `BusinessProcessNode`
- `RoleNode`
- `APIEndpointNode`
- `LayerContainerNode`
- ...and more

### 5. Custom Edges (`src/core/edges/`)
- `ElbowEdge`: Orthogonal routing with obstacle avoidance

## Data Flow

1. **Load Model**: The application fetches the `MetaModel` (JSON/YAML).
2. **Transform**: `NodeTransformer` processes the model.
   - Calls `LayoutEngine` to determine coordinates.
   - Generates React Flow `nodes` and `edges`.
3. **Render**: `GraphViewer` passes the nodes and edges to `<ReactFlow />`.
4. **Interact**: User actions (drag, zoom, click) update the internal React Flow state.

## State Management

- **Zustand**: Used for global application state (current model, view settings, selection).
- **React Flow Internal State**: Handles the immediate physics and interaction of the graph.

## Key Interfaces

```typescript
// The input model
interface MetaModel {
  layers: Layer[];
  relationships: Relationship[];
}

// The React Flow representation
interface GraphData {
  nodes: Node<BaseNodeData>[];
  edges: Edge[];
}

// The Transformation Service
interface INodeTransformer {
  transform(model: MetaModel): GraphData;
}
```

## Extension Points

- **New Node Types**: Add a new component to `src/core/nodes/` and register it in `nodeTypes` map.
- **New Layout Algorithms**: Implement `ILayoutStrategy` interface.
- **Interaction Handlers**: Add event listeners to `GraphViewer`.
