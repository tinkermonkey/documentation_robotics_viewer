/**
 * ConnectionStatus Component
 * Displays the current WebSocket connection status
 */

import React from 'react';
import { useConnectionStore, ConnectionState } from '../stores/connectionStore';
import './ConnectionStatus.css';

const ConnectionStatus: React.FC = () => {
  const { state, reconnectAttempt, reconnectDelay } = useConnectionStore();

  const getStatusInfo = (state: ConnectionState) => {
    switch (state) {
      case 'connected':
        return {
          icon: '✓',
          label: 'Connected',
          className: 'connected'
        };
      case 'connecting':
        return {
          icon: '⟳',
          label: 'Connecting...',
          className: 'connecting'
        };
      case 'reconnecting':
        return {
          icon: '⟳',
          label: `Reconnecting (${reconnectAttempt})...`,
          className: 'reconnecting'
        };
      case 'disconnected':
        return {
          icon: '✕',
          label: 'Disconnected',
          className: 'disconnected'
        };
      case 'error':
        return {
          icon: '⚠',
          label: 'Connection Error',
          className: 'error'
        };
      default:
        return {
          icon: '?',
          label: 'Unknown',
          className: 'unknown'
        };
    }
  };

  const statusInfo = getStatusInfo(state);

  return (
    <div className={`connection-status ${statusInfo.className}`}>
      <span className="connection-icon">{statusInfo.icon}</span>
      <span className="connection-label">{statusInfo.label}</span>
      {state === 'reconnecting' && reconnectDelay > 0 && (
        <span className="connection-detail">
          ({Math.round(reconnectDelay / 1000)}s)
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
