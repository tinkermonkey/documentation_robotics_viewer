/**
 * Fetch Interceptor
 * Automatically adds Authorization header with token from localStorage to all requests
 */

const STORAGE_KEY = 'dr_auth_token';

/**
 * Install global fetch interceptor that adds Authorization header
 * This must be called before any fetch requests are made
 */
export function installFetchInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = function(...args: Parameters<typeof originalFetch>) {
    const [resource, config] = args;
    
    // Get token from localStorage (persists across refreshes)
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    
    // Create or extend request config
    const requestConfig = (config || {}) as RequestInit;
    
    // Add Authorization header if token exists and not already present
    if (token && !requestConfig.headers) {
      requestConfig.headers = {
        'Authorization': `Bearer ${token}`
      };
    } else if (token && requestConfig.headers) {
      const headers = requestConfig.headers as Record<string, string>;
      if (!headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // Call original fetch with modified config
    return originalFetch.call(this, resource, requestConfig);
  } as typeof window.fetch;
  
  console.log('[FetchInterceptor] Installed - will add Authorization header to all requests');
}
