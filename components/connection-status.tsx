"use client"

import { AlertCircle, CheckCircle, Loader2, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConnectionState } from "@/lib/types/vibe-decker-api"

interface ConnectionStatusProps {
  connectionState: ConnectionState
  onRetry?: () => void
  showDetailed?: boolean
}

export function ConnectionStatus({ 
  connectionState, 
  onRetry, 
  showDetailed = false 
}: ConnectionStatusProps) {
  const { status, lastError, reconnectAttempts, capabilities } = connectionState

  // Don't show anything when connected (unless detailed view)
  if (status === 'connected' && !showDetailed) {
    return null
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Wifi className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'disconnected':
        return 'bg-gray-50 border-gray-200 text-gray-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting to AI agents...'
      case 'connected':
        return 'Connected to AI agents'
      case 'disconnected':
        return 'Disconnected from AI agents'
      case 'error':
        return lastError || 'Connection error'
      default:
        return 'Unknown status'
    }
  }

  const shouldShowRetry = status === 'error' || status === 'disconnected'

  return (
    <div className={`rounded-lg border p-3 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
          
          {reconnectAttempts > 0 && (
            <Badge variant="outline" className="text-xs">
              Attempt {reconnectAttempts}
            </Badge>
          )}
        </div>

        {shouldShowRetry && onRetry && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onRetry}
            className="text-xs"
          >
            Retry
          </Button>
        )}
      </div>

      {showDetailed && status === 'connected' && capabilities && (
        <div className="mt-2 pt-2 border-t border-green-200">
          <div className="text-xs text-green-700">
            <div className="font-medium mb-1">Available Capabilities:</div>
            <div className="flex flex-wrap gap-1">
              {capabilities.map((capability, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {capability.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {lastError && status === 'error' && (
        <div className="mt-2 pt-2 border-t border-red-200">
          <div className="text-xs text-red-700">
            <span className="font-medium">Error:</span> {lastError}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for header/navbar
export function ConnectionIndicator({ connectionState }: { connectionState: ConnectionState }) {
  const { status } = connectionState

  const getIndicatorColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500 animate-pulse'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTooltipText = () => {
    switch (status) {
      case 'connected':
        return 'AI agents connected'
      case 'connecting':
        return 'Connecting to AI agents...'
      case 'error':
        return 'Connection failed'
      default:
        return 'Disconnected'
    }
  }

  return (
    <div className="flex items-center gap-2" title={getTooltipText()}>
      <div className={`w-2 h-2 rounded-full ${getIndicatorColor()}`} />
      <span className="text-xs text-gray-600 hidden sm:inline">
        AI Agents
      </span>
    </div>
  )
}