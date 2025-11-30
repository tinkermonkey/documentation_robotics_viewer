# Data Model

## Internal Representation

### Core Model Structure

```typescript
// Root model containing all layers
interface MetaModel {
  id: string;
  name: string;
  version: string;
  description?: string;
  
  // Layers
  layers: Map<LayerType, Layer>;
  
  // Cross-layer references
  references: Reference[];
  
  // Metadata
  metadata: ModelMetadata;
}

// Individual layer
interface Layer {
  id: string;
  type: LayerType;
  name: string;
  elements: ModelElement[];
  relationships: Relationship[];
  
  // Layer-specific data
  data: LayerData;
  
  // Visual properties
  visual: LayerVisualConfig;
}

// Layer types matching your architecture
enum LayerType {
  Motivation = 'motivation',
  Business = 'business',
  Security = 'security',
  Application = 'application',
  Technology = 'technology',
  API = 'api',
  DataModel = 'data-model',
  DataStore = 'data-store',
  UX = 'ux',
  Navigation = 'navigation',
  APM = 'apm'
}
```

### Model Elements

```typescript
// Base element interface
interface ModelElement {
  id: string;
  type: string;
  name: string;
  description?: string;
  layerId: string;
  
  // Properties vary by element type
  properties: Record<string, any>;
  
  // Visual representation
  visual: ElementVisual;
  
  // Relationships
  relationships: {
    incoming: string[];
    outgoing: string[];
  };
  
  // External references
  references: {
    archimateRef?: string;
    specFile?: string;
    schemaRef?: string;
    apiOperationId?: string;
  };
}

// Visual properties
interface ElementVisual {
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    backgroundColor?: string;
    borderColor?: string;
    borderStyle?: string;
    icon?: string;
    shape?: ShapeType;
  };
  
  // For auto-layout
  layoutHints?: {
    rank?: number;
    group?: string;
    alignment?: 'left' | 'center' | 'right';
  };
}
```

### Relationships

```typescript
interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  
  // Relationship properties
  properties?: Record<string, any>;
  
  // Visual
  visual?: {
    routingPoints?: Point[];
    style?: EdgeStyle;
    label?: string;
  };
}

enum RelationshipType {
  // ArchiMate relationships
  Composition = 'composition',
  Aggregation = 'aggregation',
  Assignment = 'assignment',
  Realization = 'realization',
  Serving = 'serving',
  Access = 'access',
  Influence = 'influence',
  Triggering = 'triggering',
  Flow = 'flow',
  
  // Custom relationships
  Reference = 'reference',
  Navigation = 'navigation',
  SecurityControl = 'security-control',
  DataFlow = 'data-flow',
  StateTransition = 'state-transition'
}
```

## Layer-Specific Models

### Security Layer Elements

```typescript
interface SecurityElement extends ModelElement {
  type: 'Role' | 'Permission' | 'Policy' | 'Resource';
  
  properties: {
    // Role properties
    level?: number;
    inheritsFrom?: string[];
    
    // Permission properties
    scope?: 'global' | 'resource' | 'attribute';
    resource?: string;
    action?: string;
    
    // Policy properties
    rules?: PolicyRule[];
    priority?: number;
    
    // Resource properties
    operations?: ResourceOperation[];
  };
}
```

### UX Layer Elements

```typescript
interface UXElement extends ModelElement {
  type: 'Screen' | 'State' | 'Component' | 'Transition';
  
  properties: {
    // Screen properties
    layout?: LayoutType;
    sections?: LayoutSection[];
    
    // State properties
    initial?: boolean;
    onEnter?: StateAction[];
    onExit?: StateAction[];
    
    // Component properties
    componentType?: UIComponentType;
    dataBinding?: string;
    
    // Transition properties
    from?: string;
    to?: string;
    trigger?: TriggerType;
  };
}
```

### API Layer Elements

```typescript
interface APIElement extends ModelElement {
  type: 'Endpoint' | 'Operation' | 'Schema' | 'Response';
  
  properties: {
    // Endpoint properties
    path?: string;
    methods?: string[];
    
    // Operation properties
    operationId?: string;
    method?: string;
    parameters?: Parameter[];
    
    // Schema properties
    schemaType?: 'object' | 'array' | 'string' | 'number' | 'boolean';
    schemaRef?: string;
    
    // Response properties
    statusCode?: number;
    contentType?: string;
  };
}
```

## Data Transformation

### From Source Files to Internal Model

```typescript
class ModelParser {
  // Parse ArchiMate XML
  parseArchiMate(xml: string): Layer {
    const doc = parseXML(xml);
    const elements = this.extractArchiMateElements(doc);
    const relationships = this.extractArchiMateRelationships(doc);
    
    return {
      type: LayerType.Application, // or other layers
      elements,
      relationships,
      // ...
    };
  }
  
  // Parse OpenAPI YAML
  parseOpenAPI(yaml: string): Layer {
    const spec = parseYAML(yaml);
    const elements = this.extractAPIElements(spec);
    
    return {
      type: LayerType.API,
      elements,
      // ...
    };
  }
  
  // Parse custom YAML specs
  parseCustomSpec(yaml: string, type: LayerType): Layer {
    const spec = parseYAML(yaml);
    
    switch(type) {
      case LayerType.Security:
        return this.parseSecuritySpec(spec);
      case LayerType.UX:
        return this.parseUXSpec(spec);
      case LayerType.Navigation:
        return this.parseNavigationSpec(spec);
      default:
        throw new Error(`Unknown spec type: ${type}`);
    }
  }
}
```

### From Internal Model to React Flow Nodes

```typescript
class NodeTransformer {
  toReactFlowNode(element: ModelElement): Node {
    const nodeType = this.getNodeType(element);
    
    return {
      id: element.id,
      type: nodeType,
      position: {
        x: element.visual.position.x,
        y: element.visual.position.y
      },
      data: {
        label: element.name,
        layerId: element.layerId,
        modelElement: element,
        
        // Style
        fill: element.visual.style.backgroundColor,
        stroke: element.visual.style.borderColor,
        
        // Custom props
        elementType: element.type,
      },
      // React Flow specific
      draggable: true,
      selectable: true,
    };
  }
  
  toReactFlowEdge(relationship: Relationship): Edge {
    return {
      id: relationship.id,
      type: 'elbow', // or 'default', 'smoothstep'
      source: relationship.sourceId,
      target: relationship.targetId,
      
      data: {
        // Custom props
        relationshipType: relationship.type,
        modelRelationship: relationship,
      },
      
      style: {
        stroke: this.getEdgeColor(relationship.type),
        strokeDasharray: this.getDashStyle(relationship.type),
      },
      
      label: relationship.visual?.label,
    };
  }
}
```

## Cross-Reference Management

```typescript
interface Reference {
  id: string;
  type: ReferenceType;
  
  // Source and target
  source: {
    elementId: string;
    layerId: string;
    property?: string;
  };
  
  target: {
    elementId?: string;
    layerId?: string;
    file?: string;
    path?: string; // JSONPath or similar
  };
  
  // Validation
  isValid?: boolean;
  validationError?: string;
}

enum ReferenceType {
  ArchiMateProperty = 'archimate-property',
  APIOperation = 'api-operation',
  SchemaReference = 'schema-reference',
  UXAction = 'ux-action',
  NavigationRoute = 'navigation-route',
  SecurityPermission = 'security-permission',
}

class ReferenceManager {
  private references: Map<string, Reference[]> = new Map();
  
  // Find all references for an element
  getReferences(elementId: string): Reference[] {
    return this.references.get(elementId) || [];
  }
  
  // Validate all references
  validateReferences(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    for (const [elementId, refs] of this.references) {
      for (const ref of refs) {
        const result = this.validateReference(ref);
        if (!result.isValid) {
          results.push(result);
        }
      }
    }
    
    return results;
  }
  
  // Build reference graph for visualization
  buildReferenceGraph(): Graph {
    const nodes = new Set<string>();
    const edges: Edge[] = [];
    
    for (const [source, refs] of this.references) {
      nodes.add(source);
      
      for (const ref of refs) {
        if (ref.target.elementId) {
          nodes.add(ref.target.elementId);
          edges.push({
            source,
            target: ref.target.elementId,
            type: ref.type,
          });
        }
      }
    }
    
    return { nodes: Array.from(nodes), edges };
  }
}
```

## Search Index

```typescript
interface SearchIndex {
  // Text search
  textIndex: Map<string, Set<string>>; // term -> element IDs
  
  // Type index
  typeIndex: Map<string, Set<string>>; // type -> element IDs
  
  // Property index
  propertyIndex: Map<string, Map<any, Set<string>>>; // property -> value -> element IDs
  
  // Reference index
  referenceIndex: Map<string, Set<string>>; // element -> referenced elements
}

class SearchEngine {
  private index: SearchIndex;
  
  // Build index from model
  buildIndex(model: MetaModel): void {
    for (const layer of model.layers.values()) {
      for (const element of layer.elements) {
        this.indexElement(element);
      }
    }
  }
  
  // Search methods
  search(query: string, options?: SearchOptions): SearchResult[] {
    const terms = this.tokenize(query);
    const results = new Map<string, SearchResult>();
    
    // Search text index
    for (const term of terms) {
      const matches = this.textIndex.get(term.toLowerCase());
      if (matches) {
        for (const id of matches) {
          this.addResult(results, id, 'text', term);
        }
      }
    }
    
    // Apply filters
    if (options?.type) {
      this.filterByType(results, options.type);
    }
    
    if (options?.layer) {
      this.filterByLayer(results, options.layer);
    }
    
    return Array.from(results.values())
      .sort((a, b) => b.score - a.score);
  }
}
```

## Validation Model

```typescript
interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  
  // Rule implementation
  validate: (element: ModelElement, context: ValidationContext) => ValidationResult[];
}

interface ValidationResult {
  ruleId: string;
  elementId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  
  // Location in source file
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  
  // Suggested fix
  fix?: {
    description: string;
    apply: () => void;
  };
}

class ModelValidator {
  private rules: Map<LayerType, ValidationRule[]> = new Map();
  
  validate(model: MetaModel): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Validate each layer
    for (const [type, layer] of model.layers) {
      const layerRules = this.rules.get(type) || [];
      
      for (const element of layer.elements) {
        for (const rule of layerRules) {
          const ruleResults = rule.validate(element, { model, layer });
          results.push(...ruleResults);
        }
      }
    }
    
    // Cross-layer validation
    results.push(...this.validateCrossReferences(model));
    results.push(...this.validateCompleteness(model));
    
    return results;
  }
}
```