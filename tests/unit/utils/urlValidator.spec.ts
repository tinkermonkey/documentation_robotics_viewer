/**
 * Unit Tests for URL Validator
 *
 * Tests cover:
 * - HTTP/HTTPS URL validation
 * - XSS prevention for malicious URL schemes
 * - Safe URL construction with multiple path segments
 */

import { test, expect } from '@playwright/test';
import { isValidHttpUrl, constructSafeUrl } from '@/apps/embedded/utils/urlValidator';

test.describe('urlValidator', () => {
  test.describe('isValidHttpUrl', () => {
    test('should accept valid HTTP URLs', () => {
      expect(isValidHttpUrl('http://example.com')).toBe(true);
      expect(isValidHttpUrl('http://example.com/path')).toBe(true);
      expect(isValidHttpUrl('http://example.com:8080')).toBe(true);
    });

    test('should accept valid HTTPS URLs', () => {
      expect(isValidHttpUrl('https://example.com')).toBe(true);
      expect(isValidHttpUrl('https://example.com/path')).toBe(true);
      expect(isValidHttpUrl('https://example.com:443')).toBe(true);
    });

    test('should accept URLs with uppercase http/https', () => {
      expect(isValidHttpUrl('HTTP://example.com')).toBe(true);
      expect(isValidHttpUrl('HTTPS://example.com')).toBe(true);
      expect(isValidHttpUrl('Http://example.com')).toBe(true);
      expect(isValidHttpUrl('HttpS://example.com')).toBe(true);
    });

    test('should accept URLs with whitespace', () => {
      expect(isValidHttpUrl('  http://example.com  ')).toBe(true);
      expect(isValidHttpUrl('\nhttps://example.com\n')).toBe(true);
    });

    test('should reject javascript: URLs', () => {
      expect(isValidHttpUrl('javascript:alert("xss")')).toBe(false);
      expect(isValidHttpUrl('javascript:void(0)')).toBe(false);
      expect(isValidHttpUrl('JAVASCRIPT:alert("xss")')).toBe(false);
    });

    test('should reject data: URLs', () => {
      expect(isValidHttpUrl('data:text/html,<script>alert("xss")</script>')).toBe(false);
      expect(isValidHttpUrl('data:text/plain,test')).toBe(false);
    });

    test('should reject file: URLs', () => {
      expect(isValidHttpUrl('file:///etc/passwd')).toBe(false);
      expect(isValidHttpUrl('file://localhost/path')).toBe(false);
    });

    test('should reject relative URLs', () => {
      expect(isValidHttpUrl('/path/to/resource')).toBe(false);
      expect(isValidHttpUrl('../relative/path')).toBe(false);
      expect(isValidHttpUrl('relative/path')).toBe(false);
    });

    test('should reject protocol-relative URLs', () => {
      expect(isValidHttpUrl('//example.com/path')).toBe(false);
    });

    test('should reject empty strings', () => {
      expect(isValidHttpUrl('')).toBe(false);
      expect(isValidHttpUrl('   ')).toBe(false);
    });

    test('should reject null/undefined-like values', () => {
      expect(isValidHttpUrl(null as any)).toBe(false);
      expect(isValidHttpUrl(undefined as any)).toBe(false);
    });

    test('should reject non-string values', () => {
      expect(isValidHttpUrl(123 as any)).toBe(false);
      expect(isValidHttpUrl({} as any)).toBe(false);
    });

    test('should reject FTP URLs', () => {
      expect(isValidHttpUrl('ftp://example.com/file')).toBe(false);
      expect(isValidHttpUrl('ftps://example.com/file')).toBe(false);
    });

    test('should reject URLs with only scheme', () => {
      expect(isValidHttpUrl('http://')).toBe(false);
      expect(isValidHttpUrl('https://')).toBe(false);
    });
  });

  test.describe('constructSafeUrl', () => {
    test('should construct valid URLs with single path part', () => {
      const url = constructSafeUrl('https://github.com', 'blob');
      expect(url).toBe('https://github.com/blob');
    });

    test('should construct valid URLs with multiple path parts', () => {
      const url = constructSafeUrl('https://github.com', 'blob', 'main', 'src/file.ts');
      expect(url).toBe('https://github.com/blob/main/src/file.ts');
    });

    test('should handle complex paths like GitHub URLs', () => {
      const url = constructSafeUrl('https://github.com/anthropics/test-repo', 'blob', 'main', 'src/index.ts');
      expect(url).toBe('https://github.com/anthropics/test-repo/blob/main/src/index.ts');
    });

    test('should handle path parts with leading slashes', () => {
      const url = constructSafeUrl('https://github.com', '/blob', '/main', '/src/file.ts');
      expect(url).toBe('https://github.com/blob/main/src/file.ts');
    });

    test('should ignore empty path parts', () => {
      const url = constructSafeUrl('https://github.com', 'blob', '', 'main');
      expect(url).toBe('https://github.com/blob/main');
    });

    test('should return null for invalid base URL (javascript:)', () => {
      const url = constructSafeUrl('javascript:alert("xss")', 'blob', 'main');
      expect(url).toBeNull();
    });

    test('should return null for invalid base URL (data:)', () => {
      const url = constructSafeUrl('data:text/html,<script>alert("xss")</script>', 'path');
      expect(url).toBeNull();
    });

    test('should return null for relative URLs', () => {
      const url = constructSafeUrl('/relative/path', 'blob');
      expect(url).toBeNull();
    });

    test('should return null for empty base URL', () => {
      const url = constructSafeUrl('', 'blob');
      expect(url).toBeNull();
    });

    test('should return null for invalid URL syntax', () => {
      const url = constructSafeUrl('not a valid url at all', 'blob');
      expect(url).toBeNull();
    });

    test('should handle URLs with query strings in base', () => {
      const url = constructSafeUrl('https://example.com/api?key=value', 'path');
      expect(url).toContain('https://example.com');
      expect(url).toContain('/path');
    });

    test('should handle URLs with fragments in base', () => {
      const url = constructSafeUrl('https://example.com#section', 'path');
      expect(url).toBeTruthy();
      expect(url).toContain('https://example.com');
    });

    test('should handle trailing slashes in base URL', () => {
      const url = constructSafeUrl('https://github.com/', 'blob', 'main');
      expect(url).toBe('https://github.com/blob/main');
    });

    test('should handle ports in base URL', () => {
      const url = constructSafeUrl('https://localhost:3000', 'api', 'endpoint');
      expect(url).toBe('https://localhost:3000/api/endpoint');
    });
  });
});
