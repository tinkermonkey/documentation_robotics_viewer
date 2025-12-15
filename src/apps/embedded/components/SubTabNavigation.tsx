/**
 * SubTabNavigation Component
 * Secondary tab navigation that appears below main tabs in header
 * Used for Graph/JSON and Graph/List view switching
 */

import React from 'react';
import { useNavigate } from '@tanstack/react-router';

export interface SubTab {
  id: string;
  label: string;
  path: string;
}

export interface SubTabNavigationProps {
  tabs: SubTab[];
  activePath: string;
}

const SubTabNavigation: React.FC<SubTabNavigationProps> = ({
  tabs,
  activePath,
}) => {
  const navigate = useNavigate();

  // Don't render if no sub-tabs defined
  if (tabs.length === 0) {
    return null;
  }

  const handleTabClick = (path: string) => {
    navigate({ to: path });
  };

  return (
    <div
      className="px-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      data-testid="sub-tab-navigation"
    >
      <div className="flex -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.path)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activePath.startsWith(tab.path)
                ? 'text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            data-testid={`sub-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubTabNavigation;
