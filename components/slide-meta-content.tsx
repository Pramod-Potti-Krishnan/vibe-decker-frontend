"use client"

import type React from "react"
import { NarrativePurpose } from "./narrative-purpose"
import { EngagementHook } from "./engagement-hook"
import { VisualSuggestions } from "./visual-suggestions"

interface SlideMetaContentProps {
  narrativePurpose?: string
  engagementHook?: string
  suggestedVisuals?: Array<{
    type: 'image' | 'infographic' | 'chart' | 'video' | 'diagram'
    description: string
    purpose: string
  } | string>
}

export function SlideMetaContent({ 
  narrativePurpose, 
  engagementHook, 
  suggestedVisuals 
}: SlideMetaContentProps) {
  
  // Only render if we have at least one meta-content field
  if (!narrativePurpose && !engagementHook && (!suggestedVisuals || suggestedVisuals.length === 0)) {
    return null
  }

  return (
    <div className="space-y-4">
      {narrativePurpose && <NarrativePurpose purpose={narrativePurpose} />}
      {engagementHook && <EngagementHook hook={engagementHook} />}
      {suggestedVisuals && suggestedVisuals.length > 0 && (
        <VisualSuggestions suggestions={suggestedVisuals} />
      )}
    </div>
  )
}