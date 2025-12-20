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

/**
 * Extract token from URL query parameters
 */
function extractTokenFromURL(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    console.log('[Auth] Token extracted from URL');
  } else {
    console.log('[Auth] No token found in URL - running in development mode');
  }

  return token;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initialize with token from URL
  token: extractTokenFromURL(),
  isAuthenticated: !!extractTokenFromURL(),

  setToken: (token: string | null) => {
    set({
      token,
      isAuthenticated: !!token
    });
    console.log('[Auth] Token updated:', token ? 'present' : 'cleared');
  },

  clearToken: () => {
    set({
      token: null,
      isAuthenticated: false
    });
    console.log('[Auth] Token cleared');
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
