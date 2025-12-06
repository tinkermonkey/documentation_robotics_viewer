# Claude Code Development Guide

This document provides guidance for Claude Code (and other AI assistants) working on the Documentation Robotics Viewer project.

## Project Overview

The Documentation Robotics Viewer is a React-based visualization tool built on React Flow (@xyflow/react). It displays multi-layer architecture documentation models with custom nodes representing different architectural elements (Business Processes, API Endpoints, Data Models, Roles, Permissions, etc.).

**Key Technologies:**
- React 18 + TypeScript
- React Flow (@xyflow/react) (graph visualization library)
- Vite (build tool)
- Playwright (E2E testing)

## Critical: Custom Node Pattern for React Flow

All custom nodes MUST follow this exact pattern. Deviations will cause rendering failures or layout issues.

### Required Steps for Creating a New Custom Node

#### 1. Create the Node File

Location: `src/core/nodes/<category>/<NodeName>Node.tsx` or `src/core/nodes/<NodeName>Node.tsx`

#### 2. Required Imports

```typescript
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { YourNodeData } from '../types/reactflow'; // Define this interface
```

#### 3. Define Node Component

```typescript
export const YourNode = memo(({ data }: NodeProps<YourNodeData>) => {
  return (
    <div
      style={{
        width: 180, // Must match precalculated dimensions in NodeTransformer
        height: 100,
        display: 'flex',
        flexDirection: 'column',
        border: `1.5px solid ${data.stroke || '#000'}`,
        backgroundColor: data.fill || '#fff',
        borderRadius: 4,
        padding: 12,
      }}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ left: '50%', background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: '50%', background: '#555' }}
      />
      
      {/* Node Content */}
      <div className="node-content">
        <div className="node-label">{data.label}</div>
        {/* Custom content based on data props */}
        {data.yourCustomProp && <div>{data.yourCustomProp}</div>}
      </div>
    </div>
  );
});

YourNode.displayName = 'YourNode';
```

#### 4. Register the Node

**a) Update `src/core/nodes/index.ts`:**

```typescript
// Add import
import { YourNode } from './YourNode';

// Export component
export { YourNode };

// Add to nodeTypes object
export const nodeTypes = {
  // ... existing nodes
  yourNodeType: YourNode,
};
```

**b) Update `src/core/services/nodeTransformer.ts`:**

In `getNodeTypeForElement()` method:

```typescript
case 'YourElementType':
case 'your-element-type':
  return 'yourNodeType';
```

In `extractNodeData()` method:

```typescript
} else if (nodeType === 'yourNodeType') {
  return {
    ...baseData,
    yourCustomProp: element.properties.yourCustomProp,
  };
}
```

In `precalculateDimensions()` method:

```typescript
case 'yourNodeType':
  element.visual.size = {
    width: 180, // Must match CSS width
    height: 100, // Must match CSS height
  };
  break;
```

### Critical Rules

1. **ALWAYS use `memo`** - Wrap node components in `React.memo` to prevent unnecessary re-renders.

2. **ALWAYS include Handles** - React Flow needs `<Handle />` components to create connections.

3. **ALWAYS match dimensions** - The CSS width/height in the component MUST match the dimensions set in `NodeTransformer.precalculateDimensions()`. If they don't match, the layout will be incorrect.

4. **ALWAYS use `NodeProps<T>`** - Type your props correctly using the generic `NodeProps` interface.

5. **ALWAYS set `displayName`** - Helpful for debugging.

### Testing New Nodes

Create a test file in `tests/unit/nodes/yourNode.spec.ts` or similar.

## Architecture Overview

### Layer Structure

The viewer organizes elements into architectural layers:
- **Motivation**: Goals, drivers, stakeholders
- **Business**: Business processes, capabilities
- **Security**: Roles, permissions, policies
- **Application**: Components, services
- **Technology**: Infrastructure, platforms
- **API**: API endpoints, operations
- **DataModel**: Entities, schemas, data structures
- **UX**: User interfaces, screens
- **Navigation**: Navigation flows
- **APM**: Monitoring, observability

### Key Files

- `src/core/nodes/` - All custom node definitions
- `src/core/edges/` - Custom edge definitions (e.g., ElbowEdge)
- `src/core/services/nodeTransformer.ts` - Converts model elements to React Flow nodes
- `src/core/components/GraphViewer.tsx` - Main React Flow component
- `src/stores/elementStore.ts` - Global element storage

### Rendering Flow

1. User loads a model (demo data, GitHub, or local)
2. `GraphViewer` receives the model
3. `NodeTransformer` converts model elements to React Flow nodes and edges
   - Pre-calculates dimensions for layout
   - Runs `VerticalLayerLayout` to determine positions
   - Creates React Flow node objects with data
4. `GraphViewer` updates `nodes` and `edges` state
5. React Flow renders the graph using custom node components

## Common Issues and Solutions

### Issue: "Layout overlaps or gaps"

**Cause**: Mismatch between `NodeTransformer.precalculateDimensions()` and actual component CSS dimensions.

**Solution**: Ensure the width/height in `precalculateDimensions` exactly matches the rendered size of the node component.

### Issue: "Edges not connecting"

**Cause**: Missing Handles or incorrect Handle IDs.

**Solution**: Verify `<Handle />` components exist and IDs match what `NodeTransformer` expects (usually 'top', 'bottom', 'left', 'right').

### Issue: "Node not appearing"

**Cause**: Node type not registered in `nodeTypes`.

**Solution**: Check `src/core/nodes/index.ts` and ensure the type string matches what `NodeTransformer` returns.

## Development Workflow

1. **Before making changes**: Read existing node files to understand the pattern
2. **Create new features**: Follow the patterns established in existing code
3. **Test thoroughly**: Run `npm test` before committing
4. **Check for errors**: Monitor browser console for React Flow warnings

## Code Style

- Use TypeScript for all files
- Use functional components for React
- Use arrow functions for methods when appropriate
- Keep methods focused and single-purpose
- Document complex logic with comments
- Use meaningful variable names

## YAML Instance Model Support (v0.1.0)

The viewer now supports loading YAML-based instance models in addition to JSON Schema definitions. This allows visualization of actual architectural data (not just schemas).

### Key Differences: JSON Schema vs YAML Instance

| Aspect | JSON Schema (v0.1.1) | YAML Instance (v0.1.0) |
|--------|---------------------|------------------------|
| Purpose | Define data structure | Actual architecture data |
| Format | Single JSON per layer | manifest.yaml + multiple YAML files |
| Elements | Schema definitions | Real element instances |
| IDs | Auto-generated UUIDs | Explicit dot-notation (e.g., `business.function.name`) |
| Relationships | Separate relationship arrays | Nested under `relationships` key |
| Organization | Flat layer files | Hierarchical directory structure |

### YAML Instance Model Structure

**manifest.yaml** - Model orchestration file:
```yaml
version: 0.1.0
schema: documentation-robotics-v1
project:
  name: my-project
  description: Project description
  version: 0.1.0
layers:
  business:
    order: 2
    name: Business
    path: model/02_business/
    enabled: true
    elements:
      function: 10
      process: 5
```

**Element Files** (e.g., `02_business/functions.yaml`):
```yaml
Knowledge Graph Management:
  name: Knowledge Graph Management
  description: Manage knowledge graph operations
  id: business.function.knowledge-graph-management
  relationships:
    supports_goals:
      - motivation.goal.improve-data-quality
```

### Dot-Notation ID Format

Format: `{layer}.{type}.{kebab-case-name}`

Examples:
- `business.function.knowledge-graph-management`
- `api.operation.create-structure-node`
- `data_model.schema.structure-node`

The parser automatically resolves these to UUIDs for internal processing.

### OpenAPI Integration

API operations can embed full OpenAPI 3.0 specifications:
```yaml
create-user:
  name: create-user
  method: POST
  path: /api/users
  id: api.operation.create-user
  openapi:
    openapi: 3.0.3
    paths:
      /api/users:
        post:
          summary: Create a new user
          parameters: [...]
```

### JSON Schema Integration

Data models can embed JSON Schema definitions:
```yaml
user-schema:
  name: user-schema
  id: data_model.schema.user
  : http://json-schema.org/draft-07/schema#
  schemas:
    User:
      type: object
      properties:
        id: {type: string, format: uuid}
        name: {type: string}
      required: [id, name]
```

### Projection Rules

The `projection-rules.yaml` file defines cross-layer element generation rules (parsed but not auto-applied):
```yaml
version: 0.1.0
projections:
  - name: business-to-application
    from: business.service
    to: application.service
    rules:
      - create_type: service
        name_template: "{{source.name}}"
        properties:
          realizes: "{{source.id}}"
```

### Best-Effort Parsing

The YAML parser implements best-effort parsing:
- **Fatal Errors**: Missing manifest, no enabled layers → throw exception
- **Warnings**: Malformed elements, broken references → log and continue
- **Result**: Partial model + warnings array in metadata

### Loading YAML Models

**From Local ZIP:**
1. User uploads ZIP containing `manifest.yaml` and layer directories
2. System detects manifest presence
3. Extracts all YAML files with path preservation
4. Groups files by layer using manifest configuration
5. Parses elements and resolves dot-notation references

**From GitHub:**
Same as local, but ZIP downloaded via backend proxy

### Parser Architecture

1. **YAMLParser** (`src/services/yamlParser.ts`)
   - `parseManifest()` - Validates and parses manifest
   - `parseLayerFiles()` - Converts YAML elements to ModelElements
   - `extractRelationshipsFromElement()` - Processes nested relationships
   - `extractOpenAPIDetails()` / `extractJSONSchemaDetails()` - Extracts embedded specs

2. **DataLoader Integration** (`src/services/dataLoader.ts`)
   - `detectSchemaType()` - Detects YAML vs JSON Schema vs JSON instance
   - `parseYAMLInstances()` - Orchestrates full YAML model parsing
   - `resolveDotNotationReferences()` - Maps dot-notation IDs to UUIDs

3. **File Extraction** (`src/services/githubService.ts`, `src/services/localFileLoader.ts`)
   - Extract both `.json` and `.yaml`/`.yml` files from ZIP
   - Preserve full paths for layer grouping
   - Detect manifest presence to determine model type

### Testing

**Integration Tests** (`tests/example-implementation.spec.ts`):
- Verifies manifest structure
- Validates layer directory organization
- Confirms element counts
- Tests OpenAPI/JSON Schema extraction
- Validates projection rules parsing

**Example Model**:
The `documentation-robotics/` directory contains a real model across 12 layers for testing (and for understanding this codebase).

### For More Details

See `documentation/YAML_MODELS.md` for complete specification and examples.

## Resources

- React Flow documentation: https://reactflow.dev/
- Project architecture docs: `documentation/`
- Implementation logs: `documentation/IMPLEMENTATION_LOG.md`

## When in Doubt

1. Look at existing node implementations (BusinessProcessNode, APIEndpointNode, etc.)
2. Check `BaseNode` pattern for requirements
3. Run tests to verify changes
4. Ask the user for clarification on requirements

## Motivation Layer Export & Testing

### Export Features

The motivation layer supports comprehensive export capabilities:

**1. PNG/SVG Image Exports**
```typescript
import { exportAsPNG, exportAsSVG } from '../services/motivationExportService';

// Export current viewport as PNG
await exportAsPNG(reactFlowContainer, 'motivation-graph.png');

// Export as SVG vector image
await exportAsSVG(reactFlowContainer, 'motivation-graph.svg');
```

**2. Graph Data Export**
```typescript
import { exportGraphDataAsJSON } from '../services/motivationExportService';

// Export filtered graph structure
exportGraphDataAsJSON(nodes, edges, motivationGraph, 'graph-data.json');
```

**3. Traceability Report Export**
```typescript
import { exportTraceabilityReport } from '../services/motivationExportService';

// Generate requirement→goal traceability report
exportTraceabilityReport(motivationGraph, 'traceability-report.json');
```

The traceability report includes:
- Requirement-to-goal mappings
- Trace paths (direct and indirect)
- Orphaned requirements (no goal coverage)
- Orphaned goals (no requirement coverage)
- Coverage statistics (percentages)

### Layout Persistence

Manual node positions are automatically persisted to localStorage:

**Implementation Pattern:**
```typescript
// Save positions on drag end (in MotivationGraphView)
const onNodeDragStop = useCallback(
  (_event: any, _node: any) => {
    if (selectedLayout === 'manual') {
      const positions = new Map<string, { x: number; y: number }>();
      nodes.forEach((n) => {
        positions.set(n.id, { x: n.position.x, y: n.position.y });
      });
      setManualPositions(positions); // Saves to localStorage via viewPreferenceStore
    }
  },
  [selectedLayout, nodes, setManualPositions]
);
```

**Storage Key:** `dr-viewer-preferences` (managed by Zustand persist middleware)

**Restoration:** Positions are restored when:
- User reloads the page
- User selects "Manual" layout
- Existing nodes use saved positions, new nodes use auto-layout

### Testing Strategy

**E2E Tests** (`tests/motivation-layer.spec.ts`):
- 15 comprehensive tests covering all user stories
- Export functionality tests
- Layout persistence verification
- Cross-browser compatibility

**Accessibility Tests** (`tests/motivation-accessibility.spec.ts`):
- Axe-core integration for WCAG 2.1 AA compliance
- Keyboard navigation tests
- ARIA label verification
- Screen reader compatibility
- Focus indicator visibility
- Color contrast checks

**Performance Tests** (`tests/motivation-performance.spec.ts`):
- Initial render time (< 3s target)
- Filter operation latency (< 500ms target)
- Layout switch time (< 800ms target)
- Pan/zoom responsiveness (60fps target)
- Memory usage profiling
- Edge rendering performance

**Run Tests:**
```bash
# Start dev server
npm run dev:embedded

# Run all Playwright tests
npx playwright test

# Run specific test suite
npx playwright test motivation-layer
npx playwright test motivation-accessibility
npx playwright test motivation-performance

# Run with UI
npx playwright test --ui
```

### Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial render (500 elements) | < 3s | ReactFlow viewport culling |
| Filter operations | < 500ms | Pre-indexed data structures |
| Layout switch | < 800ms | Smooth transitions, requestAnimationFrame |
| Pan/zoom | 60fps | ReactFlow optimization |
| Memory (1000 elements) | < 50MB | Efficient data structures |

## C4 Architecture Visualization (Phase 5 - Advanced Features)

The C4 visualization system provides hierarchical architecture diagrams following the C4 model (Context, Containers, Components, Code).

### Key Features

**1. Scenario Presets**
Quick view configurations for common architectural perspectives:

```typescript
import { C4_SCENARIO_PRESETS, C4ScenarioPreset } from '../types/c4Graph';

// Available presets: 'dataFlow' | 'deployment' | 'technologyStack' | 'apiSurface' | 'dependency'
setC4ScenarioPreset('dataFlow'); // Activates data flow view
setC4ScenarioPreset(null);        // Deactivates preset
```

**2. Focus+Context Visualization**
```typescript
// Enable focus mode - selected node at full detail, neighbors medium, distant dimmed
transformer.setOptions({
  focusContext: {
    enabled: true,
    focusedNodeId: 'container-id',
    dimmedOpacity: 0.3,
  },
});
```

**3. Path Tracing**
```typescript
// Trace upstream dependencies
const upstream = transformer.traceUpstream('node-id', graph);

// Trace downstream consumers
const downstream = transformer.traceDownstream('node-id', graph);

// Find path between two nodes
const path = transformer.traceBetween('source-id', 'target-id', graph);

// Get edges for highlighting
const edges = transformer.getHighlightedEdges(highlightedNodes, graph);
```

**4. Relationship Bundling**
3+ connections between same nodes are automatically bundled:
- Dashed line with count indicator
- Protocol summary in label
- Animated if any edge is async

**5. Changeset Visualization**
```typescript
// Filter to show only changed elements
transformer.setOptions({
  showOnlyChangeset: true,
});

// Styling: new=green, modified=yellow, deleted=red
```

### C4 Node Components

| Component | Dimensions | Location |
|-----------|------------|----------|
| ContainerNode | 280×180 | `src/core/nodes/c4/ContainerNode.tsx` |
| ComponentNode | 240×140 | `src/core/nodes/c4/ComponentNode.tsx` |
| ExternalActorNode | 160×120 | `src/core/nodes/c4/ExternalActorNode.tsx` |

### C4 Custom Node Pattern

```typescript
// src/core/nodes/c4/YourNode.tsx
export const YourNode = memo(({ data }: NodeProps<C4NodeData>) => {
  return (
    <div
      style={{
        width: YOUR_NODE_WIDTH, // Must match c4ViewTransformer
        height: YOUR_NODE_HEIGHT,
        opacity: data.opacity ?? 1.0,
      }}
      role="button"
      aria-label={`${data.c4Type} ${data.label}`}
    >
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      {/* Content based on data.detailLevel */}
    </div>
  );
});
```

### Testing C4 Features

```bash
# Run C4 unit tests
npx playwright test tests/unit/c4ViewTransformer.spec.ts

# Run C4 E2E tests
npx playwright test tests/c4-architecture-view.spec.ts

# Run C4 accessibility tests
npx playwright test tests/c4-accessibility.spec.ts

# Run C4 performance tests
npx playwright test tests/c4-performance.spec.ts
```

### C4 Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial render (5 containers) | < 3s | ReactFlow viewport culling |
| Filter operations | < 500ms | Pre-indexed data structures |
| Layout switch | < 800ms | Smooth transitions, caching |
| Drill-down navigation | < 300ms | Cached hierarchies |
| Memory (200 elements) | < 50MB | Efficient C4Graph structure |

### For More Details

See `documentation/C4_VISUALIZATION.md` for complete specification and examples.

## Business Layer Export & Reporting

### Export Features

The business layer supports comprehensive export capabilities for processes, functions, services, and capabilities:

**1. PNG/SVG Image Exports**
```typescript
import { exportAsPNG, exportAsSVG } from '../../services/businessExportService';

// Export current viewport as PNG
await exportAsPNG(reactFlowContainer, 'business-layer.png');

// Export as SVG vector image
await exportAsSVG(reactFlowContainer, 'business-layer.svg');
```

**2. Graph Data Export**
```typescript
import { exportGraphDataAsJSON } from '../../services/businessExportService';

// Export filtered graph structure with metadata
exportGraphDataAsJSON(nodes, edges, businessGraph, 'business-graph-data.json');
```

The graph data export includes:
- ReactFlow node positions and data
- Edge connections and types
- Layer counts (functions, processes, services, capabilities)
- Graph metrics (connectivity, hierarchy depth, circular dependencies)

**3. Process Catalog Export**
```typescript
import { exportProcessCatalog } from '../../services/businessExportService';

// Generate comprehensive process catalog
exportProcessCatalog(businessGraph, 'business-catalog.json');
```

The process catalog includes:
- All processes with complete metadata (owner, criticality, lifecycle, domain)
- Subprocess counts
- Upstream and downstream relationships for each process
- Process descriptions

**4. Traceability Report Export**
```typescript
import { exportTraceabilityReport } from '../../services/businessExportService';

// Generate cross-layer traceability report
exportTraceabilityReport(
  businessGraph,
  businessGraph.crossLayerLinks,
  'traceability-report.json'
);
```

The traceability report includes:
- Process-to-goal mappings (business → motivation layer)
- Process-to-component mappings (business → application layer)
- Process-to-data entity mappings (business → data model layer)
- Orphaned processes (not realized by any component)
- Coverage statistics (percentages for each layer)

**5. Impact Analysis Export**
```typescript
import { exportImpactAnalysisReport } from '../../services/businessExportService';

// Generate impact analysis for selected processes
exportImpactAnalysisReport(
  selectedNodes,
  businessGraph,
  'impact-analysis.json'
);
```

The impact analysis report includes:
- Changed processes (user selection)
- Impacted processes (downstream dependencies)
- Impact paths with human-readable process names
- Impact metrics (direct, indirect, total impact)
- Maximum path length

### Export Integration in BusinessLayerView

```typescript
// In BusinessLayerView.tsx
const reactFlowWrapperRef = useRef<HTMLDivElement>(null);

const handleExport = useCallback(
  async (type: 'png' | 'svg' | 'graphData' | 'catalog' | 'traceability' | 'impact') => {
    if (!businessGraph) return;

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

    switch (type) {
      case 'png':
        if (reactFlowWrapperRef.current) {
          await exportAsPNG(reactFlowWrapperRef.current, `business-layer-${timestamp}.png`);
        }
        break;
      case 'svg':
        if (reactFlowWrapperRef.current) {
          await exportAsSVG(reactFlowWrapperRef.current, `business-layer-${timestamp}.svg`);
        }
        break;
      case 'graphData':
        exportGraphDataAsJSON(nodes, edges, businessGraph, `business-graph-${timestamp}.json`);
        break;
      case 'catalog':
        exportProcessCatalog(businessGraph, `business-catalog-${timestamp}.json`);
        break;
      case 'traceability':
        exportTraceabilityReport(
          businessGraph,
          businessGraph.crossLayerLinks,
          `traceability-${timestamp}.json`
        );
        break;
      case 'impact':
        if (selectedNodes.size === 0) {
          setError('Please select at least one process to analyze impact');
          return;
        }
        exportImpactAnalysisReport(
          selectedNodes,
          businessGraph,
          `impact-analysis-${timestamp}.json`
        );
        break;
    }
  },
  [nodes, edges, businessGraph, selectedNodes]
);

// Add ref to graph container
<div ref={reactFlowWrapperRef} style={{ flex: 1, position: 'relative' }}>
  <ReactFlow ... />
</div>
```

### Export Controls UI

The `BusinessLayerControls` component provides export buttons:

```typescript
<div className="export-menu">
  <h3>Export</h3>
  <button onClick={() => onExport('png')}>Export as PNG</button>
  <button onClick={() => onExport('svg')}>Export as SVG</button>
  <button onClick={() => onExport('graphData')}>Export Graph Data</button>
  <button onClick={() => onExport('catalog')}>Export Process Catalog</button>
  <button onClick={() => onExport('traceability')}>Export Traceability Report</button>
  <button onClick={() => onExport('impact')}>Export Impact Analysis</button>
</div>
```

### Export Data Structures

**Process Catalog Entry:**
```typescript
interface ProcessCatalogEntry {
  id: string;
  name: string;
  type: string;
  description?: string;
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
  subprocessCount?: number;
  relationships: {
    upstream: Array<{ type: string; process: string }>;
    downstream: Array<{ type: string; process: string }>;
  };
}
```

**Traceability Report:**
```typescript
interface BusinessTraceabilityReport {
  generated: string;
  summary: {
    totalProcesses: number;
    processesWithMotivationLinks: number;
    processesWithApplicationRealization: number;
    processesWithDataDependencies: number;
    orphanedProcesses: number;
    coverage: {
      motivation: string; // "33.3%"
      application: string; // "66.7%"
      data: string; // "50.0%"
    };
  };
  traceability: Array<{
    process: { id: string; name: string; type: string };
    realizesGoals: Array<{ id: string; type: string }>;
    realizedByComponents: Array<{ id: string; type: string }>;
    usesDataEntities: Array<{ id: string; type: string }>;
  }>;
  orphanedProcesses: Array<{ id: string; name: string }>;
}
```

**Impact Analysis Report:**
```typescript
interface ImpactAnalysisReport {
  generated: string;
  changedProcesses: Array<{ id: string; name?: string }>;
  impact: {
    directImpact: number;
    indirectImpact: number;
    totalImpact: number;
    maxPathLength: number;
  };
  impactedProcesses: Array<{ id: string; name?: string; type?: string }>;
  impactPaths: Array<{
    path: string[]; // Human-readable process names
    length: number;
  }>;
}
```

### Testing Strategy

**Unit Tests** (`tests/unit/businessExportService.spec.ts`):
- All export functions generate correct data structures
- Process catalog includes complete metadata
- Traceability report calculates coverage correctly
- Impact analysis uses analyzeImpact service
- Empty graphs handled gracefully
- Orphaned process identification

**E2E Tests** (`tests/e2e/business-layer-export.spec.ts`):
- PNG/SVG export downloads work
- JSON exports have valid structure
- Traceability report includes cross-layer links
- Impact analysis requires node selection
- All exports complete in <3s
- Filenames include timestamps
- Exports exclude ReactFlow controls from images

**Run Tests:**
```bash
# Start dev server
npm run dev:embedded

# Run all tests
npx playwright test

# Run business export tests
npx playwright test business-layer-export

# Run unit tests
npm test businessExportService
```

### Performance Requirements

| Export Type | Target | Implementation |
|------------|--------|----------------|
| PNG/SVG | <3s | html-to-image library, high-quality rendering |
| Graph Data | <1s | Direct JSON serialization |
| Process Catalog | <2s | Efficient Map iteration |
| Traceability Report | <3s | Pre-indexed cross-layer links |
| Impact Analysis | <2s | Optimized graph traversal |

### Best Practices

1. **Always generate timestamped filenames** to prevent overwrites
2. **Validate businessGraph exists** before exporting
3. **Show user feedback** during export (loading states)
4. **Handle errors gracefully** with clear error messages
5. **Exclude UI controls** from image exports (ReactFlow controls, minimap)
6. **Use human-readable names** in reports (not just IDs)
7. **Include metadata** in all exports (timestamp, version, counts)
8. **Ensure JSON is pretty-printed** (2-space indent) for readability

### Common Use Cases

**Scenario 1: Document Process Architecture**
```typescript
// Export process catalog for documentation
exportProcessCatalog(businessGraph, 'process-catalog.json');
```

**Scenario 2: Analyze Change Impact**
```typescript
// Select process to change
setSelectedNodes(new Set(['process-order-fulfillment']));

// Export impact analysis
exportImpactAnalysisReport(
  selectedNodes,
  businessGraph,
  'order-fulfillment-impact.json'
);
```

**Scenario 3: Audit Traceability**
```typescript
// Export traceability report for compliance
exportTraceabilityReport(
  businessGraph,
  businessGraph.crossLayerLinks,
  'compliance-traceability-report.json'
);

// Review orphaned processes in report.orphanedProcesses
// Review coverage in report.summary.coverage
```

**Scenario 4: Share Visualization**
```typescript
// Export high-res image for presentation
await exportAsPNG(reactFlowContainer, 'business-architecture.png');
```

## Business Layer Performance Optimization

### Performance Targets

The business layer visualization meets these performance targets:

| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial render (500 elements) | <3s | Web Worker + viewport culling |
| Filter operations | <500ms | Pre-indexed data structures |
| Layout transitions | <800ms | Async layout calculation |
| Pan/zoom | 60fps | ReactFlow optimization |
| Memory (1000 elements) | <50MB | Efficient data structures |

### Web Worker for Large Layouts

For graphs with >100 nodes, layout calculations are offloaded to a Web Worker to keep the UI responsive.

**Worker Implementation** (`/public/workers/layoutWorker.js`):
```javascript
importScripts('https://unpkg.com/dagre@0.8.5/dist/dagre.min.js');

self.onmessage = function(e) {
  const { graph, options } = e.data;

  // Create dagre graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: options.direction || 'TB',
    nodesep: options.spacing?.node || 80,
    ranksep: options.spacing?.rank || 120,
  });

  // Add nodes and edges
  graph.nodes.forEach(node => {
    g.setNode(node.id, {
      width: node.dimensions.width,
      height: node.dimensions.height,
    });
  });

  graph.edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  // Run layout
  dagre.layout(g);

  // Extract positions
  const positions = {};
  graph.nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    positions[node.id] = {
      x: dagreNode.x - node.dimensions.width / 2,
      y: dagreNode.y - node.dimensions.height / 2,
    };
  });

  self.postMessage({ success: true, positions });
};
```

**Layout Engine Integration** (`HierarchicalBusinessLayout.ts`):
```typescript
async calculate(graph: BusinessGraph, options: LayoutOptions): Promise<LayoutResult> {
  const nodeCount = graph.nodes.size;

  // Use Web Worker for large graphs (>100 nodes)
  if (nodeCount > 100) {
    return this.calculateInWorker(graph, options);
  }

  // Use main thread for small graphs
  return this.calculateWithDagre(graph, options);
}

private async calculateInWorker(
  graph: BusinessGraph,
  options: LayoutOptions
): Promise<LayoutResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/workers/layoutWorker.js');

    worker.postMessage({
      graph: serializeGraph(graph),
      options,
    });

    worker.onmessage = (e) => {
      const { success, positions, error } = e.data;

      if (!success) {
        reject(new Error(error));
        return;
      }

      const result = this.createReactFlowResult(graph, positions);
      worker.terminate();
      resolve(result);
    };

    // Timeout after 30 seconds
    setTimeout(() => {
      worker.terminate();
      reject(new Error('Layout worker timeout'));
    }, 30000);
  });
}
```

### Viewport Culling

ReactFlow's `onlyRenderVisibleElements` prop is enabled for optimal performance with large graphs:

```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onlyRenderVisibleElements={true} // Critical for >200 nodes
  fitView
  minZoom={0.1}
  maxZoom={2}
>
  {/* ... */}
</ReactFlow>
```

This ensures only visible nodes are rendered, significantly improving pan/zoom performance for large graphs.

### Filter Performance

Filters use pre-built indices for O(1) lookups instead of O(n) array filtering:

```typescript
interface BusinessGraph {
  nodes: Map<string, BusinessNode>;
  edges: Map<string, BusinessEdge>;
  indices: {
    byType: Map<BusinessNodeType, Set<string>>;
    byDomain: Map<string, Set<string>>;
    byLifecycle: Map<string, Set<string>>;
    byCriticality: Map<string, Set<string>>;
  };
}

// Fast filtering using pre-built indices
function filterNodes(
  nodes: Node[],
  filters: BusinessFilters,
  graph: BusinessGraph
): Node[] {
  if (!filters.types.size) return nodes;

  const visibleIds = new Set<string>();

  // Intersect filter sets using indices
  for (const type of filters.types) {
    const typeSet = graph.indices.byType.get(type);
    typeSet?.forEach(id => visibleIds.add(id));
  }

  return nodes.filter(n => visibleIds.has(n.id));
}
```

### Testing

**Note:** The Business Layer is currently tested via unit and integration tests. E2E browser tests are not yet implemented because the Business Layer is not integrated into the embedded app routes.

**Unit Tests** (using Vitest):
- `tests/unit/businessLayerParser.spec.ts` - Parser validation and edge cases
- `tests/unit/businessGraphBuilder.spec.ts` - Graph building logic
- `tests/unit/crossLayerReferenceResolver.spec.ts` - Cross-layer link resolution
- `tests/unit/nodes/businessNodes.spec.ts` - Node component rendering
- `tests/unit/hooks/useBusinessFilters.spec.ts` - Filter logic
- `tests/unit/hooks/useBusinessFocus.spec.ts` - Focus mode logic
- `tests/unit/layout/*.spec.ts` - Layout algorithm tests

**Integration Tests** (using Playwright test runner):
- `tests/business-layer-integration.spec.ts` - End-to-end parsing with example-implementation model
- `tests/business-layer-performance.spec.ts` - Parser and graph builder performance benchmarks

**Run Tests:**
```bash
# Run unit tests
npm test

# Run integration tests
npx playwright test business-layer

# Run specific test file
npx playwright test business-layer-integration
npx playwright test business-layer-performance
```

**Future E2E Tests (Not Yet Implemented):**
Once the Business Layer is integrated into the embedded app with a `/business` route, E2E browser tests should be added for:
- Initial render performance with large graphs
- Filter and layout switching interactions
- Export functionality (PNG, SVG, JSON)
- Accessibility compliance (WCAG 2.1 AA)
- Keyboard navigation
- Focus modes and node selection

### Performance Monitoring

The business layer logs performance metrics to the console:

```typescript
// In BusinessLayerView.tsx
if (layoutResult.metadata) {
  const { calculationTime, usedWorker } = layoutResult.metadata;
  console.log(
    `Layout calculated in ${calculationTime.toFixed(2)}ms ${usedWorker ? '(Web Worker)' : '(main thread)'}`
  );
}
```

Monitor these logs during development to ensure performance targets are met.

---

**Last Updated**: 2025-12-06
**React Flow Version**: 12.0.0
**Project Version**: 0.1.0
**YAML Support**: v0.1.0
**Motivation Layer**: Phase 6 Complete
**Business Layer**: Complete
**C4 Visualization**: Phase 5 Complete
**Performance Optimization**: Complete
