# C4 Architecture Visualization

This document describes the C4 (Context, Containers, Components, Code) visualization system in the Documentation Robotics Viewer. The C4 model provides a hierarchical way to visualize software architecture at multiple levels of abstraction.

## Overview

The C4 visualization system transforms Documentation Robotics model elements into C4 diagrams, enabling:

- **Context View**: High-level system boundaries and external actors
- **Container View**: Internal containers (services, databases, queues) within the system
- **Component View**: Internal components within a specific container
- **Drill-down Navigation**: Click to explore deeper levels of abstraction

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     MetaModel (DR Model)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────▼──────────────┐
                │      C4GraphBuilder      │
                │    (c4Parser.ts)         │
                └───────────┬──────────────┘
                            │
                ┌───────────▼──────────────┐
                │        C4Graph           │
                │  (Intermediate Format)   │
                └───────────┬──────────────┘
                            │
                ┌───────────▼──────────────┐
                │    C4ViewTransformer     │
                │  (c4ViewTransformer.ts)  │
                └───────────┬──────────────┘
                            │
                ┌───────────▼──────────────┐
                │   ReactFlow Nodes/Edges  │
                │  (Custom C4 Nodes)       │
                └───────────┬──────────────┘
                            │
                ┌───────────▼──────────────┐
                │      C4GraphView         │
                │   (React Component)      │
                └──────────────────────────┘
```

### File Structure

```
src/
├── apps/embedded/
│   ├── components/
│   │   ├── C4GraphView.tsx         # Main visualization component
│   │   ├── C4BreadcrumbNav.tsx     # Hierarchy navigation
│   │   ├── C4FilterPanel.tsx       # Container/technology filters
│   │   ├── C4ControlPanel.tsx      # Layout, view, export controls
│   │   └── C4InspectorPanel.tsx    # Selected element details
│   ├── services/
│   │   ├── c4Parser.ts             # Model → C4Graph conversion
│   │   ├── c4ViewTransformer.ts    # C4Graph → ReactFlow conversion
│   │   └── c4ExportService.ts      # PNG/SVG/JSON export
│   ├── types/
│   │   └── c4Graph.ts              # Type definitions
│   └── stores/
│       └── viewPreferenceStore.ts  # State management
├── core/nodes/c4/
│   ├── ContainerNode.tsx           # Container visualization (280×180)
│   ├── ComponentNode.tsx           # Component visualization (240×140)
│   └── ExternalActorNode.tsx       # External actor visualization (160×120)
```

## Usage

### Accessing the C4 View

1. Load a model (from GitHub, local file, or demo)
2. Click the "Architecture" button in the mode selector
3. The C4 Context view displays automatically

### View Levels

| Level | Description | What's Shown |
|-------|-------------|--------------|
| Context | System boundary view | Containers + External Actors |
| Container | Drill-down into container | Components within container |
| Component | Component internals | Sub-components (if available) |

### Navigation

- **Click container**: Select and show details in inspector panel
- **Double-click container**: Drill down to Container view
- **Breadcrumb**: Click to navigate back to higher levels
- **Escape key**: Clear selection

## Features

### 1. Scenario Presets (Phase 5)

Quick view configurations for common architectural perspectives:

| Preset | Description | Filters Applied |
|--------|-------------|-----------------|
| Data Flow | Highlight data storage and messaging | Databases, Queues, Caches |
| Deployment | Show infrastructure relationships | Deployment overlays |
| Technology Stack | Group by technology | Technology-based filtering |
| API Surface | Show external interfaces | API containers, external actors |
| Dependencies | Upstream/downstream analysis | Path highlighting |

**Usage**: Click preset buttons in the control panel to activate/deactivate.

### 2. Focus+Context Visualization (FR3.3)

Dims non-focused elements for clarity:

```typescript
// Enable focus mode
setC4FocusContextEnabled(true);

// Select a node to focus
// - Focused node: full opacity (1.0)
// - Immediate neighbors: medium opacity
// - Distant nodes: dimmed (0.3 opacity)
```

### 3. Path Tracing (FR3.4)

Trace dependencies through the architecture:

- **Upstream**: Click "Trace Upstream" to highlight all input sources
- **Downstream**: Click "Trace Downstream" to highlight all consumers
- **Between**: Find shortest path between two selected nodes

```typescript
// Example: Trace upstream from a container
const upstream = transformer.traceUpstream('container-id', graph);
// Returns Set<string> of node IDs in the upstream path
```

### 4. Relationship Bundling (FR3.5)

When 3+ connections exist between two containers, they're bundled:

- **Visual**: Dashed line with count indicator
- **Label**: "N connections (protocols...)"
- **Animation**: Animated if any bundled edge is async

### 5. Changeset Visualization (FR6.2)

Elements from active changesets are styled distinctively:

| Status | Border | Background | Effect |
|--------|--------|------------|--------|
| New | Green dashed | Light green | Full visibility |
| Modified | Yellow solid | Light yellow | Orange glow |
| Deleted | Red solid | Light red | Reduced opacity |

**Usage**: Toggle "Show Changeset Only" to filter to changed elements.

### 6. Layout Algorithms

| Algorithm | Description | Best For |
|-----------|-------------|----------|
| Hierarchical | Dagre-based layered layout | Architectural tiers |
| Force-Directed | Physics simulation | Organic clustering |
| Orthogonal | Right-angle edges (placeholder) | Formal diagrams |
| Manual | User-positioned, persisted | Custom arrangements |

### 7. Semantic Zoom

Detail level adapts to zoom level:

| Zoom Level | Detail | Shown |
|------------|--------|-------|
| > 0.8 | Full | Name, type, description, all tech chips |
| 0.5 - 0.8 | Medium | Name, type, limited tech chips |
| < 0.5 | Minimal | Name only |

### 8. Export Options

- **PNG**: Raster image of current viewport
- **SVG**: Vector image for scaling
- **JSON**: Graph data structure for analysis

## Configuration

### View Preferences (Persisted)

```typescript
interface C4Preferences {
  viewLevel: 'context' | 'container' | 'component';
  selectedContainerId?: string;
  selectedComponentId?: string;
  selectedLayout: 'hierarchical' | 'force' | 'orthogonal' | 'manual';
  visibleContainerTypes: Set<ContainerType>;
  visibleTechnologyStacks: Set<string>;
  showDeploymentOverlay: boolean;
  manualPositions: Map<string, { x: number; y: number }>;
  focusContextEnabled: boolean;
  pathTracing: C4PathTracingState;
  scenarioPreset: C4ScenarioPreset;
}
```

### Transformer Options

```typescript
interface C4TransformerOptions {
  viewLevel: C4ViewLevel;
  selectedContainerId?: string;
  selectedComponentId?: string;
  layoutAlgorithm: C4LayoutAlgorithm;
  filterOptions: C4FilterOptions;
  focusContext?: C4FocusContext;
  pathHighlighting?: C4PathHighlighting;
  semanticZoom: C4SemanticZoom;
  scenarioPreset?: C4ScenarioPreset;
  showOnlyChangeset?: boolean;
}
```

## DR Model to C4 Mapping

The C4 parser infers C4 elements from DR model layers:

| DR Layer | DR Element | C4 Type | Logic |
|----------|------------|---------|-------|
| Application | Service with API refs | Container | Has API endpoint relationships |
| Application | Internal module | Component | No direct external API |
| DataModel | Schema, Entity | Database Container | Persistent data |
| Technology | Platform, Infrastructure | Deployment Node | Infrastructure type |
| Security | Role, Permission | External Actor | User classes |
| Business | Process (no realization) | External Actor | Business without app |

### Container Type Inference

```typescript
// Inferred from element properties and relationships
enum ContainerType {
  WebApp = 'webapp',
  MobileApp = 'mobile',
  Api = 'api',
  Database = 'database',
  MessageQueue = 'queue',
  Cache = 'cache',
  FileStorage = 'file-storage',
  Serverless = 'serverless',
  Service = 'service',
  Unknown = 'unknown',
}
```

## Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial render | < 3s | ReactFlow viewport culling |
| Filter operations | < 500ms | Pre-indexed data structures |
| Layout switch | < 800ms | Smooth transitions, caching |
| Drill-down | < 300ms | Cached component hierarchies |
| Memory (200 elements) | < 50MB | Efficient C4Graph structure |

## Testing

### Unit Tests

```bash
# Run C4 transformer tests
npx playwright test tests/unit/c4ViewTransformer.spec.ts
```

### E2E Tests

```bash
# Run C4 architecture view tests
npx playwright test tests/c4-architecture-view.spec.ts
```

### Accessibility Tests

```bash
# Run C4 accessibility tests
npx playwright test tests/c4-accessibility.spec.ts
```

### Performance Tests

```bash
# Run C4 performance tests
npx playwright test tests/c4-performance.spec.ts
```

## Extending the C4 System

### Adding a New Container Type

1. Add to `ContainerType` enum in `c4Graph.ts`
2. Update `inferContainerType()` in `c4Parser.ts`
3. Add color mapping in `c4ViewTransformer.ts`
4. Add filter option in `C4FilterPanel.tsx`

### Adding a New Scenario Preset

1. Add to `C4ScenarioPreset` type in `c4Graph.ts`
2. Add configuration to `C4_SCENARIO_PRESETS` array
3. Update `applyScenarioPreset()` in `c4ViewTransformer.ts`
4. Icon is automatically displayed based on config

### Creating Custom Node Types

Follow the pattern in `CLAUDE.md`:

```typescript
// 1. Create node component in src/core/nodes/c4/
export const CustomNode = memo(({ data }: NodeProps<CustomNodeData>) => {
  return (
    <div style={{ width: CUSTOM_WIDTH, height: CUSTOM_HEIGHT }}>
      <Handle type="target" position={Position.Top} />
      {/* Node content */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

// 2. Register in src/core/nodes/index.ts
export const nodeTypes = {
  c4Custom: CustomNode,
};

// 3. Add dimensions to c4ViewTransformer.ts
export const C4_CUSTOM_NODE_WIDTH = 200;
export const C4_CUSTOM_NODE_HEIGHT = 150;
```

## Troubleshooting

### "No C4 elements found"

The model must have Application layer services to generate C4 containers. Ensure:
- Application services exist in the model
- Services have relationships to other layers

### Layout overlaps

Check that node dimensions in transformer match actual CSS:
- `C4_CONTAINER_NODE_WIDTH` = 280
- `C4_CONTAINER_NODE_HEIGHT` = 180
- Component nodes: 240×140
- External actors: 160×120

### Path tracing returns empty set

Verify:
- Edges exist between nodes
- Node IDs match exactly
- Graph is correctly built

## Version History

- **Phase 5**: Scenario presets, path tracing, changeset visualization, comprehensive testing
- **Phase 4**: Focus+context, inspector panel, advanced filtering
- **Phase 3**: C4GraphView, breadcrumb navigation, export
- **Phase 2**: Custom nodes, layout algorithms
- **Phase 1**: C4Parser, type definitions

---

**Last Updated**: 2025-12-02
**React Flow Version**: 12.0.0
**C4 Model Support**: Context, Container, Component levels
