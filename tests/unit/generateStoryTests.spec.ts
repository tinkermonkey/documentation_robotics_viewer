/**
 * Unit Tests for Story Test Generation
 *
 * Tests the critical functions that validate story metadata and escape test names.
 * These functions ensure generated test files are syntactically valid and handle
 * special characters correctly to prevent code injection.
 */

import { test, expect } from '@playwright/test';

// Note: validateStoryMetadata is re-implemented here because the CJS script
// cannot be directly imported from TypeScript tests. Keep in sync with
// scripts/generate-story-tests.cjs validateStoryMetadata().
function validateStoryMetadata(storyKey: string, metadata: any) {
  const errors: string[] = [];

  if (!metadata) {
    errors.push('Metadata is null or undefined');
    return { valid: false, errors };
  }

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    errors.push(`Metadata must be an object, got ${typeof metadata}`);
    return { valid: false, errors };
  }

  // Validate required 'name' field
  if (!metadata.name) {
    errors.push('Missing required field: "name"');
  } else if (typeof metadata.name !== 'string') {
    errors.push(`Field "name" must be a string, got ${typeof metadata.name}`);
  } else if (metadata.name.trim().length === 0) {
    errors.push('Field "name" is empty');
  }

  // Validate required 'levels' field
  if (!metadata.levels) {
    errors.push('Missing required field: "levels"');
  } else if (!Array.isArray(metadata.levels)) {
    errors.push(`Field "levels" must be an array, got ${typeof metadata.levels}`);
  } else {
    // Check all levels are strings
    for (let i = 0; i < metadata.levels.length; i++) {
      if (typeof metadata.levels[i] !== 'string') {
        errors.push(`Field "levels[${i}]" must be a string, got ${typeof metadata.levels[i]}`);
      } else if (metadata.levels[i].trim().length === 0) {
        errors.push(`Field "levels[${i}]" is empty`);
      }
    }
  }

  // Validate optional 'filePath' field if present
  if (metadata.filePath && typeof metadata.filePath !== 'string') {
    errors.push(`Field "filePath" must be a string, got ${typeof metadata.filePath}`);
  }

  return { valid: errors.length === 0, errors };
}

// Note: escapeTestName is re-implemented here because the CJS script
// cannot be directly imported from TypeScript tests. Keep in sync with
// scripts/generate-story-tests.cjs escapeTestName().
function escapeTestName(str: string): string {
  return str
    .replace(/\\/g, '\\\\') // Backslash
    .replace(/'/g, "\\'") // Single quote
    .replace(/"/g, '\\"') // Double quote
    .replace(/`/g, '\\`') // Backtick
    .replace(/\$/g, '\\$') // Dollar sign
    .replace(/\n/g, '\\n') // Newline
    .replace(/\r/g, '\\r') // Carriage return
    .replace(/\t/g, '\\t'); // Tab
}

test.describe('Story Metadata Validation', () => {
  test('should pass valid metadata with required fields', () => {
    const metadata = {
      name: 'Test Story',
      levels: ['component', 'integration'],
      filePath: 'src/stories/Test.stories.tsx',
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should pass metadata with only required fields', () => {
    const metadata = {
      name: 'Minimal Story',
      levels: ['component'],
    };

    const result = validateStoryMetadata('minimal-story', metadata);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject null metadata', () => {
    const result = validateStoryMetadata('test-story', null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Metadata is null or undefined');
  });

  test('should reject undefined metadata', () => {
    const result = validateStoryMetadata('test-story', undefined);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Metadata is null or undefined');
  });

  test('should reject non-object metadata', () => {
    const result = validateStoryMetadata('test-story', 'not an object');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Metadata must be an object');
  });

  test('should reject array metadata', () => {
    const result = validateStoryMetadata('test-story', ['array', 'not', 'object']);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Metadata must be an object');
  });

  test('should reject missing name field', () => {
    const metadata = {
      levels: ['component'],
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: "name"');
  });

  test('should reject non-string name field', () => {
    const metadata = {
      name: 123,
      levels: ['component'],
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Field "name" must be a string');
  });

  test('should reject empty name field', () => {
    const metadata = {
      name: '   ',
      levels: ['component'],
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Field "name" is empty');
  });

  test('should reject missing levels field', () => {
    const metadata = {
      name: 'Test Story',
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: "levels"');
  });

  test('should reject non-array levels field', () => {
    const metadata = {
      name: 'Test Story',
      levels: 'component',
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Field "levels" must be an array');
  });

  test('should reject non-string levels array items', () => {
    const metadata = {
      name: 'Test Story',
      levels: ['component', 123],
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Field "levels[1]" must be a string');
  });

  test('should reject empty string in levels array', () => {
    const metadata = {
      name: 'Test Story',
      levels: ['component', '  '],
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Field "levels[1]" is empty');
  });

  test('should reject non-string filePath field when present', () => {
    const metadata = {
      name: 'Test Story',
      levels: ['component'],
      filePath: 123,
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Field "filePath" must be a string');
  });

  test('should report multiple validation errors', () => {
    const metadata = {
      name: '',
      levels: 'not-array',
      filePath: 123,
    };

    const result = validateStoryMetadata('test-story', metadata);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

test.describe('Test Name Escaping', () => {
  test('should escape backslash', () => {
    const input = 'test\\story';
    const output = escapeTestName(input);
    expect(output).toBe('test\\\\story');
  });

  test('should escape single quote', () => {
    const input = "test'story";
    const output = escapeTestName(input);
    expect(output).toBe("test\\'story");
  });

  test('should escape double quote', () => {
    const input = 'test"story';
    const output = escapeTestName(input);
    expect(output).toBe('test\\"story');
  });

  test('should escape backtick', () => {
    const input = 'test`story';
    const output = escapeTestName(input);
    expect(output).toBe('test\\`story');
  });

  test('should escape dollar sign', () => {
    const input = 'test$story';
    const output = escapeTestName(input);
    expect(output).toBe('test\\$story');
  });

  test('should escape newline', () => {
    const input = 'test\nstory';
    const output = escapeTestName(input);
    expect(output).toBe('test\\nstory');
  });

  test('should escape carriage return', () => {
    const input = 'test\rstory';
    const output = escapeTestName(input);
    expect(output).toBe('test\\rstory');
  });

  test('should escape tab', () => {
    const input = 'test\tstory';
    const output = escapeTestName(input);
    expect(output).toBe('test\\tstory');
  });

  test('should handle multiple special characters', () => {
    const input = "test'story`with$special\"chars\\";
    const output = escapeTestName(input);

    // Verify all special chars are escaped
    expect(output).toContain("\\'");
    expect(output).toContain('\\`');
    expect(output).toContain('\\$');
    expect(output).toContain('\\"');
    expect(output).toContain('\\\\');
  });

  test('should handle complex real-world test names', () => {
    const input = 'Button / Click with "custom" style (test\'s $value)';
    const output = escapeTestName(input);

    // Should contain escaped versions of special chars
    expect(output).toContain('\\"');
    expect(output).toContain("\\'");
    expect(output).toContain('\\$');
  });

  test('should leave normal characters unchanged', () => {
    const input = 'Test Story Component 123';
    const output = escapeTestName(input);
    expect(output).toBe(input);
  });

  test('should handle empty string', () => {
    const input = '';
    const output = escapeTestName(input);
    expect(output).toBe('');
  });

  test('should handle string with only special characters', () => {
    const input = '`$"\'\\';
    const output = escapeTestName(input);

    // Should be fully escaped, no unescaped special chars remain
    expect(output).toBe('\\`\\$\\"\\\'\\\\');
  });

  test('should prevent code injection via template literals', () => {
    const injectionAttempt = '${alert("injected")}';
    const escaped = escapeTestName(injectionAttempt);

    // Dollar sign and double quote should be escaped
    expect(escaped).toContain('\\$');
    expect(escaped).toContain('\\"');
    // The escaped dollar prevents template literal interpretation
    expect(escaped).toContain('\\$');
  });

  test('should prevent code injection via string concatenation', () => {
    const injectionAttempt = "'; console.log('injected'); const x='";
    const escaped = escapeTestName(injectionAttempt);

    // Single quotes should be escaped
    expect(escaped).toContain("\\'");
    // The original unescaped pattern that would break out of string should not exist
    // when used in JavaScript code (the escaping provides protection at generation time)
    expect(typeof escaped).toBe('string');
  });

  test('should not be idempotent (escaping twice produces different result due to backslash escaping)', () => {
    const input = "test'story`with$special";
    const escaped1 = escapeTestName(input);
    const escaped2 = escapeTestName(escaped1);

    // Second escape should not double-escape already escaped characters
    // The function escapes backslashes, so a second pass would escape those
    // This test documents that behavior
    expect(escaped1).not.toBe(escaped2);
    expect(escaped2).toContain('\\\\');
  });
});

test.describe('Integration: Validation + Escaping', () => {
  test('should handle valid metadata with special characters in name', () => {
    const metadata = {
      name: 'Test with "quotes" and \'apostrophes\'',
      levels: ['component'],
    };

    const validation = validateStoryMetadata('test-special', metadata);
    expect(validation.valid).toBe(true);

    const escaped = escapeTestName(metadata.name);
    // Should contain escaped versions of quotes
    expect(escaped).toContain('\\"');
    expect(escaped).toContain("\\'");
  });

  test('should validate and escape a complete story set', () => {
    const stories: Record<string, any> = {
      'button/default': {
        name: 'Button / Default',
        levels: ['component'],
      },
      'input/with-special': {
        name: "Input with 'quotes' and $vars",
        levels: ['form', 'input'],
      },
      'modal/complex': {
        name: 'Modal `with` "all" \'chars\' $and \\ slash',
        levels: ['dialog'],
      },
    };

    for (const [key, metadata] of Object.entries(stories)) {
      const validation = validateStoryMetadata(key, metadata);
      expect(validation.valid).toBe(true);

      const escaped = escapeTestName(metadata.name);
      // Escaped version should have special characters escaped
      // Each special character is either a raw non-special char or an escaped version
      expect(typeof escaped).toBe('string');
      expect(escaped.length).toBeGreaterThan(0);
      // Verify no unescaped dangerous patterns remain
      expect(escaped).not.toContain("'; ");
      expect(escaped).not.toContain('${');
    }
  });
});
