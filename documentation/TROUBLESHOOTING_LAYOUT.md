# Layout Troubleshooting Guide

This guide addresses common layout issues, their root causes, and solutions for the visualization optimization system.

## Quick Diagnosis

### Symptom Checklist

| Symptom | Likely Cause | Jump To |
|---------|--------------|---------|
| Nodes overlapping | Dimension mismatch | [Node Dimension Mismatch](#node-dimension-mismatch) |
| Edges not connecting | Missing handles | [Missing Edge Handles](#missing-edge-handles) |
| Node not rendering | Type not registered | [Unregistered Node Type](#unregistered-node-type) |
| Layout has gaps | Incorrect precalculation | [Layout Gaps](#layout-gaps-between-layers) |
| Poor quality score | Metric-specific issues | [Quality Score Issues](#low-quality-scores) |
| Tests timing out | Performance issues | [Test Timeouts](#test-timeouts) |
| Regressions detected | Baseline mismatch | [Regression Detection](#handling-regressions) |

---

## Node Rendering Issues

### Node Dimension Mismatch

**Symptom**: Nodes overlap or have excessive gaps; layout appears "off" despite correct algorithm.

**Root Cause**: The CSS dimensions in the React component don't match the precalculated dimensions in `NodeTransformer`.

**Diagnosis**:
```typescript
// Check what NodeTransformer thinks the dimensions are
console.log('Precalculated:', element.visual.size);

// Check actual rendered size
const nodeElement = document.querySelector('[data-id="your-node-id"]');
console.log('Rendered:', nodeElement.getBoundingClientRect());
```

**Solution**:

1. **In the Node Component** (`src/core/nodes/YourNode.tsx`):
   ```typescript
   export const YourNode = memo(({ data }: NodeProps<YourNodeData>) => {
     return (
       <div
         style={{
           width: 180,   // Must match precalculation
           height: 100,  // Must match precalculation
           // ...
         }}
       >
         {/* Content */}
       </div>
     );
   });
   ```

2. **In NodeTransformer** (`src/core/services/nodeTransformer.ts`):
   ```typescript
   case 'yourNodeType':
     element.visual.size = {
       width: 180,   // Must match component CSS
       height: 100,  // Must match component CSS
     };
     break;
   ```

**Verification**:
```bash
# Run layout tests to verify dimensions
npm run refine:all
```

---

### Missing Edge Handles

**Symptom**: Edges don't connect to nodes; connections appear broken or offset.

**Root Cause**: The custom node component is missing `<Handle />` components or has incorrect handle IDs.

**Diagnosis**:
```typescript
// Check if handles exist in the DOM
const handles = document.querySelectorAll('.react-flow__handle');
console.log('Handle count:', handles.length);
```

**Solution**:

```typescript
import { Handle, Position } from '@xyflow/react';

export const YourNode = memo(({ data }: NodeProps<YourNodeData>) => {
  return (
    <div style={{ /* ... */ }}>
      {/* Target handle (incoming edges) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ left: '50%', background: '#555' }}
      />

      {/* Source handle (outgoing edges) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: '50%', background: '#555' }}
      />

      {/* Content */}
    </div>
  );
});
```

**Handle Requirements**:
- `type="target"`: For incoming edges
- `type="source"`: For outgoing edges
- `id`: Must match edge `targetHandle`/`sourceHandle` in transformer
- `position`: Determines which side of the node

---

### Unregistered Node Type

**Symptom**: Node doesn't appear at all; console shows "Unknown node type: yourNodeType".

**Root Cause**: The node type isn't registered in `nodeTypes` or the type string doesn't match.

**Solution**:

1. **Export the component** (`src/core/nodes/index.ts`):
   ```typescript
   import { YourNode } from './YourNode';

   export { YourNode };

   export const nodeTypes = {
     // ... existing types
     yourNodeType: YourNode,  // Add this line
   };
   ```

2. **Map element type to node type** (`src/core/services/nodeTransformer.ts`):
   ```typescript
   case 'YourElementType':
   case 'your-element-type':  // Handle multiple formats
     return 'yourNodeType';   // Must match nodeTypes key
   ```

**Verification**:
```typescript
import { nodeTypes } from '@/core/nodes';
console.log('Registered types:', Object.keys(nodeTypes));
```

---

## Layout Algorithm Issues

### Layout Gaps Between Layers

**Symptom**: Large gaps between architectural layers; nodes "float" with too much space.

**Root Cause**: Layer padding too large or dimension precalculation incorrect.

**Solution**:

1. **Adjust layer padding** (`src/core/layout/verticalLayerLayout.ts`):
   ```typescript
   const LAYER_PADDING = 80; // Default is 100, try reducing
   ```

2. **Check layer container bounds**:
   ```typescript
   // Debug layer bounds
   console.log('Layer bounds:', layerBounds);
   ```

3. **Verify no hidden nodes** affecting bounds:
   ```typescript
   const visibleNodes = nodes.filter(n => !n.hidden);
   ```

---

### Excessive Edge Crossings

**Symptom**: Quality score low due to many edge crossings; diagram looks tangled.

**Root Cause**: Layout algorithm not optimized for crossing minimization, or graph structure creates unavoidable crossings.

**Solutions**:

1. **Try a different algorithm**:
   ```bash
   # Test different layouts
   npm run refine:motivation  # Includes algorithm comparison
   ```

2. **Adjust algorithm parameters**:
   ```typescript
   // For force-directed layouts
   const options = {
     chargeStrength: -1500,  // More repulsion
     linkDistance: 200,       // Longer edges
     iterations: 400,         // More settling time
   };
   ```

3. **Enable edge bundling** (`src/core/layout/edgeBundling.ts`):
   ```typescript
   import { bundleEdges } from '@/core/layout/edgeBundling';

   const bundledEdges = bundleEdges(edges, nodes, {
     bundleStrength: 0.8,
     compatibility: 0.6,
   });
   ```

4. **Check for circular dependencies**:
   ```typescript
   // businessGraphBuilder detects these
   if (graph.metrics.hasCircularDependency) {
     console.warn('Circular dependency may cause crossings');
   }
   ```

---

### Nodes Positioned Outside Viewport

**Symptom**: Some nodes not visible; must pan/zoom extensively to find them.

**Root Cause**: Layout calculation produced extreme coordinates; missing bounds clamping.

**Solution**:

1. **Enable viewport fitting**:
   ```typescript
   <ReactFlow
     nodes={nodes}
     edges={edges}
     fitView
     fitViewOptions={{
       padding: 0.2,
       includeHiddenNodes: false,
     }}
   >
   ```

2. **Add bounds validation**:
   ```typescript
   // In layout engine
   const validateBounds = (position: Position) => ({
     x: Math.max(0, Math.min(position.x, MAX_CANVAS_WIDTH)),
     y: Math.max(0, Math.min(position.y, MAX_CANVAS_HEIGHT)),
   });
   ```

3. **Check for NaN/Infinity**:
   ```typescript
   nodes.forEach(node => {
     if (!isFinite(node.position.x) || !isFinite(node.position.y)) {
       console.error('Invalid position:', node.id, node.position);
     }
   });
   ```

---

## Quality Score Issues

### Low Quality Scores

**Symptom**: Quality score below 0.7 (acceptable threshold); diagram looks "okay" visually.

**Diagnosis**:
```bash
npm run metrics:report
cat test-results/metrics/metrics-report.json | jq '.metrics'
```

**Common Causes and Solutions**:

| Weak Metric | Cause | Solution |
|-------------|-------|----------|
| `crossingNumber < 0.8` | Too many edge crossings | Try hierarchical layout; increase spacing |
| `crossingAngle < 0.7` | Crossings at bad angles | Adjust node positions; enable edge routing |
| `angularResolutionMin < 0.7` | Edges too close at nodes | Increase node spacing |
| `angularResolutionDev < 0.7` | Uneven edge angles | Balance layout; adjust charge strength |
| `nodeNodeOcclusion > 0` | Overlapping nodes | Fix dimension mismatch (see above) |

**Quick Fixes by Aspect**:

```typescript
// Spacing issues
const spacingOptions = {
  nodeSpacing: 150,   // Increase from 100
  rankSpacing: 200,   // Increase from 150
};

// Alignment issues
const alignmentOptions = {
  iterations: 400,    // More iterations
  centerForce: 0.7,   // Stronger centering
};

// Grouping issues
const groupingOptions = {
  chargeStrength: -800,  // Tighter grouping
  linkDistance: 100,      // Shorter links
};
```

---

### Visual Similarity Score Low

**Symptom**: SSIM score below 0.6 when comparing to reference diagram.

**Root Cause**: Generated layout differs significantly from reference in structure or styling.

**Diagnosis**:
```typescript
import { generateDifferenceHeatmap } from '@/core/services/comparison/heatmapService';

const heatmap = await generateDifferenceHeatmap(
  generatedImage,
  referenceImage,
  { threshold: 10 }
);

// Save for inspection
await saveHeatmapResult(heatmap, 'test-results/comparison/diff-heatmap.png');
```

**Solutions**:

1. **Check reference diagram is appropriate**:
   - Same diagram type?
   - Similar node count?
   - Same architectural pattern?

2. **Adjust comparison weights**:
   ```typescript
   const options = {
     readabilityWeight: 0.8,  // Prioritize metrics over visual
     similarityWeight: 0.2,   // Reduce similarity weight
   };
   ```

3. **Verify styling consistency**:
   ```typescript
   // Ensure nodes have consistent styling
   const nodeStyle = {
     borderWidth: 1.5,
     borderColor: '#333',
     backgroundColor: '#fff',
     // ...
   };
   ```

---

## Test Issues

### Test Timeouts

**Symptom**: Tests fail with "Timeout of 30000ms exceeded".

**Root Cause**: Layout calculation too slow; screenshot capture taking too long; server not ready.

**Solutions**:

1. **Increase timeout**:
   ```bash
   npx playwright test tests/refinement/motivation-refinement.spec.ts --timeout=60000
   ```

2. **Wait for diagram ready**:
   ```typescript
   // In test file
   await page.waitForSelector('[data-testid="react-flow-wrapper"]');
   await page.waitForTimeout(1000); // Allow layout to settle
   ```

3. **Check server is running**:
   ```bash
   # In separate terminal
   npm run dev:embedded

   # Then run tests
   npm run refine:all
   ```

4. **Use Web Worker for large graphs**:
   ```typescript
   // Automatically triggered for >100 nodes
   // Check if worker is being used
   console.log('Using worker:', layoutResult.metadata?.usedWorker);
   ```

---

### Handling Regressions

**Symptom**: `npm run metrics:regression-check` fails with regression detected.

**Diagnosis**:
```bash
cat test-results/metrics/regression-report.json | jq '.'
```

**Decision Tree**:

```
Regression Detected
        │
        ▼
┌───────────────────┐
│ Was the change    │
│ intentional?      │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    │           │
   Yes          No
    │           │
    ▼           ▼
┌─────────┐  ┌─────────────┐
│ Update  │  │ Investigate │
│baselines│  │ and fix     │
└─────────┘  └─────────────┘
```

**If Intentional**:
```bash
# Verify the change is an improvement
npm run refine:all
npm run metrics:report

# Update baselines
npm run metrics:update-baselines

# Commit with explanation
git add test-results/baselines/
git commit -m "Update layout baselines: improved C4 container spacing"
```

**If Unintentional**:
```bash
# View regression details
cat test-results/metrics/regression-report.json | jq '.regressions'

# Common causes:
# 1. Accidental parameter change
# 2. Dependency update
# 3. Node dimension change

# Use git to find the change
git diff HEAD~5 src/core/layout/
git diff HEAD~5 src/core/nodes/
```

---

### No Baselines Found

**Symptom**: Error "No baselines found" when running regression check.

**Solution**:
```bash
# Create initial baselines
npm run metrics:update-baselines

# Verify baselines created
ls -la test-results/baselines/
cat test-results/baselines/quality-baselines.json | jq '.motivation.overallScore'
```

---

## Performance Issues

### Slow Layout Calculation

**Symptom**: Layout takes >3 seconds for <500 nodes.

**Diagnosis**:
```typescript
const start = performance.now();
const result = await engine.calculate(graph, options);
const duration = performance.now() - start;
console.log(`Layout took ${duration.toFixed(2)}ms`);
```

**Solutions**:

1. **Enable Web Worker**:
   ```typescript
   // Automatic for >100 nodes
   // Force for smaller graphs:
   const result = await engine.calculateInWorker(graph, options);
   ```

2. **Reduce iterations**:
   ```typescript
   const options = {
     iterations: 200,  // Reduce from 300
   };
   ```

3. **Enable layout caching**:
   ```typescript
   // Cache key based on graph hash
   const cacheKey = hashGraph(graph);
   const cached = layoutCache.get(cacheKey);
   if (cached) return cached;
   ```

4. **Use simpler algorithm**:
   ```typescript
   // Hierarchical is faster than force-directed for large graphs
   const engine = getLayoutEngine('hierarchical');
   ```

---

### High Memory Usage

**Symptom**: Browser tab slows down; memory warning in dev tools.

**Solutions**:

1. **Enable viewport culling**:
   ```typescript
   <ReactFlow
     nodes={nodes}
     edges={edges}
     onlyRenderVisibleElements={true}  // Critical for >200 nodes
   >
   ```

2. **Limit history depth**:
   ```typescript
   // In metricsHistoryService
   const MAX_HISTORY_ENTRIES = 50;
   ```

3. **Clear unused data**:
   ```typescript
   // Clear layout cache periodically
   layoutCache.clear();

   // Clear metrics history
   metricsHistoryService.clearHistory('motivation');
   ```

---

## Debugging Tools

### Visual Debugging

```typescript
// Highlight node bounds
const debugStyle = {
  border: '2px solid red',
  background: 'rgba(255, 0, 0, 0.1)',
};

// Show handle positions
<Handle
  style={{ ...handleStyle, background: 'blue', width: 10, height: 10 }}
/>

// Log positions on drag
const onNodeDrag = (event, node) => {
  console.log('Node position:', node.id, node.position);
};
```

### Console Debugging

```bash
# Verbose Playwright output
DEBUG=pw:api npm run refine:motivation

# Node.js debugging
NODE_OPTIONS='--inspect' npm run refine:motivation
```

### Browser DevTools

1. Open React DevTools
2. Find the ReactFlow component
3. Inspect `nodes` and `edges` props
4. Check for dimension mismatches

---

## Getting Help

### Information to Gather

When reporting layout issues, include:

1. **Diagram type**: motivation, business, c4
2. **Layout algorithm**: hierarchical, force-directed, etc.
3. **Node count**: Total number of nodes
4. **Quality report**: `test-results/metrics/metrics-report.json`
5. **Screenshot**: Export PNG of the problematic layout
6. **Console errors**: Any errors in browser console

### Debug Command

```bash
# Generate comprehensive debug output
npm run metrics:report && \
  cat test-results/metrics/metrics-report.json | jq '{
    diagramType: .diagramType,
    layoutType: .layoutType,
    overallScore: .overallScore,
    metrics: .metrics,
    warnings: .warnings
  }'
```

---

## Related Documentation

- [VISUALIZATION_OPTIMIZATION.md](./VISUALIZATION_OPTIMIZATION.md) - System architecture
- [REFINEMENT_WORKFLOWS.md](./REFINEMENT_WORKFLOWS.md) - Refinement commands
- [REFERENCE_DIAGRAMS.md](./REFERENCE_DIAGRAMS.md) - Reference diagram catalog
- [layout-algorithms.md](./layout-algorithms.md) - Layout algorithm details
- [CLAUDE.md](../CLAUDE.md) - Node pattern requirements

---

**Last Updated**: 2025-12-05
**Version**: 1.0.0
