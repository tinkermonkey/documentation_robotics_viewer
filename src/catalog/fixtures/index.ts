/**
 * Catalog Fixtures Index
 * Centralized exports for all test fixtures
 */

// Model Fixtures
export {
  createCompleteModelFixture,
  createMinimalModelFixture,
  createMotivationLayerModelFixture,
  createBusinessLayerModelFixture,
  createC4LayerModelFixture,
  createChangesetModelFixture,
  createEmptyModelFixture,
  createLargeModelFixture
} from './modelFixtures';

// Node Data Fixtures
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
} from './nodeDataFixtures';

// Annotation Fixtures
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
} from './annotationFixtures';

// Spec Fixtures
export {
  createMinimalSpecFixture,
  createCompleteSpecFixture,
  createCustomSpecFixture
} from './specFixtures';
