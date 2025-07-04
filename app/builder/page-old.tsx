"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

// API Integration imports
import { VibeDeckWebSocket } from "@/lib/websocket-service"
import { DataTransformer } from "@/lib/data-transformer"
import { AgentMapper } from "@/lib/agent-mapper"
import { FeatureFlags } from "@/lib/feature-flags"
import { ConnectionStatus } from "@/components/connection-status"
import { ConnectionState } from "@/lib/types/vibe-decker-api"
import { WebSocketErrorBoundary } from "@/components/error-boundary"
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

interface Message {
  id: string
  type: "user" | "agent"
  content: string
  timestamp: Date
  agent?: "director" | "scripter" | "graphic-artist" | "data-visualizer"
}

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
  // Meta-content fields for Phase 2
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

interface AgentStatus {
  agent: "director" | "scripter" | "graphic-artist" | "data-visualizer"
  status: "idle" | "thinking" | "working" | "completed"
  task: string
  progress: number
}

interface Attachment {
  id: string
  name: string
  type: "document" | "image" | "video" | "audio" | "data"
  size: string
  uploadedAt: Date
  url: string
}

interface Project {
  id: string
  name: string
  description: string
  createdAt: Date
  presentations: string[]
  isFolder?: boolean
  parentId?: string
}

interface Version {
  id: string
  name: string
  createdAt: Date
  slides: Slide[]
  description: string
}

interface Presentation {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  slideCount: number
  status: "draft" | "in-progress" | "completed"
  thumbnail: string
}

export default function BuilderPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([])
  const [isCanvasFocused, setIsCanvasFocused] = useState(false)
  const [isChatFocused, setIsChatFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [showSidebar, setShowSidebar] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [internetSearchEnabled, setInternetSearchEnabled] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  const [splitPosition, setSplitPosition] = useState(25) // Percentage for left pane - default to max canvas
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartSplit, setDragStartSplit] = useState(50)
  const [isNavPinned, setIsNavPinned] = useState(true)

  // API Integration state
  const [wsService, setWsService] = useState<VibeDeckWebSocket | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    reconnectAttempts: 0
  })
  const [currentPhase, setCurrentPhase] = useState(0)
  const [capabilities, setCapabilities] = useState<string[]>([])
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  
  // Refs for stable values in WebSocket handlers
  const currentPhaseRef = useRef(0)
  const conversationStateRef = useRef<'INIT' | 'GATHERING_REQUIREMENTS' | 'CREATING_STRUCTURE' | 'AWAITING_APPROVAL' | 'ENHANCING' | 'COMPLETE'>('INIT')
  const hasBasicStructureRef = useRef(false)
  const awaitingEnhancementRef = useRef(false)
  
  // Generate unique presentation ID (client-side only)
  const [presentationId, setPresentationId] = useState<string>('')
  
  useEffect(() => {
    // Generate ID only on client side to avoid hydration mismatch
    setPresentationId(`pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  }, [])

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: "1",
        type: "agent",
        content:
          "Hello! I'm The Director, and I'll be orchestrating your presentation creation. What would you like to create today?",
        timestamp: new Date(),
        agent: "director",
      },
    ])

    // Initialize agent statuses
    setAgentStatuses([
      { agent: "director", status: "idle", task: "Waiting for instructions", progress: 0 },
      { agent: "scripter", status: "idle", task: "Ready to write content", progress: 0 },
      { agent: "graphic-artist", status: "idle", task: "Ready to create visuals", progress: 0 },
      { agent: "data-visualizer", status: "idle", task: "Ready to create charts", progress: 0 },
    ])

    // Initialize mock data
    setProjects([
      {
        id: "1",
        name: "Marketing Presentations",
        description: "All marketing-related presentations and campaigns",
        createdAt: new Date("2024-01-10"),
        presentations: ["1", "2"],
        isFolder: true,
      },
      {
        id: "2",
        name: "Q4 Strategy",
        description: "Quarterly business strategy presentations",
        createdAt: new Date("2024-01-15"),
        presentations: ["3"],
      },
    ])

    setVersions([
      {
        id: "v1",
        name: "Initial Draft",
        createdAt: new Date("2024-01-20"),
        slides: [],
        description: "First version with basic structure",
      },
      {
        id: "v2",
        name: "Content Added",
        createdAt: new Date("2024-01-21"),
        slides: [],
        description: "Added content to all slides",
      },
      {
        id: "v3",
        name: "Visual Improvements",
        createdAt: new Date("2024-01-22"),
        slides: [],
        description: "Enhanced visuals and layout",
      },
    ])

    const mockPresentations = [
      {
        id: "1",
        title: "Q4 Marketing Strategy",
        description: "Comprehensive marketing plan for the fourth quarter",
        createdAt: "2024-01-15",
        updatedAt: "2024-01-16",
        slideCount: 12,
        status: "completed" as const,
        thumbnail: "/placeholder.svg?height=200&width=300",
      },
      {
        id: "2",
        title: "Product Launch Presentation",
        description: "Introducing our new product line to stakeholders",
        createdAt: "2024-01-14",
        updatedAt: "2024-01-14",
        slideCount: 8,
        status: "in-progress" as const,
        thumbnail: "/placeholder.svg?height=200&width=300",
      },
      {
        id: "3",
        title: "Team Performance Review",
        description: "Monthly team performance and goals assessment",
        createdAt: "2024-01-13",
        updatedAt: "2024-01-13",
        slideCount: 6,
        status: "draft" as const,
        thumbnail: "/placeholder.svg?height=200&width=300",
      },
    ]

    setPresentations(mockPresentations)
  }, [router])

  // Update refs when state changes
  useEffect(() => {
    currentPhaseRef.current = currentPhase
  }, [currentPhase])

  // WebSocket initialization effect
  useEffect(() => {
    if (!FeatureFlags.useRealAPI() || !presentationId) {
      if (!presentationId) {
        console.log('[Builder] Waiting for presentation ID...')
      } else {
        console.log('[Builder] Using mock API - WebSocket disabled')
      }
      return
    }

    console.log('[Builder] Initializing WebSocket connection...')
    console.log('[Builder] Conversation state:', conversationStateRef.current)
    
    try {
      const service = new VibeDeckWebSocket(presentationId)
      
      // Connection state handler
      service.on('connectionStateChange', (state: ConnectionState) => {
        console.log('[Builder] Connection state changed:', state)
        setConnectionState(state)
      })
      
      // Connected handler
      service.on('connected', (data: any) => {
        console.log('[Builder] Connected to API:', data)
        setCapabilities(data.capabilities || [])
        setCurrentPhase(data.current_phase || 0)
        currentPhaseRef.current = data.current_phase || 0
        conversationStateRef.current = 'INIT'
        console.log('[Builder] Initial conversation state:', conversationStateRef.current)
      })
      
      // Assistant message handler
      service.on('assistant_message', (data: any) => {
        console.log('[Builder] Assistant message:', data)
        console.log('[Builder] Assistant message content:', data.content)
        console.log('[Builder] Current phase:', currentPhaseRef.current)
        console.log('[Builder] Conversation state:', conversationStateRef.current)
        setIsLoading(false) // Stop loading when AI responds
        
        // Clear timeout if it exists
        if ((window as any).responseTimeout) {
          clearTimeout((window as any).responseTimeout)
          ;(window as any).responseTimeout = null
        }
        
        // Update conversation state based on message content
        if (data.content.includes('audience') || data.content.includes('target audience') || 
            data.content.includes('how long') || data.content.includes('main goal')) {
          conversationStateRef.current = 'GATHERING_REQUIREMENTS'
          console.log('[Builder] State -> GATHERING_REQUIREMENTS')
        } else if (data.content.includes('created') && data.content.includes('structure') && 
                   data.content.includes('review')) {
          conversationStateRef.current = 'AWAITING_APPROVAL'
          hasBasicStructureRef.current = true
          console.log('[Builder] State -> AWAITING_APPROVAL')
        } else if (data.content.includes('enhanced') && data.content.includes('structure')) {
          conversationStateRef.current = 'COMPLETE'
          console.log('[Builder] State -> COMPLETE')
        }
        
        // Determine which agent should speak based on message content and phase
        let agentType = 'director'
        if (data.content.includes('enhanced your presentation structure') || 
            data.content.includes('narrative purpose') ||
            data.content.includes('engagement hooks')) {
          agentType = 'scripter'
        }
        
        const agentMessage = {
          id: `agent-${Date.now()}`,
          type: "agent" as const,
          agent: agentType as any,
          content: data.content,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, agentMessage])
        
        // Check if AI is asking a question (ends with ?)
        const isQuestion = data.content.trim().endsWith('?')
        setIsWaitingForResponse(isQuestion)
        
        // Special handling for awaiting approval state
        if (conversationStateRef.current === 'AWAITING_APPROVAL' && 
            data.content.includes('looks good') === false) {
          awaitingEnhancementRef.current = true
          console.log('[Builder] Awaiting user approval for enhancement')
        }
      })
      
      // Status message handler
      service.on('status', (data: any) => {
        console.log('[Builder] Status message:', data)
        if (data.status === 'thinking') {
          setIsLoading(true) // Set loading when AI is thinking
          const statuses = AgentMapper.calculateAgentStatuses(data.phase || currentPhase, true)
          setAgentStatuses(statuses)
          
          // Update current phase if provided
          if (data.phase !== undefined) {
            setCurrentPhase(data.phase)
          }
        }
      })
      
      // Structure generated handler
      service.on('structure_generated', (data: any) => {
        console.log('[Builder] Raw structure_generated message:', JSON.stringify(data, null, 2))
        console.log('[Builder] Structure phase:', data.phase)
        console.log('[Builder] Conversation state:', conversationStateRef.current)
        setIsLoading(false) // Stop loading when structure is received
        
        // Clear timeout if it exists
        if ((window as any).responseTimeout) {
          clearTimeout((window as any).responseTimeout)
          ;(window as any).responseTimeout = null
        }
        
        if (data.structure) {
          if (DataTransformer.validateStrawmanStructure(data.structure)) {
            const slides = DataTransformer.strawmanToSlides(data.structure)
            console.log('[Builder] Generated slides:', slides)
            console.log('[Builder] Current phase ref:', currentPhaseRef.current, 'Data phase:', data.phase)
            setSlides(slides)
            
            // Update phase and agent statuses
            const newPhase = data.phase !== undefined ? data.phase : (currentPhaseRef.current + 1)
            setCurrentPhase(newPhase)
            currentPhaseRef.current = newPhase
            const statuses = AgentMapper.calculateAgentStatuses(newPhase, false)
            setAgentStatuses(statuses)
            
            // Update conversation state based on phase
            if (data.phase === 1) {
              hasBasicStructureRef.current = true
              conversationStateRef.current = 'CREATING_STRUCTURE'
              console.log('[Builder] Basic structure received, state -> CREATING_STRUCTURE')
            } else if (data.phase === 2) {
              conversationStateRef.current = 'COMPLETE'
              console.log('[Builder] Enhanced structure received, state -> COMPLETE')
            }
            
            // Only add completion message if we successfully processed the structure
            // Use the correct agent based on the phase
            const agent = data.phase === 2 ? "scripter" : "director"
            
            const completionMessage = {
              id: `completion-${data.phase}-${Date.now()}`,
              type: "agent" as const,
              agent: agent as any,
              content: data.phase === 2 
                ? `Perfect! I've enhanced your presentation structure with narrative purpose, engagement hooks, and visual suggestions. You can now see the complete strawman in the canvas on the right.`
                : `I've created your basic presentation structure with ${data.structure?.total_slides || 'the'} slides. You can see them in the canvas on the right.`,
              timestamp: new Date()
            }
            
            // Only add if we don't already have a completion message for this phase
            setMessages(prev => {
              const hasCompletionForPhase = prev.some(m => m.id.startsWith(`completion-${data.phase}-`))
              return hasCompletionForPhase ? prev : [...prev, completionMessage]
            })
          } else {
            console.error('[Builder] Invalid structure received:', data.structure)
            // Add error message to chat
            const errorMessage = {
              id: `error-${Date.now()}`,
              type: "agent" as const,
              agent: "director" as const,
              content: "I had trouble processing the presentation structure. Let me try again. Could you please repeat your request?",
              timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
          }
        } else {
          console.warn('[Builder] No structure in structure_generated message:', data)
          // Handle error case where enhancement failed
          if (data.error || data.message?.includes('trouble')) {
            const errorMessage = {
              id: `error-${Date.now()}`,
              type: "agent" as const,
              agent: "director" as const,
              content: data.message || "I had trouble enhancing the presentation. Let me try a different approach. Please say 'looks good' to continue.",
              timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
            
            // Reset to awaiting approval state to retry
            if (conversationStateRef.current === 'ENHANCING') {
              conversationStateRef.current = 'AWAITING_APPROVAL'
              console.log('[Builder] Enhancement failed, reverting to AWAITING_APPROVAL')
            }
          }
        }
      })
      
      // Error handler
      service.on('error', (error: any) => {
        // Only log meaningful errors, not empty objects
        if (error && (error.message || error.type || Object.keys(error).length > 0)) {
          console.error('[Builder] WebSocket error:', error)
        }
        setIsLoading(false) // Stop loading on error
      })
      
      // Connect to the service
      service.connect()
        .then(() => {
          setWsService(service)
          console.log('[Builder] WebSocket service ready')
        })
        .catch((error) => {
          console.error('[Builder] Failed to connect:', error)
        })
      
      // Cleanup on unmount
      return () => {
        console.log('[Builder] Cleaning up WebSocket connection')
        service.disconnect()
      }
    } catch (error) {
      console.error('[Builder] WebSocket initialization error:', error)
    }
  }, [presentationId])

  useEffect(() => {
    // Use a more stable scrolling approach to prevent layout shifts
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.closest('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" })
      }
    }
  }, [messages])


  const getAgentInfo = (agent: string) => {
    const agentMap = {
      director: { name: "The Director", icon: Users, color: "bg-purple-100 text-purple-700" },
      scripter: { name: "The Scripter", icon: MessageSquare, color: "bg-blue-100 text-blue-700" },
      "graphic-artist": { name: "The Graphic Artist", icon: Palette, color: "bg-green-100 text-green-700" },
      "data-visualizer": { name: "The Data Visualizer", icon: BarChart3, color: "bg-orange-100 text-orange-700" },
    }
    return agentMap[agent as keyof typeof agentMap] || agentMap.director
  }

  const simulateAgentWorkflow = async (userMessage: string) => {
    // Simulate Director analyzing the request
    setAgentStatuses((prev) =>
      prev.map((agent) =>
        agent.agent === "director"
          ? { ...agent, status: "thinking", task: "Analyzing your request...", progress: 25 }
          : agent,
      ),
    )

    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Director responds
    const directorResponse = `I understand you want to create a presentation about "${userMessage}". Let me coordinate with the team to build this for you.`
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "agent",
        content: directorResponse,
        timestamp: new Date(),
        agent: "director",
      },
    ])

    // Activate Scripter
    setAgentStatuses((prev) =>
      prev.map((agent) =>
        agent.agent === "director"
          ? { ...agent, status: "completed", task: "Request analyzed", progress: 100 }
          : agent.agent === "scripter"
            ? { ...agent, status: "working", task: "Writing slide content...", progress: 30 }
            : agent,
      ),
    )

    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate slides
    const newSlides: Slide[] = [
      {
        id: "1",
        title: "Introduction",
        content: `Welcome to our presentation on ${userMessage}. Today we'll explore key insights and actionable strategies.`,
        layout: "title",
        elements: [
          {
            id: "title-1",
            type: "title",
            content: "Introduction",
          },
          {
            id: "content-1",
            type: "content",
            content: `Welcome to our presentation on ${userMessage}. Today we'll explore key insights and actionable strategies.`,
          },
          {
            id: "placeholder-1",
            type: "placeholder",
            content: "",
          },
        ],
        narrativePurpose: "This opening slide establishes the context and sets expectations for the audience.",
        engagementHook: "Have you ever wondered how to make your presentations more impactful?",
        suggestedVisuals: [
          { type: "image", description: "Professional header image", purpose: "Set professional tone" },
          { type: "infographic", description: "Key statistics overview", purpose: "Grab attention with data" }
        ],
        speakingTime: "1 minute",
        contentDepth: "overview"
      },
      {
        id: "2",
        title: "Key Challenges",
        content: "Understanding the current landscape and identifying opportunities for improvement.",
        layout: "content",
        elements: [
          {
            id: "title-2",
            type: "title",
            content: "Key Challenges",
          },
          {
            id: "content-2",
            type: "content",
            content: "Understanding the current landscape and identifying opportunities for improvement.",
          },
          {
            id: "placeholder-2",
            type: "placeholder",
            content: "",
          },
        ],
        narrativePurpose: "This slide identifies pain points to create urgency and establish the need for change.",
        engagementHook: "What if these challenges are costing you more than you realize?",
        suggestedVisuals: [
          { type: "chart", description: "Problem impact statistics", purpose: "Visualize the scale of challenges" }
        ],
        speakingTime: "2 minutes",
        contentDepth: "detailed"
      },
      {
        id: "3",
        title: "Our Solution",
        content: "A comprehensive approach to addressing these challenges with proven methodologies.",
        layout: "two-column",
        elements: [
          {
            id: "title-3",
            type: "title",
            content: "Our Solution",
          },
          {
            id: "content-3",
            type: "content",
            content: "A comprehensive approach to addressing these challenges with proven methodologies.",
          },
          {
            id: "placeholder-3",
            type: "placeholder",
            content: "",
          },
        ],
        narrativePurpose: "Present the value proposition and demonstrate how we solve the identified problems.",
        engagementHook: "Here's how we transform challenges into opportunities for growth.",
        suggestedVisuals: [
          { type: "diagram", description: "Solution architecture", purpose: "Show how components work together" },
          { type: "infographic", description: "Before/after comparison", purpose: "Highlight transformation" }
        ],
        speakingTime: "3 minutes",
        contentDepth: "comprehensive"
      },
      {
        id: "4",
        title: "Next Steps",
        content: "Clear action items and timeline for implementation.",
        layout: "content",
        elements: [
          {
            id: "title-4",
            type: "title",
            content: "Next Steps",
          },
          {
            id: "content-4",
            type: "content",
            content: "Clear action items and timeline for implementation.",
          },
          {
            id: "placeholder-4",
            type: "placeholder",
            content: "",
          },
        ],
        narrativePurpose: "Drive the audience to take action with clear, achievable next steps.",
        engagementHook: "Ready to get started? Here's exactly what you need to do.",
        suggestedVisuals: [
          "Timeline graphic",
          { type: "image", description: "Call-to-action button", purpose: "Encourage immediate action" }
        ],
        speakingTime: "1 minute",
        contentDepth: "actionable"
      },
    ]

    setSlides(newSlides)

    // Scripter completes, Graphic Artist starts
    setAgentStatuses((prev) =>
      prev.map((agent) =>
        agent.agent === "scripter"
          ? { ...agent, status: "completed", task: "Content written", progress: 100 }
          : agent.agent === "graphic-artist"
            ? { ...agent, status: "working", task: "Designing visual elements...", progress: 40 }
            : agent,
      ),
    )

    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Graphic Artist completes
    setAgentStatuses((prev) =>
      prev.map((agent) =>
        agent.agent === "graphic-artist"
          ? { ...agent, status: "completed", task: "Visuals designed", progress: 100 }
          : agent,
      ),
    )

    // Final message from Director
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "agent",
        content: `Great! I've coordinated with the team to create your presentation. The Scripter has written the content and the Graphic Artist has designed the layout. You can now review the slides and ask for any modifications.`,
        timestamp: new Date(),
        agent: "director",
      },
    ])
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageContent = inputMessage
    setInputMessage("")
    setIsLoading(true)
    setIsWaitingForResponse(false) // User is responding

    try {
      if (FeatureFlags.useRealAPI() && wsService && wsService.isConnected()) {
        console.log('[Builder] Sending message via WebSocket:', messageContent)
        console.log('[Builder] Current conversation state:', conversationStateRef.current)
        console.log('[Builder] Has basic structure:', hasBasicStructureRef.current)
        
        // Check if this is an approval message for enhancement
        if (conversationStateRef.current === 'AWAITING_APPROVAL' && 
            messageContent.toLowerCase().includes('looks good')) {
          console.log('[Builder] User approved structure, triggering enhancement')
          // Update conversation state
          conversationStateRef.current = 'ENHANCING'
          awaitingEnhancementRef.current = false
        }
        
        wsService.sendChatMessage(messageContent)
        
        // Set a timeout to prevent hanging - check loading state properly
        const timeoutId = setTimeout(() => {
          console.warn('[Builder] Response timeout, stopping loading state')
          setIsLoading(false)
        }, 30000) // 30 second timeout
        
        // Store timeout ID to clear it if response comes
        ;(window as any).responseTimeout = timeoutId
      } else {
        console.log('[Builder] Using mock workflow')
        await simulateAgentWorkflow(messageContent)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('[Builder] Error sending message:', error)
      // Fallback to mock if real API fails
      await simulateAgentWorkflow(messageContent)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAttachmentUpload = (files: FileList) => {
    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: (file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "audio"
            : file.name.endsWith(".csv") || file.name.endsWith(".xlsx")
              ? "data"
              : "document") as "document" | "image" | "video" | "audio" | "data",
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedAt: new Date(),
      url: URL.createObjectURL(file),
    }))
    setAttachments((prev) => [...prev, ...newAttachments])
  }

  const handleProjectCreate = (project: any) => {
    const newProject = {
      ...project,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    }
    setProjects((prev) => [...prev, newProject])
  }

  const handleVersionRestore = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId)
    if (version) {
      // Create new version from restored content
      const newVersion = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Restored from ${version.name}`,
        createdAt: new Date(),
        slides: version.slides,
        description: `Restored from version: ${version.name}`,
      }
      setVersions((prev) => [newVersion, ...prev])
      setSlides(version.slides)
    }
    setShowVersions(false)
  }

  const handleVersionDelete = (versionId: string) => {
    setVersions((prev) => prev.filter((v) => v.id !== versionId))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartSplit(splitPosition)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const containerWidth = window.innerWidth
    const deltaX = e.clientX - dragStartX
    const deltaPercent = (deltaX / containerWidth) * 100
    const newSplit = Math.max(10, Math.min(90, dragStartSplit + deltaPercent))

    setSplitPosition(newSplit)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }
  }, [isDragging, dragStartX, dragStartSplit])

  const handlePresentationSelect = (presentation: Presentation) => {
    // Load the selected presentation
    console.log("Loading presentation:", presentation.title)
    setShowSidebar(false)
  }

  const handleNewPresentation = () => {
    // Reset to new presentation state
    setSlides([])
    setMessages([
      {
        id: "1",
        type: "agent",
        content:
          "Hello! I'm The Director, and I'll be orchestrating your presentation creation. What would you like to create today?",
        timestamp: new Date(),
        agent: "director",
      },
    ])
    setShowSidebar(false)
  }

  const handleElementUpdate = (elementId: string, updates: any) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id === slides[currentSlide]?.id) {
          return {
            ...slide,
            elements: slide.elements.map((element) =>
              element.id === elementId ? { ...element, ...updates } : element,
            ),
          }
        }
        return slide
      }),
    )
  }

  const handleElementDelete = (elementId: string) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id === slides[currentSlide]?.id) {
          return {
            ...slide,
            elements: slide.elements.filter((element) => element.id !== elementId),
          }
        }
        return slide
      }),
    )
    setSelectedElementId(null)
  }

  const handleCanvasClick = () => {
    setSelectedElementId(null)
  }

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <WebSocketErrorBoundary>
      <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => setShowSidebar(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold">deckster.xyz</span>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-slate-600">New Presentation</span>
          <Button variant="ghost" size="sm" onClick={() => setShowVersions(true)}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/api-test">
              <Zap className="mr-2 h-4 w-4" />
              API Test
            </Link>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Separator orientation="vertical" className="h-6" />
          {FeatureFlags.useRealAPI() && presentationId && (
            <>
              <ConnectionStatus 
                connectionState={connectionState} 
                onRetry={() => wsService?.connect()} 
              />
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <UserProfileMenu />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mission Control Chat - Left Pane */}
        <div
          className={`bg-white border-r flex flex-col transition-all duration-300 ${
            isCanvasFocused ? "w-0 min-w-0" : isChatFocused ? "w-full" : ""
          }`}
          style={{
            width: isCanvasFocused ? "0%" : isChatFocused ? "100%" : `${splitPosition}%`,
          }}
        >
          {!isCanvasFocused && (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Mission Control</h2>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsChatFocused(!isChatFocused)}>
                      {isChatFocused ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Chat with The Director to guide your presentation creation
                </p>
              </div>

              {/* Agent Status */}
              <div className="p-3 border-b bg-slate-50">
                <h3 className="text-sm font-medium mb-2">Agent Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {agentStatuses.map((agent) => {
                    const agentInfo = getAgentInfo(agent.agent)
                    const Icon = agentInfo.icon
                    return (
                      <div key={agent.agent} className="flex items-center space-x-2 p-2 rounded-lg bg-white border">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${agentInfo.color}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">{agentInfo.name.replace("The ", "")}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 py-0 h-4 ${
                                agent.status === "working"
                                  ? "border-blue-200 text-blue-700"
                                  : agent.status === "completed"
                                    ? "border-green-200 text-green-700"
                                    : "border-slate-200 text-slate-600"
                              }`}
                            >
                              {agent.status}
                            </Badge>
                          </div>
                          {agent.status === "working" && <Progress value={agent.progress} className="h-1 mt-1" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Attachment Panel */}
              <div className="border-b">
                <AttachmentPanel
                  attachments={attachments}
                  internetSearchEnabled={internetSearchEnabled}
                  onAttachmentUpload={handleAttachmentUpload}
                  onInternetSearchToggle={setInternetSearchEnabled}
                  onAttachmentRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                />
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4 min-h-0">
                <div className="space-y-4 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] ${message.type === "user" ? "order-2" : "order-1"}`}>
                        {message.type === "agent" && message.agent && (
                          <div className="flex items-center space-x-2 mb-1">
                            {(() => {
                              const agentInfo = getAgentInfo(message.agent)
                              const Icon = agentInfo.icon
                              return (
                                <>
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${agentInfo.color}`}
                                  >
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  <span className="text-xs font-medium">{agentInfo.name}</span>
                                </>
                              )
                            })()}
                          </div>
                        )}
                        <div
                          className={`rounded-lg p-3 ${
                            message.type === "user" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Waiting Indicator */}
                  <WaitingIndicator 
                    show={isWaitingForResponse && !isLoading} 
                    lastMessage={messages.filter(m => m.type === 'agent').pop()?.content}
                  />
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <EnhancedChatInput
                inputMessage={inputMessage}
                onInputChange={setInputMessage}
                onSendMessage={handleSendMessage}
                onKeyPress={handleKeyPress}
                onFileUpload={handleAttachmentUpload}
                internetSearchEnabled={internetSearchEnabled}
                onInternetSearchToggle={setInternetSearchEnabled}
                isLoading={isLoading}
                attachmentCount={attachments.length}
              />
            </>
          )}
        </div>

        {/* Draggable Divider */}
        {!isCanvasFocused && !isChatFocused && (
          <div
            className="w-1 bg-slate-200 hover:bg-slate-300 cursor-col-resize flex-shrink-0 relative group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-slate-300/50" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Living Canvas - Right Pane */}
        <div
          className={`bg-slate-100 flex flex-col transition-all duration-300 relative ${
            isChatFocused ? "w-0 min-w-0" : isCanvasFocused ? "w-full" : ""
          }`}
          style={{
            width: isChatFocused ? "0%" : isCanvasFocused ? "100%" : `${100 - splitPosition}%`,
          }}
        >
          {!isChatFocused && (
            <>
              {/* Canvas Header */}
              <div className="bg-white p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="font-semibold">Living Canvas</h2>
                </div>
                <div className="flex items-center space-x-2">
                  {slides.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNavPinned(!isNavPinned)}
                      className="flex items-center space-x-1"
                    >
                      <span>{slides.length} slides</span>
                      <ChevronLeft
                        className={`h-4 w-4 transition-transform ${isNavPinned ? "rotate-0" : "rotate-180"}`}
                      />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setIsCanvasFocused(!isCanvasFocused)}>
                    {isCanvasFocused ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Slide Content */}
              <div className="flex-1 p-8 overflow-auto">
                {slides.length > 0 ? (
                  <Card
                    className={`w-full aspect-[16/9] shadow-lg ${isNavPinned ? "mr-44 ml-4" : "mx-auto"}`}
                    style={{
                      maxWidth: isNavPinned ? "calc(100% - 12rem)" : "100%",
                    }}
                  >
                    <CardContent className="p-0 h-full" onClick={handleCanvasClick}>
                      <SlideDisplay
                        slide={slides[currentSlide]}
                        slideNumber={currentSlide + 1}
                        onElementUpdate={handleElementUpdate}
                        onElementDelete={handleElementDelete}
                        selectedElementId={selectedElementId}
                        onElementSelect={setSelectedElementId}
                        showMetaContent={true}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4">
                    <Sparkles className="h-8 w-8 text-slate-400" />
                    <h3 className="text-lg font-semibold">No slides yet</h3>
                    <p className="text-slate-600 max-w-sm">
                      Start by describing your presentation in Mission Control, and the AI team will generate slides for
                      you.
                    </p>
                  </div>
                )}
              </div>

              {/* Slide Navigation - Vertical Panel on Right */}
              {slides.length > 0 && (
                <>
                  <aside
                    className={`absolute top-16 right-0 h-[calc(100%-4rem)] w-40 bg-white border-l shadow-lg transition-transform duration-300 z-20 ${
                      isNavPinned ? "translate-x-0" : "translate-x-full"
                    }`}
                  >
                    <div className="p-3 border-b flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Slide {currentSlide + 1} of {slides.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsNavPinned(false)}
                        aria-label="Unpin slide navigator"
                      >
                        <PinOff className="h-4 w-4" />
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 p-3">
                      <div className="space-y-2">
                        {slides.map((slide, index) => (
                          <div
                            key={slide.id}
                            onClick={() => setCurrentSlide(index)}
                            className={`cursor-pointer border rounded-lg p-2 transition-colors ${
                              index === currentSlide
                                ? "border-purple-500 bg-purple-50"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              <span className="font-semibold text-xs w-4 text-center flex-shrink-0 text-slate-600">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-medium line-clamp-1" title={slide.title}>
                                  {slide.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2" title={slide.content}>
                                  {slide.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button variant="outline" className="w-full mt-2" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Slide
                        </Button>
                      </div>
                    </ScrollArea>

                    <div className="p-3 border-t">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                          disabled={currentSlide === 0}
                          className="flex-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                          disabled={currentSlide === slides.length - 1}
                          className="flex-1"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </aside>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <EnhancedProjectSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        projects={projects}
        presentations={presentations}
        currentProject={currentProject}
        onProjectSelect={setCurrentProject}
        onProjectCreate={handleProjectCreate}
        onPresentationSelect={handlePresentationSelect}
        onNewPresentation={handleNewPresentation}
        user={user}
      />

      <SettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} />

      <ShareDialog isOpen={showShare} onClose={() => setShowShare(false)} presentationTitle="Untitled Presentation" />

      <VersionHistory
        isOpen={showVersions}
        onClose={() => setShowVersions(false)}
        versions={versions}
        currentVersion="v3"
        onVersionRestore={handleVersionRestore}
        onVersionDelete={handleVersionDelete}
      />
      
      </div>
    </WebSocketErrorBoundary>
  )
}
