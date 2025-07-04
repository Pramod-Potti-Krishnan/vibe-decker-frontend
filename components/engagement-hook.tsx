"use client"

import type React from "react"

interface EngagementHookProps {
  hook: string
}

export function EngagementHook({ hook }: EngagementHookProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-2">
        Engagement Hook
      </h3>
      <p className="text-sm text-blue-700 leading-relaxed italic">
        {hook}
      </p>
    </div>
  )
}