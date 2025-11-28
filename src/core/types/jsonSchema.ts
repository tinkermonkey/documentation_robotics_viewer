import { ModelElement, Layer } from './model';

/**
 * JSON Schema element extracted from schema definitions
 * Represents a single definition (e.g., BusinessActor, BusinessRole)
 */
export interface JSONSchemaElement extends ModelElement {
  type: 'json-schema-element';
  schemaInfo: {
    // Source schema information
    schemaId: string;           // $id of parent schema
    definitionKey: string;      // Key from definitions object
    title: string;              // Definition title

    // Schema validation constraints
    required: string[];         // Required property names
    additionalProperties?: boolean;

    // Property definitions with full JSON Schema info
    properties: SchemaProperty[];

    // References to other schema elements
    references: SchemaReference[];
  };
}

/**
 * Individual property from a JSON Schema definition
 */
export interface SchemaProperty {
  name: string;
  type: string | string[];      // JSON Schema type(s)
  description?: string;

  // Constraints
  required: boolean;
  format?: string;              // e.g., "uuid", "email"
  pattern?: string;             // Regex pattern
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: any[];                 // Enumerated values

  // References
  ref?: string;                 // $ref value if this is a reference
  items?: {                     // For array types
    type?: string;
    ref?: string;
  };

  // Nested properties (for object types)
  properties?: SchemaProperty[];
}

/**
 * Reference from one schema element to another
 */
export interface SchemaReference {
  from: string;                 // Property name that contains the reference
  to: string;                   // Referenced schema element
  refType: 'definition' | 'external';  // Internal $ref or external schema
  cardinality: '1' | 'many';    // Single reference or array
}

/**
 * Parsed JSON Schema layer
 */
export interface JSONSchemaLayer extends Layer {
  type: 'json-schema';
  schemaMetadata: {
    schemaId: string;           // $id from schema file
    version: string;            // Schema draft version
    title: string;              // Layer title
    description?: string;
  };
}
