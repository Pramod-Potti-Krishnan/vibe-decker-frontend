"use client"

import type React from "react"
import { Image, BarChart, Video, FileText, Layout } from "lucide-react"

interface VisualSuggestion {
  type: 'image' | 'infographic' | 'chart' | 'video' | 'diagram'
  description: string
  purpose: string
}

interface VisualSuggestionsProps {
  suggestions: (VisualSuggestion | string)[]
}

export function VisualSuggestions({ suggestions }: VisualSuggestionsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />
      case 'infographic':
        return <FileText className="h-4 w-4" />
      case 'chart':
        return <BarChart className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'diagram':
        return <Layout className="h-4 w-4" />
      default:
        return <Image className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
        Suggested Visuals
      </h3>
      <div className="space-y-3">
        {suggestions && Array.isArray(suggestions) && suggestions.map((suggestion, index) => {
          if (typeof suggestion === 'string') {
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-gray-500">
                  <Image className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{suggestion}</p>
                </div>
              </div>
            )
          }

          return (
            <div key={index} className="bg-white rounded-md p-3 border border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-gray-500">
                  {getIcon(suggestion.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-gray-600 uppercase">
                      {getTypeLabel(suggestion.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{suggestion.description}</p>
                  <p className="text-xs text-gray-500 italic">Purpose: {suggestion.purpose}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}