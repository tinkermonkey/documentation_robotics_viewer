/**
 * Layer color and display name utilities
 *
 * Centralized mapping for consistent layer visualization across the application
 */

/**
 * Layer color mapping for cross-layer visualization
 */
export const LAYER_COLORS: Record<string, string> = {
  motivation: '#9b59b6',
  business: '#3498db',
  application: '#3498db',
  data_model: '#2ecc71',
  dataModel: '#2ecc71',
  security: '#e74c3c',
  api: '#f39c12',
  ux: '#1abc9c',
  technology: '#95a5a6',
  navigation: '#16a085',
  apm: '#d35400',
};

/**
 * Layer display name mapping
 */
export const LAYER_DISPLAY_NAMES: Record<string, string> = {
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
 * Get the color for a given layer
 * @param layer Layer identifier
 * @returns Hex color string
 */
export function getLayerColor(layer: string): string {
  return LAYER_COLORS[layer] || '#999999';
}

/**
 * Get the display name for a given layer
 * @param layer Layer identifier
 * @returns Human-readable layer name
 */
export function getLayerDisplayName(layer: string): string {
  return LAYER_DISPLAY_NAMES[layer] || layer;
}
