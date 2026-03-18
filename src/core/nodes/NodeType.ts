/**
 * NodeType Enum
 *
 * Defines all node types across the architecture layers.
 * Maps to JSON configuration for styling, dimensions, and layout.
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

  // Technology layer (1)
  TECHNOLOGY_SYSTEM_SOFTWARE = 'technology.systemsoftware',

  // API layer (2)
  API_OPERATION = 'api.operation',
  API_SECURITY_SCHEME = 'api.securityscheme',

  // Data layer (3)
  DATA_JSON_SCHEMA = 'data.jsonSchema',
  DATA_MODEL = 'data.model',
  DATA_OBJECT_SCHEMA = 'data.objectschema',

  // Data Store layer (2)
  DATASTORE_COLLECTION = 'datastore.collection',
  DATASTORE_DATABASE = 'datastore.database',

  // UX layer (3)
  UX_APPLICATION = 'ux.uxapplication',
  UX_VIEW = 'ux.view',
  UX_LIBRARY_COMPONENT = 'ux.librarycomponent',

  // Navigation layer (4)
  NAVIGATION_GRAPH = 'navigation.navigationgraph',
  NAVIGATION_ROUTE = 'navigation.route',
  NAVIGATION_GUARD = 'navigation.navigationguard',
  NAVIGATION_FLOW = 'navigation.navigationflow',

  // APM layer (3)
  APM_INSTRUMENTATION_CONFIG = 'apm.instrumentationconfig',
  APM_LOG_CONFIGURATION = 'apm.logconfiguration',
  APM_EXPORTER_CONFIG = 'apm.exporterconfig',

  // Testing layer (5)
  TESTING_COVERAGE_MODEL = 'testing.testcoveragemodel',
  TESTING_COVERAGE_TARGET = 'testing.testcoveragetarget',
  TESTING_COVERAGE_REQUIREMENT = 'testing.coveragerequirement',
  TESTING_COVERAGE_SUMMARY = 'testing.coveragesummary',
  TESTING_ENVIRONMENT_FACTOR = 'testing.environmentfactor',

  // Structural (1)
  LAYER_CONTAINER = 'layer.container',
}

/**
 * Type guard to check if a string is a valid NodeType
 */
export function isValidNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && Object.values(NodeType).includes(value as NodeType);
}
