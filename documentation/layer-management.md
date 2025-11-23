# Layer Management

## Layer System Architecture

The layer management system controls visibility, interaction, and rendering of the 11 architectural layers in the meta-model.

## Layer Manager

```typescript
interface LayerManager {
  // Layer state
  layers: Map<string, LayerState>;
  activeLayers: Set<string>;
  focusedLayer: string | null;
  
  // Layer operations
  toggleLayer(layerId: string): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  setLayerLocked(layerId: string, locked: boolean): void;
  
  // Focus management
  focusLayer(layerId: string): void;
  clearFocus(): void;
  
  // Filtering
  showOnly(layerIds: string[]): void;
  hideAll(): void;
  showAll(): void;
  
  // Layer groups
  createLayerGroup(name: string, layerIds: string[]): void;
  toggleLayerGroup(groupName: string): void;
}

interface LayerState {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  color: string;
  icon: string;
  
  // Statistics
  elementCount: number;
  relationshipCount: number;
  
  // View state
  expanded: boolean;
  filters: LayerFilter[];
}
```

## Layer Configuration

```typescript
export const layerConfig: LayerConfig[] = [
  {
    id: 'motivation',
    name: 'Motivation',
    type: LayerType.Motivation,
    order: 1,
    icon: '🎯',
    color: '#2e7d32',
    description: 'Goals, requirements, stakeholders, constraints',
    
    // Element types in this layer
    elementTypes: [
      'Goal',
      'Requirement',
      'Constraint',
      'Stakeholder',
      'Driver',
      'Assessment',
      'Outcome',
    ],
    
    // Default visibility
    defaultVisible: false,
    defaultOpacity: 1,
    
    // Interaction rules
    canEdit: true,
    canHide: true,
    canLock: true,
  },
  
  {
    id: 'business',
    name: 'Business',
    type: LayerType.Business,
    order: 2,
    icon: '💼',
    color: '#e65100',
    description: 'Business services, processes, actors',
    
    elementTypes: [
      'BusinessActor',
      'BusinessRole',
      'BusinessProcess',
      'BusinessService',
      'BusinessObject',
      'Contract',
      'Product',
    ],
    
    defaultVisible: true,
    defaultOpacity: 1,
  },
  
  {
    id: 'security',
    name: 'Security',
    type: LayerType.Security,
    order: 3,
    icon: '🔐',
    color: '#c2185b',
    description: 'Roles, permissions, policies',
    
    elementTypes: [
      'Role',
      'Permission',
      'Policy',
      'SecurityResource',
      'AccessControl',
    ],
    
    defaultVisible: true,
    defaultOpacity: 0.9,
  },
  
  {
    id: 'application',
    name: 'Application',
    type: LayerType.Application,
    order: 4,
    icon: '📱',
    color: '#1565c0',
    description: 'Applications, components, services',
    
    elementTypes: [
      'ApplicationComponent',
      'ApplicationService',
      'ApplicationInterface',
      'DataObject',
    ],
    
    defaultVisible: true,
    defaultOpacity: 1,
  },
  
  // ... rest of layers
];
```

## Layer Visibility Control

```typescript
class LayerVisibilityManager {
  private editor: Editor;
  private layerStates: Map<string, LayerState>;
  
  // Update shape visibility based on layer state
  updateVisibility(): void {
    const shapes = this.editor.getCurrentPageShapes();
    
    for (const shape of shapes) {
      const layerId = shape.props.layerId;
      const layerState = this.layerStates.get(layerId);
      
      if (!layerState) continue;
      
      // Calculate effective visibility
      const isVisible = layerState.visible && !this.isFiltered(shape);
      const opacity = layerState.visible ? layerState.opacity : 0;
      
      // Update shape
      this.editor.updateShape({
        id: shape.id,
        type: shape.type,
        isGhost: !isVisible,
        opacity: opacity,
        isLocked: layerState.locked,
      });
    }
  }
  
  // Layer isolation mode
  isolateLayer(layerId: string): void {
    // Hide all other layers
    for (const [id, state] of this.layerStates) {
      this.setLayerVisibility(id, id === layerId);
    }
    
    // Zoom to layer content
    this.zoomToLayer(layerId);
  }
  
  // Focus mode with dimming
  focusLayer(layerId: string): void {
    for (const [id, state] of this.layerStates) {
      if (id === layerId) {
        // Full visibility for focused layer
        this.setLayerOpacity(id, 1.0);
      } else {
        // Dim other layers
        this.setLayerOpacity(id, 0.3);
      }
    }
  }
}
```

## Layer Filtering

```typescript
interface LayerFilter {
  id: string;
  type: FilterType;
  field: string;
  operator: FilterOperator;
  value: any;
  enabled: boolean;
}

enum FilterType {
  Property = 'property',
  Type = 'type',
  Relationship = 'relationship',
  Custom = 'custom',
}

enum FilterOperator {
  Equals = 'equals',
  NotEquals = 'not-equals',
  Contains = 'contains',
  StartsWith = 'starts-with',
  EndsWith = 'ends-with',
  GreaterThan = 'greater-than',
  LessThan = 'less-than',
  In = 'in',
  NotIn = 'not-in',
}

class LayerFilterManager {
  private filters: Map<string, LayerFilter[]> = new Map();
  
  // Add filter to layer
  addFilter(layerId: string, filter: LayerFilter): void {
    const layerFilters = this.filters.get(layerId) || [];
    layerFilters.push(filter);
    this.filters.set(layerId, layerFilters);
    
    // Re-apply visibility
    this.applyFilters(layerId);
  }
  
  // Apply filters to layer elements
  applyFilters(layerId: string): void {
    const filters = this.filters.get(layerId) || [];
    const elements = this.getLayerElements(layerId);
    
    for (const element of elements) {
      const isVisible = this.evaluateFilters(element, filters);
      this.updateElementVisibility(element.id, isVisible);
    }
  }
  
  // Evaluate filters for an element
  evaluateFilters(element: ModelElement, filters: LayerFilter[]): boolean {
    if (filters.length === 0) return true;
    
    return filters.every(filter => {
      if (!filter.enabled) return true;
      
      const fieldValue = this.getFieldValue(element, filter.field);
      return this.evaluateOperator(fieldValue, filter.operator, filter.value);
    });
  }
}
```

## Layer Groups

```typescript
interface LayerGroup {
  id: string;
  name: string;
  layerIds: string[];
  color: string;
  icon: string;
  expanded: boolean;
}

class LayerGroupManager {
  private groups: Map<string, LayerGroup> = new Map();
  
  // Predefined groups
  readonly defaultGroups: LayerGroup[] = [
    {
      id: 'strategic',
      name: 'Strategic',
      layerIds: ['motivation', 'business'],
      color: '#4caf50',
      icon: '📊',
      expanded: true,
    },
    {
      id: 'implementation',
      name: 'Implementation',
      layerIds: ['application', 'technology', 'api', 'data-model'],
      color: '#2196f3',
      icon: '⚙️',
      expanded: true,
    },
    {
      id: 'user-facing',
      name: 'User Facing',
      layerIds: ['ux', 'navigation'],
      color: '#ff9800',
      icon: '👤',
      expanded: true,
    },
    {
      id: 'operational',
      name: 'Operational',
      layerIds: ['security', 'apm'],
      color: '#f44336',
      icon: '🛡️',
      expanded: true,
    },
  ];
  
  // Toggle group visibility
  toggleGroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    const allVisible = group.layerIds.every(
      id => this.layerManager.isLayerVisible(id)
    );
    
    // Toggle all layers in group
    for (const layerId of group.layerIds) {
      this.layerManager.setLayerVisibility(layerId, !allVisible);
    }
  }
}
```

## Layer Interaction

```typescript
class LayerInteractionManager {
  private editor: Editor;
  private layerStates: Map<string, LayerState>;
  
  // Handle click on shape
  handleShapeClick(shape: MetaModelShape): void {
    const layerState = this.layerStates.get(shape.props.layerId);
    
    // Check if layer is locked
    if (layerState?.locked) {
      this.showLockedNotification();
      return;
    }
    
    // Check if layer is visible
    if (!layerState?.visible) {
      this.promptToShowLayer(shape.props.layerId);
      return;
    }
    
    // Normal selection
    this.editor.select(shape.id);
  }
  
  // Cross-layer navigation
  navigateBetweenLayers(fromElement: ModelElement, toElement: ModelElement): void {
    const fromLayer = fromElement.layerId;
    const toLayer = toElement.layerId;
    
    if (fromLayer !== toLayer) {
      // Animate layer transition
      this.animateLayerTransition(fromLayer, toLayer, () => {
        // Make target layer visible
        this.layerManager.setLayerVisibility(toLayer, true);
        
        // Focus on target element
        this.editor.zoomToSelection([toElement.id]);
        this.editor.select(toElement.id);
      });
    }
  }
  
  // Layer transition animation
  animateLayerTransition(
    fromLayer: string,
    toLayer: string,
    onComplete: () => void
  ): void {
    // Fade out current layer
    this.animateOpacity(fromLayer, 1.0, 0.3, 300);
    
    // Fade in target layer
    this.animateOpacity(toLayer, 0.3, 1.0, 300, onComplete);
  }
}
```

## Layer Statistics

```typescript
interface LayerStatistics {
  layerId: string;
  elementCount: number;
  relationshipCount: number;
  errorCount: number;
  warningCount: number;
  coverage: number; // Percentage of required elements present
}

class LayerStatisticsCalculator {
  calculate(layer: Layer): LayerStatistics {
    const elements = layer.elements;
    const relationships = layer.relationships;
    
    // Count validation issues
    const errors = this.countErrors(elements);
    const warnings = this.countWarnings(elements);
    
    // Calculate coverage
    const coverage = this.calculateCoverage(layer);
    
    return {
      layerId: layer.id,
      elementCount: elements.length,
      relationshipCount: relationships.length,
      errorCount: errors,
      warningCount: warnings,
      coverage,
    };
  }
  
  // Calculate how complete the layer is
  calculateCoverage(layer: Layer): number {
    const requiredTypes = this.getRequiredTypes(layer.type);
    const presentTypes = new Set(layer.elements.map(e => e.type));
    
    const present = requiredTypes.filter(t => presentTypes.has(t));
    return (present.length / requiredTypes.length) * 100;
  }
}
```

## Layer Panel UI

```typescript
const LayerPanel: React.FC = () => {
  const { layers, groups } = useLayerManager();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <h3>Layers</h3>
        <LayerPanelActions />
      </div>
      
      <div className="layer-groups">
        {groups.map(group => (
          <LayerGroup
            key={group.id}
            group={group}
            expanded={expandedGroups.has(group.id)}
            onToggle={() => toggleGroup(group.id)}
          >
            {group.layerIds.map(layerId => {
              const layer = layers.get(layerId);
              return layer ? (
                <LayerItem
                  key={layer.id}
                  layer={layer}
                  indented
                />
              ) : null;
            })}
          </LayerGroup>
        ))}
      </div>
      
      <LayerStatisticsPanel />
    </div>
  );
};

const LayerItem: React.FC<{ layer: LayerState; indented?: boolean }> = ({
  layer,
  indented,
}) => {
  const { toggleLayer, setLayerOpacity, focusLayer } = useLayerManager();
  
  return (
    <div className={`layer-item ${indented ? 'indented' : ''}`}>
      <div className="layer-visibility">
        <input
          type="checkbox"
          checked={layer.visible}
          onChange={() => toggleLayer(layer.id)}
        />
      </div>
      
      <div className="layer-icon" style={{ color: layer.color }}>
        {layer.icon}
      </div>
      
      <div className="layer-name">
        {layer.name}
        <span className="layer-count">({layer.elementCount})</span>
      </div>
      
      <div className="layer-actions">
        <button
          onClick={() => focusLayer(layer.id)}
          title="Focus"
        >
          🎯
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={layer.opacity}
          onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
          title="Opacity"
        />
        
        <button
          onClick={() => toggleLock(layer.id)}
          title={layer.locked ? 'Unlock' : 'Lock'}
        >
          {layer.locked ? '🔒' : '🔓'}
        </button>
      </div>
    </div>
  );
};
```

## Layer Export

```typescript
class LayerExporter {
  // Export single layer
  exportLayer(layerId: string, format: ExportFormat): Blob {
    const layer = this.getLayer(layerId);
    
    switch (format) {
      case 'svg':
        return this.exportAsSVG(layer);
      case 'png':
        return this.exportAsPNG(layer);
      case 'json':
        return this.exportAsJSON(layer);
      case 'archimate':
        return this.exportAsArchiMate(layer);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
  
  // Export layer combination
  exportLayerCombination(
    layerIds: string[],
    format: ExportFormat
  ): Blob {
    const layers = layerIds.map(id => this.getLayer(id));
    const combined = this.combineLayers(layers);
    
    return this.exportLayer(combined.id, format);
  }
}
```