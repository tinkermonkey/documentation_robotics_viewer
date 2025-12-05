/**
 * Unit Tests for feedbackToParameterService
 *
 * Tests the translation of human feedback into concrete parameter adjustment suggestions.
 */

import { test, expect } from '@playwright/test';
import {
  translateFeedback,
  translateAccumulatedFeedback,
  applyParameterSuggestions,
  getDefaultParameters,
  getParameterRanges,
  PARAMETER_RANGES,
} from '../../src/apps/embedded/services/refinement/feedbackToParameterService';
import {
  HumanFeedback,
  LayoutParameters,
} from '../../src/apps/embedded/types/refinement';

test.describe('feedbackToParameterService', () => {
  test.describe('translateFeedback', () => {
    test.describe('force-directed layout', () => {
      test('should translate "increase spacing" feedback correctly', () => {
        const feedback: HumanFeedback = {
          aspect: 'spacing',
          direction: 'increase',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');

        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.overallConfidence).toBeGreaterThan(0);

        // Check chargeStrength is adjusted (more negative = more spacing)
        const chargeSuggestion = result.suggestions.find(
          (s) => s.parameter === 'forceDirected.chargeStrength'
        );
        expect(chargeSuggestion).toBeDefined();
        expect(chargeSuggestion!.suggestedValue).toBeLessThan(chargeSuggestion!.currentValue);
      });

      test('should translate "decrease spacing" feedback correctly', () => {
        const feedback: HumanFeedback = {
          aspect: 'spacing',
          direction: 'decrease',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');

        // Check chargeStrength is adjusted (less negative = less spacing)
        const chargeSuggestion = result.suggestions.find(
          (s) => s.parameter === 'forceDirected.chargeStrength'
        );
        expect(chargeSuggestion).toBeDefined();
        expect(chargeSuggestion!.suggestedValue).toBeGreaterThan(chargeSuggestion!.currentValue);
      });

      test('should translate "better alignment" feedback correctly', () => {
        const feedback: HumanFeedback = {
          aspect: 'alignment',
          direction: 'increase',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');

        // Alignment should adjust iterations and centerForce
        const iterationsSuggestion = result.suggestions.find(
          (s) => s.parameter === 'forceDirected.iterations'
        );
        expect(iterationsSuggestion).toBeDefined();
        expect(iterationsSuggestion!.suggestedValue).toBeGreaterThan(
          iterationsSuggestion!.currentValue
        );
      });

      test('should translate "tighter grouping" feedback correctly', () => {
        const feedback: HumanFeedback = {
          aspect: 'grouping',
          direction: 'increase',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');

        // Tighter grouping = less negative chargeStrength, less linkDistance
        const chargeSuggestion = result.suggestions.find(
          (s) => s.parameter === 'forceDirected.chargeStrength'
        );
        expect(chargeSuggestion).toBeDefined();
        expect(chargeSuggestion!.suggestedValue).toBeGreaterThan(chargeSuggestion!.currentValue);
      });

      test('should handle "routing" feedback', () => {
        const feedback: HumanFeedback = {
          aspect: 'routing',
          direction: 'increase',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');

        // Routing should increase iterations
        expect(result.suggestions.length).toBeGreaterThan(0);
        const iterationsSuggestion = result.suggestions.find(
          (s) => s.parameter === 'forceDirected.iterations'
        );
        expect(iterationsSuggestion).toBeDefined();
      });

      test('should handle "overall" feedback', () => {
        const feedback: HumanFeedback = {
          aspect: 'overall',
          direction: 'increase',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');

        // Overall should adjust multiple parameters
        expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
      });
    });

    test.describe('hierarchical layout', () => {
      test('should translate "increase spacing" feedback correctly', () => {
        const feedback: HumanFeedback = {
          aspect: 'spacing',
          direction: 'increase',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('hierarchical');

        const result = translateFeedback(feedback, params, 'hierarchical');

        expect(result.suggestions.length).toBeGreaterThan(0);

        // Check nodeSpacing is increased
        const nodeSpacingSuggestion = result.suggestions.find(
          (s) => s.parameter === 'hierarchical.nodeSpacing'
        );
        expect(nodeSpacingSuggestion).toBeDefined();
        expect(nodeSpacingSuggestion!.suggestedValue).toBeGreaterThan(
          nodeSpacingSuggestion!.currentValue
        );
      });

      test('should translate "tighter grouping" for hierarchical layout', () => {
        const feedback: HumanFeedback = {
          aspect: 'grouping',
          direction: 'increase',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('hierarchical');

        const result = translateFeedback(feedback, params, 'hierarchical');

        // Tighter grouping = reduced spacing
        const nodeSpacingSuggestion = result.suggestions.find(
          (s) => s.parameter === 'hierarchical.nodeSpacing'
        );
        expect(nodeSpacingSuggestion).toBeDefined();
        expect(nodeSpacingSuggestion!.suggestedValue).toBeLessThan(
          nodeSpacingSuggestion!.currentValue
        );
      });
    });

    test.describe('intensity levels', () => {
      test('should apply slight intensity correctly', () => {
        const feedback: HumanFeedback = {
          aspect: 'spacing',
          direction: 'increase',
          intensity: 'slight',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');
        const chargeSuggestion = result.suggestions.find(
          (s) => s.parameter === 'forceDirected.chargeStrength'
        );

        // Slight = 10% adjustment
        const delta = Math.abs(
          chargeSuggestion!.suggestedValue - chargeSuggestion!.currentValue
        );
        expect(delta).toBeLessThanOrEqual(500 * 0.1 + 1); // baseDelta * 0.1 with margin
      });

      test('should apply significant intensity correctly', () => {
        const feedback: HumanFeedback = {
          aspect: 'spacing',
          direction: 'increase',
          intensity: 'significant',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');
        const chargeSuggestion = result.suggestions.find(
          (s) => s.parameter === 'forceDirected.chargeStrength'
        );

        // Significant = 50% adjustment
        const delta = Math.abs(
          chargeSuggestion!.suggestedValue - chargeSuggestion!.currentValue
        );
        expect(delta).toBeGreaterThanOrEqual(500 * 0.5 - 1); // baseDelta * 0.5 with margin
      });
    });

    test.describe('acceptable direction', () => {
      test('should return no suggestions for acceptable feedback', () => {
        const feedback: HumanFeedback = {
          aspect: 'spacing',
          direction: 'acceptable',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');

        expect(result.suggestions).toHaveLength(0);
        expect(result.overallConfidence).toBe(1.0);
        expect(result.explanation).toContain('acceptable');
      });
    });

    test.describe('value clamping', () => {
      test('should clamp values to valid ranges', () => {
        const feedback: HumanFeedback = {
          aspect: 'spacing',
          direction: 'increase',
          intensity: 'significant',
        };

        // Start with chargeStrength already near minimum
        const params: LayoutParameters = {
          forceDirected: {
            chargeStrength: -4800,
            linkDistance: 150,
            centerForce: 0.5,
            iterations: 300,
          },
        };

        const result = translateFeedback(feedback, params, 'force-directed');
        const chargeSuggestion = result.suggestions.find(
          (s) => s.parameter === 'forceDirected.chargeStrength'
        );

        // Should not go below -5000
        expect(chargeSuggestion!.suggestedValue).toBeGreaterThanOrEqual(-5000);
      });

      test('should clamp iterations to maximum', () => {
        const feedback: HumanFeedback = {
          aspect: 'alignment',
          direction: 'increase',
          intensity: 'significant',
        };

        const params: LayoutParameters = {
          forceDirected: {
            chargeStrength: -1000,
            linkDistance: 150,
            centerForce: 0.5,
            iterations: 480,
          },
        };

        const result = translateFeedback(feedback, params, 'force-directed');
        const iterationsSuggestion = result.suggestions.find(
          (s) => s.parameter === 'forceDirected.iterations'
        );

        // Should not exceed 500
        expect(iterationsSuggestion!.suggestedValue).toBeLessThanOrEqual(500);
      });
    });

    test.describe('confidence calculation', () => {
      test('should provide reasonable confidence scores', () => {
        const feedback: HumanFeedback = {
          aspect: 'spacing',
          direction: 'increase',
          intensity: 'moderate',
        };
        const params = getDefaultParameters('force-directed');

        const result = translateFeedback(feedback, params, 'force-directed');

        expect(result.overallConfidence).toBeGreaterThan(0);
        expect(result.overallConfidence).toBeLessThanOrEqual(1);

        // Each suggestion should have confidence
        for (const suggestion of result.suggestions) {
          expect(suggestion.confidence).toBeGreaterThan(0);
          expect(suggestion.confidence).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  test.describe('translateAccumulatedFeedback', () => {
    test('should aggregate multiple feedback items', () => {
      const feedbackItems: HumanFeedback[] = [
        { aspect: 'spacing', direction: 'increase', intensity: 'slight' },
        { aspect: 'spacing', direction: 'increase', intensity: 'moderate' },
        { aspect: 'spacing', direction: 'increase', intensity: 'slight' },
      ];
      const params = getDefaultParameters('force-directed');

      const result = translateAccumulatedFeedback(feedbackItems, params, 'force-directed');

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.explanation).toContain('Aggregated');
      expect(result.explanation).toContain('3');
    });

    test('should handle empty feedback array', () => {
      const result = translateAccumulatedFeedback(
        [],
        getDefaultParameters('force-directed'),
        'force-directed'
      );

      expect(result.suggestions).toHaveLength(0);
      expect(result.overallConfidence).toBe(0);
    });

    test('should weight recent feedback higher', () => {
      // Slight decrease followed by significant increase
      const feedbackItems: HumanFeedback[] = [
        { aspect: 'spacing', direction: 'decrease', intensity: 'slight' },
        { aspect: 'spacing', direction: 'increase', intensity: 'significant' },
      ];
      const params = getDefaultParameters('force-directed');

      const result = translateAccumulatedFeedback(feedbackItems, params, 'force-directed');

      // The more recent significant increase should dominate
      const chargeSuggestion = result.suggestions.find(
        (s) => s.parameter === 'forceDirected.chargeStrength'
      );

      // If the increase is dominant, chargeStrength should be more negative
      if (chargeSuggestion) {
        expect(chargeSuggestion.suggestedValue).toBeLessThan(params.forceDirected!.chargeStrength);
      }
    });

    test('should aggregate mixed aspects', () => {
      const feedbackItems: HumanFeedback[] = [
        { aspect: 'spacing', direction: 'increase', intensity: 'moderate' },
        { aspect: 'alignment', direction: 'increase', intensity: 'moderate' },
      ];
      const params = getDefaultParameters('force-directed');

      const result = translateAccumulatedFeedback(feedbackItems, params, 'force-directed');

      // Should have suggestions for both spacing and alignment parameters
      expect(result.explanation).toContain('spacing');
      expect(result.explanation).toContain('alignment');
    });

    test('should include Combined rationale when aggregating same parameter', () => {
      const feedbackItems: HumanFeedback[] = [
        { aspect: 'spacing', direction: 'increase', intensity: 'slight' },
        { aspect: 'spacing', direction: 'increase', intensity: 'moderate' },
        { aspect: 'spacing', direction: 'increase', intensity: 'significant' },
      ];
      const params = getDefaultParameters('force-directed');

      const result = translateAccumulatedFeedback(feedbackItems, params, 'force-directed');

      // At least one suggestion should have "Combined" in rationale
      const hasCombined = result.suggestions.some((s) => s.rationale.includes('Combined'));
      expect(hasCombined).toBe(true);
    });
  });

  test.describe('applyParameterSuggestions', () => {
    test('should apply suggestions to create new parameters', () => {
      const params = getDefaultParameters('force-directed');
      const suggestions = [
        {
          parameter: 'forceDirected.chargeStrength',
          currentValue: -1000,
          suggestedValue: -1200,
          confidence: 0.8,
          rationale: 'Increase spacing',
        },
        {
          parameter: 'forceDirected.linkDistance',
          currentValue: 150,
          suggestedValue: 180,
          confidence: 0.8,
          rationale: 'Increase spacing',
        },
      ];

      const newParams = applyParameterSuggestions(params, suggestions);

      expect(newParams.forceDirected?.chargeStrength).toBe(-1200);
      expect(newParams.forceDirected?.linkDistance).toBe(180);
      // Original params unchanged
      expect(params.forceDirected?.chargeStrength).toBe(-1000);
    });

    test('should handle empty suggestions', () => {
      const params = getDefaultParameters('force-directed');
      const newParams = applyParameterSuggestions(params, []);

      expect(newParams).toEqual(params);
    });

    test('should create nested structure if needed', () => {
      const params: LayoutParameters = {};
      const suggestions = [
        {
          parameter: 'forceDirected.chargeStrength',
          currentValue: -1000,
          suggestedValue: -1200,
          confidence: 0.8,
          rationale: 'Test',
        },
      ];

      const newParams = applyParameterSuggestions(params, suggestions);

      expect(newParams.forceDirected).toBeDefined();
      expect(newParams.forceDirected?.chargeStrength).toBe(-1200);
    });
  });

  test.describe('getDefaultParameters', () => {
    test('should return force-directed defaults', () => {
      const params = getDefaultParameters('force-directed');

      expect(params.forceDirected).toBeDefined();
      expect(params.forceDirected?.chargeStrength).toBe(
        PARAMETER_RANGES['forceDirected.chargeStrength'].default
      );
      expect(params.forceDirected?.linkDistance).toBe(
        PARAMETER_RANGES['forceDirected.linkDistance'].default
      );
    });

    test('should return hierarchical defaults', () => {
      const params = getDefaultParameters('hierarchical');

      expect(params.hierarchical).toBeDefined();
      expect(params.hierarchical?.nodeSpacing).toBe(
        PARAMETER_RANGES['hierarchical.nodeSpacing'].default
      );
      expect(params.hierarchical?.rankSpacing).toBe(
        PARAMETER_RANGES['hierarchical.rankSpacing'].default
      );
    });
  });

  test.describe('getParameterRanges', () => {
    test('should return all parameter ranges', () => {
      const ranges = getParameterRanges();

      expect(ranges['forceDirected.chargeStrength']).toBeDefined();
      expect(ranges['forceDirected.linkDistance']).toBeDefined();
      expect(ranges['hierarchical.nodeSpacing']).toBeDefined();
    });

    test('should have valid min/max/default values', () => {
      const ranges = getParameterRanges();

      for (const [key, range] of Object.entries(ranges)) {
        expect(range.min).toBeLessThanOrEqual(range.max);
        expect(range.default).toBeGreaterThanOrEqual(range.min);
        expect(range.default).toBeLessThanOrEqual(range.max);
      }
    });
  });
});
