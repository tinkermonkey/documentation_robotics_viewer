# Claude Code Development Guide

## Project Overview

React-based visualization tool for multi-layer architecture documentation models using React Flow (@xyflow/react).

**Tech Stack:** React 18 + TypeScript, React Flow, Vite, Playwright, Flowbite React, Tailwind CSS v4, TanStack Router, Zustand

**Architecture Layers:** Motivation, Business, Security, Application, Technology, API, DataModel, UX, Navigation, APM

## Development Principles

1. **Read first, always** - NEVER modify code you haven't read
2. **Edit, don't create** - ALWAYS prefer editing existing files over creating new ones
3. **Follow established patterns** - Look at similar implementations before starting
4. **Use TypeScript strictly** - All files must be strongly typed
5. **Test thoroughly** - Run `npm test` and `npx playwright test` before completing tasks
6. **Avoid over-engineering** - Only make requested changes, don't add unrequested features/comments/refactoring

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

## Component Organization

```
src/
├── core/               # Reusable, framework-agnostic components
│   ├── nodes/         # Custom React Flow nodes
│   ├── components/    # GraphViewer, shared UI components
│   └── services/      # nodeTransformer, layout algorithms
├── apps/embedded/     # Route-specific embedded app
│   ├── routes/        # TanStack Router route components
│   └── components/    # SharedLayout, sidebars, panels
└── services/          # Data loading, export, WebSocket, stores
```

**Rule:** Core components should have NO route/store dependencies. App components can use both.

## Store & Real-Time Patterns

### Zustand Stores

- **`modelStore`** - Single source of truth for loaded model data (`src/services/modelStore.ts`)
- **`annotationStore`** - Optimistic UI updates, WebSocket sync (`src/services/annotationStore.ts`)
- **`filterStore`** - Active filters across all views (`src/services/filterStore.ts`)

### WebSocket Patterns

```typescript
// In route components only
import { websocketClient } from '@/services/websocketClient';

useEffect(() => {
  websocketClient.on('annotation:created', (data) => {
    annotationStore.getState().addAnnotation(data);
  });

  return () => websocketClient.off('annotation:created');
}, []);
```

### Annotation Optimistic Updates

```typescript
// 1. Update UI immediately
annotationStore.getState().addAnnotation(tempAnnotation);

// 2. Send to server
await createAnnotation(data);

// 3. WebSocket confirms and syncs across clients
```

## Embedded App Architecture

### Layout Pattern

**All routes use `SharedLayout`** with 3-column pattern:
- **Left Sidebar** (w-64): Contextual content (layers, changesets)
- **Main Content** (flex-1): Graph/JSON/list view
- **Right Sidebar** (w-80): Annotations + schema info

```typescript
// SharedLayout API
interface SharedLayoutProps {
  showLeftSidebar?: boolean;
  showRightSidebar?: boolean;
  leftSidebarContent?: React.ReactNode;
  rightSidebarContent?: React.ReactNode;
  children: React.ReactNode;
}

// Usage example with C4RightSidebar
<SharedLayout
  showLeftSidebar={false}
  showRightSidebar={true}
  rightSidebarContent={
    <C4RightSidebar
      selectedContainerTypes={selectedContainerTypes}
      onContainerTypeChange={handleContainerTypeChange}
      selectedLayout={selectedLayout}
      onLayoutChange={handleLayoutChange}
      onFitToView={handleFitToView}
      onExportPNG={handleExportPNG}
      onExportSVG={handleExportSVG}
      // ... other required props
    />
  }
>
  {/* Main graph content */}
</SharedLayout>
```

### Available Sidebar Components

**Right Sidebar Components:**
- `C4RightSidebar` - For C4 Architecture views (filters, controls, inspector, annotations)
- `MotivationRightSidebar` - For Motivation layer views (filters, controls, inspector, annotations)
- `LayoutPreferencesPanel` - For layout preferences configuration

**Left Sidebar Components:**
- `ModelLayersSidebar` - For Model view layer selection

Sidebar content is passed as React nodes via `leftSidebarContent` and `rightSidebarContent` props for maximum flexibility.

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

Supports both **JSON Schema** (UUIDs, single JSON per layer) and **YAML instances** (dot-notation IDs like `business.function.name`, `manifest.yaml` + layer directories). Parser auto-resolves dot-notation to UUIDs internally.

**Full spec:** `documentation/YAML_MODELS.md`

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

## DR Slash Commands

Available Documentation Robotics commands:
- `/dr-model <request>` - Add/update/query architecture model elements
- `/dr-validate` - Validate DR model schema and references
- `/dr-changeset <request>` - Manage isolated architecture changes
- `/dr-init [name]` - Initialize new DR architecture model
- `/dr-ingest <path>` - Generate DR model from existing codebase

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

Layer export services: PNG/SVG (via `html-to-image`), JSON (graph/catalog/traceability), Impact Analysis. See `src/services/*ExportService.ts`.

## Resources

- React Flow: https://reactflow.dev/
- Full docs: `documentation/`
- Example model: `documentation-robotics/` (12-layer reference)
- Implementation logs: `documentation/IMPLEMENTATION_LOG.md`

---

**Version:** 0.1.0 | **React Flow:** 12.0.0 | **Updated:** 2025-12-17
