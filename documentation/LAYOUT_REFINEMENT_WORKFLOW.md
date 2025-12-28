# Layout Refinement Workflow

## Overview

The Layout Refinement Workflow is a first-class application feature that allows you to interactively optimize graph layouts through human-in-the-loop refinement. It works with **any graph type** (spec graphs, model graphs, layer-specific graphs, C4 diagrams, etc.) without requiring code changes.

## Accessing Refinement Mode

### Via URL

Navigate to any graph view and change `/graph` to `/refine`:

- **Spec graphs**: `/spec/refine`
- **Model graphs**: `/model/refine`
- **C4 diagrams**: `/c4/refine`
- **Motivation graphs**: `/motivation/refine`

### Via Navigation

Use the sub-tab navigation (when implemented) to switch between:
- **Graph** - Standard read-only graph view
- **JSON** - JSON tree view
- **Refine Layout** - Interactive refinement workflow

## Layout Refinement Interface

The refinement workflow provides a comprehensive 3-column interface:

```
┌──────────────┬────────────────────────┬──────────────────┐
│ Left Sidebar │    Main Graph View     │ Right Sidebar    │
│              │                        │                  │
│ • Layers     │  ┌──────────────────┐  │ Parameters Tab   │
│ • Schemas    │  │  Layout Controls │  │ • Engine-specific│
│ • Filters    │  └──────────────────┘  │   sliders        │
│              │                        │ • Real-time      │
│              │  Graph Viewer          │   updates        │
│              │  (with current layout) │                  │
│              │                        │ History Tab      │
│              │                        │ • All iterations │
│              │                        │ • Quality scores │
│              │                        │ • Preview/Revert │
└──────────────┴────────────────────────┴──────────────────┘
```

### Top Controls

**Layout Engine Selector**
- Force-Directed (Organic) - Natural clustering
- ELK Orthogonal (Circuit-Style) - Right-angle routing
- Graphviz DOT - Traditional hierarchical
- Dagre Hierarchical - Fast layered layouts

**Quality Score Badge**
- 🟢 Green (>80%) - Excellent quality
- 🟡 Yellow (60-80%) - Good quality
- 🔴 Red (<60%) - Needs improvement
- Updates in real-time as you adjust parameters

**Refinement Controls**
- **Accept** - Save current parameters to localStorage
- **Reject** - Revert to previous iteration
- **Refine** - Continue manual tuning
- **Auto** - Start automated refinement loop

### Right Sidebar: Parameters Tab

**Real-time Parameter Adjustment**

Each layout engine has engine-specific parameters with sliders:

**D3-Force (Organic)**
- Strength: Repulsion force (-1000 to -50)
- Distance: Ideal edge length (50 to 500)
- Iterations: Simulation steps (100 to 1000)

**ELK Orthogonal (Circuit-Style)**
- Direction: LEFT, RIGHT, UP, DOWN
- Node Spacing: Horizontal gap (50 to 300)
- Layer Spacing: Vertical gap (50 to 300)
- Edge Spacing: Parallel edge separation (10 to 100)
- Orthogonal Routing: Enable/disable right-angle edges

**Graphviz DOT**
- Algorithm: dot, neato, fdp, circo, twopi
- Rank Direction: TB, BT, LR, RL
- Node Separation: 0.5 to 3.0
- Rank Separation: 0.5 to 3.0

**Dagre Hierarchical**
- Rank Direction: TB, BT, LR, RL
- Node Separation: 20 to 200
- Rank Separation: 20 to 200

**Debouncing**: Changes are debounced by 500ms for smooth interaction.

### Right Sidebar: History Tab

**Iteration Tracking**

All layout iterations are tracked with:
- Iteration number
- Quality score
- Parameter snapshot
- Timestamp

**Actions**
- **Preview** - Temporarily view any iteration (non-destructive)
- **Revert** - Permanently revert to any iteration
- **Best** indicator - Highlights highest-scoring iteration

## Refinement Workflows

### Manual Refinement Workflow

1. Navigate to `/spec/refine` or `/model/refine`
2. Select a layout engine from the dropdown
3. Adjust parameters using the sliders in the Parameters tab
4. Watch the graph update in real-time
5. Monitor the quality score badge
6. When satisfied, click **Accept** to save parameters
7. Use History tab to compare iterations

### Automated Refinement Workflow

1. Navigate to refinement mode
2. Select initial layout engine
3. Click **Auto** to start automated refinement
4. System will:
   - Try random parameter variations
   - Calculate quality score for each
   - Track all iterations in history
   - Auto-pause when quality >90%
5. Review iteration history
6. Click **Accept** on best iteration

### Comparison Workflow

1. Start with one layout engine (e.g., Force-Directed)
2. Adjust parameters until satisfied
3. Note the quality score
4. Switch to another engine (e.g., ELK Orthogonal)
5. Adjust parameters
6. Compare quality scores
7. Use History tab to revert to best overall

## Session Persistence

**Automatic Saving**

When you click **Accept**:
- Current layout engine is saved
- All parameters are saved
- Complete iteration history is saved
- Session is stored in localStorage

**Session Structure**
```typescript
{
  id: "spec-viewer-refinement-1234567890",
  name: "Spec Layout - elk",
  diagramType: "spec-viewer",
  layoutEngine: "elk",
  parameters: { /* engine-specific params */ },
  createdAt: Date,
  updatedAt: Date,
  status: "completed",
  history: [
    { iteration: 0, score: 0.65, parameters: {...} },
    { iteration: 1, score: 0.72, parameters: {...} },
    { iteration: 2, score: 0.85, parameters: {...} }
  ]
}
```

## Extending to Other Graph Types

The `GraphRefinementContainer` is completely generic and can wrap **any** graph viewer component.

### Example: Adding Refinement to C4GraphView

```typescript
// In C4Route.tsx
import GraphRefinementContainer from '../components/GraphRefinementContainer';

// Add to render logic:
if (activeView === 'refine') {
  return (
    <GraphRefinementContainer
      diagramType="c4"
      renderGraph={(layoutEngine, layoutParameters) => (
        <C4GraphView
          model={model}
          selectedLayerId={selectedLayerId}
          layoutEngine={layoutEngine}
          layoutParameters={layoutParameters}
        />
      )}
      leftSidebarContent={<C4FilterPanel />}
    />
  );
}
```

**Requirements**:
1. Your graph view component must accept `layoutEngine` and `layoutParameters` props
2. It should pass these props through to `GraphViewer`
3. Add `view === 'refine'` handling to your route

## Quality Metrics

The quality score is calculated based on:

1. **Edge Crossings** (-) - Fewer is better
2. **Node Overlaps** (-) - Should be zero
3. **Edge Length Variance** (-) - More uniform is better
4. **Alignment** (+) - Horizontal/vertical alignment bonus
5. **Hierarchy Clarity** (+) - Clear top-to-bottom flow
6. **Symmetry** (+) - Balanced layout bonus
7. **Layer-Specific Criteria** - Custom rules per diagram type

Score ranges:
- **0.9-1.0** - Excellent (ready for production)
- **0.8-0.9** - Very Good (minor tweaks)
- **0.6-0.8** - Good (refinement recommended)
- **<0.6** - Needs Work (continue refinement)

## Tips for Best Results

### Force-Directed Layouts
- Start with moderate strength (-300)
- Increase distance for sparse graphs
- More iterations = better convergence (but slower)
- Good for: Exploring unknown structures, finding clusters

### ELK Orthogonal Layouts
- Use RIGHT direction for left-to-right flow
- Increase layer spacing for readability
- Enable orthogonal routing for circuit-style
- Good for: Technical diagrams, engineering views

### Graphviz DOT
- Use `dot` for hierarchical graphs
- Use `neato` for force-directed alternative
- Increase node/rank separation for clarity
- Good for: Classic diagrams, documentation

### Dagre Hierarchical
- Fast and efficient for large graphs
- Good default parameters
- Adjust rank direction based on content flow
- Good for: Dependency graphs, call hierarchies

## Keyboard Shortcuts

(Future enhancement)
- `Ctrl+Z` - Undo parameter change
- `Ctrl+Y` - Redo parameter change
- `Ctrl+S` - Accept current layout
- `Ctrl+R` - Reject and revert
- `Space` - Toggle auto-refinement

## API: Creating Custom Refinement Workflows

```typescript
import GraphRefinementContainer from '@/apps/embedded/components/GraphRefinementContainer';

<GraphRefinementContainer
  diagramType="custom-diagram-type"
  renderGraph={(layoutEngine, layoutParameters) => (
    <YourGraphComponent
      data={yourData}
      layoutEngine={layoutEngine}
      layoutParameters={layoutParameters}
    />
  )}
  onExtractGraphData={() => {
    // Optional: Extract current nodes/edges for quality calculation
    return { nodes: currentNodes, edges: currentEdges };
  }}
  initialLayoutEngine="elk"
  initialParameters={{
    algorithm: 'layered',
    direction: 'RIGHT',
  }}
  leftSidebarContent={<YourCustomSidebar />}
/>
```

## Troubleshooting

### Quality score always 0%
- Implement `onExtractGraphData` callback to provide actual graph data
- Check that nodes and edges are valid React Flow objects

### Parameters not updating graph
- Verify your graph component accepts and uses `layoutEngine` and `layoutParameters` props
- Ensure props are passed through to `GraphViewer`

### Refinement loop not starting
- Check browser console for errors
- Verify `RefinementLoop` service is properly initialized
- Ensure graph data extraction is working

### Session not saving
- Check localStorage quota
- Verify browser allows localStorage
- Check console for serialization errors

## Future Enhancements

- [ ] Screenshot comparison with visual diff
- [ ] Export refined layouts as presets
- [ ] Share refinement sessions via URL
- [ ] Keyboard shortcuts for common actions
- [ ] A/B testing mode with split-screen comparison
- [ ] AI-assisted parameter suggestions
- [ ] Batch refinement for multiple graphs
- [ ] Performance profiling overlay

---

**Version:** 1.0.0
**Last Updated:** 2025-12-27
**Related Documentation:**
- [Layout Engine Abstraction](./LAYOUT_ENGINE_ABSTRACTION.md)
- [Spec Graph Layouts](./SPEC_GRAPH_LAYOUTS.md)
- [Orthogonal Routing Implementation](./ORTHOGONAL_ROUTING_IMPLEMENTATION.md)
