/**
 * NodeType Enum
 *
 * Defines all 21+ node types across the architecture layers.
 * Maps to JSON configuration for styling, dimensions, and layout.
 *
 * Layers:
 * - Motivation (10): Strategic goals, requirements, drivers, outcomes
 * - Business (4): Functions, services, capabilities, processes
 * - C4 (3): Containers, components, external actors
 * - Data (2): JSON schemas, data models
 * - Structural (1): Layer containers
 *
 * Format: 'layer.type' (e.g., 'motivation.goal')
 */
export enum NodeType {
  // Motivation layer (10)
  MOTIVATION_STAKEHOLDER = 'motivation.stakeholder',
  MOTIVATION_GOAL = 'motivation.goal',
  MOTIVATION_REQUIREMENT = 'motivation.requirement',
  MOTIVATION_ASSESSMENT = 'motivation.assessment',
  MOTIVATION_DRIVER = 'motivation.driver',
  MOTIVATION_OUTCOME = 'motivation.outcome',
  MOTIVATION_PRINCIPLE = 'motivation.principle',
  MOTIVATION_CONSTRAINT = 'motivation.constraint',
  MOTIVATION_VALUE_STREAM = 'motivation.valueStream',
  MOTIVATION_ASSUMPTION = 'motivation.assumption',

  // Business layer (4)
  BUSINESS_FUNCTION = 'business.function',
  BUSINESS_SERVICE = 'business.service',
  BUSINESS_CAPABILITY = 'business.capability',
  BUSINESS_PROCESS = 'business.process',

  // C4 layer (3)
  C4_CONTAINER = 'c4.container',
  C4_COMPONENT = 'c4.component',
  C4_EXTERNAL_ACTOR = 'c4.externalActor',

  // Data layer (2)
  DATA_JSON_SCHEMA = 'data.jsonSchema',
  DATA_MODEL = 'data.model',

  // Structural (1)
  LAYER_CONTAINER = 'layer.container',
}

/**
 * Type guard to check if a string is a valid NodeType
 */
export function isValidNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && Object.values(NodeType).includes(value as NodeType);
}
