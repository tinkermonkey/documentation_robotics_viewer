# Custom Hooks Reference Guide

Complete documentation of all custom React hooks in the Documentation Robotics Viewer, organized by purpose and integration layer.

## Table of Contents

- [Business Layer Hooks (2)](#business-layer-hooks)
- [Embedded App Hooks (2)](#embedded-app-hooks)
- [Store Integration Hooks (Zustand)](#store-integration-hooks)
- [Hook Composition Patterns](#hook-composition-patterns)
- [Hook Testing Guide](#hook-testing-guide)
- [Common Patterns & Best Practices](#common-patterns--best-practices)

---

## Business Layer Hooks

### 1. useBusinessFilters

**Location**: `src/core/hooks/useBusinessFilters.ts`
**Purpose**: Multi-dimensional filtering for business layer elements with performance optimization
**Performance**: <500ms for 500+ nodes using Set-based operations

**Types**:
```typescript
interface BusinessFilters {
  /** Element types to show (empty = show all) */
  types: Set<BusinessNodeType>;

  /** Business domains to show (empty = show all) */
  domains: Set<string>;

  /** Lifecycle stages to show (empty = show all) */
  lifecycles: Set<'ideation' | 'active' | 'deprecated'>;

  /** Criticality levels to show (empty = show all) */
  criticalities: Set<'high' | 'medium' | 'low'>;
}

interface FilterResult {
  filteredNodes: Node[];
  filteredEdges: Edge[];
  visibleCount: number;
  totalCount: number;
}
```

**Function Signature**:
```typescript
function useBusinessFilters(
  nodes: Node[],
  edges: Edge[],
  filters: BusinessFilters,
  businessGraph: BusinessGraph | null
): FilterResult
```

**Key Features**:
- ✅ Multi-dimensional filtering (type, domain, lifecycle, criticality)
- ✅ Performance optimized with Set operations
- ✅ Pre-built indices in businessGraph for O(n) filtering
- ✅ Automatic edge filtering (removes edges with invisible endpoints)
- ✅ Performance logging (warns if >500ms)

**Usage Example**:
```typescript
import { useBusinessFilters } from '@/core/hooks/useBusinessFilters';

// In component
const filters: BusinessFilters = {
  types: new Set(['service', 'process']),
  domains: new Set(['payments']),
  lifecycles: new Set(['active']),
  criticalities: new Set(['high', 'medium'])
};

const { filteredNodes, filteredEdges, visibleCount, totalCount } =
  useBusinessFilters(nodes, edges, filters, businessGraph);

return (
  <div>
    <p>Visible: {visibleCount} / {totalCount}</p>
    <GraphViewer nodes={filteredNodes} edges={filteredEdges} />
  </div>
);
```

**Related Helper Hook**:
```typescript
function useAvailableFilters(businessGraph: BusinessGraph | null)
// Returns available values for each filter dimension
// Useful for populating filter UI dropdowns/checkboxes
```

**Performance Characteristics**:
- Time Complexity: O(n) where n = number of nodes
- Space Complexity: O(n) for filtered result arrays
- Memoization: Re-calculates only when `nodes`, `edges`, `filters`, or `businessGraph` change

---

### 2. useBusinessFocus

**Location**: `src/core/hooks/useBusinessFocus.ts`
**Purpose**: Manage focused/hovered element in business layer view

**Types**:
```typescript
interface BusinessFocusState {
  focusedElementId: string | null;
  focusedElement: BusinessElement | null;
  setFocus: (id: string | null) => void;
  clearFocus: () => void;
}
```

**Function Signature**:
```typescript
function useBusinessFocus(
  elementId: string | null,
  graph: BusinessGraph | null
): BusinessFocusState
```

**Key Features**:
- ✅ Manages focused element ID
- ✅ Looks up focused element from graph
- ✅ Handles null/undefined gracefully
- ✅ Provides both ID and element data

**Usage Example**:
```typescript
import { useBusinessFocus } from '@/core/hooks/useBusinessFocus';

const [focusedId, setFocusedId] = useState<string | null>(null);
const { focusedElement, setFocus, clearFocus } =
  useBusinessFocus(focusedId, businessGraph);

const handleNodeHover = (nodeId: string) => {
  setFocus(nodeId);
};

const handleNodeLeave = () => {
  clearFocus();
};

return (
  <div>
    {focusedElement && (
      <p>Focused: {focusedElement.name}</p>
    )}
  </div>
);
```

**Typical Usage in Components**:
- Highlight element on hover
- Show tooltip with element details
- Display element info in sidebar on click
- Visual emphasis on selection

---

## Embedded App Hooks

### 3. useCrossLayerLinks

**Location**: `src/apps/embedded/hooks/useCrossLayerLinks.ts`
**Purpose**: Access and filter cross-layer references and relationships
**Performance**: Optimized index-based lookup

**Types**:
```typescript
interface CrossLayerLink {
  id: string;
  sourceElementId: string;
  targetElementId: string;
  sourceLayer: LayerType;
  targetLayer: LayerType;
  type: 'implements' | 'realizes' | 'depends_on' | 'supports' | 'traces_to';
  description?: string;
  validated: boolean;
}

interface CrossLayerLinkResult {
  allLinks: CrossLayerLink[];
  filterBySource: (elementId: string) => CrossLayerLink[];
  filterByTarget: (elementId: string) => CrossLayerLink[];
  filterByType: (type: string) => CrossLayerLink[];
  filterByLayers: (fromLayer: LayerType, toLayer: LayerType) => CrossLayerLink[];
  getDownstreamElements: (elementId: string) => ModelElement[];
  getUpstreamElements: (elementId: string) => ModelElement[];
}
```

**Function Signature**:
```typescript
function useCrossLayerLinks(
  model: Model | null,
  selectedElementId?: string | null
): CrossLayerLinkResult
```

**Key Features**:
- ✅ Extract all cross-layer references from model
- ✅ Filter by source, target, type, or layers
- ✅ Find upstream and downstream dependencies
- ✅ Handles null model gracefully
- ✅ Optional filtering by selected element

**Usage Example**:
```typescript
import { useCrossLayerLinks } from '@/apps/embedded/hooks/useCrossLayerLinks';

const links = useCrossLayerLinks(model, selectedElementId);

// Filter to see what implements this business service
const implementingApis = links.filterBySource('business.service.payment')
  .filter(l => l.type === 'implements');

// See what depends on a capability
const dependents = links.filterByTarget('capability.process-payments');

// Find all upstream dependencies
const upstreamElements = links.getUpstreamElements('api.operation.create-transaction');

return (
  <div>
    <h3>Cross-Layer References</h3>
    {links.allLinks.map(link => (
      <div key={link.id}>
        {link.sourceElementId} [{link.type}] {link.targetElementId}
      </div>
    ))}
  </div>
);
```

**Visual Use Cases**:
- Show what other layers depend on selected element
- Display traceability from business to technology
- Impact analysis visualization
- Dependency graph views

---

### 4. useDataLoader

**Location**: `src/apps/embedded/hooks/useDataLoader.ts`
**Purpose**: Load and manage architecture model data with error handling and progress tracking
**Status**: Integrates with `dataLoader` service

**Types**:
```typescript
interface DataLoaderState {
  model: Model | null;
  loading: boolean;
  error: Error | null;
  progress: {
    current: number;
    total: number;
    message: string;
  };
}

interface DataLoaderActions {
  load: (source: string | File) => Promise<void>;
  reload: () => Promise<void>;
  clear: () => void;
}
```

**Function Signature**:
```typescript
function useDataLoader(): DataLoaderState & DataLoaderActions
```

**Key Features**:
- ✅ Load from file path, URL, or File object
- ✅ Error handling with user-friendly messages
- ✅ Progress tracking for large files
- ✅ Reload capability for refresh
- ✅ Clear data functionality

**Usage Example**:
```typescript
import { useDataLoader } from '@/apps/embedded/hooks/useDataLoader';

const { model, loading, error, progress, load, reload } = useDataLoader();

const handleFileSelect = async (file: File) => {
  try {
    await load(file);
  } catch (err) {
    console.error('Load failed:', err);
  }
};

return (
  <div>
    {loading && <ProgressBar value={progress.current} max={progress.total} />}
    {error && <ErrorMessage message={error.message} />}
    {model && <GraphViewer model={model} />}
    <Button onClick={() => load('./model.yaml')}>Load</Button>
    <Button onClick={reload}>Reload</Button>
  </div>
);
```

**Progress Tracking**:
- `progress.current` - Bytes/elements loaded
- `progress.total` - Total bytes/elements
- `progress.message` - Current operation (e.g., "Parsing YAML...", "Building graph...")

---

## Store Integration Hooks

### Zustand Store Hooks

The application uses Zustand for state management. Here are the store hooks:

**Core Stores**:

#### 1. `useModelStore()`
**Location**: `src/core/stores/modelStore.ts`
**Purpose**: Access loaded model data

```typescript
interface ModelState {
  model: Model | null;
  loading: boolean;
  error: Error | null;
  setModel: (model: Model) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  getElement: (id: string) => ModelElement | null;
  getElementsByType: (type: string) => ModelElement[];
  getLayer: (layerName: string) => Layer | null;
}

const model = useModelStore(state => state.model);
const element = useModelStore(state => state.getElement('element-id'));
```

#### 2. `useLayerStore()`
**Location**: `src/core/stores/layerStore.ts`
**Purpose**: Manage layer visibility

```typescript
interface LayerState {
  visibleLayers: Set<string>;
  selectedLayer: string | null;
  toggleLayer: (layerName: string) => void;
  selectLayer: (layerName: string | null) => void;
  setVisibleLayers: (layers: Set<string>) => void;
}

const visibleLayers = useLayerStore(state => state.visibleLayers);
const toggleLayer = useLayerStore(state => state.toggleLayer);
```

#### 3. `useElementStore()`
**Location**: `src/core/stores/elementStore.ts`
**Purpose**: Manage selected/focused element

```typescript
interface ElementState {
  selectedElement: string | null;
  focusedElement: string | null;
  selectElement: (id: string | null) => void;
  focusElement: (id: string | null) => void;
  clearSelection: () => void;
}

const selected = useElementStore(state => state.selectedElement);
```

#### 4. `useLayoutPreferencesStore()`
**Location**: `src/core/stores/layoutPreferencesStore.ts`
**Purpose**: Persist user layout preferences

```typescript
interface LayoutPreferences {
  defaultLayout: LayoutType;
  sidebarWidths: { left: number; right: number };
  expandedSections: Set<string>;
  setDefaultLayout: (layout: LayoutType) => void;
  setSidebarWidth: (side: 'left' | 'right', width: number) => void;
  setExpandedSection: (section: string, expanded: boolean) => void;
}

const prefs = useLayoutPreferencesStore();
```

**Embedded App Stores**:

#### 5. `useAnnotationStore()`
**Location**: `src/apps/embedded/stores/annotationStore.ts`
**Purpose**: Manage annotations with optimistic updates

```typescript
const { annotations, addAnnotation, updateAnnotation, deleteAnnotation } =
  useAnnotationStore();
```

#### 6. `useChangesetStore()`
**Location**: `src/apps/embedded/stores/changesetStore.ts`
**Purpose**: Manage architecture changesets

```typescript
const { changesets, activeChangeset, applyChangeset } = useChangesetStore();
```

#### 7. `useConnectionStore()`
**Location**: `src/apps/embedded/stores/connectionStore.ts`
**Purpose**: WebSocket connection state

```typescript
const { connected, connectionState, reconnect } = useConnectionStore();
```

#### 8. `useAuthStore()`
**Location**: `src/apps/embedded/stores/authStore.ts`
**Purpose**: Authentication state

```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

---

## Hook Composition Patterns

### Pattern 1: Combining Filters with Graph

```typescript
// Custom hook combining multiple hooks
function useFilteredBusinessGraph() {
  const graph = useBusinessGraphStore(state => state.graph);
  const [filters, setFilters] = useState<BusinessFilters>({
    types: new Set(),
    domains: new Set(),
    lifecycles: new Set(),
    criticalities: new Set()
  });

  const { filteredNodes, filteredEdges } = useBusinessFilters(
    graph?.nodes ?? [],
    graph?.edges ?? [],
    filters,
    graph ?? null
  );

  return { filteredNodes, filteredEdges, filters, setFilters };
}

// Usage in component
const { filteredNodes, filteredEdges, filters, setFilters } =
  useFilteredBusinessGraph();
```

### Pattern 2: Focus with Cross-Layer Links

```typescript
function useFocusWithLinks() {
  const [focusId, setFocusId] = useState<string | null>(null);
  const model = useModelStore(state => state.model);
  const graph = useBusinessGraphStore(state => state.graph);

  const { focusedElement } = useBusinessFocus(focusId, graph);
  const crossLayerLinks = useCrossLayerLinks(model, focusId);

  const upstreamElements = focusId
    ? crossLayerLinks.getUpstreamElements(focusId)
    : [];

  return { focusId, setFocusId, focusedElement, upstreamElements };
}
```

### Pattern 3: Loading with Error Handling

```typescript
function useModelWithErrorHandling() {
  const { model, error, load, loading } = useDataLoader();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleLoadWithRetry = async (source: string) => {
    try {
      await load(source);
      setRetryCount(0);
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleLoadWithRetry(source);
        }, delay);
      }
    }
  };

  return { model, error, loading, loadWithRetry: handleLoadWithRetry };
}
```

---

## Hook Testing Guide

### Unit Testing Hooks

**Location**: `tests/unit/hooks/`

**Test Pattern**:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useBusinessFilters } from '@/core/hooks/useBusinessFilters';

test('should filter nodes by type', () => {
  const nodes = [
    { id: '1', data: { type: 'service' } },
    { id: '2', data: { type: 'process' } }
  ];
  const edges = [];
  const filters = {
    types: new Set(['service']),
    domains: new Set(),
    lifecycles: new Set(),
    criticalities: new Set()
  };

  const { result } = renderHook(() =>
    useBusinessFilters(nodes, edges, filters, mockGraph)
  );

  expect(result.current.filteredNodes).toHaveLength(1);
  expect(result.current.filteredNodes[0].id).toBe('1');
});

test('should update when filters change', () => {
  const nodes = [{ id: '1', data: { type: 'service' } }];
  const edges = [];
  const { result, rerender } = renderHook(
    ({ filters }) => useBusinessFilters(nodes, edges, filters, mockGraph),
    { initialProps: { filters: { types: new Set(['service']), ... } } }
  );

  expect(result.current.filteredNodes).toHaveLength(1);

  rerender({ filters: { types: new Set(['process']), ... } });

  expect(result.current.filteredNodes).toHaveLength(0);
});
```

### Mocking Hooks in Components

```typescript
// Mock a hook in a component test
jest.mock('@/core/hooks/useBusinessFilters', () => ({
  useBusinessFilters: () => ({
    filteredNodes: [{ id: '1' }],
    filteredEdges: [],
    visibleCount: 1,
    totalCount: 1
  })
}));

test('component displays filtered nodes', () => {
  render(<MyComponent />);
  expect(screen.getByText(/1 nodes/)).toBeInTheDocument();
});
```

### Integration Testing Hooks

```typescript
// Test hook behavior in real component context
test('hook updates when store changes', async () => {
  const { result } = renderHook(
    () => ({
      model: useModelStore(state => state.model),
      links: useCrossLayerLinks(useModelStore(state => state.model))
    })
  );

  act(() => {
    useModelStore.getState().setModel(newModel);
  });

  await waitFor(() => {
    expect(result.current.links.allLinks).toHaveLength(5);
  });
});
```

---

## Common Patterns & Best Practices

### Pattern 1: Memoization

All custom hooks use `useMemo` for expensive operations:

```typescript
export function useBusinessFilters(...) {
  return useMemo(() => {
    // Filtering logic
    return { filteredNodes, filteredEdges, ... };
  }, [nodes, edges, filters, businessGraph]);
}
```

**Benefits**:
- ✅ Prevents unnecessary recalculations
- ✅ Stabilizes referential equality
- ✅ Prevents child re-renders

### Pattern 2: Performance Monitoring

Hooks log performance warnings when operations exceed targets:

```typescript
const startTime = performance.now();
// ... operation ...
const duration = performance.now() - startTime;

if (duration > TARGET_MS) {
  console.warn(`Operation took ${duration}ms (target: <${TARGET_MS}ms)`);
}
```

### Pattern 3: Error Handling

Hooks handle errors gracefully and return safe defaults:

```typescript
if (!graph) {
  return {
    filteredNodes: nodes,
    filteredEdges: edges,
    visibleCount: nodes.length,
    totalCount: nodes.length
  };
}
```

### Pattern 4: Dependency Arrays

Always include all dependencies in hook dependency arrays:

```typescript
return useMemo(() => {
  // ...
}, [nodes, edges, filters, businessGraph]); // All used values listed
```

**Common Mistakes to Avoid**:
- ❌ Missing dependencies (causes stale closures)
- ❌ Including non-stable references (e.g., new objects every render)
- ❌ Circular dependencies between hooks

### Pattern 5: Type Safety

All hooks are fully typed with TypeScript:

```typescript
// Good: Clear return type
function useMyHook(): MyHookReturn {
  return { ... };
}

// Good: Typed parameters
function useMyHook(nodes: Node[], edges: Edge[]): MyHookReturn {
  return { ... };
}
```

---

## Hook Dependency Graph

```
useDataLoader
    ↓
    └─→ uses dataLoader service
            ↓
            ├─→ yamlParser
            ├─→ jsonSchemaParser
            └─→ businessGraphBuilder

useBusinessFilters
    ↓
    └─→ uses businessGraph
            ↓
            └─→ contains pre-built indices

useBusinessFocus
    ↓
    └─→ uses businessGraph
            ↓
            └─→ looks up element by ID

useCrossLayerLinks
    ↓
    └─→ uses Model
            ↓
            ├─→ crossLayerLinksExtractor
            ├─→ crossLayerReferenceResolver
            └─→ crossLayerProcessor

useModelStore / useLayerStore / useElementStore
    ↓
    └─→ Zustand stores
            ↓
            └─→ Central state management
```

---

## Hook Selection Guide

**When to use which hook**:

| Use Case | Hook | Why |
|----------|------|-----|
| Filter business elements | `useBusinessFilters` | Optimized Set-based filtering |
| Track focused element | `useBusinessFocus` | Manages focus state with graph lookup |
| Show cross-layer deps | `useCrossLayerLinks` | Extract and query layer relationships |
| Load model data | `useDataLoader` | Handles parsing, errors, progress |
| Access model globally | `useModelStore` | Centralized model state |
| Toggle layers on/off | `useLayerStore` | Global layer visibility state |
| Track selection | `useElementStore` | Global element selection |
| Persist layout | `useLayoutPreferencesStore` | Persisted to localStorage |
| Manage annotations | `useAnnotationStore` | With optimistic updates |

---

## Performance Considerations

### Hook Performance Targets

| Hook | Target | Implementation |
|------|--------|-----------------|
| `useBusinessFilters` | <500ms for 500+ nodes | Set-based operations + indices |
| `useCrossLayerLinks` | <100ms | Indexed lookup, no full scans |
| `useDataLoader` | N/A | Progress tracking provided |
| Zustand stores | <1ms lookup | O(1) access to cached state |

### Optimization Techniques

1. **Use Selectors in Zustand Hooks**:
```typescript
// Good: Only re-render when model changes
const model = useModelStore(state => state.model);

// Avoid: Component re-renders on any state change
const state = useModelStore();
```

2. **Memoize Derived Data**:
```typescript
// Hook already memoizes, but you can too
const memoizedResult = useMemo(
  () => processData(data),
  [data]
);
```

3. **Filter Early**:
```typescript
// Apply filters before expensive operations
const filteredItems = items.filter(predicate);
const processed = filteredItems.map(transform);
```

---

## Related Documentation

- `COMPONENT_API_REFERENCE.md` - Components that use these hooks
- `SERVICES_REFERENCE.md` - Services that back these hooks
- `tests/README.md` - Testing patterns for hooks
- `CLAUDE.md` - Development guide with hook examples

---

## Summary

**Key Takeaways**:
1. **Custom hooks** enhance component logic reusability
2. **Zustand stores** provide centralized state management
3. **Memoization** ensures performance optimization
4. **Typed returns** enable IDE autocomplete
5. **Error handling** ensures graceful degradation
6. **Performance monitoring** catches regressions early
7. **Dependencies array** prevents stale closures
8. **Composition** allows complex interactions from simple hooks

Use these hooks to build performant, type-safe components that integrate seamlessly with the architecture visualization system.
