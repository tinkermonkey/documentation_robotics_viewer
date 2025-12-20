# Component Catalog Infrastructure

This directory contains reusable context providers, decorators, and fixture factories to support component stories requiring React Flow context, Zustand stores, WebSocket clients, and realistic test data.

## Directory Structure

```
src/catalog/
├── index.ts                 # Centralized exports for all catalog infrastructure
├── README.md               # This file
├── providers/              # Mock context providers
│   ├── MockStoreProvider.tsx      # Zustand store factories
│   └── MockWebSocketProvider.tsx  # Mock WebSocket client
├── decorators/             # Reusable story decorators
│   ├── ReactFlowDecorator.tsx     # React Flow context wrapper
│   ├── withMargin.tsx             # Margin/padding utilities
│   └── withNodeContainer.tsx      # Node dimension containers
└── fixtures/               # Mock data factories
    ├── nodeDataFixtures.ts        # 16 node type factories
    ├── modelFixtures.ts           # Complete MetaModel instances
    └── annotationFixtures.ts      # Annotation test data
```

## Component Complexity Tiers

The catalog infrastructure is designed to support components at different complexity levels:

### Tier 1: Stateless Components
Examples: `LoadingState`, `ErrorState`, `EmptyState`
- **Context Required:** None (pure props)
- **Usage:** Direct props only

### Tier 2: Interactive Components
Examples: `FilterPanel`, `SubTabNavigation`, `ExpandableSection`
- **Context Required:** Mock callbacks
- **Usage:** Provide mock event handlers

### Tier 3: Store-Connected Components
Examples: `AnnotationPanel`, `ChangesetViewer`, `NodeDetailsPanel`
- **Context Required:** Zustand mock stores
- **Usage:** Wrap with `MockStoreProvider`

### Tier 4: React Flow Nodes/Edges
Examples: All 16 custom nodes, 7 custom edges
- **Context Required:** `ReactFlowProvider` + mock node data
- **Usage:** Wrap with `withReactFlowDecorator`

### Tier 5: Composite Graph Views
Examples: `GraphViewer`, `MotivationGraphView`, `C4GraphView`
- **Context Required:** Full context stack (ReactFlow + stores + model data)
- **Usage:** Combine multiple providers and decorators

## Providers

### MockStoreProvider

Creates mock Zustand stores for testing store-connected components.

```typescript
import { MockStoreProvider, useMockStores } from '@catalog';

// In story setup
export const MyStory = () => {
  return (
    <MockStoreProvider
      modelStoreOverrides={{ model: completeModel }}
      initialAnnotations={annotationList}
      initialFilters={{ layers: ['motivation'] }}
    >
      <AnnotationPanel />
    </MockStoreProvider>
  );
};

// In component
function MyComponent() {
  const { modelStore, annotationStore, filterStore } = useMockStores();
  const model = modelStore((s) => s.model);
  // ...
}
```

**Exported Functions:**
- `createMockModelStore(overrides)` - Create model store with optional state overrides
- `createMockAnnotationStore(initialAnnotations, overrides)` - Create annotation store
- `createMockFilterStore(initialFilters, overrides)` - Create filter store
- `MockStoreProvider` - React component provider
- `useMockStores()` - Hook to access all stores

### MockWebSocketProvider

Simulates real-time WebSocket events for testing event-driven components.

```typescript
import { MockWebSocketProvider, useMockWebSocket } from '@catalog';

export const MyStory = () => {
  return (
    <MockWebSocketProvider>
      <MyRealtimeComponent />
    </MockWebSocketProvider>
  );
};

// In component
function MyRealtimeComponent() {
  const ws = useMockWebSocket();

  useEffect(() => {
    ws.on('annotation:created', (data) => {
      console.log('New annotation:', data);
    });

    return () => ws.off('annotation:created');
  }, [ws]);
}

// In test/story
const ws = useMockWebSocket();
ws.emit('annotation:created', { id: 'ann-1', text: 'Hello' });
```

**Exported Functions:**
- `createMockWebSocketClient()` - Create a mock WebSocket client
- `MockWebSocketProvider` - React component provider
- `useMockWebSocket()` - Hook to access WebSocket client
- `useWebSocketEventSimulator()` - Hook for emitting events in tests

**Event Types:**
```typescript
WebSocketEventTypes = {
  ANNOTATION_CREATED: 'annotation:created',
  ANNOTATION_UPDATED: 'annotation:updated',
  ANNOTATION_DELETED: 'annotation:deleted',
  ANNOTATION_RESOLVED: 'annotation:resolved',
  CHANGESET_CREATED: 'changeset:created',
  CHANGESET_UPDATED: 'changeset:updated',
  CHANGESET_APPLIED: 'changeset:applied',
  CHANGESET_DISCARDED: 'changeset:discarded',
  MODEL_LOADED: 'model:loaded',
  MODEL_UPDATED: 'model:updated',
  FILTER_CHANGED: 'filter:changed',
  SELECTION_CHANGED: 'selection:changed'
}
```

## Decorators

### withReactFlowDecorator

Wraps nodes/edges in ReactFlowProvider and a configured container.

```typescript
import { withReactFlowDecorator, createGoalNodeData } from '@catalog';
import { GoalNode } from '@core/nodes/motivation/GoalNode';

export const GoalNodeStory = () => (
  <GoalNode data={createGoalNodeData({ label: 'Test Goal' })} />
);

GoalNodeStory.decorators = [
  withReactFlowDecorator({ width: 180, height: 100 })
];
```

**Options:**
```typescript
interface ReactFlowDecoratorOptions {
  width?: number;              // Container width (default: 200)
  height?: number;             // Container height (default: 120)
  showBackground?: boolean;    // Show background color (default: false)
  fitView?: boolean;           // Enable fit to view (default: false)
  panOnDrag?: boolean;         // Enable panning (default: false)
  zoomOnScroll?: boolean;      // Enable scroll zoom (default: false)
  nodesDraggable?: boolean;    // Enable dragging (default: false)
}
```

### withNodeContainer

Wraps a node component in a fixed-size container matching node dimensions.

```typescript
import { withNodeContainer } from '@catalog';
import { GOAL_NODE_WIDTH, GOAL_NODE_HEIGHT } from '@core/nodes/motivation/GoalNode';

export const GoalNodeStory = () => <GoalNode data={goalData} />;

GoalNodeStory.decorators = [
  withNodeContainer(GOAL_NODE_WIDTH, GOAL_NODE_HEIGHT)
];
```

**Additional Decorators:**
- `withGridContainer(width, height)` - Show grid background for alignment
- `withDimensionLabels(width, height)` - Display dimension labels

### withMargin / withPadding

Add spacing around components.

```typescript
export const MyStory = () => <MyComponent />;

MyStory.decorators = [withMargin(20), withPadding(10)];
```

### withBorder

Add a visible border for debugging.

```typescript
export const MyStory = () => <MyComponent />;

MyStory.decorators = [withBorder('#e5e7eb', 1)];
```

## Fixtures

### Node Data Fixtures

Factory functions for all 16 custom node types with configurable options.

**Motivation Layer (10 nodes):**
```typescript
import {
  createGoalNodeData,
  createStakeholderNodeData,
  createRequirementNodeData,
  createConstraintNodeData,
  createDriverNodeData,
  createOutcomeNodeData,
  createPrincipleNodeData,
  createAssumptionNodeData,
  createValueStreamNodeData,
  createAssessmentNodeData
} from '@catalog';

const goal = createGoalNodeData({
  label: 'Increase Revenue',
  priority: 'high',
  coverageIndicator: {
    status: 'covered',
    requirementCount: 5,
    constraintCount: 2
  },
  changesetOperation: 'add'
});
```

**Business Layer (3 nodes):**
```typescript
import {
  createBusinessServiceNodeData,
  createBusinessFunctionNodeData,
  createBusinessCapabilityNodeData
} from '@catalog';

const service = createBusinessServiceNodeData({
  label: 'Payment Service',
  owner: 'Finance Team',
  criticality: 'high'
});
```

**C4 Layer (3 nodes):**
```typescript
import {
  createC4ContainerNodeData,
  createC4ComponentNodeData,
  createC4ExternalActorNodeData
} from '@catalog';

const container = createC4ContainerNodeData({
  label: 'Web App',
  containerType: 'webApp',
  technology: ['React', 'TypeScript']
});
```

**Changeset States:**
All node factories support changeset operations and visual states:
```typescript
const nodeStates = createNodeFixturesWithStates('goal', { label: 'Test' });

nodeStates.default     // Normal state
nodeStates.add         // Changeset operation: add
nodeStates.update      // Changeset operation: update
nodeStates.delete      // Changeset operation: delete
nodeStates.dimmed      // Visual state: dimmed (opacity 0.5)
nodeStates.highlighted // Visual state: highlighted (thicker stroke)
```

### Model Fixtures

Complete MetaModel instances for testing GraphViewer and other components.

```typescript
import {
  createCompleteModelFixture,
  createMinimalModelFixture,
  createMotivationLayerModelFixture,
  createBusinessLayerModelFixture,
  createC4LayerModelFixture,
  createChangesetModelFixture,
  createEmptyModelFixture,
  createLargeModelFixture
} from '@catalog';

// Complete model with all layers
const model = createCompleteModelFixture();

// Minimal model for simple tests
const minimal = createMinimalModelFixture();

// Layer-specific models
const motivation = createMotivationLayerModelFixture();
const business = createBusinessLayerModelFixture();
const c4 = createC4LayerModelFixture();

// Special-purpose models
const changeset = createChangesetModelFixture();  // With changeset operations
const empty = createEmptyModelFixture();          // Empty state testing
const large = createLargeModelFixture(500);       // Performance testing
```

### Annotation Fixtures

Mock annotations for testing annotation-related components.

```typescript
import {
  createAnnotationFixture,
  createAnnotationListFixture,
  createResolvedAnnotationFixture,
  createUnresolvedAnnotationsFixture,
  createAnnotationsByElementFixture,
  createAnnotationThreadFixture,
  createAnnotationStatesFixture,
  createTeamAnnotationsFixture,
  createLargeAnnotationSetFixture,
  createAnnotationExamplesFixture
} from '@catalog';

// Single annotation
const ann = createAnnotationFixture({
  elementId: 'goal-1',
  author: 'Alice',
  content: 'Please clarify this requirement'
});

// List of annotations
const list = createAnnotationListFixture(10);

// By resolution status
const resolved = createResolvedAnnotationFixture();
const unresolved = createUnresolvedAnnotationsFixture(5);

// Grouped by element
const byElement = createAnnotationsByElementFixture();

// Thread with replies
const thread = createAnnotationThreadFixture();

// Different states
const states = createAnnotationStatesFixture();

// Team collaboration
const team = createTeamAnnotationsFixture();

// Large sets for performance
const large = createLargeAnnotationSetFixture(1000);

// Example patterns
const examples = createAnnotationExamplesFixture();
// examples.question, examples.suggestion, examples.concern, etc.
```

## Usage Patterns

### Tier 3: Store-Connected Component

```typescript
import type { Story } from '@ladle/react';
import {
  MockStoreProvider,
  createCompleteModelFixture,
  createAnnotationListFixture
} from '@catalog';
import { AnnotationPanel } from '@apps/embedded/components/AnnotationPanel';

export default {
  title: 'Panels / AnnotationPanel'
};

export const Default: Story = () => (
  <MockStoreProvider
    modelStoreOverrides={{ model: createCompleteModelFixture() }}
    initialAnnotations={createAnnotationListFixture(5)}
  >
    <AnnotationPanel elementId="goal-1" />
  </MockStoreProvider>
);
```

### Tier 4: React Flow Node

```typescript
import type { Story } from '@ladle/react';
import {
  withReactFlowDecorator,
  createGoalNodeData
} from '@catalog';
import { GoalNode } from '@core/nodes/motivation/GoalNode';

export default {
  title: 'Nodes / Motivation / GoalNode',
  decorators: [withReactFlowDecorator({ width: 180, height: 100 })]
};

export const Default: Story = () => (
  <GoalNode data={createGoalNodeData({ label: 'Sample Goal' })} />
);

export const HighPriority: Story = () => (
  <GoalNode data={createGoalNodeData({
    label: 'Critical Goal',
    priority: 'high'
  })} />
);

export const WithCoverage: Story = () => (
  <GoalNode data={createGoalNodeData({
    label: 'Covered Goal',
    coverageIndicator: {
      status: 'covered',
      requirementCount: 5,
      constraintCount: 2
    }
  })} />
);
```

### Tier 5: Composite View

```typescript
import type { Story } from '@ladle/react';
import {
  MockStoreProvider,
  createCompleteModelFixture
} from '@catalog';
import { GraphViewer } from '@core/components/GraphViewer';

export default {
  title: 'Views / GraphViewer'
};

export const Complete: Story = () => (
  <MockStoreProvider
    modelStoreOverrides={{
      model: createCompleteModelFixture(),
      loading: false
    }}
  >
    <div style={{ width: '100%', height: '600px' }}>
      <GraphViewer />
    </div>
  </MockStoreProvider>
);
```

## Best Practices

1. **Import from `@catalog`** - Use the centralized index for cleaner imports
2. **Configure overrides** - Use factory options instead of modifying fixture data afterward
3. **Match component complexity** - Only provide context that the component needs
4. **Use meaningful labels** - Make fixture data realistic and descriptive
5. **Test all states** - Create stories for normal, add, update, delete, dimmed, and highlighted states
6. **Preserve fixture immutability** - Don't mutate factory data; use overrides instead

## Testing with Fixtures

Fixtures are designed for both Storybook and unit tests:

```typescript
import { render } from '@testing-library/react';
import { MockStoreProvider } from '@catalog';
import { AnnotationPanel } from './AnnotationPanel';

describe('AnnotationPanel', () => {
  it('displays annotations', () => {
    const { getByText } = render(
      <MockStoreProvider initialAnnotations={createAnnotationListFixture(3)}>
        <AnnotationPanel elementId="goal-1" />
      </MockStoreProvider>
    );

    expect(getByText(/annotation/i)).toBeInTheDocument();
  });
});
```

## Performance Considerations

- **Large fixture sets:** Use `createLargeAnnotationSetFixture()` and `createLargeModelFixture()` for performance testing
- **Lazy loading:** Consider lazy-loading fixtures in development builds
- **Fixture caching:** Zustand stores are created fresh for each story - no cross-story state pollution

## Documentation

See the individual files for detailed API documentation:
- `providers/MockStoreProvider.tsx` - Store factory patterns
- `providers/MockWebSocketProvider.tsx` - WebSocket simulation
- `decorators/ReactFlowDecorator.tsx` - React Flow integration
- `decorators/withNodeContainer.tsx` - Node dimension containers
- `fixtures/nodeDataFixtures.ts` - All 16 node factories
- `fixtures/modelFixtures.ts` - Model fixture variants
- `fixtures/annotationFixtures.ts` - Annotation patterns
