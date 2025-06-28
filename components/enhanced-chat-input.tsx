"use client"

import type React from "react"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, Paperclip, Globe, GlobeIcon as GlobeOff } from "lucide-react"

export interface EnhancedChatInputProps {
  inputMessage: string
  onInputChange: (value: string) => void
  onSendMessage: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  onFileUpload: (files: FileList) => void
  internetSearchEnabled: boolean
  onInternetSearchToggle: (enabled: boolean) => void
  isLoading: boolean
  attachmentCount: number
}

/**
 * Chat input with:
 *  • Paper-clip button for multi-file upload (shows badge with count)
 *  • Globe icon toggle for internet-search on/off
 *  • Message text box
 *  • Send button
 */
export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  inputMessage,
  onInputChange,
  onSendMessage,
  onKeyPress,
  onFileUpload,
  internetSearchEnabled,
  onInternetSearchToggle,
  isLoading,
  attachmentCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFileUpload(e.target.files)
  }

  return (
    <TooltipProvider>
      <div className="border-t bg-white p-4">
        <div className="flex items-end space-x-2">
          {/* File upload */}
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
                  className="relative h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload files"
                >
                  <Paperclip className="h-4 w-4" />
                  {attachmentCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] leading-none">
                      {attachmentCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload files</TooltipContent>
            </Tooltip>
          </div>

          {/* Internet search toggle */}
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
                onClick={() => onInternetSearchToggle(!internetSearchEnabled)}
                aria-label="Toggle internet search"
              >
                {internetSearchEnabled ? <Globe className="h-4 w-4" /> : <GlobeOff className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {internetSearchEnabled ? "Internet search enabled" : "Internet search disabled"}
            </TooltipContent>
          </Tooltip>

          {/* Text input */}
          <Input
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            disabled={isLoading}
            placeholder="Describe your presentation or ask for changes..."
            className="flex-1 min-h-[40px]"
          />

          {/* Send */}
          <Button
            size="sm"
            onClick={onSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            aria-label="Send message"
            className="h-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Status badges */}
        {(internetSearchEnabled || attachmentCount > 0) && (
          <div className="mt-2 flex items-center space-x-2">
            {internetSearchEnabled && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                <Globe className="mr-1 h-3 w-3" />
                Internet search on
              </Badge>
            )}
            {attachmentCount > 0 && (
              <Badge variant="outline" className="text-xs">
                <Paperclip className="mr-1 h-3 w-3" />
                {attachmentCount} file{attachmentCount > 1 && "s"}
              </Badge>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default EnhancedChatInput
