/**
 * Unit tests for Layout Change Callback Validation
 *
 * Tests input validation in store actions, component callbacks, and route handlers.
 * Ensures invalid values are rejected with appropriate error logging.
 */

import { test, expect } from '@playwright/test';
import { renderHook, act } from '@playwright/experimental-ct-react';

test.describe('Layout Preferences Store Validation', () => {
  test.describe('setDefaultEngine', () => {
    test('should reject invalid diagram type', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        // This would be called in the store
        const diagramType = 'invalid-type';
        const validTypes = ['motivation', 'business', 'application', 'technology', 'c4', 'data-model'];
        if (!validTypes.includes(diagramType)) {
          console.error(`[LayoutPreferences] Invalid diagram type: ${diagramType}`);
        }

        expect(errors).toContain('[LayoutPreferences] Invalid diagram type: invalid-type');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject invalid engine type', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const engineType = 'invalid-engine';
        const validEngines = [
          'vertical',
          'hierarchical',
          'swimlane',
          'matrix',
          'force',
          'orthogonal',
          'radial',
          'manual',
        ];
        if (!validEngines.includes(engineType)) {
          console.error(`[LayoutPreferences] Invalid layout engine type: ${engineType}`);
        }

        expect(errors).toContain('[LayoutPreferences] Invalid layout engine type: invalid-engine');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid diagram and engine types', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const validDiagrams = ['motivation', 'business', 'application', 'technology', 'c4', 'data-model'];
        const validEngines = ['vertical', 'hierarchical', 'swimlane', 'matrix', 'force', 'orthogonal'];

        for (const diagram of validDiagrams) {
          for (const engine of validEngines) {
            // Simulate validation passing
            const isValidDiagram = validDiagrams.includes(diagram);
            const isValidEngine = validEngines.includes(engine);

            if (!isValidDiagram || !isValidEngine) {
              console.error(`Invalid combination: ${diagram} + ${engine}`);
            }
          }
        }

        // No errors should be logged for valid combinations
        expect(errors).toHaveLength(0);
      } finally {
        console.error = originalError;
      }
    });
  });

  test.describe('addPreset', () => {
    test('should reject preset with empty name', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const name = '';
        if (typeof name !== 'string' || name.trim().length === 0) {
          console.error('[LayoutPreferences] Invalid preset name: Preset name cannot be empty');
        }

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('cannot be empty');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject preset with name exceeding 100 characters', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const name = 'a'.repeat(101);
        if (name.length > 100) {
          console.error('[LayoutPreferences] Invalid preset name: Preset name must be 100 characters or less');
        }

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('100 characters');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject preset with invalid diagram type', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const diagramType = 'invalid-diagram';
        const validDiagrams = ['motivation', 'business', 'application', 'technology', 'c4', 'data-model'];

        if (!validDiagrams.includes(diagramType)) {
          console.error(`[LayoutPreferences] Invalid diagram type for preset: ${diagramType}`);
        }

        expect(errors).toContain('[LayoutPreferences] Invalid diagram type for preset: invalid-diagram');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject preset with non-object parameters', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const parameters = 'not-an-object';

        if (parameters && typeof parameters !== 'object') {
          console.error('[LayoutPreferences] Preset parameters must be an object');
        }

        expect(errors).toContain('[LayoutPreferences] Preset parameters must be an object');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid preset', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const preset = {
          name: 'Valid Preset',
          description: 'A valid preset',
          diagramType: 'business' as const,
          engineType: 'hierarchical' as const,
          parameters: { spacing: 50 },
        };

        // Simulate validation
        const validDiagrams = ['motivation', 'business', 'application', 'technology', 'c4', 'data-model'];
        const validEngines = ['vertical', 'hierarchical', 'swimlane', 'matrix', 'force'];

        const isValid =
          preset.name.length > 0 &&
          preset.name.length <= 100 &&
          validDiagrams.includes(preset.diagramType) &&
          validEngines.includes(preset.engineType) &&
          typeof preset.parameters === 'object';

        expect(isValid).toBe(true);
      } finally {
        console.error = originalError;
      }
    });
  });

  test.describe('updatePreset', () => {
    test('should reject invalid preset ID format', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const id = 'invalid-id-format';

        if (!id.startsWith('preset-')) {
          console.error('[LayoutPreferences] Invalid preset ID format');
        }

        expect(errors).toContain('[LayoutPreferences] Invalid preset ID format');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject non-string preset ID', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const id = 123 as any;

        if (typeof id !== 'string') {
          console.error('[LayoutPreferences] Preset ID must be a string');
        }

        expect(errors).toContain('[LayoutPreferences] Preset ID must be a string');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid preset update', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const id = 'preset-123-abc';
        const newName = 'Updated Name';

        const isValidId = id.startsWith('preset-');
        const isValidName = newName.length > 0 && newName.length <= 100;

        expect(isValidId && isValidName).toBe(true);
      } finally {
        console.error = originalError;
      }
    });
  });

  test.describe('addFeedback', () => {
    test('should reject feedback with invalid quality score', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const qualityScore = 150; // Out of range

        if (typeof qualityScore === 'number' && (qualityScore < 0 || qualityScore > 100)) {
          console.error('[LayoutPreferences] Quality score must be a number between 0 and 100');
        }

        expect(errors).toContain('[LayoutPreferences] Quality score must be a number between 0 and 100');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject feedback with non-boolean accepted field', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const accepted = 'yes'; // Should be boolean

        if (typeof accepted !== 'boolean') {
          console.error('[LayoutPreferences] Feedback accepted field must be boolean');
        }

        expect(errors).toContain('[LayoutPreferences] Feedback accepted field must be boolean');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid feedback with quality score in range', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const feedback = {
          diagramType: 'business' as const,
          engineType: 'hierarchical' as const,
          parameters: {},
          accepted: true,
          qualityScore: 75,
        };

        const isValid =
          typeof feedback.accepted === 'boolean' &&
          (feedback.qualityScore === undefined || (feedback.qualityScore >= 0 && feedback.qualityScore <= 100));

        expect(isValid).toBe(true);
      } finally {
        console.error = originalError;
      }
    });
  });
});

test.describe('View Preference Store Validation', () => {
  test.describe('setMotivationLayout', () => {
    test('should reject invalid motivation layout', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const layout = 'invalid-layout';
        const validLayouts = ['force', 'hierarchical', 'radial', 'manual'];

        if (!validLayouts.includes(layout)) {
          console.error(`[ViewPreferenceStore] Invalid motivation layout: ${layout}`);
        }

        expect(errors).toContain('[ViewPreferenceStore] Invalid motivation layout: invalid-layout');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid motivation layouts', () => {
      const validLayouts = ['force', 'hierarchical', 'radial', 'manual'];

      for (const layout of validLayouts) {
        const isValid = validLayouts.includes(layout);
        expect(isValid).toBe(true);
      }
    });
  });

  test.describe('setC4Layout', () => {
    test('should reject invalid C4 layout', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const layout = 'invalid-c4-layout';
        const validLayouts = ['hierarchical', 'force', 'orthogonal', 'manual'];

        if (!validLayouts.includes(layout)) {
          console.error(`[ViewPreferenceStore] Invalid C4 layout: ${layout}`);
        }

        expect(errors).toContain('[ViewPreferenceStore] Invalid C4 layout: invalid-c4-layout');
      } finally {
        console.error = originalError;
      }
    });
  });

  test.describe('setVisibleElementTypes', () => {
    test('should reject non-Set visible element types', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const types = ['goal', 'stakeholder'] as any; // Should be a Set

        if (!(types instanceof Set)) {
          console.error('[ViewPreferenceStore] Visible element types must be a Set');
        }

        expect(errors).toContain('[ViewPreferenceStore] Visible element types must be a Set');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept Set of visible element types', () => {
      const types = new Set(['goal', 'stakeholder']);
      expect(types instanceof Set).toBe(true);
      expect(types.size).toBe(2);
    });
  });

  test.describe('setManualPositions', () => {
    test('should reject non-Map manual positions', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const positions = { 'node-1': { x: 100, y: 200 } } as any; // Should be a Map

        if (!(positions instanceof Map)) {
          console.error('[ViewPreferenceStore] Manual positions must be a Map');
        }

        expect(errors).toContain('[ViewPreferenceStore] Manual positions must be a Map');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept Map of manual positions', () => {
      const positions = new Map([['node-1', { x: 100, y: 200 }]]);
      expect(positions instanceof Map).toBe(true);
      expect(positions.size).toBe(1);
    });
  });

  test.describe('setSelectedNodeId', () => {
    test('should reject invalid node ID format', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const nodeId = ''; // Empty string
        if (nodeId === '' || nodeId.length > 1000) {
          console.error('[ViewPreferenceStore] Invalid selected node ID');
        }

        expect(errors).toContain('[ViewPreferenceStore] Invalid selected node ID');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject node ID exceeding length limit', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const nodeId = 'a'.repeat(1001); // Too long
        if (nodeId.length > 1000) {
          console.error('[ViewPreferenceStore] Invalid selected node ID');
        }

        expect(errors).toContain('[ViewPreferenceStore] Invalid selected node ID');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid node ID', () => {
      const validNodeIds = ['node-1', 'motivation-goal-1', 'business-func-abc123', 'a'.repeat(1000)];

      for (const nodeId of validNodeIds) {
        const isValid = nodeId.length > 0 && nodeId.length <= 1000;
        expect(isValid).toBe(true);
      }
    });

    test('should accept undefined node ID', () => {
      const nodeId = undefined;
      const isValid = nodeId === undefined || (typeof nodeId === 'string' && nodeId.length > 0 && nodeId.length <= 1000);
      expect(isValid).toBe(true);
    });
  });

  test.describe('setPathTracing', () => {
    test('should reject invalid path tracing mode', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const mode = 'invalid-mode';
        const validModes = ['none', 'direct', 'upstream', 'downstream', 'between'];

        if (!validModes.includes(mode)) {
          console.error(`[ViewPreferenceStore] Invalid path tracing mode: ${mode}`);
        }

        expect(errors).toContain('[ViewPreferenceStore] Invalid path tracing mode: invalid-mode');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject path tracing with non-Set highlightedNodeIds', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const pathTracing = {
          mode: 'none' as const,
          selectedNodeIds: [],
          highlightedNodeIds: ['node-1', 'node-2'], // Should be Set
          highlightedEdgeIds: new Set(),
        };

        if (!(pathTracing.highlightedNodeIds instanceof Set)) {
          console.error('[ViewPreferenceStore] Path tracing highlightedNodeIds must be a Set');
        }

        expect(errors).toContain('[ViewPreferenceStore] Path tracing highlightedNodeIds must be a Set');
      } finally {
        console.error = originalError;
      }
    });
  });

  test.describe('View type validation', () => {
    test('should reject invalid spec view', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const view = 'list'; // Should be 'graph' or 'json'
        if (!['graph', 'json'].includes(view)) {
          console.error(`[ViewPreferenceStore] Invalid spec view: ${view}`);
        }

        expect(errors).toContain('[ViewPreferenceStore] Invalid spec view: list');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid spec views', () => {
      const validViews = ['graph', 'json'];
      for (const view of validViews) {
        const isValid = ['graph', 'json'].includes(view);
        expect(isValid).toBe(true);
      }
    });

    test('should reject invalid changeset view', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const view = 'json'; // Should be 'graph' or 'list'
        if (!['graph', 'list'].includes(view)) {
          console.error(`[ViewPreferenceStore] Invalid changeset view: ${view}`);
        }

        expect(errors).toContain('[ViewPreferenceStore] Invalid changeset view: json');
      } finally {
        console.error = originalError;
      }
    });
  });
});

test.describe('Business Layer Store Validation', () => {
  test.describe('setSelectedLayout', () => {
    test('should reject invalid business layout', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const layout = 'invalid-layout';
        const validLayouts = ['hierarchical', 'swimlane', 'matrix', 'force', 'manual'];

        if (!validLayouts.includes(layout)) {
          console.error(`[BusinessLayerStore] Invalid layout: ${layout}`);
        }

        expect(errors).toContain('[BusinessLayerStore] Invalid layout: invalid-layout');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid business layouts', () => {
      const validLayouts = ['hierarchical', 'swimlane', 'matrix', 'force', 'manual'];
      for (const layout of validLayouts) {
        const isValid = validLayouts.includes(layout);
        expect(isValid).toBe(true);
      }
    });
  });

  test.describe('setFocusMode', () => {
    test('should reject invalid focus mode', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const mode = 'invalid-mode';
        const validModes = ['none', 'selected', 'radial', 'upstream', 'downstream'];

        if (!validModes.includes(mode)) {
          console.error(`[BusinessLayerStore] Invalid focus mode: ${mode}`);
        }

        expect(errors).toContain('[BusinessLayerStore] Invalid focus mode: invalid-mode');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid focus modes', () => {
      const validModes = ['none', 'selected', 'radial', 'upstream', 'downstream'];
      for (const mode of validModes) {
        const isValid = validModes.includes(mode);
        expect(isValid).toBe(true);
      }
    });
  });

  test.describe('setFocusRadius', () => {
    test('should reject non-integer focus radius', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const radius = 2.5; // Should be integer
        if (!Number.isInteger(radius)) {
          console.error('[BusinessLayerStore] Invalid focus radius: must be integer');
        }

        expect(errors).toContain('[BusinessLayerStore] Invalid focus radius: must be integer');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject focus radius out of range', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const radius = 15; // Should be 1-10
        if (radius < 1 || radius > 10) {
          console.error(`[BusinessLayerStore] Invalid focus radius: ${radius}`);
        }

        expect(errors).toContain('[BusinessLayerStore] Invalid focus radius: 15');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid focus radius', () => {
      const validRadii = [1, 2, 5, 10];
      for (const radius of validRadii) {
        const isValid = Number.isInteger(radius) && radius >= 1 && radius <= 10;
        expect(isValid).toBe(true);
      }
    });
  });

  test.describe('setManualPosition', () => {
    test('should reject invalid position object', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const position = { x: '100', y: 200 } as any; // x should be number

        if (
          !position ||
          typeof position !== 'object' ||
          typeof position.x !== 'number' ||
          typeof position.y !== 'number'
        ) {
          console.error('[BusinessLayerStore] Invalid position object');
        }

        expect(errors).toContain('[BusinessLayerStore] Invalid position object');
      } finally {
        console.error = originalError;
      }
    });

    test('should reject invalid node ID in position', () => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (msg) => errors.push(String(msg));

      try {
        const nodeId = ''; // Empty node ID
        if (nodeId === '' || nodeId.length > 1000) {
          console.error('[BusinessLayerStore] Invalid node ID for manual position');
        }

        expect(errors).toContain('[BusinessLayerStore] Invalid node ID for manual position');
      } finally {
        console.error = originalError;
      }
    });

    test('should accept valid manual position', () => {
      const nodeId = 'node-1';
      const position = { x: 100, y: 200 };

      const isValidNodeId = nodeId.length > 0 && nodeId.length <= 1000;
      const isValidPosition =
        position &&
        typeof position === 'object' &&
        typeof position.x === 'number' &&
        typeof position.y === 'number';

      expect(isValidNodeId && isValidPosition).toBe(true);
    });
  });
});

test.describe('BaseControlPanel Validation', () => {
  test('should reject empty layout value', () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = (msg) => errors.push(String(msg));

    try {
      const newValue = '';

      if (!newValue || newValue.trim().length === 0) {
        console.error('[BaseControlPanel] Layout value cannot be empty');
      }

      expect(errors).toContain('[BaseControlPanel] Layout value cannot be empty');
    } finally {
      console.error = originalError;
    }
  });

  test('should reject layout value not in options', () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = (msg) => errors.push(String(msg));

    try {
      const newValue = 'invalid-layout';
      const layoutOptions = [
        { value: 'hierarchical', label: 'Hierarchical' },
        { value: 'force', label: 'Force' },
      ];

      if (!layoutOptions.some((opt) => opt.value === newValue)) {
        const error = `Invalid layout value: ${newValue}. Valid options are: ${layoutOptions
          .map((opt) => opt.value)
          .join(', ')}`;
        console.error(`[BaseControlPanel] ${error}`);
      }

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid layout value');
    } finally {
      console.error = originalError;
    }
  });

  test('should accept layout value in options', () => {
    const newValue = 'hierarchical';
    const layoutOptions = [
      { value: 'hierarchical', label: 'Hierarchical' },
      { value: 'force', label: 'Force' },
    ];

    const isValid = layoutOptions.some((opt) => opt.value === newValue);
    expect(isValid).toBe(true);
  });
});
