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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Loader2, Wifi, WifiOff, Zap, MessageSquare, Clock, Star } from "lucide-react"

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
      layout?: any
      speaker_notes?: string
      visual_suggestions?: string[]
    }>
    theme: {
      name: string
      colors: {
        primary: string
        secondary: string
        background: string
        text: string
        accent: string
      }
      typography: any
      spacing: any
    }
    metadata: {
      created_at: string
      slide_count: number
      estimated_duration: string
      keywords: string[]
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
    warnings: string[]
    suggestions: string[]
  }
  status: string
}

export function VibeDeckTest() {
  // Connection Test States
  const [healthStatus, setHealthStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [healthData, setHealthData] = useState<any>(null)

  const [rootStatus, setRootStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [rootData, setRootData] = useState<any>(null)

  // Generation Test States
  const [topic, setTopic] = useState("Introduction to React Hooks")
  const [keyPoints, setKeyPoints] = useState("useState Hook\nuseEffect Hook\nCustom Hooks\nBest Practices")
  const [slideCount, setSlideCount] = useState(8)
  const [style, setStyle] = useState("modern")

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("idle")
  const [presentation, setPresentation] = useState<PresentationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // WebSocket States
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [wsMessages, setWsMessages] = useState<any[]>([])
  const [wsStatus, setWsStatus] = useState<"idle" | "connecting" | "connected" | "error" | "closed">("idle")

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://vibe-decker-agents-mvp10-production.up.railway.app"

  // Test 1: Health Check
  const testHealth = async () => {
    setHealthStatus("testing")
    setHealthData(null)

    try {
      const response = await fetch(`${baseUrl}/health`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setHealthData(data)
      setHealthStatus("success")
      console.log("Health check success:", data)
    } catch (error) {
      console.error("Health check failed:", error)
      setHealthStatus("error")
      setHealthData({ error: error.message })
    }
  }

  // Test 2: Root Endpoint
  const testRoot = async () => {
    setRootStatus("testing")
    setRootData(null)

    try {
      const response = await fetch(`${baseUrl}/`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setRootData(data)
      setRootStatus("success")
      console.log("Root endpoint success:", data)
    } catch (error) {
      console.error("Root endpoint failed:", error)
      setRootStatus("error")
      setRootData({ error: error.message })
    }
  }

  // Test 3: Full Generation with WebSocket
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
    setWsMessages([])

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
      console.log("Generation started:", data)
      setStatus("Connecting to WebSocket...")

      // 2. Connect to WebSocket
      const wsBaseUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://')
      const websocketUrl = `${wsBaseUrl}${data.websocket_url}`
      console.log("Connecting to:", websocketUrl)

      const websocket = new WebSocket(websocketUrl)
      setWsStatus("connecting")

      websocket.onopen = () => {
        console.log("WebSocket connected")
        setWsStatus("connected")
        setStatus("Connected to generation service")
        setWsMessages((prev) => [
          ...prev,
          {
            type: "system",
            message: "WebSocket connected successfully",
            timestamp: new Date().toISOString(),
          },
        ])
      }

      websocket.onmessage = (event) => {
        console.log("WebSocket message:", event.data)

        try {
          const message = JSON.parse(event.data)
          setWsMessages((prev) => [
            ...prev,
            {
              type: "received",
              message: message,
              timestamp: new Date().toISOString(),
            },
          ])

          switch (message.type) {
            case "connected":
              setStatus("Generation service connected")
              break
            case "status":
              setStatus(`Generation ${message.status}`)
              break
            case "progress":
              setProgress(message.progress || 0)
              setStatus(message.message || `Progress: ${message.progress}%`)
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
              console.log("Received pong")
              break
          }
        } catch (e) {
          // Handle non-JSON messages
          setWsMessages((prev) => [
            ...prev,
            {
              type: "received",
              message: event.data,
              timestamp: new Date().toISOString(),
            },
          ])
        }
      }

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error)
        setError("WebSocket connection error")
        setWsStatus("error")
        setIsGenerating(false)
      }

      websocket.onclose = (event) => {
        console.log("WebSocket closed:", event)
        setWsStatus("closed")
        if (!event.wasClean && isGenerating) {
          setError("Connection lost unexpectedly")
          setIsGenerating(false)
        }
      }

      // Keep connection alive with ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send("ping")
          setWsMessages((prev) => [
            ...prev,
            {
              type: "sent",
              message: "ping",
              timestamp: new Date().toISOString(),
            },
          ])
        }
      }, 30000)

      // Cleanup on close
      websocket.onclose = (event) => {
        clearInterval(pingInterval)
        setWsStatus("closed")
        if (!event.wasClean && isGenerating) {
          setError("Connection lost unexpectedly")
          setIsGenerating(false)
        }
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
    setWsStatus("closed")
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [ws])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "testing":
      case "connecting":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case "closed":
        return <WifiOff className="h-4 w-4 text-slate-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "connected":
        return "text-green-600"
      case "error":
        return "text-red-600"
      case "testing":
      case "connecting":
        return "text-blue-600"
      case "closed":
        return "text-slate-500"
      default:
        return "text-slate-400"
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connection">Connection Tests</TabsTrigger>
          <TabsTrigger value="generation">Full Generation Test</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Connection Tests</CardTitle>
              <CardDescription>Test basic connectivity to the Vibe Decker API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Health Check */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(healthStatus)}
                    <h3 className="font-medium">Health Check</h3>
                    <Badge variant="outline" className={getStatusColor(healthStatus)}>
                      {healthStatus}
                    </Badge>
                  </div>
                  <Button onClick={testHealth} disabled={healthStatus === "testing"} size="sm">
                    {healthStatus === "testing" ? "Testing..." : "Test Health"}
                  </Button>
                </div>
                {healthData && (
                  <div className="ml-6 p-3 bg-slate-50 rounded text-sm">
                    <pre>{JSON.stringify(healthData, null, 2)}</pre>
                  </div>
                )}
              </div>

              <Separator />

              {/* Root Endpoint */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(rootStatus)}
                    <h3 className="font-medium">Root Endpoint</h3>
                    <Badge variant="outline" className={getStatusColor(rootStatus)}>
                      {rootStatus}
                    </Badge>
                  </div>
                  <Button onClick={testRoot} disabled={rootStatus === "testing"} size="sm">
                    {rootStatus === "testing" ? "Testing..." : "Test Root"}
                  </Button>
                </div>
                {rootData && (
                  <div className="ml-6 p-3 bg-slate-50 rounded text-sm">
                    <pre>{JSON.stringify(rootData, null, 2)}</pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Full Presentation Generation Test
              </CardTitle>
              <CardDescription>
                Test the complete workflow: API call → WebSocket connection → Real-time updates → Final presentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Presentation Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Introduction to React Hooks"
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
                  placeholder="useState Hook&#10;useEffect Hook&#10;Custom Hooks&#10;Best Practices"
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
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-500">{progress}%</span>
                      {wsStatus !== "idle" && (
                        <Badge variant="outline" className={getStatusColor(wsStatus)}>
                          <Wifi className="mr-1 h-3 w-3" />
                          {wsStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* WebSocket Messages */}
              {wsMessages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    WebSocket Messages ({wsMessages.length})
                  </h4>
                  <ScrollArea className="h-32 border rounded p-2">
                    <div className="space-y-1">
                      {wsMessages.map((msg, index) => (
                        <div
                          key={index}
                          className="text-xs p-2 rounded"
                          style={{
                            backgroundColor:
                              msg.type === "error"
                                ? "#fef2f2"
                                : msg.type === "sent"
                                  ? "#eff6ff"
                                  : msg.type === "system"
                                    ? "#f0fdf4"
                                    : "#f8fafc",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">[{msg.type}]</span>
                            <span className="text-slate-500">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="mt-1">
                            {typeof msg.message === "object" ? JSON.stringify(msg.message, null, 2) : msg.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
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
                <CardDescription className="flex items-center space-x-4">
                  <span>{presentation.presentation.title}</span>
                  <Badge variant="outline">{presentation.presentation.metadata.slide_count} slides</Badge>
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    {presentation.presentation.metadata.estimated_duration}
                  </Badge>
                  <Badge variant="outline">
                    <Star className="mr-1 h-3 w-3" />
                    {(presentation.quality_report.overall_score * 100).toFixed(0)}% quality
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Presentation Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Metadata</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Style:</strong> {presentation.presentation.metadata.style}
                        </p>
                        <p>
                          <strong>Keywords:</strong> {presentation.presentation.metadata.keywords.join(", ")}
                        </p>
                        <p>
                          <strong>Created:</strong>{" "}
                          {new Date(presentation.presentation.metadata.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Theme Colors</h4>
                      <div className="flex space-x-2">
                        {Object.entries(presentation.presentation.theme.colors).map(([name, color]) => (
                          <div key={name} className="text-center">
                            <div
                              className="w-6 h-6 rounded border mb-1"
                              style={{ backgroundColor: color }}
                              title={`${name}: ${color}`}
                            />
                            <span className="text-xs">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Quality Report</h4>
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
                      {presentation.quality_report.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Suggestions:</p>
                          <ul className="text-xs text-slate-600 list-disc list-inside">
                            {presentation.quality_report.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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
                            {slide.visual_suggestions && slide.visual_suggestions.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium">Visual Suggestions:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {slide.visual_suggestions.map((suggestion, suggestionIndex) => (
                                    <Badge key={suggestionIndex} variant="outline" className="text-xs">
                                      {suggestion}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
