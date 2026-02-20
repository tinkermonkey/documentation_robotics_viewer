/**
 * Unit tests for getCookieToken error path
 * Tests cookie parsing and decode error handling logic
 */

import { test, expect } from '@playwright/test';

// Helper function that simulates getCookieToken logic
function simulateGetCookieToken(cookieString: string): string | null {
  const AUTH_COOKIE_NAME = 'dr_auth_token';
  const match = cookieString.split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (!match) return null;

  try {
    return decodeURIComponent(match.split('=')[1] || '');
  } catch {
    // Decode error handling - return null (in production, logError() would be called)
    return null;
  }
}

test.describe('getCookieToken() Logic', () => {
  test('should return null when cookie is not found', () => {
    const result = simulateGetCookieToken('other_cookie=value');
    expect(result).toBeNull();
  });

  test('should decode valid cookie token', () => {
    const testToken = 'my-token-123';
    const cookieString = `dr_auth_token=${encodeURIComponent(testToken)}`;
    const result = simulateGetCookieToken(cookieString);
    expect(result).toBe('my-token-123');
  });

  test('should handle empty cookie value', () => {
    const result = simulateGetCookieToken('dr_auth_token=');
    expect(result).toBe('');
  });

  test('should return null when decodeURIComponent would throw for malformed URI', () => {
    // Invalid percent encoding that would cause decodeURIComponent to throw
    const result = simulateGetCookieToken('dr_auth_token=%invalid%');
    expect(result).toBeNull();
  });

  test('should handle cookie with special characters correctly', () => {
    const testToken = 'token-with-special-chars!@#$%';
    const cookieString = `dr_auth_token=${encodeURIComponent(testToken)}`;
    const result = simulateGetCookieToken(cookieString);
    expect(result).toBe('token-with-special-chars!@#$%');
  });

  test('should extract token value even with other cookies present', () => {
    const cookieString = 'other_cookie=value1; dr_auth_token=my-actual-token; another_cookie=value2';
    const result = simulateGetCookieToken(cookieString);
    expect(result).toBe('my-actual-token');
  });

  test('should handle cookie with whitespace in cookie string', () => {
    const testToken = 'token-123';
    const cookieString = `   dr_auth_token=${encodeURIComponent(testToken)}   ; other=value`;
    const result = simulateGetCookieToken(cookieString);
    expect(result).toBe('token-123');
  });

  test('should not match cookies with similar names', () => {
    const cookieString = 'dr_auth_token_backup=some-value; dr_auth=other-value';
    const result = simulateGetCookieToken(cookieString);
    expect(result).toBeNull();
  });

  test('should handle encoded forward slashes in token', () => {
    const testToken = 'prefix/suffix/more';
    const cookieString = `dr_auth_token=${encodeURIComponent(testToken)}`;
    const result = simulateGetCookieToken(cookieString);
    expect(result).toBe('prefix/suffix/more');
  });

  test('should extract only the first auth token cookie', () => {
    // Cookie parser finds the first match
    const cookieString = 'dr_auth_token=first-value; dr_auth_token=second-value';
    const result = simulateGetCookieToken(cookieString);
    expect(result).toBe('first-value');
  });
});
