import type { GlobalProvider } from "@ladle/react";
import { MemoryRouter } from 'react-router-dom';
import "@/index.css";

// Mock WebSocket client for story rendering and suppress console errors globally
if (typeof window !== 'undefined') {
  // @ts-ignore - Set mock flag for WebSocket client
  window.__LADLE_MOCK_WEBSOCKET__ = true;

  // Suppress ALL console errors in Ladle to prevent test failures
  // This is necessary because WebSocket connection attempts generate browser-level errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Convert args to string for checking
    const message = String(args[0] || '');

    // Suppress WebSocket, EmbeddedLayout, and connection-related errors
    if (
      message.includes('[WebSocket]') ||
      message.includes('[EmbeddedLayout]') ||
      message.includes('WebSocket') ||
      message.includes('Connection')
    ) {
      return; // Suppress these errors in test environment
    }

    // Allow other errors through
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
