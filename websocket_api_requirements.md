# WebSocket API Requirements for Vibe Deck Frontend

## Overview

This document outlines the specific requirements for the backend WebSocket API to seamlessly integrate with the Vibe Deck frontend. The frontend is built with Next.js 15.2.4 and React 19, featuring a dual-pane interface for AI-powered presentation generation with real-time updates.

## Current Implementation Analysis

### Existing WebSocket Flow

The frontend currently expects:

1. **Initial REST API Call**
   ```
   POST /api/v1/presentations/generate
   Body: {
     topic: string,
     key_points: string[],
     slide_count: number (3-20),
     style: "professional" | "modern" | "minimalist" | "creative"
   }
   Response: {
     websocket_url: string (e.g., "/ws/slides/{connectionId}")
   }
   ```

2. **WebSocket Connection**
   - URL: `wss://[domain]/ws/slides/{connectionId}`
   - Keep-alive: Client sends "ping" every 30 seconds, expects "pong" response

### Current Message Types

The frontend handles these message types:

```typescript
{
  type: "connected" | "status" | "progress" | "complete" | "error" | "pong",
  status?: string,
  progress?: number (0-100),
  message?: string,
  error?: string,
  presentation?: PresentationData (on complete)
}
```

### Expected Data Structure (Complete Presentation)

```typescript
interface PresentationData {
  presentation_id: string
  presentation: {
    title: string
    slides: Array<{
      order: number
      title: string
      type: string
      content: Array<{
        type: "text" | "bullet"
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
    overall_score: number (0-1)
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
```

## Future Conversational Flow Requirements

### Phase-Based Workflow

The backend needs to support a 4-phase conversational workflow:

#### Phase 1: Discovery & Clarification
**Duration**: 2-3 minutes  
**Purpose**: Understand user needs through clarifying questions

**Message Flow**:
```typescript
// Backend → Frontend
{
  type: "clarifying_questions",
  phase: 1,
  questions: [
    {
      id: number,
      question: string,
      options?: string[], // For multiple choice
      type?: "multiple_choice" | "open_text"
    }
  ]
}

// Frontend → Backend
{
  type: "user_answers",
  phase: 1,
  answers: {
    [questionId: number]: string
  }
}
```

#### Phase 2: Story & Structure
**Duration**: 1-2 minutes  
**Purpose**: Present and refine presentation structure

**Message Flow**:
```typescript
// Backend → Frontend
{
  type: "structure_proposal",
  phase: 2,
  storyline: {
    narrative_arc: string,
    total_slides: number,
    sections: [
      {
        section: string,
        slides: [
          {
            number: number,
            title: string,
            purpose: string,
            visual_concept: string
          }
        ]
      }
    ]
  },
  editable: boolean,
  actions: ["approve", "modify", "regenerate"]
}

// Frontend → Backend
{
  type: "structure_feedback",
  phase: 2,
  action: "approve" | "modify" | "regenerate",
  modifications?: {
    // Specific changes requested
  }
}
```

#### Phase 3: Visual Layout & Placeholders
**Duration**: 2-3 minutes  
**Purpose**: Show HTML/CSS layouts with visual placeholders

**Message Flow**:
```typescript
// Backend → Frontend
{
  type: "layout_preview",
  phase: 3,
  slide_id: number,
  layout_html: string, // Full HTML with inline CSS
  placeholders: {
    images: string[], // Descriptions
    charts: string[], // Descriptions
    data: string[] // Data points needed
  }
}

// Frontend → Backend
{
  type: "layout_feedback",
  phase: 3,
  slide_id: number,
  action: "approve" | "modify",
  modifications?: {
    // Layout change requests
  }
}
```

#### Phase 4: Content Generation & Quality
**Duration**: 3-5 minutes  
**Purpose**: Generate final content with quality validation

**Message Flow**:
```typescript
// Backend → Frontend
{
  type: "content_delivery",
  phase: 4,
  slide_id: number,
  content_html: string, // Complete HTML content
  quality_score: number,
  quality_feedback: {
    strengths: string[],
    suggestions: string[]
  },
  editable: boolean
}

// Frontend → Backend
{
  type: "content_edit",
  phase: 4,
  slide_id: number,
  edited_content: string
}
```

### Phase Advancement

```typescript
// Backend → Frontend
{
  type: "phase_advance",
  from_phase: number,
  to_phase: number,
  message: string
}
```

## Multi-Agent Visualization Requirements

The frontend displays four AI agents working collaboratively:

### Agent Status Updates

```typescript
{
  type: "agent_status",
  agent: "director" | "scripter" | "graphic_artist" | "data_visualizer",
  status: "idle" | "thinking" | "working" | "completed",
  current_task?: string,
  progress?: number,
  thought_process?: string // For chain of thought display
}
```

### Agent Collaboration Messages

```typescript
{
  type: "agent_message",
  from_agent: string,
  to_agent?: string, // If inter-agent communication
  message: string,
  timestamp: string
}
```

## Enhanced Requirements for Frontend Features

### 1. Real-time Slide Editing

The frontend supports inline editing of slides. Backend needs to handle:

```typescript
// Frontend → Backend
{
  type: "slide_update",
  slide_id: number,
  updates: {
    content?: string,
    speaker_notes?: string,
    visual_description?: string
  }
}

// Backend → Frontend (acknowledgment)
{
  type: "slide_update_ack",
  slide_id: number,
  success: boolean,
  updated_slide?: SlideData
}
```

### 2. Presentation Regeneration

```typescript
// Frontend → Backend
{
  type: "regenerate_slide",
  slide_id: number,
  instructions?: string
}

// Frontend → Backend
{
  type: "regenerate_all",
  keep_structure: boolean,
  new_instructions?: string
}
```

### 3. File Attachments

Frontend supports file uploads for context:

```typescript
// Frontend → Backend
{
  type: "file_context",
  files: [
    {
      name: string,
      type: string,
      content: string, // Base64 or text
      size: number
    }
  ]
}
```

### 4. Internet Search Toggle

```typescript
// Frontend → Backend
{
  type: "settings_update",
  internet_search_enabled: boolean
}
```

## Connection Management Requirements

### 1. Connection Lifecycle

- **Connection ID**: Unique identifier for each session
- **Timeout**: 10 minutes of inactivity
- **Reconnection**: Support reconnection with same ID within 5 minutes
- **Keep-alive**: Ping/pong every 30 seconds

### 2. Error Handling

```typescript
{
  type: "error",
  code: string,
  message: string,
  recoverable: boolean,
  suggested_action?: string
}
```

Error codes needed:
- `CONNECTION_TIMEOUT`
- `INVALID_MESSAGE`
- `RATE_LIMITED`
- `GENERATION_FAILED`
- `INVALID_PHASE`
- `SESSION_EXPIRED`

### 3. Progress Tracking

Granular progress updates for better UX:

```typescript
{
  type: "progress",
  phase: number,
  step: string,
  progress: number,
  estimated_time_remaining?: number, // seconds
  details?: {
    current_slide?: number,
    total_slides?: number,
    current_agent?: string
  }
}
```

## HTML Slide Format Requirements

Slides should be delivered as self-contained HTML with inline CSS:

```html
<div class="slide-container" data-slide-id="1" style="width:1920px;height:1080px;">
  <style>
    .slide-container { /* Slide-specific styles */ }
    .slide-title { font-size: 72px; /* ... */ }
    /* All styles inline for isolation */
  </style>
  
  <h1 class="slide-title">[Title]</h1>
  <div class="content-grid">
    <!-- Content blocks -->
  </div>
  
  <!-- Placeholders for dynamic content -->
  <div class="image-placeholder" data-description="[description]">
    [IMAGE: Description of needed image]
  </div>
  
  <div class="chart-placeholder" data-type="bar" data-description="[description]">
    [CHART: Description of data visualization]
  </div>
</div>
```

### Placeholder Types

1. **Images**: `[IMAGE: description]`
2. **Charts**: `[CHART: type and data description]`
3. **Icons**: `[ICON: icon name or description]`
4. **Data**: `[DATA: $X or specific metric]`
5. **Videos**: `[VIDEO: description or URL]`

## Performance Requirements

1. **Initial Response**: < 2 seconds after connection
2. **Phase Transitions**: < 1 second
3. **Message Delivery**: < 500ms
4. **Total Generation Time**: < 5 minutes for 10 slides
5. **Concurrent Connections**: Support at least 100 simultaneous sessions

## Security Requirements

1. **Authentication**: JWT or session token in connection params
2. **Rate Limiting**: Max 5 presentations per user per hour
3. **Input Validation**: Sanitize all user inputs
4. **Content Filtering**: Block inappropriate content
5. **CORS**: Properly configured for frontend domain

## Backward Compatibility

The new conversational flow should maintain backward compatibility:

1. Support existing single-shot generation via a "quick mode" flag
2. Current message types remain valid
3. Existing data structures are extended, not replaced
4. Frontend can detect backend capabilities via initial handshake

## Testing Requirements

Backend should provide:

1. **Test Mode**: Generate faster with mock data
2. **Debug Messages**: Optional verbose logging
3. **Simulation Mode**: Replay recorded sessions
4. **Error Injection**: Test error handling

## Summary

The backend WebSocket API needs to evolve from a simple request-response model to a sophisticated conversational system while maintaining backward compatibility. Key additions include:

1. Phase-based conversation management
2. Multiple message types for each phase
3. HTML/CSS slide generation with placeholders
4. Multi-agent status visualization
5. Real-time editing capabilities
6. Enhanced progress tracking
7. Robust error handling and recovery

This will enable the frontend to provide an engaging, interactive experience for AI-powered presentation creation.