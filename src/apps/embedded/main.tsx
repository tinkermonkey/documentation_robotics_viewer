import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { installFetchInterceptor } from './utils/fetchInterceptor';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import '../../index.css';
import '@tinkermonkey/heimdall-ui/css';
import '@tinkermonkey/heimdall-ui/fonts';

// Handle token from magic link BEFORE router initializes
// Magic link format: /?token=xyz#/model/graph
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  console.log('[main] Found token in URL query string, storing to localStorage');
  localStorage.setItem('dr_auth_token', token);

  // CRITICAL: Update authStore with new token to prevent race condition
  // Without this, authStore keeps the old token cached in memory and WebSocket connects with stale token
  useAuthStore.getState().setToken(token);
  console.log('[main] Updated authStore with new token');

  // Clean the URL by removing the ?token=xyz part, keeping just the hash
  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState(null, '', cleanUrl);
  console.log('[main] URL cleaned, removed token from query string');
}

// Install fetch interceptor to add Authorization header to all requests
installFetchInterceptor();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
