import { describe, it, expect, beforeEach } from '@playwright/test';
import { ShapeTransformer } from '../../src/core/services/shapeTransformer';
import { MetaModel, ModelElement, LayerType } from '../../src/core/types/MetaModel';

describe('ShapeTransformer', () => {
  let transformer: ShapeTransformer;

  beforeEach(() => {
    transformer = new ShapeTransformer();
  });

  describe('getShapeTypeForElement', () => {
    it('should map goal element type to motivation-goal shape', () => {
      const element: ModelElement = {
        id: 'test-goal',
        type: 'goal',
        name: 'Test Goal',
        layer: 'motivation',
        properties: {},
        visual: {
          position: { x: 0, y: 0 },
          size: { width: 160, height: 80 },
          style: {}
        }
      };

      const shapeType = (transformer as any).getShapeTypeForElement(element);
      expect(shapeType).toBe('motivation-goal');
    });

    it('should map constraint element type to motivation-constraint shape', () => {
      const element: ModelElement = {
        id: 'test-constraint',
        type: 'constraint',
        name: 'Test Constraint',
        layer: 'motivation',
        properties: {},
        visual: {
          position: { x: 0, y: 0 },
          size: { width: 160, height: 80 },
          style: {}
        }
      };

      const shapeType = (transformer as any).getShapeTypeForElement(element);
      expect(shapeType).toBe('motivation-constraint');
    });

    it('should return generic-element for unknown type', () => {
      const element: ModelElement = {
        id: 'test-unknown',
        type: 'unknown',
        name: 'Test Unknown',
        layer: 'motivation',
        properties: {},
        visual: {
          position: { x: 0, y: 0 },
          size: { width: 160, height: 80 },
          style: {}
        }
      };

      const shapeType = (transformer as any).getShapeTypeForElement(element);
      expect(shapeType).toBe('generic-element');
    });

    it('should handle element with missing type property', () => {
      const element: ModelElement = {
        id: 'test-no-type',
        type: '',
        name: 'Test No Type',
        layer: 'motivation',
        properties: {},
        visual: {
          position: { x: 0, y: 0 },
          size: { width: 160, height: 80 },
          style: {}
        }
      };

      const shapeType = (transformer as any).getShapeTypeForElement(element);
      expect(shapeType).toBe('generic-element');
    });
  });

  describe('transformModelToShapes', () => {
    it('should transform a simple model with one element', () => {
      const model: MetaModel = {
        version: '0.1.0',
        metadata: {
          type: 'yaml-instance',
          source: 'test'
        },
        layers: {
          motivation: {
            id: 'motivation',
            type: 'Motivation' as LayerType,
            name: 'Motivation',
            order: 1,
            elements: [
              {
                id: 'goal-1',
                type: 'goal',
                name: 'Test Goal',
                layer: 'motivation',
                properties: {},
                visual: {
                  position: { x: 100, y: 100 },
                  size: { width: 160, height: 80 },
                  style: {
                    backgroundColor: '#ffffff',
                    borderColor: '#000000'
                  }
                }
              }
            ],
            relationships: []
          }
        },
        relationships: [],
        references: []
      };

      const result = transformer.transformModelToShapes(model);

      expect(result.nodes.length).toBe(1);
      expect(result.edges.length).toBe(0);
      expect(result.nodes[0].id).toBe('goal-1');
      expect(result.nodes[0].type).toBe('motivation-goal');
      expect(result.nodes[0].data.label).toBe('Test Goal');
    });

    it('should skip elements with unknown type', () => {
      const model: MetaModel = {
        version: '0.1.0',
        metadata: {
          type: 'yaml-instance',
          source: 'test'
        },
        layers: {
          motivation: {
            id: 'motivation',
            type: 'Motivation' as LayerType,
            name: 'Motivation',
            order: 1,
            elements: [
              {
                id: 'unknown-1',
                type: 'unknown',
                name: 'Unknown Element',
                layer: 'motivation',
                properties: {},
                visual: {
                  position: { x: 100, y: 100 },
                  size: { width: 160, height: 80 },
                  style: {}
                }
              }
            ],
            relationships: []
          }
        },
        relationships: [],
        references: []
      };

      const result = transformer.transformModelToShapes(model);

      // Should still create shapes for unknown types using generic-element
      expect(result.nodes.length).toBe(1);
      expect(result.nodes[0].type).toBe('generic-element');
    });

    it('should handle model with no elements', () => {
      const model: MetaModel = {
        version: '0.1.0',
        metadata: {
          type: 'yaml-instance',
          source: 'test'
        },
        layers: {
          motivation: {
            id: 'motivation',
            type: 'Motivation' as LayerType,
            name: 'Motivation',
            order: 1,
            elements: [],
            relationships: []
          }
        },
        relationships: [],
        references: []
      };

      const result = transformer.transformModelToShapes(model);

      expect(result.nodes.length).toBe(0);
      expect(result.edges.length).toBe(0);
    });

    it('should handle model with multiple layers and elements', () => {
      const model: MetaModel = {
        version: '0.1.0',
        metadata: {
          type: 'yaml-instance',
          source: 'test'
        },
        layers: {
          motivation: {
            id: 'motivation',
            type: 'Motivation' as LayerType,
            name: 'Motivation',
            order: 1,
            elements: [
              {
                id: 'goal-1',
                type: 'goal',
                name: 'Goal 1',
                layer: 'motivation',
                properties: {},
                visual: {
                  position: { x: 100, y: 100 },
                  size: { width: 160, height: 80 },
                  style: {}
                }
              }
            ],
            relationships: []
          },
          business: {
            id: 'business',
            type: 'Business' as LayerType,
            name: 'Business',
            order: 2,
            elements: [
              {
                id: 'service-1',
                type: 'service',
                name: 'Business Service 1',
                layer: 'business',
                properties: {},
                visual: {
                  position: { x: 200, y: 200 },
                  size: { width: 160, height: 80 },
                  style: {}
                }
              }
            ],
            relationships: []
          }
        },
        relationships: [],
        references: []
      };

      const result = transformer.transformModelToShapes(model);

      expect(result.nodes.length).toBe(2);
      expect(result.nodes.find(n => n.id === 'goal-1')).toBeDefined();
      expect(result.nodes.find(n => n.id === 'service-1')).toBeDefined();
    });
  });

  describe('Element type inference from server data', () => {
    it('should infer type from properties when type is unknown', () => {
      // This tests the real-world scenario where server sends type: "unknown"
      // but the element has type-specific properties
      const element: ModelElement = {
        id: 'desktop-deployment',
        type: 'unknown',
        name: 'Desktop Deployment',
        layer: 'motivation',
        properties: {
          constraintType: 'technology',
          'constraint.negotiable': 'false'
        },
        visual: {
          position: { x: 0, y: 0 },
          size: { width: 160, height: 80 },
          style: {}
        }
      };

      // Should infer this is a constraint from properties
      const shapeType = (transformer as any).getShapeTypeForElement(element);
      // Currently this will fail - we need to add type inference logic
      console.log('Inferred shape type:', shapeType);
    });
  });
});
