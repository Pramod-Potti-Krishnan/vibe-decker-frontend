"use client"

import type React from "react"
import { Clock, Layers } from "lucide-react"

interface SlideMetadataProps {
  speakingTime?: string
  contentDepth?: string
}

export function SlideMetadata({ speakingTime, contentDepth }: SlideMetadataProps) {
  if (!speakingTime && !contentDepth) {
    return null
  }

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
      {speakingTime && (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Speaking time: {speakingTime}</span>
        </div>
      )}
      {contentDepth && (
        <div className="flex items-center space-x-1">
          <Layers className="h-3 w-3" />
          <span>Depth: {contentDepth}</span>
        </div>
      )}
    </div>
  )
}