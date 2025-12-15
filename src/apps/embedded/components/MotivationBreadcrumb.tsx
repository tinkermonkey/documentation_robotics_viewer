/**
 * MotivationBreadcrumb Component
 *
 * Displays breadcrumb navigation showing the current focus path in the motivation graph.
 * Shows the path from the current focused element back to its root influences.
 */

import React from 'react';
import { MotivationGraphNode } from '../types/motivationGraph';
import { Breadcrumb, Badge, Button } from 'flowbite-react';
import { X } from 'lucide-react';

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
      <Breadcrumb>
        {path.map((item, index) => {
          const isLast = index === path.length - 1;

          return (
            <li key={item.id} className="flex items-center">
              <button
                onClick={() => onNavigate(item.id)}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                <Badge color="purple" size="sm">{item.type}</Badge>
                <span className={isLast ? 'font-semibold' : ''}>{item.name}</span>
              </button>
              {!isLast && (
                <svg className="w-3 h-3 mx-1 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
              )}
            </li>
          );
        })}
      </Breadcrumb>

      <Button
        color="gray"
        size="xs"
        onClick={onClearFocus}
        pill
        title="Clear focus"
      >
        <X className="h-3 w-3" />
      </Button>
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
