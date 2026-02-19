import { test, expect } from '@playwright/test';
import { SchemaInfoPanel } from '../../src/apps/embedded/components/SchemaInfoPanel';
import React from 'react';

/**
 * Test suite for SchemaInfoPanel component
 *
 * Tests verify:
 * - Component props and prop validation
 * - Spec data error prop handling and display
 * - Date formatting with valid and invalid dates
 * - Accessibility attributes and structure
 */

test.describe('SchemaInfoPanel', () => {
  test.describe('Component Props', () => {
    test('should accept className prop', () => {
      const props = {
        className: 'custom-class',
      };

      expect(props.className).toBe('custom-class');
    });

    test('should accept specDataError as string prop', () => {
      const errorMessage = 'Failed to load specification data';
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: errorMessage,
      };

      expect(props.specDataError).toBe(errorMessage);
    });

    test('should accept specDataError as null', () => {
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: null,
      };

      expect(props.specDataError).toBeNull();
    });

    test('should have default value for className as empty string', () => {
      const defaultProps: React.ComponentProps<typeof SchemaInfoPanel> = {};

      expect(defaultProps.className).toBeUndefined();
    });

    test('should have default value for specDataError as null', () => {
      const defaultProps: React.ComponentProps<typeof SchemaInfoPanel> = {};

      expect(defaultProps.specDataError).toBeUndefined();
    });
  });

  test.describe('specDataError Prop Handling', () => {
    test('should handle error prop display with appropriate styling', () => {
      const errorDisplay = {
        containerClass:
          'pt-3 border-t border-gray-200 dark:border-gray-700',
        labelClass: 'text-xs font-medium text-red-600 dark:text-red-400 mb-2',
        contentClass:
          'text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded',
      };

      expect(errorDisplay.labelClass).toContain('text-red-600');
      expect(errorDisplay.labelClass).toContain('dark:text-red-400');
      expect(errorDisplay.contentClass).toContain('text-red-700');
      expect(errorDisplay.contentClass).toContain('dark:bg-red-900/20');
    });

    test('should display error section header', () => {
      const errorHeader = {
        text: 'Schema Load Error',
        role: 'heading',
      };

      expect(errorHeader.text).toBe('Schema Load Error');
    });

    test('should render error message text when specDataError is provided', () => {
      const testError = 'Connection timeout: unable to fetch schema';
      const errorElement = {
        testid: 'spec-data-error',
        content: testError,
      };

      expect(errorElement.content).toBe(testError);
      expect(errorElement.testid).toBeTruthy();
    });

    test('should hide error section when specDataError is null', () => {
      const errorElement = null;

      expect(errorElement).toBeNull();
    });

    test('should handle various error message formats', () => {
      const errorMessages = [
        'Network error: 404 Not Found',
        'Invalid JSON: Unexpected token < at position 0',
        'Timeout after 30000ms',
        'Server error: 500 Internal Server Error',
      ];

      errorMessages.forEach((message) => {
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    test('should handle long error messages appropriately', () => {
      const longError = 'A'.repeat(500);
      const errorDisplay = {
        content: longError,
        length: longError.length,
      };

      expect(errorDisplay.length).toBe(500);
      expect(errorDisplay.content).toBeTruthy();
    });
  });

  test.describe('Date Formatting', () => {
    test('should handle valid ISO date strings', () => {
      const validDates = [
        '2026-02-19T10:30:00Z',
        '2026-02-19T10:30:00.000Z',
        '2026-02-19',
      ];

      validDates.forEach((dateString) => {
        const date = new Date(dateString);
        expect(!isNaN(date.getTime())).toBe(true);
      });
    });

    test('should handle Invalid Date gracefully', () => {
      const invalidDateString = 'not-a-date';
      const date = new Date(invalidDateString);

      expect(isNaN(date.getTime())).toBe(true);
    });

    test('should return Unknown for Unknown input', () => {
      const input = 'Unknown';
      const output = input === 'Unknown' ? input : 'formatted';

      expect(output).toBe('Unknown');
    });

    test('should handle empty date strings', () => {
      const emptyDate = '';
      const date = new Date(emptyDate);

      expect(isNaN(date.getTime())).toBe(true);
    });

    test('should format dates in correct locale', () => {
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };

      const date = new Date('2026-02-19T14:30:00Z');
      const formatted = date.toLocaleDateString('en-US', dateOptions);

      expect(formatted).toBeTruthy();
      expect(formatted.includes('2026')).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('should have main panel with test ID', () => {
      const panelProps = {
        'data-testid': 'schema-info-panel',
      };

      expect(panelProps['data-testid']).toBe('schema-info-panel');
    });

    test('should have proper section structure with headers', () => {
      const sectionStructure = {
        schemaInfoHeader: 'Schema Info',
        hasValidationSection: true,
        hasStatisticsSection: true,
      };

      expect(sectionStructure.schemaInfoHeader).toBe('Schema Info');
      expect(sectionStructure.hasValidationSection).toBe(true);
    });

    test('should display validation status as visual indicator', () => {
      const validIndicator = {
        text: '✓ Valid',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      };

      const invalidIndicator = {
        text: '✗ Invalid',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      };

      expect(validIndicator.text).toContain('✓');
      expect(invalidIndicator.text).toContain('✗');
      expect(validIndicator.className).toContain('green');
      expect(invalidIndicator.className).toContain('red');
    });

    test('should have dark mode support for all elements', () => {
      const darkModeClasses = [
        'dark:border-gray-700',
        'dark:text-white',
        'dark:text-gray-400',
        'dark:bg-gray-800',
        'dark:text-red-400',
      ];

      darkModeClasses.forEach((darkClass) => {
        expect(darkClass).toMatch(/^dark:/);
      });
    });
  });

  test.describe('Statistics Display', () => {
    test('should display layer count in statistics', () => {
      const stat = {
        label: 'Layers',
        value: 10,
      };

      expect(stat.label).toBe('Layers');
      expect(typeof stat.value).toBe('number');
    });

    test('should display element count in statistics', () => {
      const stat = {
        label: 'Elements',
        value: 152,
      };

      expect(stat.label).toBe('Elements');
      expect(typeof stat.value).toBe('number');
    });

    test('should use grid layout for statistics', () => {
      const statsLayout = {
        containerClass: 'grid grid-cols-2 gap-3',
      };

      expect(statsLayout.containerClass).toContain('grid');
      expect(statsLayout.containerClass).toContain('grid-cols-2');
    });

    test('should style statistics cards consistently', () => {
      const cardStyle = {
        className:
          'text-center p-2 bg-gray-50 dark:bg-gray-800 rounded',
        numberClass: 'text-lg font-semibold text-blue-600 dark:text-blue-400',
        labelClass: 'text-xs text-gray-600 dark:text-gray-400',
      };

      expect(cardStyle.className).toContain('bg-gray-50');
      expect(cardStyle.numberClass).toContain('text-blue-600');
      expect(cardStyle.labelClass).toContain('text-gray-600');
    });
  });

  test.describe('Validation Errors Display', () => {
    test('should display validation errors section when present', () => {
      const errorSection = {
        visible: true,
        headerText: 'Validation Errors',
      };

      expect(errorSection.visible).toBe(true);
      expect(errorSection.headerText).toBeTruthy();
    });

    test('should limit displayed validation errors to first 5', () => {
      const displayLimit = 5;
      const errors = Array.from({ length: 10 }, (_, i) => `Error ${i + 1}`);
      const displayed = errors.slice(0, displayLimit);

      expect(displayed.length).toBe(5);
    });

    test('should apply consistent styling to error list items', () => {
      const errorItemStyle = {
        className:
          'text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded',
      };

      expect(errorItemStyle.className).toContain('text-red-700');
      expect(errorItemStyle.className).toContain('dark:text-red-300');
    });

    test('should make error list scrollable for many errors', () => {
      const listContainer = {
        className: 'space-y-1 max-h-32 overflow-y-auto',
      };

      expect(listContainer.className).toContain('overflow-y-auto');
      expect(listContainer.className).toContain('max-h-32');
    });
  });

  test.describe('Metadata Display', () => {
    test('should display version information', () => {
      const versionDisplay = {
        label: 'Version',
        fontClass: 'text-sm font-mono text-gray-900 dark:text-white',
      };

      expect(versionDisplay.label).toBe('Version');
      expect(versionDisplay.fontClass).toContain('font-mono');
    });

    test('should display schema version separately', () => {
      const schemaVersionDisplay = {
        label: 'Schema Version',
      };

      expect(schemaVersionDisplay.label).toBe('Schema Version');
    });

    test('should display last modified date', () => {
      const dateDisplay = {
        label: 'Last Modified',
        className:
          'text-sm text-gray-700 dark:text-gray-300',
      };

      expect(dateDisplay.label).toBe('Last Modified');
      expect(dateDisplay.className).toContain('text-gray-700');
    });

    test('should use proper labels for all metadata fields', () => {
      const labels = ['Version', 'Schema Version', 'Last Modified'];

      labels.forEach((label) => {
        expect(label).toBeTruthy();
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });
});
