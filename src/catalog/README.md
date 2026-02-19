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
import type { Meta, StoryObj } from '@storybook/react';
import {
  MockStoreProvider,
  createCompleteModelFixture,
  createAnnotationListFixture
} from '@catalog';
import { AnnotationPanel } from '@apps/embedded/components/AnnotationPanel';

type Story = StoryObj<typeof AnnotationPanel>;

export default {
  title: 'Panels / AnnotationPanel',
  component: AnnotationPanel
} satisfies Meta<typeof AnnotationPanel>;

export const Default: Story = {
  render: () => (
    <MockStoreProvider
      modelStoreOverrides={{ model: createCompleteModelFixture() }}
      initialAnnotations={createAnnotationListFixture(5)}
    >
      <AnnotationPanel elementId="goal-1" />
    </MockStoreProvider>
  )
};
```

### Tier 4: React Flow Node

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import {
  withReactFlowDecorator,
  createGoalNodeData
} from '@catalog';
import { GoalNode } from '@core/nodes/motivation/GoalNode';

type Story = StoryObj<typeof GoalNode>;

export default {
  title: 'Nodes / Motivation / GoalNode',
  component: GoalNode,
  decorators: [withReactFlowDecorator({ width: 180, height: 100 })]
} satisfies Meta<typeof GoalNode>;

export const Default: Story = {
  args: {
    data: createGoalNodeData({ label: 'Sample Goal' })
  }
};

export const HighPriority: Story = {
  args: {
    data: createGoalNodeData({
      label: 'Critical Goal',
      priority: 'high'
    })
  }
};

export const WithCoverage: Story = {
  args: {
    data: createGoalNodeData({
      label: 'Covered Goal',
      coverageIndicator: {
        status: 'covered',
        requirementCount: 5,
        constraintCount: 2
      }
    })
  }
};
```

### Tier 5: Composite View

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import {
  MockStoreProvider,
  createCompleteModelFixture
} from '@catalog';
import { GraphViewer } from '@core/components/GraphViewer';

type Story = StoryObj<typeof GraphViewer>;

export default {
  title: 'Views / GraphViewer',
  component: GraphViewer
} satisfies Meta<typeof GraphViewer>;

export const Complete: Story = {
  render: () => (
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
  )
};
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

## Coverage Strategy

The Storybook catalog uses a systematic approach to ensure comprehensive component coverage across all application layers:

### Coverage By Component Type

**Architecture Nodes (16 total)**
- Motivation layer: 10 node types (Goal, Stakeholder, Requirement, Constraint, Driver, Outcome, Principle, Assumption, ValueStream, Assessment)
- Business layer: 3 node types (BusinessService, BusinessFunction, BusinessCapability)
- C4 layer: 3 node types (Container, Component, ExternalActor)
- **Status**: All 16 have story files with default variants
- **Phase 2 Work**: Add play() functions for interactive testing

**Composite Views (5 total)**
- GraphViewer, MotivationGraphView, BusinessLayerView, C4GraphView, C4ComponentView
- **Status**: 5 story files with state variants (loading, error, empty, populated)
- **Phase 2 Work**: Add play() functions for panning, zooming, selection

**UI Components & Panels (50+ total)**
- Filter panels, Inspector panels, Control panels, Dialogs, Modals
- **Status**: ~45 story files with typical use cases
- **Phase 2 Work**: Add play() functions for user interactions (filtering, selection, expansion)

**Layout & Infrastructure (20+ total)**
- Layout engines, edge types, decorators, provider components
- **Status**: ~22 story files with configuration variants
- **Phase 2 Work**: Add play() functions for layout verification

### Coverage By State

Each component category includes story variants for:
- **Default/Normal**: Standard rendering without data
- **Loading**: Skeleton, spinner, or loading states
- **Error**: Error messages and error recovery UI
- **Empty**: Empty data set displays
- **Populated**: With realistic fixture data
- **Changeset States**: add, update, delete, dimmed, highlighted visual states
- **Accessibility**: High contrast, keyboard navigation, screen reader variants

### How Components Were Selected

1. **Layer-based Organization**: Grouped by architecture layer (Motivation, Business, Technical, UX, etc.)
2. **Functional Categories**: Organized into 9 functional areas for easy navigation:
   - **Nodes** - Custom React Flow nodes by type
   - **Edges** - Custom React Flow edge variants
   - **Views** - Full graph visualization components
   - **Panels & Sidebars** - Inspector, filter, control, annotation panels
   - **Dialogs & Modals** - Modal components
   - **Layout & Tools** - Layout engines, utilities, helpers
   - **Decorators & Providers** - Context wrappers and test infrastructure
   - **Data Structures** - Data shape documentation and examples
   - **Examples & Patterns** - Complete workflow examples

3. **Completeness Criteria**: Stories created for:
   - Every custom React Flow node type
   - Every dialog and modal component
   - Every panel and sidebar variant
   - Every layout and visualization view
   - Key infrastructure components used in tests

### Current Coverage Metrics

| Category | Components | Story Files | Stories | Play() Coverage |
|----------|------------|-------------|---------|-----------------|
| Nodes | 16 | 16 | 89 | 3% |
| Views | 5 | 5 | 42 | 1% |
| Panels & Sidebars | 15 | 18 | 95 | 2% |
| Dialogs & Modals | 12 | 12 | 85 | 1% |
| Layout & Tools | 20 | 22 | 118 | 1% |
| Decorators & Providers | 8 | 8 | 64 | 0% |
| Data Structures | 6 | 6 | 52 | 0% |
| Examples & Patterns | 5 | 10 | 33 | 5% |
| **Total** | **87** | **97** | **578** | **~2%** |

### Identifying Coverage Gaps

**Current Gaps (Phase 2 focus areas)**:
- Interactive play() test functions (~99% remaining)
- Complex state transition scenarios
- Keyboard navigation for accessible components
- Animation and transition states
- Error recovery and retry flows

**How Gaps Are Identified**:
1. **Automated tooling**: `npm run test:storybook` runs Playwright test runner on all 578 stories
2. **Accessibility scanning**: `npm run test:storybook:a11y` checks WCAG 2.1 AA compliance
3. **Manual review**: Stories reviewed for realistic variants and edge cases
4. **Quarterly audits**: Scheduled reviews to identify missing states and untested scenarios

### Adding New Stories

When adding new components to the application:

1. **Create story file**: `src/stories/[Category]/ComponentName.stories.tsx`
2. **Import fixtures**: Use factories from `@catalog` (MockStoreProvider, decorators, nodeDataFixtures)
3. **Define variants**: Create stories for default, loading, error, empty, populated states
4. **Add accessibility**: Include `role` and `aria-label` attributes
5. **Document usage**: Add JSDoc comments with component responsibilities
6. **Phase 2**: Implement play() functions for user interactions

### Future Enhancements (Phase 3)

- Visual regression testing integration
- Component usage analytics
- Interactive UI state explorer
- Auto-generated snapshot tests
- Performance baseline tracking

## Documentation

See the individual files for detailed API documentation:
- `providers/MockStoreProvider.tsx` - Store factory patterns
- `providers/MockWebSocketProvider.tsx` - WebSocket simulation
- `decorators/ReactFlowDecorator.tsx` - React Flow integration
- `decorators/withNodeContainer.tsx` - Node dimension containers
- `fixtures/nodeDataFixtures.ts` - All 16 node factories
- `fixtures/modelFixtures.ts` - Model fixture variants
- `fixtures/annotationFixtures.ts` - Annotation patterns
