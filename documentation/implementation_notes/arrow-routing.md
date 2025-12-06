# Edge Routing & Smooth Paths

## Overview

The viewer uses **React Flow's edge system** with custom routing logic to create clear, collision-free connections between nodes.

## Edge Types

### 1. **Elbow Edge** (Smart Routing)
The primary edge type used in the viewer is the `ElbowEdge`. It provides orthogonal routing (horizontal and vertical lines) with obstacle avoidance.

- **Best for:** Architectural diagrams, clear separation of lines
- **Features:**
  - Avoids crossing through nodes
  - Rounds corners for visual appeal
  - Supports labels
  - Handles multiple connections gracefully

### 2. **React Flow Defaults**
We also leverage React Flow's built-in edge types where appropriate:
- **Bezier**: For smooth, curved connections (e.g., Motivation layer)
- **Straight**: For direct, simple links

## Automatic Routing

The `NodeTransformer` automatically selects the best edge type and configuration:

```typescript
// Cross-layer references → Elbow edge with dashed line
if (isCrossLayer) {
  type: 'elbow',
  style: { strokeDasharray: '5,5' }
}

// Standard relationships → Elbow edge
else {
  type: 'elbow'
}
```

## Obstacle Avoidance

The `ElbowEdge` component implements a pathfinding algorithm to route around nodes:

```typescript
// src/core/edges/ElbowEdge.tsx

// 1. Identify obstacles (all nodes except source/target)
const obstacles = nodes.map(node => ({
  x: node.position.x,
  y: node.position.y,
  width: node.width,
  height: node.height
}));

// 2. Calculate path
const pathPoints = calculateElbowPath(
  sourcePoint,
  targetPoint,
  obstacles,
  sourcePosition,
  targetPosition
);
```

## Visual Result

### **Before (Straight Edges):**
```
┌─────────────┐
│ Node A      │
│             ├────────────┐
│             │            │  (crossing Node C)
└─────────────┘            │
                           │
┌─────────────┐            │
│ Node C      │            │
│ (Obstacle)  │            │
└─────────────┘            │
                           │
┌─────────────┐            │
│ Node B      │            │
│             │◄───────────┘
│             │
└─────────────┘
```

### **After (Elbow Edges):**
```
┌─────────────┐
│ Node A      │
│             ├──┐
│             │  │
└─────────────┘  │
                 │
┌─────────────┐  │
│ Node C      │  │ (routes around)
│ (Obstacle)  │  │
└─────────────┘  │
                 │
┌─────────────┐  │
│ Node B      │  │
│             │◄─┘
│             │
└─────────────┘
```

## Configuration Options

### **Per-Edge Customization**

Edges can be customized via the `data` prop:

```typescript
{
  id: 'edge-1',
  type: 'elbow',
  data: {
    pathOptions: {
      offset: 10,        // Margin around nodes
      borderRadius: 8    // Corner radius
    }
  }
}
```

## Technical Details

### **Pathfinding Algorithm**

The `calculateElbowPath` function (in `src/core/edges/pathfinding.ts`) uses a simplified A* or greedy approach optimized for orthogonal routing:
1. Determine start and end directions based on handles
2. Generate candidate points around obstacles
3. Find a path of horizontal/vertical segments
4. Minimize segment count and length

### **Properties Used**

```typescript
interface ElbowEdgeProps extends EdgeProps {
  data?: {
    pathOptions?: {
      offset?: number;
      borderRadius?: number;
    };
  };
}
```

## Benefits

✅ **Visual Clarity:** Edges don't obscure node content
✅ **Professional Look:** Orthogonal lines are standard in architecture diagrams
✅ **Readability:** Easier to trace connections in complex graphs
✅ **Flexibility:** Adapts to moving nodes automatically

## References

- React Flow Edge Documentation: https://reactflow.dev/docs/concepts/edges/
- Implementation: `/src/core/edges/ElbowEdge.tsx`
- Pathfinding logic: `/src/core/edges/pathfinding.ts`
