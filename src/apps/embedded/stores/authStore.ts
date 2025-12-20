/**
 * Authentication Store
 * Manages authentication token for DR CLI visualization server
 *
 * The DR CLI generates a secure token and includes it in the magic link URL
 * as a query parameter: http://localhost:8080/?token=XXX
 *
 * This store:
 * - Extracts the token from URL on initialization
 * - Stores it for use in API requests and WebSocket connections
 * - Provides getters for including token in requests
 */

import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setToken: (token: string | null) => void;
  clearToken: () => void;
  getAuthHeaders: () => Record<string, string>;
  getAuthQueryParams: () => Record<string, string>;
}

const STORAGE_KEY = 'dr_auth_token';

/**
 * Extract token from URL query parameters or sessionStorage
 * Priority: URL > sessionStorage
 */
function extractTokenFromURL(): string | null {
  if (typeof window === 'undefined') return null;

  // First, check URL for token
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');

  if (urlToken) {
    console.log('[Auth] Token extracted from URL, storing in sessionStorage');
    // Store in sessionStorage for persistence across navigations
    sessionStorage.setItem(STORAGE_KEY, urlToken);
    return urlToken;
  }

  // If not in URL, check sessionStorage
  const storedToken = sessionStorage.getItem(STORAGE_KEY);
  if (storedToken) {
    console.log('[Auth] Token loaded from sessionStorage');
    return storedToken;
  }

  console.log('[Auth] No token found in URL or sessionStorage - running in development mode');
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initialize with token from URL
  token: extractTokenFromURL(),
  isAuthenticated: !!extractTokenFromURL(),

  setToken: (token: string | null) => {
    // Store/clear in sessionStorage
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem(STORAGE_KEY, token);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    set({
      token,
      isAuthenticated: !!token
    });
    console.log('[Auth] Token updated:', token ? 'present' : 'cleared');
  },

  clearToken: () => {
    // Clear from sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    set({
      token: null,
      isAuthenticated: false
    });
    console.log('[Auth] Token cleared from store and sessionStorage');
  },

  /**
   * Get Authorization header for fetch requests
   * Returns: { 'Authorization': 'Bearer <token>' } or empty object
   */
  getAuthHeaders: (): Record<string, string> => {
    const { token } = get();
    if (!token) {
      return {} as Record<string, string>;
    }

    return {
      'Authorization': `Bearer ${token}`
    };
  },

  /**
   * Get query parameters for URL-based authentication
   * Returns: { 'token': '<token>' } or empty object
   */
  getAuthQueryParams: (): Record<string, string> => {
    const { token } = get();
    if (!token) {
      return {} as Record<string, string>;
    }

    return {
      'token': token
    };
  },
}));
