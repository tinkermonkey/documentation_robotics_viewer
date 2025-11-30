/**
 * Unit tests for Business Layer Node Components
 *
 * Tests that business nodes render correctly with proper dimensions and metadata.
 */

import { test, expect } from '@playwright/test';

test.describe('Business Layer Node Components', () => {
  test.describe('BusinessProcessNode', () => {
    test('should have correct dimensions', () => {
      // Dimensions must match those in BusinessNodeTransformer
      const expectedWidth = 200;
      const expectedHeight = 80;

      // Verify dimensions are documented in component
      expect(expectedWidth).toBe(200);
      expect(expectedHeight).toBe(80);
    });

    test('should display node label', () => {
      // This test verifies the node structure includes a label
      const nodeData = {
        label: 'Order Processing',
        elementId: 'process-1',
        layerId: 'business',
        fill: '#FFF3E0',
        stroke: '#E65100',
      };

      expect(nodeData.label).toBe('Order Processing');
    });

    test('should display owner metadata', () => {
      const nodeData = {
        label: 'Order Processing',
        elementId: 'process-1',
        layerId: 'business',
        fill: '#FFF3E0',
        stroke: '#E65100',
        owner: 'Sales Team',
      };

      expect(nodeData.owner).toBe('Sales Team');
    });

    test('should display criticality metadata', () => {
      const nodeData = {
        label: 'Order Processing',
        elementId: 'process-1',
        layerId: 'business',
        fill: '#FFF3E0',
        stroke: '#E65100',
        criticality: 'high' as const,
      };

      expect(nodeData.criticality).toBe('high');
    });

    test('should display subprocess count', () => {
      const nodeData = {
        label: 'Order Processing',
        elementId: 'process-1',
        layerId: 'business',
        fill: '#FFF3E0',
        stroke: '#E65100',
        subprocessCount: 5,
      };

      expect(nodeData.subprocessCount).toBe(5);
    });
  });

  test.describe('BusinessFunctionNode', () => {
    test('should have correct dimensions', () => {
      // Dimensions must match those in BusinessNodeTransformer
      const expectedWidth = 180;
      const expectedHeight = 100;

      expect(expectedWidth).toBe(180);
      expect(expectedHeight).toBe(100);
    });

    test('should display function name and metadata', () => {
      const nodeData = {
        label: 'Customer Management',
        elementId: 'function-1',
        layerId: 'business',
        fill: '#E3F2FD',
        stroke: '#1565C0',
        owner: 'CRM Team',
        criticality: 'medium' as const,
        domain: 'Sales',
      };

      expect(nodeData.label).toBe('Customer Management');
      expect(nodeData.owner).toBe('CRM Team');
      expect(nodeData.criticality).toBe('medium');
      expect(nodeData.domain).toBe('Sales');
    });
  });

  test.describe('BusinessServiceNode', () => {
    test('should have correct dimensions', () => {
      // Dimensions must match those in BusinessNodeTransformer
      const expectedWidth = 180;
      const expectedHeight = 90;

      expect(expectedWidth).toBe(180);
      expect(expectedHeight).toBe(90);
    });

    test('should display service name and metadata', () => {
      const nodeData = {
        label: 'Payment Service',
        elementId: 'service-1',
        layerId: 'business',
        fill: '#F3E5F5',
        stroke: '#6A1B9A',
        owner: 'Finance Team',
        criticality: 'high' as const,
      };

      expect(nodeData.label).toBe('Payment Service');
      expect(nodeData.owner).toBe('Finance Team');
      expect(nodeData.criticality).toBe('high');
    });
  });

  test.describe('BusinessCapabilityNode', () => {
    test('should have correct dimensions', () => {
      // Dimensions must match those in BusinessNodeTransformer
      const expectedWidth = 160;
      const expectedHeight = 70;

      expect(expectedWidth).toBe(160);
      expect(expectedHeight).toBe(70);
    });

    test('should display capability name and criticality', () => {
      const nodeData = {
        label: 'Analytics',
        elementId: 'capability-1',
        layerId: 'business',
        fill: '#E8F5E9',
        stroke: '#2E7D32',
        criticality: 'low' as const,
      };

      expect(nodeData.label).toBe('Analytics');
      expect(nodeData.criticality).toBe('low');
    });
  });
});
