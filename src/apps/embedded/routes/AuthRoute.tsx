import { useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';

/**
 * Auth Route
 * Dedicated entrypoint for handling token from magic link.
 *
 * Flow:
 * 1. User clicks magic link: /?token=xyz#/model/graph
 * 2. AuthRoute extracts token and stores it in localStorage
 * 3. Updates authStore to prevent a WebSocket race condition
 * 4. Cleans the URL to remove the token query param
 * 5. Redirects to the requested destination (default /model/graph)
 */
export default function AuthRoute() {
  const search = useSearch({ strict: false }) as { token?: string };
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    const token = search?.token;
    const hashPath = window.location.hash.slice(1) || '/model/graph';

    if (token) {
      console.log('[AuthRoute] Storing token in localStorage');
      localStorage.setItem('dr_auth_token', token);

      // CRITICAL: Update authStore with the new token to prevent a race condition.
      // This ensures the WebSocket connection uses the fresh token.
      setToken(token);
      console.log('[AuthRoute] Updated authStore with new token');
    }

    // Navigate to the destination by setting the hash directly. This bypasses the
    // router so it cannot re-add the token search param to the URL.
    window.location.hash = hashPath;
  }, [search?.token, setToken]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500" data-testid="auth-loading">
        Authenticating...
      </p>
    </div>
  );
}
