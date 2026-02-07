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

## TypeScript Generic Syntax for Arrow Function Components

When creating reusable components that accept generic type parameters, use the `<T extends unknown>` pattern:

```typescript
// Generic sidebar component that accepts typed section configurations
interface SidebarSectionProps<T extends Record<string, any>> {
  sections: Array<{
    id: keyof T;
    title: string;
    component: React.ReactNode;
  }>;
}

export const GenericSidebar = <T extends Record<string, any>>({
  sections
}: SidebarSectionProps<T>) => {
  return (
    <div>
      {sections.map((section) => (
        <div key={String(section.id)}>{section.title}</div>
      ))}
    </div>
  );
};

GenericSidebar.displayName = 'GenericSidebar';
```

**Why use `<T extends unknown>`?**
- ✅ Allows consumers to pass any type without breaking type safety
- ✅ Works correctly with arrow function components in JSX
- ✅ Enables flexible reusable base components
- ✅ Avoids generic type inference issues in JSX

**Usage Example:**
```typescript
interface CustomSections {
  overview: { title: string };
  details: { content: string };
}

<GenericSidebar<CustomSections>
  sections={[
    { id: 'overview', title: 'Overview', component: <div /> },
    { id: 'details', title: 'Details', component: <div /> }
  ]}
/>
```

## Component Migration Guide

When refactoring existing components to follow base component patterns, follow these before/after patterns:

### Example 1: Migrating a Custom Inspector Panel

**Before** (tightly coupled, duplicated code):
```typescript
// src/apps/embedded/components/routes/BusinessInspectorPanel.tsx
export const BusinessInspectorPanel = ({ elementId }: { elementId: string }) => {
  const element = useStore((state) => state.getElement(elementId));
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{element?.name}</h3>
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      {isExpanded && (
        <div className="space-y-2">
          <p className="text-sm">{element?.description}</p>
          {/* Business-specific content */}
        </div>
      )}
    </div>
  );
};
```

**After** (using base component, minimal code):
```typescript
// src/apps/embedded/components/BusinessInspectorPanel.tsx
import { BaseInspectorPanel } from '@/core/components/base/BaseInspectorPanel';

export const BusinessInspectorPanel = ({ elementId }: { elementId: string }) => {
  return (
    <BaseInspectorPanel
      elementId={elementId}
      renderContent={(element) => (
        <div className="space-y-2">
          <p className="text-sm">{element.description}</p>
          {/* Business-specific content only */}
        </div>
      )}
    />
  );
};
```

**Benefits:**
- ✅ 50% less code (11 lines → 5 lines)
- ✅ No duplication of expand/collapse logic
- ✅ Consistent styling with other inspectors
- ✅ Automatic accessibility support

### Example 2: Migrating a Custom Control Panel

**Before** (custom state management):
```typescript
// Old pattern with custom state
export const CustomControlPanel = () => {
  const [selectedLayout, setSelectedLayout] = useState('vertical');
  const [showLabels, setShowLabels] = useState(true);

  return (
    <div className="p-4 bg-gray-50 rounded">
      <select value={selectedLayout} onChange={(e) => setSelectedLayout(e.target.value)}>
        <option value="vertical">Vertical</option>
        <option value="horizontal">Horizontal</option>
      </select>
      <label>
        <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
        Show Labels
      </label>
    </div>
  );
};
```

**After** (using base component with render prop):
```typescript
import { BaseControlPanel } from '@/core/components/base/BaseControlPanel';

export const CustomControlPanel = () => {
  return (
    <BaseControlPanel
      title="Controls"
      controls={[
        {
          type: 'select',
          label: 'Layout',
          options: ['vertical', 'horizontal'],
          onChange: (value) => { /* handle change */ }
        },
        {
          type: 'checkbox',
          label: 'Show Labels',
          onChange: (checked) => { /* handle change */ }
        }
      ]}
    />
  );
};
```

## Render Prop and Slot Patterns

Use render props and slots for flexible, domain-specific customization while maintaining consistent base structure.

### Render Prop Pattern

Render props allow consuming components to customize specific content areas:

```typescript
interface InspectorPanelProps {
  elementId: string;
  // Render prop for custom content
  renderContent?: (element: ModelElement) => React.ReactNode;
  // Render prop for custom actions
  renderActions?: (element: ModelElement) => React.ReactNode;
}

export const BaseInspectorPanel = ({
  elementId,
  renderContent,
  renderActions
}: InspectorPanelProps) => {
  const element = useStore((state) => state.getElement(elementId));

  return (
    <div className="bg-white border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h3>{element?.name}</h3>
        {renderActions && renderActions(element!)}
      </div>

      {/* Default content */}
      <p className="text-sm text-gray-600 mb-4">{element?.description}</p>

      {/* Custom content via render prop */}
      {renderContent && renderContent(element!)}
    </div>
  );
};

// Usage
<BaseInspectorPanel
  elementId="bus-1"
  renderContent={(element) => (
    <div className="space-y-3">
      <div className="flex gap-2">
        {element.properties?.tags?.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
    </div>
  )}
  renderActions={(element) => (
    <Button onClick={() => showDetails(element)}>View Details</Button>
  )}
/>
```

### Slot Pattern

Slots allow specifying multiple customizable content areas with named identifiers:

```typescript
interface SidebarSection {
  id: string;
  title: string;
  component: React.ReactNode;
  icon?: React.ReactNode;
}

interface GraphViewSidebarProps {
  sections: SidebarSection[];
  defaultOpenSections?: string[];
  // Slots for custom header/footer content
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

export const GraphViewSidebar = ({
  sections,
  defaultOpenSections = [],
  headerSlot,
  footerSlot
}: GraphViewSidebarProps) => {
  const [openSections, setOpenSections] = useState(
    new Set(defaultOpenSections)
  );

  return (
    <div className="flex flex-col h-full bg-white border-l">
      {/* Header slot */}
      {headerSlot && <div className="px-4 py-2 border-b">{headerSlot}</div>}

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.id} className="border-b">
            <button
              onClick={() => {
                const next = new Set(openSections);
                next.has(section.id)
                  ? next.delete(section.id)
                  : next.add(section.id);
                setOpenSections(next);
              }}
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50"
            >
              <span className="flex items-center gap-2">
                {section.icon && section.icon}
                {section.title}
              </span>
              <span>{openSections.has(section.id) ? '−' : '+'}</span>
            </button>

            {openSections.has(section.id) && (
              <div className="px-4 py-3">{section.component}</div>
            )}
          </div>
        ))}
      </div>

      {/* Footer slot */}
      {footerSlot && <div className="px-4 py-2 border-t">{footerSlot}</div>}
    </div>
  );
};

// Usage with all slots
<GraphViewSidebar
  sections={[
    { id: 'info', title: 'Info', component: <ElementInfo /> },
    { id: 'refs', title: 'References', component: <References /> }
  ]}
  defaultOpenSections={['info']}
  headerSlot={<input placeholder="Search..." />}
  footerSlot={<Button>Export</Button>}
/>
```

**When to use Render Prop vs Slots:**
- **Render Prop**: Single customizable content area with access to component state/data
- **Slot**: Multiple named content areas with clear semantic meaning
- **Both**: Combine for maximum flexibility (header/footer slots + render prop for main content)

## Store & Real-Time Patterns

### Zustand Stores

**Core Stores** (shared across all apps):
- **`modelStore`** - Loaded model data, element/layer lookups
  - State: `model`, `loading`, `error`
  - Selectors: `getLayer()`, `getElement()`, `getElementsByType()`
  - Location: `src/core/stores/modelStore.ts`

- **`layerStore`** - Active layer visibility state
  - State: `visibleLayers`, `selectedLayer`
  - Actions: `toggleLayer()`, `selectLayer()`
  - Location: `src/core/stores/layerStore.ts`

- **`elementStore`** - Selected element and focus state
  - State: `selectedElement`, `focusedElement`
  - Actions: `selectElement()`, `clearSelection()`
  - Location: `src/core/stores/elementStore.ts`

- **`layoutPreferencesStore`** - User layout preferences (persisted)
  - State: `defaultLayout`, `sidebarWidths`, `expandedSections`
  - Location: `src/core/stores/layoutPreferencesStore.ts`

**App-Specific Stores** (embedded app):
- **`viewPreferenceStore`** - View-specific user preferences
  - Location: `src/apps/embedded/stores/viewPreferenceStore.ts`

- **`annotationStore`** - Annotations with optimistic updates
  - State: `annotations`, `loading`, `error`
  - Actions: `addAnnotation()`, `updateAnnotation()`, `deleteAnnotation()`
  - Location: `src/apps/embedded/stores/annotationStore.ts`

- **`changesetStore`** - Architecture changeset management
  - Location: `src/apps/embedded/stores/changesetStore.ts`

- **`connectionStore`** - WebSocket connection state
  - Location: `src/apps/embedded/stores/connectionStore.ts`

- **`authStore`** - Authentication state
  - Location: `src/apps/embedded/stores/authStore.ts`

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
const model = useModelStore((state) => state.model);  // modelStore
const layers = useLayerStore((state) => state.visibleLayers);  // layerStore
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
  /** Content for the Filters accordion section */
  filterPanel: React.ReactNode;
  /** Content for the Controls accordion section */
  controlPanel: React.ReactNode;
  /** Content for the Inspector accordion section (optional, conditional) */
  inspectorContent?: React.ReactNode;
  /** Whether to show the Inspector section */
  inspectorVisible?: boolean;
  /** Optional annotation panel content */
  annotationPanel?: React.ReactNode;
  /** Custom test ID for the sidebar */
  testId?: string;
  /** Sections to open by default (defaults to ['filters', 'controls']) */
  defaultOpenSections?: ('filters' | 'controls' | 'annotations' | 'inspector')[];
}

// Usage Example
<GraphViewSidebar
  filterPanel={<MotivationFilterPanel {...filterProps} />}
  controlPanel={<MotivationControlPanel {...controlProps} />}
  inspectorContent={selectedNodeId && <MotivationInspectorPanel {...inspectorProps} />}
  inspectorVisible={!!selectedNodeId}
  testId="motivation-right-sidebar"
  defaultOpenSections={['filters', 'controls']}
/>
```

**Section Order**: Inspector (if visible), Filters, Controls, Annotations (if provided)

Benefits:
- ✅ Consistent UI across all routes
- ✅ Reusable state management for open/closed sections
- ✅ Reduced code duplication (was ~500 lines per sidebar)
- ✅ Type-safe named props
- ✅ Conditional inspector panel rendering

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
- `src/core/services/businessNodeTransformer.ts` - Business layer node transformation
- `src/core/services/businessGraphBuilder.ts` - Business layer graph construction
- `src/core/layout/` - Layout engines (Vertical, Hierarchical, ForceDirected, Swimlane, etc.)
- `src/core/components/GraphViewer.tsx` - Main React Flow wrapper component

**Data Processing Services:**
- `src/core/services/dataLoader.ts` - Model loading orchestration
- `src/core/services/yamlParser.ts` - YAML instance model parsing
- `src/core/services/jsonSchemaParser.ts` - JSON Schema parsing
- `src/core/services/businessLayerParser.ts` - Business layer spec parsing
- `src/core/services/crossLayerReferenceExtractor.ts` - Cross-layer relationship extraction

**Export Services:**
- `src/core/services/businessExportService.ts` - Business layer export (PNG/SVG/JSON)
- `src/core/services/exportUtils.ts` - Export utility functions
- `src/core/services/impactAnalysisService.ts` - Impact analysis for changes

**UI Base Components:**
- `src/core/components/base/BaseInspectorPanel.tsx` - Reusable inspector panel
- `src/core/components/base/BaseControlPanel.tsx` - Reusable control panel
- `src/core/components/base/GraphViewSidebar.tsx` - Generic sidebar component
- `src/core/components/businessLayer/BusinessLayerView.tsx` - Business layer view
- `src/core/components/businessLayer/BusinessLayerControls.tsx` - Business layer controls

**Embedded App Layout:**
- `src/apps/embedded/EmbeddedLayout.tsx` - Main embedded app layout
- `src/apps/embedded/components/SharedLayout.tsx` - 3-column layout container
- `src/apps/embedded/components/shared/FilterPanel.tsx` - Layer/element filtering
- `src/apps/embedded/components/shared/ExportButtonGroup.tsx` - Export functionality
- `src/apps/embedded/routes/` - TanStack Router route components

**Stores (Zustand):**
- `src/core/stores/modelStore.ts` - Loaded model data
- `src/core/stores/layerStore.ts` - Layer visibility state
- `src/core/stores/elementStore.ts` - Selected element state
- `src/core/stores/layoutPreferencesStore.ts` - User layout preferences
- `src/apps/embedded/stores/annotationStore.ts` - Annotation state
- `src/apps/embedded/stores/viewPreferenceStore.ts` - View-specific preferences
- `src/apps/embedded/stores/changesetStore.ts` - Architecture changesets
- `src/apps/embedded/stores/connectionStore.ts` - WebSocket connection state

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

3. **Mock External Dependencies** (using Playwright):
   ```typescript
   // Simple mock object for unit tests
   const mockLayout = {
     calculate: async (model) => ({ x: 100, y: 200 })
   };

   // For more complex mocking patterns, use test utilities
   test('should handle async operations', async () => {
     const mockService = {
       fetch: async (url) => ({ data: 'test' })
     };
     // Test code here
   });
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

| Category | Count | Status |
|----------|-------|--------|
| Unit tests (services/utilities) | ~200 | ✅ High coverage |
| Unit tests (components) | ~60 | ✅ Good coverage |
| Integration tests | ~50 | ✅ Comprehensive |
| E2E tests (Playwright) | ~70 | ✅ Good coverage |
| Story validation (Ladle) | 481+ | ✅ All validated |
| **Total** | **~860** | ✅ Complete suite |

**Overall test run time**: Approximately 6-10 seconds for unit/integration tests, 30-60 seconds for full E2E suite with servers

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
          E2E Tests (~70 tests across multiple files)
           ↑ Slow (~30-60s) - Comprehensive system validation
          /
         / Integration Tests (~50 tests, 2+ files)
        ↑ Medium (~5-10s) - Cross-component workflows
       /
      / Unit Tests (~260 tests across 25+ files)
     ↑ Fast (<6s) - Isolated services and utilities
```

**Total Test Suite**: ~380-860 tests (unit/integration + story validation)

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
// Stories live alongside components, e.g.:
// src/core/components/base/BaseInspectorPanel.stories.tsx
// src/apps/embedded/components/shared/FilterPanel.stories.tsx

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

### Story Test Synchronization

The story validation system ensures complete test coverage for all Ladle component stories:

**Coverage Guarantee**: Every story in `meta.json` has a corresponding Playwright test. Tests are auto-generated and synchronized via CI.

**Developer Workflow**:
```bash
# After adding/removing story files or exports:
npm run test:stories:generate    # Regenerates all tests
npm run test:stories             # Validates all stories load without errors
```

**What Gets Validated**:
- ✅ Story loads without HTTP errors
- ✅ No unexpected console errors (React warnings filtered)
- ✅ No error boundary triggers
- ✅ Source file exists for every story in meta.json

**CI Enforcement**:
- Pre-commit: Automatically regenerates tests when `.stories.tsx` files change
- CI Pipeline: Fails if committed tests don't match generated output
- Fix: Run `npm run test:stories:generate` and commit the result

**Coverage Report**:
```
=== Story Coverage Report ===
Total stories in meta.json: 401
Valid source files found: 401
Missing source files: 0
Coverage: 100.0%
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

**Target Performance Metrics** (measured empirically during development):

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Unit test suite | <10s | Playwright tests |
| Initial graph render (500 elements) | <3s | Viewport culling + optimized layout |
| Layout calculation (500 nodes) | <1000ms | Algorithm selection by layer size |
| Filter operations | <500ms | Pre-indexed store selectors |
| Story validation (481 stories) | <60s | Parallel test execution |
| Pan/zoom responsiveness | 60fps | React Flow optimizations |
| Bundle size | <500KB (gzip) | Code splitting + tree-shaking |

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


## Export Services

Layer export services: PNG/SVG (via `html-to-image`), JSON (graph/catalog/traceability), Impact Analysis. See `src/core/services/*ExportService.ts`.

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
