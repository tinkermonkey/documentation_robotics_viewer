/**
 * Layer types for the documentation robotics meta-model
 * Values must match the PascalCase names extracted from schema filenames
 */
export enum LayerType {
  Motivation = 'Motivation',
  Business = 'Business',
  Security = 'Security',
  Application = 'Application',
  Technology = 'Technology',
  Api = 'Api',
  DataModel = 'DataModel',
  Datastore = 'Datastore',
  Ux = 'Ux',
  Navigation = 'Navigation',
  ApmObservability = 'ApmObservability',
  Testing = 'Testing',
  FederatedArchitecture = 'FederatedArchitecture'
}

/**
 * Visual configuration for a layer
 */
export interface LayerVisualConfig {
  color: string;
  icon: string;
  opacity: number;
}

/**
 * State of a layer in the viewer
 */
export interface LayerState {
  visible: boolean;
  opacity: number;
  locked: boolean;
}

/**
 * Layer-specific data format
 */
export interface LayerData {
  format?: string;
  version?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Mapping of LayerType enum values to spec file names (.dr/spec/*.json)
 * These are the kebab-case file names used to fetch spec schemas.
 * The order matches the layer numbering in the spec.
 * Note: FederatedArchitecture is excluded as no corresponding spec file exists.
 */
export const SPEC_LAYER_NAMES: Record<Exclude<LayerType, typeof LayerType.FederatedArchitecture>, string> = {
  [LayerType.Motivation]: 'motivation',
  [LayerType.Business]: 'business',
  [LayerType.Security]: 'security',
  [LayerType.Application]: 'application',
  [LayerType.Technology]: 'technology',
  [LayerType.Api]: 'api',
  [LayerType.DataModel]: 'data-model',
  [LayerType.Datastore]: 'data-store',
  [LayerType.Ux]: 'ux',
  [LayerType.Navigation]: 'navigation',
  [LayerType.ApmObservability]: 'apm',
  [LayerType.Testing]: 'testing',
};

/**
 * Get all spec layer file names in spec order
 * @returns Array of spec file names without .json extension
 */
export function getSpecLayerNames(): string[] {
  return Object.values(SPEC_LAYER_NAMES);
}
