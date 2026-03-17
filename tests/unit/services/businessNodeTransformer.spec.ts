import { test, expect } from '@playwright/test';
import { BusinessNodeTransformer } from '../../../src/core/services/businessNodeTransformer';
import type { BusinessNode } from '../../../src/core/types/businessLayer';

test.describe('BusinessNodeTransformer', () => {
  let transformer: BusinessNodeTransformer;

  test.beforeEach(() => {
    transformer = new BusinessNodeTransformer();
  });

  test.describe('getNodeDimensions', () => {
    test('should return dimensions for business.function type', () => {
      const node: BusinessNode = {
        id: 'func-1',
        name: 'Process Payment',
        type: 'function',
        parentId: undefined,
        childIds: [],
        hierarchyLevel: 0,
        metadata: {
          owner: 'Finance Team',
          criticality: 'high',
          lifecycle: 'active',
          domain: 'payments',
        },
      };

      const dimensions = transformer.getNodeDimensions(node);
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });

    test('should return dimensions for business.process type', () => {
      const node: BusinessNode = {
        id: 'proc-1',
        name: 'Order Fulfillment',
        type: 'process',
        parentId: undefined,
        childIds: [],
        hierarchyLevel: 0,
        metadata: {
          owner: 'Operations',
          criticality: 'medium',
          lifecycle: 'active',
          domain: 'fulfillment',
          subprocessCount: 5,
          stepCount: 10,
        },
      };

      const dimensions = transformer.getNodeDimensions(node);
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });

    test('should return dimensions for business.service type', () => {
      const node: BusinessNode = {
        id: 'svc-1',
        name: 'Payment Service',
        type: 'service',
        parentId: undefined,
        childIds: [],
        hierarchyLevel: 0,
        metadata: {
          owner: 'Finance Team',
          criticality: 'high',
          lifecycle: 'active',
          domain: 'payments',
        },
      };

      const dimensions = transformer.getNodeDimensions(node);
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });

    test('should return dimensions for business.capability type', () => {
      const node: BusinessNode = {
        id: 'cap-1',
        name: 'Payment Processing',
        type: 'capability',
        parentId: undefined,
        childIds: [],
        hierarchyLevel: 0,
        metadata: {
          owner: 'Finance Team',
          criticality: 'high',
          lifecycle: 'active',
          domain: 'payments',
        },
      };

      const dimensions = transformer.getNodeDimensions(node);
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });

    test('should warn and use fallback dimensions for unknown node type', () => {
      const node: BusinessNode = {
        id: 'unknown-1',
        name: 'Unknown Type',
        type: 'unknown',
        parentId: undefined,
        childIds: [],
        hierarchyLevel: 0,
        metadata: {
          owner: 'Unknown',
          criticality: 'low',
          lifecycle: 'active',
          domain: 'unknown',
        },
      };

      const originalWarn = console.warn;
      const calls: any[] = [];
      console.warn = (...args) => calls.push(args);

      try {
        const dimensions = transformer.getNodeDimensions(node);

        // Should use fallback dimensions
        expect(dimensions.width).toBe(180);
        expect(dimensions.height).toBe(100);

        // Should have logged a warning
        expect(calls.length).toBe(1);
        expect(calls[0][0]).toContain('[BusinessNodeTransformer] Using fallback dimensions');
        expect(calls[0][0]).toContain('unknown node type "unknown"');
      } finally {
        console.warn = originalWarn;
      }
    });

    test('should log warning for unmapped node type', () => {
      const node: BusinessNode = {
        id: 'unknown-2',
        name: 'Unmapped Type',
        type: 'unmapped',
        parentId: undefined,
        childIds: [],
        hierarchyLevel: 0,
        metadata: {
          owner: 'Unknown',
          criticality: 'low',
          lifecycle: 'active',
          domain: 'unknown',
        },
      };

      const originalWarn = console.warn;
      const calls: any[] = [];
      console.warn = (...args) => calls.push(args);

      try {
        transformer.getNodeDimensions(node);

        // Should have logged a warning
        expect(calls.length).toBe(1);
        expect(calls[0][0]).toContain('[BusinessNodeTransformer] Using fallback dimensions');
      } finally {
        console.warn = originalWarn;
      }
    });
  });

  test.describe('precalculateDimensions', () => {
    test('should set dimensions on all nodes', () => {
      const nodes = new Map<string, BusinessNode>([
        [
          'func-1',
          {
            id: 'func-1',
            name: 'Function 1',
            type: 'function',
            parentId: undefined,
            childIds: [],
            hierarchyLevel: 0,
            metadata: {
              owner: 'Team A',
              criticality: 'low',
              lifecycle: 'active',
              domain: 'domain1',
            },
          },
        ],
        [
          'proc-1',
          {
            id: 'proc-1',
            name: 'Process 1',
            type: 'process',
            parentId: undefined,
            childIds: [],
            hierarchyLevel: 0,
            metadata: {
              owner: 'Team B',
              criticality: 'medium',
              lifecycle: 'active',
              domain: 'domain2',
              subprocessCount: 3,
              stepCount: 5,
            },
          },
        ],
      ]);

      transformer.precalculateDimensions(nodes);

      for (const node of nodes.values()) {
        expect(node.dimensions).toBeDefined();
        expect(node.dimensions?.width).toBeGreaterThan(0);
        expect(node.dimensions?.height).toBeGreaterThan(0);
      }
    });
  });

  test.describe('getNodeType', () => {
    test('should always return "unified" type', () => {
      const nodeType = transformer.getNodeType();
      expect(nodeType).toBe('unified');
    });
  });
});
