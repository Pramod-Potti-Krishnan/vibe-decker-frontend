"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConnectionState } from '@/lib/types/vibe-decker-api'
import { FeatureFlags } from '@/lib/feature-flags'

interface DebugPanelProps {
  connectionState: ConnectionState
  currentPhase: number
  capabilities: string[]
  presentationId: string
  isLoading: boolean
  messageCount: number
  slideCount: number
}

export function DebugPanel({
  connectionState,
  currentPhase,
  capabilities,
  presentationId,
  isLoading,
  messageCount,
  slideCount
}: DebugPanelProps) {
  // Only show in development or when debug flag is enabled
  if (!FeatureFlags.isDebugMode()) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-white/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Connection:</span>
            <Badge 
              variant={connectionState.status === 'connected' ? 'default' : 'destructive'}
              className="ml-1 text-xs"
            >
              {connectionState.status}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Phase:</span> {currentPhase}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Loading:</span> {isLoading ? '🔄' : '✅'}
          </div>
          <div>
            <span className="font-medium">Messages:</span> {messageCount}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Slides:</span> {slideCount}
          </div>
          <div>
            <span className="font-medium">API:</span> {FeatureFlags.useRealAPI() ? '🌐' : '🏠'}
          </div>
        </div>
        
        {presentationId && (
          <div>
            <span className="font-medium">ID:</span>
            <code className="ml-1 text-xs bg-gray-100 px-1 rounded">
              {presentationId.slice(-8)}
            </code>
          </div>
        )}
        
        {connectionState.reconnectAttempts > 0 && (
          <div>
            <span className="font-medium">Reconnects:</span> {connectionState.reconnectAttempts}
          </div>
        )}
        
        {capabilities.length > 0 && (
          <div>
            <span className="font-medium">Capabilities:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {capabilities.slice(0, 3).map((cap, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {cap.replace(/_/g, ' ').slice(0, 10)}
                </Badge>
              ))}
              {capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{capabilities.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}