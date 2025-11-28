/**
 * ViewTabSwitcher Component
 * Generic tab switcher for toggling between different view types
 * Used for Spec (Graph|JSON) and Changeset (Graph|List) modes
 */

import React from 'react';
import './ViewTabSwitcher.css';

export interface ViewTabOption {
  value: string;
  label: string;
  icon?: string;
}

export interface ViewTabSwitcherProps {
  options: ViewTabOption[];
  activeView: string;
  onChange: (view: string) => void;
  disabled?: boolean;
}

const ViewTabSwitcher: React.FC<ViewTabSwitcherProps> = ({
  options,
  activeView,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="view-tab-switcher">
      {options.map((option) => (
        <button
          key={option.value}
          className={`view-tab ${activeView === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          aria-label={`Switch to ${option.label} view`}
          aria-pressed={activeView === option.value}
        >
          {option.icon && <span className="view-tab-icon">{option.icon}</span>}
          <span className="view-tab-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewTabSwitcher;
