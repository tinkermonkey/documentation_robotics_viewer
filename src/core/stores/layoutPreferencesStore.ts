/**
 * Layout Preferences Store
 *
 * Manages user preferences for layout engines and parameters using Zustand with localStorage persistence.
 * Stores per-layer default engines and custom parameter presets.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiagramType } from '@/core/types/diagram';
import type { LayoutEngineType } from '../layout/engines/LayoutEngine';

/**
 * Custom parameter preset
 */
export interface LayoutPreset {
  /** Unique preset identifier */
  id: string;

  /** User-friendly preset name */
  name: string;

  /** Optional description */
  description?: string;

  /** Diagram type this preset applies to */
  diagramType: DiagramType;

  /** Layout engine type */
  engineType: LayoutEngineType;

  /** Layout parameters */
  parameters: Record<string, any>;

  /** Creation timestamp */
  createdAt: string;

  /** Last updated timestamp */
  updatedAt?: string;
}


/**
 * Configuration profile for export/import
 */
export interface LayoutConfigurationProfile {
  /** Profile metadata */
  version: string;
  exportedAt: string;

  /** Default engines per layer */
  defaultEngines: Partial<Record<DiagramType, LayoutEngineType>>;

  /** Custom presets */
  presets: LayoutPreset[];
}

/**
 * Layout preferences store state
 */
interface LayoutPreferencesState {
  // State
  /** Default layout engine per diagram type */
  defaultEngines: Partial<Record<DiagramType, LayoutEngineType>>;

  /** Custom parameter presets */
  presets: LayoutPreset[];

  // Actions - Default engine management
  /**
   * Set default layout engine for a diagram type
   */
  setDefaultEngine: (diagramType: DiagramType, engineType: LayoutEngineType) => void;

  /**
   * Get default layout engine for a diagram type
   */
  getDefaultEngine: (diagramType: DiagramType) => LayoutEngineType | undefined;

  /**
   * Clear default engine for a diagram type
   */
  clearDefaultEngine: (diagramType: DiagramType) => void;

  // Actions - Preset management
  /**
   * Add a new custom preset
   */
  addPreset: (preset: Omit<LayoutPreset, 'id' | 'createdAt'>) => string;

  /**
   * Update an existing preset
   */
  updatePreset: (id: string, updates: Partial<Omit<LayoutPreset, 'id' | 'createdAt'>>) => void;

  /**
   * Remove a preset by ID
   */
  removePreset: (id: string) => void;

  /**
   * Get preset by ID
   */
  getPreset: (id: string) => LayoutPreset | undefined;

  /**
   * Get all presets for a diagram type
   */
  getPresetsForDiagram: (diagramType: DiagramType) => LayoutPreset[];

  /**
   * Rename a preset
   */
  renamePreset: (id: string, newName: string) => void;


  // Actions - Export/Import
  /**
   * Export configuration profile as JSON string
   */
  exportConfig: () => string;

  /**
   * Import configuration profile from JSON string
   * @returns true if import successful, false otherwise
   */
  importConfig: (configJson: string) => boolean;

  /**
   * Validate configuration profile
   */
  validateConfig: (config: any) => { valid: boolean; errors: string[] };

  // Actions - Reset
  /**
   * Reset all preferences to defaults
   */
  reset: () => void;
}

/**
 * Default state
 */
const defaultState = {
  defaultEngines: {},
  presets: [],
};

/**
 * Generate unique ID for presets
 */
const generateId = (): string => {
  return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Layout preferences store with localStorage persistence
 */
export const useLayoutPreferencesStore = create<LayoutPreferencesState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Default engine management
      setDefaultEngine: (diagramType, engineType) => {
        console.log(`[LayoutPreferences] Setting default engine for ${diagramType}: ${engineType}`);
        set((state) => ({
          defaultEngines: {
            ...state.defaultEngines,
            [diagramType]: engineType,
          },
        }));
      },

      getDefaultEngine: (diagramType) => {
        return get().defaultEngines[diagramType];
      },

      clearDefaultEngine: (diagramType) => {
        console.log(`[LayoutPreferences] Clearing default engine for ${diagramType}`);
        set((state) => {
          const newEngines = { ...state.defaultEngines };
          delete newEngines[diagramType];
          return { defaultEngines: newEngines };
        });
      },

      // Preset management
      addPreset: (preset) => {
        const id = generateId();
        const newPreset: LayoutPreset = {
          ...preset,
          id,
          createdAt: new Date().toISOString(),
        };

        console.log(`[LayoutPreferences] Adding preset: ${newPreset.name} (${id})`);
        set((state) => ({
          presets: [...state.presets, newPreset],
        }));

        return id;
      },

      updatePreset: (id, updates) => {
        console.log(`[LayoutPreferences] Updating preset: ${id}`);
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? {
                  ...preset,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : preset
          ),
        }));
      },

      removePreset: (id) => {
        console.log(`[LayoutPreferences] Removing preset: ${id}`);
        set((state) => ({
          presets: state.presets.filter((preset) => preset.id !== id),
        }));
      },

      getPreset: (id) => {
        return get().presets.find((preset) => preset.id === id);
      },

      getPresetsForDiagram: (diagramType) => {
        return get().presets.filter((preset) => preset.diagramType === diagramType);
      },

      renamePreset: (id, newName) => {
        console.log(`[LayoutPreferences] Renaming preset ${id} to: ${newName}`);
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? {
                  ...preset,
                  name: newName,
                  updatedAt: new Date().toISOString(),
                }
              : preset
          ),
        }));
      },


      // Export/Import
      exportConfig: () => {
        const state = get();
        const profile: LayoutConfigurationProfile = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          defaultEngines: state.defaultEngines,
          presets: state.presets,
        };

        console.log('[LayoutPreferences] Exporting configuration profile');
        return JSON.stringify(profile, null, 2);
      },

      importConfig: (configJson) => {
        try {
          const config = JSON.parse(configJson);
          const validation = get().validateConfig(config);

          if (!validation.valid) {
            console.error('[LayoutPreferences] Invalid configuration:', validation.errors);
            return false;
          }

          console.log('[LayoutPreferences] Importing configuration profile');
          set({
            defaultEngines: config.defaultEngines || {},
            presets: config.presets || [],
          });

          return true;
        } catch (error) {
          console.error('[LayoutPreferences] Failed to import configuration:', error);
          return false;
        }
      },

      validateConfig: (config) => {
        const errors: string[] = [];

        // Check version
        if (!config.version) {
          errors.push('Missing version field');
        }

        // Validate defaultEngines
        if (config.defaultEngines && typeof config.defaultEngines !== 'object') {
          errors.push('defaultEngines must be an object');
        }

        // Validate presets
        if (config.presets) {
          if (!Array.isArray(config.presets)) {
            errors.push('presets must be an array');
          } else {
            config.presets.forEach((preset: any, index: number) => {
              if (!preset.id) {
                errors.push(`Preset ${index}: missing id`);
              }
              if (!preset.name) {
                errors.push(`Preset ${index}: missing name`);
              }
              if (!preset.diagramType) {
                errors.push(`Preset ${index}: missing diagramType`);
              }
              if (!preset.engineType) {
                errors.push(`Preset ${index}: missing engineType`);
              }
              if (!preset.parameters) {
                errors.push(`Preset ${index}: missing parameters`);
              }
            });
          }
        }

        return {
          valid: errors.length === 0,
          errors,
        };
      },

      // Reset
      reset: () => {
        console.log('[LayoutPreferences] Resetting to defaults');
        set(defaultState);
      },
    }),
    {
      name: 'dr-layout-preferences',
      version: 1,
      // Custom storage to handle potential errors
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return JSON.parse(str);
          } catch (error) {
            console.error('[LayoutPreferences] Error reading from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              console.error('[LayoutPreferences] localStorage quota exceeded');
            } else {
              console.error('[LayoutPreferences] Error writing to localStorage:', error);
            }
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('[LayoutPreferences] Error removing from localStorage:', error);
          }
        },
      },
    }
  )
);
