"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useDecksterWebSocket } from "@/hooks/use-deckster-websocket"
import { usePresentation, PresentationProvider } from "@/contexts/presentation-context"
import { presentationActions } from "@/lib/presentation-reducer"
import { WebSocketErrorBoundary } from "@/components/error-boundary"
import { ConnectionError } from "@/components/connection-error"
import { ConnectionStatusIndicator } from "@/components/connection-debug"
import { ConversationFlow, ConversationFlowCompact } from "@/components/conversation-flow"
import { WaitingIndicator } from "@/components/waiting-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserProfileMenu } from "@/components/user-profile-menu"
import {
  Sparkles,
  Users,
  MessageSquare,
  Palette,
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings,
  Download,
  Share,
  Maximize2,
  Minimize2,
  Menu,
  History,
  PinOff,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AttachmentPanel } from "@/components/attachment-panel"
import { SettingsDialog } from "@/components/settings-dialog"
import { ShareDialog } from "@/components/share-dialog"
import { VersionHistory } from "@/components/version-history"
import { EnhancedChatInput } from "@/components/enhanced-chat-input"
import { EnhancedProjectSidebar } from "@/components/enhanced-project-sidebar"
import { SlideElement } from "@/components/slide-element"
import { SlideDisplay } from "@/components/slide-display"
import { ChatMessage } from "@/components/chat-message"
import { ProgressTracker } from "@/components/progress-tracker"
import { AgentStatus as AgentStatusType } from "@/lib/types/director-messages"
import { OnboardingModal } from "@/components/onboarding-modal"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

function BuilderContent() {
  const { user, isLoading: isAuthLoading, requireAuth } = useAuth()
  const { state, dispatch } = usePresentation()
  const router = useRouter()
  
  // WebSocket integration
  const {
    connected,
    authenticated,
    connectionState,
    error: wsError,
    messages: directorMessages,
    slides: slideData,
    chatMessages,
    progress,
    sendMessage,
    uploadFile,
    referenceSlideElement,
    performAction,
    isReady
  } = useDecksterWebSocket({ autoConnect: true })

  // Local UI state
  const [inputMessage, setInputMessage] = useState("")
  const [isCanvasFocused, setIsCanvasFocused] = useState(false)
  const [isChatFocused, setIsChatFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [internetSearchEnabled, setInternetSearchEnabled] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [splitPosition, setSplitPosition] = useState(25)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartSplit, setDragStartSplit] = useState(50)
  const [isNavPinned, setIsNavPinned] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check if user is new and should see onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isNewUser = urlParams.get('new') === 'true'
    
    if (isNewUser && user) {
      setShowOnboarding(true)
      // Remove the query parameter
      window.history.replaceState({}, '', '/builder')
    }
  }, [user])

  // Process director messages into presentation state
  useEffect(() => {
    directorMessages.forEach(message => {
      const actions = presentationActions.processDirectorMessage(message)
      actions.forEach(action => dispatch(action))
    })
  }, [directorMessages, dispatch])

  // Update slides when slide data changes
  useEffect(() => {
    if (slideData) {
      dispatch({
        type: 'UPDATE_SLIDES',
        payload: {
          slides: slideData.slides,
          metadata: slideData.presentation_metadata
        }
      })
    }
  }, [slideData, dispatch])

  // Update progress
  useEffect(() => {
    if (progress) {
      dispatch({
        type: 'UPDATE_PROGRESS',
        payload: progress
      })
    }
  }, [progress, dispatch])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [state.chatMessages])

  // Check authentication
  useEffect(() => {
    requireAuth()
  }, [requireAuth])

  // Generate presentation ID
  useEffect(() => {
    if (!state.presentationId) {
      dispatch({
        type: 'SET_PRESENTATION_ID',
        payload: `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
    }
  }, [state.presentationId, dispatch])

  // Handle sending messages
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !isReady) return

    dispatch({ type: 'SET_PROCESSING', payload: true })
    
    try {
      await sendMessage(message)
      setInputMessage("")
    } catch (error) {
      console.error('Failed to send message:', error)
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to send message. Please try again.' 
      })
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false })
    }
  }, [isReady, sendMessage, dispatch])

  // Handle file attachments
  const handleFileAttach = useCallback(async (files: File[]) => {
    if (!isReady) return

    dispatch({ type: 'SET_PROCESSING', payload: true })
    
    try {
      for (const file of files) {
        await uploadFile(file)
      }
    } catch (error) {
      console.error('Failed to upload files:', error)
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to upload files. Please try again.' 
      })
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false })
    }
  }, [isReady, uploadFile, dispatch])

  // Handle slide navigation
  const handleSlideChange = useCallback((index: number) => {
    dispatch({ type: 'SET_CURRENT_SLIDE', payload: index })
  }, [dispatch])

  // Handle element updates
  const handleElementUpdate = useCallback((slideId: string, elementId: string, updates: any) => {
    dispatch({
      type: 'UPDATE_SLIDE',
      payload: {
        slideId,
        updates: {
          elements: state.slides.find(s => s.slide_id === slideId)?.elements?.map(el =>
            el.id === elementId ? { ...el, ...updates } : el
          )
        }
      }
    })
  }, [state.slides, dispatch])

  // Map agent statuses for UI
  const agentStatuses = useMemo(() => {
    const agents = ['director', 'scripter', 'graphic-artist', 'data-visualizer']
    return agents.map(agentName => {
      const status = state.agentStatuses.find(s => s.agentName.toLowerCase().replace(/\s+/g, '-') === agentName)
      return {
        agent: agentName as any,
        status: status?.status || 'idle',
        task: status?.currentTask || 'Waiting for instructions',
        progress: status?.progress || 0
      }
    })
  }, [state.agentStatuses])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      {showSidebar && (
        <EnhancedProjectSidebar 
          showSidebar={showSidebar} 
          setShowSidebar={setShowSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="bg-white border-b h-16 flex-shrink-0">
          <div className="h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link href="/" className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <span className="font-semibold text-xl">Vibe Deck</span>
              </Link>
              <Badge variant="secondary" className="hidden sm:flex">
                AI-Powered
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <ConnectionStatusIndicator 
                connectionState={connectionState}
                isReady={isReady}
              />
              <ConversationFlowCompact />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVersions(!showVersions)}
              >
                <History className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShare(true)}
              >
                <Share className="h-5 w-5" />
              </Button>
              <UserProfileMenu />
            </div>
          </div>
        </header>

        {/* Connection Error Alert */}
        {wsError && (
          <div className="px-4 py-2 bg-white border-b">
            <ConnectionError onRetry={() => window.location.reload()} />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Chat & Agents */}
          <div 
            className="flex flex-col bg-white border-r transition-all duration-300"
            style={{ width: `${splitPosition}%` }}
          >
            {/* Agent Status Bar */}
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-sm font-medium mb-3">AI Agents</h3>
              <div className="space-y-2">
                {agentStatuses.map((agent) => (
                  <div key={agent.agent} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === "working" ? "bg-green-500 animate-pulse" :
                        agent.status === "thinking" ? "bg-yellow-500 animate-pulse" :
                        agent.status === "completed" ? "bg-blue-500" : "bg-gray-300"
                      }`} />
                      <span className="text-sm capitalize">{agent.agent.replace('-', ' ')}</span>
                    </div>
                    {agent.status !== "idle" && (
                      <span className="text-xs text-gray-500">{agent.task}</span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Progress Tracker */}
              {state.progress && (
                <div className="mt-4">
                  <ProgressTracker progress={state.progress} />
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 mb-4">
                {state.chatMessages.map((message, index) => (
                  <ChatMessage 
                    key={index}
                    message={message}
                    onAction={performAction}
                    onResponse={(text, questionId) => sendMessage(text, { responseTo: questionId })}
                  />
                ))}
                
                {state.isProcessing && (
                  <WaitingIndicator 
                    message="AI agents are working on your request..." 
                    showProgress={true}
                  />
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <EnhancedChatInput
                value={inputMessage}
                onChange={setInputMessage}
                onSend={handleSendMessage}
                onFileAttach={handleFileAttach}
                isLoading={state.isProcessing}
                internetSearchEnabled={internetSearchEnabled}
                onToggleInternetSearch={() => setInternetSearchEnabled(!internetSearchEnabled)}
                placeholder={!isReady ? "Connecting to AI agents..." : "Ask the AI agents anything..."}
                connectionState={connectionState}
                isReady={isReady}
              />
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-colors"
            onMouseDown={(e) => {
              setIsDragging(true)
              setDragStartX(e.clientX)
              setDragStartSplit(splitPosition)
            }}
          />

          {/* Right Panel - Slides */}
          <div className="flex-1 flex flex-col bg-gray-100">
            {/* Slide Navigation */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSlideChange(Math.max(0, state.currentSlideIndex - 1))}
                    disabled={state.currentSlideIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Slide {state.currentSlideIndex + 1} of {state.slides.length || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSlideChange(Math.min(state.slides.length - 1, state.currentSlideIndex + 1))}
                    disabled={state.currentSlideIndex >= state.slides.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCanvasFocused(!isCanvasFocused)}
                  >
                    {isCanvasFocused ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Slide Canvas */}
            <div className="flex-1 p-8 overflow-auto">
              {state.slides.length > 0 && state.slides[state.currentSlideIndex] ? (
                <SlideDisplay
                  slide={state.slides[state.currentSlideIndex]}
                  isSelected={true}
                  onElementUpdate={(elementId, updates) => 
                    handleElementUpdate(state.slides[state.currentSlideIndex].slide_id, elementId, updates)
                  }
                  selectedElementId={selectedElementId}
                  onElementSelect={setSelectedElementId}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Your slides will appear here</p>
                    <p className="text-sm text-gray-400 mt-2">Start by describing your presentation</p>
                  </div>
                </div>
              )}
            </div>

            {/* Slide Thumbnails */}
            <div className="bg-white border-t p-4">
              <ScrollArea className="w-full">
                <div className="flex gap-4">
                  {state.slides && Array.isArray(state.slides) && state.slides.map((slide, index) => (
                    <button
                      key={slide.slide_id}
                      onClick={() => handleSlideChange(index)}
                      className={`relative flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        index === state.currentSlideIndex
                          ? "border-blue-500 shadow-lg"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="absolute inset-0 bg-white p-2">
                        <p className="text-xs font-medium truncate">{slide.title}</p>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                        {index + 1}
                      </div>
                    </button>
                  ))}
                  {(!state.slides || !Array.isArray(state.slides) || state.slides.length === 0) && (
                    <div className="w-32 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      <ShareDialog open={showShare} onOpenChange={setShowShare} />
      {showVersions && (
        <VersionHistory
          versions={[]}
          currentVersion={null}
          onSelectVersion={() => {}}
          onClose={() => setShowVersions(false)}
        />
      )}
      <OnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Drag handler for resize */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 cursor-col-resize"
          onMouseMove={(e) => {
            const deltaX = e.clientX - dragStartX
            const containerWidth = window.innerWidth
            const deltaPercent = (deltaX / containerWidth) * 100
            const newSplit = Math.max(20, Math.min(50, dragStartSplit + deltaPercent))
            setSplitPosition(newSplit)
          }}
          onMouseUp={() => {
            setIsDragging(false)
          }}
        />
      )}
    </div>
  )
}

export default function BuilderPage() {
  return (
    <PresentationProvider>
      <WebSocketErrorBoundary>
        <BuilderContent />
      </WebSocketErrorBoundary>
    </PresentationProvider>
  )
}