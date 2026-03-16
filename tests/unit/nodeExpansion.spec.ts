/**
 * Unit tests for node expansion logic
 */

import { test, expect } from '@playwright/test';
import { useBusinessLayerStore } from '../../src/apps/embedded/stores/businessLayerStore';

test.describe('Node Expansion Logic', () => {
  test.beforeEach(() => {
    // Reset store before each test
    useBusinessLayerStore.getState().reset();
  });

  test('should start with no expanded nodes', () => {
    const { expandedNodes } = useBusinessLayerStore.getState();
    expect(expandedNodes.size).toBe(0);
  });

  test('should expand a node when toggleNodeExpanded is called', () => {
    const { toggleNodeExpanded } = useBusinessLayerStore.getState();

    toggleNodeExpanded('process-1');

    const updatedExpandedNodes = useBusinessLayerStore.getState().expandedNodes;
    expect(updatedExpandedNodes.has('process-1')).toBe(true);
    expect(updatedExpandedNodes.size).toBe(1);
  });

  test('should collapse an expanded node when toggleNodeExpanded is called again', () => {
    const { toggleNodeExpanded } = useBusinessLayerStore.getState();

    // Expand
    toggleNodeExpanded('process-1');
    expect(useBusinessLayerStore.getState().expandedNodes.has('process-1')).toBe(true);

    // Collapse
    toggleNodeExpanded('process-1');
    expect(useBusinessLayerStore.getState().expandedNodes.has('process-1')).toBe(false);
    expect(useBusinessLayerStore.getState().expandedNodes.size).toBe(0);
  });

  test('should handle multiple expanded nodes', () => {
    const { toggleNodeExpanded } = useBusinessLayerStore.getState();

    toggleNodeExpanded('process-1');
    toggleNodeExpanded('process-2');
    toggleNodeExpanded('process-3');

    const expandedNodes = useBusinessLayerStore.getState().expandedNodes;
    expect(expandedNodes.size).toBe(3);
    expect(expandedNodes.has('process-1')).toBe(true);
    expect(expandedNodes.has('process-2')).toBe(true);
    expect(expandedNodes.has('process-3')).toBe(true);
  });

  test('should collapse one node without affecting others', () => {
    const { toggleNodeExpanded } = useBusinessLayerStore.getState();

    // Expand multiple nodes
    toggleNodeExpanded('process-1');
    toggleNodeExpanded('process-2');
    toggleNodeExpanded('process-3');

    // Collapse one
    toggleNodeExpanded('process-2');

    const expandedNodes = useBusinessLayerStore.getState().expandedNodes;
    expect(expandedNodes.size).toBe(2);
    expect(expandedNodes.has('process-1')).toBe(true);
    expect(expandedNodes.has('process-2')).toBe(false);
    expect(expandedNodes.has('process-3')).toBe(true);
  });

  test('should persist expanded state through reset', () => {
    const { toggleNodeExpanded, expandedNodes } = useBusinessLayerStore.getState();

    toggleNodeExpanded('process-1');
    expect(useBusinessLayerStore.getState().expandedNodes.has('process-1')).toBe(true);

    // Reset clears everything
    useBusinessLayerStore.getState().reset();
    expect(useBusinessLayerStore.getState().expandedNodes.size).toBe(0);
  });

  test('should handle rapid toggle operations', () => {
    const { toggleNodeExpanded } = useBusinessLayerStore.getState();

    // Rapid toggles
    toggleNodeExpanded('process-1');
    toggleNodeExpanded('process-1');
    toggleNodeExpanded('process-1');
    toggleNodeExpanded('process-1');

    // Should be collapsed (even number of toggles)
    expect(useBusinessLayerStore.getState().expandedNodes.has('process-1')).toBe(false);
  });

  test('should not create duplicate entries when toggling same node', () => {
    const { toggleNodeExpanded } = useBusinessLayerStore.getState();

    toggleNodeExpanded('process-1');
    toggleNodeExpanded('process-1');
    toggleNodeExpanded('process-1');

    const expandedNodes = useBusinessLayerStore.getState().expandedNodes;
    expect(expandedNodes.size).toBe(1); // Should only have process-1 once
    expect(expandedNodes.has('process-1')).toBe(true);
  });
});
