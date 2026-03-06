/**
 * Unit tests for cross-layer components functionality
 *
 * Since the components are primarily UI wrappers around Zustand stores,
 * we test the store behavior that the components depend on.
 */

import { test, expect } from '@playwright/test';
import { useCrossLayerStore } from '../../src/core/stores/crossLayerStore';
import { LayerType } from '../../src/core/types/layers';
import { ReferenceType } from '../../src/core/types/model';

test.describe('CrossLayer Components Integration', () => {
  test.beforeEach(() => {
    // Reset store before each test
    useCrossLayerStore.setState({
      visible: false,
      targetLayerFilters: new Set(),
      relationshipTypeFilters: new Set(),
      navigationHistory: [],
    });
  });

  test.describe('CrossLayerFilterPanel - Store Integration', () => {
    test('should toggle visibility', () => {
      const store = useCrossLayerStore.getState();
      expect(store.visible).toBe(false);

      store.toggleVisible();
      expect(useCrossLayerStore.getState().visible).toBe(true);

      store.toggleVisible();
      expect(useCrossLayerStore.getState().visible).toBe(false);
    });

    test('should set visibility directly', () => {
      const store = useCrossLayerStore.getState();

      store.setVisible(true);
      expect(useCrossLayerStore.getState().visible).toBe(true);

      store.setVisible(false);
      expect(useCrossLayerStore.getState().visible).toBe(false);
    });

    test('should add target layer filter', () => {
      const store = useCrossLayerStore.getState();

      store.addTargetLayerFilter(LayerType.Business);
      expect(useCrossLayerStore.getState().targetLayerFilters.has(LayerType.Business)).toBe(true);

      store.addTargetLayerFilter(LayerType.Application);
      expect(useCrossLayerStore.getState().targetLayerFilters.size).toBe(2);
    });

    test('should remove target layer filter', () => {
      const store = useCrossLayerStore.getState();

      store.addTargetLayerFilter(LayerType.Business);
      store.addTargetLayerFilter(LayerType.Application);
      expect(useCrossLayerStore.getState().targetLayerFilters.size).toBe(2);

      store.removeTargetLayerFilter(LayerType.Business);
      expect(useCrossLayerStore.getState().targetLayerFilters.has(LayerType.Business)).toBe(false);
      expect(useCrossLayerStore.getState().targetLayerFilters.size).toBe(1);
    });

    test('should clear all target layer filters', () => {
      const store = useCrossLayerStore.getState();

      store.addTargetLayerFilter(LayerType.Business);
      store.addTargetLayerFilter(LayerType.Application);
      expect(useCrossLayerStore.getState().targetLayerFilters.size).toBe(2);

      store.clearTargetLayerFilters();
      expect(useCrossLayerStore.getState().targetLayerFilters.size).toBe(0);
    });

    test('should set all target layer filters', () => {
      const store = useCrossLayerStore.getState();
      const layers = [LayerType.Business, LayerType.Application, LayerType.Technology];

      store.setAllTargetLayerFilters(layers);
      expect(useCrossLayerStore.getState().targetLayerFilters.size).toBe(3);
      layers.forEach((layer) => {
        expect(useCrossLayerStore.getState().targetLayerFilters.has(layer)).toBe(true);
      });
    });

    test('should add relationship type filter', () => {
      const store = useCrossLayerStore.getState();

      store.addRelationshipTypeFilter(ReferenceType.Goal);
      expect(useCrossLayerStore.getState().relationshipTypeFilters.has(ReferenceType.Goal)).toBe(
        true
      );

      store.addRelationshipTypeFilter(ReferenceType.Requirement);
      expect(useCrossLayerStore.getState().relationshipTypeFilters.size).toBe(2);
    });

    test('should remove relationship type filter', () => {
      const store = useCrossLayerStore.getState();

      store.addRelationshipTypeFilter(ReferenceType.Goal);
      store.addRelationshipTypeFilter(ReferenceType.Requirement);
      expect(useCrossLayerStore.getState().relationshipTypeFilters.size).toBe(2);

      store.removeRelationshipTypeFilter(ReferenceType.Goal);
      expect(useCrossLayerStore.getState().relationshipTypeFilters.has(ReferenceType.Goal)).toBe(
        false
      );
      expect(useCrossLayerStore.getState().relationshipTypeFilters.size).toBe(1);
    });

    test('should clear all relationship type filters', () => {
      const store = useCrossLayerStore.getState();

      store.addRelationshipTypeFilter(ReferenceType.Goal);
      store.addRelationshipTypeFilter(ReferenceType.Requirement);
      expect(useCrossLayerStore.getState().relationshipTypeFilters.size).toBe(2);

      store.clearRelationshipTypeFilters();
      expect(useCrossLayerStore.getState().relationshipTypeFilters.size).toBe(0);
    });

    test('should set all relationship type filters', () => {
      const store = useCrossLayerStore.getState();
      const types = [ReferenceType.Goal, ReferenceType.Requirement, ReferenceType.Principle];

      store.setAllRelationshipTypeFilters(types);
      expect(useCrossLayerStore.getState().relationshipTypeFilters.size).toBe(3);
      types.forEach((type) => {
        expect(useCrossLayerStore.getState().relationshipTypeFilters.has(type)).toBe(true);
      });
    });

    test('should check if target layer filter exists', () => {
      const store = useCrossLayerStore.getState();

      store.addTargetLayerFilter(LayerType.Business);
      expect(store.hasTargetLayerFilter(LayerType.Business)).toBe(true);
      expect(store.hasTargetLayerFilter(LayerType.Application)).toBe(false);
    });

    test('should check if relationship type filter exists', () => {
      const store = useCrossLayerStore.getState();

      store.addRelationshipTypeFilter(ReferenceType.Goal);
      expect(store.hasRelationshipTypeFilter(ReferenceType.Goal)).toBe(true);
      expect(store.hasRelationshipTypeFilter(ReferenceType.Requirement)).toBe(false);
    });
  });

  test.describe('Store state isolation', () => {
    test('should not affect other store states when updating', () => {
      const store = useCrossLayerStore.getState();

      // Set visibility
      store.setVisible(true);

      // Add target layer filter
      store.addTargetLayerFilter(LayerType.Business);

      // Verify both are set independently
      expect(useCrossLayerStore.getState().visible).toBe(true);
      expect(useCrossLayerStore.getState().targetLayerFilters.has(LayerType.Business)).toBe(true);

      // Clear one doesn't affect other
      store.clearTargetLayerFilters();
      expect(useCrossLayerStore.getState().visible).toBe(true);
      expect(useCrossLayerStore.getState().targetLayerFilters.size).toBe(0);
    });

    test('should handle rapid successive updates', () => {
      const store = useCrossLayerStore.getState();

      for (let i = 0; i < 10; i++) {
        store.toggleVisible();
      }

      // Should end up back at initial state (false)
      expect(useCrossLayerStore.getState().visible).toBe(false);

      for (let i = 0; i < 5; i++) {
        store.addTargetLayerFilter(LayerType.Business);
        store.removeTargetLayerFilter(LayerType.Business);
      }

      expect(useCrossLayerStore.getState().targetLayerFilters.size).toBe(0);
    });
  });
});
