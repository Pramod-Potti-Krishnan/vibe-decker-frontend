"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle, Loader2, Wifi, WifiOff, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { tokenManager } from "@/lib/token-manager"
import { cn } from "@/lib/utils"

interface ConnectionDebugProps {
  connectionState?: any
  className?: string
}

export function ConnectionDebug({ connectionState, className }: ConnectionDebugProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  
  const checkTokenStatus = () => {
    const isAuth = tokenManager.isAuthenticated()
    const expiry = tokenManager.getExpiryTime()
    const lastError = tokenManager.getLastError()
    
    setTokenInfo({
      authenticated: isAuth,
      expiryTime: expiry ? new Date(expiry).toLocaleString() : 'N/A',
      lastError: lastError?.message || null,
      authMethod: getAuthMethod()
    })
  }

  const getAuthMethod = () => {
    if (process.env.NEXT_PUBLIC_USE_PROXY !== 'false') {
      return 'API Proxy (CORS Bypass)'
    } else if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      return 'Development Mode'
    }
    return 'Direct Connection'
  }

  const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_HTTP_URL || 'Not configured'
  }

  const getWebSocketUrl = () => {
    return process.env.NEXT_PUBLIC_WS_URL || 'Not configured'
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Connection Debug</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Connection</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant={connectionState?.status === 'connected' ? 'default' : 'secondary'}>
                  {connectionState?.status || 'Unknown'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Backend:</span>
                <span className="text-xs font-mono text-gray-600">{getBackendUrl()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>WebSocket:</span>
                <span className="text-xs font-mono text-gray-600">{getWebSocketUrl()}</span>
              </div>
            </div>
          </div>

          {/* Authentication Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Authentication</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkTokenStatus}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Check
              </Button>
            </div>
            
            {tokenInfo && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Authenticated:</span>
                  <Badge variant={tokenInfo.authenticated ? 'default' : 'destructive'}>
                    {tokenInfo.authenticated ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Method:</span>
                  <span className="text-xs text-gray-600">{tokenInfo.authMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expires:</span>
                  <span className="text-xs text-gray-600">{tokenInfo.expiryTime}</span>
                </div>
                {tokenInfo.lastError && (
                  <div className="text-xs text-red-600 mt-2">
                    Error: {tokenInfo.lastError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                tokenManager.invalidateToken()
                window.location.reload()
              }}
            >
              Force Token Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
            >
              Clear Local Storage
            </Button>
          </div>

          {/* Environment Info */}
          <div className="pt-2 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Environment</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Mode: {process.env.NODE_ENV}</div>
              <div>Use Proxy: {process.env.NEXT_PUBLIC_USE_PROXY || 'true'}</div>
              <div>Dev Mode: {process.env.NEXT_PUBLIC_DEV_MODE || 'false'}</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Enhanced Connection Status Indicator for the header
export function ConnectionStatusIndicator({ className }: { className?: string }) {
  const [showDebug, setShowDebug] = useState(false)
  
  // This is a simplified version - in a real app you'd use the actual connection state
  const status = 'connecting' // You can get this from your WebSocket hook
  
  const getStatusColor = () => {
    switch (status) {
      case 'authenticated':
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500 animate-pulse'
      case 'error':
      case 'disconnected':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'authenticated':
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Error'
      case 'disconnected':
        return 'Disconnected'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 transition-colors"
        title={`Connection: ${getStatusText()}`}
      >
        <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
        <span className="text-xs text-gray-600 hidden sm:inline">
          {getStatusText()}
        </span>
      </button>

      {showDebug && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <ConnectionDebug connectionState={{ status }} />
        </div>
      )}
    </div>
  )
}