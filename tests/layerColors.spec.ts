/**
 * Unit Tests for Layer Color Utilities
 * Tests the unified layer color system including normalization and color variant retrieval
 */

import { test, expect } from '@playwright/test';
import {
  normalizeLayerKey,
  getLayerColor,
  FALLBACK_COLOR,
  LAYER_COLORS
} from '../src/core/utils/layerColors';
import { LayerType } from '../src/core/types/layers';

test.describe('normalizeLayerKey', () => {
  test.describe('enum values', () => {
    test('should return LayerType enum values as-is', () => {
      expect(normalizeLayerKey(LayerType.Business)).toBe(LayerType.Business);
      expect(normalizeLayerKey(LayerType.Application)).toBe(LayerType.Application);
      expect(normalizeLayerKey(LayerType.Api)).toBe(LayerType.Api);
    });
  });

  test.describe('lowercase inputs', () => {
    test('should normalize lowercase layer names', () => {
      expect(normalizeLayerKey('motivation')).toBe(LayerType.Motivation);
      expect(normalizeLayerKey('business')).toBe(LayerType.Business);
      expect(normalizeLayerKey('security')).toBe(LayerType.Security);
      expect(normalizeLayerKey('application')).toBe(LayerType.Application);
      expect(normalizeLayerKey('technology')).toBe(LayerType.Technology);
      expect(normalizeLayerKey('api')).toBe(LayerType.Api);
      expect(normalizeLayerKey('ux')).toBe(LayerType.Ux);
      expect(normalizeLayerKey('navigation')).toBe(LayerType.Navigation);
      expect(normalizeLayerKey('apm')).toBe(LayerType.ApmObservability);
    });
  });

  test.describe('PascalCase inputs', () => {
    test('should normalize PascalCase layer names', () => {
      expect(normalizeLayerKey('Motivation')).toBe(LayerType.Motivation);
      expect(normalizeLayerKey('Business')).toBe(LayerType.Business);
      expect(normalizeLayerKey('DataModel')).toBe(LayerType.DataModel);
      expect(normalizeLayerKey('FederatedArchitecture')).toBe(LayerType.FederatedArchitecture);
    });
  });

  test.describe('snake_case inputs', () => {
    test('should normalize snake_case layer names', () => {
      expect(normalizeLayerKey('data_model')).toBe(LayerType.DataModel);
      expect(normalizeLayerKey('federated_architecture')).toBe(LayerType.FederatedArchitecture);
      expect(normalizeLayerKey('apm_observability')).toBe(LayerType.ApmObservability);
    });
  });

  test.describe('kebab-case inputs', () => {
    test('should normalize kebab-case layer names', () => {
      expect(normalizeLayerKey('data-model')).toBe(LayerType.DataModel);
      expect(normalizeLayerKey('federated-architecture')).toBe(LayerType.FederatedArchitecture);
      expect(normalizeLayerKey('apm-observability')).toBe(LayerType.ApmObservability);
    });
  });

  test.describe('mixed case with spaces', () => {
    test('should normalize layer names with spaces', () => {
      expect(normalizeLayerKey('Data Model')).toBe(LayerType.DataModel);
      expect(normalizeLayerKey('Federated Architecture')).toBe(LayerType.FederatedArchitecture);
    });
  });

  test.describe('invalid inputs', () => {
    test('should return null for unrecognized layer names', () => {
      expect(normalizeLayerKey('invalid_layer')).toBeNull();
      expect(normalizeLayerKey('NonExistentLayer')).toBeNull();
      expect(normalizeLayerKey('')).toBeNull();
      expect(normalizeLayerKey('random-text')).toBeNull();
    });
  });

  test.describe('all layer types', () => {
    test('should handle all 12 layer types', () => {
      const allLayers = [
        'Motivation',
        'Business',
        'Security',
        'Application',
        'Technology',
        'Api',
        'DataModel',
        'Datastore',
        'Ux',
        'Navigation',
        'ApmObservability',
        'FederatedArchitecture'
      ];

      allLayers.forEach(layer => {
        const normalized = normalizeLayerKey(layer);
        expect(normalized).not.toBeNull();
        expect(Object.values(LayerType)).toContain(normalized);
      });
    });
  });
});

test.describe('getLayerColor', () => {
  test.describe('color variants', () => {
    test('should return primary color by default', () => {
      const primaryColor = getLayerColor(LayerType.Business);
      expect(primaryColor).toBe(LAYER_COLORS[LayerType.Business].primary);
      expect(primaryColor).toBe('#3b82f6');
    });

    test('should return correct color variants', () => {
      expect(getLayerColor(LayerType.Business, 'primary')).toBe('#3b82f6');
      expect(getLayerColor(LayerType.Business, 'light')).toBe('#dbeafe');
      expect(getLayerColor(LayerType.Business, 'dark')).toBe('#1e40af');
      expect(getLayerColor(LayerType.Business, 'text')).toBe('#ffffff');
    });

    test('should return correct colors for all layer types', () => {
      expect(getLayerColor(LayerType.Motivation, 'primary')).toBe('#9333ea');
      expect(getLayerColor(LayerType.Security, 'primary')).toBe('#ec4899');
      expect(getLayerColor(LayerType.Application, 'primary')).toBe('#10b981');
      expect(getLayerColor(LayerType.Technology, 'primary')).toBe('#ef4444');
      expect(getLayerColor(LayerType.Api, 'primary')).toBe('#f59e0b');
      expect(getLayerColor(LayerType.DataModel, 'primary')).toBe('#8b5cf6');
      expect(getLayerColor(LayerType.Datastore, 'primary')).toBe('#f97316');
      expect(getLayerColor(LayerType.Ux, 'primary')).toBe('#14b8a6');
      expect(getLayerColor(LayerType.Navigation, 'primary')).toBe('#06b6d4');
      expect(getLayerColor(LayerType.ApmObservability, 'primary')).toBe('#84cc16');
      expect(getLayerColor(LayerType.FederatedArchitecture, 'primary')).toBe('#6366f1');
    });
  });

  test.describe('string inputs with normalization', () => {
    test('should normalize lowercase string inputs', () => {
      expect(getLayerColor('business', 'primary')).toBe('#3b82f6');
      expect(getLayerColor('application', 'primary')).toBe('#10b981');
      expect(getLayerColor('api', 'primary')).toBe('#f59e0b');
    });

    test('should normalize PascalCase string inputs', () => {
      expect(getLayerColor('Business', 'primary')).toBe('#3b82f6');
      expect(getLayerColor('DataModel', 'primary')).toBe('#8b5cf6');
    });

    test('should normalize snake_case string inputs', () => {
      expect(getLayerColor('data_model', 'primary')).toBe('#8b5cf6');
      expect(getLayerColor('federated_architecture', 'primary')).toBe('#6366f1');
    });

    test('should normalize kebab-case string inputs', () => {
      expect(getLayerColor('data-model', 'primary')).toBe('#8b5cf6');
      expect(getLayerColor('apm-observability', 'primary')).toBe('#84cc16');
    });
  });

  test.describe('fallback behavior', () => {
    test('should return fallback color for invalid layer names', () => {
      expect(getLayerColor('invalid_layer')).toBe(FALLBACK_COLOR);
      expect(getLayerColor('NonExistentLayer')).toBe(FALLBACK_COLOR);
      expect(getLayerColor('')).toBe(FALLBACK_COLOR);
    });

    test('should return fallback color for null normalized values', () => {
      expect(getLayerColor('random-text', 'primary')).toBe(FALLBACK_COLOR);
      expect(getLayerColor('unknown', 'light')).toBe(FALLBACK_COLOR);
      expect(getLayerColor('xyz', 'dark')).toBe(FALLBACK_COLOR);
    });
  });

  test.describe('color consistency', () => {
    test('should return hex color codes', () => {
      const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

      Object.values(LayerType).forEach(layerType => {
        expect(getLayerColor(layerType, 'primary')).toMatch(hexColorPattern);
        expect(getLayerColor(layerType, 'light')).toMatch(hexColorPattern);
        expect(getLayerColor(layerType, 'dark')).toMatch(hexColorPattern);
        expect(getLayerColor(layerType, 'text')).toMatch(hexColorPattern);
      });
    });

    test('should have all required variants for each layer', () => {
      Object.values(LayerType).forEach(layerType => {
        const config = LAYER_COLORS[layerType];
        expect(config.primary).toBeDefined();
        expect(config.light).toBeDefined();
        expect(config.dark).toBeDefined();
        expect(config.text).toBeDefined();
      });
    });
  });

  test.describe('accessibility', () => {
    test('should use white text for dark backgrounds', () => {
      // Layers with dark primary colors should have white text
      expect(getLayerColor(LayerType.Business, 'text')).toBe('#ffffff');
      expect(getLayerColor(LayerType.Security, 'text')).toBe('#ffffff');
      expect(getLayerColor(LayerType.Application, 'text')).toBe('#ffffff');
      expect(getLayerColor(LayerType.Technology, 'text')).toBe('#ffffff');
    });

    test('should use black text for light backgrounds', () => {
      // API and APM have lighter backgrounds and should use black text
      expect(getLayerColor(LayerType.Api, 'text')).toBe('#000000');
      expect(getLayerColor(LayerType.ApmObservability, 'text')).toBe('#000000');
    });
  });
});

test.describe('FALLBACK_COLOR constant', () => {
  test('should be a valid hex color', () => {
    expect(FALLBACK_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test('should be gray-400 from Tailwind palette', () => {
    expect(FALLBACK_COLOR).toBe('#9ca3af');
  });
});

test.describe('LAYER_COLORS completeness', () => {
  test('should have exactly 12 layer types', () => {
    expect(Object.keys(LAYER_COLORS).length).toBe(12);
  });

  test('should cover all LayerType enum values', () => {
    Object.values(LayerType).forEach(layerType => {
      expect(LAYER_COLORS[layerType]).toBeDefined();
    });
  });
});
