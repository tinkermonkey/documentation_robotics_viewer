/**
 * 12-layer domain palette + helpers.
 *
 * The slug -> hex map mirrors the design's `graph-node[data-domain=...]` swatch
 * rules (see design HTML lines ~25-50). Heimdall's compiled CSS only colors its
 * demo domains, so the DR domain colors ship in `domain-and-nav.css` AND here so
 * inline swatches (page header, inspector) can resolve a hex by slug.
 */

export type LayerSlug =
  | 'motivation'
  | 'business'
  | 'security'
  | 'application'
  | 'technology'
  | 'api'
  | 'data-model'
  | 'data-store'
  | 'ux'
  | 'navigation'
  | 'apm'
  | 'testing';

/** Ordered list of the 12 layers (matches the spec manifest layer order). */
export const LAYER_ORDER: LayerSlug[] = [
  'motivation',
  'business',
  'security',
  'application',
  'technology',
  'api',
  'data-model',
  'data-store',
  'ux',
  'navigation',
  'apm',
  'testing',
];

/** slug -> hex color (verbatim from the design's domain palette). */
export const DOMAIN_COLORS: Record<LayerSlug, string> = {
  motivation: '#8B5CF6',
  business: '#F59E0B',
  security: '#F43F5E',
  application: '#818CF8',
  technology: '#22D3EE',
  api: '#10B981',
  'data-model': '#2DD4BF',
  'data-store': '#38BDF8',
  ux: '#F472B6',
  navigation: '#A78BFA',
  apm: '#FB923C',
  testing: '#4ADE80',
};

/** Human-readable label per layer (e.g. 'data-model' -> 'Data Model'). */
export const DOMAIN_LABELS: Record<LayerSlug, string> = {
  motivation: 'Motivation',
  business: 'Business',
  security: 'Security',
  application: 'Application',
  technology: 'Technology',
  api: 'API',
  'data-model': 'Data Model',
  'data-store': 'Data Store',
  ux: 'UX',
  navigation: 'Navigation',
  apm: 'APM',
  testing: 'Testing',
};

/** Standard each layer is inspired by (sourced from /api/spec, used as a fallback). */
export const DOMAIN_STANDARDS: Record<LayerSlug, string> = {
  motivation: 'ArchiMate 3.2',
  business: 'ArchiMate 3.2',
  security: 'NIST SP 800-53',
  application: 'ArchiMate 3.2',
  technology: 'ArchiMate 3.2',
  api: 'OpenAPI 3.0',
  'data-model': 'JSON Schema Draft 7',
  'data-store': 'ISO/IEC 9075 (SQL)',
  ux: 'HTML 5.3',
  navigation: 'SPA Navigation Patterns',
  apm: 'OpenTelemetry',
  testing: 'IEEE 829-2008',
};

const COLOR_FALLBACK = '#6B7280';

export function isLayerSlug(value: string): value is LayerSlug {
  return value in DOMAIN_COLORS;
}

/** Resolve a layer hex color by slug (gray fallback for unknown slugs). */
export function layerColor(slug: string | null | undefined): string {
  if (slug && isLayerSlug(slug)) return DOMAIN_COLORS[slug];
  return COLOR_FALLBACK;
}

/** Resolve a human-readable layer label by slug. */
export function layerLabel(slug: string | null | undefined): string {
  if (slug && isLayerSlug(slug)) return DOMAIN_LABELS[slug];
  if (!slug) return '';
  // Fallback: title-case the slug words.
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Resolve the inspiring standard label by slug (empty string for unknown). */
export function layerStandard(slug: string | null | undefined): string {
  if (slug && isLayerSlug(slug)) return DOMAIN_STANDARDS[slug];
  return '';
}
