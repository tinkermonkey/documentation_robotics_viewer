# Component API Reference

Complete API documentation for all reusable components in the Documentation Robotics Viewer.

## Overview

This guide documents:
- **135 total components** organized by purpose and layer
- **85 story files** with visual examples for each component
- **Base components** for reusable patterns
- **Node components** for React Flow visualization
- **View-specific components** for each architecture layer

## Table of Contents

- [Base Components (Reusable Patterns)](#base-components)
- [Node Components (React Flow)](#node-components)
- [View Components (Layer-Specific)](#view-components)
- [Shared Components (All Apps)](#shared-components)
- [Hook Reference](#hook-reference)
- [Component Pattern Guide](#component-pattern-guide)

---

## Base Components

### 1. BaseInspectorPanel

**Location**: `src/core/components/base/BaseInspectorPanel.tsx`
**Purpose**: Generic inspector panel for displaying element details, relationships, and quick actions
**Type-Safe**: Yes (generic type parameters)
**Story**: `src/core/components/base/BaseInspectorPanel.stories.tsx`

**Props**:
```typescript
interface BaseInspectorPanelProps<
  TGraph extends BaseGraph<TNode, TEdge>,
  TNode extends BaseNode,
  TEdge extends BaseEdge
> {
  /** Selected node ID to display (null = show empty state) */
  selectedNodeId: string | null;

  /** Graph data source containing nodes and edges */
  graph: TGraph;

  /** Called when user clicks close button */
  onClose: () => void;

  // Render props - customize content display
  /** Render element details in the details card */
  renderElementDetails: (node: TNode) => React.ReactNode;

  /** Render relationship badge (optional, defaults to edge type) */
  renderRelationshipBadge?: (edge: TEdge) => React.ReactNode;

  /** Extract display name from node */
  getNodeName: (node: TNode) => string;

  /** Extract edge type/label for display */
  getEdgeType: (edge: TEdge) => string;

  /** Quick actions to show in actions card */
  quickActions?: QuickAction<TNode>[];

  /** Render cross-layer links (optional) */
  renderCrossLayerLinks?: (node: TNode, graph: TGraph) => React.ReactNode;

  /** Panel title (default: "Inspector") */
  title?: string;

  /** Additional CSS class */
  className?: string;

  /** Test ID for E2E tests (default: "inspector-panel") */
  testId?: string;
}
```

**QuickAction Type**:
```typescript
interface QuickAction<T extends BaseNode> {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: (node: T) => void;
  condition?: (node: T) => boolean;  // Conditionally show action
  color?: 'gray' | 'blue' | 'green' | 'red' | 'yellow';
  testId?: string;
}
```

**Features**:
- ✅ Generic type safety with `<TGraph, TNode, TEdge>`
- ✅ Displays "No element selected" when `selectedNodeId` is null
- ✅ Shows "Element not found" error state with helpful debugging info
- ✅ Incoming and outgoing relationship lists with visual indicators
- ✅ Customizable quick actions with conditional rendering
- ✅ Optional cross-layer links section
- ✅ Full dark mode support
- ✅ Render prop error boundaries (wrapped)

**Usage Example**:
```typescript
import { BaseInspectorPanel } from '@/core/components/base/BaseInspectorPanel';
import type { QuickAction } from '@/core/components/base/types';

<BaseInspectorPanel
  selectedNodeId={selectedId}
  graph={businessGraph}
  onClose={() => setSelectedId(null)}
  renderElementDetails={(node) => (
    <div className="space-y-2">
      <p><strong>Type:</strong> {node.type}</p>
      <p><strong>Description:</strong> {node.description}</p>
    </div>
  )}
  getNodeName={(node) => node.label}
  getEdgeType={(edge) => edge.type}
  quickActions={[
    {
      id: 'edit',
      title: 'Edit',
      icon: <PencilIcon />,
      onClick: (node) => openEditor(node),
    },
    {
      id: 'delete',
      title: 'Delete',
      icon: <TrashIcon />,
      color: 'red',
      onClick: (node) => deleteNode(node),
      condition: (node) => !node.isSystemDefined,
    }
  ]}
  title="Business Element Inspector"
  testId="business-inspector"
/>
```

**Test IDs Generated**:
- `inspector-panel` - Main container
- `inspector-panel-close-button` - Close button
- `inspector-panel-element-details-card` - Details section
- `inspector-panel-relationships-card` - Relationships section
- `inspector-panel-quick-actions-card` - Actions section
- `inspector-panel-quick-action-{actionId}` - Individual action buttons

---

### 2. BaseControlPanel

**Location**: `src/core/components/base/BaseControlPanel.tsx`
**Purpose**: Generic control panel for layout, filter, and view options
**Type-Safe**: Yes (generic type parameters)
**Story**: `src/core/components/base/BaseControlPanel.stories.tsx`

**Props**:
```typescript
interface BaseControlPanelProps<TSettings extends Record<string, any>> {
  /** Title of the panel */
  title: string;

  /** Current settings state */
  settings: TSettings;

  /** Called when any setting changes */
  onSettingsChange: (settings: TSettings) => void;

  /** Control definitions */
  controls: ControlDefinition[];

  /** Optional section grouping for controls */
  sections?: ControlSection[];

  /** Custom CSS class */
  className?: string;

  /** Test ID for E2E tests */
  testId?: string;
}

interface ControlDefinition {
  id: keyof TSettings;
  label: string;
  type: 'select' | 'checkbox' | 'slider' | 'radio';
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}
```

**Features**:
- ✅ Multiple control types (select, checkbox, slider, radio)
- ✅ Optional control grouping in sections
- ✅ Type-safe settings management
- ✅ Change callback system
- ✅ Descriptive labels and help text
- ✅ Dark mode support

**Usage Example**:
```typescript
<BaseControlPanel<LayoutSettings>
  title="Layout Options"
  settings={layoutSettings}
  onSettingsChange={setLayoutSettings}
  controls={[
    {
      id: 'layoutType',
      label: 'Layout Algorithm',
      type: 'select',
      options: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Hierarchical', value: 'hierarchical' },
        { label: 'Force-Directed', value: 'forceDirected' }
      ],
      description: 'Choose how elements are positioned'
    },
    {
      id: 'showLabels',
      label: 'Show Labels',
      type: 'checkbox',
      description: 'Display element names on nodes'
    },
    {
      id: 'spacing',
      label: 'Spacing',
      type: 'slider',
      min: 50,
      max: 500,
      step: 10,
      description: 'Distance between elements'
    }
  ]}
  testId="layout-controls"
/>
```

---

### 3. GraphViewSidebar

**Location**: `src/core/components/base/GraphViewSidebar.tsx`
**Purpose**: Generic 3-section sidebar for filters, controls, and inspector
**Type-Safe**: Yes
**Story**: `src/core/components/base/GraphViewSidebar.stories.tsx`

**Props**:
```typescript
interface GraphViewSidebarProps {
  /** Content for the Filters accordion section */
  filterPanel: React.ReactNode;

  /** Content for the Controls accordion section */
  controlPanel: React.ReactNode;

  /** Content for the Inspector accordion section (optional) */
  inspectorContent?: React.ReactNode;

  /** Whether to show the Inspector section */
  inspectorVisible?: boolean;

  /** Optional annotation panel content */
  annotationPanel?: React.ReactNode;

  /** Sections to open by default */
  defaultOpenSections?: ('filters' | 'controls' | 'annotations' | 'inspector')[];

  /** Custom test ID for the sidebar */
  testId?: string;

  /** Custom CSS class */
  className?: string;
}
```

**Section Order**:
1. Inspector (if `inspectorVisible` is true)
2. Filters
3. Controls
4. Annotations (if `annotationPanel` provided)

**Features**:
- ✅ Accordion-style collapsible sections
- ✅ Configurable default open sections
- ✅ Optional conditional rendering of Inspector
- ✅ Optional annotations panel
- ✅ Consistent styling across all views
- ✅ Responsive layout

**Usage Example**:
```typescript
<GraphViewSidebar
  filterPanel={<FilterPanel {...filterProps} />}
  controlPanel={<ControlPanel {...controlProps} />}
  inspectorContent={selectedId ? <InspectorPanel {...} /> : null}
  inspectorVisible={!!selectedId}
  annotationPanel={<AnnotationPanel {...} />}
  defaultOpenSections={['filters', 'controls']}
  testId="motivation-sidebar"
/>
```

---

### 4. RenderPropErrorBoundary

**Location**: `src/core/components/base/RenderPropErrorBoundary.tsx`
**Purpose**: Error boundary for render prop functions (prevents one failing render prop from crashing entire component)
**Type-Safe**: Yes (generic type parameters)
**Story**: `src/core/components/base/RenderPropErrorBoundary.stories.tsx`

**Key Functions**:
```typescript
// Single parameter render prop
export function wrapRenderProp<T>(
  renderProp: (item: T) => React.ReactNode,
  item: T,
  propName: string
): React.ReactNode;

// Two parameter render prop
export function wrapRenderProp2<T, U>(
  renderProp: (item1: T, item2: U) => React.ReactNode,
  item1: T,
  item2: U,
  propName: string
): React.ReactNode;
```

**Features**:
- ✅ Catches render prop errors without crashing parent
- ✅ Logs error with prop name for debugging
- ✅ Returns fallback UI (error message)
- ✅ Supports single and two-parameter render props

**Usage** (Already used in BaseInspectorPanel):
```typescript
// Inside a component with render props
{wrapRenderProp(renderElementDetails, selectedNode, 'renderElementDetails')}
{wrapRenderProp2(renderCrossLayerLinks, selectedNode, graph, 'renderCrossLayerLinks')}
```

---

## Node Components

### React Flow Node Pattern

All node components follow this exact pattern (see CLAUDE.md for details):

**Requirements**:
1. ✅ Wrapped with `memo()` to prevent unnecessary re-renders
2. ✅ Accept `NodeProps<CustomData>` from React Flow
3. ✅ Have `<Handle>` elements for connections
4. ✅ Have precise CSS dimensions matching `nodeDimensions` export
5. ✅ Export dimensions constant for transformer
6. ✅ Set `displayName` for debugging
7. ✅ Include `data-testid={node-${data.elementId}}`

**Template**:
```typescript
// src/core/nodes/layer/YourNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '@/core/types';

interface YourNodeData extends NodeData {
  customProp?: string;
}

export const YourNode = memo(({ data }: NodeProps<YourNodeData>) => {
  return (
    <div
      className="flex flex-col items-center justify-center bg-white border-2 border-gray-300 rounded"
      style={{ width: 180, height: 100 }}  // MUST match dimensions export
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

### Motivation Layer Nodes

**All documented in**: `src/catalog/README.md` (Section: Motivation Layer Nodes)

**Nodes**:
1. `GoalNode` - Goals with contribution relationships
2. `StakeholderNode` - Actors/stakeholders with influence
3. `ConstraintNode` - Business constraints

**Stories**: All have `.stories.tsx` files with variants

---

### Business Layer Nodes

**All documented in**: `src/catalog/README.md` (Section: Business Layer Nodes)

**Nodes**:
1. `BusinessServiceNode` - Services with ownership
2. `BusinessProcessNode` - Processes with flow indicators
3. `BusinessFunctionNode` - Functions with complexity
4. `BusinessCapabilityNode` - Capabilities with maturity

**Stories**: All have `.stories.tsx` files

---

### Other Layer Nodes

See `src/core/nodes/*/` directories for:
- Technology nodes
- API nodes
- DataModel nodes
- UX nodes
- And more...

All follow the same pattern documented above.

---

## View Components

### 1. GraphViewer

**Location**: `src/core/components/GraphViewer.tsx`
**Purpose**: Main React Flow wrapper component for displaying architecture graphs
**Story**: `src/core/components/GraphViewer.stories.tsx`

**Props**:
```typescript
interface GraphViewerProps {
  /** Nodes to display */
  nodes: Node[];

  /** Edges/connections between nodes */
  edges: Edge[];

  /** Called when node is clicked */
  onNodeClick?: (node: Node) => void;

  /** Called when edge is clicked */
  onEdgeClick?: (edge: Edge) => void;

  /** Called when node is dragged */
  onNodeDragStop?: (node: Node, position: { x: number; y: number }) => void;

  /** Called when canvas is right-clicked */
  onContextMenu?: (event: React.MouseEvent) => void;

  /** Custom CSS class */
  className?: string;
}
```

**Features**:
- ✅ React Flow integration with custom nodes/edges
- ✅ Node selection and highlighting
- ✅ Pan and zoom controls
- ✅ Configurable click handlers
- ✅ Drag and drop support
- ✅ Context menu support

---

### 2. OverviewPanel

**Location**: `src/core/components/OverviewPanel.tsx`
**Purpose**: Minimap/overview of entire graph for navigation
**Story**: `src/core/components/OverviewPanel.stories.tsx`

**Props**:
```typescript
interface OverviewPanelProps {
  /** Nodes in the graph */
  nodes: Node[];

  /** Whether panel is open */
  isOpen: boolean;

  /** Called when panel is closed */
  onClose: () => void;

  /** Custom CSS class */
  className?: string;
}
```

**Features**:
- ✅ Visual minimap of graph
- ✅ Collapsible panel
- ✅ Click to navigate to node
- ✅ Shows viewport bounds

---

## Shared Components

### All Apps Shared Components

Located in `src/apps/embedded/components/shared/`:

**Common Components**:
- `FilterPanel` - Layer and element filtering
- `ViewToggle` - Switch between Graph/JSON/List views
- `ExportButtonGroup` - Export controls
- `BreadcrumbNav` - Navigation breadcrumbs
- `ErrorState` - Error display component
- `LoadingState` - Loading skeleton
- `EmptyState` - Empty data state

### Layer-Specific Views

Each layer has its own component structure:
- `MotivationLayerView` - Motivation visualization
- `BusinessLayerView` - Business visualization
- `C4ArchitectureView` - C4 architecture visualization
- And more for each layer...

All implement the **SharedLayout** pattern (see CLAUDE.md).

---

## Hook Reference

### 1. useGraphState

**Location**: `src/core/hooks/useGraphState.ts`
**Purpose**: Manage React Flow graph state and selections

**Returns**:
```typescript
interface GraphState {
  selectedNodeId: string | null;
  selectNode: (id: string | null) => void;
  selectedEdgeId: string | null;
  selectEdge: (id: string | null) => void;
  hoveredNodeId: string | null;
  hoverNode: (id: string | null) => void;
  clearSelection: () => void;
}
```

**Usage**:
```typescript
const { selectedNodeId, selectNode, clearSelection } = useGraphState();
```

---

### 2. useBusinessFilters

**Location**: `src/apps/embedded/hooks/useBusinessFilters.ts`
**Purpose**: Manage business layer filtering

**Returns**:
```typescript
interface BusinessFilters {
  visibleTypes: string[];
  toggleType: (type: string) => void;
  visibleComplexity: 'low' | 'medium' | 'high' | null;
  setComplexity: (level: string | null) => void;
  reset: () => void;
}
```

---

### 3. useBusinessFocus

**Location**: `src/apps/embedded/hooks/useBusinessFocus.ts`
**Purpose**: Manage focused element in business view

**Returns**:
```typescript
interface BusinessFocus {
  focusedElementId: string | null;
  setFocus: (id: string | null) => void;
  focusedElement: BusinessElement | null;
}
```

---

### 4. useCrossLayerLinks

**Location**: `src/core/hooks/useCrossLayerLinks.ts`
**Purpose**: Access and filter cross-layer references

**Returns**:
```typescript
interface CrossLayerLinkData {
  links: CrossLayerLink[];
  filterBySource: (elementId: string) => CrossLayerLink[];
  filterByTarget: (elementId: string) => CrossLayerLink[];
  filterByType: (type: string) => CrossLayerLink[];
}
```

---

### 5. useDataLoader

**Location**: `src/apps/embedded/hooks/useDataLoader.ts`
**Purpose**: Load and manage model data

**Returns**:
```typescript
interface DataLoaderState {
  model: Model | null;
  loading: boolean;
  error: Error | null;
  load: (source: string) => Promise<void>;
  reload: () => Promise<void>;
}
```

---

### 6. Custom Hooks Summary

| Hook | Purpose | Location |
|------|---------|----------|
| `useGraphState` | Manage node/edge selection | `src/core/hooks/` |
| `useBusinessFilters` | Business layer filtering | `src/apps/embedded/hooks/` |
| `useBusinessFocus` | Focused element management | `src/apps/embedded/hooks/` |
| `useCrossLayerLinks` | Cross-layer reference access | `src/core/hooks/` |
| `useDataLoader` | Model loading orchestration | `src/apps/embedded/hooks/` |
| `useAnnotations` | Annotation store integration | `src/apps/embedded/hooks/` |
| `usePreferences` | Layout preference persistence | `src/core/hooks/` |
| `useWebSocket` | WebSocket connection | `src/apps/embedded/hooks/` |
| `useErrorHandler` | Error handling | `src/core/hooks/` |
| `useTheme` | Dark mode theme | `src/core/hooks/` |
| `useResponsive` | Responsive breakpoints | `src/core/hooks/` |

---

## Component Pattern Guide

### Render Prop Pattern

Use render props for domain-specific customization:

```typescript
interface MyComponentProps {
  data: SomeType;

  // Render prop - consumer customizes content
  renderContent: (item: SomeType) => React.ReactNode;
}

function MyComponent({ data, renderContent }: MyComponentProps) {
  return (
    <div>
      {renderContent(data)}
    </div>
  );
}

// Usage
<MyComponent
  data={myData}
  renderContent={(item) => (
    <div>Custom {item.name}</div>
  )}
/>
```

**Examples in codebase**:
- `BaseInspectorPanel` - renderElementDetails, renderRelationshipBadge
- Layer-specific components - custom content rendering

---

### Slot Pattern

Use slots for multiple named content areas:

```typescript
interface SlottedComponentProps {
  headerSlot?: React.ReactNode;
  contentSlot: React.ReactNode;
  footerSlot?: React.ReactNode;
}

function SlottedComponent({ headerSlot, contentSlot, footerSlot }: SlottedComponentProps) {
  return (
    <div>
      {headerSlot && <div>{headerSlot}</div>}
      <div>{contentSlot}</div>
      {footerSlot && <div>{footerSlot}</div>}
    </div>
  );
}
```

**Examples in codebase**:
- `SharedLayout` - leftSidebarContent, rightSidebarContent
- `GraphViewSidebar` - filterPanel, controlPanel, inspectorContent

---

### Generic Type Parameters

For reusable components accepting arbitrary types:

```typescript
interface GenericProps<T extends Record<string, any>> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export const GenericList = <T extends Record<string, any>>({
  items,
  renderItem
}: GenericProps<T>) => {
  return <ul>{items.map(renderItem)}</ul>;
};

// Usage with type inference
<GenericList<MyType> items={myItems} renderItem={(item) => <li>{item.name}</li>} />
```

**Pattern in codebase**:
- `BaseInspectorPanel<TGraph, TNode, TEdge>`
- `BaseControlPanel<TSettings>`

---

### Error Boundary Wrappers

Render prop functions are wrapped with error boundaries:

```typescript
import { wrapRenderProp, wrapRenderProp2 } from '@/core/components/base/RenderPropErrorBoundary';

{wrapRenderProp(renderProp, data, 'propName')}
{wrapRenderProp2(renderProp, data1, data2, 'propName')}
```

**Benefit**: One failing render prop doesn't crash the entire component.

---

## Testing Components

### Unit Tests

Location: `tests/unit/nodes/`

Test pattern:
```typescript
test('should have correct dimensions', () => {
  const node = render(<MyNode data={testData} />);
  const element = node.container.firstChild as HTMLElement;
  expect(element.style.width).toBe('180px');
  expect(element.style.height).toBe('100px');
});

test('should have accessibility attributes', () => {
  const node = render(<MyNode data={testData} />);
  expect(node.container.querySelector('[data-testid="node-test-1"]')).toBeInTheDocument();
});
```

### Story Tests

Location: `tests/stories/all-stories.spec.ts` (auto-generated)

Every story file gets validated for:
- ✅ Renders without errors
- ✅ No console errors
- ✅ No uncaught exceptions
- ✅ Component doesn't break with various prop combinations

### E2E Tests

Use Playwright with:
- Component selector: `[data-testid="..."]`
- Wait strategies: `await page.waitForSelector(...)`
- Validation: Check actual rendered output, not just DOM

---

## Best Practices

### 1. Use `data-testid` Consistently
```typescript
<div data-testid={`node-${elementId}`}>...</div>
<Button data-testid={`action-${actionId}`}>...</Button>
```

### 2. Implement Dark Mode
```typescript
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  ...
</div>
```

### 3. Use Render Props for Customization
```typescript
renderElementDetails={(node) => <CustomContent node={node} />}
```

### 4. Memoize Components
```typescript
export const MyComponent = memo(MyComponentImpl);
MyComponent.displayName = 'MyComponent';
```

### 5. Use Generic Types for Reusability
```typescript
<BaseInspectorPanel<TGraph, TNode, TEdge> ... />
```

### 6. Test Dimensions Match
```typescript
// Component
style={{ width: 180, height: 100 }}

// Export
export const MyNodeDimensions = { width: 180, height: 100 };

// Transformer
case 'myNodeType':
  element.visual.size = nodeDimensions.myNodeType;
```

---

## Common Issues

### Node not rendering
**Solution**: Check that:
1. Node type is registered in `nodeTypes` export in `src/core/nodes/index.ts`
2. Node type is mapped in `getNodeTypeForElement()` in `src/core/services/nodeTransformer.ts`
3. Component dimensions match `nodeDimensions` export and CSS styles

### Component not re-rendering
**Solution**: Check if component is wrapped with `memo()` and if parent is passing new props

### Test ID not found
**Solution**: Verify `data-testid` attribute is set correctly and matches selector

### Render prop errors
**Solution**: Use `wrapRenderProp()` to prevent one failing render prop from crashing component

### Dark mode not working
**Solution**: Add `dark:` variant classes (e.g., `dark:bg-gray-900`, `dark:text-white`)

---

## File Organization

```
src/core/components/
├── base/                              # Reusable base components
│   ├── BaseInspectorPanel.tsx         # Inspector pattern
│   ├── BaseControlPanel.tsx           # Control panel pattern
│   ├── GraphViewSidebar.tsx           # Sidebar pattern
│   ├── RenderPropErrorBoundary.tsx    # Error handling
│   ├── types.ts                       # Shared types
│   └── *.stories.tsx                  # Stories for each component
├── GraphViewer.tsx                    # React Flow wrapper
├── OverviewPanel.tsx                  # Minimap
└── *.stories.tsx

src/core/nodes/
├── business/
│   ├── BusinessServiceNode.tsx
│   ├── BusinessProcessNode.tsx
│   ├── BusinessFunctionNode.tsx
│   ├── BusinessCapabilityNode.tsx
│   ├── index.ts
│   └── *.stories.tsx
├── motivation/
│   ├── GoalNode.tsx
│   ├── StakeholderNode.tsx
│   ├── ConstraintNode.tsx
│   ├── index.ts
│   └── *.stories.tsx
└── [other layers]/

src/apps/embedded/components/
├── shared/                            # Shared across all routes
│   ├── FilterPanel.tsx
│   ├── ViewToggle.tsx
│   ├── ExportButtonGroup.tsx
│   └── *.stories.tsx
├── routes/                            # Route-specific components
│   ├── MotivationLayerRoute.tsx
│   ├── BusinessLayerRoute.tsx
│   └── ...
└── *.stories.tsx
```

---

## Related Documentation

- `CLAUDE.md` - Component implementation patterns and critical rules
- `tests/README.md` - Testing components and story validation
- `src/catalog/README.md` - Fixture and provider documentation
- `SERVICES_REFERENCE.md` - Services that power components

---

## Summary

**Key Takeaways**:
1. All components follow **strict typing** with TypeScript
2. **Base components** are generic and reusable across layers
3. **Node components** follow exact pattern for React Flow
4. **Render props** enable domain-specific customization
5. **Error boundaries** wrap render props for safety
6. **Dark mode** is built-in with `dark:` Tailwind classes
7. **Stories** document all components with visual examples
8. **Test IDs** enable comprehensive E2E testing

For **component-specific details**, see the story files - they demonstrate actual usage patterns and visual variations.
