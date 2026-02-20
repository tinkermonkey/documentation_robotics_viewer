/**
 * Floating Chat Panel Store
 * Manages visibility, position, and size of the floating chat panel
 * State persists in localStorage to maintain position across sessions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FloatingChatState {
  isOpen: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;

  // Actions
  toggle: () => void;
  open: () => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  setPosition: (x: number, y: number) => void;
  setSize: (width: number, height: number) => void;
  reset: () => void;
}

const getDefaultPosition = () => {
  // Safe for SSR and test environments
  if (typeof window === 'undefined') {
    return { x: 500, y: 100 };
  }
  return { x: window.innerWidth - 420, y: 100 }; // Bottom-right by default
};

const DEFAULT_STATE = {
  isOpen: false,
  position: getDefaultPosition(),
  size: { width: 400, height: 600 },
  isMinimized: false,
};

// Create a safe storage wrapper that falls back gracefully when localStorage is unavailable
const createStorage = () => {
  // Check if we're in a browser environment with localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  // Fallback storage for SSR/test environments
  let memoryStorage: Record<string, string> = {};
  return {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, value: string) => {
      memoryStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      memoryStorage = {};
    },
    get length() {
      return Object.keys(memoryStorage).length;
    },
    key: (index: number) => Object.keys(memoryStorage)[index] || null,
  };
};

export const useFloatingChatStore = create<FloatingChatState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      toggle: () => set((state) => ({ isOpen: !state.isOpen })),

      open: () => set({ isOpen: true, isMinimized: false }),

      close: () => set({ isOpen: false }),

      minimize: () => set({ isMinimized: true }),

      restore: () => set({ isMinimized: false }),

      setPosition: (x: number, y: number) => set({ position: { x, y } }),

      setSize: (width: number, height: number) => set({ size: { width, height } }),

      reset: () => set(DEFAULT_STATE),
    }),
    {
      name: 'dr-floating-chat-state',
      storage: {
        getItem: (key) => {
          const storage = createStorage();
          const value = storage.getItem(key);
          if (!value) return null;
          try {
            return JSON.parse(value);
          } catch {
            // If parsing fails, clear corrupted data and return null
            storage.removeItem(key);
            return null;
          }
        },
        setItem: (key, value) => {
          const storage = createStorage();
          storage.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          const storage = createStorage();
          storage.removeItem(key);
        },
      },
      // Zustand persist middleware automatically excludes function properties from serialization
      // so we don't need an explicit partialize function here
    }
  )
);
