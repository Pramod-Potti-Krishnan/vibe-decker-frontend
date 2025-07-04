"use client"

import type React from "react"
import { SlideMetaContent } from "./slide-meta-content"
import { SlideMetadata } from "./slide-metadata"
import { SlideElement } from "./slide-element"

interface Slide {
  id: string
  title: string
  content: string
  layout: "title" | "content" | "two-column" | "image-focus"
  elements: Array<{
    id: string
    type: "title" | "content" | "image" | "placeholder" | "meta-content"
    content: string
    style?: {
      fontSize?: string
      fontFamily?: string
      fontWeight?: string
      fontStyle?: string
      textDecoration?: string
      textAlign?: string
      color?: string
    }
    position?: { x: number; y: number }
  }>
  narrativePurpose?: string
  engagementHook?: string
  suggestedVisuals?: Array<{
    type: 'image' | 'infographic' | 'chart' | 'video' | 'diagram'
    description: string
    purpose: string
  } | string>
  speakingTime?: string
  contentDepth?: string
}

interface SlideDisplayProps {
  slide: Slide
  slideNumber: number
  onElementUpdate: (elementId: string, updates: any) => void
  onElementDelete: (elementId: string) => void
  selectedElementId: string | null
  onElementSelect: (elementId: string) => void
  showMetaContent?: boolean
}

export function SlideDisplay({
  slide,
  slideNumber,
  onElementUpdate,
  onElementDelete,
  selectedElementId,
  onElementSelect,
  showMetaContent = true
}: SlideDisplayProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Slide Number Badge */}
      <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
        Slide {slideNumber}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {/* Slide Content - Title and Description First */}
        <div className="space-y-6 mb-8">
          {/* Slide Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {slide.title}
            </h1>
            {slide.content && (
              <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto">
                {slide.content}
              </p>
            )}
          </div>

          {/* Additional Slide Elements (excluding title/content which are now handled above) */}
          <div className="space-y-4">
            {slide.elements
              .filter(element => element.type !== 'title' && element.type !== 'content' && element.type !== 'placeholder')
              .map((element) => (
                <SlideElement
                  key={element.id}
                  element={element}
                  onUpdate={onElementUpdate}
                  onDelete={onElementDelete}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => onElementSelect(element.id)}
                />
              ))}
          </div>
        </div>

        {/* Meta Content Section - Moved to bottom */}
        {showMetaContent && (
          <div className="border-t pt-6">
            <SlideMetaContent
              narrativePurpose={slide.narrativePurpose}
              engagementHook={slide.engagementHook}
              suggestedVisuals={slide.suggestedVisuals}
            />
          </div>
        )}
      </div>

      {/* Slide Metadata Footer */}
      {showMetaContent && (
        <div className="px-8 pb-6">
          <SlideMetadata
            speakingTime={slide.speakingTime}
            contentDepth={slide.contentDepth}
          />
        </div>
      )}
    </div>
  )
}