/**
 * Unit tests for crossLayerLinksExtractor
 * - referenceToEdge() bidirectional arrow logic
 * - extractCrossLayerReferences() visibility and filter constraints
 * - referencesToEdges() reference-to-edge conversion
 *
 * Tests cover:
 * 1. referenceToEdge() - arrow directionality based on predicateDefinition semantics
 * 2. extractCrossLayerReferences() - filtering by visibility, target layers, and relationship types
 * 3. referencesToEdges() - batch conversion with null filtering
 */

import { test, expect } from "@playwright/test";
import {
  referenceToEdge,
  extractCrossLayerReferences,
  referencesToEdges,
} from "../../../src/core/services/crossLayerLinksExtractor";
import {
  Reference,
  PredicateDefinition,
  MetaModel,
} from "../../../src/core/types/model";
import { LayerType } from "../../../src/core/types/layers";

test.describe("CrossLayerLinksExtractor - referenceToEdge", () => {
  const mockModel: MetaModel = {
    id: "test-model",
    name: "Test Model",
    version: "1.0.0",
    description: "Test",
    layers: {},
    references: [],
    allRelationships: [],
    allElements: [],
    relationshipsYaml: [],
  };

  const mockNodeIdResolver = (elementId: string) => `node-${elementId}`;

  test("should render unidirectional arrow when directionality is not bidirectional", () => {
    const reference: Reference = {
      id: "ref-1",
      source: { layerId: LayerType.Motivation, elementId: "elem-1" },
      target: { layerId: LayerType.Business, elementId: "elem-2" },
      type: "reference",
      predicate: "uses",
      predicateDefinition: {
        id: "uses",
        name: "Uses",
        semantics: {
          directionality: "unidirectional",
        },
      } as PredicateDefinition,
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.markerEnd).toBeDefined();
    expect(edge!.markerStart).toBeUndefined();
  });

  test("should render bidirectional arrows when directionality is bidirectional", () => {
    const reference: Reference = {
      id: "ref-1",
      source: { layerId: LayerType.Motivation, elementId: "elem-1" },
      target: { layerId: LayerType.Business, elementId: "elem-2" },
      type: "reference",
      predicate: "communicatesWith",
      predicateDefinition: {
        id: "communicatesWith",
        name: "Communicates With",
        semantics: {
          directionality: "bidirectional",
        },
      } as PredicateDefinition,
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.markerEnd).toBeDefined();
    expect(edge!.markerStart).toBeDefined();
    expect(edge!.markerStart!.type).toBe("arrowclosed");
  });

  test("should render unidirectional arrow when predicateDefinition is missing", () => {
    const reference: Reference = {
      id: "ref-1",
      source: { layerId: LayerType.Motivation, elementId: "elem-1" },
      target: { layerId: LayerType.Business, elementId: "elem-2" },
      type: "reference",
      predicate: "references",
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.markerEnd).toBeDefined();
    expect(edge!.markerStart).toBeUndefined();
  });

  test("should render unidirectional arrow when semantics is missing", () => {
    const reference: Reference = {
      id: "ref-1",
      source: { layerId: LayerType.Motivation, elementId: "elem-1" },
      target: { layerId: LayerType.Business, elementId: "elem-2" },
      type: "reference",
      predicate: "uses",
      predicateDefinition: {
        id: "uses",
        name: "Uses",
      } as PredicateDefinition,
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.markerEnd).toBeDefined();
    expect(edge!.markerStart).toBeUndefined();
  });

  test("should include predicateDefinition in edge data", () => {
    const predicateDefinition: PredicateDefinition = {
      id: "uses",
      name: "Uses",
      semantics: {
        directionality: "bidirectional",
      },
    } as PredicateDefinition;

    const reference: Reference = {
      id: "ref-1",
      source: { layerId: LayerType.Motivation, elementId: "elem-1" },
      target: { layerId: LayerType.Business, elementId: "elem-2" },
      type: "reference",
      predicate: "uses",
      predicateDefinition,
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.data).toBeDefined();
    expect(edge!.data.predicateDefinition).toEqual(predicateDefinition);
  });

  test("should use predicate string as edge label", () => {
    const reference: Reference = {
      id: "ref-1",
      source: { layerId: LayerType.Motivation, elementId: "elem-1" },
      target: { layerId: LayerType.Business, elementId: "elem-2" },
      type: "reference",
      predicate: "custom-predicate",
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.label).toBe("custom-predicate");
  });

  test("should fall back to type when predicate is missing", () => {
    const reference: Reference = {
      id: "ref-1",
      source: { layerId: LayerType.Motivation, elementId: "elem-1" },
      target: { layerId: LayerType.Business, elementId: "elem-2" },
      type: "reference",
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.label).toBe("reference");
  });
});

test.describe("CrossLayerLinksExtractor - extractCrossLayerReferences", () => {
  test("should filter out same-layer references", () => {
    const model: MetaModel = {
      id: "test-model",
      name: "Test Model",
      version: "1.0.0",
      description: "Test",
      layers: {},
      references: [
        {
          id: "ref-1",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Business, elementId: "elem-2" },
          type: "reference",
        },
        {
          id: "ref-2",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Api, elementId: "elem-3" },
          type: "reference",
        },
      ],
      allRelationships: [],
      allElements: [],
      relationshipsYaml: [],
    };

    const result = extractCrossLayerReferences(
      model,
      true,
      new Set(),
      new Set(),
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("ref-2");
  });

  test("should return empty array when visible is false", () => {
    const model: MetaModel = {
      id: "test-model",
      name: "Test Model",
      version: "1.0.0",
      description: "Test",
      layers: {},
      references: [
        {
          id: "ref-1",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Api, elementId: "elem-3" },
          type: "reference",
        },
      ],
      allRelationships: [],
      allElements: [],
      relationshipsYaml: [],
    };

    const result = extractCrossLayerReferences(
      model,
      false,
      new Set(),
      new Set(),
    );

    expect(result).toHaveLength(0);
  });

  test("should return empty array when model is null", () => {
    const result = extractCrossLayerReferences(
      null,
      true,
      new Set(),
      new Set(),
    );

    expect(result).toHaveLength(0);
  });

  test("should apply target layer filters", () => {
    const model: MetaModel = {
      id: "test-model",
      name: "Test Model",
      version: "1.0.0",
      description: "Test",
      layers: {},
      references: [
        {
          id: "ref-1",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Api, elementId: "elem-3" },
          type: "reference",
        },
        {
          id: "ref-2",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Technology, elementId: "elem-4" },
          type: "reference",
        },
        {
          id: "ref-3",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.DataModel, elementId: "elem-5" },
          type: "reference",
        },
      ],
      allRelationships: [],
      allElements: [],
      relationshipsYaml: [],
    };

    const result = extractCrossLayerReferences(
      model,
      true,
      new Set([LayerType.Api, LayerType.Technology]),
      new Set(),
    );

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id).sort()).toEqual(["ref-1", "ref-2"].sort());
  });

  test("should apply relationship type filters", () => {
    const model: MetaModel = {
      id: "test-model",
      name: "Test Model",
      version: "1.0.0",
      description: "Test",
      layers: {},
      references: [
        {
          id: "ref-1",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Api, elementId: "elem-3" },
          type: "reference",
        },
        {
          id: "ref-2",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Technology, elementId: "elem-4" },
          type: "realization",
        },
        {
          id: "ref-3",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.DataModel, elementId: "elem-5" },
          type: "reference",
        },
      ],
      allRelationships: [],
      allElements: [],
      relationshipsYaml: [],
    };

    const result = extractCrossLayerReferences(
      model,
      true,
      new Set(),
      new Set(["reference"]),
    );

    expect(result).toHaveLength(2);
    expect(result.every((r) => r.type === "reference")).toBe(true);
  });

  test("should combine target layer and relationship type filters (AND logic)", () => {
    const model: MetaModel = {
      id: "test-model",
      name: "Test Model",
      version: "1.0.0",
      description: "Test",
      layers: {},
      references: [
        {
          id: "ref-1",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Api, elementId: "elem-3" },
          type: "reference",
        },
        {
          id: "ref-2",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Api, elementId: "elem-4" },
          type: "realization",
        },
        {
          id: "ref-3",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Technology, elementId: "elem-5" },
          type: "reference",
        },
      ],
      allRelationships: [],
      allElements: [],
      relationshipsYaml: [],
    };

    const result = extractCrossLayerReferences(
      model,
      true,
      new Set([LayerType.Api]),
      new Set(["reference"]),
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("ref-1");
  });

  test("should handle empty filter sets (all references included)", () => {
    const model: MetaModel = {
      id: "test-model",
      name: "Test Model",
      version: "1.0.0",
      description: "Test",
      layers: {},
      references: [
        {
          id: "ref-1",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Api, elementId: "elem-3" },
          type: "reference",
        },
        {
          id: "ref-2",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Technology, elementId: "elem-4" },
          type: "realization",
        },
      ],
      allRelationships: [],
      allElements: [],
      relationshipsYaml: [],
    };

    const result = extractCrossLayerReferences(
      model,
      true,
      new Set(),
      new Set(),
    );

    expect(result).toHaveLength(2);
  });

  test("should skip references when both filter sets are non-empty and reference does not match", () => {
    const model: MetaModel = {
      id: "test-model",
      name: "Test Model",
      version: "1.0.0",
      description: "Test",
      layers: {},
      references: [
        {
          id: "ref-1",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Api, elementId: "elem-3" },
          type: "reference",
        },
      ],
      allRelationships: [],
      allElements: [],
      relationshipsYaml: [],
    };

    const result = extractCrossLayerReferences(
      model,
      true,
      new Set([LayerType.Technology]),
      new Set(["reference"]),
    );

    expect(result).toHaveLength(0);
  });

  test("should handle references with missing target layer ID gracefully", () => {
    const model: MetaModel = {
      id: "test-model",
      name: "Test Model",
      version: "1.0.0",
      description: "Test",
      layers: {},
      references: [
        {
          id: "ref-1",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { elementId: "elem-3" } as any,
          type: "reference",
        },
        {
          id: "ref-2",
          source: { layerId: LayerType.Business, elementId: "elem-1" },
          target: { layerId: LayerType.Api, elementId: "elem-3" },
          type: "reference",
        },
      ],
      allRelationships: [],
      allElements: [],
      relationshipsYaml: [],
    };

    const result = extractCrossLayerReferences(
      model,
      true,
      new Set(),
      new Set(),
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("ref-2");
  });
});

test.describe("CrossLayerLinksExtractor - referencesToEdges", () => {
  const mockModel: MetaModel = {
    id: "test-model",
    name: "Test Model",
    version: "1.0.0",
    description: "Test",
    layers: {},
    references: [],
    allRelationships: [],
    allElements: [],
    relationshipsYaml: [],
  };

  const mockNodeIdResolver = (elementId: string) => {
    const mapping: Record<string, string> = {
      "elem-1": "node-elem-1",
      "elem-3": "node-elem-3",
      "elem-4": "node-elem-4",
    };
    return mapping[elementId];
  };

  test("should convert valid references to edges", () => {
    const references: Reference[] = [
      {
        id: "ref-1",
        source: { layerId: LayerType.Business, elementId: "elem-1" },
        target: { layerId: LayerType.Api, elementId: "elem-3" },
        type: "reference",
        predicate: "realizes",
      },
    ];

    const edges = referencesToEdges(references, mockModel, mockNodeIdResolver);

    expect(edges).toHaveLength(1);
    expect(edges[0]?.id).toContain("ref-1");
    expect(edges[0]?.source).toBe("node-elem-1");
    expect(edges[0]?.target).toBe("node-elem-3");
  });

  test("should filter out invalid references that return null from referenceToEdge", () => {
    const references: Reference[] = [
      {
        id: "ref-1",
        source: { layerId: LayerType.Business, elementId: "elem-1" },
        target: { layerId: LayerType.Api, elementId: "elem-3" },
        type: "reference",
      },
      {
        id: "ref-2",
        source: { layerId: LayerType.Business, elementId: "elem-1" },
        target: { layerId: LayerType.Api } as any,
        type: "reference",
      },
    ];

    const edges = referencesToEdges(references, mockModel, mockNodeIdResolver);

    expect(edges).toHaveLength(1);
    expect(edges[0]?.id).toContain("ref-1");
  });

  test("should handle empty reference array", () => {
    const edges = referencesToEdges([], mockModel, mockNodeIdResolver);

    expect(edges).toHaveLength(0);
  });

  test("should skip edges when nodeIdResolver returns undefined for source", () => {
    const references: Reference[] = [
      {
        id: "ref-1",
        source: { layerId: LayerType.Business, elementId: "unknown-elem" },
        target: { layerId: LayerType.Api, elementId: "elem-3" },
        type: "reference",
      },
    ];

    const edges = referencesToEdges(references, mockModel, mockNodeIdResolver);

    expect(edges).toHaveLength(0);
  });

  test("should skip edges when nodeIdResolver returns undefined for target", () => {
    const references: Reference[] = [
      {
        id: "ref-1",
        source: { layerId: LayerType.Business, elementId: "elem-1" },
        target: { layerId: LayerType.Api, elementId: "unknown-elem" },
        type: "reference",
      },
    ];

    const edges = referencesToEdges(references, mockModel, mockNodeIdResolver);

    expect(edges).toHaveLength(0);
  });

  test("should return empty array when all references fail validation", () => {
    const references: Reference[] = [
      {
        id: "ref-1",
        source: { layerId: LayerType.Business, elementId: "unknown-1" },
        target: { layerId: LayerType.Api, elementId: "unknown-3" },
        type: "reference",
      },
    ];

    const edges = referencesToEdges(references, mockModel, mockNodeIdResolver);

    expect(edges).toHaveLength(0);
  });
});
