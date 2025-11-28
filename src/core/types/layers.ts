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
