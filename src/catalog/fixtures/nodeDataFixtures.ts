/**
 * Node Data Fixture Factories
 * Factory functions for creating realistic mock data for custom node types across all layers
 * Supports all changeset operations (add/update/delete) and visual states
 *
 * NOTE: createBaseFieldListNodeConfig is deprecated and kept for backward compatibility.
 * BaseFieldListNode has been migrated to UnifiedNode.
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
  BusinessProcessNodeData,
  LayerContainerNodeData,
  CoverageIndicator,
  RelationshipBadge
} from '../../core/types';

// DEPRECATED: FieldItem moved to components
// Import FieldItem type (was from BaseFieldListNode, now in UnifiedNode)
export type FieldItem = {
  id: string;
  name: string;
  type: string;
  required: boolean;
};

export interface BaseFieldListNodeConfig {
  label: string;
  typeLabel: string;
  items: FieldItem[];
  colors: {
    border: string;
    background: string;
    header: string;
    handle: string;
  };
  width?: number;
  headerHeight?: number;
  itemHeight?: number;
}

/**
 * Validation helper functions
 */

/**
 * Validates that a dimension value is positive
 */
function validatePositiveDimension(value: number | undefined, name: string): void {
  if (value !== undefined && value <= 0) {
    throw new Error(`${name} must be a positive number, got ${value}`);
  }
}

/**
 * Validates that a CSS color string is valid
 */
function validateCSSColor(color: string | undefined, name: string): boolean {
  if (color === undefined) return true;

  // Basic validation for hex colors (#xxx or #xxxxxx) and named colors
  const hexPattern = /^#([0-9A-Fa-f]{3}){1,2}$/;
  const rgbPattern = /^rgb\(/;
  const rgbaPattern = /^rgba\(/;

  if (hexPattern.test(color) || rgbPattern.test(color) || rgbaPattern.test(color)) {
    return true;
  }

  // For other formats, we'll warn but not fail (CSS has many color formats)
  if (!color.startsWith('#') && !color.startsWith('rgb')) {
    console.warn(`${name}: Color format "${color}" may not be valid CSS`);
  }

  return true;
}

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
 * Business Process Node Fixture
 */
export interface BusinessProcessNodeOptions extends BaseNodeOptions {
  owner?: string;
  criticality?: 'high' | 'medium' | 'low';
  lifecycle?: 'ideation' | 'active' | 'deprecated';
  domain?: string;
  subprocessCount?: number;
  subprocesses?: Array<{ id: string; name: string; description?: string }>;
}

export function createBusinessProcessNodeData(options: BusinessProcessNodeOptions = {}): BusinessProcessNodeData {
  const {
    label = 'Order Processing',
    elementId = `process-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'business-layer',
    fill = '#fff3e0',
    stroke = '#e65100',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    owner = 'Operations Team',
    criticality = 'high',
    lifecycle = 'active',
    domain = 'Sales',
    subprocessCount = 3,
    subprocesses = [
      { id: 'step-1', name: 'Validate Order', description: 'Check order details' },
      { id: 'step-2', name: 'Process Payment', description: 'Handle payment' },
      { id: 'step-3', name: 'Ship Order', description: 'Arrange shipment' }
    ]
  } = options;

  // Validate subprocess count matches array length
  if (options.subprocessCount !== undefined && options.subprocesses !== undefined) {
    if (options.subprocessCount !== options.subprocesses.length) {
      throw new Error(
        `subprocessCount (${options.subprocessCount}) must match subprocesses.length (${options.subprocesses.length})`
      );
    }
  }

  // Validate subprocess count is non-negative
  if (subprocessCount < 0) {
    throw new Error(`subprocessCount must be non-negative, got ${subprocessCount}`);
  }

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
    subprocessCount,
    stepCount: subprocessCount,
    subprocesses,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

/**
 * Layer Container Node Fixture
 */
export interface LayerContainerNodeOptions extends BaseNodeOptions {
  layerType?: string;
  color?: string;
}

export function createLayerContainerNodeData(options: LayerContainerNodeOptions = {}): LayerContainerNodeData {
  const {
    label = 'Business Layer',
    elementId = `container-${Math.random().toString(36).slice(2, 11)}`,
    layerId = 'container-layer',
    fill = '#e8f5e91f',
    stroke = '#4caf50',
    changesetOperation,
    opacity = 1,
    strokeWidth = 2,
    relationshipBadge,
    layerType = 'business',
    color = '#4caf50'
  } = options;

  // Validate CSS color format
  validateCSSColor(options.color, 'color');
  validateCSSColor(options.fill, 'fill');
  validateCSSColor(options.stroke, 'stroke');

  return {
    label,
    elementId,
    layerId,
    fill,
    stroke,
    layerType,
    color,
    changesetOperation,
    opacity,
    strokeWidth,
    relationshipBadge
  };
}

/**
 * Base Field List Node Config Fixture
 */
export interface BaseFieldListNodeOptions {
  label?: string;
  typeLabel?: string;
  items?: FieldItem[];
  colors?: {
    border?: string;
    background?: string;
    header?: string;
    handle?: string;
  };
  width?: number;
  headerHeight?: number;
  itemHeight?: number;
}

export function createBaseFieldListNodeConfig(options: BaseFieldListNodeOptions = {}): BaseFieldListNodeConfig {
  const defaultItems: FieldItem[] = [
    { id: 'field-1', name: 'id', type: 'UUID', required: true },
    { id: 'field-2', name: 'name', type: 'string', required: true },
    { id: 'field-3', name: 'email', type: 'string', required: true },
    { id: 'field-4', name: 'createdAt', type: 'timestamp', required: false },
    { id: 'field-5', name: 'updatedAt', type: 'timestamp', required: false }
  ];

  const {
    label = 'User',
    typeLabel = 'CLASS',
    items = defaultItems,
    colors,
    width = 280,
    headerHeight = 36,
    itemHeight = 24
  } = options;

  // Validate dimensions are positive
  validatePositiveDimension(width, 'width');
  validatePositiveDimension(headerHeight, 'headerHeight');
  validatePositiveDimension(itemHeight, 'itemHeight');

  const defaultColors = {
    border: '#3b82f6',
    background: '#eff6ff',
    header: '#2563eb',
    handle: '#1e40af'
  };

  // Validate custom colors if provided
  if (colors) {
    validateCSSColor(colors.border, 'colors.border');
    validateCSSColor(colors.background, 'colors.background');
    validateCSSColor(colors.header, 'colors.header');
    validateCSSColor(colors.handle, 'colors.handle');
  }

  // Validate field items have required properties
  items.forEach((item, index) => {
    if (!item.id || !item.name || !item.type) {
      throw new Error(
        `Invalid field item at index ${index}: missing required properties (id, name, or type)`
      );
    }
  });

  return {
    label,
    typeLabel,
    items,
    colors: colors ? { ...defaultColors, ...colors } : defaultColors,
    width,
    headerHeight,
    itemHeight
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
  c4ExternalActor: createC4ExternalActorNodeData,
  businessProcess: createBusinessProcessNodeData,
  layerContainer: createLayerContainerNodeData
};
