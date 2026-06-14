import { describe, it, expect } from 'vitest';
import {
  LAYER_ORDER,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  layerColor,
  layerLabel,
  layerStandard,
  isLayerSlug,
  type LayerSlug,
} from '@/apps/embedded/ui/domain';
import specFixture from '../fixtures/spec.json';

/**
 * Derive the canonical layer order from the captured /api/spec fixture rather
 * than re-stating the source constant: each layer schema carries a
 * `layer.{id,number}` block (number 1..12). Sorting by `number` and mapping to
 * `id` reproduces the manifest order from real data, so this test actively
 * guards against drift between the code's LAYER_ORDER and the live spec.
 */
function layerOrderFromSpec(): string[] {
  const schemas = (specFixture as { schemas: Record<string, { layer?: { id: string; number: number } }> })
    .schemas;
  return Object.values(schemas)
    .map((s) => s.layer)
    .filter((l): l is { id: string; number: number } => !!l)
    .sort((a, b) => a.number - b.number)
    .map((l) => l.id);
}

describe('LAYER_ORDER', () => {
  it('has exactly 12 layers', () => {
    expect(LAYER_ORDER).toHaveLength(12);
  });
  it('matches the spec manifest order derived from the /api/spec fixture', () => {
    const expected = layerOrderFromSpec();
    // sanity: the fixture really yields 12 distinctly-numbered layers
    expect(expected).toHaveLength(12);
    expect(LAYER_ORDER).toEqual(expected);
  });
  it('has no duplicates', () => {
    expect(new Set(LAYER_ORDER).size).toBe(LAYER_ORDER.length);
  });
});

describe('layerColor', () => {
  it('returns a distinct hex color for every one of the 12 slugs', () => {
    const colors = LAYER_ORDER.map((slug) => layerColor(slug));
    for (const c of colors) expect(c).toMatch(/^#[0-9A-F]{6}$/i);
    expect(new Set(colors).size).toBe(12); // all distinct
  });

  it.each(LAYER_ORDER)('layerColor(%s) === DOMAIN_COLORS[%s]', (slug) => {
    expect(layerColor(slug)).toBe(DOMAIN_COLORS[slug as LayerSlug]);
  });

  it('falls back to gray for unknown/empty/null slugs', () => {
    expect(layerColor('not-a-layer')).toBe('#6B7280');
    expect(layerColor(null)).toBe('#6B7280');
    expect(layerColor(undefined)).toBe('#6B7280');
  });
});

describe('layerLabel', () => {
  it.each(LAYER_ORDER)('layerLabel(%s) === DOMAIN_LABELS[%s]', (slug) => {
    expect(layerLabel(slug)).toBe(DOMAIN_LABELS[slug as LayerSlug]);
  });

  it('renders the known special-case labels', () => {
    expect(layerLabel('data-model')).toBe('Data Model');
    expect(layerLabel('api')).toBe('API');
    expect(layerLabel('ux')).toBe('UX');
    expect(layerLabel('apm')).toBe('APM');
  });

  it('title-cases an unknown hyphenated slug as a fallback', () => {
    expect(layerLabel('some-other-layer')).toBe('Some Other Layer');
  });

  it('returns empty string for null/undefined', () => {
    expect(layerLabel(null)).toBe('');
    expect(layerLabel(undefined)).toBe('');
  });
});

describe('layerStandard', () => {
  it('resolves the inspiring standard for a known slug', () => {
    expect(layerStandard('api')).toBe('OpenAPI 3.0');
    expect(layerStandard('data-model')).toBe('JSON Schema Draft 7');
  });
  it('returns empty string for unknown slugs', () => {
    expect(layerStandard('nope')).toBe('');
    expect(layerStandard(null)).toBe('');
  });
});

describe('isLayerSlug', () => {
  it('narrows valid slugs and rejects unknown ones', () => {
    expect(isLayerSlug('motivation')).toBe(true);
    expect(isLayerSlug('data-model')).toBe(true);
    expect(isLayerSlug('not-a-layer')).toBe(false);
  });
});
