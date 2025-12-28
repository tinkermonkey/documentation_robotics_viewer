# C4 Layer Test Dataset: Cloud-Native SaaS Platform

## Overview

This dataset represents a realistic cloud-native SaaS platform architecture with:
- **1 Core System**: SaaS Platform (internal)
- **4 External Systems**: Auth0, Stripe, SendGrid, DataDog
- **12 Containers**: Web app, mobile app, API gateway, 4 microservices, 3 databases/stores, message queue
- **4 Components**: Detailed view of Order Service internal structure
- **20+ Relationships**: API calls, data flows, integrations

## C4 Model Levels

This dataset supports multiple C4 diagram levels:

### Level 1: System Context
- 1 Core System (SaaS Platform)
- 4 External Systems
- High-level relationships between systems

### Level 2: Container Diagram
- 12 Containers within SaaS Platform
- 4 External Systems
- Container-to-container and container-to-external relationships

### Level 3: Component Diagram (Order Service)
- 4 Components within Order Service container
- Component-to-component relationships
- Component-to-container relationships

## Architecture Patterns

### Microservices Architecture
- Independent services: User, Order, Notification, Analytics
- Service-to-service communication via API Gateway
- Event-driven architecture via Message Queue

### API Gateway Pattern
- Single entry point for all API requests
- Authentication and authorization
- Request routing and composition

### Database per Service
- User Service → User Database
- Order Service → Order Database
- Each service owns its data

### Caching Layer
- Redis cache for sessions, API responses, rate limiting
- Shared across services

### Event-Driven Communication
- Message Queue (RabbitMQ) for asynchronous events
- Order events trigger notifications and analytics

## Expected Layout Characteristics

### System Boundary Grouping
- Internal containers clustered together within system boundary
- External systems positioned outside boundary
- Clear visual separation between internal and external

### Hierarchical Service Dependencies
- Frontend layer (Web, Mobile) at top
- API Gateway in middle
- Microservices layer
- Data layer (Databases, Cache, Queue) at bottom
- External systems positioned to the side

### Container Nesting
- System contains containers
- Containers contain components (for component diagrams)
- Clear parent-child visual relationships

## Optimal Layout Parameters

**ELK Layered Algorithm (recommended for C4):**
```yaml
algorithm: layered
direction: DOWN  # Top-down hierarchy
spacing: 80
layering: NETWORK_SIMPLEX
edgeNodeSpacing: 40
edgeSpacing: 25
aspectRatio: 1.3
orthogonalRouting: false
edgeRouting: POLYLINE
```

**Alternative - Graphviz DOT:**
```yaml
algorithm: dot
rankdir: TB  # Top-bottom
nodesep: 0.8
ranksep: 1.5
splines: spline  # Smooth curves
```

## Quality Metrics Baselines

Target quality metrics for this dataset:

- **System Boundary Clarity**: Internal containers clearly grouped
- **External System Separation**: > 100px from internal container cluster
- **Hierarchical Layering**: Clear frontend → API → services → data layers
- **Edge Crossings**: < 5 (hierarchical structure minimizes crossings)
- **Container Alignment**: Containers at same layer aligned horizontally
- **Aspect Ratio**: 1.2 - 1.6 (balanced layout)
- **Hierarchy Depth**: 4-5 levels (frontend, gateway, services, data, external)

## Node Counts by Type

- **Systems**: 5 total (1 internal + 4 external)
- **Containers**: 12 total (within SaaS Platform)
- **Components**: 4 total (within Order Service)
- **Total Elements**: 21 nodes

## Edge Counts by Type

- **System-to-System**: 1 edge (SaaS → DataDog)
- **Container-to-Container**: 12 edges (internal communication)
- **Container-to-External**: 3 edges (Auth0, Stripe, SendGrid)
- **Component-to-Component**: 3 edges (within Order Service)
- **Total Relationships**: 19 edges

## Container Types

```yaml
container_types:
  - web-app: Frontend web application
  - mobile-app: Native mobile application
  - api: API gateway or REST API
  - microservice: Backend microservice
  - database: Relational or NoSQL database
  - cache: Distributed cache
  - queue: Message queue or event bus
```

## Usage in Tests

```typescript
import { loadYAMLModel } from '@/services/yamlParser';
import { transformC4Layer } from '@/apps/embedded/services/c4ViewTransformer';
import { LayoutEngineRegistry } from '@/core/layout/engines/LayoutEngineRegistry';

// Load dataset
const model = await loadYAMLModel('/tests/fixtures/public-datasets/c4/');

// Transform to C4 graph
const { nodes, edges } = transformC4Layer(model.layers.application);

// Apply optimized layout
const engine = LayoutEngineRegistry.getInstance().getEngine('elk');
const result = await engine.calculateLayout(nodes, edges, {
  algorithm: 'layered',
  direction: 'DOWN',
  spacing: 80,
  // ... other params
});

// Measure quality
const metrics = calculateC4Metrics(result.nodes, result.edges);
expect(metrics.systemBoundaryClustering).toBeGreaterThan(0.8);
expect(metrics.externalSystemSeparation).toBeGreaterThan(100);
expect(metrics.hierarchicalLayering).toBe(true);
```

## Visualization Guidelines

When visualizing this dataset:

### System Context View
1. Show SaaS Platform as large boundary box
2. External systems as separate boxes
3. High-level relationships with labels
4. Use color to distinguish internal vs external

### Container View
1. Group containers within system boundary
2. Use different shapes for container types:
   - Web/Mobile: Browser/phone icon
   - Services: Hexagons
   - Databases: Cylinders
   - Queue: Rectangle with wavy lines
3. Show technology stack labels
4. Use dashed lines for async communication
5. External systems positioned outside boundary

### Component View
1. Show Order Service container as boundary
2. Components within as boxes
3. Show internal component relationships
4. Show external dependencies to other containers/systems

## C4 Model Conventions

This dataset follows C4 model conventions:
- **Systems**: Large boundary boxes
- **Containers**: Boxes with technology labels
- **Components**: Smaller boxes within containers
- **Relationships**: Directed arrows with labels
- **Technology Annotations**: Shown on containers and components

## Source Attribution

This dataset is inspired by:
- C4 Model (https://c4model.com)
- Common cloud-native architecture patterns
- AWS/Azure well-architected frameworks
- Microservices design patterns

License: Public Domain - Free to use for testing and development purposes.

## Notes

- This dataset can generate multiple diagram views (context, container, component)
- Focus on container view for layout optimization testing
- Component view demonstrates nested container structure
- External systems demonstrate boundary separation
