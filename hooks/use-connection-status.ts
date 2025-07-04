import { useState, useEffect } from 'react';
import { useDecksterWebSocket } from './use-deckster-websocket';

export type ConnectionStatus = 
  | 'connecting'
  | 'connected'
  | 'authenticated'
  | 'disconnected'
  | 'error'
  | 'reconnecting';

export interface ConnectionInfo {
  status: ConnectionStatus;
  latency: number | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: Error | null;
}

export function useConnectionStatus() {
  const { connected, authenticated, error, subscribe } = useDecksterWebSocket();
  
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    status: 'disconnected',
    latency: null,
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });

  const [pingStartTime, setPingStartTime] = useState<number | null>(null);

  // Update connection status based on WebSocket state
  useEffect(() => {
    if (error) {
      setConnectionInfo(prev => ({
        ...prev,
        status: 'error',
        error
      }));
    } else if (authenticated) {
      setConnectionInfo(prev => ({
        ...prev,
        status: 'authenticated',
        lastConnected: new Date(),
        error: null
      }));
    } else if (connected) {
      setConnectionInfo(prev => ({
        ...prev,
        status: 'connected',
        error: null
      }));
    } else {
      setConnectionInfo(prev => ({
        ...prev,
        status: 'disconnected'
      }));
    }
  }, [connected, authenticated, error]);

  // Subscribe to WebSocket events for more detailed status
  useEffect(() => {
    const unsubscribeConnecting = subscribe('connecting' as any, () => {
      setConnectionInfo(prev => ({
        ...prev,
        status: 'connecting'
      }));
    });

    const unsubscribeReconnecting = subscribe('reconnecting' as any, (attempts: number) => {
      setConnectionInfo(prev => ({
        ...prev,
        status: 'reconnecting',
        reconnectAttempts: attempts
      }));
    });

    const unsubscribePing = subscribe('ping' as any, () => {
      setPingStartTime(Date.now());
    });

    const unsubscribePong = subscribe('pong' as any, () => {
      if (pingStartTime) {
        const latency = Date.now() - pingStartTime;
        setConnectionInfo(prev => ({
          ...prev,
          latency
        }));
        setPingStartTime(null);
      }
    });

    return () => {
      unsubscribeConnecting();
      unsubscribeReconnecting();
      unsubscribePing();
      unsubscribePong();
    };
  }, [subscribe, pingStartTime]);

  // Calculate connection quality based on latency
  const getConnectionQuality = (): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' => {
    if (!connectionInfo.latency) return 'unknown';
    
    if (connectionInfo.latency < 50) return 'excellent';
    if (connectionInfo.latency < 150) return 'good';
    if (connectionInfo.latency < 300) return 'fair';
    return 'poor';
  };

  // Get human-readable status message
  const getStatusMessage = (): string => {
    switch (connectionInfo.status) {
      case 'connecting':
        return 'Connecting to server...';
      case 'connected':
        return 'Connected, authenticating...';
      case 'authenticated':
        return 'Connected and ready';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return `Error: ${connectionInfo.error?.message || 'Unknown error'}`;
      case 'reconnecting':
        return `Reconnecting... (attempt ${connectionInfo.reconnectAttempts})`;
      default:
        return 'Unknown status';
    }
  };

  // Get status color for UI
  const getStatusColor = (): string => {
    switch (connectionInfo.status) {
      case 'authenticated':
        return 'green';
      case 'connected':
      case 'connecting':
        return 'yellow';
      case 'error':
      case 'disconnected':
        return 'red';
      case 'reconnecting':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return {
    ...connectionInfo,
    connectionQuality: getConnectionQuality(),
    statusMessage: getStatusMessage(),
    statusColor: getStatusColor(),
    isConnected: connectionInfo.status === 'authenticated',
    isConnecting: connectionInfo.status === 'connecting' || connectionInfo.status === 'reconnecting'
  };
}