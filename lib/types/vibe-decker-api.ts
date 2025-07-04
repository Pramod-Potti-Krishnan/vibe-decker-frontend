// Legacy TypeScript interfaces for Vibe Decker API integration
// This file is maintained for backward compatibility
// New code should use websocket-types.ts and director-messages.ts

export interface StrawmanStructure {
  title: string
  total_slides: number
  estimated_duration: string
  target_audience: string
  presentation_goal: string
  slides: StrawmanSlide[]
}

export interface StrawmanSlide {
  id: number
  title: string
  description: string
  narrative_purpose?: string
  engagement_hook?: string
  suggested_visuals?: (VisualSuggestion | string)[]
  speaker_notes_outline?: string[]
  slide_type?: string
}

export interface VisualSuggestion {
  type: 'image' | 'infographic' | 'chart' | 'video' | 'diagram'
  description: string
  purpose: string
}

export interface ServerMessage {
  type: 'connected' | 'assistant_message' | 'status' | 'structure_generated' | 'error'
  content?: string
  status?: string
  message?: string
  phase?: number
  structure?: StrawmanStructure
  presentation_id?: string
  timestamp?: string
  capabilities?: string[]
  current_phase?: number
  workflow_mode?: string
  has_memory?: boolean
  artifacts_generated?: {
    structure: boolean
    layout: boolean
    content: boolean
    structure_data: any
    content_data: any
  }
}

export interface ClientMessage {
  command_type?: string
  command?: string
  context?: {
    topic?: string
    chat_mode?: boolean
  }
  type?: 'chat_message'
  content?: string
}

export interface AgentActivity {
  agent: 'director' | 'scripter' | 'graphic-artist' | 'data-visualizer'
  status: 'idle' | 'thinking' | 'working' | 'completed'
  message: string
  progress?: number
}

export interface WebSocketConfig {
  url: string
  reconnectAttempts: number
  reconnectDelay: number
  heartbeatInterval: number
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastError?: string
  reconnectAttempts: number
  capabilities?: string[]
}

// Re-export new types for migration
export * from './websocket-types'
export * from './director-messages'

// Migration helpers to convert between old and new message formats
export function convertLegacyToNewMessage(legacy: ClientMessage): import('./websocket-types').UserInputMessage {
  return {
    message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    session_id: '',
    type: 'user_input',
    data: {
      text: legacy.content || legacy.command || '',
      response_to: null,
      attachments: [],
      ui_references: [],
      frontend_actions: []
    }
  }
}

export function convertNewToLegacyMessage(message: import('./websocket-types').DirectorMessage): ServerMessage {
  const { data } = message
  
  if (data.chat_data?.type === 'question') {
    return {
      type: 'assistant_message',
      content: data.chat_data.content.message,
      timestamp: message.timestamp
    }
  }
  
  if (data.slide_data) {
    return {
      type: 'structure_generated',
      structure: {
        title: data.slide_data.presentation_metadata.title,
        total_slides: data.slide_data.presentation_metadata.total_slides,
        estimated_duration: `${data.slide_data.presentation_metadata.estimated_duration_minutes} minutes`,
        target_audience: '',
        presentation_goal: data.slide_data.presentation_metadata.description || '',
        slides: data.slide_data.slides.map((slide, index) => ({
          id: index + 1,
          title: slide.title,
          description: slide.speaker_notes || '',
          narrative_purpose: slide.narrative_purpose,
          engagement_hook: slide.engagement_hook,
          suggested_visuals: slide.visual_suggestions,
          speaker_notes_outline: slide.speaker_notes?.split('\n') || [],
          slide_type: 'content'
        }))
      },
      timestamp: message.timestamp
    }
  }
  
  return {
    type: 'assistant_message',
    content: JSON.stringify(data),
    timestamp: message.timestamp
  }
}