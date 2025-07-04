import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, Activity, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react'

interface ConversationDebugProps {
  conversationState: string
  currentPhase: number
  hasBasicStructure: boolean
  awaitingEnhancement: boolean
  messages: Array<{
    timestamp: Date
    type: string
    content: string
  }>
}

export function ConversationDebug({
  conversationState,
  currentPhase,
  hasBasicStructure,
  awaitingEnhancement,
  messages
}: ConversationDebugProps) {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'INIT':
        return 'bg-gray-500'
      case 'GATHERING_REQUIREMENTS':
        return 'bg-blue-500'
      case 'CREATING_STRUCTURE':
        return 'bg-yellow-500'
      case 'AWAITING_APPROVAL':
        return 'bg-orange-500'
      case 'ENHANCING':
        return 'bg-purple-500'
      case 'COMPLETE':
        return 'bg-green-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'COMPLETE':
        return <CheckCircle2 className="h-4 w-4" />
      case 'AWAITING_APPROVAL':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Conversation Debug
          </h3>
          <Badge className={`${getStateColor(conversationState)} text-white`}>
            {conversationState}
          </Badge>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Phase:</span>
            <span className="font-mono">{currentPhase}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Has Basic Structure:</span>
            <span className={`font-mono ${hasBasicStructure ? 'text-green-600' : 'text-gray-400'}`}>
              {hasBasicStructure ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Awaiting Enhancement:</span>
            <span className={`font-mono ${awaitingEnhancement ? 'text-orange-600' : 'text-gray-400'}`}>
              {awaitingEnhancement ? 'YES' : 'NO'}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <h4 className="text-xs font-semibold mb-2">Recent Messages</h4>
          <ScrollArea className="h-32">
            <div className="space-y-1">
              {messages.slice(-5).map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-gray-400" />
                  <div className="flex-1">
                    <span className="text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={`ml-1 font-medium ${
                      msg.type === 'user' ? 'text-blue-600' : 'text-purple-600'
                    }`}>
                      [{msg.type}]
                    </span>
                    <div className="text-gray-600 truncate">
                      {msg.content.substring(0, 50)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="mt-3 pt-3 border-t">
          <h4 className="text-xs font-semibold mb-2">State Flow</h4>
          <div className="flex items-center gap-1 text-xs">
            <Badge variant="outline" className={conversationState === 'INIT' ? 'bg-gray-100' : ''}>
              INIT
            </Badge>
            <ChevronRight className="h-3 w-3" />
            <Badge variant="outline" className={conversationState === 'GATHERING_REQUIREMENTS' ? 'bg-blue-100' : ''}>
              GATHER
            </Badge>
            <ChevronRight className="h-3 w-3" />
            <Badge variant="outline" className={conversationState === 'CREATING_STRUCTURE' ? 'bg-yellow-100' : ''}>
              CREATE
            </Badge>
            <ChevronRight className="h-3 w-3" />
            <Badge variant="outline" className={conversationState === 'AWAITING_APPROVAL' ? 'bg-orange-100' : ''}>
              AWAIT
            </Badge>
            <ChevronRight className="h-3 w-3" />
            <Badge variant="outline" className={conversationState === 'ENHANCING' ? 'bg-purple-100' : ''}>
              ENHANCE
            </Badge>
            <ChevronRight className="h-3 w-3" />
            <Badge variant="outline" className={conversationState === 'COMPLETE' ? 'bg-green-100' : ''}>
              DONE
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}