"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Loader2, RefreshCw, Copy } from "lucide-react"
import { tokenManager } from "@/lib/token-manager"
import { DecksterClient } from "@/lib/websocket-client"

interface TestStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  details?: any
}

export default function TestConnectionPage() {
  const [steps, setSteps] = useState<TestStep[]>([
    { id: 'env', name: 'Check Environment Configuration', status: 'pending' },
    { id: 'demo-endpoint', name: 'Test Demo Endpoint (/api/auth/demo)', status: 'pending' },
    { id: 'proxy-token', name: 'Get Token via Proxy', status: 'pending' },
    { id: 'ws-connect', name: 'Connect to WebSocket', status: 'pending' },
    { id: 'ws-auth', name: 'Authenticate WebSocket', status: 'pending' },
    { id: 'ws-ping', name: 'Send Test Message', status: 'pending' },
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [wsClient, setWsClient] = useState<DecksterClient | null>(null)

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📝'
    setLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`])
  }

  const updateStep = (id: string, status: TestStep['status'], message?: string, details?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, message, details } : step
    ))
  }

  const runTests = async () => {
    setIsRunning(true)
    setLogs([])
    setSteps(steps.map(s => ({ ...s, status: 'pending', message: undefined, details: undefined })))

    try {
      // Step 1: Check Environment
      updateStep('env', 'running')
      addLog('Checking environment configuration...')
      
      const envConfig = {
        backendUrl: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_HTTP_URL || 'Not configured',
        wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'Not configured',
        useProxy: process.env.NEXT_PUBLIC_USE_PROXY !== 'false',
        devMode: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true'
      }
      
      updateStep('env', 'success', 'Environment configured', envConfig)
      addLog(`Backend: ${envConfig.backendUrl}`, 'success')
      addLog(`WebSocket: ${envConfig.wsUrl}`, 'success')
      addLog(`Using Proxy: ${envConfig.useProxy}`, 'success')
      
      // Step 2: Test Demo Endpoint Directly
      updateStep('demo-endpoint', 'running')
      addLog('Testing direct connection to demo endpoint...')
      
      try {
        const demoResponse = await fetch('https://deckster-production.up.railway.app/api/auth/demo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: 'test_' + Date.now()
          })
        })
        
        if (demoResponse.ok) {
          const demoData = await demoResponse.json()
          updateStep('demo-endpoint', 'success', 'Demo endpoint accessible (no CORS!)', {
            tokenReceived: !!demoData.access_token,
            expiresIn: demoData.expires_in
          })
          addLog('✅ Backend now supports CORS!', 'success')
        } else {
          updateStep('demo-endpoint', 'error', `Failed with status ${demoResponse.status}`)
          addLog('Demo endpoint returned error (but CORS headers present)', 'error')
        }
      } catch (error: any) {
        if (error.message.includes('CORS')) {
          updateStep('demo-endpoint', 'error', 'Blocked by CORS')
          addLog('Still blocked by CORS, using proxy...', 'info')
        } else {
          updateStep('demo-endpoint', 'error', error.message)
        }
      }
      
      // Step 3: Get Token via Proxy
      updateStep('proxy-token', 'running')
      addLog('Getting authentication token via proxy...')
      
      try {
        const token = await tokenManager.getValidToken()
        updateStep('proxy-token', 'success', 'Token obtained successfully', { 
          tokenLength: token.length,
          expiresAt: new Date(tokenManager.getExpiryTime() || 0).toLocaleString()
        })
        addLog('Authentication token obtained', 'success')
        
        // Step 3: Connect to WebSocket
        updateStep('ws-connect', 'running')
        addLog('Connecting to WebSocket...')
        
        const client = new DecksterClient({
          url: envConfig.wsUrl,
          reconnectDelay: 1000,
          maxReconnectAttempts: 1
        })
        
        setWsClient(client)
        
        // Set up event listeners
        client.on('connected', () => {
          updateStep('ws-connect', 'success', 'WebSocket connected')
          addLog('WebSocket connection established', 'success')
        })
        
        client.on('authenticated', (data) => {
          updateStep('ws-auth', 'success', 'WebSocket authenticated', data)
          addLog(`WebSocket authenticated with session: ${data.session_id || 'N/A'}`, 'success')
          
          // Step 5: Send Ping
          updateStep('ws-ping', 'running')
          addLog('Sending ping message...')
          
          client.send({ type: 'ping' } as any).then(() => {
            updateStep('ws-ping', 'success', 'Ping sent successfully')
            addLog('Ping message sent', 'success')
          }).catch(err => {
            updateStep('ws-ping', 'error', err.message)
            addLog(`Failed to send ping: ${err.message}`, 'error')
          })
        })
        
        client.on('error', (error) => {
          addLog(`WebSocket error: ${error.message}`, 'error')
        })
        
        client.on('disconnected', () => {
          addLog('WebSocket disconnected', 'info')
        })
        
        // Connect with token
        await client.connect(token)
        
      } catch (tokenError: any) {
        updateStep('proxy-token', 'error', tokenError.message)
        addLog(`Failed to get token: ${tokenError.message}`, 'error')
        
        // Show auth method that failed
        const lastError = tokenManager.getLastError()
        if (lastError) {
          addLog(`Token Manager Error: ${lastError.message}`, 'error')
        }
      }
      
    } catch (error: any) {
      addLog(`Test failed: ${error.message}`, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  const copyLogs = () => {
    const logText = logs.join('\n')
    navigator.clipboard.writeText(logText)
  }

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsClient) {
        wsClient.disconnect()
      }
    }
  }, [wsClient])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Connection Test</h1>
        <p className="text-gray-600 mt-2">
          Test your WebSocket connection and authentication setup
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Steps</CardTitle>
            <CardDescription>
              Step-by-step connection process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="flex items-start gap-3">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="font-medium">{step.name}</div>
                    {step.message && (
                      <div className="text-sm text-gray-600 mt-1">{step.message}</div>
                    )}
                    {step.details && (
                      <div className="text-xs font-mono bg-gray-100 p-2 rounded mt-2">
                        {JSON.stringify(step.details, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-6" />
            
            <Button
              onClick={runTests}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Connection Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connection Logs</CardTitle>
                <CardDescription>
                  Detailed connection information
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyLogs}
                disabled={logs.length === 0}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded border p-4">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500">
                  No logs yet. Run the connection test to see details.
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                tokenManager.invalidateToken()
                addLog('Token invalidated - will refresh on next request', 'info')
              }}
            >
              Invalidate Token
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.clear()
                addLog('Local storage cleared', 'info')
              }}
            >
              Clear Storage
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Browser Console Test (Copy & Paste)</h4>
            <ScrollArea className="h-48 w-full rounded border bg-gray-50 p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap">{`// Complete test in browser console
(async () => {
  // 1. Get token
  const tokenRes = await fetch('https://deckster-production.up.railway.app/api/auth/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 'browser_test' })
  });
  const { access_token } = await tokenRes.json();
  console.log('✅ Got token:', access_token);
 
  // 2. Connect WebSocket
  const ws = new WebSocket(\`wss://deckster-production.up.railway.app/ws?token=\${access_token}\`);
 
  ws.onopen = () => console.log('✅ WebSocket connected!');
  ws.onmessage = (e) => console.log('📨 Message:', JSON.parse(e.data));
  ws.onerror = (e) => console.error('❌ Error:', e);
  ws.onclose = (e) => console.log('🔌 Closed:', e.code, e.reason);
 
  // 3. Send test message after connection
  ws.onopen = () => {
    ws.send(JSON.stringify({
      message_id: 'test_' + Date.now(),
      timestamp: new Date().toISOString(),
      session_id: null,
      type: 'user_input',
      data: {
        text: 'Create a simple 5-slide pitch deck',
        response_to: null,
        attachments: [],
        ui_references: [],
        frontend_actions: []
      }
    }));
  };
})();`}</pre>
            </ScrollArea>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                const code = document.querySelector('pre')?.textContent || ''
                navigator.clipboard.writeText(code)
                addLog('Test code copied to clipboard', 'success')
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Test Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}