# Business Layer Test Dataset: E-Commerce Order Fulfillment

## Overview

This dataset represents a realistic e-commerce order fulfillment business process with:
- **3 Swimlanes**: Customer, Sales, Warehouse
- **15 Activities**: Tasks performed by actors in each lane
- **4 Gateways**: Decision points (exclusive gateways)
- **3 Events**: Start and end events
- **18+ Sequence Flows**: Connecting activities, gateways, and events
- **6 Business Capabilities**: Supporting the process

## Process Flow

### Customer Lane
1. **Place Order** → Triggers the process
2. **Receive Confirmation** → Gets order confirmation
3. **Track Shipment** → Monitors delivery
4. **Receive Delivery** → Completes the process

### Sales Lane
1. **Validate Order** → Checks order details and payment
2. **Payment Valid?** (Gateway) → Decision point
   - If YES → Continue to inventory check
   - If NO → Payment Failed (End)
3. **Check Inventory** → Verify product availability
4. **Inventory Available?** (Gateway) → Decision point
   - If YES → Send to Warehouse
   - If NO → Handle Backorder → Send to Warehouse
5. **Notify Customer** → Send status updates
6. **Send to Warehouse** → Forward to fulfillment

### Warehouse Lane
1. **Pick Items** → Pick from inventory
2. **Pack Order** → Pack for shipping
3. **Generate Shipping Label** → Create label and tracking
4. **Dispatch Shipment** → Hand off to carrier

## Expected Layout Characteristics

### Left-to-Right Flow
- Process should flow from left (start) to right (end)
- Clear progression through stages: Order → Validation → Fulfillment → Delivery

### Swimlane Separation
- Three horizontal lanes clearly separated
- Customer lane at top
- Sales lane in middle
- Warehouse lane at bottom
- Each lane maintains consistent Y-position for its activities

### Orthogonal Edge Routing
- Edges should use right-angle bends
- Minimize diagonal lines
- Clear visual flow between activities
- Gateway branches clearly visible

### Gateway Positioning
- Decision gateways centered on their branches
- Branch paths clearly diverge and converge
- Labels on conditional edges

## Optimal Layout Parameters

**ELK Layered Algorithm (recommended):**
```yaml
algorithm: layered
direction: RIGHT  # Left-to-right flow
spacing: 100
layering: NETWORK_SIMPLEX
edgeNodeSpacing: 40
edgeSpacing: 30
aspectRatio: 2.5  # Wide layout for left-right flow
orthogonalRouting: true
edgeRouting: ORTHOGONAL
```

**Alternative - Graphviz DOT:**
```yaml
algorithm: dot
rankdir: LR  # Left-to-right
nodesep: 0.8
ranksep: 1.2
splines: ortho  # Orthogonal edges
```

## Quality Metrics Baselines

Target quality metrics for this dataset:

- **Left-Right Progression**: Clear X-axis increase from start to end
- **Swimlane Alignment**: < 50px variance in Y-position within each lane
- **Lane Separation**: > 150px vertical spacing between lanes
- **Orthogonal Edges**: > 90% of edges should be orthogonal
- **Edge Crossings**: < 3 (well-structured process flow)
- **Gateway Branch Clarity**: Branches should diverge at > 45° angle
- **Aspect Ratio**: 2.0 - 3.0 (horizontal layout)

## Node Counts by Type

- **Activities**: 15 total (4 customer + 5 sales + 4 warehouse + 2 notification)
- **Gateways**: 2 exclusive gateways (decisions)
- **Events**: 3 total (1 start + 2 end)
- **Capabilities**: 6 supporting capabilities
- **Total Elements**: 26 nodes

## Edge Counts by Type

- **Sequence Flows**: 18 edges (activity → activity, activity → gateway, etc.)
- **Capability Support**: 12 edges (capability → activity/gateway)
- **Total Relationships**: 30 edges

## Swimlane Definitions

```yaml
swimlanes:
  - id: customer
    name: Customer
    order: 1
    color: "#E3F2FD"

  - id: sales
    name: Sales
    order: 2
    color: "#FFF3E0"

  - id: warehouse
    name: Warehouse
    order: 3
    color: "#F1F8E9"
```

## Usage in Tests

```typescript
import { loadYAMLModel } from '@/services/yamlParser';
import { transformBusinessLayer } from '@/core/services/businessGraphTransformer';
import { LayoutEngineRegistry } from '@/core/layout/engines/LayoutEngineRegistry';

// Load dataset
const model = await loadYAMLModel('/tests/fixtures/public-datasets/business/');

// Transform to graph
const { nodes, edges } = transformBusinessLayer(model.layers.business);

// Apply optimized layout
const engine = LayoutEngineRegistry.getInstance().getEngine('elk');
const result = await engine.calculateLayout(nodes, edges, {
  algorithm: 'layered',
  direction: 'RIGHT',
  spacing: 100,
  orthogonalRouting: true,
  edgeRouting: 'ORTHOGONAL',
  // ... other params
});

// Measure quality
const metrics = calculateBusinessProcessMetrics(result.nodes, result.edges);
expect(metrics.leftRightProgression).toBe(true);
expect(metrics.swimlaneAlignment).toBeGreaterThan(0.9);
expect(metrics.orthogonalEdgeRatio).toBeGreaterThan(0.9);
```

## Visualization Guidelines

When visualizing this dataset:
1. Use different colors for each swimlane background
2. Show activity boxes with rounded corners
3. Display gateways as diamonds
4. Show events as circles (start) or double circles (end)
5. Use orthogonal edges with right-angle bends
6. Label conditional edges (e.g., "Yes", "No", "In Stock", "Out of Stock")
7. Show capabilities as supporting elements (dashed connections)

## BPMN Compliance

This dataset follows BPMN 2.0 conventions:
- **Activities**: Rounded rectangles
- **Gateways**: Diamonds (exclusive gateway = X inside)
- **Events**: Circles (start = thin outline, end = thick outline)
- **Sequence Flow**: Solid arrows
- **Message Flow**: Dashed arrows (between lanes)

## Source Attribution

This dataset is inspired by:
- BPMN 2.0 Specification (OMG)
- Common e-commerce order fulfillment patterns
- Industry best practices for business process modeling

License: Public Domain - Free to use for testing and development purposes.
