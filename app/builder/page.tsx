"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    type: "title" | "content" | "image" | "placeholder"
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
  const [user, setUser] = useState<any>(null)
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

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/auth/signin")
      return
    }
    setUser(JSON.parse(userData))

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
    setInputMessage("")
    setIsLoading(true)

    await simulateAgentWorkflow(inputMessage)
    setIsLoading(false)
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

  if (!user) return null

  return (
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
            <span className="font-semibold">Agentic Deck Builder</span>
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
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
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
                    <CardContent className="p-8 h-full flex flex-col" onClick={handleCanvasClick}>
                      <div className="flex-1 space-y-6">
                        {slides[currentSlide]?.elements.map((element) => (
                          <SlideElement
                            key={element.id}
                            element={element}
                            onUpdate={handleElementUpdate}
                            onDelete={handleElementDelete}
                            isSelected={selectedElementId === element.id}
                            onSelect={() => setSelectedElementId(element.id)}
                          />
                        ))}
                      </div>
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

      <ShareDialog isOpen={showShare} onClose={() => setShowShare(false)} />

      <VersionHistory
        isOpen={showVersions}
        onClose={() => setShowVersions(false)}
        versions={versions}
        onVersionRestore={handleVersionRestore}
        onVersionDelete={handleVersionDelete}
      />
    </div>
  )
}
