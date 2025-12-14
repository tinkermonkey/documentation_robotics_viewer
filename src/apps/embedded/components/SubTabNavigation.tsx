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
    <div className="px-6">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.path)}
            className={`px-4 py-3 text-sm relative ${
              activePath.startsWith(tab.path)
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubTabNavigation;
