/**
 * Floating Chat Panel Component
 * Draggable, resizable chat panel that floats above all views
 * State persists across route changes and sessions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { HiX, HiMinus, HiArrowsExpand } from 'react-icons/hi';
import { ChatPanelContainer } from './ChatPanelContainer';
import { useFloatingChatStore } from '../stores/floatingChatStore';

export const FloatingChatPanel = () => {
  const {
    isOpen,
    position,
    size,
    isMinimized,
    close,
    minimize,
    restore,
    setPosition,
    setSize,
  } = useFloatingChatStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag if clicking the header (not buttons)
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - size.width));
        const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 60));
        setPosition(newX, newY);
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.mouseX;
        const deltaY = e.clientY - resizeStart.mouseY;
        const newWidth = Math.max(300, Math.min(resizeStart.width + deltaX, window.innerWidth - position.x));
        const newHeight = Math.max(400, Math.min(resizeStart.height + deltaY, window.innerHeight - position.y));
        setSize(newWidth, newHeight);
      }
    },
    [isDragging, isResizing, dragStart, resizeStart, position, setPosition, setSize, size.width]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Handle resize
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeStart({
        width: size.width,
        height: size.height,
        mouseX: e.clientX,
        mouseY: e.clientY,
      });
    },
    [size]
  );

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Don't render if closed
  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-600 flex flex-col overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '300px' : `${size.width}px`,
        height: isMinimized ? '60px' : `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      data-testid="floating-chat-panel"
    >
      {/* Draggable Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        data-testid="floating-chat-header"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="font-semibold text-sm">DrBot Chat</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              isMinimized ? restore() : minimize();
            }}
            className="p-1 hover:bg-blue-700 dark:hover:bg-blue-800 rounded transition-colors"
            title={isMinimized ? 'Restore' : 'Minimize'}
            data-testid="minimize-button"
          >
            {isMinimized ? <HiArrowsExpand className="w-4 h-4" /> : <HiMinus className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="p-1 hover:bg-blue-700 dark:hover:bg-blue-800 rounded transition-colors"
            title="Close"
            data-testid="close-button"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Content (hidden when minimized) */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          <ChatPanelContainer
            title="DrBot Chat"
            showCostInfo={true}
            testId="floating-chat-content"
          />
        </div>
      )}

      {/* Resize Handle (hidden when minimized) */}
      {!isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={handleResizeMouseDown}
          data-testid="resize-handle"
        >
          <svg
            className="w-full h-full text-gray-400 dark:text-gray-600"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M14 14L14 10L16 10L16 16L10 16L10 14L14 14Z" />
            <path d="M8 14L8 12L10 12L10 14L8 14Z" />
            <path d="M12 8L12 10L14 10L14 8L12 8Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
