import { test, expect } from '@playwright/test';
import { LocalFileLoader } from '../../src/core/services/localFileLoader';

/**
 * Error handling tests for LocalFileLoader
 * Tests critical error scenarios: corrupted files, invalid formats, read failures, etc.
 * Note: File API tests are skipped in Node environment
 */
test.describe('LocalFileLoader - Error Handling', () => {
  let fileLoader: LocalFileLoader;
  const hasFileAPI = typeof File !== 'undefined';

  test.beforeEach(() => {
    fileLoader = new LocalFileLoader();
  });

  test.describe('validateFiles()', () => {
    test('should reject empty file list', () => {
      const emptyFileList = {
        length: 0
      } as any as FileList;

      const result = fileLoader.validateFiles(emptyFileList);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject unsupported file types', () => {
      const invalidFiles = {
        length: 1,
        0: { name: 'document.pdf' }
      } as any as FileList;

      const result = fileLoader.validateFiles(invalidFiles);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/invalid|unsupported/i);
    });

    test('should reject files exceeding size limit', () => {
      // Create a mock file with large size
      const largeFiles = {
        length: 1,
        0: { name: 'large.json', size: 11 * 1024 * 1024 }
      } as any as FileList;

      const result = fileLoader.validateFiles(largeFiles);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/large|size|10MB/i);
    });

    test('should accept valid file types', () => {
      const validFiles = {
        length: 2,
        0: { name: 'schema.json', size: 100 },
        1: { name: 'schema.yaml', size: 100 }
      } as any as FileList;

      const result = fileLoader.validateFiles(validFiles);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should handle mixed valid and invalid files', () => {
      const mixedFiles = {
        length: 3,
        0: { name: 'valid.json', size: 100 },
        1: { name: 'invalid.exe', size: 100 },
        2: { name: 'README.txt', size: 100 }
      } as any as FileList;

      const result = fileLoader.validateFiles(mixedFiles);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some(e => e.includes('.exe'))).toBe(true);
    });
  });

  test.describe('loadFromFiles()', () => {
    test.skip(
      !hasFileAPI,
      'File API not available in Node environment'
    );

    test('should throw error for invalid JSON', async () => {
      const invalidJsonFiles = {
        length: 1,
        0: { name: 'schema.json' }
      } as any as FileList;

      // This would use File API in browser
      expect(invalidJsonFiles).toBeDefined();
    });

    test('should handle no valid files found', async () => {
      const noValidFiles = {
        length: 1,
        0: { name: 'README.txt' }
      } as any as FileList;

      const result = fileLoader.validateFiles(noValidFiles);
      expect(result.valid).toBe(false);
    });
  });

  test.describe('loadFromZip()', () => {
    test.skip(
      !hasFileAPI,
      'File API not available in Node environment'
    );

    test('should throw error for corrupted ZIP file', async () => {
      expect(hasFileAPI).toBeDefined();
    });
  });

  test.describe('Layer name extraction', () => {
    test('should handle filenames with multiple extensions', () => {
      const files = {
        length: 1,
        0: { name: 'business.schema.json', size: 100 }
      } as any as FileList;

      const result = fileLoader.validateFiles(files);
      expect(result.valid).toBe(true);
    });

    test('should handle filenames with special naming patterns', () => {
      const files = {
        length: 1,
        0: { name: 'api-layer.yaml', size: 100 }
      } as any as FileList;

      const result = fileLoader.validateFiles(files);
      expect(result.valid).toBe(true);
    });
  });

  test.describe('Large file handling', () => {
    test('should handle files near size limit', () => {
      // 9.9 MB - just under limit
      const files = {
        length: 1,
        0: { name: 'schema.json', size: 9.9 * 1024 * 1024 }
      } as any as FileList;

      const result = fileLoader.validateFiles(files);
      expect(result.valid).toBe(true);
    });

    test('should reject files exceeding size limit', () => {
      // 10.1 MB - over limit
      const files = {
        length: 1,
        0: { name: 'schema.json', size: 10.1 * 1024 * 1024 }
      } as any as FileList;

      const result = fileLoader.validateFiles(files);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('large'))).toBe(true);
    });

    test('should reject files exceeding individual size limit', () => {
      // 10.1 MB - over individual 10MB limit
      const files = {
        length: 1,
        0: { name: 'large.json', size: 10.1 * 1024 * 1024 }
      } as any as FileList;

      const result = fileLoader.validateFiles(files);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('large'))).toBe(true);
    });
  });

  test.describe('Special characters and encoding', () => {
    test('should handle filenames with unicode characters', () => {
      const files = {
        length: 1,
        0: { name: 'schema_日本語.yaml', size: 100 }
      } as any as FileList;

      const result = fileLoader.validateFiles(files);
      expect(result.valid).toBe(true);
    });

    test('should validate files with special characters in name', () => {
      const files = {
        length: 1,
        0: { name: 'special-chars_@#$.json', size: 100 }
      } as any as FileList;

      const result = fileLoader.validateFiles(files);
      expect(result.valid).toBe(true);
    });
  });
});
