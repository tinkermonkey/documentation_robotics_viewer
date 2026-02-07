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
      partialize: (state) => ({
        isOpen: state.isOpen,
        position: state.position,
        size: state.size,
        isMinimized: state.isMinimized,
      }),
    }
  )
);
