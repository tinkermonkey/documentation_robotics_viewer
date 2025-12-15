# Claude Code Development Guide

## Project Overview

React-based visualization tool for multi-layer architecture documentation models using React Flow (@xyflow/react).

**Tech Stack:** React 18 + TypeScript, React Flow, Vite, Playwright, Flowbite React, Tailwind CSS v4, TanStack Router, Zustand

**Architecture Layers:** Motivation, Business, Security, Application, Technology, API, DataModel, UX, Navigation, APM

## Critical React Flow Node Pattern

**MUST follow this exact pattern** - deviations cause rendering failures.

### Creating a Custom Node

```typescript
// 1. Create: src/core/nodes/<category>/<NodeName>Node.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export const YourNode = memo(({ data }: NodeProps<YourNodeData>) => {
  return (
    <div style={{
      width: 180,  // MUST match precalculateDimensions()
      height: 100, // MUST match precalculateDimensions()
    }}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <div className="node-label">{data.label}</div>
    </div>
  );
});

YourNode.displayName = 'YourNode';
```

### Register the Node

**a) Update `src/core/nodes/index.ts`:**
```typescript
import { YourNode } from './YourNode';
export { YourNode };

export const nodeTypes = {
  yourNodeType: YourNode,
};
```

**b) Update `src/core/services/nodeTransformer.ts`:**
```typescript
// In getNodeTypeForElement():
case 'YourElementType': return 'yourNodeType';

// In extractNodeData():
} else if (nodeType === 'yourNodeType') {
  return { ...baseData, yourCustomProp: element.properties.yourCustomProp };
}

// In precalculateDimensions():
case 'yourNodeType':
  element.visual.size = { width: 180, height: 100 }; // MUST match component
  break;
```

### Critical Rules

1. **ALWAYS use `memo`** - Prevents unnecessary re-renders
2. **ALWAYS include Handles** - Required for connections
3. **ALWAYS match dimensions** - Component width/height MUST match `precalculateDimensions()`
4. **ALWAYS use `NodeProps<T>`** - Type props correctly
5. **ALWAYS set `displayName`** - Helpful for debugging

## Embedded App Architecture

### Layout Pattern

**All routes use `SharedLayout`** with 3-column pattern:
- **Left Sidebar** (w-64): Contextual content (layers, changesets)
- **Main Content** (flex-1): Graph/JSON/list view
- **Right Sidebar** (w-80): Annotations + schema info

```typescript
<SharedLayout
  showLeftSidebar={activeView === 'graph'}
  showRightSidebar={true}
  leftSidebarContent={<YourLeftSidebar />}
  rightSidebarContent={<><AnnotationPanel /><SchemaInfoPanel /></>}
>
  {activeView === 'graph' ? <GraphView /> : <JSONView />}
</SharedLayout>
```

### Styling Rules

1. **ALWAYS use Tailwind utilities** - NO new CSS modules
2. **ALWAYS use Flowbite components** - Card, Badge, Button, Modal, etc.
3. **NEVER use dot notation** - `List.Item` ❌ → `ListItem` ✅
4. **ALWAYS add dark mode variants** - `dark:bg-gray-800`, `dark:text-white`
5. **ALWAYS add data-testid** - For E2E tests

### State Management

- **Use Zustand stores** for shared state (NOT React context)
- **WebSocket events** in route components via `websocketClient`
- **Annotations** use optimistic updates via `annotationStore`

## YAML Instance Model Support

Supports both JSON Schema and YAML instance models.

### Key Differences

| Aspect | JSON Schema | YAML Instance |
|--------|-------------|---------------|
| Purpose | Define structure | Actual data |
| Format | Single JSON per layer | manifest.yaml + YAML files |
| IDs | Auto UUIDs | Dot-notation (e.g., `business.function.name`) |
| Relationships | Arrays | Nested under `relationships` key |

### Dot-Notation IDs

Format: `{layer}.{type}.{kebab-case-name}`

Examples:
- `business.function.knowledge-graph-management`
- `api.operation.create-structure-node`
- `data_model.schema.structure-node`

Parser auto-resolves to UUIDs internally.

### Loading YAML Models

1. ZIP contains `manifest.yaml` + layer directories
2. System detects manifest presence
3. Extracts YAML files preserving paths
4. Groups by layer using manifest config
5. Resolves dot-notation references

**See `documentation/YAML_MODELS.md` for full spec.**

## Key Architecture Files

- `src/core/nodes/` - Custom node components
- `src/core/services/nodeTransformer.ts` - Element → React Flow conversion
- `src/core/components/GraphViewer.tsx` - Main React Flow wrapper
- `src/apps/embedded/components/SharedLayout.tsx` - 3-column layout
- `src/services/yamlParser.ts` - YAML model parsing
- `src/services/dataLoader.ts` - Model loading orchestration

## Common Issues

### Layout overlaps/gaps
**Cause:** Dimension mismatch between `precalculateDimensions()` and component CSS
**Fix:** Ensure exact match

### Edges not connecting
**Cause:** Missing/incorrect Handle IDs
**Fix:** Verify `<Handle id="top|bottom|left|right" />` present

### Node not appearing
**Cause:** Type not registered in `nodeTypes`
**Fix:** Check `src/core/nodes/index.ts`

## Development Workflow

1. **Read existing code first** - Follow established patterns
2. **Use TypeScript** - All files strongly typed
3. **Test thoroughly** - `npm test` + `npx playwright test`
4. **Check console** - Monitor React Flow warnings
5. **Follow patterns** - Look at existing nodes/routes for examples

## Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial render (500 elements) | <3s | Viewport culling + Web Workers |
| Filter operations | <500ms | Pre-indexed data structures |
| Layout transitions | <800ms | Async calculation |
| Pan/zoom | 60fps | ReactFlow optimization |

**Web Workers** used for >100 node layouts (see `/public/workers/layoutWorker.js`)

## Testing

**E2E Tests (Playwright):**
- `tests/embedded-app.spec.ts` - Basic navigation
- `tests/embedded-dual-view.spec.ts` - URL routing
- `tests/c4-architecture-view.spec.ts` - C4 features
- `tests/*-accessibility.spec.ts` - WCAG 2.1 AA compliance

**Test Patterns:**
```typescript
<div data-testid="your-component">  // Stable selectors
await expect(page.locator('[data-testid="your-component"]')).toBeVisible();
```

## Export Services

Layers support export to:
- **PNG/SVG** - Image exports via `html-to-image`
- **JSON** - Graph data, catalogs, traceability reports
- **Impact Analysis** - Dependency impact for selected nodes

See `src/services/*ExportService.ts` for implementation patterns.

## Resources

- React Flow: https://reactflow.dev/
- Full docs: `documentation/`
- Example model: `documentation-robotics/` (12-layer reference)
- Implementation logs: `documentation/IMPLEMENTATION_LOG.md`

---

**Version:** 0.1.0 | **React Flow:** 12.0.0 | **Updated:** 2025-12-14
