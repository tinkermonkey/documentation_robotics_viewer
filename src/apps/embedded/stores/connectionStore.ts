/**
 * Connection Store
 * Manages WebSocket connection state using Zustand
 */

import { create } from 'zustand';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface ConnectionStore {
  // State
  state: ConnectionState;
  reconnectAttempt: number;
  reconnectDelay: number;
  lastError: string | null;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;

  // Actions
  setConnecting: () => void;
  setConnected: () => void;
  setDisconnected: () => void;
  setReconnecting: (attempt: number, delay: number) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  // Initial state
  state: 'disconnected',
  reconnectAttempt: 0,
  reconnectDelay: 0,
  lastError: null,
  lastConnectedAt: null,
  lastDisconnectedAt: null,

  // Actions
  setConnecting: () => set({
    state: 'connecting',
    lastError: null
  }),

  setConnected: () => set({
    state: 'connected',
    reconnectAttempt: 0,
    reconnectDelay: 0,
    lastError: null,
    lastConnectedAt: new Date()
  }),

  setDisconnected: () => set({
    state: 'disconnected',
    lastDisconnectedAt: new Date()
  }),

  setReconnecting: (attempt: number, delay: number) => set({
    state: 'reconnecting',
    reconnectAttempt: attempt,
    reconnectDelay: delay
  }),

  setError: (error: string) => set({
    state: 'error',
    lastError: error
  }),

  reset: () => set({
    state: 'disconnected',
    reconnectAttempt: 0,
    reconnectDelay: 0,
    lastError: null,
    lastConnectedAt: null,
    lastDisconnectedAt: null
  })
}));
