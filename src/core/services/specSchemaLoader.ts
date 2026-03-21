/**
 * Spec Schema Loader
 *
 * Stateless service that loads and indexes spec schemas from layer files (.dr/spec/*.json).
 * Parses node schemas and relationship schemas for each layer.
 */

import { SpecLayerData, SpecNodeRelationship } from '../types/model';

/**
 * Load and index spec schemas from layer files
 *
 * Each layer file (motivation.json, business.json, etc.) contains:
 * - layer: Layer metadata (id, number, name, description)
 * - nodeSchemas: Record of node type -> JSON schema
 * - relationshipSchemas: Object of relationship definitions
 *
 * Example structure:
 * ```json
 * {
 *   "specVersion": "0.8.3",
 *   "layer": {
 *     "id": "motivation",
 *     "number": 1,
 *     "name": "Motivation Layer",
 *     "description": "..."
 *   },
 *   "nodeSchemas": {
 *     "goal": { ... },
 *     "requirement": { ... }
 *   },
 *   "relationshipSchemas": {
 *     "motivation.goal.supports.motivation.goal": { ... }
 *   }
 * }
 * ```
 *
 * @param specFiles - Record of filename -> parsed JSON objects
 * @returns Record keyed by layer ID (e.g., 'motivation', 'business')
 */
export function loadSpecSchemas(
  specFiles: Record<string, unknown>
): Record<string, SpecLayerData> {
  const result: Record<string, SpecLayerData> = {};

  // Validate input
  if (!specFiles || typeof specFiles !== 'object') {
    console.warn('loadSpecSchemas: Invalid input, not an object');
    return result;
  }

  // Process each spec file
  for (const [filename, fileContent] of Object.entries(specFiles)) {
    // Skip manifest and base files
    if (filename === 'manifest.json' || filename === 'base.json') {
      continue;
    }

    // Skip non-layer files (anything without .json extension)
    if (!filename.endsWith('.json')) {
      continue;
    }

    if (!fileContent || typeof fileContent !== 'object') {
      console.warn(
        `loadSpecSchemas: Invalid file content for '${filename}', not an object`
      );
      continue;
    }

    const file = fileContent as Record<string, unknown>;

    // Extract layer info
    const layerObj = file.layer as Record<string, unknown> | undefined;
    if (!layerObj || typeof layerObj !== 'object') {
      console.warn(
        `loadSpecSchemas: No layer metadata found in '${filename}', skipping`
      );
      continue;
    }

    const layerId = layerObj.id as string | undefined;
    const layerNumber = layerObj.number as number | undefined;
    const layerName = layerObj.name as string | undefined;
    const layerDescription = layerObj.description as string | undefined;

    if (!layerId || layerNumber === undefined || !layerName) {
      console.warn(
        `loadSpecSchemas: Missing required layer fields in '${filename}', skipping`
      );
      continue;
    }

    // Extract node schemas
    const nodeSchemas = (file.nodeSchemas ||
      {}) as Record<string, unknown>;
    if (typeof nodeSchemas !== 'object') {
      console.warn(
        `loadSpecSchemas: Invalid nodeSchemas in '${filename}', expected object`
      );
      continue;
    }

    // Extract and parse relationship schemas
    const relationshipSchemasObj = file.relationshipSchemas ||
      {} as Record<string, unknown>;
    if (typeof relationshipSchemasObj !== 'object') {
      console.warn(
        `loadSpecSchemas: Invalid relationshipSchemas in '${filename}', expected object`
      );
      continue;
    }

    const relationshipSchemas: SpecNodeRelationship[] = [];

    for (const [, relSchema] of Object.entries(relationshipSchemasObj)) {
      if (!relSchema || typeof relSchema !== 'object') {
        continue;
      }

      const rel = relSchema as Record<string, unknown>;

      // Extract required relationship fields
      const id = rel.id as string | undefined;
      const sourceSpecNodeId = rel.source_spec_node_id as
        | string
        | undefined;
      const sourceLayer = rel.source_layer as string | undefined;
      const destinationSpecNodeId = rel.destination_spec_node_id as
        | string
        | undefined;
      const destinationLayer = rel.destination_layer as
        | string
        | undefined;
      const predicate = rel.predicate as string | undefined;
      const cardinality = rel.cardinality as string | undefined;
      const strength = rel.strength as string | undefined;
      const required = rel.required as boolean | undefined;

      // Validate required fields
      if (
        !id ||
        !sourceSpecNodeId ||
        !sourceLayer ||
        !destinationSpecNodeId ||
        !destinationLayer ||
        !predicate ||
        !cardinality ||
        !strength ||
        required === undefined
      ) {
        console.warn(
          `loadSpecSchemas: Missing required relationship fields in '${filename}', skipping relationship`
        );
        continue;
      }

      relationshipSchemas.push({
        id,
        sourceSpecNodeId,
        sourceLayer,
        destinationSpecNodeId,
        destinationLayer,
        predicate,
        cardinality,
        strength,
        required,
      });
    }

    // Build SpecLayerData
    const specLayerData: SpecLayerData = {
      layer: {
        id: layerId,
        number: layerNumber,
        name: layerName,
        description: layerDescription || '',
      },
      nodeSchemas,
      relationshipSchemas,
    };

    result[layerId] = specLayerData;
  }

  return result;
}
