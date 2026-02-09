/**
 * Unit Tests for Story Error Filtering
 *
 * Tests that the error filtering logic correctly identifies expected vs unexpected errors.
 * Each filter is tested for:
 * 1. Matching intended errors (positive cases)
 * 2. NOT matching similar but different errors (negative cases)
 */

import { test, expect } from '@playwright/test';
import { isExpectedConsoleError } from '../../tests/stories/storyErrorFilters';

test.describe('Story Error Filtering', () => {
  test.describe('DevTools Filter', () => {
    test('should match React DevTools installation prompt', () => {
      const error = 'Download the React DevTools for a better development experience';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should NOT match unrelated DevTools message', () => {
      const error = 'Check the DevTools console for more info';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('DataLoader Backend Connection Filter', () => {
    test('should match port 3002 connection refused', () => {
      const error = 'ECONNREFUSED: connection refused 127.0.0.1:3002';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match various ECONNREFUSED port 3002 formats', () => {
      expect(isExpectedConsoleError('ECONNREFUSED localhost:3002')).toBe(true);
      expect(isExpectedConsoleError('ECONNREFUSED: 127.0.0.1:3002 ECONNREFUSED')).toBe(true);
    });

    test('should NOT match other port connection errors', () => {
      const error = 'ECONNREFUSED: connection refused localhost:5000';
      expect(isExpectedConsoleError(error)).toBe(false);
    });

    test('should NOT match generic ECONNREFUSED without port', () => {
      const error = 'ECONNREFUSED somewhere';
      expect(isExpectedConsoleError(error)).toBe(false);
    });

    test('should match DataLoader model fetch failure', () => {
      const error = '[DataLoader] Failed to fetch model: 404 Not Found';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match DataLoader error prefix', () => {
      const error = '[DataLoader] Failed to fetch model from /api/models';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should NOT match unrelated fetch failures', () => {
      const error = 'Failed to fetch /api/users: 404';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('React Prop Validation Filter', () => {
    test('should match React unknown prop warnings', () => {
      const error = 'React does not recognize the `data-custom` prop on a DOM element';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match various prop validation messages', () => {
      expect(isExpectedConsoleError('React does not recognize the `unknownProp` prop')).toBe(true);
      expect(isExpectedConsoleError('React does not recognize the `custom-attr` prop on a div')).toBe(true);
    });

    test('should NOT match unrelated React messages', () => {
      const error = 'React element is missing required prop';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('SVG Attribute Filter', () => {
    test('should match SVG path attribute errors', () => {
      const error = 'Invalid value for <path> attribute d="undefined"';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match various SVG elements', () => {
      expect(isExpectedConsoleError('Invalid value for <circle> attribute r')).toBe(true);
      expect(isExpectedConsoleError('Invalid value for <rect> attribute width')).toBe(true);
      expect(isExpectedConsoleError('Invalid value for <line> attribute x1')).toBe(true);
    });

    test('should match path attribute numeric errors', () => {
      const error = '<path> attribute d: Expected number, "undefined"';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match svg viewBox numeric errors', () => {
      const error = '<svg> attribute viewBox: Expected number, got "undefined 100 200 300"';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should NOT match non-SVG attribute errors', () => {
      const error = 'Invalid value for HTML attribute class';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('Unrecognized HTML Tag Filter', () => {
    test('should match unrecognized tag warning', () => {
      const error = 'The tag <custom-element> is unrecognized in this browser';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match various custom tag formats', () => {
      expect(isExpectedConsoleError('The tag <my-component> is unrecognized')).toBe(true);
      expect(isExpectedConsoleError('The tag <foo-bar-baz> is unrecognized in this browser')).toBe(true);
    });

    test('should NOT match other unrecognized errors', () => {
      const error = 'Unrecognized element type: custom';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('React Flow Node Connection Filter', () => {
    test('should match source node errors', () => {
      const error = 'source/target node with id node-123 not found';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match handle errors', () => {
      const error = 'source/target handle with id connection-1 not found';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should NOT match similar but different errors', () => {
      const error = 'Node source connection failed';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('WebSocket Error Filter', () => {
    test('should match WebSocket connection failures', () => {
      const error = 'WebSocket connection to ws://localhost:3002 failed';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match various WebSocket URLs', () => {
      expect(isExpectedConsoleError('WebSocket connection to ws://localhost:8080 failed')).toBe(true);
      expect(isExpectedConsoleError('WebSocket connection to wss://api.example.com/ws failed')).toBe(true);
    });

    test('should NOT match WebSocket prefix messages without connection failure', () => {
      const error = '[WebSocket] Connection timeout after 5000ms';
      expect(isExpectedConsoleError(error)).toBe(false);
    });

    test('should NOT match unrelated WebSocket errors', () => {
      const error = 'WebSocket message failed to parse';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('EmbeddedLayout Component Filter', () => {
    test('should match specific EmbeddedLayout warnings', () => {
      expect(isExpectedConsoleError('[EmbeddedLayout] No container found')).toBe(true);
      expect(isExpectedConsoleError('[EmbeddedLayout] Missing required props')).toBe(true);
      expect(isExpectedConsoleError('[EmbeddedLayout] Layout calculation error')).toBe(true);
    });

    test('should NOT match generic EmbeddedLayout messages', () => {
      expect(isExpectedConsoleError('[EmbeddedLayout] Model loading failed')).toBe(false);
      expect(isExpectedConsoleError('[EmbeddedLayout] Unexpected prop type')).toBe(false);
    });

    test('should NOT match unrelated layout errors', () => {
      const error = 'Layout calculation failed';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('ModelRoute Error Filter', () => {
    test('should match model loading errors', () => {
      const error = '[ModelRoute] Error loading model: YAML parse failed';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match various ModelRoute errors', () => {
      expect(isExpectedConsoleError('[ModelRoute] Error loading model: 404')).toBe(true);
      expect(isExpectedConsoleError('[ModelRoute] Error loading model: Network timeout')).toBe(true);
    });

    test('should NOT match unrelated route errors', () => {
      const error = 'Route error: model not found';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('Failed Resource Load Filter', () => {
    test('should match failed resource loads from known test ports', () => {
      expect(isExpectedConsoleError('Failed to load resource: localhost:3002/api/model')).toBe(true);
      expect(isExpectedConsoleError('Failed to load resource: localhost:8765/ws')).toBe(true);
    });

    test('should NOT match failed resource loads from unknown ports', () => {
      expect(isExpectedConsoleError('Failed to load resource: the server responded with a status of 404')).toBe(false);
      expect(isExpectedConsoleError('Failed to load resource: net::ERR_CONNECTION_REFUSED')).toBe(false);
    });

    test('should NOT match other failures', () => {
      const error = 'Failed to process resource';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('Server 500 Error Filter', () => {
    test('should match 500 status errors', () => {
      expect(isExpectedConsoleError('the server responded with a status of 500')).toBe(true);
      expect(isExpectedConsoleError('the server responded with a status of 502')).toBe(true);
      expect(isExpectedConsoleError('the server responded with a status of 503')).toBe(true);
    });

    test('should NOT match 400 status errors', () => {
      expect(isExpectedConsoleError('the server responded with a status of 400')).toBe(false);
      expect(isExpectedConsoleError('the server responded with a status of 404')).toBe(false);
    });
  });

  test.describe('Warning Prefix Filter', () => {
    test('should match generic warnings', () => {
      const error = 'Warning: React version mismatch';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should match various warning types', () => {
      expect(isExpectedConsoleError('Warning: deprecated API used')).toBe(true);
      expect(isExpectedConsoleError('Warning: Expected error')).toBe(true);
    });

    test('should NOT match errors without warning prefix', () => {
      const error = 'Error: React version mismatch';
      expect(isExpectedConsoleError(error)).toBe(false);
    });

    test('should NOT match warnings in the middle of text', () => {
      const error = 'This is a warning: something';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('Filter Specificity - No Overly Broad Matches', () => {
    test('should NOT match generic "Warning:" without prefix check', () => {
      // This would match if filter was too broad like includes('Warning:')
      const error = 'Error: Warning: nested message';
      expect(isExpectedConsoleError(error)).toBe(false);
    });

    test('should NOT match generic "500" errors without API context', () => {
      const error = 'Error: 500 Internal Server Error';
      expect(isExpectedConsoleError(error)).toBe(false);
    });

    test('should NOT match generic "connection" errors', () => {
      const error = 'Connection failed';
      expect(isExpectedConsoleError(error)).toBe(false);
    });

    test('should NOT match generic "WebSocket" prefix', () => {
      const error = '[WebSocket] some random error';
      expect(isExpectedConsoleError(error)).toBe(false);
    });

    test('should NOT match overly broad "WebSocket" match', () => {
      const error = 'WebSocket message handler error';
      expect(isExpectedConsoleError(error)).toBe(false);
    });

    test('should NOT match non-port-specific ECONNREFUSED', () => {
      const error = 'ECONNREFUSED to database server';
      expect(isExpectedConsoleError(error)).toBe(false);
    });
  });

  test.describe('Filter Accuracy - Expected Errors Are Caught', () => {
    test('should catch all documented filter patterns', () => {
      const expectedErrors = [
        'Download the React DevTools for better development',
        'ECONNREFUSED localhost:3002',
        '[DataLoader] Failed to fetch model',
        'React does not recognize the `customAttr` prop',
        'Invalid value for <path> attribute d',
        '<svg> attribute viewBox: Expected number',
        'The tag <custom> is unrecognized',
        'source/target node not found',
        'WebSocket connection to ws://localhost failed',
        '[EmbeddedLayout] No container found',
        '[ModelRoute] Error loading model',
        'Failed to load resource: localhost:3002/api',
        'Warning: deprecated API',
        'the server responded with a status of 500'
      ];

      const unmatchedErrors = expectedErrors.filter(error => !isExpectedConsoleError(error));

      expect(
        unmatchedErrors.length,
        `These expected errors were not caught: ${unmatchedErrors.join(', ')}`
      ).toBe(0);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle empty string', () => {
      expect(isExpectedConsoleError('')).toBe(false);
    });

    test('should handle case-sensitive matching', () => {
      // These should NOT match because pattern is case-sensitive for critical parts
      expect(isExpectedConsoleError('download the react devtools')).toBe(false);
      expect(isExpectedConsoleError('DataLoader failed to fetch model')).toBe(false);
    });

    test('should handle multiline error messages', () => {
      const error = 'WebSocket connection to ws://localhost:3002 failed\nError code: 1006';
      expect(isExpectedConsoleError(error)).toBe(true);
    });

    test('should handle error messages with special characters', () => {
      const error = '[DataLoader] Failed to fetch model: "404" Not Found';
      expect(isExpectedConsoleError(error)).toBe(true);
    });
  });
});
