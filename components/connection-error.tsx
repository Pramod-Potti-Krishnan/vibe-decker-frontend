'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useConnectionStatus } from '@/hooks/use-connection-status';
import { cn } from '@/lib/utils';

interface ConnectionErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function ConnectionError({ onRetry, className }: ConnectionErrorProps) {
  const {
    status,
    statusMessage,
    statusColor,
    isConnecting,
    reconnectAttempts,
    latency,
    connectionQuality
  } = useConnectionStatus();

  const [showDetails, setShowDetails] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'reconnecting' && reconnectAttempts > 0) {
      // Start countdown for next retry
      setRetryCountdown(5);
      const interval = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, reconnectAttempts]);

  if (status === 'authenticated') {
    return null; // No error to show
  }

  const getIcon = () => {
    switch (status) {
      case 'connecting':
      case 'reconnecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (): 'default' | 'destructive' => {
    return status === 'error' || status === 'disconnected' ? 'destructive' : 'default';
  };

  return (
    <Alert 
      variant={getAlertVariant()} 
      className={cn('relative', className)}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle>
            {status === 'error' ? 'Connection Error' : statusMessage}
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            {status === 'reconnecting' && (
              <div className="space-y-2">
                <p className="text-sm">
                  Reconnection attempt {reconnectAttempts}...
                  {retryCountdown && ` Next retry in ${retryCountdown}s`}
                </p>
                <Progress value={(reconnectAttempts / 5) * 100} className="h-2" />
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <p className="text-sm">
                  Unable to connect to the presentation service. Please check your internet connection.
                </p>
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className="mt-2"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Connection
                  </Button>
                )}
              </div>
            )}

            {latency !== null && status === 'authenticated' && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? 'Hide' : 'Show'} connection details
              </button>
            )}

            {showDetails && latency !== null && (
              <div className="mt-2 p-2 bg-muted rounded-md text-xs space-y-1">
                <p>Latency: {latency}ms</p>
                <p>Quality: {connectionQuality}</p>
                <p>Status: {status}</p>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

// Inline connection status indicator
export function ConnectionStatusIndicator({ className }: { className?: string }) {
  const { status, latency, connectionQuality } = useConnectionStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'authenticated':
        return connectionQuality === 'excellent' ? 'bg-green-500' : 
               connectionQuality === 'good' ? 'bg-yellow-500' : 'bg-orange-500';
      case 'connecting':
      case 'connected':
        return 'bg-yellow-500';
      case 'error':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTooltipText = () => {
    if (status === 'authenticated' && latency !== null) {
      return `Connected (${latency}ms)`;
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div 
      className={cn('relative group', className)}
      title={getTooltipText()}
    >
      <div className={cn(
        'w-2 h-2 rounded-full transition-colors',
        getStatusColor(),
        status === 'connecting' && 'animate-pulse'
      )} />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {getTooltipText()}
      </div>
    </div>
  );
}