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
  version: 1.0.0
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
  $schema: http://json-schema.org/draft-07/schema#
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
The `example-implementation/` directory contains a real 182-element model across 11 layers for testing.

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

## Motivation Layer Visualization (Phase 6 - Export & Testing)

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

---

**Last Updated**: 2025-11-30
**React Flow Version**: 12.0.0
**Project Version**: 1.0.0
**YAML Support**: v0.1.0
**Motivation Layer**: Phase 6 Complete
