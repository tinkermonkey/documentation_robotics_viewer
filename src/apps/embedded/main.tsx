import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from 'flowbite-react';
import { installFetchInterceptor } from './utils/fetchInterceptor';
import { router } from './router';
import { customTheme } from '../../theme/customTheme';
import '../../index.css';

// Handle token from magic link BEFORE router initializes
// Magic link format: /?token=xyz#/model/graph
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  console.log('[main] Found token in URL query string, storing to localStorage');
  localStorage.setItem('dr_auth_token', token);
  
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
    <ThemeProvider theme={customTheme as any}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
