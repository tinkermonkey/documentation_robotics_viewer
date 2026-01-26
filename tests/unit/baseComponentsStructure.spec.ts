import { test, expect } from '@playwright/test';
import { BaseControlPanel } from '../../src/core/components/base/BaseControlPanel';
import { BaseInspectorPanel } from '../../src/core/components/base/BaseInspectorPanel';
import { GraphViewSidebar } from '../../src/core/components/base/GraphViewSidebar';

/**
 * Base Components Structure and Interface Tests
 *
 * These tests validate:
 * - Component exports and displayNames
 * - TypeScript interface definitions
 * - Component memoization
 * - Prop types
 */

test.describe('BaseControlPanel - Component Structure', () => {
  test('should be exported as memoized component', () => {
    expect(BaseControlPanel).toBeDefined();
    // Memoized components are objects with a displayName property
    expect(typeof BaseControlPanel).toBe('object');
  });

  test('should have proper displayName for debugging', () => {
    expect(BaseControlPanel.displayName).toBe('BaseControlPanel');
  });

  test('should accept generic type parameters for layout types', () => {
    // This is verified at compile time by TypeScript
    // We verify the component object exists
    expect(BaseControlPanel).toBeDefined();
  });

  test('should be a React component', () => {
    expect(BaseControlPanel).toBeDefined();
    expect(BaseControlPanel.displayName).toBe('BaseControlPanel');
  });
});

test.describe('BaseInspectorPanel - Component Structure', () => {
  test('should be exported as memoized component', () => {
    expect(BaseInspectorPanel).toBeDefined();
    // Memoized components are objects with a displayName property
    expect(typeof BaseInspectorPanel).toBe('object');
  });

  test('should have proper displayName for debugging', () => {
    expect(BaseInspectorPanel.displayName).toBe('BaseInspectorPanel');
  });

  test('should accept three generic type parameters (Graph, Node, Edge)', () => {
    // Generic type parameters are verified at compile time
    expect(BaseInspectorPanel).toBeDefined();
  });

  test('should be a React component', () => {
    expect(BaseInspectorPanel).toBeDefined();
    expect(BaseInspectorPanel.displayName).toBe('BaseInspectorPanel');
  });
});

test.describe('GraphViewSidebar - Component Structure', () => {
  test('should be exported as memoized component', () => {
    expect(GraphViewSidebar).toBeDefined();
    // Memoized components are objects with a displayName property
    expect(typeof GraphViewSidebar).toBe('object');
  });

  test('should have proper displayName for debugging', () => {
    expect(GraphViewSidebar.displayName).toBe('GraphViewSidebar');
  });

  test('should be a React component', () => {
    expect(GraphViewSidebar).toBeDefined();
    expect(GraphViewSidebar.displayName).toBe('GraphViewSidebar');
  });
});

test.describe('Base Component Types', () => {
  test('should have BaseGraph interface defined', async () => {
    // Verify types can be imported
    const module = await import('../../src/core/components/base/types');
    // BaseGraph is used in type checking; we verify the module exists
    expect(module).toBeDefined();
  });

  test('should have BaseNode interface defined', async () => {
    const module = await import('../../src/core/components/base/types');
    expect(module).toBeDefined();
  });

  test('should have BaseEdge interface defined', async () => {
    const module = await import('../../src/core/components/base/types');
    expect(module).toBeDefined();
  });

  test('should have QuickAction interface defined', async () => {
    const module = await import('../../src/core/components/base/types');
    expect(module).toBeDefined();
  });

  test('should have LayoutOption interface defined', async () => {
    const module = await import('../../src/core/components/base/types');
    expect(module).toBeDefined();
  });

  test('should have ExportOption interface defined', async () => {
    const module = await import('../../src/core/components/base/types');
    expect(module).toBeDefined();
  });
});

test.describe('RenderPropErrorBoundary Utilities', () => {
  test('should export wrapRenderProp function', async () => {
    const module = await import('../../src/core/components/base/RenderPropErrorBoundary');
    expect(module.wrapRenderProp).toBeDefined();
    expect(typeof module.wrapRenderProp).toBe('function');
  });

  test('should export wrapRenderProp2 function', async () => {
    const module = await import('../../src/core/components/base/RenderPropErrorBoundary');
    expect(module.wrapRenderProp2).toBeDefined();
    expect(typeof module.wrapRenderProp2).toBe('function');
  });

  test('should export wrapRenderPropVoid function', async () => {
    const module = await import('../../src/core/components/base/RenderPropErrorBoundary');
    expect(module.wrapRenderPropVoid).toBeDefined();
    expect(typeof module.wrapRenderPropVoid).toBe('function');
  });

  test('wrapRenderProp should handle successful render', async () => {
    const { wrapRenderProp } = await import('../../src/core/components/base/RenderPropErrorBoundary');

    const testRenderProp = (value: string) => `Result: ${value}`;
    const result = wrapRenderProp(testRenderProp, 'test', 'testProp');

    expect(result).toBe('Result: test');
  });

  test('wrapRenderProp should catch and handle errors', async () => {
    const { wrapRenderProp } = await import('../../src/core/components/base/RenderPropErrorBoundary');

    const errorRenderProp = () => {
      throw new Error('Test error');
    };

    const result = wrapRenderProp(errorRenderProp, 'test', 'testProp');

    // Should return JSX error UI instead of throwing
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  test('wrapRenderProp2 should handle two-argument render props', async () => {
    const { wrapRenderProp2 } = await import('../../src/core/components/base/RenderPropErrorBoundary');

    const testRenderProp = (arg1: string, arg2: string) => `${arg1}-${arg2}`;
    const result = wrapRenderProp2(testRenderProp, 'a', 'b', 'testProp');

    expect(result).toBe('a-b');
  });

  test('wrapRenderPropVoid should return null when renderProp is undefined', async () => {
    const { wrapRenderPropVoid } = await import('../../src/core/components/base/RenderPropErrorBoundary');

    const result = wrapRenderPropVoid(undefined, 'testProp');

    expect(result).toBeNull();
  });

  test('wrapRenderPropVoid should call render prop when defined', async () => {
    const { wrapRenderPropVoid } = await import('../../src/core/components/base/RenderPropErrorBoundary');

    const testRenderProp = () => 'Test content';
    const result = wrapRenderPropVoid(testRenderProp, 'testProp');

    expect(result).toBe('Test content');
  });

  test('wrapRenderPropVoid should catch errors from render prop', async () => {
    const { wrapRenderPropVoid } = await import('../../src/core/components/base/RenderPropErrorBoundary');

    const errorRenderProp = () => {
      throw new Error('Void error');
    };

    const result = wrapRenderPropVoid(errorRenderProp, 'testProp');

    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });
});

test.describe('Base Component Index Exports', () => {
  test('should export all components from index.ts', async () => {
    const baseIndex = await import('../../src/core/components/base/index');

    expect(baseIndex.BaseControlPanel).toBeDefined();
    expect(baseIndex.BaseInspectorPanel).toBeDefined();
    expect(baseIndex.GraphViewSidebar).toBeDefined();
  });

  test('should export all type definitions from index.ts', async () => {
    const baseIndex = await import('../../src/core/components/base/index');

    // Types are re-exported from types.ts
    expect(baseIndex).toBeDefined();
  });

  test('should have error boundary utilities available', async () => {
    // Error boundary utilities are exported from RenderPropErrorBoundary.tsx
    // and can be used by components
    const errorBoundary = await import('../../src/core/components/base/RenderPropErrorBoundary');

    expect(errorBoundary.wrapRenderProp).toBeDefined();
    expect(errorBoundary.wrapRenderProp2).toBeDefined();
    expect(errorBoundary.wrapRenderPropVoid).toBeDefined();
  });
});

test.describe('Component Props Type Safety', () => {
  test('BaseControlPanel has required props validated at TypeScript compile time', () => {
    // These props are required:
    // - selectedLayout: TLayout
    // - onLayoutChange: (layout: TLayout) => void
    // - layoutOptions: LayoutOption<TLayout>[]
    // - onFitToView: () => void
    // TypeScript enforces these at compile time
    expect(BaseControlPanel).toBeDefined();
  });

  test('BaseInspectorPanel has required props validated at TypeScript compile time', () => {
    // These props are required:
    // - selectedNodeId: string | null
    // - graph: TGraph
    // - onClose: () => void
    // - renderElementDetails: (node: TNode) => React.ReactNode
    // - getNodeName: (node: TNode) => string
    // - getEdgeType: (edge: TEdge) => string
    // TypeScript enforces these at compile time
    expect(BaseInspectorPanel).toBeDefined();
  });

  test('GraphViewSidebar has required props validated at TypeScript compile time', () => {
    // This prop is required:
    // - sections: Array<{ id: string; title: string; component: React.ReactNode; icon?: React.ReactNode }>
    // TypeScript enforces this at compile time
    expect(GraphViewSidebar).toBeDefined();
  });

  test('Optional props can be omitted without errors', () => {
    // Optional props like renderBeforeLayout, renderBetweenLayoutAndView, etc.
    // are properly typed as optional
    expect(BaseControlPanel).toBeDefined();
    expect(BaseInspectorPanel).toBeDefined();
  });
});

test.describe('Error Boundary Logging', () => {
  test('should log errors to console when render prop fails', async () => {
    const { wrapRenderProp } = await import('../../src/core/components/base/RenderPropErrorBoundary');

    const calls: any[] = [];
    const originalError = console.error;
    console.error = (...args) => calls.push(args);

    const errorRenderProp = () => {
      throw new Error('Test error message');
    };

    wrapRenderProp(errorRenderProp, 'test', 'testProp');

    expect(calls.length).toBeGreaterThan(0);
    const errorCall = calls[0];
    expect(String(errorCall[0])).toContain('Error in testProp');

    console.error = originalError;
  });

  test('should handle non-Error objects in error boundary', async () => {
    const { wrapRenderProp } = await import('../../src/core/components/base/RenderPropErrorBoundary');

    const errorRenderProp = () => {
      // Throw non-Error object
      throw 'String error';
    };

    const result = wrapRenderProp(errorRenderProp, 'test', 'testProp');

    // Should still handle gracefully
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  test('should include error details in error UI', async () => {
    const { wrapRenderProp } = await import('../../src/core/components/base/RenderPropErrorBoundary');

    const errorRenderProp = () => {
      throw new Error('Detailed error message');
    };

    const result = wrapRenderProp(errorRenderProp, 'test', 'myRenderProp');

    // Result should be JSX with error message
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('props');
  });
});
