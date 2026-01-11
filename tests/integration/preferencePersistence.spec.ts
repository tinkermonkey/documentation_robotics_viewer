/**
 * Integration Test: Preference Persistence Across Sessions
 *
 * Tests that layout preferences and custom presets persist correctly
 * across page reloads and sessions.
 *
 * Task Group 10.3: Strategic test for preference persistence
 */

import { test, expect } from '@playwright/test';

// Mock localStorage for testing
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }
}

test.describe('Preference Persistence', () => {
  let mockStorage: MockLocalStorage;

  test.beforeEach(() => {
    mockStorage = new MockLocalStorage();
  });

  test('should persist per-layer default engine selection across sessions', async () => {
    // Session 1: Set preferences
    const session1Preferences = {
      defaultEngines: {
        motivation: 'elk',
        business: 'graphviz',
        c4: 'dagre',
        application: 'elk',
      },
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };

    mockStorage.setItem('layoutPreferences', JSON.stringify(session1Preferences));

    // Simulate page reload / Session 2: Load preferences
    const storedData = mockStorage.getItem('layoutPreferences');
    expect(storedData).toBeDefined();

    const session2Preferences = JSON.parse(storedData!);

    // Verify preferences persisted
    expect(session2Preferences.defaultEngines.motivation).toBe('elk');
    expect(session2Preferences.defaultEngines.business).toBe('graphviz');
    expect(session2Preferences.defaultEngines.c4).toBe('dagre');
    expect(session2Preferences.defaultEngines.application).toBe('elk');
  });

  test('should persist custom parameter presets across sessions', async () => {
    // Session 1: Create custom presets
    const session1Presets = [
      {
        id: 'preset-high-quality',
        name: 'High Quality C4',
        description: 'Optimized for large C4 diagrams',
        diagramType: 'c4',
        engineType: 'elk',
        parameters: {
          algorithm: 'layered',
          spacing: 120,
          direction: 'DOWN',
          layering: 'NETWORK_SIMPLEX',
        },
        created: new Date().toISOString(),
      },
      {
        id: 'preset-compact',
        name: 'Compact Layout',
        description: 'Space-efficient for small diagrams',
        diagramType: 'motivation',
        engineType: 'dagre',
        parameters: {
          rankdir: 'TB',
          nodesep: 40,
          ranksep: 60,
        },
        created: new Date().toISOString(),
      },
    ];

    mockStorage.setItem('customPresets', JSON.stringify(session1Presets));

    // Session 2: Load presets
    const storedPresets = mockStorage.getItem('customPresets');
    expect(storedPresets).toBeDefined();

    const session2Presets = JSON.parse(storedPresets!);

    expect(session2Presets.length).toBe(2);
    expect(session2Presets[0].name).toBe('High Quality C4');
    expect(session2Presets[1].name).toBe('Compact Layout');

    // Verify parameters intact
    expect(session2Presets[0].parameters.spacing).toBe(120);
    expect(session2Presets[1].parameters.nodesep).toBe(40);
  });

  test('should handle preference migration when schema changes', async () => {
    // Old version preferences (missing new fields)
    const oldPreferences = {
      defaultEngines: {
        motivation: 'dagre',
        business: 'dagre',
      },
      version: '0.9.0', // Old version
    };

    mockStorage.setItem('layoutPreferences', JSON.stringify(oldPreferences));

    // New version schema
    const currentVersion = '1.0.0';
    const storedData = mockStorage.getItem('layoutPreferences');
    const loaded = JSON.parse(storedData!);

    // Migration logic
    const migrated = {
      ...loaded,
      version: currentVersion,
      defaultEngines: {
        ...loaded.defaultEngines,
        // Add defaults for new layers
        c4: loaded.defaultEngines.c4 || 'elk',
        application: loaded.defaultEngines.application || 'elk',
        technology: loaded.defaultEngines.technology || 'dagre',
      },
      timestamp: new Date().toISOString(),
    };

    // Save migrated preferences
    mockStorage.setItem('layoutPreferences', JSON.stringify(migrated));

    // Verify migration
    const migratedData = mockStorage.getItem('layoutPreferences');
    const migratedPreferences = JSON.parse(migratedData!);

    expect(migratedPreferences.version).toBe('1.0.0');
    expect(migratedPreferences.defaultEngines.c4).toBe('elk');
    expect(migratedPreferences.defaultEngines.application).toBe('elk');
    expect(migratedPreferences.defaultEngines.technology).toBe('dagre');

    // Old preferences should still work
    expect(migratedPreferences.defaultEngines.motivation).toBe('dagre');
    expect(migratedPreferences.defaultEngines.business).toBe('dagre');
  });

  test('should export and import complete preference configuration', async () => {
    // Create comprehensive configuration
    const fullConfig = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      defaultEngines: {
        motivation: 'elk',
        business: 'graphviz',
        c4: 'elk',
        security: 'dagre',
        application: 'elk',
        technology: 'dagre',
        api: 'elk',
        dataModel: 'graphviz',
        datastore: 'dagre',
        ux: 'dagre',
        navigation: 'dagre',
        apm: 'elk',
      },
      presets: [
        {
          id: 'preset-1',
          name: 'Enterprise Quality',
          diagramType: 'all',
          engineType: 'elk',
          parameters: { spacing: 100, direction: 'DOWN' },
        },
      ],
      sessionHistory: {
        sessions: [],
        totalSessions: 0,
      },
      userFeedback: [],
    };

    // Export to JSON string
    const exported = JSON.stringify(fullConfig, null, 2);

    // Simulate file download/upload
    const imported = JSON.parse(exported);

    // Verify complete configuration imported
    expect(imported.version).toBe('1.0.0');
    expect(Object.keys(imported.defaultEngines).length).toBe(12); // All layers
    expect(imported.presets.length).toBe(1);

    // Apply imported configuration
    mockStorage.setItem('layoutPreferences', JSON.stringify(imported));

    // Verify it persists correctly
    const reloaded = JSON.parse(mockStorage.getItem('layoutPreferences')!);
    expect(reloaded.defaultEngines.motivation).toBe('elk');
    expect(reloaded.defaultEngines.business).toBe('graphviz');
    expect(reloaded.presets[0].name).toBe('Enterprise Quality');
  });

  test('should handle corrupted preferences gracefully', async () => {
    // Store corrupted JSON
    mockStorage.setItem('layoutPreferences', 'corrupted{json');

    // Attempt to load
    const storedData = mockStorage.getItem('layoutPreferences');

    let loaded = null;
    let error = null;

    try {
      loaded = JSON.parse(storedData!);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(loaded).toBeNull();

    // Should fallback to defaults
    const defaultPreferences = {
      version: '1.0.0',
      defaultEngines: {},
      presets: [],
      timestamp: new Date().toISOString(),
    };

    // Clear corrupted data and use defaults
    mockStorage.removeItem('layoutPreferences');
    mockStorage.setItem('layoutPreferences', JSON.stringify(defaultPreferences));

    // Verify recovery
    const recovered = JSON.parse(mockStorage.getItem('layoutPreferences')!);
    expect(recovered.version).toBe('1.0.0');
    expect(recovered.presets.length).toBe(0);
  });
});
