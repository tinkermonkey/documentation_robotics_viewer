/**
 * URL Validator
 * Security utilities for validating and sanitizing URLs to prevent XSS attacks
 */

/**
 * Validates that a URL is safe to use in href attributes
 * Only allows http:// and https:// protocols with a valid host
 * @param url - The URL to validate
 * @returns true if the URL is safe (starts with http:// or https:// with a valid host), false otherwise
 */
export function isValidHttpUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Must start with http:// or https://
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return false;
  }

  // Must have at least a host after the protocol
  try {
    const urlObj = new URL(url);
    // URL constructor validates syntax and hostname
    return !!urlObj.hostname;
  } catch {
    return false;
  }
}

/**
 * Safely constructs a URL with the given parts, validating the base URL
 * @param baseUrl - The base URL (e.g., repository URL)
 * @param pathParts - Additional path segments to append
 * @returns The constructed URL if baseUrl is valid, null otherwise
 */
export function constructSafeUrl(baseUrl: string, ...pathParts: string[]): string | null {
  if (!isValidHttpUrl(baseUrl)) {
    return null;
  }

  try {
    const url = new URL(baseUrl);

    // Build the pathname by appending path parts
    const parts = pathParts
      .filter(part => part && part.trim())
      .map(part => part.replace(/^\/+/, '').replace(/\/+$/, ''));

    if (parts.length > 0) {
      // Ensure pathname ends with / before appending new parts
      if (url.pathname && !url.pathname.endsWith('/')) {
        url.pathname += '/';
      }
      url.pathname += parts.join('/');
    }

    return url.toString();
  } catch {
    // URL constructor throws if the input is invalid
    return null;
  }
}
