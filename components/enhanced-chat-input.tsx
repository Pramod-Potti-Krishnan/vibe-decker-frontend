"use client"

import type React from "react"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, Paperclip, Globe, GlobeIcon as GlobeOff } from "lucide-react"

export interface EnhancedChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  onFileAttach?: (files: File[]) => void
  isLoading: boolean
  internetSearchEnabled?: boolean
  onToggleInternetSearch?: () => void
  placeholder?: string
  connectionState?: string
  isReady?: boolean
}

/**
 * Chat input with:
 *  • Paper-clip button for multi-file upload (shows badge with count)
 *  • Globe icon toggle for internet-search on/off
 *  • Message text box
 *  • Send button
 */
export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  value,
  onChange,
  onSend,
  onFileAttach,
  isLoading,
  internetSearchEnabled = false,
  onToggleInternetSearch,
  placeholder = "Ask the AI agents anything...",
  connectionState,
  isReady = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onFileAttach) {
      const filesArray = Array.from(e.target.files)
      onFileAttach(filesArray)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && value.trim() && isReady) {
      e.preventDefault()
      onSend(value)
    }
  }

  const handleSendMessage = () => {
    if (!isLoading && value.trim() && isReady) {
      onSend(value)
    }
  }

  const getConnectionStatusMessage = () => {
    if (!isReady) {
      switch (connectionState) {
        case 'connecting':
          return 'Connecting to AI agents...'
        case 'connected':
          return 'Authenticating...'
        case 'error':
          return 'Connection failed. Please try again.'
        case 'disconnected':
          return 'Disconnected from AI agents'
        default:
          return 'Connecting...'
      }
    }
    return placeholder
  }

  return (
    <TooltipProvider>
      <div className="border-t bg-white p-4">
        <div className="flex items-end space-x-2">
          {/* File upload */}
          {onFileAttach && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.mov,.mp3,.wav,.csv,.xlsx,.json"
                className="hidden"
                onChange={handleFileChange}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isReady}
                    aria-label="Upload files"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload files</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Internet search toggle */}
          {onToggleInternetSearch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${
                    internetSearchEnabled
                      ? "text-green-600 hover:text-green-700 bg-green-50"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  onClick={onToggleInternetSearch}
                  disabled={!isReady}
                  aria-label="Toggle internet search"
                >
                  {internetSearchEnabled ? <Globe className="h-4 w-4" /> : <GlobeOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {internetSearchEnabled ? "Internet search enabled" : "Internet search disabled"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Text input */}
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !isReady}
            placeholder={getConnectionStatusMessage()}
            className={`flex-1 min-h-[40px] ${!isReady ? 'opacity-60' : ''}`}
          />

          {/* Send */}
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={isLoading || !value.trim() || !isReady}
            aria-label="Send message"
            className="h-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Status badges - Always reserve space to prevent layout shifts */}
        <div className="mt-2 flex items-center space-x-2 min-h-[24px]">
          {/* Connection status indicator */}
          {!isReady && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                connectionState === 'connecting' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                connectionState === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <div className={`mr-1 h-2 w-2 rounded-full ${
                connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                connectionState === 'error' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              {getConnectionStatusMessage()}
            </Badge>
          )}
          
          {/* Internet search status */}
          {internetSearchEnabled && isReady && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              <Globe className="mr-1 h-3 w-3" />
              Internet search on
            </Badge>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default EnhancedChatInput
