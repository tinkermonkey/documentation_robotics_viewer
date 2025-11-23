# Viewer Architecture

## Core Components

### 1. MetaModelViewer (Root Component)

```typescript
interface MetaModelViewerProps {
  // Initial configuration
  config?: ViewerConfig;
  
  // File/data source
  source?: DataSource;
  
  // Callbacks
  onReady?: (viewer: ViewerAPI) => void;
  onError?: (error: Error) => void;
  onSelectionChange?: (selection: Selection) => void;
}

const MetaModelViewer: React.FC<MetaModelViewerProps> = (props) => {
  // Initialize stores
  const modelStore = useModelStore();
  const viewerStore = useViewerStore();
  
  // Setup tldraw editor
  const [editor] = useState(() => 
    createTldrawEditor({
      shapes: metaModelShapes,
      tools: viewerTools,
      initialData: props.source
    })
  );
  
  return (
    <ViewerProvider value={{ modelStore, viewerStore, editor }}>
      <div className="meta-model-viewer">
        <LayerPanel />
        <CanvasArea />
        <PropertyPanel />
        <Toolbar />
      </div>
    </ViewerProvider>
  );
};
```

### 2. Canvas Area

```typescript
const CanvasArea: React.FC = () => {
  const { editor } = useViewer();
  
  return (
    <div className="canvas-area">
      <Tldraw
        editor={editor}
        components={{
          // Custom components
          Toolbar: null, // Use our own toolbar
          StylePanel: null, // Use property panel instead
          PageMenu: LayerSelector,
          QuickActions: null,
          ActionsMenu: ViewerActions,
          
          // Keep these
          ZoomMenu: true,
          HelpMenu: true,
          NavigationPanel: true,
        }}
        // Read-only mode initially
        readOnly={true}
        
        // Event handlers
        onMount={handleEditorMount}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
};
```

### 3. Layer Management

```typescript
interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  color: string;
  icon: string;
  elements: ShapeElement[];
}

const LayerPanel: React.FC = () => {
  const { layers, toggleLayer, setLayerOpacity } = useLayerManager();
  
  return (
    <div className="layer-panel">
      <h3>Layers</h3>
      {layers.map(layer => (
        <LayerItem
          key={layer.id}
          layer={layer}
          onToggle={() => toggleLayer(layer.id)}
          onOpacityChange={(opacity) => setLayerOpacity(layer.id, opacity)}
        />
      ))}
    </div>
  );
};
```

### 4. Property Inspection

```typescript
const PropertyPanel: React.FC = () => {
  const { selection } = useSelection();
  const { getProperties } = useModelStore();
  
  if (!selection || selection.length === 0) {
    return <EmptyState message="Select an element to view properties" />;
  }
  
  const element = selection[0];
  const properties = getProperties(element);
  
  return (
    <div className="property-panel">
      <h3>{element.name}</h3>
      <div className="property-section">
        <h4>Basic Properties</h4>
        {renderProperties(properties.basic)}
      </div>
      
      {properties.custom && (
        <div className="property-section">
          <h4>Custom Properties</h4>
          {renderProperties(properties.custom)}
        </div>
      )}
      
      {properties.references && (
        <div className="property-section">
          <h4>References</h4>
          {renderReferences(properties.references)}
        </div>
      )}
    </div>
  );
};
```

## State Management

### Model Store (Zustand)

```typescript
interface ModelStore {
  // Data
  elements: Map<string, ModelElement>;
  relationships: Map<string, Relationship>;
  layers: Map<string, Layer>;
  
  // Actions
  loadModel: (source: DataSource) => Promise<void>;
  getElementById: (id: string) => ModelElement | undefined;
  getElementsByLayer: (layerId: string) => ModelElement[];
  getRelationships: (elementId: string) => Relationship[];
  
  // Search
  search: (query: string, options?: SearchOptions) => SearchResult[];
  
  // Validation
  validate: () => ValidationResult[];
}

const useModelStore = create<ModelStore>((set, get) => ({
  elements: new Map(),
  relationships: new Map(),
  layers: new Map(),
  
  loadModel: async (source) => {
    const data = await loadDataSource(source);
    const parsed = parseModelData(data);
    
    set({
      elements: parsed.elements,
      relationships: parsed.relationships,
      layers: parsed.layers,
    });
  },
  
  // ... other methods
}));
```

### Viewer Store

```typescript
interface ViewerStore {
  // View state
  zoom: number;
  pan: { x: number; y: number };
  selection: string[];
  hoveredElement: string | null;
  
  // Layer visibility
  visibleLayers: Set<string>;
  
  // Layout
  layoutAlgorithm: LayoutAlgorithm;
  layoutOptions: LayoutOptions;
  
  // Actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  select: (ids: string[]) => void;
  toggleLayer: (layerId: string) => void;
  applyLayout: (algorithm?: LayoutAlgorithm) => void;
}
```

## Event Handling

### Selection Events

```typescript
const handleSelectionChange = (selection: TLShape[]) => {
  // Update viewer store
  viewerStore.select(selection.map(s => s.id));
  
  // Notify property panel
  eventBus.emit('selection:change', selection);
  
  // Update URL for deep linking
  updateURLSelection(selection);
  
  // Analytics
  trackEvent('selection', { count: selection.length });
};
```

### Navigation Events

```typescript
const handleElementDoubleClick = (element: ModelElement) => {
  // Check for navigation targets
  if (element.navigateTo) {
    navigateToElement(element.navigateTo);
  } else if (element.drillDown) {
    drillDownToLayer(element.drillDown);
  } else if (element.externalLink) {
    openExternalLink(element.externalLink);
  }
};
```

### Cross-Reference Following

```typescript
const followReference = (reference: Reference) => {
  const target = modelStore.getElementById(reference.targetId);
  
  if (!target) {
    showNotification('Reference target not found', 'warning');
    return;
  }
  
  // Switch to target layer if needed
  if (target.layerId !== currentLayer) {
    switchToLayer(target.layerId);
  }
  
  // Center and select target
  editor.zoomToSelection([target.shapeId]);
  editor.select(target.shapeId);
  
  // Highlight reference path
  highlightReferencePath(reference);
};
```

## Rendering Pipeline

```
1. Load Files
   ↓
2. Parse Data (ArchiMate, YAML, JSON)
   ↓
3. Build Internal Model
   ↓
4. Generate tldraw Shapes
   ↓
5. Apply Layout Algorithm
   ↓
6. Render to Canvas
   ↓
7. Handle Interactions
```

### Shape Generation

```typescript
const generateShapes = (elements: ModelElement[]): TLShape[] => {
  return elements.map(element => {
    const ShapeClass = shapeRegistry.get(element.type);
    
    if (!ShapeClass) {
      console.warn(`No shape registered for type: ${element.type}`);
      return createDefaultShape(element);
    }
    
    return ShapeClass.fromModelElement(element);
  });
};
```

### Layout Application

```typescript
const applyLayout = async (
  shapes: TLShape[],
  algorithm: LayoutAlgorithm = 'dagre'
): Promise<TLShape[]> => {
  const layoutEngine = getLayoutEngine(algorithm);
  
  // Convert to layout graph
  const graph = convertToLayoutGraph(shapes);
  
  // Apply algorithm
  const positions = await layoutEngine.layout(graph);
  
  // Update shape positions
  return shapes.map(shape => ({
    ...shape,
    x: positions[shape.id].x,
    y: positions[shape.id].y,
  }));
};
```

## Performance Optimizations

### 1. Virtualization
- Only render visible shapes
- Cull off-screen elements
- LOD (Level of Detail) rendering

### 2. Lazy Loading
- Load layers on demand
- Progressive enhancement
- Async shape generation

### 3. Caching
- Cache parsed models
- Cache layout calculations
- Cache rendered shapes

### 4. Web Workers
- Layout calculations in worker
- File parsing in worker
- Search indexing in worker