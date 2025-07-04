import { StrawmanStructure, StrawmanSlide, VisualSuggestion } from './types/vibe-decker-api'
import { logStructure, validateSlide } from './debug-utils'

// Import existing slide interfaces
interface Slide {
  id: string
  title: string
  content: string
  layout: "title" | "content" | "two-column" | "image-focus"
  elements: SlideElement[]
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

interface SlideElement {
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
}

export class DataTransformer {
  /**
   * Converts API strawman structure to frontend slide format
   */
  static strawmanToSlides(strawman: StrawmanStructure): Slide[] {
    if (!strawman.slides || !Array.isArray(strawman.slides)) {
      console.warn('[DataTransformer] Invalid strawman structure:', strawman)
      return []
    }

    return strawman.slides.map((strawmanSlide, index) => {
      const slide: Slide = {
        id: `slide-${strawmanSlide.id}`,
        title: strawmanSlide.title,
        content: strawmanSlide.description,
        layout: this.determineLayout(strawmanSlide, index),
        elements: this.generateElements(strawmanSlide),
        // Preserve meta-content as separate fields
        narrativePurpose: strawmanSlide.narrative_purpose,
        engagementHook: strawmanSlide.engagement_hook,
        suggestedVisuals: this.normalizeVisualSuggestions(strawmanSlide.suggested_visuals),
        speakingTime: '2 minutes', // Default value, can be calculated based on content
        contentDepth: 'overview' // Default value, can be determined by content analysis
      }

      return slide
    })
  }

  /**
   * Determines appropriate layout based on slide content and position
   */
  private static determineLayout(slide: StrawmanSlide, index: number): Slide['layout'] {
    // First slide is usually a title slide
    if (index === 0 || slide.slide_type === 'title_slide') {
      return 'title'
    }

    // Check for visual suggestions to determine layout
    if (slide.suggested_visuals && slide.suggested_visuals.length > 0) {
      const hasMultipleVisuals = slide.suggested_visuals.length > 1
      const hasImageSuggestion = slide.suggested_visuals.some(visual => 
        typeof visual === 'object' && visual.type === 'image' ||
        typeof visual === 'string' && visual.toLowerCase().includes('image')
      )

      if (hasMultipleVisuals) {
        return 'two-column'
      }
      
      if (hasImageSuggestion) {
        return 'image-focus'
      }
    }

    // Default to content layout
    return 'content'
  }

  /**
   * Generates slide elements from strawman slide data
   * Note: Title and content are now handled directly in SlideDisplay component
   * This method now generates only additional elements if needed
   */
  private static generateElements(slide: StrawmanSlide): SlideElement[] {
    const elements: SlideElement[] = []

    // We no longer generate title and content elements here since they're 
    // handled directly in the SlideDisplay component for better layout control
    
    // Only add additional elements if there are any (for future extensibility)
    // Visual suggestions are now handled in the meta-content section

    return elements
  }

  /**
   * Normalizes visual suggestions to consistent format
   */
  private static normalizeVisualSuggestions(suggestions?: (VisualSuggestion | string)[]): Array<{
    type: 'image' | 'infographic' | 'chart' | 'video' | 'diagram'
    description: string
    purpose: string
  } | string> | undefined {
    if (!suggestions || suggestions.length === 0) {
      return undefined
    }

    return suggestions.map(suggestion => {
      if (typeof suggestion === 'string') {
        return suggestion
      }
      return {
        type: suggestion.type,
        description: suggestion.description,
        purpose: suggestion.purpose
      }
    })
  }


  /**
   * Extracts meta-content for separate display
   */
  static extractMetaContent(strawman: StrawmanStructure) {
    return {
      title: strawman.title,
      duration: strawman.estimated_duration,
      audience: strawman.target_audience,
      goal: strawman.presentation_goal,
      slideCount: strawman.total_slides,
      slides: strawman.slides.map(slide => ({
        id: slide.id,
        title: slide.title,
        narrativePurpose: slide.narrative_purpose,
        engagementHook: slide.engagement_hook,
        visualSuggestions: slide.suggested_visuals,
        speakerNotes: slide.speaker_notes_outline
      }))
    }
  }

  /**
   * Validates strawman structure
   */
  static validateStrawmanStructure(data: any): data is StrawmanStructure {
    logStructure(data, 'Incoming Structure for Validation')
    
    if (!data || typeof data !== 'object') {
      console.warn('[DataTransformer] Data is not an object:', typeof data)
      return false
    }

    const required = ['title', 'slides']
    for (const field of required) {
      if (!(field in data)) {
        console.warn(`[DataTransformer] Missing required field: ${field}`)
        return false
      }
    }

    if (!Array.isArray(data.slides)) {
      console.warn('[DataTransformer] Slides must be an array, got:', typeof data.slides)
      return false
    }

    if (data.slides.length === 0) {
      console.warn('[DataTransformer] Slides array is empty')
      return false
    }

    // Validate each slide
    for (let i = 0; i < data.slides.length; i++) {
      const slide = data.slides[i]
      if (!validateSlide(slide, i)) {
        console.warn(`[DataTransformer] Invalid slide structure at index ${i}:`, slide)
        return false
      }
    }

    console.log(`[DataTransformer] Structure valid with ${data.slides.length} slides`)
    return true
  }

  /**
   * Creates a sample strawman for testing
   */
  static createSampleStrawman(): StrawmanStructure {
    return {
      title: "Sample Presentation",
      total_slides: 4,
      estimated_duration: "20 minutes",
      target_audience: "General audience",
      presentation_goal: "Education",
      slides: [
        {
          id: 1,
          title: "Welcome",
          description: "Introduction to our topic",
          narrative_purpose: "Set the stage and establish credibility",
          engagement_hook: "Did you know that 90% of startups fail?",
          suggested_visuals: ["welcome graphic", "company logo"]
        },
        {
          id: 2,
          title: "The Problem",
          description: "Current challenges in the market",
          narrative_purpose: "Create urgency and pain point awareness",
          engagement_hook: "What if I told you there's a solution?",
          suggested_visuals: [
            {
              type: "chart",
              description: "Problem statistics",
              purpose: "Show scale of issue"
            }
          ]
        },
        {
          id: 3,
          title: "Our Solution",
          description: "How we address these challenges",
          narrative_purpose: "Present the value proposition",
          engagement_hook: "Here's how we're changing the game",
          suggested_visuals: ["solution diagram", "before/after comparison"]
        },
        {
          id: 4,
          title: "Next Steps",
          description: "Call to action and follow-up",
          narrative_purpose: "Drive audience to action",
          engagement_hook: "Ready to get started?",
          suggested_visuals: ["contact information", "QR code"]
        }
      ]
    }
  }
}