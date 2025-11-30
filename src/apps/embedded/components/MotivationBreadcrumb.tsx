/**
 * MotivationBreadcrumb Component
 *
 * Displays breadcrumb navigation showing the current focus path in the motivation graph.
 * Shows the path from the current focused element back to its root influences.
 */

import React from 'react';
import { MotivationGraphNode } from '../types/motivationGraph';
import './MotivationBreadcrumb.css';

export interface BreadcrumbItem {
  /** Node ID */
  id: string;

  /** Node name for display */
  name: string;

  /** Node type */
  type: string;
}

export interface MotivationBreadcrumbProps {
  /** Breadcrumb path items */
  path: BreadcrumbItem[];

  /** Callback when a breadcrumb item is clicked */
  onNavigate: (nodeId: string) => void;

  /** Callback to clear the focus */
  onClearFocus: () => void;
}

export const MotivationBreadcrumb: React.FC<MotivationBreadcrumbProps> = ({
  path,
  onNavigate,
  onClearFocus,
}) => {
  if (path.length === 0) {
    return null;
  }

  return (
    <div className="motivation-breadcrumb" role="navigation" aria-label="Focus path navigation">
      <div className="motivation-breadcrumb-items">
        {path.map((item, index) => (
          <React.Fragment key={item.id}>
            <button
              className={`motivation-breadcrumb-item ${
                index === path.length - 1 ? 'motivation-breadcrumb-item-current' : ''
              }`}
              onClick={() => onNavigate(item.id)}
              aria-label={`Navigate to ${item.name}`}
              aria-current={index === path.length - 1 ? 'location' : undefined}
            >
              <span className="motivation-breadcrumb-type-badge">{item.type}</span>
              <span className="motivation-breadcrumb-name">{item.name}</span>
            </button>

            {index < path.length - 1 && (
              <span className="motivation-breadcrumb-separator" aria-hidden="true">
                →
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      <button
        className="motivation-breadcrumb-clear"
        onClick={onClearFocus}
        aria-label="Clear focus and show full graph"
        title="Clear focus"
      >
        ✖
      </button>
    </div>
  );
};

/**
 * Helper function to build breadcrumb path from a node to root
 * @param nodeId - Starting node ID
 * @param nodes - Map of all graph nodes
 * @param adjacencyIncoming - Incoming adjacency list
 * @param maxDepth - Maximum path depth (default: 10)
 * @returns Array of breadcrumb items
 */
export function buildBreadcrumbPath(
  nodeId: string,
  nodes: Map<string, MotivationGraphNode>,
  adjacencyIncoming: Map<string, Set<string>>,
  maxDepth: number = 10
): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [];
  const visited = new Set<string>();
  let currentId: string | undefined = nodeId;
  let depth = 0;

  while (currentId && depth < maxDepth) {
    if (visited.has(currentId)) {
      break; // Cycle detected
    }

    const node = nodes.get(currentId);
    if (!node) {
      break;
    }

    // Add to path (will be reversed later)
    path.push({
      id: node.element.id,
      name: node.element.name,
      type: node.element.type,
    });

    visited.add(currentId);

    // Find the first incoming neighbor (prioritize drivers/stakeholders)
    const incoming = adjacencyIncoming.get(currentId);
    if (!incoming || incoming.size === 0) {
      break;
    }

    // Get the first incoming node as the parent
    currentId = Array.from(incoming)[0];
    depth++;
  }

  // Reverse to show root → current
  return path.reverse();
}
