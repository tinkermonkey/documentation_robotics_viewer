import { useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

/**
 * Auth Route
 * Dedicated entrypoint for handling token from magic link
 * 
 * Flow:
 * 1. User clicks magic link: /?token=xyz#/model/graph
 * 2. AuthRoute extracts token and stores in localStorage
 * 3. Cleans URL to remove token query param
 * 4. Redirects to requested destination
 */
export default function AuthRoute() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };

  useEffect(() => {
    const token = search?.token;
    const hashPath = window.location.hash.slice(1) || '/model/graph';

    if (token) {
      console.log('[AuthRoute] Storing token in localStorage');
      localStorage.setItem('dr_auth_token', token);

      // Remove token from URL completely by changing location
      // This bypasses react-router to avoid it re-adding search params
      console.log('[AuthRoute] URL cleaning and redirecting to', hashPath);
      window.location.hash = hashPath;
    } else {
      // No token, just navigate
      navigate({ to: hashPath as any });
    }
  }, [search?.token, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white rounded-lg border p-6 text-center">
        <div className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-gray-700">Authenticating...</p>
      </div>
    </div>
  );
}
