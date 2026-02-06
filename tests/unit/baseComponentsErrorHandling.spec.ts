import { test, expect } from '@playwright/test';
import { wrapRenderProp, wrapRenderProp2, wrapRenderPropVoid } from '../../src/core/components/base/RenderPropErrorBoundary';
import React from 'react';

/**
 * Unit tests for RenderPropErrorBoundary utility functions
 *
 * These tests verify that render props are properly wrapped with error handling
 * and errors are caught, logged, and displayed to users rather than silently failing.
 */

// Helper function to safely extract React element properties
function getElementProps(element: any) {
  return element?.props || {};
}

function getElementType(element: any) {
  return element?.type;
}

function getElementChildren(element: any) {
  return element?.props?.children;
}

test.describe('wrapRenderProp Error Handling', () => {
  test('should catch render prop errors and return error UI', () => {
    // Setup: Create a render prop that throws an error
    const failingRenderProp = (data: string) => {
      throw new Error('Render prop error');
    };

    // Act: Call wrapRenderProp with failing function
    const result = wrapRenderProp(failingRenderProp, 'test data', 'testRenderProp');

    // Assert: Result should be a React element (error UI)
    expect(result).toBeDefined();
    expect(getElementType(result)).toBe('div');
    expect(getElementProps(result)['data-testid']).toBe('render-prop-error-testRenderProp');
    expect(getElementProps(result).role).toBe('alert');
  });

  test('should successfully call and return result from working render prop', () => {
    // Setup: Create a render prop that works correctly
    const workingRenderProp = (data: string) => {
      return React.createElement('span', { key: 'test' }, `Value: ${data}`);
    };

    // Act: Call wrapRenderProp with working function
    const result = wrapRenderProp(workingRenderProp, 'test data', 'testRenderProp');

    // Assert: Result should be the returned element
    expect(result).toBeDefined();
    expect(getElementType(result)).toBe('span');
    expect(getElementChildren(result)).toContain('Value: test data');
  });

  test('should log error details to console when render prop fails', () => {
    // Setup: Spy on console.error
    const originalError = console.error;
    const errorCalls: any[] = [];
    console.error = (...args) => errorCalls.push(args);

    try {
      // Act: Call failing render prop
      const failingRenderProp = () => {
        throw new Error('Test error message');
      };
      wrapRenderProp(failingRenderProp, 'arg', 'myRenderProp');

      // Assert: console.error should have been called with error details
      expect(errorCalls.length).toBeGreaterThan(0);
      const firstCall = errorCalls[0];
      expect(firstCall[0]).toContain('[RenderPropErrorBoundary]');
      expect(firstCall[0]).toContain('myRenderProp');
      expect(firstCall[0]).toContain('Test error message');

      // Verify error context object was logged
      expect(firstCall.length).toBeGreaterThanOrEqual(3);
      const contextObj = firstCall[2];
      expect(contextObj.renderPropName).toBe('myRenderProp');
      expect(contextObj.argument).toBe('arg');
    } finally {
      console.error = originalError;
    }
  });

  test('should handle null/undefined argument gracefully', () => {
    // Setup: Create a render prop that expects an optional argument
    const renderProp = (data: any) => {
      if (!data) return React.createElement('div', { key: 'null' }, 'No data');
      return React.createElement('div', { key: 'data' }, data);
    };

    // Act: Call with null
    const result = wrapRenderProp(renderProp, null, 'testRenderProp');

    // Assert: Should return element with "No data"
    expect(result).toBeDefined();
    expect(getElementType(result)).toBe('div');
    expect(getElementChildren(result)).toBe('No data');
  });
});

test.describe('wrapRenderProp2 Error Handling', () => {
  test('should catch errors in two-argument render props', () => {
    // Setup: Create a render prop that takes two arguments and fails
    const failingRenderProp = (arg1: string, arg2: number) => {
      throw new Error('Two-arg render prop error');
    };

    // Act: Call wrapRenderProp2
    const result = wrapRenderProp2(failingRenderProp, 'test', 42, 'testRenderProp2');

    // Assert: Should return error UI
    expect(result).toBeDefined();
    expect(getElementType(result)).toBe('div');
    expect(getElementProps(result)['data-testid']).toBe('render-prop-error-testRenderProp2');
  });

  test('should successfully call two-argument render props', () => {
    // Setup: Create a working two-argument render prop
    const workingRenderProp = (name: string, count: number) => {
      return React.createElement('div', { key: 'result' }, `${name}: ${count}`);
    };

    // Act: Call wrapRenderProp2
    const result = wrapRenderProp2(workingRenderProp, 'Items', 5, 'testRenderProp2');

    // Assert: Should return the element
    expect(result).toBeDefined();
    expect(getElementChildren(result)).toBe('Items: 5');
  });

  test('should log both arguments in error context for two-argument render props', () => {
    // Setup: Spy on console.error
    const originalError = console.error;
    const errorCalls: any[] = [];
    console.error = (...args) => errorCalls.push(args);

    try {
      // Act: Call failing two-argument render prop
      const failingRenderProp = (arg1: string, arg2: number) => {
        throw new Error('Two-arg error');
      };
      wrapRenderProp2(failingRenderProp, 'value1', 99, 'myTwoArgProp');

      // Assert: Both arguments should be logged
      expect(errorCalls.length).toBeGreaterThan(0);
      const contextObj = errorCalls[0][2];
      expect(contextObj.arguments).toEqual(['value1', 99]);
    } finally {
      console.error = originalError;
    }
  });
});

test.describe('wrapRenderPropVoid Error Handling', () => {
  test('should return null when render prop is undefined', () => {
    // Act: Call wrapRenderPropVoid with undefined
    const result = wrapRenderPropVoid(undefined, 'testRenderProp');

    // Assert: Should return null
    expect(result).toBeNull();
  });

  test('should catch errors in void render props', () => {
    // Setup: Create a void render prop that fails
    const failingRenderProp = () => {
      throw new Error('Void render prop error');
    };

    // Act: Call wrapRenderPropVoid
    const result = wrapRenderPropVoid(failingRenderProp, 'testVoidProp');

    // Assert: Should return error UI
    expect(result).toBeDefined();
    expect(getElementType(result)).toBe('div');
    expect(getElementProps(result)['data-testid']).toBe('render-prop-error-testVoidProp');
  });

  test('should successfully call void render props', () => {
    // Setup: Create a working void render prop
    const workingRenderProp = () => {
      return React.createElement('p', { key: 'result' }, 'Void render success');
    };

    // Act: Call wrapRenderPropVoid
    const result = wrapRenderPropVoid(workingRenderProp, 'testVoidProp');

    // Assert: Should return the element
    expect(result).toBeDefined();
    expect(getElementChildren(result)).toBe('Void render success');
  });

  test('should log error stack trace for void render props', () => {
    // Setup: Spy on console.error
    const originalError = console.error;
    const errorCalls: any[] = [];
    console.error = (...args) => errorCalls.push(args);

    try {
      // Act: Call failing void render prop
      const failingRenderProp = () => {
        throw new Error('Void error with stack');
      };
      wrapRenderPropVoid(failingRenderProp, 'myVoidProp');

      // Assert: Error stack should be logged
      expect(errorCalls.length).toBeGreaterThan(0);
      const contextObj = errorCalls[0][2];
      expect(contextObj.renderPropName).toBe('myVoidProp');
      expect(contextObj.stack).toBeDefined();
      expect(typeof contextObj.stack).toBe('string');
    } finally {
      console.error = originalError;
    }
  });
});
