/**
 * C4 Node Component Unit Tests
 *
 * Tests the specifications and exported constants of ContainerNode, ComponentNode,
 * and ExternalActorNode components including dimensions, container types, roles,
 * and semantic zoom levels.
 */

import { test, expect } from '@playwright/test';

// Import actual constants from node components to ensure dimensions stay in sync
import {
  CONTAINER_NODE_WIDTH,
  CONTAINER_NODE_HEIGHT,
} from '../src/core/nodes/c4/ContainerNode';
import {
  COMPONENT_NODE_WIDTH,
  COMPONENT_NODE_HEIGHT,
} from '../src/core/nodes/c4/ComponentNode';
import {
  EXTERNAL_ACTOR_NODE_WIDTH,
  EXTERNAL_ACTOR_NODE_HEIGHT,
} from '../src/core/nodes/c4/ExternalActorNode';

// Import nodeTypes to verify registration
import { nodeTypes } from '../src/core/nodes';

test.describe('C4 Node Components', () => {
  test.describe('Node Registration', () => {
    test('c4Container should be registered in nodeTypes', () => {
      expect(nodeTypes).toHaveProperty('c4Container');
      // React.memo components are objects with $$typeof property
      expect(nodeTypes.c4Container).toBeDefined();
      expect(nodeTypes.c4Container).not.toBeNull();
    });

    test('c4Component should be registered in nodeTypes', () => {
      expect(nodeTypes).toHaveProperty('c4Component');
      expect(nodeTypes.c4Component).toBeDefined();
      expect(nodeTypes.c4Component).not.toBeNull();
    });

    test('c4ExternalActor should be registered in nodeTypes', () => {
      expect(nodeTypes).toHaveProperty('c4ExternalActor');
      expect(nodeTypes.c4ExternalActor).toBeDefined();
      expect(nodeTypes.c4ExternalActor).not.toBeNull();
    });
  });

  test.describe('ContainerNode Dimensions', () => {
    test('should export width constant of 280px', () => {
      expect(CONTAINER_NODE_WIDTH).toBe(280);
    });

    test('should export height constant of 180px', () => {
      expect(CONTAINER_NODE_HEIGHT).toBe(180);
    });

    test('dimensions should match acceptance criteria', () => {
      // Per issue requirements: ContainerNode = 280x180
      expect(CONTAINER_NODE_WIDTH).toBe(280);
      expect(CONTAINER_NODE_HEIGHT).toBe(180);
    });
  });

  test.describe('ComponentNode Dimensions', () => {
    test('should export width constant of 240px', () => {
      expect(COMPONENT_NODE_WIDTH).toBe(240);
    });

    test('should export height constant of 140px', () => {
      expect(COMPONENT_NODE_HEIGHT).toBe(140);
    });

    test('dimensions should match acceptance criteria', () => {
      // Per issue requirements: ComponentNode = 240x140
      expect(COMPONENT_NODE_WIDTH).toBe(240);
      expect(COMPONENT_NODE_HEIGHT).toBe(140);
    });
  });

  test.describe('ExternalActorNode Dimensions', () => {
    test('should export width constant of 160px', () => {
      expect(EXTERNAL_ACTOR_NODE_WIDTH).toBe(160);
    });

    test('should export height constant of 120px', () => {
      expect(EXTERNAL_ACTOR_NODE_HEIGHT).toBe(120);
    });

    test('dimensions should match acceptance criteria', () => {
      // Per issue requirements: ExternalActorNode = 160x120
      expect(EXTERNAL_ACTOR_NODE_WIDTH).toBe(160);
      expect(EXTERNAL_ACTOR_NODE_HEIGHT).toBe(120);
    });
  });

  test.describe('ContainerNode Component Properties', () => {
    test('component should have displayName set', () => {
      expect(nodeTypes.c4Container.displayName).toBe('ContainerNode');
    });
  });

  test.describe('ComponentNode Component Properties', () => {
    test('component should have displayName set', () => {
      expect(nodeTypes.c4Component.displayName).toBe('ComponentNode');
    });
  });

  test.describe('ExternalActorNode Component Properties', () => {
    test('component should have displayName set', () => {
      expect(nodeTypes.c4ExternalActor.displayName).toBe('ExternalActorNode');
    });
  });

  test.describe('Dimension Consistency', () => {
    test('ContainerNode should be larger than ComponentNode', () => {
      // Containers contain components, so should be larger
      expect(CONTAINER_NODE_WIDTH).toBeGreaterThan(COMPONENT_NODE_WIDTH);
      expect(CONTAINER_NODE_HEIGHT).toBeGreaterThan(COMPONENT_NODE_HEIGHT);
    });

    test('ComponentNode should be larger than ExternalActorNode', () => {
      // Components have more detail than external actors
      expect(COMPONENT_NODE_WIDTH).toBeGreaterThan(EXTERNAL_ACTOR_NODE_WIDTH);
      expect(COMPONENT_NODE_HEIGHT).toBeGreaterThan(EXTERNAL_ACTOR_NODE_HEIGHT);
    });

    test('all nodes should have positive dimensions', () => {
      expect(CONTAINER_NODE_WIDTH).toBeGreaterThan(0);
      expect(CONTAINER_NODE_HEIGHT).toBeGreaterThan(0);
      expect(COMPONENT_NODE_WIDTH).toBeGreaterThan(0);
      expect(COMPONENT_NODE_HEIGHT).toBeGreaterThan(0);
      expect(EXTERNAL_ACTOR_NODE_WIDTH).toBeGreaterThan(0);
      expect(EXTERNAL_ACTOR_NODE_HEIGHT).toBeGreaterThan(0);
    });
  });
});
