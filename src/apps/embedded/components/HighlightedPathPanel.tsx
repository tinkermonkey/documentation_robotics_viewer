/**
 * HighlightedPathPanel Component
 * Displays the currently highlighted JSON path when @mention is clicked
 * Used in JSON view right sidebar (conditionally rendered)
 */

import React from 'react';

export interface HighlightedPathPanelProps {
  highlightedPath: string | null;
}

const HighlightedPathPanel: React.FC<HighlightedPathPanelProps> = ({ highlightedPath }) => {
  if (!highlightedPath) {
    return null;
  }

  return (
    <div className="p-4 border-t bg-yellow-50 border-yellow-200">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2 text-yellow-800">
        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
        Highlighted Path
      </h3>
      <p className="text-xs font-mono text-yellow-900 bg-yellow-100 p-2 rounded break-all">
        {highlightedPath}
      </p>
    </div>
  );
};

export default HighlightedPathPanel;
