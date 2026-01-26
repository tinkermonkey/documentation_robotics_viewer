// @ts-nocheck
/**
 * Layout Preferences Store
 *
 * Manages user preferences for layout engines and parameters using Zustand with localStorage persistence.
 * Stores per-layer default engines, custom parameter presets, and user feedback history.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiagramType } from '../types/diagram';
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
 * User feedback entry for refinement sessions
 */
export interface FeedbackEntry {
  /** Feedback timestamp */
  timestamp: string;

  /** Diagram type */
  diagramType: DiagramType;

  /** Layout engine used */
  engineType: LayoutEngineType;

  /** Parameters used */
  parameters: Record<string, any>;

  /** Whether user accepted or rejected this configuration */
  accepted: boolean;

  /** Optional quality score at time of feedback */
  qualityScore?: number;

  /** Optional user comment */
  comment?: string;

  /** Session ID for grouping related feedback */
  sessionId?: string;
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

  /** User feedback history for ML future enhancement */
  feedbackHistory: FeedbackEntry[];

  /** Refinement session states for pause/resume */
  sessions: RefinementSessionState[];

  /** Currently active session ID */
  activeSessionId?: string;

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

  // Actions - Feedback history
  /**
   * Add feedback entry
   */
  addFeedback: (feedback: Omit<FeedbackEntry, 'timestamp'>) => void;

  /**
   * Get feedback for a specific diagram type
   */
  getFeedbackForDiagram: (diagramType: DiagramType) => FeedbackEntry[];

  /**
   * Get accepted feedback only
   */
  getAcceptedFeedback: () => FeedbackEntry[];

  /**
   * Clear feedback history
   */
  clearFeedbackHistory: () => void;

  // Actions - Session management
  /**
   * Save refinement session state
   */
  saveSession: (session: RefinementSessionState) => void;

  /**
   * Load refinement session state by ID
   */
  loadSession: (sessionId: string) => RefinementSessionState | undefined;

  /**
   * Get all saved sessions
   */
  getAllSessions: () => RefinementSessionState[];

  /**
   * Get sessions for a specific diagram type
   */
  getSessionsForDiagram: (diagramType: DiagramType) => RefinementSessionState[];

  /**
   * Delete a session by ID
   */
  deleteSession: (sessionId: string) => void;

  /**
   * Set active session
   */
  setActiveSession: (sessionId: string) => void;

  /**
   * Get active session
   */
  getActiveSession: () => RefinementSessionState | undefined;

  /**
   * Clear active session
   */
  clearActiveSession: () => void;

  /**
   * Clear all sessions
   */
  clearAllSessions: () => void;

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
  feedbackHistory: [],
  sessions: [],
  activeSessionId: undefined,
};

/**
 * Generate unique ID for presets
 */
const generateId = (): string => {
  return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validation utilities for layout preferences
 */
const validatePresetName = (name: string): { valid: boolean; error?: string } => {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Preset name must be a string' };
  }
  if (name.trim().length === 0) {
    return { valid: false, error: 'Preset name cannot be empty' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Preset name must be 100 characters or less' };
  }
  return { valid: true };
};

const validateDiagramType = (diagramType: unknown): diagramType is DiagramType => {
  // Valid diagram types from the enum
  const validTypes = ['motivation', 'business', 'application', 'technology', 'c4', 'data-model'];
  return typeof diagramType === 'string' && validTypes.includes(diagramType);
};

const validateLayoutEngineType = (engineType: unknown): engineType is LayoutEngineType => {
  // Valid engine types from the enum
  const validEngines = [
    'vertical',
    'hierarchical',
    'swimlane',
    'matrix',
    'force',
    'orthogonal',
    'radial',
    'manual',
    'dag',
    'tree',
  ];
  return typeof engineType === 'string' && validEngines.includes(engineType);
};

const validatePresetId = (id: string): { valid: boolean; error?: string } => {
  if (typeof id !== 'string') {
    return { valid: false, error: 'Preset ID must be a string' };
  }
  if (!id.startsWith('preset-')) {
    return { valid: false, error: 'Invalid preset ID format' };
  }
  return { valid: true };
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
        if (!validateDiagramType(diagramType)) {
          console.error(`[LayoutPreferences] Invalid diagram type: ${diagramType}`);
          return;
        }
        if (!validateLayoutEngineType(engineType)) {
          console.error(
            `[LayoutPreferences] Invalid layout engine type: ${engineType} for diagram ${diagramType}`
          );
          return;
        }
        console.log(`[LayoutPreferences] Setting default engine for ${diagramType}: ${engineType}`);
        set((state) => ({
          defaultEngines: {
            ...state.defaultEngines,
            [diagramType]: engineType,
          },
        }));
      },

      getDefaultEngine: (diagramType) => {
        if (!validateDiagramType(diagramType)) {
          console.error(`[LayoutPreferences] Invalid diagram type for getDefaultEngine: ${diagramType}`);
          return undefined;
        }
        return get().defaultEngines[diagramType];
      },

      clearDefaultEngine: (diagramType) => {
        if (!validateDiagramType(diagramType)) {
          console.error(`[LayoutPreferences] Invalid diagram type for clearDefaultEngine: ${diagramType}`);
          return;
        }
        console.log(`[LayoutPreferences] Clearing default engine for ${diagramType}`);
        set((state) => {
          const newEngines = { ...state.defaultEngines };
          delete newEngines[diagramType];
          return { defaultEngines: newEngines };
        });
      },

      // Preset management
      addPreset: (preset) => {
        // Validate preset name
        const nameValidation = validatePresetName(preset.name);
        if (!nameValidation.valid) {
          console.error(`[LayoutPreferences] Invalid preset name: ${nameValidation.error}`);
          return '';
        }

        // Validate diagram type
        if (!validateDiagramType(preset.diagramType)) {
          console.error(`[LayoutPreferences] Invalid diagram type for preset: ${preset.diagramType}`);
          return '';
        }

        // Validate engine type
        if (!validateLayoutEngineType(preset.engineType)) {
          console.error(`[LayoutPreferences] Invalid engine type for preset: ${preset.engineType}`);
          return '';
        }

        // Validate parameters object
        if (preset.parameters && typeof preset.parameters !== 'object') {
          console.error('[LayoutPreferences] Preset parameters must be an object');
          return '';
        }

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
        // Validate preset ID
        const idValidation = validatePresetId(id);
        if (!idValidation.valid) {
          console.error(`[LayoutPreferences] Invalid preset ID: ${idValidation.error}`);
          return;
        }

        // Validate updates if provided
        if (updates.name !== undefined) {
          const nameValidation = validatePresetName(updates.name);
          if (!nameValidation.valid) {
            console.error(`[LayoutPreferences] Invalid preset name in update: ${nameValidation.error}`);
            return;
          }
        }

        if (updates.engineType !== undefined && !validateLayoutEngineType(updates.engineType)) {
          console.error(`[LayoutPreferences] Invalid engine type in update: ${updates.engineType}`);
          return;
        }

        if (updates.parameters !== undefined && typeof updates.parameters !== 'object') {
          console.error('[LayoutPreferences] Preset parameters must be an object');
          return;
        }

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
        const idValidation = validatePresetId(id);
        if (!idValidation.valid) {
          console.error(`[LayoutPreferences] Invalid preset ID for removal: ${idValidation.error}`);
          return;
        }

        console.log(`[LayoutPreferences] Removing preset: ${id}`);
        set((state) => ({
          presets: state.presets.filter((preset) => preset.id !== id),
        }));
      },

      getPreset: (id) => {
        const idValidation = validatePresetId(id);
        if (!idValidation.valid) {
          console.error(`[LayoutPreferences] Invalid preset ID for retrieval: ${idValidation.error}`);
          return undefined;
        }
        return get().presets.find((preset) => preset.id === id);
      },

      getPresetsForDiagram: (diagramType) => {
        if (!validateDiagramType(diagramType)) {
          console.error(`[LayoutPreferences] Invalid diagram type for getPresetsForDiagram: ${diagramType}`);
          return [];
        }
        return get().presets.filter((preset) => preset.diagramType === diagramType);
      },

      renamePreset: (id, newName) => {
        const idValidation = validatePresetId(id);
        if (!idValidation.valid) {
          console.error(`[LayoutPreferences] Invalid preset ID for rename: ${idValidation.error}`);
          return;
        }

        const nameValidation = validatePresetName(newName);
        if (!nameValidation.valid) {
          console.error(`[LayoutPreferences] Invalid new preset name: ${nameValidation.error}`);
          return;
        }

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

      // Feedback history
      addFeedback: (feedback) => {
        // Validate feedback data
        if (!validateDiagramType(feedback.diagramType)) {
          console.error(`[LayoutPreferences] Invalid diagram type in feedback: ${feedback.diagramType}`);
          return;
        }

        if (!validateLayoutEngineType(feedback.engineType)) {
          console.error(`[LayoutPreferences] Invalid engine type in feedback: ${feedback.engineType}`);
          return;
        }

        if (typeof feedback.accepted !== 'boolean') {
          console.error('[LayoutPreferences] Feedback accepted field must be boolean');
          return;
        }

        if (feedback.parameters && typeof feedback.parameters !== 'object') {
          console.error('[LayoutPreferences] Feedback parameters must be an object');
          return;
        }

        if (feedback.qualityScore !== undefined) {
          if (typeof feedback.qualityScore !== 'number' || feedback.qualityScore < 0 || feedback.qualityScore > 100) {
            console.error('[LayoutPreferences] Quality score must be a number between 0 and 100');
            return;
          }
        }

        const entry: FeedbackEntry = {
          ...feedback,
          timestamp: new Date().toISOString(),
        };

        console.log(
          `[LayoutPreferences] Adding feedback: ${entry.diagramType} - ${entry.accepted ? 'accepted' : 'rejected'}`
        );

        set((state) => ({
          feedbackHistory: [...state.feedbackHistory, entry],
        }));
      },

      getFeedbackForDiagram: (diagramType) => {
        if (!validateDiagramType(diagramType)) {
          console.error(`[LayoutPreferences] Invalid diagram type for getFeedbackForDiagram: ${diagramType}`);
          return [];
        }
        return get().feedbackHistory.filter((entry) => entry.diagramType === diagramType);
      },

      getAcceptedFeedback: () => {
        return get().feedbackHistory.filter((entry) => entry.accepted);
      },

      clearFeedbackHistory: () => {
        console.log('[LayoutPreferences] Clearing feedback history');
        set({ feedbackHistory: [] });
      },

      // Session management
      saveSession: (session) => {
        console.log(`[LayoutPreferences] Saving session: ${session.sessionId}`);
        set((state) => {
          // Check if session already exists
          const existingIndex = state.sessions.findIndex((s) => s.sessionId === session.sessionId);

          if (existingIndex >= 0) {
            // Update existing session
            const updatedSessions = [...state.sessions];
            updatedSessions[existingIndex] = {
              ...session,
              updatedAt: new Date().toISOString(),
            };
            return { sessions: updatedSessions };
          } else {
            // Add new session
            return {
              sessions: [...state.sessions, session],
            };
          }
        });
      },

      loadSession: (sessionId) => {
        return get().sessions.find((s) => s.sessionId === sessionId);
      },

      getAllSessions: () => {
        return get().sessions;
      },

      getSessionsForDiagram: (diagramType) => {
        return get().sessions.filter((s) => s.diagramType === diagramType);
      },

      deleteSession: (sessionId) => {
        console.log(`[LayoutPreferences] Deleting session: ${sessionId}`);
        set((state) => ({
          sessions: state.sessions.filter((s) => s.sessionId !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? undefined : state.activeSessionId,
        }));
      },

      setActiveSession: (sessionId) => {
        console.log(`[LayoutPreferences] Setting active session: ${sessionId}`);
        set({ activeSessionId: sessionId });
      },

      getActiveSession: () => {
        const state = get();
        if (!state.activeSessionId) return undefined;
        return state.sessions.find((s) => s.sessionId === state.activeSessionId);
      },

      clearActiveSession: () => {
        console.log('[LayoutPreferences] Clearing active session');
        set({ activeSessionId: undefined });
      },

      clearAllSessions: () => {
        console.log('[LayoutPreferences] Clearing all sessions');
        set({ sessions: [], activeSessionId: undefined });
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
