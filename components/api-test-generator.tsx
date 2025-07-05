"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle, Loader2, Zap } from "lucide-react"

interface PresentationData {
  presentation_id: string
  presentation: {
    title: string
    slides: Array<{
      order: number
      title: string
      type: string
      content: Array<{
        type: string
        text?: string
        points?: string[]
      }>
      speaker_notes?: string
    }>
    theme: {
      colors: {
        primary: string
        secondary: string
        background: string
        text: string
      }
    }
    metadata: {
      slide_count: number
      estimated_duration: string
      style: string
    }
  }
  quality_report: {
    overall_score: number
    checks: Array<{
      check: string
      score: number
      feedback: string
      passed: boolean
    }>
  }
  status: string
}

export function ApiTestGenerator() {
  const [topic, setTopic] = useState("")
  const [keyPoints, setKeyPoints] = useState("")
  const [slideCount, setSlideCount] = useState(5)
  const [style, setStyle] = useState("professional")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("idle")
  const [presentation, setPresentation] = useState<PresentationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)

  const baseUrl = "https://vibe-decker-agents-mvp10-production.up.railway.app"

  const generatePresentation = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic")
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setStatus("Initiating generation...")
    setError(null)
    setPresentation(null)

    try {
      // 1. Call API to start generation
      const response = await fetch(`${baseUrl}/api/v1/presentations/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          key_points: keyPoints.split("\n").filter((point) => point.trim()),
          slide_count: slideCount,
          style: style,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Generation started:", data.presentation_id)

      // 2. Connect to WebSocket
      const websocketUrl = `wss://vibe-decker-agents-mvp10-production.up.railway.app${data.websocket_url}`
      const websocket = new WebSocket(websocketUrl)

      websocket.onopen = () => {
        console.log("WebSocket connected")
        setStatus("Connected to generation service")
      }

      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log("WebSocket message:", message)

        switch (message.type) {
          case "connected":
            setStatus("Generation service connected")
            break
          case "status":
            setStatus(`Generation ${message.status}`)
            break
          case "progress":
            setProgress(message.progress)
            setStatus(message.message)
            break
          case "complete":
            setPresentation(message.presentation)
            setStatus("Generation completed!")
            setProgress(100)
            setIsGenerating(false)
            websocket.close()
            break
          case "error":
            setError(message.error)
            setStatus("Generation failed")
            setIsGenerating(false)
            websocket.close()
            break
          case "pong":
            // Keep alive response
            break
        }
      }

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error)
        setError("Connection error occurred")
        setIsGenerating(false)
      }

      websocket.onclose = (event) => {
        console.log("WebSocket closed:", event)
        if (!event.wasClean && isGenerating) {
          setError("Connection lost unexpectedly")
          setIsGenerating(false)
        }
      }

      // Keep connection alive
      const pingInterval = setInterval(() => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send("ping")
        }
      }, 30000)

      // Cleanup on component unmount or connection close
      websocket.onclose = () => {
        clearInterval(pingInterval)
      }

      setWs(websocket)
    } catch (err) {
      console.error("Generation failed:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setIsGenerating(false)
    }
  }

  const stopGeneration = () => {
    if (ws) {
      ws.close()
      setWs(null)
    }
    setIsGenerating(false)
    setStatus("Generation stopped")
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [ws])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            API Test Generator
          </CardTitle>
          <CardDescription>
            Test the Vibe Decker backend API integration with real-time WebSocket updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Presentation Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Introduction to Machine Learning"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyPoints">Key Points (one per line)</Label>
            <Textarea
              id="keyPoints"
              placeholder="What is ML?&#10;Types of ML&#10;Applications&#10;Future trends"
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              disabled={isGenerating}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slideCount">Number of Slides: {slideCount}</Label>
            <input
              type="range"
              id="slideCount"
              min="3"
              max="20"
              value={slideCount}
              onChange={(e) => setSlideCount(Number.parseInt(e.target.value))}
              disabled={isGenerating}
              className="w-full"
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={generatePresentation} disabled={isGenerating || !topic.trim()} className="flex-1">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Presentation"
              )}
            </Button>
            {isGenerating && (
              <Button variant="outline" onClick={stopGeneration}>
                Stop
              </Button>
            )}
          </div>

          {/* Status and Progress */}
          {(isGenerating || status !== "idle") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status: {status}</span>
                <span className="text-sm text-slate-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Presentation Display */}
      {presentation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              Generated Presentation
            </CardTitle>
            <CardDescription>
              {presentation.presentation.title} • {presentation.presentation.metadata.slide_count} slides • Quality
              Score: {(presentation.quality_report.overall_score * 100).toFixed(0)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Presentation Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Presentation Details</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Duration:</strong> {presentation.presentation.metadata.estimated_duration}
                    </p>
                    <p>
                      <strong>Style:</strong> {presentation.presentation.metadata.style}
                    </p>
                    <p>
                      <strong>Slides:</strong> {presentation.presentation.metadata.slide_count}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Theme Colors</h4>
                  <div className="flex space-x-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: presentation.presentation.theme.colors.primary }}
                      title="Primary"
                    />
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: presentation.presentation.theme.colors.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: presentation.presentation.theme.colors.background }}
                      title="Background"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Quality Checks</h4>
                  <div className="space-y-1">
                    {presentation.quality_report.checks.map((check, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{check.check}</span>
                        <Badge variant={check.passed ? "default" : "destructive"}>
                          {(check.score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slides Preview */}
              <div className="lg:col-span-2">
                <h4 className="font-semibold mb-4">Slides Preview</h4>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {(presentation.presentation.slides || []).map((slide, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium">
                            {slide.order}. {slide.title}
                          </h5>
                          <Badge variant="outline" className="text-xs">
                            {slide.type}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                          {slide.content.map((content, contentIndex) => (
                            <div key={contentIndex}>
                              {content.type === "text" && content.text && <p>{content.text}</p>}
                              {content.type === "bullet" && content.points && (
                                <ul className="list-disc list-inside space-y-1">
                                  {content.points.map((point, pointIndex) => (
                                    <li key={pointIndex}>{point}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                        {slide.speaker_notes && (
                          <>
                            <Separator className="my-2" />
                            <p className="text-xs text-slate-500">
                              <strong>Speaker Notes:</strong> {slide.speaker_notes}
                            </p>
                          </>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
