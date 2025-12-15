/**
 * ConnectionStatus Component
 * Displays the current WebSocket connection status using Flowbite Badge
 */

import React from 'react';
import { Badge, Spinner } from 'flowbite-react';
import { HiStatusOnline, HiStatusOffline } from 'react-icons/hi';
import { useConnectionStore, ConnectionState } from '../stores/connectionStore';

const ConnectionStatus: React.FC = () => {
  const { state, reconnectAttempt, reconnectDelay } = useConnectionStore();

  const getStatusInfo = (state: ConnectionState) => {
    switch (state) {
      case 'connected':
        return {
          color: 'success' as const,
          icon: <HiStatusOnline className="w-4 h-4" />,
          label: 'Connected',
          showSpinner: false,
        };
      case 'connecting':
        return {
          color: 'info' as const,
          icon: null,
          label: 'Connecting...',
          showSpinner: true,
        };
      case 'reconnecting':
        return {
          color: 'warning' as const,
          icon: null,
          label: `Reconnecting (${reconnectAttempt})...`,
          showSpinner: true,
        };
      case 'disconnected':
        return {
          color: 'gray' as const,
          icon: <HiStatusOffline className="w-4 h-4" />,
          label: 'Disconnected',
          showSpinner: false,
        };
      case 'error':
        return {
          color: 'failure' as const,
          icon: <HiStatusOffline className="w-4 h-4" />,
          label: 'Connection Error',
          showSpinner: false,
        };
      default:
        return {
          color: 'gray' as const,
          icon: null,
          label: 'Unknown',
          showSpinner: false,
        };
    }
  };

  const statusInfo = getStatusInfo(state);

  return (
    <Badge
      color={statusInfo.color}
      icon={() => (
        <>
          {statusInfo.showSpinner ? (
            <Spinner size="sm" className="mr-1" />
          ) : (
            statusInfo.icon && <span className="mr-1">{statusInfo.icon}</span>
          )}
        </>
      )}
      data-testid="connection-status"
      data-connection-state={state}
    >
      {statusInfo.label}
      {state === 'reconnecting' && reconnectDelay > 0 && (
        <span className="ml-1 opacity-75">({Math.round(reconnectDelay / 1000)}s)</span>
      )}
    </Badge>
  );
};

export default ConnectionStatus;
