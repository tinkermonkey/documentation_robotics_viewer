import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { installFetchInterceptor } from './utils/fetchInterceptor';
import { createApiQueryClient } from '../../core/services/generatedApiClient';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import { takeFragmentToken } from './routes/checkoutLinks';
import '../../index.css';
import '@tinkermonkey/heimdall-ui/css';
import '@tinkermonkey/heimdall-ui/fonts';
// DR domain swatches + nav helpers — imported AFTER Heimdall CSS so they win.
import './ui/domain-and-nav.css';
import './ui/changeset-review.css';
import './ui/topbar-search.css';
import './ui/c4-diagram.css';

// Take a magic link's token BEFORE the router initializes. The dr CLI's
// central process puts it in the fragment (/#/p/<project>/c/<checkout>/...?token=xyz);
// an older dr visualize put it in the query string (/?token=xyz#/model/graph).
// Either way it is stored for API and websocket calls and removed from the
// address bar, so it never lands in history or a copied link.
function storeToken(token: string) {
  localStorage.setItem('dr_auth_token', token);
  // CRITICAL: update authStore too, or it keeps the old token cached in memory
  // and the WebSocket connects with a stale one.
  useAuthStore.getState().setToken(token);
}
{
  const queryToken = new URLSearchParams(window.location.search).get('token');
  const fragment = takeFragmentToken(window.location.hash);
  const token = fragment.token ?? queryToken;
  if (token) {
    storeToken(token);
    const search = new URLSearchParams(window.location.search);
    search.delete('token');
    const rest = search.toString();
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + fragment.hash);
  }
}

// A link opened in a tab that already shows the viewer changes only the hash:
// the page doesn't reload, so take its token here too. Capture-phase listeners
// on window run before the router's own, so no request goes out with the old
// token. A new token reconnects the websocket (RootShell's effect depends on it).
function takeTokenFromHashChange() {
  const fragment = takeFragmentToken(window.location.hash);
  if (!fragment.token) return;
  storeToken(fragment.token);
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + fragment.hash);
}
window.addEventListener('popstate', takeTokenFromHashChange, { capture: true });
window.addEventListener('hashchange', takeTokenFromHashChange, { capture: true });

// Install fetch interceptor to add Authorization header to all requests
installFetchInterceptor();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const queryClient = createApiQueryClient();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
