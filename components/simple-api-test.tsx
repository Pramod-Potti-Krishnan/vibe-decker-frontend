"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Loader2, Wifi, WifiOff } from "lucide-react"

export function SimpleApiTest() {
  const [healthStatus, setHealthStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [healthData, setHealthData] = useState<any>(null)

  const [apiStatus, setApiStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [apiData, setApiData] = useState<any>(null)

  const [wsStatus, setWsStatus] = useState<"idle" | "connecting" | "connected" | "error" | "closed">("idle")
  const [wsMessages, setWsMessages] = useState<any[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)

  const baseUrl = "https://vibe-decker-agents-mvp10-production.up.railway.app"

  // Test 1: Health Check
  const testHealth = async () => {
    setHealthStatus("testing")
    setHealthData(null)

    try {
      const response = await fetch(`${baseUrl}/health`)
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

  // Test 2: Generate Presentation API
  const testGenerateAPI = async () => {
    setApiStatus("testing")
    setApiData(null)

    try {
      const response = await fetch(`${baseUrl}/api/v1/presentations/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: "Simple Test Presentation",
          key_points: ["Point 1", "Point 2", "Point 3"],
          slide_count: 5,
          style: "professional",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setApiData(data)
      setApiStatus("success")
      console.log("API call success:", data)
    } catch (error) {
      console.error("API call failed:", error)
      setApiStatus("error")
      setApiData({ error: error.message })
    }
  }

  // Test 3: WebSocket Connection
  const testWebSocket = () => {
    if (!apiData?.websocket_url) {
      alert("Please run the API test first to get a WebSocket URL")
      return
    }

    setWsStatus("connecting")
    setWsMessages([])

    try {
      const websocketUrl = `wss://vibe-decker-agents-mvp10-production.up.railway.app${apiData.websocket_url}`
      console.log("Connecting to WebSocket:", websocketUrl)

      const websocket = new WebSocket(websocketUrl)

      websocket.onopen = () => {
        console.log("WebSocket connected")
        setWsStatus("connected")
        setWsMessages((prev) => [...prev, { type: "system", message: "WebSocket connected successfully" }])
      }

      websocket.onmessage = (event) => {
        console.log("WebSocket message:", event.data)
        try {
          const message = JSON.parse(event.data)
          setWsMessages((prev) => [...prev, { type: "received", message: message }])
        } catch (e) {
          setWsMessages((prev) => [...prev, { type: "received", message: event.data }])
        }
      }

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error)
        setWsStatus("error")
        setWsMessages((prev) => [...prev, { type: "error", message: "WebSocket connection error" }])
      }

      websocket.onclose = (event) => {
        console.log("WebSocket closed:", event)
        setWsStatus("closed")
        setWsMessages((prev) => [
          ...prev,
          {
            type: "system",
            message: `WebSocket closed. Code: ${event.code}, Reason: ${event.reason || "Unknown"}`,
          },
        ])
      }

      setWs(websocket)

      // Send ping after 5 seconds to test keep-alive
      setTimeout(() => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send("ping")
          setWsMessages((prev) => [...prev, { type: "sent", message: "ping" }])
        }
      }, 5000)
    } catch (error) {
      console.error("WebSocket connection failed:", error)
      setWsStatus("error")
      setWsMessages((prev) => [...prev, { type: "error", message: error.message }])
    }
  }

  const closeWebSocket = () => {
    if (ws) {
      ws.close()
      setWs(null)
    }
  }

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
      case "connected":
        return <Wifi className="h-4 w-4 text-green-600" />
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API & WebSocket Connection Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test 1: Health Check */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(healthStatus)}
                <h3 className="font-medium">1. Health Check</h3>
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

          {/* Test 2: API Call */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(apiStatus)}
                <h3 className="font-medium">2. Generate Presentation API</h3>
                <Badge variant="outline" className={getStatusColor(apiStatus)}>
                  {apiStatus}
                </Badge>
              </div>
              <Button onClick={testGenerateAPI} disabled={apiStatus === "testing"} size="sm">
                {apiStatus === "testing" ? "Testing..." : "Test API"}
              </Button>
            </div>

            {apiData && (
              <div className="ml-6 p-3 bg-slate-50 rounded text-sm">
                <pre>{JSON.stringify(apiData, null, 2)}</pre>
              </div>
            )}
          </div>

          <Separator />

          {/* Test 3: WebSocket */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(wsStatus)}
                <h3 className="font-medium">3. WebSocket Connection</h3>
                <Badge variant="outline" className={getStatusColor(wsStatus)}>
                  {wsStatus}
                </Badge>
              </div>
              <div className="space-x-2">
                <Button
                  onClick={testWebSocket}
                  disabled={wsStatus === "connecting" || !apiData?.websocket_url}
                  size="sm"
                >
                  {wsStatus === "connecting" ? "Connecting..." : "Test WebSocket"}
                </Button>
                {ws && (
                  <Button onClick={closeWebSocket} variant="outline" size="sm">
                    Close
                  </Button>
                )}
              </div>
            </div>

            {wsMessages.length > 0 && (
              <div className="ml-6 space-y-2">
                <h4 className="text-sm font-medium">WebSocket Messages:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
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
                      <span className="font-medium">[{msg.type}]</span>{" "}
                      <span>{typeof msg.message === "object" ? JSON.stringify(msg.message) : msg.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>What Should Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">✅ Expected to Work:</h4>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Health check should return API status and version</li>
              <li>• API call should return presentation_id and websocket_url</li>
              <li>• WebSocket should connect and send "connected" message</li>
              <li>• WebSocket should respond to "ping" with "pong"</li>
              <li>• WebSocket should send progress updates during generation</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">❓ Might Not Work Yet:</h4>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Full presentation generation (depends on AI service setup)</li>
              <li>• Complete slide data structure</li>
              <li>• Quality reports and scoring</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">🔧 Troubleshooting:</h4>
            <ul className="text-sm space-y-1 ml-4">
              <li>• If health check fails: API server might be down</li>
              <li>• If API call fails: Check CORS or server configuration</li>
              <li>• If WebSocket fails: Check WebSocket server setup</li>
              <li>• Check browser console for detailed error messages</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
