"use client"

import type React from "react"

interface NarrativePurposeProps {
  purpose: string
}

export function NarrativePurpose({ purpose }: NarrativePurposeProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-2">
        Narrative Purpose
      </h3>
      <p className="text-sm text-green-700 leading-relaxed">
        {purpose}
      </p>
    </div>
  )
}