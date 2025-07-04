"use client"

import React from 'react'
import { MessageCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface WaitingIndicatorProps {
  show: boolean
  lastMessage?: string
}

export function WaitingIndicator({ show, lastMessage }: WaitingIndicatorProps) {
  if (!show) return null

  return (
    <Card className="mx-4 mb-4 border-blue-200 bg-blue-50">
      <CardContent className="flex items-center gap-3 py-3">
        <div className="flex items-center gap-2 text-blue-600">
          <Clock className="h-4 w-4 animate-pulse" />
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">
            AI is waiting for your response
          </p>
          {lastMessage && (
            <p className="text-xs text-blue-600 mt-1">
              Last question: "{lastMessage.slice(0, 60)}..."
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}