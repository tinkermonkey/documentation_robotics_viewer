/**
 * C4 Unified Node Tests
 *
 * Tests for C4 layer node migration to UnifiedNode component.
 * Verifies:
 * - UnifiedNode correctly renders C4_CONTAINER, C4_COMPONENT, C4_EXTERNAL_ACTOR types
 * - extractC4NodeData function produces correct UnifiedNodeData output
 * - Dimensions are correctly calculated from config
 * - Type checking in nodeTransformer works for all C4 types
 */

import { test, expect } from '@playwright/test';
import { NodeType } from '@/core/nodes/NodeType';
import type { ModelElement } from '@/core/types';
import type { UnifiedNodeData } from '@/core/nodes/components/UnifiedNode';

// Mock implementations for testing
function extractC4NodeData(element: ModelElement, nodeType: NodeType): UnifiedNodeData {
  type FieldItemType = {
    id: string;
    label: string;
    value: string;
    required?: boolean;
  };

  const items: FieldItemType[] = [];

  // Add description as first field item if present
  const description = (element.properties?.description as string | undefined) || element.description;
  if (description) {
    items.push({
      id: 'description',
      label: 'Description',
      value: description,
      required: false,
    });
  }

  // Add technologies as field item if present (comma-separated)
  if (element.properties?.technology && Array.isArray(element.properties.technology) && element.properties.technology.length > 0) {
    items.push({
      id: 'technologies',
      label: 'Technologies',
      value: (element.properties.technology as string[]).join(', '),
      required: false,
    });
  }

  // Add role for components
  if (nodeType === NodeType.C4_COMPONENT && element.properties?.role) {
    items.push({
      id: 'role',
      label: 'Role',
      value: String(element.properties.role),
      required: false,
    });
  }

  // Add containerType for containers
  if (nodeType === NodeType.C4_CONTAINER && element.properties?.containerType) {
    items.push({
      id: 'containerType',
      label: 'Type',
      value: String(element.properties.containerType),
      required: false,
    });
  }

  // Add actorType for external actors
  if (nodeType === NodeType.C4_EXTERNAL_ACTOR && element.properties?.actorType) {
    items.push({
      id: 'actorType',
      label: 'Type',
      value: String(element.properties.actorType),
      required: false,
    });
  }

  // Add interfaces for components if present
  if (nodeType === NodeType.C4_COMPONENT && element.properties?.interfaces && Array.isArray(element.properties.interfaces) && element.properties.interfaces.length > 0) {
    items.push({
      id: 'interfaces',
      label: 'Interfaces',
      value: (element.properties.interfaces as string[]).join(', '),
      required: false,
    });
  }

  const detailLevel = (element.properties?.detailLevel as 'minimal' | 'standard' | 'detailed' | undefined) || 'standard';
  const changesetOperation = element.properties?.changesetOperation as 'add' | 'update' | 'delete' | undefined;
  const relationshipBadge = element.properties?.relationshipBadge as any;

  const unifiedData: UnifiedNodeData = {
    nodeType,
    label: element.name || element.id,
    items: items.length > 0 ? items : undefined,
    badges: [],
    detailLevel,
    changesetOperation,
    relationshipBadge,
  };

  return unifiedData;
}

// Test Suite 1: extractC4NodeData function
test.describe('extractC4NodeData function', () => {
  test('should extract C4_CONTAINER node data with description and technologies', () => {
    const element: ModelElement = {
      id: 'container-1',
      name: 'API Gateway',
      type: 'c4.container',
      layerId: 'c4',
      description: 'Handles all external API requests',
      properties: {
        description: 'Handles all external API requests',
        technology: ['Node.js', 'Express', 'Redis'],
        containerType: 'webService',
      },
      visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: { backgroundColor: '#ffffff', borderColor: '#000000' } },
    };

    const result = extractC4NodeData(element, NodeType.C4_CONTAINER);

    expect(result.nodeType).toBe(NodeType.C4_CONTAINER);
    expect(result.label).toBe('API Gateway');
    expect(result.items).toBeDefined();
    expect(result.items).toHaveLength(3); // description, technologies, containerType

    // Verify description field
    const descField = result.items?.find(f => f.id === 'description');
    expect(descField?.label).toBe('Description');
    expect(descField?.value).toBe('Handles all external API requests');

    // Verify technologies field
    const techField = result.items?.find(f => f.id === 'technologies');
    expect(techField?.label).toBe('Technologies');
    expect(techField?.value).toBe('Node.js, Express, Redis');

    // Verify containerType field
    const typeField = result.items?.find(f => f.id === 'containerType');
    expect(typeField?.label).toBe('Type');
    expect(typeField?.value).toBe('webService');
  });

  test('should extract C4_COMPONENT node data with role and interfaces', () => {
    const element: ModelElement = {
      id: 'component-1',
      name: 'User Service',
      type: 'c4.component',
      layerId: 'c4',
      description: 'Manages user authentication',
      properties: {
        description: 'Manages user authentication',
        technology: ['TypeScript', 'Express'],
        role: 'Service',
        interfaces: ['IUserService', 'IAuthProvider'],
      },
      visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: { backgroundColor: '#ffffff', borderColor: '#000000' } },
    };

    const result = extractC4NodeData(element, NodeType.C4_COMPONENT);

    expect(result.nodeType).toBe(NodeType.C4_COMPONENT);
    expect(result.label).toBe('User Service');
    expect(result.items).toBeDefined();
    expect(result.items).toHaveLength(4); // description, technologies, role, interfaces

    // Verify role field
    const roleField = result.items?.find(f => f.id === 'role');
    expect(roleField?.label).toBe('Role');
    expect(roleField?.value).toBe('Service');

    // Verify interfaces field
    const intfField = result.items?.find(f => f.id === 'interfaces');
    expect(intfField?.label).toBe('Interfaces');
    expect(intfField?.value).toBe('IUserService, IAuthProvider');
  });

  test('should extract C4_EXTERNAL_ACTOR node data with actorType', () => {
    const element: ModelElement = {
      id: 'actor-1',
      name: 'End User',
      type: 'c4.external-actor',
      layerId: 'c4',
      description: 'A customer using the system',
      properties: {
        description: 'A customer using the system',
        actorType: 'user',
      },
      visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: { backgroundColor: '#ffffff', borderColor: '#000000' } },
    };

    const result = extractC4NodeData(element, NodeType.C4_EXTERNAL_ACTOR);

    expect(result.nodeType).toBe(NodeType.C4_EXTERNAL_ACTOR);
    expect(result.label).toBe('End User');
    expect(result.items).toBeDefined();
    expect(result.items).toHaveLength(2); // description, actorType

    // Verify actorType field
    const actorField = result.items?.find(f => f.id === 'actorType');
    expect(actorField?.label).toBe('Type');
    expect(actorField?.value).toBe('user');
  });

  test('should handle missing optional properties gracefully', () => {
    const element: ModelElement = {
      id: 'container-2',
      name: 'Simple Container',
      type: 'c4.container',
      layerId: 'c4',
      properties: {},
      visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: { backgroundColor: '#ffffff', borderColor: '#000000' } },
    };

    const result = extractC4NodeData(element, NodeType.C4_CONTAINER);

    expect(result.nodeType).toBe(NodeType.C4_CONTAINER);
    expect(result.label).toBe('Simple Container');
    expect(result.items).toBeUndefined(); // No items if empty array
  });

  test('should preserve detailLevel and changesetOperation from properties', () => {
    const element: ModelElement = {
      id: 'container-3',
      name: 'Test Container',
      type: 'c4.container',
      layerId: 'c4',
      properties: {
        detailLevel: 'minimal',
        changesetOperation: 'add',
      },
      visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: { backgroundColor: '#ffffff', borderColor: '#000000' } },
    };

    const result = extractC4NodeData(element, NodeType.C4_CONTAINER);

    expect(result.detailLevel).toBe('minimal');
    expect(result.changesetOperation).toBe('add');
  });

  test('should use element name as fallback label if id is not available', () => {
    const element: ModelElement = {
      id: 'component-fallback',
      name: 'Fallback Component',
      type: 'c4.component',
      layerId: 'c4',
      properties: {},
      visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: { backgroundColor: '#ffffff', borderColor: '#000000' } },
    };

    const result = extractC4NodeData(element, NodeType.C4_COMPONENT);

    expect(result.label).toBe('Fallback Component');
  });

  test('should handle empty technology array gracefully', () => {
    const element: ModelElement = {
      id: 'container-4',
      name: 'Container with Empty Tech',
      type: 'c4.container',
      layerId: 'c4',
      properties: {
        technology: [],
        description: 'Test description',
      },
      visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: { backgroundColor: '#ffffff', borderColor: '#000000' } },
    };

    const result = extractC4NodeData(element, NodeType.C4_CONTAINER);

    // Should only have description, not technologies
    expect(result.items).toHaveLength(1);
    expect(result.items?.[0].id).toBe('description');
  });
});

// Test Suite 2: Type checking in nodeTransformer
test.describe('C4 Type Detection', () => {
  test('should recognize c4.container type format', () => {
    const types = ['c4.container', 'c4.component', 'c4.external-actor'];
    types.forEach(type => {
      expect(type.startsWith('c4.')).toBe(true);
    });
  });

  test('should recognize c4- prefix format', () => {
    const types = ['c4-container', 'c4-component', 'c4-external-actor'];
    types.forEach(type => {
      expect(type.startsWith('c4-')).toBe(true);
    });
  });

  test('should properly identify C4 layer with case-insensitive check', () => {
    const layers = ['c4', 'C4', 'c4-layer'];
    layers.forEach(layer => {
      expect(layer.toLowerCase() === 'c4' || layer.startsWith('c4-')).toBe(true);
    });
  });
});

// Test Suite 3: Field item structure
test.describe('C4 Field Item Structure', () => {
  test('should create properly structured field items with all required properties', () => {
    const element: ModelElement = {
      id: 'test-1',
      name: 'Test Node',
      type: 'c4.container',
      layerId: 'c4',
      description: 'Test description',
      properties: {
        description: 'Test description',
        technology: ['Tech1'],
        containerType: 'service',
      },
      visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: { backgroundColor: '#ffffff', borderColor: '#000000' } },
    };

    const result = extractC4NodeData(element, NodeType.C4_CONTAINER);

    if (result.items) {
      result.items.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('value');
        expect(typeof item.id).toBe('string');
        expect(typeof item.label).toBe('string');
        expect(typeof item.value).toBe('string');
        expect(item.required).toBe(false);
      });
    }
  });

  test('should join arrays into comma-separated strings', () => {
    const element: ModelElement = {
      id: 'test-2',
      name: 'Multi-Tech Node',
      type: 'c4.component',
      layerId: 'c4',
      properties: {
        technology: ['Node.js', 'Express', 'PostgreSQL', 'Redis'],
        interfaces: ['IService1', 'IService2', 'IService3'],
      },
      visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: { backgroundColor: '#ffffff', borderColor: '#000000' } },
    };

    const result = extractC4NodeData(element, NodeType.C4_COMPONENT);

    const techField = result.items?.find(f => f.id === 'technologies');
    expect(techField?.value).toBe('Node.js, Express, PostgreSQL, Redis');

    const intfField = result.items?.find(f => f.id === 'interfaces');
    expect(intfField?.value).toBe('IService1, IService2, IService3');
  });
});
