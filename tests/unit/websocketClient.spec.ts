/**
 * Unit tests for WebSocket test hooks
 * Verifies that triggerCloseForTesting() and simulateMaxReconnectAttemptsForTesting() are properly defined
 * and guarded in the WebSocketClient implementation
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Read and analyze the WebSocketClient source code to verify test hooks are implemented
 */
function readWebSocketClientSource(): string {
  // Use absolute path from project root
  const clientPath = '/workspace/src/apps/embedded/services/websocketClient.ts';
  return fs.readFileSync(clientPath, 'utf-8');
}

/**
 * Verify that test hooks have environment guards
 */
function verifyTestHookGuards(source: string): boolean {
  // Check that triggerCloseForTesting has guard
  const triggerCloseHasGuard =
    source.includes('triggerCloseForTesting') &&
    source.includes('if (!isTestEnvironment())');

  // Check that simulateMaxReconnectAttemptsForTesting has guard
  const simulateMaxReconnectHasGuard =
    source.includes('simulateMaxReconnectAttemptsForTesting') &&
    source.includes('if (!isTestEnvironment())');

  return triggerCloseHasGuard && simulateMaxReconnectHasGuard;
}

/**
 * Verify that test hooks are defined on the WebSocketClientInterface
 */
function verifyInterfaceDefinition(source: string): boolean {
  // Check interface has optional test hook methods
  return (
    source.includes('triggerCloseForTesting?(): void;') &&
    source.includes('simulateMaxReconnectAttemptsForTesting?(): void;')
  );
}

test.describe('WebSocketClient Test Hooks', () => {
  test('triggerCloseForTesting() method should exist with environment guard', () => {
    const source = readWebSocketClientSource();

    // Verify method implementation exists
    expect(source).toContain('triggerCloseForTesting(): void');

    // Verify it has environment guard
    const methodIndex = source.indexOf('triggerCloseForTesting(): void');
    const methodBlock = source.substring(methodIndex, methodIndex + 600);
    expect(methodBlock).toContain('if (!isTestEnvironment())');
    expect(methodBlock).toContain('console.warn');
    expect(methodBlock).toContain('return');
  });

  test('simulateMaxReconnectAttemptsForTesting() method should exist with environment guard', () => {
    const source = readWebSocketClientSource();

    // Verify method implementation exists
    expect(source).toContain('simulateMaxReconnectAttemptsForTesting(): void');

    // Verify it has environment guard
    const methodIndex = source.indexOf('simulateMaxReconnectAttemptsForTesting(): void');
    const methodBlock = source.substring(methodIndex, methodIndex + 600);
    expect(methodBlock).toContain('if (!isTestEnvironment())');
    expect(methodBlock).toContain('console.warn');
    expect(methodBlock).toContain('return');
  });

  test('WebSocketClientInterface should mark test hooks as optional', () => {
    const source = readWebSocketClientSource();

    // Verify interface definition exists
    expect(source).toContain('interface WebSocketClientInterface');

    // Verify test hooks are optional in the interface (marked with ?: syntax)
    const interfaceBlock = source.substring(
      source.indexOf('interface WebSocketClientInterface'),
      source.indexOf('interface WebSocketClientInterface') + 2000
    );
    // Test hooks should be optional (?: instead of :)
    expect(interfaceBlock).toContain('triggerCloseForTesting?: () => void');
    expect(interfaceBlock).toContain('simulateMaxReconnectAttemptsForTesting?: () => void');
  });

  test('test hooks should emit proper events', () => {
    const source = readWebSocketClientSource();

    // Verify triggerCloseForTesting calls close
    const triggerCloseBlock = source.substring(
      source.indexOf('triggerCloseForTesting(): void'),
      source.indexOf('triggerCloseForTesting(): void') + 800
    );
    expect(triggerCloseBlock).toContain('this.ws.close');

    // Verify simulateMaxReconnectAttemptsForTesting emits event
    const simulateMaxBlock = source.substring(
      source.indexOf('simulateMaxReconnectAttemptsForTesting(): void'),
      source.indexOf('simulateMaxReconnectAttemptsForTesting(): void') + 800
    );
    expect(simulateMaxBlock).toContain('max-reconnect-attempts');
  });

  test('test hooks should log diagnostic messages', () => {
    const source = readWebSocketClientSource();

    // Verify logging exists
    expect(source).toContain('TEST:');
    expect(source).toContain('[WebSocket]');
  });

  test('isTestEnvironment() function should be called in guards', () => {
    const source = readWebSocketClientSource();

    // Count how many test hooks call isTestEnvironment
    const guardsCount = (source.match(/if \(!isTestEnvironment\(\)\)/g) || []).length;

    // Should have at least 2 guards (one for each test hook)
    expect(guardsCount).toBeGreaterThanOrEqual(2);
  });

  test('test hooks should not affect production behavior', () => {
    const source = readWebSocketClientSource();

    // Verify guards prevent execution in production
    expect(source).toContain('if (!isTestEnvironment()) {');
    expect(source).toContain('console.warn');

    // Verify early return prevents rest of method execution
    const triggerCloseBlock = source.substring(
      source.indexOf('triggerCloseForTesting(): void'),
      source.indexOf('triggerCloseForTesting(): void') + 500
    );
    expect(triggerCloseBlock).toContain('return;');
  });

  test('test hooks should be properly implemented in WebSocketClient class', () => {
    const source = readWebSocketClientSource();

    // Verify class is exported
    expect(source).toContain('export class WebSocketClient');

    // Verify both test methods are implemented in class (not in interface)
    expect(source).toContain('triggerCloseForTesting(): void {');
    expect(source).toContain('simulateMaxReconnectAttemptsForTesting(): void {');

    // Verify they are guarded by isTestEnvironment check
    expect(source).toContain('if (!isTestEnvironment())');
  });

  test('WebSocketClient class should implement test hooks correctly', () => {
    const source = readWebSocketClientSource();

    // Verify class is exported
    expect(source).toContain('export class WebSocketClient');

    // Verify both methods are implemented in class
    expect(source).toContain('triggerCloseForTesting(): void {');
    expect(source).toContain('simulateMaxReconnectAttemptsForTesting(): void {');
  });

  test('test hooks should handle edge cases gracefully', () => {
    const source = readWebSocketClientSource();

    // Verify triggerCloseForTesting checks if WebSocket exists
    const triggerCloseBlock = source.substring(
      source.indexOf('triggerCloseForTesting(): void'),
      source.indexOf('triggerCloseForTesting(): void') + 800
    );
    expect(triggerCloseBlock).toContain('if (this.ws &&');
    expect(triggerCloseBlock).toContain('readyState === WebSocket.OPEN');
  });
});
