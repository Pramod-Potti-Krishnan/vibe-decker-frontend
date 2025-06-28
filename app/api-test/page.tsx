"use client"

import { VibeDeckTest } from "@/components/vibe-decker-test"

export default function ApiTestPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Vibe Decker API Test Suite</h1>
          <p className="text-slate-600 mt-1">
            Test the complete Vibe Decker API integration with real-time WebSocket updates
          </p>
          <div className="mt-2 text-sm text-slate-500">
            Base URL:{" "}
            <code className="bg-slate-100 px-1 rounded">
              https://vibe-decker-agents-mvp10-production.up.railway.app
            </code>
          </div>
        </div>
      </header>

      <main className="py-8">
        <VibeDeckTest />
      </main>
    </div>
  )
}
