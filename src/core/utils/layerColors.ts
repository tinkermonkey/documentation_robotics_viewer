/**
 * Layer color and display name utilities
 *
 * Centralized mapping for consistent layer visualization across the application.
 * Single source of truth for all layer colors matching design.png reference palette.
 */

import { LayerType } from '../types/layers';

/**
 * Fallback color used when layer type is not recognized
 * Gray-400 from Tailwind CSS palette
 */
export const FALLBACK_COLOR = '#9ca3af';

/**
 * Type guard to validate LayerType enum values
 */
const isValidLayerType = (value: unknown): value is LayerType => {
  return Object.values(LayerType).includes(value as LayerType);
};

/**
 * Layer color configuration with variants for different UI contexts
 */
export interface LayerColorConfig {
  /** Primary color for node fills and badges */
  primary: string;
  /** Light color for backgrounds and hover states */
  light: string;
  /** Dark color for borders and text */
  dark: string;
  /** Accessible text color on primary background */
  text: string;
}

/**
 * Unified layer color system matching design.png reference palette
 * Single source of truth for all layer visualizations
 */
export const LAYER_COLORS: Record<LayerType, LayerColorConfig> = {
  [LayerType.Motivation]: {
    primary: '#9333ea',   // Purple
    light: '#f3e8ff',
    dark: '#6b21a8',
    text: '#ffffff'
  },
  [LayerType.Business]: {
    primary: '#3b82f6',   // Blue
    light: '#dbeafe',
    dark: '#1e40af',
    text: '#ffffff'
  },
  [LayerType.Security]: {
    primary: '#ec4899',   // Pink
    light: '#fce7f3',
    dark: '#be185d',
    text: '#ffffff'
  },
  [LayerType.Application]: {
    primary: '#10b981',   // Green
    light: '#d1fae5',
    dark: '#047857',
    text: '#ffffff'
  },
  [LayerType.Technology]: {
    primary: '#ef4444',   // Red
    light: '#fee2e2',
    dark: '#b91c1c',
    text: '#ffffff'
  },
  [LayerType.Api]: {
    primary: '#f59e0b',   // Orange
    light: '#fef3c7',
    dark: '#d97706',
    text: '#000000'
  },
  [LayerType.DataModel]: {
    primary: '#8b5cf6',   // Violet
    light: '#ede9fe',
    dark: '#6d28d9',
    text: '#ffffff'
  },
  [LayerType.Datastore]: {
    primary: '#f97316',   // Deep Orange
    light: '#ffedd5',
    dark: '#c2410c',
    text: '#ffffff'
  },
  [LayerType.Ux]: {
    primary: '#14b8a6',   // Teal
    light: '#ccfbf1',
    dark: '#0f766e',
    text: '#ffffff'
  },
  [LayerType.Navigation]: {
    primary: '#06b6d4',   // Cyan
    light: '#cffafe',
    dark: '#0891b2',
    text: '#ffffff'
  },
  [LayerType.ApmObservability]: {
    primary: '#84cc16',   // Lime
    light: '#ecfccb',
    dark: '#4d7c0f',
    text: '#000000'
  },
  [LayerType.FederatedArchitecture]: {
    primary: '#6366f1',   // Indigo
    light: '#e0e7ff',
    dark: '#4338ca',
    text: '#ffffff'
  }
};

/**
 * Layer display name mapping
 */
export const LAYER_DISPLAY_NAMES: Record<string, string> = {
  [LayerType.Motivation]: 'Motivation',
  [LayerType.Business]: 'Business',
  [LayerType.Security]: 'Security',
  [LayerType.Application]: 'Application',
  [LayerType.Technology]: 'Technology',
  [LayerType.Api]: 'API',
  [LayerType.DataModel]: 'Data Model',
  [LayerType.Datastore]: 'Data Store',
  [LayerType.Ux]: 'UX',
  [LayerType.Navigation]: 'Navigation',
  [LayerType.ApmObservability]: 'APM',
  [LayerType.FederatedArchitecture]: 'Federated Architecture',

  // Legacy lowercase aliases for backward compatibility
  motivation: 'Motivation',
  business: 'Business',
  application: 'Application',
  data_model: 'Data Model',
  dataModel: 'Data Model',
  security: 'Security',
  api: 'API',
  ux: 'UX',
  technology: 'Technology',
  navigation: 'Navigation',
  apm: 'APM',
};

/**
 * Normalize layer key to LayerType enum value
 * Handles lowercase, PascalCase, snake_case, and enum inputs
 *
 * @param key - Layer identifier in any format
 * @returns Normalized LayerType or null if not found
 */
export function normalizeLayerKey(key: string): LayerType | null {
  // If already a valid LayerType, return it
  if (isValidLayerType(key)) {
    return key;
  }

  // Normalize to lowercase and remove special characters
  const normalized = key.toLowerCase().replace(/[-_\s]/g, '');

  // Mapping table
  const mapping: Record<string, LayerType> = {
    'motivation': LayerType.Motivation,
    'business': LayerType.Business,
    'security': LayerType.Security,
    'application': LayerType.Application,
    'technology': LayerType.Technology,
    'api': LayerType.Api,
    'datamodel': LayerType.DataModel,
    'datastore': LayerType.Datastore,
    'ux': LayerType.Ux,
    'navigation': LayerType.Navigation,
    'apm': LayerType.ApmObservability,
    'apmobservability': LayerType.ApmObservability,
    'federatedarchitecture': LayerType.FederatedArchitecture,
  };

  return mapping[normalized] || null;
}

/**
 * Get layer color for a specific variant
 *
 * @param layer - Layer identifier (supports any format via normalization)
 * @param variant - Color variant to retrieve
 * @returns Hex color string
 */
export function getLayerColor(
  layer: string | LayerType,
  variant: 'primary' | 'light' | 'dark' | 'text' = 'primary'
): string {
  const layerType = typeof layer === 'string' ? normalizeLayerKey(layer) : layer;

  if (!layerType || !LAYER_COLORS[layerType]) {
    return FALLBACK_COLOR;
  }

  return LAYER_COLORS[layerType][variant];
}

/**
 * Get the display name for a given layer
 * @param layer Layer identifier
 * @returns Human-readable layer name
 */
export function getLayerDisplayName(layer: string): string {
  const layerType = normalizeLayerKey(layer);
  if (layerType) {
    return LAYER_DISPLAY_NAMES[layerType] || layer;
  }
  return LAYER_DISPLAY_NAMES[layer] || layer;
}
