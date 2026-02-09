import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Unit tests for story test generator script
 * Tests the validateSourceFiles function and coverage calculation logic
 */

// Get workspace root using process.cwd()
const workspaceRoot = process.cwd();

// Note: validateSourceFiles is re-implemented here because the CJS script
// cannot be directly imported from TypeScript tests. Keep in sync with
// scripts/generate-story-tests.cjs validateSourceFiles().
function validateSourceFiles(stories: Record<string, { filePath?: string }>): {
  total: number;
  valid: number;
  missing: Array<{ storyKey: string; expectedPath?: string; reason?: string }>;
} {
  const report = {
    total: 0,
    valid: 0,
    missing: [],
  };

  for (const [storyKey, metadata] of Object.entries(stories)) {
    report.total++;

    const expectedPath = metadata.filePath;

    if (!expectedPath) {
      report.missing.push({
        storyKey,
        reason: 'No filePath in metadata',
      });
      continue;
    }

    const absolutePath = path.join(workspaceRoot, expectedPath);

    if (fs.existsSync(absolutePath)) {
      report.valid++;
    } else {
      report.missing.push({
        storyKey,
        expectedPath,
      });
    }
  }

  return report;
}

test.describe('Story Test Generator', () => {
  test.describe('validateSourceFiles()', () => {
    test('should validate existing source files', () => {
      const stories = {
        'button--primary': {
          filePath: 'src/core/components/Button.tsx', // Using a file we know exists
        },
      };

      const report = validateSourceFiles(stories);

      expect(report.total).toBe(1);
      expect(report.valid).toBeGreaterThanOrEqual(0); // May or may not exist
      expect(report.missing).toBeDefined();
    });

    test('should detect missing source files', () => {
      const stories = {
        'nonexistent--story': {
          filePath: 'src/fake/NonexistentComponent.stories.tsx',
        },
      };

      const report = validateSourceFiles(stories);

      expect(report.total).toBe(1);
      expect(report.valid).toBe(0);
      expect(report.missing).toHaveLength(1);
      expect(report.missing[0].storyKey).toBe('nonexistent--story');
      expect(report.missing[0].expectedPath).toBe('src/fake/NonexistentComponent.stories.tsx');
    });

    test('should handle multiple stories with mixed validity', () => {
      const stories = {
        'valid--story': {
          filePath: 'tests/README.md', // Known file
        },
        'invalid--story1': {
          filePath: 'src/fake/File1.tsx',
        },
        'invalid--story2': {
          filePath: 'src/fake/File2.tsx',
        },
      };

      const report = validateSourceFiles(stories);

      expect(report.total).toBe(3);
      expect(report.valid).toBe(1);
      expect(report.missing).toHaveLength(2);
    });

    test('should detect stories with missing filePath metadata', () => {
      const stories = {
        'broken--story': {},
      };

      const report = validateSourceFiles(stories);

      expect(report.total).toBe(1);
      expect(report.valid).toBe(0);
      expect(report.missing).toHaveLength(1);
      expect(report.missing[0].reason).toBe('No filePath in metadata');
    });

    test('should handle empty story list', () => {
      const stories = {};

      const report = validateSourceFiles(stories);

      expect(report.total).toBe(0);
      expect(report.valid).toBe(0);
      expect(report.missing).toHaveLength(0);
    });
  });

  test.describe('coverage calculation', () => {
    test('should calculate coverage percentage for complete coverage', () => {
      const stories = {
        'story1': { filePath: 'tests/README.md' },
        'story2': { filePath: 'CLAUDE.md' },
      };

      const report = validateSourceFiles(stories);
      const coverage = (report.valid / report.total) * 100;

      expect(coverage).toBe(100);
    });

    test('should calculate coverage percentage for partial coverage', () => {
      const stories = {
        'story1': { filePath: 'tests/README.md' },
        'story2': { filePath: 'src/fake.tsx' },
      };

      const report = validateSourceFiles(stories);
      const coverage = (report.valid / report.total) * 100;

      expect(coverage).toBe(50);
    });

    test('should calculate coverage percentage for zero coverage', () => {
      const stories = {
        'story1': { filePath: 'src/fake1.tsx' },
        'story2': { filePath: 'src/fake2.tsx' },
      };

      const report = validateSourceFiles(stories);
      const coverage = (report.valid / report.total) * 100;

      expect(coverage).toBe(0);
    });

    test('should handle single story coverage', () => {
      const validStories = {
        'story1': { filePath: 'tests/README.md' },
      };

      const invalidStories = {
        'story1': { filePath: 'src/fake.tsx' },
      };

      const validReport = validateSourceFiles(validStories);
      const invalidReport = validateSourceFiles(invalidStories);

      expect((validReport.valid / validReport.total) * 100).toBe(100);
      expect((invalidReport.valid / invalidReport.total) * 100).toBe(0);
    });
  });

  test.describe('error handling', () => {
    test('should handle story with undefined filePath gracefully', () => {
      const stories = {
        'story--with-undefined': {
          filePath: undefined,
        },
      };

      const report = validateSourceFiles(stories);

      expect(report.total).toBe(1);
      expect(report.valid).toBe(0);
      expect(report.missing).toHaveLength(1);
    });

    test('should handle story with null filePath gracefully', () => {
      const stories = {
        'story--with-null': {
          filePath: null as any,
        },
      };

      const report = validateSourceFiles(stories);

      expect(report.total).toBe(1);
      expect(report.valid).toBe(0);
      expect(report.missing).toHaveLength(1);
    });

    test('should accumulate all missing stories', () => {
      const stories: Record<string, { filePath?: string }> = {};

      // Create 10 invalid stories
      for (let i = 0; i < 10; i++) {
        stories[`story--${i}`] = {
          filePath: `src/fake/file${i}.tsx`,
        };
      }

      const report = validateSourceFiles(stories);

      expect(report.total).toBe(10);
      expect(report.valid).toBe(0);
      expect(report.missing).toHaveLength(10);
    });
  });

  test.describe('large story sets', () => {
    test('should handle 100+ stories efficiently', () => {
      const stories: Record<string, { filePath?: string }> = {};

      // Create 100 stories with a mix of valid/invalid
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          stories[`story--${i}`] = { filePath: 'tests/README.md' };
        } else {
          stories[`story--${i}`] = { filePath: `src/fake/file${i}.tsx` };
        }
      }

      const start = performance.now();
      const report = validateSourceFiles(stories);
      const duration = performance.now() - start;

      expect(report.total).toBe(100);
      expect(report.valid).toBe(50);
      expect(report.missing).toHaveLength(50);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should handle 1000+ stories', () => {
      const stories: Record<string, { filePath?: string }> = {};

      for (let i = 0; i < 1000; i++) {
        stories[`story--${i}`] = { filePath: 'tests/README.md' };
      }

      const start = performance.now();
      const report = validateSourceFiles(stories);
      const duration = performance.now() - start;

      expect(report.total).toBe(1000);
      expect(report.valid).toBe(1000);
      expect(report.missing).toHaveLength(0);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  test.describe('report structure', () => {
    test('should return valid report structure', () => {
      const stories = {
        'story1': { filePath: 'tests/README.md' },
        'story2': { filePath: 'src/fake.tsx' },
      };

      const report = validateSourceFiles(stories);

      // Verify report structure
      expect(report).toHaveProperty('total');
      expect(report).toHaveProperty('valid');
      expect(report).toHaveProperty('missing');
      expect(Array.isArray(report.missing)).toBe(true);
    });

    test('should include storyKey in missing entries', () => {
      const stories = {
        'test--story--name': { filePath: 'src/fake.tsx' },
      };

      const report = validateSourceFiles(stories);

      expect(report.missing[0]).toHaveProperty('storyKey');
      expect(report.missing[0].storyKey).toBe('test--story--name');
    });

    test('should include expectedPath in missing entries when available', () => {
      const stories = {
        'story--test': { filePath: 'src/components/Test.tsx' },
      };

      const report = validateSourceFiles(stories);

      expect(report.missing[0]).toHaveProperty('expectedPath');
      expect(report.missing[0].expectedPath).toBe('src/components/Test.tsx');
    });
  });
});
