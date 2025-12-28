# Spec Graph Layout Optimization

## Overview

The spec graph viewer now supports multiple layout engines with side-by-side comparison, allowing you to visualize spec relationships using different layout algorithms.

## Available Layouts

### 1. **Force-Directed Layout** (Organic)
- **Engine:** D3-Force
- **Best for:** Showing natural clustering and relationships
- **Characteristics:**
  - Nodes repel each other like charged particles
  - Edges act like springs pulling connected nodes together
  - Creates organic, natural-looking layouts
  - Good for understanding community structure

**Parameters:**
```typescript
{
  strength: -300,    // Repulsion force between nodes
  distance: 150,     // Ideal distance between connected nodes
  iterations: 300,   // Number of simulation steps
}
```

### 2. **Orthogonal Layout** (Circuit-Style)
- **Engine:** ELK (Eclipse Layout Kernel)
- **Best for:** Clean, structured diagrams with right-angle connections
- **Characteristics:**
  - Edges route at 90-degree angles (like circuit diagrams)
  - Hierarchical left-to-right or top-to-bottom flow
  - Minimizes edge crossings
  - Precise, engineering-style layout

**Parameters:**
```typescript
{
  algorithm: 'layered',
  direction: 'RIGHT',         // Left-to-right flow
  orthogonalRouting: true,    // Right-angle edges
  nodeSpacing: 100,           // Horizontal spacing
  layerSpacing: 150,          // Vertical spacing
  edgeSpacing: 30,            // Space between parallel edges
}
```

### 3. **Graphviz DOT**
- **Engine:** Graphviz WASM
- **Best for:** Traditional hierarchical diagrams
- Industry-standard DOT algorithm
- Excellent for tree-like structures

### 4. **Dagre Hierarchical**
- **Engine:** Dagre
- **Best for:** Layered hierarchical layouts
- Fast and efficient
- Good for dependency graphs

## Usage

### Basic Usage

Replace your existing `SpecGraphView` with `SpecGraphViewWithLayouts`:

```tsx
import SpecGraphViewWithLayouts from '@/apps/embedded/components/SpecGraphViewWithLayouts';

<SpecGraphViewWithLayouts
  specData={specData}
  selectedSchemaId={selectedSchemaId}
/>
```

### Features

1. **Layout Selection**
   - Dropdown to choose between force-directed, orthogonal, Graphviz, or Dagre layouts
   - Layouts update automatically when selection changes

2. **Comparison Mode**
   - Click "Compare Layouts" button to enable side-by-side comparison
   - Select two different layout engines to compare
   - Both views synchronized to the same data

3. **Pre-configured Parameters**
   - Force-directed: Optimized for organic spec relationships
   - Orthogonal: Configured for circuit-style precision with clean routing

## Integration with Routes

### Step 1: Import the Component

```tsx
import SpecGraphViewWithLayouts from '../components/SpecGraphViewWithLayouts';
```

### Step 2: Replace SpecGraphView

```tsx
// Old:
<SpecGraphView specData={specData} selectedSchemaId={selectedSchemaId} />

// New:
<SpecGraphViewWithLayouts specData={specData} selectedSchemaId={selectedSchemaId} />
```

### Step 3: Test Both Layouts

1. Load a spec with multiple schemas
2. Try "Force-Directed (Organic)" - should show natural clustering
3. Try "ELK Orthogonal (Circuit-Style)" - should show clean, structured layout
4. Enable "Compare Layouts" to see both side-by-side

## Layout Comparison: Force-Directed vs Orthogonal

### When to Use Force-Directed

✅ **Use when:**
- Exploring unknown/complex relationships
- Want to see natural groupings and clusters
- Emphasizing community structure
- Interactive exploration is primary goal
- Graph has cycles or bidirectional relationships

❌ **Avoid when:**
- Need precise measurements or alignment
- Presenting to engineers expecting structured diagrams
- Graph is highly hierarchical
- Need reproducible layouts (force-directed has randomness)

### When to Use Orthogonal (Circuit-Style)

✅ **Use when:**
- Presenting to technical audiences
- Need clean, professional appearance
- Want circuit diagram aesthetic
- Graph is hierarchical or has clear flow
- Need reproducible, deterministic layouts
- Minimizing edge crossings is critical

❌ **Avoid when:**
- Graph has many cycles
- Want to emphasize clustering
- Graph is very dense (orthogonal can become cluttered)

## Technical Details

### How It Works

1. **Model Conversion**
   - Spec schemas converted to MetaModel format
   - Cross-layer links added from link registry

2. **Layout Engine Selection**
   - User selects layout engine via dropdown
   - GraphViewer receives `layoutEngine` prop
   - NodeTransformer uses specified engine for layout

3. **Parameter Application**
   - Pre-configured parameters for each engine type
   - Force-directed: repulsion/attraction forces
   - Orthogonal: spacing and routing options

4. **Rendering**
   - React Flow renders the positioned graph
   - Controls for zoom, pan, and exploration

### Architecture

```
SpecGraphViewWithLayouts
├── Layout Controls (Card)
│   ├── Engine Selector (Select)
│   ├── Comparison Toggle (Button)
│   └── Layout Badges
└── Graph Views
    ├── Single View (GraphViewer)
    └── Comparison Mode (2x GraphViewer in grid)
```

### Modified Components

1. **GraphViewer.tsx**
   - Added `layoutEngine?: LayoutEngineType` prop
   - Added `layoutParameters?: Record<string, any>` prop
   - Integrated with layout engine registry
   - Falls back to VerticalLayerLayout for backward compatibility

2. **SpecGraphViewWithLayouts.tsx** (new)
   - Full layout selection and comparison UI
   - Pre-configured parameters for each engine
   - Side-by-side comparison mode

## Future Enhancements

- [ ] Save layout preferences per spec
- [ ] Quality metrics comparison (edge crossings, etc.)
- [ ] Export comparison screenshots
- [ ] Animated transitions between layouts
- [ ] Custom parameter adjustment UI
- [ ] Refinement loop integration

## Troubleshooting

### Layout Not Updating
- Check that `layoutEngine` prop is being passed correctly
- Verify engine is registered in layout engine registry
- Check console for layout calculation errors

### Edges Not Routing Correctly
- For orthogonal: Ensure `orthogonalRouting: true` in parameters
- For force-directed: Increase iteration count for better convergence

### Performance Issues
- Force-directed can be slow for >500 nodes
- Consider using Dagre or Graphviz for large graphs
- Enable Web Workers for layouts with >100 nodes

## Examples

### Example 1: Force-Directed Spec Visualization
```tsx
<SpecGraphViewWithLayouts
  specData={architectureSpec}
  selectedSchemaId="motivation-layer.schema.json"
/>
// User selects "Force-Directed (Organic)"
// Result: Natural clustering of related schemas
```

### Example 2: Circuit-Style Comparison
```tsx
<SpecGraphViewWithLayouts
  specData={architectureSpec}
  selectedSchemaId={null}
/>
// User clicks "Compare Layouts"
// Left: Force-Directed | Right: Orthogonal
// Result: Side-by-side comparison of layout styles
```

## See Also

- [Layout Engine Abstraction](./LAYOUT_ENGINE_ABSTRACTION.md)
- [Orthogonal Routing Implementation](./ORTHOGONAL_ROUTING_IMPLEMENTATION.md)
- [Graph Readability Metrics](./QUALITY_METRICS.md)
