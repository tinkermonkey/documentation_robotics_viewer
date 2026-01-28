import { test, expect } from '@playwright/test';
import { useCrossLayerStore, NavigationStep } from '../../src/core/stores/crossLayerStore';
import { LayerType } from '../../src/core/types/layers';
import { ReferenceType } from '../../src/core/types/model';

test.describe('CrossLayerStore', () => {
  let store: ReturnType<typeof useCrossLayerStore.getState>;

  test.beforeEach(() => {
    // Reset store state before each test
    useCrossLayerStore.setState({
      visible: false,
      targetLayerFilters: new Set(),
      relationshipTypeFilters: new Set(),
      navigationHistory: [],
    });
    store = useCrossLayerStore.getState();
  });

  test.describe('Visibility Toggle', () => {
    test('should initialize with visible=false', () => {
      expect(store.visible).toBe(false);
    });

    test('should toggle visible state', () => {
      store.toggleVisible();
      expect(useCrossLayerStore.getState().visible).toBe(true);

      store.toggleVisible();
      expect(useCrossLayerStore.getState().visible).toBe(false);
    });

    test('should set visible to specific value', () => {
      store.setVisible(true);
      expect(useCrossLayerStore.getState().visible).toBe(true);

      store.setVisible(false);
      expect(useCrossLayerStore.getState().visible).toBe(false);
    });
  });

  test.describe('Target Layer Filters', () => {
    test('should start with empty target layer filters', () => {
      expect(store.targetLayerFilters.size).toBe(0);
    });

    test('should add target layer filter', () => {
      store.addTargetLayerFilter(LayerType.Motivation);
      expect(useCrossLayerStore.getState().targetLayerFilters.has(LayerType.Motivation)).toBe(true);
    });

    test('should remove target layer filter', () => {
      store.addTargetLayerFilter(LayerType.Motivation);
      store.removeTargetLayerFilter(LayerType.Motivation);
      expect(useCrossLayerStore.getState().targetLayerFilters.has(LayerType.Motivation)).toBe(false);
    });

    test('should clear all target layer filters', () => {
      store.addTargetLayerFilter(LayerType.Motivation);
      store.addTargetLayerFilter(LayerType.Application);
      store.clearTargetLayerFilters();
      expect(useCrossLayerStore.getState().targetLayerFilters.size).toBe(0);
    });

    test('should set all target layer filters', () => {
      const layers = [LayerType.Motivation, LayerType.Application, LayerType.DataModel];
      store.setAllTargetLayerFilters(layers);

      const filters = useCrossLayerStore.getState().targetLayerFilters;
      expect(filters.size).toBe(3);
      expect(filters.has(LayerType.Motivation)).toBe(true);
      expect(filters.has(LayerType.Application)).toBe(true);
      expect(filters.has(LayerType.DataModel)).toBe(true);
    });

    test('should check if target layer filter exists', () => {
      store.addTargetLayerFilter(LayerType.Motivation);
      expect(store.hasTargetLayerFilter(LayerType.Motivation)).toBe(true);
      expect(store.hasTargetLayerFilter(LayerType.Application)).toBe(false);
    });
  });

  test.describe('Relationship Type Filters', () => {
    test('should start with empty relationship type filters', () => {
      expect(store.relationshipTypeFilters.size).toBe(0);
    });

    test('should add relationship type filter', () => {
      store.addRelationshipTypeFilter(ReferenceType.Goal);
      expect(useCrossLayerStore.getState().relationshipTypeFilters.has(ReferenceType.Goal)).toBe(true);
    });

    test('should remove relationship type filter', () => {
      store.addRelationshipTypeFilter(ReferenceType.Goal);
      store.removeRelationshipTypeFilter(ReferenceType.Goal);
      expect(useCrossLayerStore.getState().relationshipTypeFilters.has(ReferenceType.Goal)).toBe(false);
    });

    test('should clear all relationship type filters', () => {
      store.addRelationshipTypeFilter(ReferenceType.Goal);
      store.addRelationshipTypeFilter(ReferenceType.Requirement);
      store.clearRelationshipTypeFilters();
      expect(useCrossLayerStore.getState().relationshipTypeFilters.size).toBe(0);
    });

    test('should set all relationship type filters', () => {
      const types = [ReferenceType.Goal, ReferenceType.Requirement, ReferenceType.Principle];
      store.setAllRelationshipTypeFilters(types);

      const filters = useCrossLayerStore.getState().relationshipTypeFilters;
      expect(filters.size).toBe(3);
      expect(filters.has(ReferenceType.Goal)).toBe(true);
      expect(filters.has(ReferenceType.Requirement)).toBe(true);
      expect(filters.has(ReferenceType.Principle)).toBe(true);
    });

    test('should check if relationship type filter exists', () => {
      store.addRelationshipTypeFilter(ReferenceType.Goal);
      expect(store.hasRelationshipTypeFilter(ReferenceType.Goal)).toBe(true);
      expect(store.hasRelationshipTypeFilter(ReferenceType.Requirement)).toBe(false);
    });
  });

  test.describe('Navigation History', () => {
    test('should start with empty navigation history', () => {
      expect(store.navigationHistory.length).toBe(0);
    });

    test('should push navigation step', () => {
      const step: NavigationStep = {
        layerId: LayerType.Motivation,
        elementId: 'goal-1',
        elementName: 'Test Goal',
        timestamp: Date.now(),
      };

      store.pushNavigation(step);
      const history = useCrossLayerStore.getState().navigationHistory;
      expect(history.length).toBe(1);
      expect(history[0]).toEqual(step);
    });

    test('should maintain order with newest first', () => {
      const step1: NavigationStep = {
        layerId: LayerType.Motivation,
        elementId: 'goal-1',
        elementName: 'Goal 1',
        timestamp: Date.now(),
      };

      const step2: NavigationStep = {
        layerId: LayerType.Application,
        elementId: 'service-1',
        elementName: 'Service 1',
        timestamp: Date.now() + 1000,
      };

      store.pushNavigation(step1);
      store.pushNavigation(step2);

      const history = useCrossLayerStore.getState().navigationHistory;
      expect(history[0]).toEqual(step2); // Newest first
      expect(history[1]).toEqual(step1);
    });

    test('should limit history to 5 steps', () => {
      for (let i = 0; i < 7; i++) {
        store.pushNavigation({
          layerId: LayerType.Motivation,
          elementId: `goal-${i}`,
          elementName: `Goal ${i}`,
          timestamp: Date.now() + i,
        });
      }

      const history = useCrossLayerStore.getState().navigationHistory;
      expect(history.length).toBe(5);
    });

    test('should pop navigation step', () => {
      const step: NavigationStep = {
        layerId: LayerType.Motivation,
        elementId: 'goal-1',
        elementName: 'Test Goal',
        timestamp: Date.now(),
      };

      store.pushNavigation(step);
      const popped = store.popNavigation();

      expect(popped).toEqual(step);
      expect(useCrossLayerStore.getState().navigationHistory.length).toBe(0);
    });

    test('should return undefined when popping empty history', () => {
      const popped = store.popNavigation();
      expect(popped).toBeUndefined();
    });

    test('should clear navigation history', () => {
      store.pushNavigation({
        layerId: LayerType.Motivation,
        elementId: 'goal-1',
        elementName: 'Test Goal',
        timestamp: Date.now(),
      });

      store.clearNavigationHistory();
      expect(useCrossLayerStore.getState().navigationHistory.length).toBe(0);
    });
  });

  test.describe('Store Persistence Across Selectors', () => {
    test('should maintain state when using selectors', () => {
      store.setVisible(true);
      store.addTargetLayerFilter(LayerType.Motivation);
      store.addRelationshipTypeFilter(ReferenceType.Goal);

      const state = useCrossLayerStore.getState();
      expect(state.visible).toBe(true);
      expect(state.targetLayerFilters.has(LayerType.Motivation)).toBe(true);
      expect(state.relationshipTypeFilters.has(ReferenceType.Goal)).toBe(true);
    });
  });
});
