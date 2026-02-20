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
  type MockWebSocketClient,
  type MockWebSocketClientOptions
} from './providers/MockWebSocketProvider';

export {
  MockRouterProvider,
  useParams,
  useSearch,
  useNavigate,
  useMockRouter,
  type NavigateOptions,
  type MockRouterProviderProps
} from './providers/MockRouterProvider';

export {
  MockDataLoaderProvider,
  useMockDataLoader,
  type MockDataLoaderProviderProps
} from './providers/MockDataLoaderProvider';

export {
  StoryProviderWrapper,
  type StoryProviderWrapperProps
} from './providers/StoryProviderWrapper';

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
  createNodeFixturesWithStates,
  type BaseNodeOptions,
  type GoalNodeOptions,
  type StakeholderNodeOptions,
  type RequirementNodeOptions,
  type ConstraintNodeOptions,
  type DriverNodeOptions,
  type OutcomeNodeOptions,
  type PrincipleNodeOptions,
  type AssumptionNodeOptions,
  type ValueStreamNodeOptions,
  type AssessmentNodeOptions,
  type BusinessServiceNodeOptions,
  type BusinessFunctionNodeOptions,
  type BusinessCapabilityNodeOptions,
  type C4ContainerNodeOptions,
  type C4ComponentNodeOptions,
  type C4ExternalActorNodeOptions
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

// Fixtures - Spec Data
export {
  createMinimalSpecFixture,
  createCompleteSpecFixture,
  createCustomSpecFixture
} from './fixtures/specFixtures';

// Components - Story Support
export {
  StoryLoadedWrapper,
  type StoryLoadedWrapperProps
} from './components/StoryLoadedWrapper';

// Components - Route Compositions
export {
  ModelRouteComposition,
  type ModelRouteCompositionProps
} from './components/ModelRouteComposition';

export {
  SpecRouteComposition,
  type SpecRouteCompositionProps
} from './components/SpecRouteComposition';
