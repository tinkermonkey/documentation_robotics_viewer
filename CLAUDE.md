# Claude Code Development Guide

## Project Overview

React-based visualization tool for multi-layer architecture documentation models using React Flow (@xyflow/react).

**Tech Stack:** React 19 + TypeScript, @xyflow/react 12.9, Vite, Playwright 1.57, Flowbite React, Tailwind CSS v4, TanStack Router, Zustand 5

**Architecture Layers:** Motivation, Business, Security, Application, Technology, API, DataModel, UX, Navigation, APM

## Development Principles

1. **Read first, always** - NEVER modify code you haven't read
2. **Edit, don't create** - ALWAYS prefer editing existing files over creating new ones
3. **Follow established patterns** - Look at similar implementations before starting
4. **Use TypeScript strictly** - All files must be strongly typed
5. **Test thoroughly** - Run `npm test` before completing tasks
6. **Avoid over-engineering** - Only make requested changes, don't add unrequested features/comments/refactoring

## Critical React Flow Node Pattern

**MUST follow this exact pattern** - deviations cause rendering failures. Reference existing nodes before creating new ones.

### Node Directory

```
src/core/nodes/
├── business/       # BusinessFunction, BusinessService, BusinessCapability
├── motivation/     # Goal, Stakeholder, Constraint, Driver, Outcome, Principle, Assumption, Assessment, ValueStream, Requirement
├── c4/             # Container, Component, ExternalActor
├── BusinessProcessNode.tsx, JSONSchemaNode.tsx, LayerContainerNode.tsx, BaseFieldListNode.tsx
└── index.ts        # Master nodeTypes export
```

### Creating a Custom Node

```typescript
// src/core/nodes/<category>/<NodeName>Node.tsx
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { YourNodeData } from '../../types/reactflow';  // Extend BaseNodeData in types/reactflow.ts

export const YOUR_NODE_WIDTH = 180;
export const YOUR_NODE_HEIGHT = 100;

export const YourNode = memo(({ data, id: _id }: { data: YourNodeData; id?: string }) => {
  return (
    <div
      role="article"
      aria-label={`Your Type: ${data.label}`}
      style={{
        width: YOUR_NODE_WIDTH,    // MUST use the exported constant
        height: YOUR_NODE_HEIGHT,  // MUST use the exported constant
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `2px solid ${data.stroke || '#333'}`,
        backgroundColor: data.fill || '#fff',
        borderRadius: 8,
        padding: 12,
      }}
    >
      <Handle type="target" position={Position.Top} id="top" style={{ background: '#555' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#555' }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: '#555' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#555' }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
        {data.label}
      </div>
    </div>
  );
});

YourNode.displayName = 'YourNode';
```

### Register the Node

1. **`src/core/types/reactflow.ts`** - Add `YourNodeData` interface extending `BaseNodeData`
2. **`src/core/nodes/<category>/index.ts`** - Export node + dimension constants
3. **`src/core/nodes/index.ts`** - Add to `nodeTypes` map (e.g., `yourType: YourNode`)
4. **`src/core/services/nodeTransformer.ts`** - Three places:
   - `getNodeTypeForElement()` - Map element type to node type string
   - `extractNodeData()` - Map element properties to node data
   - `precalculateDimensions()` - Import and use dimension constants

### Node Rules

1. **ALWAYS use `memo`** - Prevents unnecessary re-renders
2. **ALWAYS include 4 Handles** - top, bottom, left, right (see existing nodes)
3. **ALWAYS match dimensions** - Component style MUST use the exported dimension constants
4. **ALWAYS use inline styles** - Nodes use inline styles, not Tailwind classes
5. **ALWAYS use `role="article"` + `aria-label`** - For accessibility
6. **ALWAYS set `displayName`** - For React DevTools debugging
7. **ALWAYS export dimension constants** - `YOUR_NODE_WIDTH` / `YOUR_NODE_HEIGHT` pattern

## Component Organization

```
src/
├── core/                    # Reusable, framework-agnostic
│   ├── nodes/              # Custom React Flow nodes (business/, motivation/, c4/)
│   ├── edges/              # Custom React Flow edge types
│   ├── components/         # GraphViewer, base UI (base/BaseInspectorPanel, BaseControlPanel, GraphViewSidebar)
│   ├── layout/             # Layout engines (engines/, business/, verticalLayerLayout, edgeBundling)
│   ├── services/           # Data transformation (nodeTransformer, dataLoader, yamlParser, etc.)
│   ├── stores/             # Global state (modelStore, layerStore, elementStore, crossLayerStore, layoutPreferencesStore)
│   ├── hooks/              # Shared hooks
│   └── types/              # Core types (model.ts, reactflow.ts, shapes.ts, layers.ts)
├── apps/embedded/          # Standalone embedded app
│   ├── routes/             # TanStack Router route components
│   ├── components/         # shared/, common/, businessLayer/, chat/
│   ├── services/           # App-specific graph builders
│   ├── stores/             # annotationStore, authStore, businessLayerStore, changesetStore, chatStore, connectionStore, floatingChatStore, viewPreferenceStore
│   ├── hooks/, types/, utils/
├── catalog/                # Storybook catalog (components/, fixtures/, providers/)
└── theme/                  # Tailwind CSS theming
```

**Architecture Rules:**
- **Core**: NO route/store dependencies. Import only types and services
- **App components**: Can use route context, embedded stores, app-specific hooks
- **Services**: Stateless; accept data as parameters
- **Stores**: Zustand only (NO React context). Separate stores by concern
- **Types**: Colocate with features; export from `index.ts`

## Styling Rules

1. **ALWAYS use Tailwind utilities** - NO new CSS modules (except node inline styles)
2. **ALWAYS use Flowbite components** - Card, Badge, Button, Modal, etc.
3. **NEVER use dot notation** - `List.Item` -> `ListItem`
4. **ALWAYS add dark mode variants** - `dark:bg-gray-800`, `dark:text-white`
5. **ALWAYS add data-testid** - For E2E tests on app components

## Embedded App Layout

All routes use `SharedLayout` with 3-column pattern:
- **Left Sidebar** (collapsible): Layers, filters, navigation
- **Main Content**: Graph/JSON/List views with ViewToggle
- **Right Sidebar** (collapsible): `GraphViewSidebar` with filterPanel, controlPanel, inspectorContent, annotationPanel props

Section order: Inspector (if visible), Filters, Controls, Annotations (if provided).

## Generic Arrow Components

Use `<T extends unknown>` for generic arrow function components in JSX to avoid type inference issues.

## Testing

### Commands
```bash
npm test                          # Unit/integration tests (~1027 tests, ~10s)
npm test -- tests/unit/foo.spec.ts  # Single file
npm run test:e2e                  # E2E with reference server
npm run test:e2e:headed           # E2E with visible browser
npm run storybook:dev             # Start Storybook on port 61001
npm run storybook:build           # Build Storybook for production
npm run test:storybook            # Validate all stories (578 stories)
npm run test:storybook:a11y       # Generate accessibility report
```

### Test Organization
```
tests/
├── unit/           # Services, utilities, nodes, hooks, layout engines, stores
├── integration/    # Cross-component data flow
├── stories/        # Story validation & error filters
├── helpers/        # Test utilities and factories
├── fixtures/       # Test data
└── *.spec.ts       # E2E tests (embedded-*, c4-*, etc.)

.storybook/
├── main.cjs        # Storybook configuration
├── preview.tsx     # Global decorators and providers
├── manager.ts      # UI customization
└── test-runner.ts  # Test runner configuration
```

### Key Test Patterns

- **Framework**: All tests use Playwright test runner (`import { test, expect } from '@playwright/test'`)
- **Unit tests**: Arrange-Act-Assert, one assertion per test, mock external deps
- **E2E tests**: Wait for specific selectors (not timeouts), check console errors, validate actual rendering (node counts)
- **Stories**: Create `.stories.tsx` alongside components using CSF3 format (`Meta<typeof Component>`, `StoryObj`)
  - Import decorators from `@catalog/decorators/`
  - Use `@storybook/react` (not `@ladle/react`)
  - Run `npm run storybook:dev` to preview stories
- **Storybook Tests**: Use `test-runner.ts` for custom error filtering via `storyErrorFilters.ts`

## Key Files

**Core Pipeline:** `nodeTransformer.ts` -> layout engines -> `GraphViewer.tsx`
**Data Loading:** `dataLoader.ts` -> `yamlParser.ts` / `jsonSchemaParser.ts` -> `crossLayerReferenceExtractor.ts`
**Layout Engines:** `src/core/layout/engines/` (Dagre, ELK, D3Force, Graphviz) + `src/core/layout/business/` (Hierarchical, Swimlane, Matrix, ForceDirected)
**Base UI:** `src/core/components/base/` (BaseInspectorPanel, BaseControlPanel, GraphViewSidebar, RenderPropErrorBoundary)
**Embedded Layout:** `EmbeddedLayout.tsx` -> `SharedLayout.tsx` -> route components

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Node not rendering | Type not mapped in `getNodeTypeForElement()` | Check `nodeTransformer.ts` case statement |
| Node not rendering | Node not in `nodeTypes` export | Check `src/core/nodes/index.ts` |
| Node not rendering | Dimension mismatch | Ensure style uses exported constants |
| Layout overlaps | Bounds calculation wrong | Check layout engine `calculate()` |
| Edges not connecting | Missing/wrong Handle IDs | Verify Handle `id` matches edge definitions |
| Tests failing | Model data changed | Update test fixtures/mocks |

## Accessibility Standards (WCAG 2.1 AA)

All components must meet **WCAG 2.1 Level AA** compliance. Automated testing via Storybook a11y addon in all stories.

### Node Accessibility Pattern

All custom nodes MUST include:

```typescript
<div
  role="article"                          // ✓ Semantic role
  aria-label={`${type}: ${data.label}`}  // ✓ Descriptive label including type
  style={{ /* inline styles */ }}
>
  {/* 4 Handles: top, bottom, left, right */}
  <Handle type="target" position={Position.Top} id="top" />
  <Handle type="source" position={Position.Bottom} id="bottom" />
  <Handle type="target" position={Position.Left} id="left" />
  <Handle type="source" position={Position.Right} id="right" />
  {/* Node content */}
</div>
```

### Edge Accessibility Pattern

All custom edges MUST include:

```typescript
<path
  d={edgePath}
  role="img"  // or "button" for interactive edges
  aria-label={`${relationship}: from ${sourceNode} to ${targetNode}`}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  tabIndex={0}  // if interactive
/>
```

### Color Contrast

- **Text**: Minimum 4.5:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio
- Architecture visualizations may use `reviewOnFail: true` for color contrast violations (marked for manual review)

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order must be logical (top-to-bottom, left-to-right)
- Escape key closes modals/overlays
- Focus must be visible on all focusable elements

### Testing

Run accessibility tests locally:

```bash
npm run storybook:dev
# Open Storybook → any story → Accessibility tab (bottom)

npm run test:storybook:a11y
# Runs automated axe-core tests against all 578 stories
```

For details: `documentation/ACCESSIBILITY.md`

## YAML Instance Models

Supports **JSON Schema** (UUIDs) and **YAML instances** (dot-notation IDs like `business.function.name`). Parser auto-resolves dot-notation to UUIDs. Full spec: `documentation/YAML_MODELS.md`

## DR Slash Commands

- `/dr-model <request>` - Add/update/query architecture model elements
- `/dr-validate` - Validate DR model schema and references
- `/dr-changeset <request>` - Manage isolated architecture changes
- `/dr-init [name]` - Initialize new DR architecture model
- `/dr-ingest <path>` - Generate DR model from existing codebase

---

**Last Updated:** 2026-02-11 | **Test Suite:** 1027 tests in 52 files | **Stories:** 578 in Storybook (96 story files)
