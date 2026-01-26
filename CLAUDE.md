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

### Node Directory Organization

```
src/core/nodes/
├── business/              # Business layer nodes
│   ├── BusinessProcessNode.tsx
│   ├── BusinessFunctionNode.tsx
│   ├── BusinessServiceNode.tsx
│   ├── BusinessCapabilityNode.tsx
│   └── index.ts
├── motivation/            # Motivation layer nodes
│   ├── GoalNode.tsx
│   ├── StakeholderNode.tsx
│   ├── ConstraintNode.tsx
│   └── index.ts
├── other/                 # Other layer nodes
│   └── ...
└── index.ts              # Master exports
```

### Creating a Custom Node

```typescript
// 1. Create: src/core/nodes/<category>/<NodeName>Node.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '@/core/types';

interface YourNodeData extends NodeData {
  // Custom properties for your node
  customProperty?: string;
}

export const YourNode = memo(({ data }: NodeProps<YourNodeData>) => {
  return (
    <div
      className="flex flex-col items-center justify-center bg-white border-2 border-gray-300 rounded"
      style={{
        width: 180,   // MUST match precalculateDimensions()
        height: 100,  // MUST match precalculateDimensions()
      }}
      data-testid={`node-${data.elementId}`}
    >
      <Handle type="target" position={Position.Top} id="top" />
      <div className="text-sm font-semibold text-center px-2">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
});

YourNode.displayName = 'YourNode';
export const YourNodeDimensions = { width: 180, height: 100 };
```

### Register the Node

**a) Update `src/core/nodes/category/index.ts`:**
```typescript
import { YourNode, YourNodeDimensions } from './YourNode';

export { YourNode, YourNodeDimensions };
```

**b) Update `src/core/nodes/index.ts`:**
```typescript
import { YourNode } from './category/YourNode';

export const nodeTypes = {
  yourNodeType: YourNode,
};

export const nodeDimensions = {
  yourNodeType: { width: 180, height: 100 },
};
```

**c) Update `src/core/services/nodeTransformer.ts`:**
```typescript
import { nodeDimensions } from '@/core/nodes';

// In getNodeTypeForElement():
case 'YourElementType':
  return 'yourNodeType';

// In extractNodeData():
} else if (nodeType === 'yourNodeType') {
  return {
    ...baseData,
    customProperty: element.properties?.customProperty,
  };
}

// In precalculateDimensions():
case 'yourNodeType':
  element.visual.size = nodeDimensions.yourNodeType;
  break;
```

### Testing Nodes

```typescript
// tests/unit/nodes/yourNodes.spec.ts
test('should have correct dimensions', () => {
  const node = render(
    <YourNode data={{ label: 'Test', elementId: 'test-1' }} />
  );

  const element = node.container.firstChild as HTMLElement;
  expect(element.style.width).toBe('180px');
  expect(element.style.height).toBe('100px');
});

test('should have accessibility attributes', () => {
  const node = render(
    <YourNode data={{ label: 'Test', elementId: 'test-1' }} />
  );

  expect(node.container.querySelector('[data-testid="node-test-1"]')).toBeInTheDocument();
});
```

### Critical Rules

1. **ALWAYS use `memo`** - Prevents unnecessary re-renders (verify with tests)
2. **ALWAYS include Handles** - Required for connections (top for target, bottom for source minimum)
3. **ALWAYS match dimensions** - Component style width/height MUST match `nodeDimensions` export
4. **ALWAYS use `NodeProps<T>`** - Type props correctly with extended `NodeData` interface
5. **ALWAYS set `displayName`** - Helpful for debugging and React DevTools
6. **ALWAYS export dimensions** - Export `NodeDimensions` constant for use in transformer
7. **ALWAYS test dimensions** - Unit tests must verify dimensions match constant
8. **ALWAYS add data-testid** - Use `data-testid="node-${data.elementId}"` for E2E tests

## Component Organization

```
src/
├── core/                    # Reusable, framework-agnostic components
│   ├── nodes/              # Custom React Flow nodes
│   │   ├── business/       # Business layer nodes
│   │   ├── motivation/     # Motivation layer nodes
│   │   └── other/          # Other layer nodes
│   ├── edges/              # Custom React Flow edge types
│   ├── components/         # GraphViewer, base UI components
│   ├── layout/             # Layout engines (VerticalLayout, Hierarchical, ForceDirected, etc.)
│   ├── services/           # Data transformation (NodeTransformer, GraphBuilder)
│   ├── stores/             # Global state (model, filter, annotation stores)
│   ├── hooks/              # Shared hooks (useGraphState, etc.)
│   └── types/              # Core TypeScript types
├── apps/embedded/          # Standalone embedded app
│   ├── routes/             # TanStack Router route components
│   ├── components/
│   │   ├── shared/         # Shared layout (BreadcrumbNav, FilterPanel, ExportButtonGroup)
│   │   └── common/         # Route-specific components
│   ├── services/           # App-specific services (GraphBuilder variants, MotivationGraphBuilder)
│   ├── stores/             # App-specific stores
│   ├── hooks/              # App-specific hooks
│   ├── types/              # App-specific types
│   └── utils/              # App utilities
├── catalog/                # Ladle component storybook
│   ├── components/         # Story components
│   ├── fixtures/           # Mock data for stories
│   └── providers/          # Test providers
└── theme/                  # Tailwind CSS theming
```

**Architecture Rules:**
- **Core components**: NO direct route/store dependencies. Import only types and services
- **App components**: Can use route context, embedded stores, and app-specific hooks
- **Services**: Stateless logic; accept data as parameters
- **Stores**: Use Zustand for state management (NO React context)
- **Types**: Colocate with features using them; export from `index.ts`

## Store & Real-Time Patterns

### Zustand Stores

**Core Stores** (shared across all apps):
- **`modelStore`** - Loaded model data, element/layer lookups
  - State: `model`, `loading`, `error`
  - Selectors: `getLayer()`, `getElement()`, `getElementsByType()`
  - Location: `src/core/stores/modelStore.ts`

- **`filterStore`** - Active layer/element filters
  - State: `visibleLayers`, `visibleTypes`, `searchText`
  - Actions: `toggleLayer()`, `setTypeFilter()`, `setSearchText()`
  - Location: `src/core/stores/filterStore.ts`

**App-Specific Stores** (embedded app):
- **`layoutPreferences`** - User layout and UI preferences
  - State: `defaultLayout`, `sidebarWidths`, `expandedSections`
  - Persisted: localStorage
  - Location: `src/apps/embedded/stores/layoutPreferences.ts`

- **`annotationStore`** - Annotations with optimistic updates
  - State: `annotations`, `loading`, `error`
  - Actions: `addAnnotation()`, `updateAnnotation()`, `deleteAnnotation()`
  - Location: `src/apps/embedded/stores/annotationStore.ts`

### Store Best Practices

```typescript
// Good: Use selectors for derived state
const visibleLayers = useStore((state) => state.visibleLayers.filter(l => l.visible));

// Good: Use actions for state mutations
const { toggleLayer } = useStore();
toggleLayer('business');

// Avoid: Direct state access in loops
// Bad: for (const layer of state.layers) { ... }
// Good: Use getState() in callbacks
store.getState().layers.forEach(layer => { ... });

// Good: Separate stores by concern
const model = useStore((state) => state.model);  // modelStore
const filters = useFilterStore((state) => state.visibleLayers);  // filterStore
```

### WebSocket Patterns (Embedded App)

```typescript
// In route components only
import { websocketClient } from '@/services/websocketClient';
import { annotationStore } from '@/apps/embedded/stores/annotationStore';

useEffect(() => {
  // Subscribe to WebSocket events
  websocketClient.on('annotation:created', (data) => {
    annotationStore.getState().addAnnotation(data);
  });

  websocketClient.on('annotation:updated', (data) => {
    annotationStore.getState().updateAnnotation(data);
  });

  // Cleanup
  return () => {
    websocketClient.off('annotation:created');
    websocketClient.off('annotation:updated');
  };
}, []);
```

### Optimistic Updates Pattern

```typescript
// 1. Create temp object with temp ID
const tempAnnotation = {
  id: `temp-${Date.now()}`,
  ...formData,
  status: 'pending'
};

// 2. Update UI immediately
annotationStore.getState().addAnnotation(tempAnnotation);

// 3. Send to server (async)
try {
  const result = await createAnnotation(formData);

  // 4. Replace temp with real data
  annotationStore.getState().updateAnnotation({
    id: tempAnnotation.id,
    ...result
  });
} catch (error) {
  // 5. Remove on error
  annotationStore.getState().deleteAnnotation(tempAnnotation.id);
  showError('Failed to save annotation');
}
```

### Store Testing Pattern

```typescript
test('should add annotation to store', () => {
  const { result } = renderHook(() => annotationStore());

  act(() => {
    result.current.addAnnotation({ id: '1', text: 'Test' });
  });

  expect(result.current.annotations).toHaveLength(1);
  expect(result.current.annotations[0].text).toBe('Test');
});
```

## Embedded App Architecture

### Layout Pattern

**All routes use `SharedLayout`** with flexible 3-column pattern:
- **Left Sidebar** (w-64, collapsible): Layers, filters, navigation
- **Main Content** (flex-1): Graph/JSON/List views with ViewToggle
- **Right Sidebar** (w-80, collapsible): Contextual panels using `GraphViewSidebar`

```typescript
<SharedLayout
  showLeftSidebar={true}
  showRightSidebar={true}
  leftSidebarContent={<LayerPanel />}
  rightSidebarContent={
    <GraphViewSidebar
      sections={[
        { id: 'info', title: 'Element Info', component: <ElementInfoPanel /> },
        { id: 'annotations', title: 'Annotations', component: <AnnotationPanel /> },
        { id: 'references', title: 'References', component: <ReferencesPanel /> }
      ]}
      defaultOpenSections={['info', 'annotations']}
    />
  }
>
  <ViewToggle activeView={activeView} onChange={setActiveView} />
  {activeView === 'graph' && <GraphView />}
  {activeView === 'json' && <JSONView />}
  {activeView === 'list' && <ListView />}
</SharedLayout>
```

### GraphViewSidebar Component

**Generic sidebar component for consistent right-panel layouts:**

```typescript
interface GraphViewSidebarProps {
  sections: Array<{
    id: string;
    title: string;
    component: React.ReactNode;
    icon?: React.ReactNode;
  }>;
  defaultOpenSections?: string[];
  collapsible?: boolean;
}

<GraphViewSidebar
  sections={sections}
  defaultOpenSections={['overview']}
/>
```

Benefits:
- ✅ Consistent UI across all routes
- ✅ Reusable state management for open/closed sections
- ✅ Reduced code duplication (was ~500 lines per sidebar)
- ✅ Type-safe section configuration
- ✅ Easy to add new sections without code changes

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

**Core Services:**
- `src/core/services/nodeTransformer.ts` - Element → React Flow node conversion
- `src/core/services/edgeTransformer.ts` - Relationship → React Flow edge conversion
- `src/core/services/layoutService.ts` - Layout algorithm orchestration
- `src/core/layout/` - Layout engines (Vertical, Hierarchical, ForceDirected, Swimlane, etc.)
- `src/core/hooks/useGraphState.ts` - Centralized graph state management
- `src/core/components/GraphViewer.tsx` - Main React Flow wrapper component

**App Services:**
- `src/apps/embedded/services/motivationGraphBuilder.ts` - Motivation layer graph construction
- `src/apps/embedded/services/businessGraphBuilder.ts` - Business layer graph construction
- `src/apps/embedded/services/c4ViewTransformer.ts` - C4 architecture transformation
- `src/apps/embedded/services/yamlParser.ts` - YAML instance model parsing
- `src/apps/embedded/services/dataLoader.ts` - Model loading orchestration
- `src/apps/embedded/routes/` - TanStack Router route components

**Stores (Zustand):**
- `src/core/stores/modelStore.ts` - Loaded model data
- `src/core/stores/filterStore.ts` - Active layer/element filters
- `src/apps/embedded/stores/layoutPreferences.ts` - User layout preferences
- `src/apps/embedded/stores/annotationStore.ts` - Annotation state

**UI Layout:**
- `src/apps/embedded/components/shared/SharedLayout.tsx` - 3-column layout container
- `src/apps/embedded/components/shared/GraphViewSidebar.tsx` - Generic sidebar component
- `src/apps/embedded/components/shared/FilterPanel.tsx` - Layer/element filtering
- `src/apps/embedded/components/shared/ExportButtonGroup.tsx` - Export functionality

## Testing Best Practices

### Running Tests
```bash
# All tests (fast - ~6 seconds)
npm test

# Watch mode for development
npm run test:watch

# E2E tests with servers (slow - requires setup)
npm run test:e2e

# Story validation (requires Ladle running)
npm run catalog:dev       # Terminal 1
npm run test:stories      # Terminal 2

# Specific test file
npm test -- tests/unit/motivationGraphBuilder.spec.ts
```

### Unit Test Guidelines

1. **Test Isolation**: Each test should be independent
   ```typescript
   test.beforeEach(async () => {
     // Fresh setup for each test
     builder = new MotivationGraphBuilder();
   });
   ```

2. **Arrange-Act-Assert Pattern**:
   ```typescript
   test('should transform elements correctly', () => {
     // Arrange
     const model = createTestMetaModel([...]);

     // Act
     const result = builder.build(model);

     // Assert
     expect(result.nodes.size).toBe(3);
   });
   ```

3. **Mock External Dependencies**:
   ```typescript
   const mockLayout = {
     calculate: jest.fn().mockResolvedValue({ x: 100, y: 200 })
   };
   ```

### E2E Test Guidelines

1. **Use Proper Wait Strategies** (avoid hardcoded delays):
   ```typescript
   // Good: Wait for specific element
   await page.waitForSelector('.react-flow__node', { timeout: 10000 });

   // Bad: Hardcoded delay
   await page.waitForTimeout(5000);
   ```

2. **Check for Console Errors**:
   ```typescript
   const errors: string[] = [];
   page.on('console', msg => {
     if (msg.type() === 'error') errors.push(msg.text());
   });
   await page.waitForTimeout(1000);
   expect(errors).toHaveLength(0);
   ```

3. **Validate Actual Rendering** (not just DOM structure):
   ```typescript
   // Good: Count actual rendered nodes
   const nodeCount = await page.locator('.react-flow__node').count();
   expect(nodeCount).toBeGreaterThan(0);

   // Bad: Only check if container exists
   await expect(page.locator('.graph-viewer')).toBeVisible();
   ```

### Story Validation

Stories validate that components render without errors across 481+ Ladle component variations. When adding new components:

1. Create `.stories.tsx` file alongside component
2. Run `npm run test:stories:generate` to auto-create tests
3. Run `npm run test:stories` to validate all stories

### Test Coverage Goals

| Category | Target | Status |
|----------|--------|--------|
| Unit tests (services/utils) | >90% | ✅ High coverage |
| Unit tests (components) | >70% | ✅ Good coverage |
| Integration tests | >80% | ✅ Good coverage |
| E2E tests | >60% | ✅ Good coverage |
| Story validation | 100% | ✅ 481 stories validated |

## Common Issues

### Node not rendering
**Cause 1:** Element type not mapped in `getNodeTypeForElement()`
- **Fix:** Check `src/core/services/nodeTransformer.ts` case statement

**Cause 2:** Node type not registered in `nodeTypes` export
- **Fix:** Check `src/core/nodes/index.ts` includes your node

**Cause 3:** Dimension mismatch in `precalculateDimensions()`
- **Fix:** Ensure component's CSS dimensions match transformer calculation

### Layout overlaps/gaps
**Cause:** Layout engine bounds calculation incorrect
**Fix:** Check layout engine's `calculate()` method returns correct bounds

### Edges not connecting
**Cause:** Missing or incorrect Handle IDs
**Fix:** Verify `<Handle id="top|bottom|left|right" />` matches node's edge definition

### Performance degradation
**Cause 1:** Too many DOM nodes rendered
- **Fix:** Check if layer visibility filtering is working

**Cause 2:** Layout calculation taking too long
- **Fix:** Use appropriate layout engine for layer size (Swimlane for 50+, ForceDirected for <100)

### Tests failing unexpectedly
**Cause:** Model data has changed
**Fix:** Update test fixtures or mock data to match current model structure

## DR Slash Commands

Available Documentation Robotics commands:
- `/dr-model <request>` - Add/update/query architecture model elements
- `/dr-validate` - Validate DR model schema and references
- `/dr-changeset <request>` - Manage isolated architecture changes
- `/dr-init [name]` - Initialize new DR architecture model
- `/dr-ingest <path>` - Generate DR model from existing codebase

## Comprehensive Testing Guide

### Test Organization

The test suite is organized by type and layer:

```
tests/
├── unit/                          # Isolated service & utility tests
│   ├── businessGraphBuilder.spec.ts
│   ├── c4ViewTransformer.spec.ts
│   ├── layout/                    # Layout engine tests
│   ├── nodes/                     # Node component tests
│   ├── hooks/                     # Custom hook tests
│   ├── preferences/               # Store persistence tests
│   └── validation/                # Graph validation tests
├── integration/                   # Cross-component data flow
│   ├── c4ParserIntegration.spec.ts
│   └── preferencePersistence.spec.ts
├── c4-*.spec.ts                  # C4 architecture E2E tests
├── embedded-*.spec.ts            # Embedded app E2E tests
├── stories/                       # Auto-generated story validation
│   └── all-stories.spec.ts
└── README.md                      # Testing documentation

```

### Test Pyramid Strategy

```
          E2E Tests (6 files, ~400 tests)
           ↑ Slow (~30-60s) - Comprehensive
          /
         / Integration Tests (2 files, ~50 tests)
        ↑ Medium (~5-10s) - Cross-component
       /
      / Unit Tests (25+ files, ~900 tests)
     ↑ Fast (<6s) - Isolated
```

**Rule:** Implement at the lowest level possible, then verify with higher levels.

### Writing Unit Tests

**File Location**: `tests/unit/<feature>/<Feature>.spec.ts`

**Structure**:
```typescript
import { test, expect } from '@playwright/test';
import { MyService } from '../../src/path/MyService';

test.describe('MyService', () => {
  let service: MyService;

  test.beforeEach(() => {
    service = new MyService();
  });

  test.describe('method()', () => {
    test('should do something when condition is met', () => {
      // Setup
      const input = { /* ... */ };

      // Act
      const result = service.method(input);

      // Assert
      expect(result).toEqual({ /* ... */ });
    });

    test('should handle error gracefully', () => {
      const input = { /* invalid */ };

      expect(() => service.method(input)).toThrow('Expected error');
    });
  });
});
```

**Best Practices**:
- ✅ One logical assertion per test
- ✅ Descriptive test names that explain the scenario
- ✅ Use `test.beforeEach()` for setup, not manual setup
- ✅ Test both happy path and error cases
- ✅ Mock external dependencies
- ❌ Don't test implementation details
- ❌ Don't hardcode test data in multiple places

### Writing E2E Tests

**File Location**: `tests/<feature>.spec.ts`

**Structure**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:8765/');

    // Wait for app to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });
  });

  test('should render graph with nodes', async ({ page }) => {
    // Load model
    await page.click('text=Load Demo Data');

    // Wait for rendering
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });

    // Verify rendering
    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);

    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('should toggle layer visibility', async ({ page }) => {
    await page.click('[data-testid="layer-toggle-business"]');

    // Count visible nodes before/after
    const visibleBefore = await page.locator('.react-flow__node').count();
    expect(visibleBefore).toBeGreaterThan(0);

    // Toggle off
    await page.click('[data-testid="layer-toggle-business"]');

    // Verify some nodes are hidden
    const visibleAfter = await page.locator('.react-flow__node:visible').count();
    expect(visibleAfter).toBeLessThan(visibleBefore);
  });
});
```

**Critical E2E Patterns**:
- ✅ Always wait for specific selectors, not timeouts
- ✅ Check for console errors during test execution
- ✅ Validate actual rendering (node count), not just DOM
- ✅ Use `data-testid` for stable element selection
- ✅ Test realistic user workflows
- ❌ Don't rely on hardcoded sleep() calls
- ❌ Don't just check if container exists

### Story Validation Tests

**What are Ladle stories?** Component examples that automatically generate test cases.

**When to create stories:**
```typescript
// src/catalog/components/MyComponent/MyComponent.stories.tsx
import { Story } from '@ladle/react';
import { MyComponent } from './MyComponent';

export const Default: Story = {
  render: () => <MyComponent value="Test" />
};

export const WithLongText: Story = {
  render: () => <MyComponent value="This is a very long text that tests wrapping" />
};

export const Loading: Story = {
  render: () => <MyComponent loading={true} />
};
```

**Auto-generated tests verify:**
- ✅ Component renders without throwing
- ✅ No JavaScript console errors
- ✅ No uncaught exceptions
- ✅ Component doesn't break with various prop combinations

**Running story tests:**
```bash
npm run catalog:dev              # Start Ladle
npm run test:stories:generate   # Generate tests
npm run test:stories            # Run validation
```

### Debugging Tests

**Run single test file:**
```bash
npm test -- tests/unit/myService.spec.ts
```

**Run tests with head display (watch actual browser):**
```bash
npm run test:e2e:headed
```

**Debug with Playwright Inspector:**
```bash
PWDEBUG=1 npm test -- tests/my.spec.ts
```

**Print debug info:**
```typescript
console.log('State:', JSON.stringify(state, null, 2));
await page.screenshot({ path: 'debug.png' });
```

### Test Data Management

**Mock Factory Pattern:**
```typescript
// helpers/testData.ts
export function createTestMetaModel(elements = [], relationships = []): MetaModel {
  return {
    version: '1.0.0',
    layers: {
      business: { elements, relationships }
    },
    references: [],
    metadata: {}
  };
}

export function createTestElement(id: string, type: string, name: string): ModelElement {
  return {
    id,
    type,
    name,
    properties: {},
    visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 60 } }
  };
}

// In test
const model = createTestMetaModel([
  createTestElement('bus-1', 'service', 'Test Service')
]);
```

**Real Model Usage:**
```typescript
// Use actual reference implementation for integration tests
import EXAMPLE_MODEL from '@/documentation-robotics/model/manifest.yaml';

test('should handle real-world model', () => {
  const result = transformer.transform(EXAMPLE_MODEL);
  expect(result.nodes.size).toBeGreaterThan(100);
});
```

### Performance Testing

**Layout performance target: <1000ms for 500+ elements**

```typescript
test('should layout 500+ elements in under 1000ms', () => {
  const largeModel = createLargeTestModel(500);
  const start = performance.now();

  const result = new VerticalLayerLayout().calculate(largeModel);

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(1000);
});
```

## Performance Targets

| Metric | Target | Current | Implementation |
|--------|--------|---------|----------------|
| Unit test suite | <10s | ✅ 6.3s | 380 tests, Playwright |
| Initial graph render (500 elements) | <3s | ✅ 2-3s | Viewport culling + optimized layout |
| Layout calculation (500 nodes) | <1000ms | ✅ 400-800ms | Algorithm selection by layer size |
| Filter operations | <500ms | ✅ 100-300ms | Pre-indexed store selectors |
| Story validation (481 stories) | <60s | ✅ 45-50s | Parallel test execution |
| Pan/zoom responsiveness | 60fps | ✅ Smooth | React Flow optimizations |
| Bundle size | <500KB (gzip) | ✅ ~450KB | Code splitting + tree-shaking |

**Layout Strategy by Layer Size:**
- <50 nodes: Vertical or Hierarchical layout
- 50-200 nodes: Swimlane or ForceDirected layout
- 200+ nodes: Grid or Matrix layout with viewport culling

**Optimization Techniques:**
- ✅ Viewport culling: Don't render off-screen nodes
- ✅ Memoization: Prevent unnecessary re-renders with `memo()`
- ✅ Lazy evaluation: Use Zustand selectors to reduce subscriptions
- ✅ Code splitting: Separate bundle for Ladle catalog and main app
- ✅ Asset optimization: SVG icons instead of raster, WebP images

## Testing

**Test Suite (380 passing tests)**:

### Unit Tests
- `tests/unit/` - Service and utility testing
  - `motivationGraphBuilder.spec.ts` - Motivation layer graph building
  - `businessGraphBuilder.spec.ts` - Business layer graph construction
  - `c4ViewTransformer.spec.ts` - C4 architecture view transformation
  - `layout/` - Layout engines (hierarchical, force-directed, swimlanes, orthogonal routing)
  - `nodes/` - Node dimension and rendering validation
  - `preferences/` - User preference persistence
  - `validation/` - Graph element validation
  - `hooks/` - Custom hooks (business filters, focus management)

### Integration Tests
- `tests/integration/` - Cross-component data flow validation
  - `c4ParserIntegration.spec.ts` - C4 spec parsing and transformation
  - `preferencePersistence.spec.ts` - User preference persistence across sessions

### E2E Tests (Playwright)
- `tests/*embedded*.spec.ts` - Full embedded app with WebSocket
- `tests/c4-*.spec.ts` - C4 architecture views
- `tests/*-accessibility.spec.ts` - WCAG 2.1 AA compliance
- `tests/*performance*.spec.ts` - Performance benchmarks

### Story Validation Tests
- `tests/stories/all-stories.spec.ts` - Auto-generated Ladle story validation (481+ stories)

**Test Execution:**
```bash
npm test                          # All tests (380)
npm run test:e2e                 # E2E only with servers
npm run test:stories             # Ladle story validation
npm run test:stories:generate    # Regenerate story tests
```

**Test Patterns:**
```typescript
// Unit test pattern
test.describe('Component Name', () => {
  test('should do something', () => {
    // Setup, Act, Assert
  });
});

// E2E test pattern with data-testid selectors
<div data-testid="your-component">  // Stable selectors
await expect(page.locator('[data-testid="your-component"]')).toBeVisible();

// Service mock pattern
const mockService = {
  method: async (params) => ({ /* response */ })
};
```

## Export Services

Layer export services: PNG/SVG (via `html-to-image`), JSON (graph/catalog/traceability), Impact Analysis. See `src/services/*ExportService.ts`.

## Testing Resources

**Test Reference Files:**
- `tests/README.md` - Complete testing guide and troubleshooting
- `tests/unit/motivationGraphBuilder.spec.ts` - Unit test example (well-structured)
- `tests/c4-architecture-view.spec.ts` - E2E test example
- `documentation/claude_thoughts/TESTING_STRATEGY.md` - Testing philosophy and roadmap

**Mock Data and Fixtures:**
- `src/catalog/fixtures/` - Test data for stories
- Example YAML: `documentation-robotics/model/` (12-layer reference implementation)

**Key Documentation:**
- `documentation/YAML_MODELS.md` - YAML instance model specification
- `documentation/IMPLEMENTATION_LOG.md` - Phase-by-phase implementation history
- `documentation/claude_thoughts/` - Design decisions and architecture notes

## External Resources

- React Flow: https://reactflow.dev/
- Playwright: https://playwright.dev/
- Zustand: https://github.com/pmndrs/zustand
- Tailwind CSS: https://tailwindcss.com/

---

**Version:** 0.2.3 | **React Flow:** 12.0.0 | **React:** 18.x | **TypeScript:** 5.0 | **Playwright:** Latest
**Last Updated:** 2026-01-26
**Test Suite:** 380 tests passing | **Story Coverage:** 481 components validated
