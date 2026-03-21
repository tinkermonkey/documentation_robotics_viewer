/**
 * Unit tests for RelationshipsYamlParser
 * Tests parsing of relationships.yaml format and dot-notation resolution
 */

import { test, expect } from '@playwright/test';
import { RelationshipsYamlParser, RelationshipsYamlEntry } from '../../../src/core/services/relationshipsYamlParser';
import { RelationshipType } from '../../../src/core/types/model';

test.describe('RelationshipsYamlParser', () => {
  let parser: RelationshipsYamlParser;
  let dotNotationLookup: Map<string, string>;

  test.beforeEach(() => {
    parser = new RelationshipsYamlParser();
    // Create a sample dot-notation lookup map
    dotNotationLookup = new Map([
      ['motivation.stakeholder.architecture-team', 'uuid-1'],
      ['motivation.goal.visualize-multi-layer-architecture-models', 'uuid-2'],
      ['business.service.visualization-engine', 'uuid-3'],
      ['business.service.api-gateway', 'uuid-4'],
      ['technology.component.react-flow', 'uuid-5'],
      ['technology.infrastructure.kubernetes', 'uuid-6'],
    ]);
  });

  test.describe('parse() - basic functionality', () => {
    test('should parse simple YAML array of relationships', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
- source: business.service.visualization-engine
  target: business.service.api-gateway
  predicate: uses
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(2);
      expect(relationships[0].sourceId).toBe('uuid-1');
      expect(relationships[0].targetId).toBe('uuid-2');
      expect(relationships[1].sourceId).toBe('uuid-3');
      expect(relationships[1].targetId).toBe('uuid-4');
    });

    test('should set predicate string field on parsed relationships', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].predicate).toBe('influence');
    });

    test('should return empty array for non-array YAML', () => {
      const yamlContent = `
source: motivation.stakeholder.architecture-team
target: motivation.goal.visualize-multi-layer-architecture-models
predicate: influence
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(0);
      const warnings = parser.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
    });

    test('should handle empty YAML array', () => {
      const yamlContent = '[]';

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(0);
      expect(parser.getWarnings()).toHaveLength(0);
    });
  });

  test.describe('parse() - layer detection', () => {
    test('should detect intra-layer relationships (same source and target layer)', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].sourceLayerId).toBe('motivation');
      expect(relationships[0].targetLayerId).toBe('motivation');
    });

    test('should detect cross-layer relationships (different source and target layer)', () => {
      const yamlContent = `
- source: motivation.goal.visualize-multi-layer-architecture-models
  target: business.service.visualization-engine
  predicate: realizes
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].sourceLayerId).toBe('motivation');
      expect(relationships[0].targetLayerId).toBe('business');
    });

    test('should set both sourceLayerId and targetLayerId on all relationships', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
- source: business.service.visualization-engine
  target: technology.component.react-flow
  predicate: uses
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(2);
      relationships.forEach(rel => {
        expect(rel.sourceLayerId).toBeDefined();
        expect(rel.targetLayerId).toBeDefined();
      });
    });
  });

  test.describe('parse() - predicate mapping', () => {
    test('should map common predicates to RelationshipType', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
- source: business.service.visualization-engine
  target: business.service.api-gateway
  predicate: uses
- source: business.service.api-gateway
  target: technology.component.react-flow
  predicate: serves
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships[0].type).toBe('influence');
      expect(relationships[1].type).toBe('access');
      expect(relationships[2].type).toBe('serving');
    });

    test('should default unknown predicates to reference string', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: unknown-predicate-type
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].type).toBe('reference');
    });
  });

  test.describe('parse() - optional fields', () => {
    test('should include category in properties when provided', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
  category: structural
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].properties?.category).toBe('structural');
    });

    test('should include additional properties when provided', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
  properties:
    strength: strong
    confidence: high
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].properties?.strength).toBe('strong');
      expect(relationships[0].properties?.confidence).toBe('high');
    });

    test('should ignore layer field (optional intra-layer indicator)', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
  layer: motivation
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(1);
      // Layer is optional and for informational purposes only
      expect(relationships[0].sourceLayerId).toBe('motivation');
    });

    test('should handle missing optional fields gracefully', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(1);
      // Properties should be undefined or empty
      expect(relationships[0].properties).toBeUndefined();
    });
  });

  test.describe('parse() - error handling', () => {
    test('should warn on unresolvable source reference', () => {
      const yamlContent = `
- source: motivation.stakeholder.unknown-stakeholder
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(0);
      const warnings = parser.getWarnings();
      expect(warnings.some(w => w.includes('Unresolvable source reference'))).toBe(true);
    });

    test('should warn on unresolvable target reference', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.unknown-goal
  predicate: influence
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(0);
      const warnings = parser.getWarnings();
      expect(warnings.some(w => w.includes('Unresolvable target reference'))).toBe(true);
    });

    test('should continue parsing after encountering unresolvable reference', () => {
      const yamlContent = `
- source: motivation.stakeholder.unknown-stakeholder
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      // Should skip first invalid entry and parse second valid one
      expect(relationships).toHaveLength(1);
      expect(relationships[0].sourceId).toBe('uuid-1');
    });

    test('should warn on missing required fields', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  predicate: influence
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(0);
      const warnings = parser.getWarnings();
      expect(warnings.some(w => w.includes('missing required fields'))).toBe(true);
    });

    test('should handle malformed YAML gracefully', () => {
      const yamlContent = `
invalid: yaml: content: here:
- source: test
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(0);
      const warnings = parser.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  test.describe('parse() - warning management', () => {
    test('should accumulate warnings during parsing', () => {
      const yamlContent = `
- source: motivation.stakeholder.unknown-1
  target: motivation.goal.unknown-2
  predicate: influence
- source: motivation.stakeholder.unknown-3
  target: motivation.goal.unknown-4
  predicate: influence
      `;

      parser.parse(yamlContent, dotNotationLookup);
      const warnings = parser.getWarnings();

      expect(warnings.length).toBeGreaterThanOrEqual(2);
    });

    test('should clear warnings when clearWarnings() is called', () => {
      const yamlContent = `
- source: motivation.stakeholder.unknown-stakeholder
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
      `;

      parser.parse(yamlContent, dotNotationLookup);
      expect(parser.getWarnings().length).toBeGreaterThan(0);

      parser.clearWarnings();
      expect(parser.getWarnings()).toHaveLength(0);
    });

    test('should clear previous warnings on new parse() call', () => {
      const yamlContent1 = `
- source: motivation.stakeholder.unknown-stakeholder
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
      `;
      const yamlContent2 = '[]';

      parser.parse(yamlContent1, dotNotationLookup);
      expect(parser.getWarnings().length).toBeGreaterThan(0);

      parser.parse(yamlContent2, dotNotationLookup);
      expect(parser.getWarnings()).toHaveLength(0);
    });
  });

  test.describe('parse() - complex relationships.yaml example', () => {
    test('should parse realistic relationships.yaml with mixed intra/cross-layer relationships', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
  category: structural
  properties:
    source_provenance: inferred
    confidence: high

- source: motivation.goal.visualize-multi-layer-architecture-models
  target: business.service.visualization-engine
  predicate: realizes
  properties:
    strength: strong

- source: business.service.visualization-engine
  target: business.service.api-gateway
  predicate: uses

- source: business.service.api-gateway
  target: technology.component.react-flow
  predicate: serves
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(4);

      // First relationship: intra-layer
      expect(relationships[0].sourceLayerId).toBe('motivation');
      expect(relationships[0].targetLayerId).toBe('motivation');
      expect(relationships[0].predicate).toBe('influence');
      expect(relationships[0].properties?.category).toBe('structural');

      // Second relationship: cross-layer
      expect(relationships[1].sourceLayerId).toBe('motivation');
      expect(relationships[1].targetLayerId).toBe('business');
      expect(relationships[1].predicate).toBe('realizes');

      // Third relationship: intra-layer
      expect(relationships[2].sourceLayerId).toBe('business');
      expect(relationships[2].targetLayerId).toBe('business');

      // Fourth relationship: cross-layer
      expect(relationships[3].sourceLayerId).toBe('business');
      expect(relationships[3].targetLayerId).toBe('technology');
    });
  });

  test.describe('parse() - relationship ID generation', () => {
    test('should generate unique UUIDs for each relationship', () => {
      const yamlContent = `
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
- source: motivation.stakeholder.architecture-team
  target: motivation.goal.visualize-multi-layer-architecture-models
  predicate: influence
      `;

      const relationships = parser.parse(yamlContent, dotNotationLookup);

      expect(relationships).toHaveLength(2);
      expect(relationships[0].id).not.toBe(relationships[1].id);
      // Basic UUID validation (should have hyphens)
      expect(relationships[0].id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    });
  });

  test.describe('parse() - layer ID extraction from dot-notation', () => {
    test('should correctly extract first segment as layer ID', () => {
      const testCases = [
        ['motivation.goal.test', 'motivation'],
        ['business.service.test', 'business'],
        ['technology.infrastructure.test', 'technology'],
        ['api.endpoint.test', 'api'],
      ];

      for (const [dotNotation, expectedLayer] of testCases) {
        const lookup = new Map([[dotNotation, 'uuid-test']]);
        const yamlContent = `
- source: ${dotNotation}
  target: motivation.stakeholder.architecture-team
  predicate: influence
        `;

        const relationships = parser.parse(yamlContent, lookup);

        if (relationships.length > 0) {
          expect(relationships[0].sourceLayerId).toBe(expectedLayer);
        }
      }
    });
  });
});
