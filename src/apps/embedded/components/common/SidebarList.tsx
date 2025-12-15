/**
 * SidebarList Component
 * Reusable sidebar navigation using Flowbite Sidebar component
 */

import React from 'react';
import { Sidebar, SidebarItems, SidebarItemGroup, SidebarItem } from 'flowbite-react';

export interface SidebarListItem {
  id: string;
  name: string;
  count?: number;
  description?: string;
}

interface SidebarListProps {
  title: string;
  items: SidebarListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
}

const SidebarList: React.FC<SidebarListProps> = ({
  title,
  items,
  selectedId,
  onSelect,
  emptyMessage = 'No items available'
}) => {
  return (
    <Sidebar aria-label={title} className="w-80">
      <SidebarItems>
        <SidebarItemGroup>
          <div className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white flex justify-between items-center">
            <span>{title}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </SidebarItemGroup>
        
        {items.length === 0 ? (
          <SidebarItemGroup>
            <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              {emptyMessage}
            </div>
          </SidebarItemGroup>
        ) : (
          <SidebarItemGroup>
            {items.map((item) => (
              <SidebarItem
                key={item.id}
                onClick={() => onSelect(item.id)}
                active={selectedId === item.id}
                className="cursor-pointer"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.count !== undefined && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {item.count}
                    </span>
                  )}
                </div>
                {item.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.description}
                  </div>
                )}
              </SidebarItem>
            ))}
          </SidebarItemGroup>
        )}
      </SidebarItems>
    </Sidebar>
  );
};

export default SidebarList;
