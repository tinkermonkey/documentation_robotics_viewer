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
 * Extract token from localStorage or cookie
 * Token is placed in localStorage by AuthRoute when extracting from magic link URL
 */
function extractTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;

  // Check localStorage (populated by AuthRoute or previous sessions)
  const storedToken = localStorage.getItem(STORAGE_KEY);
  if (storedToken) {
    console.log('[Auth] Token loaded from localStorage');
    return storedToken;
  }

  // Fallback to cookie if present
  const cookieToken = getCookieToken();
  if (cookieToken) {
    console.log('[Auth] Token loaded from cookie');
    return cookieToken;
  }

  console.log('[Auth] No token found - running in development mode');
  return null;
}

/**
 * Get cookie token if present
 */
function getCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${STORAGE_KEY}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.split('=')[1] || '');
  } catch (_err) {
    return match.split('=')[1] || null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initialize with token from localStorage/cookie (AuthRoute populates localStorage)
  token: extractTokenFromStorage(),
  isAuthenticated: !!extractTokenFromStorage(),

  setToken: (token: string | null) => {
    // Store/clear in localStorage
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    set({
      token,
      isAuthenticated: !!token
    });
    console.log('[Auth] Token updated:', token ? 'present' : 'cleared');
  },

  clearToken: () => {
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({
      token: null,
      isAuthenticated: false
    });
    console.log('[Auth] Token cleared from store and localStorage');
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
