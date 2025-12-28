# Motivation Layer Test Dataset: Enterprise Digital Transformation

## Overview

This dataset represents a realistic enterprise digital transformation initiative with:
- **1 Vision**: Digital transformation vision
- **4 Strategic Goals**: Business growth, operational excellence, technology modernization, cultural transformation
- **12 Tactical Objectives**: Specific initiatives supporting strategic goals
- **8 Stakeholders**: C-suite executives with influence relationships
- **6 Constraints**: Budget, timeline, regulatory, technical, and organizational constraints
- **5 Principles**: Guiding principles for decision-making

## Structure

The dataset follows a three-level goal hierarchy:
1. **Vision** (apex): Overall transformation vision
2. **Strategic Goals** (4 nodes): Major strategic themes
3. **Tactical Objectives** (12 nodes): Concrete initiatives with 18-month timelines

Stakeholders influence goals based on their roles and concerns. Constraints apply to specific goals, and principles guide tactical decisions.

## Expected Layout Characteristics

### Hierarchical Structure
- Vision at the top/center
- Strategic goals arranged in the second level
- Tactical objectives grouped under their parent strategic goals
- Clear parent-child relationships visible

### Stakeholder Relationships
- Stakeholders should be positioned around the goals they influence
- High-influence stakeholders (CEO, Board, CTO) closer to strategic/vision levels
- Medium-influence stakeholders (CHRO) positioned near tactical objectives
- Radial or force-directed distribution for stakeholder network

### Optimal Layout Parameters

**ELK Layered Algorithm (recommended for hierarchy):**
```yaml
algorithm: layered
direction: DOWN
spacing: 100
layering: NETWORK_SIMPLEX
edgeNodeSpacing: 40
edgeSpacing: 25
aspectRatio: 1.4
orthogonalRouting: false
edgeRouting: SPLINES
```

**ELK Stress Algorithm (alternative for stakeholder network emphasis):**
```yaml
algorithm: stress
direction: DOWN
spacing: 120
edgeNodeSpacing: 50
aspectRatio: 1.2
```

## Quality Metrics Baselines

Target quality metrics for this dataset:

- **Edge Crossings**: < 5 (hierarchical structure should minimize crossings)
- **Hierarchical Clarity**: > 0.85 (clear level separation)
- **Node Overlap**: 0 (no overlapping nodes)
- **Vertical Alignment**: > 0.7 (goals at same level should align)
- **Edge Length Variance**: Low (uniform spacing between levels)
- **Aspect Ratio**: 1.2 - 1.6 (balanced width/height)

## Node Counts by Type

- **Goals**: 17 total (1 vision + 4 strategic + 12 tactical)
- **Stakeholders**: 8 total (7 C-suite + 1 board)
- **Constraints**: 6 total
- **Principles**: 5 total
- **Total Elements**: 36 nodes

## Edge Counts by Type

- **Goal Hierarchy**: 16 edges (parent-child relationships)
- **Stakeholder Influences**: 20 edges (stakeholder -> goal)
- **Constraint Applications**: 13 edges (constraint -> goal)
- **Principle Guidance**: 9 edges (principle -> goal)
- **Total Relationships**: 58 edges

## Usage in Tests

```typescript
import { loadYAMLModel } from '@/services/yamlParser';
import { transformMotivationLayer } from '@/core/services/motivationGraphTransformer';
import { LayoutEngineRegistry } from '@/core/layout/engines/LayoutEngineRegistry';

// Load dataset
const model = await loadYAMLModel('/tests/fixtures/public-datasets/motivation/');

// Transform to graph
const { nodes, edges } = transformMotivationLayer(model.layers.motivation);

// Apply optimized layout
const engine = LayoutEngineRegistry.getInstance().getEngine('elk');
const result = await engine.calculateLayout(nodes, edges, {
  algorithm: 'layered',
  direction: 'DOWN',
  spacing: 100,
  // ... other params
});

// Measure quality
const metrics = calculateGraphMetrics(result.nodes, result.edges);
expect(metrics.edgeCrossings).toBeLessThan(5);
expect(metrics.hierarchicalClarity).toBeGreaterThan(0.85);
```

## Visualization Guidelines

When visualizing this dataset:
1. Use different colors/shapes for different goal levels (vision, strategic, tactical)
2. Distinguish stakeholders with distinct styling
3. Show constraints as warnings/barriers
4. Display principles as guiding lights/stars
5. Use arrows to show influence direction (stakeholder → goal)
6. Label edges with influence level or constraint impact

## Source Attribution

This dataset is inspired by:
- McKinsey Digital Transformation Framework
- Gartner Digital Business Maturity Model
- Common enterprise architecture motivation models

License: Public Domain - Free to use for testing and development purposes.
