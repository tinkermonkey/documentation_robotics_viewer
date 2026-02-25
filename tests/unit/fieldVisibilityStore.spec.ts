import { test, expect } from '@playwright/test';
import { useFieldVisibilityStore } from '../../src/core/stores/fieldVisibilityStore';

test.describe('FieldVisibilityStore', () => {
  let store: ReturnType<typeof useFieldVisibilityStore.getState>;

  test.beforeEach(() => {
    // Reset store state before each test
    useFieldVisibilityStore.setState({
      graphLevelHideFields: false,
      nodeLevelOverrides: new Map(),
    });
    store = useFieldVisibilityStore.getState();
  });

  test.describe('Graph Level Visibility', () => {
    test('should initialize with graphLevelHideFields=false', () => {
      expect(store.graphLevelHideFields).toBe(false);
    });

    test('should set graph-level visibility to true', () => {
      store.setGraphLevelVisibility(true);
      expect(useFieldVisibilityStore.getState().graphLevelHideFields).toBe(true);
    });

    test('should set graph-level visibility to false', () => {
      store.setGraphLevelVisibility(true);
      store.setGraphLevelVisibility(false);
      expect(useFieldVisibilityStore.getState().graphLevelHideFields).toBe(false);
    });

    test('should toggle graph-level visibility', () => {
      store.setGraphLevelVisibility(true);
      expect(useFieldVisibilityStore.getState().graphLevelHideFields).toBe(true);

      store.setGraphLevelVisibility(false);
      expect(useFieldVisibilityStore.getState().graphLevelHideFields).toBe(false);
    });
  });

  test.describe('Node Level Overrides', () => {
    test('should initialize with empty nodeLevelOverrides', () => {
      expect(store.nodeLevelOverrides.size).toBe(0);
    });

    test('should set node-level visibility', () => {
      store.setNodeLevelVisibility('node-1', true);
      expect(useFieldVisibilityStore.getState().nodeLevelOverrides.has('node-1')).toBe(true);
      expect(useFieldVisibilityStore.getState().nodeLevelOverrides.get('node-1')).toBe(true);
    });

    test('should set multiple node-level visibility settings', () => {
      store.setNodeLevelVisibility('node-1', true);
      store.setNodeLevelVisibility('node-2', false);
      store.setNodeLevelVisibility('node-3', true);

      const overrides = useFieldVisibilityStore.getState().nodeLevelOverrides;
      expect(overrides.size).toBe(3);
      expect(overrides.get('node-1')).toBe(true);
      expect(overrides.get('node-2')).toBe(false);
      expect(overrides.get('node-3')).toBe(true);
    });

    test('should update node-level visibility', () => {
      store.setNodeLevelVisibility('node-1', true);
      store.setNodeLevelVisibility('node-1', false);

      expect(useFieldVisibilityStore.getState().nodeLevelOverrides.get('node-1')).toBe(false);
    });

    test('should clear node-level visibility', () => {
      store.setNodeLevelVisibility('node-1', true);
      store.clearNodeLevelVisibility('node-1');

      expect(useFieldVisibilityStore.getState().nodeLevelOverrides.has('node-1')).toBe(false);
    });

    test('should clear specific node without affecting others', () => {
      store.setNodeLevelVisibility('node-1', true);
      store.setNodeLevelVisibility('node-2', true);
      store.setNodeLevelVisibility('node-3', false);

      store.clearNodeLevelVisibility('node-2');

      const overrides = useFieldVisibilityStore.getState().nodeLevelOverrides;
      expect(overrides.size).toBe(2);
      expect(overrides.has('node-1')).toBe(true);
      expect(overrides.has('node-2')).toBe(false);
      expect(overrides.has('node-3')).toBe(true);
    });
  });

  test.describe('Precedence Logic - shouldHideFields Selector', () => {
    test('should return false by default when no overrides set', () => {
      expect(store.shouldHideFields('node-1')).toBe(false);
    });

    test('should return false for unknown node when no graph-level setting', () => {
      expect(store.shouldHideFields('unknown-node')).toBe(false);
    });

    test('should return false when undefined nodeId and no graph-level setting', () => {
      expect(store.shouldHideFields()).toBe(false);
    });

    test('should return true when graph-level is enabled', () => {
      store.setGraphLevelVisibility(true);
      expect(store.shouldHideFields()).toBe(true);
    });

    test('should return true when graph-level is enabled regardless of nodeId', () => {
      store.setGraphLevelVisibility(true);
      expect(store.shouldHideFields('node-1')).toBe(true);
      expect(store.shouldHideFields('node-2')).toBe(true);
    });

    test('should return true when graph-level is enabled even with node-level false', () => {
      store.setNodeLevelVisibility('node-1', false);
      store.setGraphLevelVisibility(true);

      // Graph-level true overrides node-level false
      expect(store.shouldHideFields('node-1')).toBe(true);
    });

    test('should respect node-level true when graph-level is false', () => {
      store.setGraphLevelVisibility(false);
      store.setNodeLevelVisibility('node-1', true);

      expect(store.shouldHideFields('node-1')).toBe(true);
    });

    test('should respect node-level false when graph-level is false', () => {
      store.setGraphLevelVisibility(false);
      store.setNodeLevelVisibility('node-1', false);

      expect(store.shouldHideFields('node-1')).toBe(false);
    });

    test('should handle independent node-level settings', () => {
      store.setGraphLevelVisibility(false);
      store.setNodeLevelVisibility('node-1', true);
      store.setNodeLevelVisibility('node-2', false);
      store.setNodeLevelVisibility('node-3', true);

      expect(store.shouldHideFields('node-1')).toBe(true);
      expect(store.shouldHideFields('node-2')).toBe(false);
      expect(store.shouldHideFields('node-3')).toBe(true);
    });

    test('should return false for nodes without node-level overrides', () => {
      store.setGraphLevelVisibility(false);
      store.setNodeLevelVisibility('node-1', true);

      // node-2 has no override, should default to false
      expect(store.shouldHideFields('node-2')).toBe(false);
    });
  });

  test.describe('Override Precedence - Complete Scenarios', () => {
    test('scenario 1: graph-level enables, all nodes hide', () => {
      store.setGraphLevelVisibility(true);
      store.setNodeLevelVisibility('node-1', false); // This is ignored
      store.setNodeLevelVisibility('node-2', true);

      expect(store.shouldHideFields('node-1')).toBe(true);
      expect(store.shouldHideFields('node-2')).toBe(true);
      expect(store.shouldHideFields('node-3')).toBe(true);
    });

    test('scenario 2: graph-level disabled, mixed node-level settings', () => {
      store.setGraphLevelVisibility(false);
      store.setNodeLevelVisibility('node-1', true);
      store.setNodeLevelVisibility('node-2', false);
      // node-3 has no override

      expect(store.shouldHideFields('node-1')).toBe(true);
      expect(store.shouldHideFields('node-2')).toBe(false);
      expect(store.shouldHideFields('node-3')).toBe(false);
    });

    test('scenario 3: transition from graph-level to node-level control', () => {
      // Start with graph-level enabled
      store.setGraphLevelVisibility(true);
      expect(store.shouldHideFields('node-1')).toBe(true);

      // Disable graph-level, apply node-level settings
      store.setGraphLevelVisibility(false);
      store.setNodeLevelVisibility('node-1', false);

      // Now should respect node-level
      expect(store.shouldHideFields('node-1')).toBe(false);
    });

    test('scenario 4: clear node override when graph-level disabled', () => {
      store.setGraphLevelVisibility(false);
      store.setNodeLevelVisibility('node-1', true);

      expect(store.shouldHideFields('node-1')).toBe(true);

      // Clear the override
      store.clearNodeLevelVisibility('node-1');

      // Should default to false
      expect(store.shouldHideFields('node-1')).toBe(false);
    });
  });

  test.describe('Reset All', () => {
    test('should reset all settings to defaults', () => {
      // Set up some state
      store.setGraphLevelVisibility(true);
      store.setNodeLevelVisibility('node-1', true);
      store.setNodeLevelVisibility('node-2', false);

      // Reset
      store.resetAll();

      const state = useFieldVisibilityStore.getState();
      expect(state.graphLevelHideFields).toBe(false);
      expect(state.nodeLevelOverrides.size).toBe(0);
    });

    test('should reset and make all fields visible', () => {
      store.setGraphLevelVisibility(true);
      store.setNodeLevelVisibility('node-1', true);

      store.resetAll();

      expect(store.shouldHideFields()).toBe(false);
      expect(store.shouldHideFields('node-1')).toBe(false);
    });
  });

  test.describe('Store Persistence', () => {
    test('should maintain state across multiple actions', () => {
      store.setGraphLevelVisibility(false);
      store.setNodeLevelVisibility('node-1', true);
      store.setNodeLevelVisibility('node-2', false);

      const state1 = useFieldVisibilityStore.getState();
      expect(state1.graphLevelHideFields).toBe(false);
      expect(state1.nodeLevelOverrides.size).toBe(2);

      // Perform another action
      store.setGraphLevelVisibility(true);

      const state2 = useFieldVisibilityStore.getState();
      expect(state2.graphLevelHideFields).toBe(true);
      expect(state2.nodeLevelOverrides.size).toBe(2); // Still there
    });
  });

  test.describe('Convenience Selectors', () => {
    test('should get state via getState', () => {
      store.setGraphLevelVisibility(true);

      const state = useFieldVisibilityStore.getState();
      expect(state.graphLevelHideFields).toBe(true);
    });

    test('should use shouldHideFields from state', () => {
      store.setGraphLevelVisibility(false);
      store.setNodeLevelVisibility('node-1', true);

      const state = useFieldVisibilityStore.getState();
      const shouldHide = state.shouldHideFields('node-1');
      expect(shouldHide).toBe(true);
    });

    test('should use actions via getState', () => {
      const { setGraphLevelVisibility, setNodeLevelVisibility } = useFieldVisibilityStore.getState();

      setGraphLevelVisibility(true);
      setNodeLevelVisibility('node-1', false);

      expect(useFieldVisibilityStore.getState().graphLevelHideFields).toBe(true);
      expect(useFieldVisibilityStore.getState().nodeLevelOverrides.get('node-1')).toBe(false);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle empty string as valid node ID', () => {
      // Empty string is a valid node ID (though unusual)
      store.setNodeLevelVisibility('', true);
      expect(store.shouldHideFields('')).toBe(true);
    });

    test('should handle undefined nodeLevelOverrides.get() safely', () => {
      expect(store.shouldHideFields('nonexistent-node')).toBe(false);
    });

    test('should handle clearing non-existent node', () => {
      store.setNodeLevelVisibility('node-1', true);
      store.clearNodeLevelVisibility('nonexistent-node'); // Should not error

      expect(useFieldVisibilityStore.getState().nodeLevelOverrides.size).toBe(1);
    });

    test('should handle rapid toggling', () => {
      for (let i = 0; i < 10; i++) {
        store.setGraphLevelVisibility(i % 2 === 0);
      }

      // Should end with false (10 is even, so last iteration sets false)
      expect(useFieldVisibilityStore.getState().graphLevelHideFields).toBe(false);
    });

    test('should handle large number of node overrides', () => {
      for (let i = 0; i < 1000; i++) {
        store.setNodeLevelVisibility(`node-${i}`, i % 2 === 0);
      }

      expect(useFieldVisibilityStore.getState().nodeLevelOverrides.size).toBe(1000);
      expect(store.shouldHideFields('node-500')).toBe(true);
      expect(store.shouldHideFields('node-501')).toBe(false);
    });
  });
});
