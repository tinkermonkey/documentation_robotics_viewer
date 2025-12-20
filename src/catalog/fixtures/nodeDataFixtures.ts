/**
 * Node Data Fixture Factories
 * Factory functions for creating realistic mock data for all 16 custom node types
 * Includes support for all changeset operations and visual states
 */

import type {
  GoalNodeData,
  StakeholderNodeData,
  RequirementNodeData,
  ConstraintNodeData,
  DriverNodeData,
  OutcomeNodeData,
  PrincipleNodeData,
  AssumptionNodeData,
  ValueStreamNodeData,
  AssessmentNodeData,
  BusinessServiceNodeData,
  BusinessFunctionNodeData,
  BusinessCapabilityNodeData,
  C4ContainerNodeData,
  C4ComponentNodeData,
  C4ExternalActorNodeData,
  CoverageIndicator,
  RelationshipBadge
} from '../../core/types';

/**
 * Base options for all node data
 */
export interface BaseNodeOptions {
  label?: string;
  elementId?: string;
  layerId?: string;
  fill?: string;
  stroke?: string;
  changesetOperation?: 'add' | 'update' | 'delete';
  opacity?: number;
  strokeWidth?: number;
  relationshipBadge?: RelationshipBadge;
}

/**
 * Motivation Layer Node Fixtures (10 nodes)
 */

export interface GoalNodeOptions extends BaseNodeOptions {
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  coverageIndicator?: CoverageIndicator;
}

export function createGoalNodeData(options: GoalNodeOptions = {}): GoalNodeData {
  const {
    label = 'Increase Revenue',
    elementId = `goal-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#fbbf24',
    stroke = '#d97706',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    priority = 'medium',
    status = 'active',
    coverageIndicator
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    priority,
    status,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge,
    coverageIndicator
  };
}

export interface StakeholderNodeOptions extends BaseNodeOptions {
  stakeholderType?: string;
  interests?: string[];
}

export function createStakeholderNodeData(options: StakeholderNodeOptions = {}): StakeholderNodeData {
  const {
    label = 'CEO',
    elementId = `stakeholder-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#60a5fa',
    stroke = '#2563eb',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    stakeholderType = 'internal',
    interests = ['profitability', 'growth']
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    stakeholderType,
    interests,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface RequirementNodeOptions extends BaseNodeOptions {
  requirementType?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
}

export function createRequirementNodeData(options: RequirementNodeOptions = {}): RequirementNodeData {
  const {
    label = 'Support Payment Processing',
    elementId = `requirement-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#a78bfa',
    stroke = '#7c3aed',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    requirementType = 'functional',
    priority = 'high',
    status = 'active'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    requirementType,
    priority,
    status,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface ConstraintNodeOptions extends BaseNodeOptions {
  negotiability?: 'fixed' | 'negotiable';
}

export function createConstraintNodeData(options: ConstraintNodeOptions = {}): ConstraintNodeData {
  const {
    label = 'GDPR Compliance',
    elementId = `constraint-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#f87171',
    stroke = '#dc2626',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    negotiability = 'fixed'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    negotiability,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface DriverNodeOptions extends BaseNodeOptions {
  category?: 'business' | 'technical' | 'regulatory' | 'market';
}

export function createDriverNodeData(options: DriverNodeOptions = {}): DriverNodeData {
  const {
    label = 'Market Competition',
    elementId = `driver-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#f97316',
    stroke = '#d97706',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    category = 'market'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    category,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface OutcomeNodeOptions extends BaseNodeOptions {
  achievementStatus?: 'planned' | 'in-progress' | 'achieved' | 'at-risk';
}

export function createOutcomeNodeData(options: OutcomeNodeOptions = {}): OutcomeNodeData {
  const {
    label = 'Improved Customer Satisfaction',
    elementId = `outcome-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#4ade80',
    stroke = '#22c55e',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    achievementStatus = 'in-progress'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    achievementStatus,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface PrincipleNodeOptions extends BaseNodeOptions {
  scope?: 'enterprise' | 'domain' | 'application';
}

export function createPrincipleNodeData(options: PrincipleNodeOptions = {}): PrincipleNodeData {
  const {
    label = 'API-First Architecture',
    elementId = `principle-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#06b6d4',
    stroke = '#0891b2',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    scope = 'enterprise'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    scope,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface AssumptionNodeOptions extends BaseNodeOptions {
  validationStatus?: 'validated' | 'unvalidated' | 'invalidated';
}

export function createAssumptionNodeData(options: AssumptionNodeOptions = {}): AssumptionNodeData {
  const {
    label = 'Cloud Infrastructure Availability',
    elementId = `assumption-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#8b5cf6',
    stroke = '#7c3aed',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    validationStatus = 'unvalidated'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    validationStatus,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface ValueStreamNodeOptions extends BaseNodeOptions {
  stageCount?: number;
}

export function createValueStreamNodeData(options: ValueStreamNodeOptions = {}): ValueStreamNodeData {
  const {
    label = 'Order Processing Stream',
    elementId = `valueStream-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#06b6d4',
    stroke = '#0891b2',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    stageCount = 5
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    stageCount,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface AssessmentNodeOptions extends BaseNodeOptions {
  rating?: number;
}

export function createAssessmentNodeData(options: AssessmentNodeOptions = {}): AssessmentNodeData {
  const {
    label = 'Technology Assessment',
    elementId = `assessment-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'motivation-layer',
    fill = '#ec4899',
    stroke = '#db2777',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    rating = 3
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    rating,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

/**
 * Business Layer Node Fixtures (3 nodes)
 */

export interface BusinessServiceNodeOptions extends BaseNodeOptions {
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
}

export function createBusinessServiceNodeData(options: BusinessServiceNodeOptions = {}): BusinessServiceNodeData {
  const {
    label = 'Payment Service',
    elementId = `service-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'business-layer',
    fill = '#10b981',
    stroke = '#059669',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    owner = 'Finance Team',
    criticality = 'high',
    lifecycle = 'active',
    domain = 'Finance'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    owner,
    criticality,
    lifecycle,
    domain,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface BusinessFunctionNodeOptions extends BaseNodeOptions {
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
}

export function createBusinessFunctionNodeData(options: BusinessFunctionNodeOptions = {}): BusinessFunctionNodeData {
  const {
    label = 'Order Processing',
    elementId = `function-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'business-layer',
    fill = '#14b8a6',
    stroke = '#0d9488',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    owner = 'Sales Team',
    criticality = 'high',
    lifecycle = 'active',
    domain = 'Sales'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    owner,
    criticality,
    lifecycle,
    domain,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface BusinessCapabilityNodeOptions extends BaseNodeOptions {
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
}

export function createBusinessCapabilityNodeData(options: BusinessCapabilityNodeOptions = {}): BusinessCapabilityNodeData {
  const {
    label = 'Customer Management',
    elementId = `capability-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'business-layer',
    fill = '#0891b2',
    stroke = '#0e7490',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    owner = 'CRM Team',
    criticality = 'high',
    lifecycle = 'active',
    domain = 'Customer'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    owner,
    criticality,
    lifecycle,
    domain,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

/**
 * C4 Layer Node Fixtures (3 nodes)
 */

export interface C4ContainerNodeOptions extends BaseNodeOptions {
  containerType?: 'webApp' | 'mobileApp' | 'service' | 'database' | 'queue' | 'filesystem' | 'other';
  technology?: string[];
  description?: string;
}

export function createC4ContainerNodeData(options: C4ContainerNodeOptions = {}): C4ContainerNodeData {
  const {
    label = 'Web Application',
    elementId = `container-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'c4-layer',
    fill = '#6366f1',
    stroke = '#4f46e5',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    containerType = 'webApp',
    technology = ['React', 'TypeScript', 'Vite'],
    description = 'Provides user interface for the system'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    containerType,
    technology,
    description,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface C4ComponentNodeOptions extends BaseNodeOptions {
  role?: string;
  technology?: string[];
  description?: string;
  interfaces?: string[];
}

export function createC4ComponentNodeData(options: C4ComponentNodeOptions = {}): C4ComponentNodeData {
  const {
    label = 'GraphViewer Component',
    elementId = `component-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'c4-layer',
    fill = '#8b5cf6',
    stroke = '#7c3aed',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    role = 'Controller',
    technology = ['React', '@xyflow/react'],
    description = 'Renders architecture diagrams',
    interfaces = ['IGraphRenderer', 'INodeTransformer']
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    role,
    technology,
    description,
    interfaces,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

export interface C4ExternalActorNodeOptions extends BaseNodeOptions {
  actorType?: 'user' | 'system' | 'service';
  description?: string;
}

export function createC4ExternalActorNodeData(options: C4ExternalActorNodeOptions = {}): C4ExternalActorNodeData {
  const {
    label = 'End User',
    elementId = `actor-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'c4-layer',
    fill = '#f97316',
    stroke = '#ea580c',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    actorType = 'user',
    description = 'A person using the system'
  } = options;

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    actorType,
    description,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

/**
 * Factory for creating multiple node fixtures with specific states
 */
export function createNodeFixturesWithStates(nodeType: keyof typeof nodeFactories, baseOptions: any = {}) {
  const factory = nodeFactories[nodeType];
  if (!factory) {
    throw new Error(`Unknown node type: ${nodeType}`);
  }

  return {
    default: factory(baseOptions),
    add: factory({ ...baseOptions, changesetOperation: 'add' }),
    update: factory({ ...baseOptions, changesetOperation: 'update' }),
    delete: factory({ ...baseOptions, changesetOperation: 'delete' }),
    dimmed: factory({ ...baseOptions, opacity: 0.5 }),
    highlighted: factory({ ...baseOptions, strokeWidth: 3, opacity: 1 })
  };
}

/**
 * Map of all node factory functions for easy lookup
 */
const nodeFactories = {
  goal: createGoalNodeData,
  stakeholder: createStakeholderNodeData,
  requirement: createRequirementNodeData,
  constraint: createConstraintNodeData,
  driver: createDriverNodeData,
  outcome: createOutcomeNodeData,
  principle: createPrincipleNodeData,
  assumption: createAssumptionNodeData,
  valueStream: createValueStreamNodeData,
  assessment: createAssessmentNodeData,
  businessService: createBusinessServiceNodeData,
  businessFunction: createBusinessFunctionNodeData,
  businessCapability: createBusinessCapabilityNodeData,
  c4Container: createC4ContainerNodeData,
  c4Component: createC4ComponentNodeData,
  c4ExternalActor: createC4ExternalActorNodeData
};
