import type { GlobalProvider } from "@ladle/react";
import { MemoryRouter } from 'react-router-dom';
import "@/index.css";

// Setup test environment flags for WebSocket client detection
if (typeof window !== 'undefined') {
  // @ts-ignore - Set mock flag for WebSocket client
  window.__LADLE_MOCK_WEBSOCKET__ = true;

  // Create logger that distinguishes between test suppression and real errors
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    const message = String(args[0] || '');

    // For connection-related messages in test environment, downgrade to warning
    // This avoids CI failures while still maintaining visibility via console.warn
    if (
      message.includes('[WebSocket]') ||
      message.includes('[EmbeddedLayout]') ||
      message.includes('[JsonRpcHandler]') ||
      message.includes('WebSocket is') ||
      message.includes('WebSocket connection')
    ) {
      // Log as warning instead of error for test visibility
      originalWarn('[TEST] Suppressed error (treating as warning):', ...args);
      return;
    }

    // All other errors go through normally
    originalError.apply(console, args);
  };
}

export const Provider: GlobalProvider = ({ children }) => (
  <MemoryRouter>
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {children}
    </div>
  </MemoryRouter>
);
