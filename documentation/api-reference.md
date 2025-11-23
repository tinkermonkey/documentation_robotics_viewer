# API Reference

## Core API

### MetaModelViewer

The root component for the meta-model viewer.

```typescript
interface MetaModelViewerProps {
  /**
   * Initial configuration for the viewer
   */
  config?: ViewerConfig;
  
  /**
   * Data source for the model
   */
  source?: DataSource;
  
  /**
   * Callback when viewer is ready
   */
  onReady?: (api: ViewerAPI) => void;
  
  /**
   * Callback for errors
   */
  onError?: (error: Error) => void;
  
  /**
   * Callback when selection changes
   */
  onSelectionChange?: (selection: ModelElement[]) => void;
  
  /**
   * Whether to show the layer panel
   * @default true
   */
  showLayerPanel?: boolean;
  
  /**
   * Whether to show the property panel
   * @default true
   */
  showPropertyPanel?: boolean;
  
  /**
   * Custom theme
   */
  theme?: Theme;
}

// Usage
<MetaModelViewer
  source={{
    type: 'files',
    files: [architMateFile, apiSpec, uxSpec],
  }}
  onReady={(api) => {
    console.log('Viewer ready', api);
  }}
  onSelectionChange={(selection) => {
    console.log('Selected:', selection);
  }}
/>
```

### ViewerAPI

Programmatic control of the viewer.

```typescript
interface ViewerAPI {
  // Model operations
  loadModel(source: DataSource): Promise<void>;
  getModel(): MetaModel;
  validateModel(): ValidationResult[];
  
  // Layer operations
  showLayer(layerId: string): void;
  hideLayer(layerId: string): void;
  toggleLayer(layerId: string): void;
  focusLayer(layerId: string): void;
  getLayerVisibility(): Map<string, boolean>;
  
  // Selection
  select(elementIds: string[]): void;
  clearSelection(): void;
  getSelection(): ModelElement[];
  
  // Navigation
  zoomTo(elementIds: string[]): void;
  zoomToFit(): void;
  panTo(x: number, y: number): void;
  centerView(): void;
  
  // Layout
  applyLayout(algorithm?: LayoutAlgorithm): Promise<void>;
  getAvailableLayouts(): LayoutAlgorithm[];
  
  // Search
  search(query: string, options?: SearchOptions): SearchResult[];
  highlightSearchResults(results: SearchResult[]): void;
  
  // Export
  exportView(format: ExportFormat): Promise<Blob>;
  exportModel(format: ModelFormat): Promise<string>;
  
  // Events
  on(event: ViewerEvent, handler: EventHandler): void;
  off(event: ViewerEvent, handler: EventHandler): void;
  
  // Advanced
  getEditor(): Editor;
  getStore(): ModelStore;
}
```

## Data Models

### DataSource

```typescript
type DataSource = 
  | FileDataSource
  | URLDataSource
  | DirectDataSource;

interface FileDataSource {
  type: 'files';
  files: File[] | FileList;
}

interface URLDataSource {
  type: 'urls';
  urls: string[];
}

interface DirectDataSource {
  type: 'direct';
  model: MetaModel;
}
```

### ViewerConfig

```typescript
interface ViewerConfig {
  // Layout
  defaultLayout?: LayoutAlgorithm;
  autoLayout?: boolean;
  layoutOptions?: LayoutOptions;
  
  // Layers
  visibleLayers?: string[];
  lockedLayers?: string[];
  layerOpacity?: Map<string, number>;
  
  // Interaction
  readOnly?: boolean;
  enableSearch?: boolean;
  enableExport?: boolean;
  
  // Performance
  maxElements?: number;
  enableVirtualization?: boolean;
  cacheLayouts?: boolean;
  
  // Appearance
  theme?: Theme;
  showGrid?: boolean;
  snapToGrid?: boolean;
}
```

### ModelElement

```typescript
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
  
  // Validation state
  validation?: {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
}
```

## Hooks

### useViewer

```typescript
/**
 * Access the viewer API and state
 */
function useViewer(): {
  api: ViewerAPI;
  state: ViewerState;
  ready: boolean;
}

// Usage
const MyComponent = () => {
  const { api, state, ready } = useViewer();
  
  useEffect(() => {
    if (ready) {
      api.zoomToFit();
    }
  }, [ready]);
  
  return <div>Elements: {state.elementCount}</div>;
};
```

### useModelStore

```typescript
/**
 * Access the model store directly
 */
function useModelStore(): ModelStore;

// Usage
const MyComponent = () => {
  const store = useModelStore();
  const element = store.getElementById('element-123');
  
  return <div>{element?.name}</div>;
};
```

### useSelection

```typescript
/**
 * Track and control selection
 */
function useSelection(): {
  selection: ModelElement[];
  select: (ids: string[]) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
}

// Usage
const MyComponent = () => {
  const { selection, select, clear } = useSelection();
  
  return (
    <div>
      <h3>Selected: {selection.length}</h3>
      <button onClick={clear}>Clear Selection</button>
    </div>
  );
};
```

### useLayerVisibility

```typescript
/**
 * Control layer visibility
 */
function useLayerVisibility(): {
  visible: Map<string, boolean>;
  toggle: (layerId: string) => void;
  show: (layerId: string) => void;
  hide: (layerId: string) => void;
  showOnly: (layerIds: string[]) => void;
}
```

## Components

### LayerPanel

```typescript
interface LayerPanelProps {
  /**
   * Whether to show layer statistics
   * @default true
   */
  showStatistics?: boolean;
  
  /**
   * Whether to allow layer grouping
   * @default true
   */
  enableGroups?: boolean;
  
  /**
   * Custom layer actions
   */
  customActions?: LayerAction[];
  
  /**
   * Callback when layer visibility changes
   */
  onVisibilityChange?: (layerId: string, visible: boolean) => void;
}
```

### PropertyPanel

```typescript
interface PropertyPanelProps {
  /**
   * Custom property renderers
   */
  renderers?: Map<string, PropertyRenderer>;
  
  /**
   * Whether to show validation issues
   * @default true
   */
  showValidation?: boolean;
  
  /**
   * Whether to allow property editing (Phase 3)
   * @default false
   */
  editable?: boolean;
}

type PropertyRenderer = (property: Property) => React.ReactNode;
```

### SearchBar

```typescript
interface SearchBarProps {
  /**
   * Placeholder text
   * @default "Search elements..."
   */
  placeholder?: string;
  
  /**
   * Search options
   */
  options?: SearchOptions;
  
  /**
   * Callback when search executes
   */
  onSearch?: (query: string, results: SearchResult[]) => void;
  
  /**
   * Whether to highlight results
   * @default true
   */
  highlightResults?: boolean;
}
```

## Utilities

### File Loaders

```typescript
/**
 * Load ArchiMate XML file
 */
async function loadArchiMate(file: File): Promise<ArchiMateModel>;

/**
 * Load OpenAPI specification
 */
async function loadOpenAPI(file: File): Promise<OpenAPISpec>;

/**
 * Load custom YAML specification
 */
async function loadYAMLSpec(file: File): Promise<CustomSpec>;

/**
 * Load JSON Schema
 */
async function loadJSONSchema(file: File): Promise<JSONSchema>;
```

### Layout Algorithms

```typescript
type LayoutAlgorithm = 
  | 'dagre'       // Hierarchical
  | 'force'       // Force-directed
  | 'tree'        // Tree
  | 'grid'        // Grid
  | 'layered'     // Multi-layer
  | 'circular'    // Circular
  | 'custom';     // Custom algorithm

interface LayoutOptions {
  // Common options
  padding?: number;
  animate?: boolean;
  duration?: number;
  
  // Algorithm-specific
  [key: string]: any;
}
```

### Validation

```typescript
interface ValidationResult {
  elementId: string;
  layerId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
  
  // Location in source
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

/**
 * Validate the entire model
 */
function validateModel(model: MetaModel): ValidationResult[];

/**
 * Validate a single layer
 */
function validateLayer(layer: Layer): ValidationResult[];

/**
 * Validate an element
 */
function validateElement(element: ModelElement): ValidationResult[];
```

### Export

```typescript
type ExportFormat = 
  | 'svg'        // Vector graphics
  | 'png'        // Raster image
  | 'pdf'        // Document
  | 'json'       // Model data
  | 'archimate'  // ArchiMate format

interface ExportOptions {
  // What to export
  selection?: boolean;
  layers?: string[];
  
  // Image options
  scale?: number;
  background?: string;
  
  // PDF options
  pageSize?: 'A4' | 'Letter' | 'Auto';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Export the view
 */
async function exportView(
  format: ExportFormat,
  options?: ExportOptions
): Promise<Blob>;
```

## Events

### Viewer Events

```typescript
type ViewerEvent = 
  | 'ready'
  | 'error'
  | 'selection-change'
  | 'layer-change'
  | 'zoom-change'
  | 'layout-complete'
  | 'search-complete'
  | 'validation-complete';

interface ViewerEventMap {
  'ready': { api: ViewerAPI };
  'error': { error: Error };
  'selection-change': { selection: ModelElement[] };
  'layer-change': { layers: Map<string, boolean> };
  'zoom-change': { zoom: number };
  'layout-complete': { algorithm: string; duration: number };
  'search-complete': { query: string; results: SearchResult[] };
  'validation-complete': { results: ValidationResult[] };
}

// Usage
api.on('selection-change', ({ selection }) => {
  console.log('Selected elements:', selection);
});
```

## Error Handling

```typescript
class ViewerError extends Error {
  code: ErrorCode;
  details?: any;
}

enum ErrorCode {
  // File errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FORMAT = 'INVALID_FORMAT',
  PARSE_ERROR = 'PARSE_ERROR',
  
  // Model errors
  INVALID_MODEL = 'INVALID_MODEL',
  MISSING_REFERENCE = 'MISSING_REFERENCE',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  
  // Layout errors
  LAYOUT_FAILED = 'LAYOUT_FAILED',
  NO_LAYOUT_ALGORITHM = 'NO_LAYOUT_ALGORITHM',
  
  // General
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Error handling
try {
  await api.loadModel(source);
} catch (error) {
  if (error instanceof ViewerError) {
    switch (error.code) {
      case ErrorCode.INVALID_FORMAT:
        console.error('Invalid file format:', error.details);
        break;
      case ErrorCode.MISSING_REFERENCE:
        console.error('Missing reference:', error.details);
        break;
      default:
        console.error('Unknown error:', error);
    }
  }
}
```

## TypeScript Types

All types are exported from the main package:

```typescript
export type {
  // Components
  MetaModelViewerProps,
  LayerPanelProps,
  PropertyPanelProps,
  
  // API
  ViewerAPI,
  ViewerConfig,
  DataSource,
  
  // Models
  MetaModel,
  Layer,
  ModelElement,
  Relationship,
  
  // Layout
  LayoutAlgorithm,
  LayoutOptions,
  LayoutResult,
  
  // Search
  SearchOptions,
  SearchResult,
  
  // Validation
  ValidationResult,
  ValidationError,
  
  // Events
  ViewerEvent,
  ViewerEventMap,
} from '@documentation-robotics/viewer';
```