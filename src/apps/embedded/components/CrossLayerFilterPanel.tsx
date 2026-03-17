/**
 * CrossLayerFilterPanel Component
 *
 * Provides filtering controls for cross-layer link visualization:
 * - Master toggle for showing/hiding all cross-layer links
 * - Target layer checkboxes (which layers to show links pointing to)
 * - Relationship type checkboxes (which reference types to show)
 * - Filter count indicators
 * - "Clear All Filters" button
 */

import { memo, useMemo } from 'react';
import {
  Accordion,
  AccordionPanel,
  AccordionTitle,
  AccordionContent,
  Checkbox,
  Label,
  Button,
} from 'flowbite-react';
import { X } from 'lucide-react';
import { LayerType } from '@/core/types/layers';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';
import { useModelStore } from '@/core/stores/modelStore';
import { MetaModel, ReferenceType } from '@/core/types/model';

/**
 * Cross-layer filter counts
 */
interface CrossLayerFilterCounts {
  /** Counts per target layer */
  targetLayers: Record<string, { visible: number; total: number }>;
  /** Counts per relationship type */
  relationshipTypes: Record<string, { visible: number; total: number }>;
}

/**
 * Target layers to display (subset of all layers per requirements)
 */
const TARGET_LAYERS: LayerType[] = [
  LayerType.Motivation,
  LayerType.Application,
  LayerType.Security,
  LayerType.DataModel,
  LayerType.Api,
  LayerType.Ux,
];

/**
 * Layer labels for display
 */
const LAYER_LABELS: Record<LayerType, string> = {
  [LayerType.Motivation]: 'Motivation',
  [LayerType.Business]: 'Business',
  [LayerType.Security]: 'Security',
  [LayerType.Application]: 'Application',
  [LayerType.Technology]: 'Technology',
  [LayerType.Api]: 'API',
  [LayerType.DataModel]: 'Data Model',
  [LayerType.Datastore]: 'Datastore',
  [LayerType.Ux]: 'UX',
  [LayerType.Navigation]: 'Navigation',
  [LayerType.ApmObservability]: 'APM/Observability',
  [LayerType.FederatedArchitecture]: 'Federated Architecture',
};

/**
 * Common relationship type labels and values
 */
const COMMON_REFERENCE_TYPES = [
  'realizes',
  'supports',
  'accesses',
  'uses',
  'assigned-to',
  'influences',
] as const;

type CommonReferenceType = typeof COMMON_REFERENCE_TYPES[number];

const COMMON_REFERENCE_TYPE_LABELS: Record<CommonReferenceType, string> = {
  'realizes': 'Realizes',
  'supports': 'Supports',
  'accesses': 'Accesses',
  'uses': 'Uses',
  'assigned-to': 'Assigned To',
  'influences': 'Influences',
};

/**
 * Check if a value is a common reference type
 */
function isCommonReferenceType(value: unknown): value is CommonReferenceType {
  return typeof value === 'string' && COMMON_REFERENCE_TYPES.includes(value as CommonReferenceType);
}

/**
 * Calculate filter counts from the model
 */
function calculateFilterCounts(model: MetaModel | null): CrossLayerFilterCounts {
  const counts: CrossLayerFilterCounts = {
    targetLayers: {},
    relationshipTypes: {},
  };

  // Initialize all counts to 0
  TARGET_LAYERS.forEach((layer) => {
    counts.targetLayers[layer] = { visible: 0, total: 0 };
  });

  COMMON_REFERENCE_TYPES.forEach((type) => {
    counts.relationshipTypes[type] = { visible: 0, total: 0 };
  });

  // Count from model references if available
  if (model?.references && Array.isArray(model.references)) {
    model.references.forEach((ref) => {
      const targetLayer = ref.target?.layerId;
      const refType = ref.type;

      // Count if target layer is in our filter list
      if (targetLayer && TARGET_LAYERS.includes(targetLayer as LayerType)) {
        if (counts.targetLayers[targetLayer]) {
          counts.targetLayers[targetLayer].total += 1;
        }
      }

      // Count if reference type is a common type
      if (isCommonReferenceType(refType)) {
        if (counts.relationshipTypes[refType]) {
          counts.relationshipTypes[refType].total += 1;
        }
      }
    });
  }

  return counts;
}

const CrossLayerFilterPanelComponent = memo(() => {
  const model = useModelStore((state) => state.model);
  const targetLayerFilters = useCrossLayerStore((state) => state.targetLayerFilters);
  const relationshipTypeFilters = useCrossLayerStore((state) => state.relationshipTypeFilters);
  const addTargetLayerFilter = useCrossLayerStore((state) => state.addTargetLayerFilter);
  const removeTargetLayerFilter = useCrossLayerStore((state) => state.removeTargetLayerFilter);
  const addRelationshipTypeFilter = useCrossLayerStore((state) => state.addRelationshipTypeFilter);
  const removeRelationshipTypeFilter = useCrossLayerStore(
    (state) => state.removeRelationshipTypeFilter
  );
  const clearTargetLayerFilters = useCrossLayerStore((state) => state.clearTargetLayerFilters);
  const clearRelationshipTypeFilters = useCrossLayerStore(
    (state) => state.clearRelationshipTypeFilters
  );

  // Calculate filter counts
  const filterCounts = useMemo(() => calculateFilterCounts(model), [model]);

  /**
   * Check if all target layers are selected
   */
  const allTargetLayersSelected = useMemo(
    () =>
      TARGET_LAYERS.every((layer) =>
        targetLayerFilters.has(layer)
      ),
    [targetLayerFilters]
  );

  /**
   * Check if all relationship types are selected
   */
  const allRelationshipTypesSelected = useMemo(
    () =>
      COMMON_REFERENCE_TYPES.every((type) =>
        relationshipTypeFilters.has(type as ReferenceType)
      ),
    [relationshipTypeFilters]
  );

  /**
   * Calculate total visible/total for target layers
   */
  const totalTargetLayerCounts = useMemo(
    () =>
      TARGET_LAYERS.reduce(
        (acc, layer) => {
          const counts = filterCounts.targetLayers[layer];
          if (counts) {
            acc.visible += targetLayerFilters.has(layer) ? counts.total : 0;
            acc.total += counts.total;
          }
          return acc;
        },
        { visible: 0, total: 0 }
      ),
    [filterCounts.targetLayers, targetLayerFilters]
  );

  /**
   * Calculate total visible/total for relationship types
   */
  const totalRelationshipTypeCounts = useMemo(
    () =>
      COMMON_REFERENCE_TYPES.reduce(
        (acc, type) => {
          const counts = filterCounts.relationshipTypes[type];
          if (counts) {
            acc.visible += relationshipTypeFilters.has(type as ReferenceType) ? counts.total : 0;
            acc.total += counts.total;
          }
          return acc;
        },
        { visible: 0, total: 0 }
      ),
    [filterCounts.relationshipTypes, relationshipTypeFilters]
  );

  /**
   * Handle "Select All" target layers
   */
  const handleSelectAllTargetLayers = () => {
    TARGET_LAYERS.forEach((layer) => {
      if (!targetLayerFilters.has(layer) && filterCounts.targetLayers[layer].total > 0) {
        addTargetLayerFilter(layer);
      }
    });
  };

  /**
   * Handle "Deselect All" target layers
   */
  const handleDeselectAllTargetLayers = () => {
    TARGET_LAYERS.forEach((layer) => {
      if (targetLayerFilters.has(layer)) {
        removeTargetLayerFilter(layer);
      }
    });
  };

  /**
   * Handle "Select All" relationship types
   */
  const handleSelectAllRelationshipTypes = () => {
    COMMON_REFERENCE_TYPES.forEach((type) => {
      const refType = type as ReferenceType;
      if (!relationshipTypeFilters.has(refType) && filterCounts.relationshipTypes[type].total > 0) {
        addRelationshipTypeFilter(refType);
      }
    });
  };

  /**
   * Handle "Deselect All" relationship types
   */
  const handleDeselectAllRelationshipTypes = () => {
    COMMON_REFERENCE_TYPES.forEach((type) => {
      const refType = type as ReferenceType;
      if (relationshipTypeFilters.has(refType)) {
        removeRelationshipTypeFilter(refType);
      }
    });
  };

  /**
   * Handle clear all filters
   */
  const handleClearAllFilters = () => {
    clearTargetLayerFilters();
    clearRelationshipTypeFilters();
  };

  // Don't show filter panel if there are no cross-layer references
  if (!model?.references || model.references.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="cross-layer-filter-panel">
      {/* Header with Clear All button */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
        {!allTargetLayersSelected || !allRelationshipTypesSelected ? (
          <Button
            color="gray"
            size="xs"
            onClick={handleClearAllFilters}
            title="Clear all filters"
            data-testid="clear-all-cross-layer-filters-btn"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        ) : null}
      </div>

      {/* Filter Sections */}
      <Accordion collapseAll={false}>
        {/* Target Layers Section */}
        <AccordionPanel>
          <AccordionTitle>
            <div className="flex items-center justify-between w-full pr-4">
              <span>Target Layers</span>
              {totalTargetLayerCounts.total > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {totalTargetLayerCounts.visible} / {totalTargetLayerCounts.total}
                </span>
              )}
            </div>
          </AccordionTitle>
          <AccordionContent>
            {/* Bulk Actions */}
            <div className="flex gap-2 mb-3">
              <Button
                size="xs"
                color="light"
                onClick={handleSelectAllTargetLayers}
                disabled={allTargetLayersSelected}
                data-testid="select-all-target-layers"
              >
                Select All
              </Button>
              <Button
                size="xs"
                color="light"
                onClick={handleDeselectAllTargetLayers}
                disabled={targetLayerFilters.size === 0}
                data-testid="deselect-all-target-layers"
              >
                Deselect All
              </Button>
            </div>

            {/* Filter Items */}
            <div className="space-y-2">
              {TARGET_LAYERS.map((layer) => {
                const counts = filterCounts.targetLayers[layer];
                const isSelected = targetLayerFilters.has(layer);
                const hasReferences = counts && counts.total > 0;

                return (
                  <div
                    key={layer}
                    className="flex items-center justify-between"
                    data-testid={`cross-layer-filter-item-${layer}`}
                  >
                    <Checkbox
                      id={`filter-target-layer-${layer}`}
                      checked={isSelected}
                      onChange={(e) =>
                        e.target.checked
                          ? addTargetLayerFilter(layer)
                          : removeTargetLayerFilter(layer)
                      }
                      disabled={!hasReferences}
                      data-testid={`cross-layer-toggle-target-layer-${layer}`}
                    />
                    <Label
                      htmlFor={`filter-target-layer-${layer}`}
                      className="flex items-center gap-2 flex-1 ml-2 cursor-pointer"
                      disabled={!hasReferences}
                    >
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {LAYER_LABELS[layer]}
                      </span>
                      {counts && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {counts.visible}/{counts.total}
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionPanel>

        {/* Relationship Types Section */}
        <AccordionPanel>
          <AccordionTitle>
            <div className="flex items-center justify-between w-full pr-4">
              <span>Relationship Types</span>
              {totalRelationshipTypeCounts.total > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {totalRelationshipTypeCounts.visible} / {totalRelationshipTypeCounts.total}
                </span>
              )}
            </div>
          </AccordionTitle>
          <AccordionContent>
            {/* Bulk Actions */}
            <div className="flex gap-2 mb-3">
              <Button
                size="xs"
                color="light"
                onClick={handleSelectAllRelationshipTypes}
                disabled={allRelationshipTypesSelected}
                data-testid="select-all-relationship-types"
              >
                Select All
              </Button>
              <Button
                size="xs"
                color="light"
                onClick={handleDeselectAllRelationshipTypes}
                disabled={relationshipTypeFilters.size === 0}
                data-testid="deselect-all-relationship-types"
              >
                Deselect All
              </Button>
            </div>

            {/* Filter Items */}
            <div className="space-y-2">
              {COMMON_REFERENCE_TYPES.map((type) => {
                const counts = filterCounts.relationshipTypes[type];
                const refType = type as ReferenceType;
                const isSelected = relationshipTypeFilters.has(refType);
                const hasReferences = counts && counts.total > 0;

                return (
                  <div
                    key={type}
                    className="flex items-center justify-between"
                    data-testid={`cross-layer-filter-item-${type}`}
                  >
                    <Checkbox
                      id={`filter-relationship-type-${type}`}
                      checked={isSelected}
                      onChange={(e) =>
                        e.target.checked
                          ? addRelationshipTypeFilter(refType)
                          : removeRelationshipTypeFilter(refType)
                      }
                      disabled={!hasReferences}
                      data-testid={`cross-layer-toggle-relationship-type-${type}`}
                    />
                    <Label
                      htmlFor={`filter-relationship-type-${type}`}
                      className="flex items-center gap-2 flex-1 ml-2 cursor-pointer"
                      disabled={!hasReferences}
                    >
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {COMMON_REFERENCE_TYPE_LABELS[type]}
                      </span>
                      {counts && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {counts.visible}/{counts.total}
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      {/* Total filtered edge count summary */}
      {(totalTargetLayerCounts.total > 0 || totalRelationshipTypeCounts.total > 0) && (
        <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700 px-2">
          {totalTargetLayerCounts.visible} of {totalTargetLayerCounts.total} edges visible (after filtering)
        </div>
      )}
    </div>
  );
});

export const CrossLayerFilterPanel = CrossLayerFilterPanelComponent;

CrossLayerFilterPanelComponent.displayName = 'CrossLayerFilterPanel';
