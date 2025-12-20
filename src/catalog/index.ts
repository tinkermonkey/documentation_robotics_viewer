/**
 * Component Catalog Index
 * Centralized exports for all catalog infrastructure
 */

// Providers
export {
  MockStoreProvider,
  useMockStores,
  createMockModelStore,
  createMockAnnotationStore,
  createMockFilterStore,
  MockStoreContext,
  type MockFilterState
} from './providers/MockStoreProvider';

export {
  MockWebSocketProvider,
  useMockWebSocket,
  createMockWebSocketClient,
  useWebSocketEventSimulator,
  WebSocketEventTypes,
  type MockWebSocketClient
} from './providers/MockWebSocketProvider';

// Decorators
export {
  withReactFlowDecorator,
  type ReactFlowDecoratorOptions
} from './decorators/ReactFlowDecorator';

export {
  withMargin,
  withPadding,
  withBorder
} from './decorators/withMargin';

export {
  withNodeContainer,
  withGridContainer,
  withDimensionLabels,
  type NodeContainerOptions
} from './decorators/withNodeContainer';

// Fixtures - Node Data
export {
  createGoalNodeData,
  createStakeholderNodeData,
  createRequirementNodeData,
  createConstraintNodeData,
  createDriverNodeData,
  createOutcomeNodeData,
  createPrincipleNodeData,
  createAssumptionNodeData,
  createValueStreamNodeData,
  createAssessmentNodeData,
  createBusinessServiceNodeData,
  createBusinessFunctionNodeData,
  createBusinessCapabilityNodeData,
  createC4ContainerNodeData,
  createC4ComponentNodeData,
  createC4ExternalActorNodeData,
  createNodeFixturesWithStates
} from './fixtures/nodeDataFixtures';

// Fixtures - Model Data
export {
  createCompleteModelFixture,
  createMinimalModelFixture,
  createMotivationLayerModelFixture,
  createBusinessLayerModelFixture,
  createC4LayerModelFixture,
  createChangesetModelFixture,
  createEmptyModelFixture,
  createLargeModelFixture
} from './fixtures/modelFixtures';

// Fixtures - Annotation Data
export {
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
} from './fixtures/annotationFixtures';
