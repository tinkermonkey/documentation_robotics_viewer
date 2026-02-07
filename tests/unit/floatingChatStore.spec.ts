import { test, expect } from '@playwright/test';
import { useFloatingChatStore } from '../../src/apps/embedded/stores/floatingChatStore';

test.describe('floatingChatStore', () => {
  test.beforeEach(() => {
    // Reset store state before each test
    useFloatingChatStore.getState().reset();
  });

  test('should initialize with default closed state', () => {
    const state = useFloatingChatStore.getState();

    expect(state.isOpen).toBe(false);
    expect(state.isMinimized).toBe(false);
    expect(state.position).toHaveProperty('x');
    expect(state.position).toHaveProperty('y');
    expect(state.size).toHaveProperty('width');
    expect(state.size).toHaveProperty('height');
  });

  test('should toggle open state', () => {
    const store = useFloatingChatStore.getState();

    expect(store.isOpen).toBe(false);

    store.toggle();
    expect(useFloatingChatStore.getState().isOpen).toBe(true);

    store.toggle();
    expect(useFloatingChatStore.getState().isOpen).toBe(false);
  });

  test('should open and close', () => {
    const store = useFloatingChatStore.getState();

    store.open();
    expect(useFloatingChatStore.getState().isOpen).toBe(true);
    expect(useFloatingChatStore.getState().isMinimized).toBe(false);

    store.close();
    expect(useFloatingChatStore.getState().isOpen).toBe(false);
  });

  test('should minimize and restore', () => {
    const store = useFloatingChatStore.getState();

    store.minimize();
    expect(useFloatingChatStore.getState().isMinimized).toBe(true);

    store.restore();
    expect(useFloatingChatStore.getState().isMinimized).toBe(false);
  });

  test('should update position', () => {
    const store = useFloatingChatStore.getState();

    store.setPosition(100, 200);
    const state = useFloatingChatStore.getState();

    expect(state.position.x).toBe(100);
    expect(state.position.y).toBe(200);
  });

  test('should update size', () => {
    const store = useFloatingChatStore.getState();

    store.setSize(500, 700);
    const state = useFloatingChatStore.getState();

    expect(state.size.width).toBe(500);
    expect(state.size.height).toBe(700);
  });

  test('should reset to default state', () => {
    const store = useFloatingChatStore.getState();

    // Modify state
    store.open();
    store.minimize();
    store.setPosition(999, 999);
    store.setSize(999, 999);

    // Reset
    store.reset();
    const state = useFloatingChatStore.getState();

    expect(state.isOpen).toBe(false);
    expect(state.isMinimized).toBe(false);
    expect(state.position.x).toBeGreaterThan(0);
    expect(state.position.y).toBeGreaterThan(0);
    expect(state.size.width).toBeGreaterThan(0);
    expect(state.size.height).toBeGreaterThan(0);
  });

  // Note: localStorage persistence is tested in E2E tests where browser environment is available
  // The persist middleware is provided by Zustand and tested by their team
});
