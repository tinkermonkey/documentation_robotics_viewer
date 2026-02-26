/**
 * Unit Tests for Story Error Filtering
 *
 * Tests the three-tier error classification:
 * 1. isExpectedConsoleError() - Truly expected errors (silently filtered)
 * 2. isKnownRenderingBug() - Known rendering bugs (soft-fail/warn)
 *
 * Each filter is tested for:
 * 1. Matching intended errors (positive cases)
 * 2. NOT matching similar but different errors (negative cases)
 */

import { test, expect } from '@playwright/test';
import { isExpectedConsoleError, isKnownRenderingBug } from '../../tests/stories/storyErrorFilters';

test.describe('Story Error Filtering', () => {
  test.describe('isExpectedConsoleError', () => {
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

      test('should match ECONNREFUSED port 3002 formats', () => {
        expect(isExpectedConsoleError('ECONNREFUSED localhost:3002')).toBe(true);
        expect(isExpectedConsoleError('ECONNREFUSED 127.0.0.1:3002')).toBe(true);
      });

      test('should match ECONNREFUSED port 8080 formats', () => {
        expect(isExpectedConsoleError('ECONNREFUSED localhost:8080')).toBe(true);
        expect(isExpectedConsoleError('ECONNREFUSED 127.0.0.1:8080')).toBe(true);
      });

      test('should NOT match other port connection errors', () => {
        const error = 'ECONNREFUSED: connection refused localhost:5000';
        expect(isExpectedConsoleError(error)).toBe(false);
      });

      test('should NOT match production URL errors', () => {
        const error = 'ECONNREFUSED api.example.com:3002';
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
      test('should match React unknown prop warnings with Warning prefix', () => {
        const error = 'Warning: React does not recognize the `data-custom` prop on a DOM element';
        expect(isExpectedConsoleError(error)).toBe(true);
      });

      test('should match various React warning prop validation messages', () => {
        expect(isExpectedConsoleError('Warning: React does not recognize the `unknownProp` prop')).toBe(true);
        expect(isExpectedConsoleError('Warning: React does not recognize the `custom-attr` prop on a div')).toBe(true);
      });

      test('should NOT match without Warning prefix', () => {
        const error = 'React does not recognize the `unknownProp` prop';
        expect(isExpectedConsoleError(error)).toBe(false);
      });

      test('should NOT match unrelated React messages', () => {
        const error = 'React element is missing required prop';
        expect(isExpectedConsoleError(error)).toBe(false);
      });
    });

    test.describe('SVG errors are NOT matched by isExpectedConsoleError', () => {
      test('should NOT match SVG path attribute errors (moved to isKnownRenderingBug)', () => {
        expect(isExpectedConsoleError('Invalid value for <path> attribute d="undefined"')).toBe(false);
        expect(isExpectedConsoleError('Invalid value for <circle> attribute r')).toBe(false);
      });

      test('should NOT match path attribute numeric errors (moved to isKnownRenderingBug)', () => {
        expect(isExpectedConsoleError('<path> attribute d: Expected number, "undefined"')).toBe(false);
      });

      test('should NOT match svg viewBox numeric errors (moved to isKnownRenderingBug)', () => {
        expect(isExpectedConsoleError('<svg> attribute viewBox: Expected number, got "undefined 100 200 300"')).toBe(false);
      });
    });

    test.describe('Unrecognized HTML Tag Filter', () => {
      test('should match unrecognized tag warning with proper format', () => {
        const error = 'The tag <custom-element> is unrecognized in this browser';
        expect(isExpectedConsoleError(error)).toBe(true);
      });

      test('should match custom tag names with hyphens', () => {
        expect(isExpectedConsoleError('The tag <my-component> is unrecognized')).toBe(true);
        expect(isExpectedConsoleError('The tag <foo-bar-baz> is unrecognized in this browser')).toBe(true);
      });

      test('should match placeholder tag names <%s>', () => {
        expect(isExpectedConsoleError('The tag <%s> is unrecognized')).toBe(true);
        expect(isExpectedConsoleError('The tag <%s> is unrecognized in this browser')).toBe(true);
      });

      test('should NOT match tags with spaces (malformed HTML)', () => {
        const error = 'The tag <my weird tag> is unrecognized';
        expect(isExpectedConsoleError(error)).toBe(false);
      });

      test('should NOT match other unrecognized errors', () => {
        const error = 'Unrecognized element type: custom';
        expect(isExpectedConsoleError(error)).toBe(false);
      });
    });

    test.describe('React Flow errors are NOT matched by isExpectedConsoleError', () => {
      test('should NOT match source node errors (moved to isKnownRenderingBug)', () => {
        expect(isExpectedConsoleError('source/target node with id node-123 not found')).toBe(false);
      });

      test('should NOT match handle errors (moved to isKnownRenderingBug)', () => {
        expect(isExpectedConsoleError('source/target handle with id connection-1 not found')).toBe(false);
      });
    });

    test.describe('WebSocket Error Filter', () => {
      test('should match WebSocket connection failures on localhost', () => {
        const error = 'WebSocket connection to ws://localhost:3002 failed';
        expect(isExpectedConsoleError(error)).toBe(true);
      });

      test('should match localhost WebSocket URLs', () => {
        expect(isExpectedConsoleError('WebSocket connection to ws://localhost:8080 failed')).toBe(true);
        expect(isExpectedConsoleError('WebSocket connection to ws://127.0.0.1:3002 failed')).toBe(true);
      });

      test('should NOT match production WebSocket URLs', () => {
        const error = 'WebSocket connection to wss://api.example.com/ws failed';
        expect(isExpectedConsoleError(error)).toBe(false);
      });

      test('should NOT match WebSocket prefix messages without connection failure', () => {
        const error = '[WebSocket] Connection timeout after 5000ms';
        expect(isExpectedConsoleError(error)).toBe(false);
      });

      test('should NOT match unrelated WebSocket errors', () => {
        const error = 'WebSocket message failed to parse';
        expect(isExpectedConsoleError(error)).toBe(false);
      });

      test('should match WebSocket not connected at start of message', () => {
        const error = 'WebSocket not connected';
        expect(isExpectedConsoleError(error)).toBe(true);
      });

      test('should NOT match WebSocket not connected in the middle of message', () => {
        const error = 'Error: The WebSocket not connected properly';
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
        expect(isExpectedConsoleError('Failed to load resource: localhost:8080/api/model')).toBe(true);
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
      test('should match 500 errors from localhost dev servers', () => {
        expect(isExpectedConsoleError('the server responded with a status of 500 at localhost:3002')).toBe(true);
        expect(isExpectedConsoleError('the server responded with a status of 502 at localhost:3002')).toBe(true);
        expect(isExpectedConsoleError('the server responded with a status of 500 at localhost:8080')).toBe(true);
        expect(isExpectedConsoleError('the server responded with a status of 502 at localhost:8080')).toBe(true);
      });

      test('should NOT match 500 errors without localhost context', () => {
        expect(isExpectedConsoleError('the server responded with a status of 500')).toBe(false);
        expect(isExpectedConsoleError('the server responded with a status of 503 at api.example.com')).toBe(false);
      });

      test('should NOT match 400 status errors', () => {
        expect(isExpectedConsoleError('the server responded with a status of 400 at localhost:3002')).toBe(false);
        expect(isExpectedConsoleError('the server responded with a status of 404 at localhost:3002')).toBe(false);
      });
    });

    test.describe('Warning Prefix Filter', () => {
      test('should match known React warnings', () => {
        const error = 'Warning: Received `false` for a boolean attribute `disabled`, instead of `true`';
        expect(isExpectedConsoleError(error)).toBe(true);
      });

      test('should match documented warning types', () => {
        expect(isExpectedConsoleError('Warning: componentWillReceiveProps has been renamed')).toBe(true);
        expect(isExpectedConsoleError('Warning: Unknown event handler property `onMyEvent`')).toBe(true);
      });

      test('should NOT match errors without warning prefix', () => {
        const error = 'Error: React version mismatch';
        expect(isExpectedConsoleError(error)).toBe(false);
      });

      test('should NOT match generic warnings (only specific documented ones)', () => {
        const error = 'Warning: deprecated API used';
        expect(isExpectedConsoleError(error)).toBe(false);
      });

      test('should NOT match warnings in the middle of text', () => {
        const error = 'This is a warning: something';
        expect(isExpectedConsoleError(error)).toBe(false);
      });
    });

    test.describe('Filter Specificity - No Overly Broad Matches', () => {
      test('should NOT match generic "Warning:" without prefix check', () => {
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
      test('should catch all documented expected filter patterns', () => {
        const expectedErrors = [
          'Download the React DevTools for better development',
          'ECONNREFUSED localhost:3002',
          'ECONNREFUSED 127.0.0.1:3002',
          '[DataLoader] Failed to fetch model',
          'Warning: React does not recognize the `customAttr` prop',
          'The tag <custom> is unrecognized',
          'WebSocket connection to ws://localhost:3002 failed',
          'WebSocket connection to ws://127.0.0.1:8080 failed',
          '[EmbeddedLayout] No container found',
          '[EmbeddedLayout] Missing required props',
          '[ModelRoute] Error loading model',
          'Failed to load resource: localhost:3002/api',
          'the server responded with a status of 500 at localhost:3002',
          'Warning: Received `false` instead of `true`',
          'Warning: componentWillReceiveProps has been renamed',
          '[RenderPropError] renderElement: Failed to render',
          'StoryLoadedWrapper: Timeout waiting for React Flow nodes',
          'Wrapper element: DIV',
          'Children count: 3',
          'Inner HTML (first 500 chars): <div>'
        ];

        const unmatchedErrors = expectedErrors.filter(error => !isExpectedConsoleError(error));

        expect(
          unmatchedErrors.length,
          `These expected errors were not caught: ${unmatchedErrors.join(', ')}`
        ).toBe(0);
      });
    });

    test.describe('RenderPropErrorBoundary Error Filter', () => {
      test('should match RenderPropError prefix', () => {
        expect(isExpectedConsoleError('[RenderPropError] renderElement: Failed to render')).toBe(true);
      });

      test('should match various RenderPropError messages', () => {
        expect(isExpectedConsoleError('[RenderPropError] renderFilters: Failed to load filters')).toBe(true);
        expect(isExpectedConsoleError('[RenderPropError] renderComparison: Cannot compare elements')).toBe(true);
      });

      test('should NOT match similar but different errors', () => {
        expect(isExpectedConsoleError('RenderPropError in component')).toBe(false);
        expect(isExpectedConsoleError('Error in render prop')).toBe(false);
      });
    });

    test.describe('StoryLoadedWrapper Timeout Filter', () => {
      test('should match StoryLoadedWrapper timeout message', () => {
        expect(isExpectedConsoleError('StoryLoadedWrapper: Timeout waiting for React Flow nodes')).toBe(true);
      });

      test('should match StoryLoadedWrapper loaded message', () => {
        expect(isExpectedConsoleError('StoryLoadedWrapper: Loaded in 250ms with 5 nodes')).toBe(true);
      });

      test('should match wrapper diagnostics', () => {
        expect(isExpectedConsoleError('Wrapper element: DIV')).toBe(true);
        expect(isExpectedConsoleError('Children count: 3')).toBe(true);
        expect(isExpectedConsoleError('Inner HTML (first 500 chars): <div class="react-flow">')).toBe(true);
      });

      test('should NOT match unrelated wrapper messages', () => {
        expect(isExpectedConsoleError('Error in StoryWrapper component')).toBe(false);
      });
    });

    test.describe('Edge Cases', () => {
      test('should handle empty string', () => {
        expect(isExpectedConsoleError('')).toBe(false);
      });

      test('should handle case-sensitive matching', () => {
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

  test.describe('isKnownRenderingBug', () => {
    test.describe('SVG Attribute Errors', () => {
      test('should match SVG path attribute errors', () => {
        expect(isKnownRenderingBug('Invalid value for <path> attribute d="undefined"')).toBe(true);
      });

      test('should match various SVG element attribute errors', () => {
        expect(isKnownRenderingBug('Invalid value for <circle> attribute r')).toBe(true);
        expect(isKnownRenderingBug('Invalid value for <rect> attribute width')).toBe(true);
        expect(isKnownRenderingBug('Invalid value for <line> attribute x1')).toBe(true);
      });

      test('should match path attribute numeric errors', () => {
        expect(isKnownRenderingBug('<path> attribute d: Expected number, "undefined"')).toBe(true);
      });

      test('should match svg viewBox numeric errors', () => {
        expect(isKnownRenderingBug('<svg> attribute viewBox: Expected number, got "undefined 100 200 300"')).toBe(true);
      });

      test('should NOT match non-SVG attribute errors', () => {
        expect(isKnownRenderingBug('Invalid value for HTML attribute class')).toBe(false);
      });
    });

    test.describe('React Flow Node Connection Errors', () => {
      test('should match source/target node errors', () => {
        expect(isKnownRenderingBug('source/target node with id node-123 not found')).toBe(true);
      });

      test('should match source/target handle errors', () => {
        expect(isKnownRenderingBug('source/target handle with id connection-1 not found')).toBe(true);
      });

      test('should NOT match similar but different errors', () => {
        expect(isKnownRenderingBug('Node source connection failed')).toBe(false);
      });
    });

    test.describe('React Flow Missing Provider Error', () => {
      test('should match zustand provider error', () => {
        expect(isKnownRenderingBug('Error: [React Flow]: Seems like you have not used zustand provider as an ancestor.')).toBe(true);
      });

      test('should NOT match unrelated React Flow errors', () => {
        expect(isKnownRenderingBug('React Flow rendered with wrong props')).toBe(false);
      });
    });

    test.describe('React Duplicate Key Warning - Edge Dedup Regression Detector', () => {
      test('should match duplicate key warning in list rendering', () => {
        const error = 'Warning: Encountered two children with the same key `edge-rel-3`';
        expect(isKnownRenderingBug(error)).toBe(true);
      });

      test('should match duplicate key warning without quoted key', () => {
        expect(isKnownRenderingBug('Encountered two children with the same key')).toBe(true);
      });

      test('should NOT suppress this error via isExpectedConsoleError', () => {
        const error = 'Warning: Encountered two children with the same key `edge-rel-3`';
        expect(isExpectedConsoleError(error)).toBe(false);
      });

      test('should NOT match unrelated key warnings', () => {
        expect(isKnownRenderingBug('Key validation failed')).toBe(false);
      });
    });

    test.describe('Filter Accuracy - Known Bugs Are Caught', () => {
      test('should catch all documented known rendering bug patterns', () => {
        const knownBugs = [
          'Invalid value for <path> attribute d',
          '<path> attribute d: Expected number',
          '<svg> attribute viewBox: Expected number',
          'source/target node not found',
          'source/target handle not found',
          'Error: [React Flow]: Seems like you have not used zustand provider as an ancestor.',
          'Encountered two children with the same key',
        ];

        const unmatchedBugs = knownBugs.filter(error => !isKnownRenderingBug(error));

        expect(
          unmatchedBugs.length,
          `These known bugs were not caught: ${unmatchedBugs.join(', ')}`
        ).toBe(0);
      });
    });

    test.describe('No Overlap Between Tiers', () => {
      test('expected errors should NOT be classified as known bugs', () => {
        const expectedOnlyErrors = [
          'Download the React DevTools for better development',
          'ECONNREFUSED localhost:3002',
          '[DataLoader] Failed to fetch model',
          'Warning: deprecated API',
        ];

        for (const error of expectedOnlyErrors) {
          expect(isKnownRenderingBug(error), `"${error}" should not be a known bug`).toBe(false);
        }
      });

      test('known bugs should NOT be classified as expected errors', () => {
        const knownBugOnly = [
          'Invalid value for <path> attribute d',
          '<path> attribute d: Expected number',
          'source/target node not found',
        ];

        for (const error of knownBugOnly) {
          expect(isExpectedConsoleError(error), `"${error}" should not be an expected error`).toBe(false);
        }
      });
    });

    test.describe('Edge Cases', () => {
      test('should handle empty string', () => {
        expect(isKnownRenderingBug('')).toBe(false);
      });

      test('should NOT match generic errors', () => {
        expect(isKnownRenderingBug('Connection failed')).toBe(false);
        expect(isKnownRenderingBug('Error: something went wrong')).toBe(false);
      });
    });
  });
});
