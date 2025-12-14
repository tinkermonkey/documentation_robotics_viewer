/**
 * ConnectionStatus Component
 * Displays the current WebSocket connection status
 */

import React from 'react';
import { useConnectionStore, ConnectionState } from '../stores/connectionStore';

const ConnectionStatus: React.FC = () => {
  const { state, reconnectAttempt, reconnectDelay } = useConnectionStore();

  const getStatusInfo = (state: ConnectionState) => {
    switch (state) {
      case 'connected':
        return {
          className: 'bg-green-100 text-green-800',
          label: 'Connected',
          showSpinner: false
        };
      case 'connecting':
        return {
          className: 'bg-blue-100 text-blue-800',
          label: 'Connecting...',
          showSpinner: true
        };
      case 'reconnecting':
        return {
          className: 'bg-yellow-100 text-yellow-800',
          label: `Reconnecting (${reconnectAttempt})...`,
          showSpinner: true
        };
      case 'disconnected':
        return {
          className: 'bg-gray-100 text-gray-800',
          label: 'Disconnected',
          showSpinner: false
        };
      case 'error':
        return {
          className: 'bg-red-100 text-red-800',
          label: 'Connection Error',
          showSpinner: false
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800',
          label: 'Unknown',
          showSpinner: false
        };
    }
  };

  const statusInfo = getStatusInfo(state);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${statusInfo.className} connection-status`}
      data-connection-state={state}
    >
      {statusInfo.showSpinner && (
        <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {statusInfo.label}
      {state === 'reconnecting' && reconnectDelay > 0 && (
        <span className="ml-1 opacity-75">
          ({Math.round(reconnectDelay / 1000)}s)
        </span>
      )}
    </span>
  );
};

export default ConnectionStatus;
