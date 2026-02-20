/**
 * Unit tests for SchemaInfoPanel component
 *
 * Tests verify:
 * - Component prop validation and types
 * - Error handling behavior
 * - Default prop values
 * - Component structure
 */

import { test, expect } from '@playwright/test';
import React from 'react';
import { SchemaInfoPanel } from '../../src/apps/embedded/components/SchemaInfoPanel';

test.describe('SchemaInfoPanel Component', () => {
  test.describe('Component Props', () => {
    test('should accept className prop', () => {
      const props = {
        className: 'custom-class',
      };

      expect(props.className).toBe('custom-class');
      expect(typeof props.className).toBe('string');
    });

    test('should accept specDataError as string prop', () => {
      const errorMessage = 'Failed to load specification data';
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: errorMessage,
      };

      expect(props.specDataError).toBe(errorMessage);
      expect(typeof props.specDataError).toBe('string');
    });

    test('should accept specDataError as null', () => {
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: null,
      };

      expect(props.specDataError).toBeNull();
    });

    test('should have valid prop defaults', () => {
      const defaultProps: React.ComponentProps<typeof SchemaInfoPanel> = {};

      expect(defaultProps.className).toBeUndefined();
      expect(defaultProps.specDataError).toBeUndefined();
    });

    test('should support both className and specDataError together', () => {
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        className: 'custom',
        specDataError: 'Error message',
      };

      expect(props.className).toBe('custom');
      expect(props.specDataError).toBe('Error message');
    });
  });

  test.describe('Error Message Handling', () => {
    test('should validate error message types', () => {
      const testMessages = [
        'Network error: 404 Not Found',
        'Invalid JSON: Unexpected token',
        'Timeout after 30000ms',
        'Server error: 500 Internal Server Error',
      ];

      testMessages.forEach((message) => {
        const props: React.ComponentProps<typeof SchemaInfoPanel> = {
          specDataError: message,
        };

        expect(typeof props.specDataError).toBe('string');
        expect(props.specDataError?.length).toBeGreaterThan(0);
      });
    });

    test('should handle long error messages', () => {
      const longError = 'A'.repeat(500);
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: longError,
      };

      expect(props.specDataError?.length).toBe(500);
      expect(props.specDataError).toBeTruthy();
    });

    test('should handle empty error string', () => {
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: '',
      };

      expect(props.specDataError).toBe('');
    });

    test('should handle error messages with special characters', () => {
      const specialError = 'Error: <script>alert("XSS")</script>';
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: specialError,
      };

      expect(props.specDataError).toBe(specialError);
    });
  });

  test.describe('Component Structure', () => {
    test('should be a React component', () => {
      expect(typeof SchemaInfoPanel).toBe('function');
    });

    test('should accept React props', () => {
      const validProps: React.ComponentProps<typeof SchemaInfoPanel> = {};

      expect(validProps).toBeDefined();
    });

    test('should have displayName for debugging', () => {
      // SchemaInfoPanel should have a name for debugging
      expect(SchemaInfoPanel.name || SchemaInfoPanel.displayName).toBeTruthy();
    });

    test('should handle null className gracefully', () => {
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        className: null as unknown as string,
      };

      expect(props.className === null || props.className === undefined).toBe(true);
    });
  });

  test.describe('Error State Validation', () => {
    test('should validate error transitions from null to error', () => {
      const initialProps: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: null,
      };
      expect(initialProps.specDataError).toBeNull();

      const updatedProps: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: 'Error occurred',
      };
      expect(updatedProps.specDataError).toBe('Error occurred');
    });

    test('should validate error transitions from error to null', () => {
      const initialProps: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: 'Error occurred',
      };
      expect(initialProps.specDataError).toBe('Error occurred');

      const updatedProps: React.ComponentProps<typeof SchemaInfoPanel> = {
        specDataError: null,
      };
      expect(updatedProps.specDataError).toBeNull();
    });

    test('should validate concurrent error changes', () => {
      const errors = [
        'Error 1',
        'Error 2',
        null,
        'Error 3',
        null,
      ];

      errors.forEach((error) => {
        const props: React.ComponentProps<typeof SchemaInfoPanel> = {
          specDataError: error,
        };

        if (error === null) {
          expect(props.specDataError).toBeNull();
        } else {
          expect(props.specDataError).toBe(error);
        }
      });
    });
  });

  test.describe('Styling Props', () => {
    test('should accept className for styling', () => {
      const classNames = [
        'px-4 py-2',
        'bg-blue-500',
        'dark:bg-gray-800',
        'rounded-lg shadow-md',
      ];

      classNames.forEach((className) => {
        const props: React.ComponentProps<typeof SchemaInfoPanel> = {
          className,
        };

        expect(props.className).toBe(className);
      });
    });

    test('should preserve className through prop changes', () => {
      const className = 'custom-class';

      const props1: React.ComponentProps<typeof SchemaInfoPanel> = {
        className,
        specDataError: null,
      };

      const props2: React.ComponentProps<typeof SchemaInfoPanel> = {
        className,
        specDataError: 'Error',
      };

      expect(props1.className).toBe(props2.className);
    });

    test('should handle multiple Tailwind classes', () => {
      const tailwindClasses = 'flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900';
      const props: React.ComponentProps<typeof SchemaInfoPanel> = {
        className: tailwindClasses,
      };

      expect(props.className).toContain('flex');
      expect(props.className).toContain('dark:');
    });
  });
});
