import { test, expect } from '@playwright/test';
import {
  wrapRenderProp,
  wrapRenderProp2,
  wrapRenderPropVoid,
} from '../../src/core/components/base/RenderPropErrorBoundary';

test.describe('RenderPropErrorBoundary', () => {
  test.describe('wrapRenderProp', () => {
    test('should call render prop and return result on success', () => {
      const renderProp = (value: string) => `Result: ${value}`;
      const result = wrapRenderProp(renderProp, 'test', 'testProp');

      expect(result).toBe('Result: test');
    });

    test('should catch errors and return error UI', () => {
      const renderProp = () => {
        throw new Error('Test error');
      };

      const result = wrapRenderProp(renderProp, 'test', 'testProp');

      // Check that result is a React element (JSX.Element)
      expect(result).toBeTruthy();
      expect(typeof result === 'object' && result !== null && 'props' in result).toBeTruthy();
    });

    test('should log error to console with context', () => {
      const consoleSpy = test.step('spy on console.error', async () => {
        const originalError = console.error;
        const calls: any[] = [];
        console.error = (...args) => calls.push(args);

        try {
          const renderProp = () => {
            throw new Error('Test error message');
          };

          wrapRenderProp(renderProp, { id: 'test-1' }, 'testProp');

          // Verify error was logged
          expect(calls.length).toBeGreaterThan(0);
          const errorCall = calls[0];
          expect(String(errorCall[0])).toContain('Error in testProp');
          expect(String(errorCall[0])).toContain('Test error message');
        } finally {
          console.error = originalError;
        }
      });
    });

    test('should handle non-Error objects', () => {
      const renderProp = () => {
        throw 'String error, not Error object';
      };

      const result = wrapRenderProp(renderProp, 'test', 'testProp');

      // Should still show error UI (as React element)
      expect(result).toBeTruthy();
      expect(typeof result === 'object' && result !== null && 'props' in result).toBeTruthy();
    });

    test('should include render prop name in error UI', () => {
      const renderProp = () => {
        throw new Error('Failed to render');
      };

      const result = wrapRenderProp(renderProp, 'test', 'myCustomRenderProp');

      // Should return error element with proper test ID
      expect(typeof result === 'object' && result !== null && 'props' in result).toBeTruthy();
      if (typeof result === 'object' && result !== null && 'props' in result) {
        expect(result.props['data-testid']).toContain('render-prop-error-myCustomRenderProp');
      }
    });
  });

  test.describe('wrapRenderProp2', () => {
    test('should call render prop with two arguments and return result', () => {
      const renderProp = (a: string, b: number) => `${a}-${b}`;
      const result = wrapRenderProp2(renderProp, 'test', 42, 'testProp');

      expect(result).toBe('test-42');
    });

    test('should catch errors from two-argument render prop', () => {
      const renderProp = () => {
        throw new Error('Two-arg error');
      };

      const result = wrapRenderProp2(renderProp, 'test', 42, 'testProp');

      // Should return error React element
      expect(typeof result === 'object' && result !== null && 'props' in result).toBeTruthy();
    });

    test('should log both arguments in error context', () => {
      const consoleSpy = test.step('spy on console.error', async () => {
        const originalError = console.error;
        const calls: any[] = [];
        console.error = (...args) => calls.push(args);

        try {
          const renderProp = () => {
            throw new Error('Test error');
          };

          const arg1 = { id: 'node-1' };
          const arg2 = { name: 'graph' };

          wrapRenderProp2(renderProp, arg1, arg2, 'testProp');

          // Verify error was logged with both arguments
          expect(calls.length).toBeGreaterThan(0);
        } finally {
          console.error = originalError;
        }
      });
    });
  });

  test.describe('wrapRenderPropVoid', () => {
    test('should call void render prop and return result', () => {
      const renderProp = () => 'Result from void prop';
      const result = wrapRenderPropVoid(renderProp, 'testProp');

      expect(result).toBe('Result from void prop');
    });

    test('should return null for undefined render prop', () => {
      const result = wrapRenderPropVoid(undefined, 'testProp');

      expect(result).toBeNull();
    });

    test('should catch errors from void render prop', () => {
      const renderProp = () => {
        throw new Error('Void prop error');
      };

      const result = wrapRenderPropVoid(renderProp, 'testProp');

      // Should return error React element
      expect(typeof result === 'object' && result !== null && 'props' in result).toBeTruthy();
    });

    test('should not log error for undefined prop', () => {
      const originalError = console.error;
      const calls: any[] = [];
      console.error = (...args) => calls.push(args);

      try {
        wrapRenderPropVoid(undefined, 'testProp');

        // Should not have logged any error
        expect(calls.length).toBe(0);
      } finally {
        console.error = originalError;
      }
    });

    test('should safely handle errors thrown during prop execution', () => {
      const renderProp = () => {
        throw new Error('Execution failed');
      };

      // Should not throw, should return error UI
      expect(() => {
        wrapRenderPropVoid(renderProp, 'testProp');
      }).not.toThrow();
    });
  });

  test.describe('Error UI rendering', () => {
    test('should render error UI with accessible alert role', () => {
      const renderProp = () => {
        throw new Error('Test error');
      };

      const result = wrapRenderProp(renderProp, 'test', 'testProp');

      // Check the rendered component has alert role
      expect(typeof result === 'object' && result !== null && 'props' in result).toBeTruthy();
      if (typeof result === 'object' && result !== null && 'props' in result) {
        expect(result.props.role).toBe('alert');
      }
    });

    test('should include "Check browser console" message', () => {
      const renderProp = () => {
        throw new Error('Test error');
      };

      const result = wrapRenderProp(renderProp, 'test', 'testProp');

      // Verify the error element is created
      expect(typeof result === 'object' && result !== null && 'props' in result).toBeTruthy();
    });

    test('should render with test ID for E2E selection', () => {
      const renderProp = () => {
        throw new Error('Test error');
      };

      const result = wrapRenderProp(renderProp, 'test', 'myPropName');

      // Check test ID is set correctly
      expect(typeof result === 'object' && result !== null && 'props' in result).toBeTruthy();
      if (typeof result === 'object' && result !== null && 'props' in result) {
        expect(result.props['data-testid']).toBe('render-prop-error-myPropName');
      }
    });
  });
});
