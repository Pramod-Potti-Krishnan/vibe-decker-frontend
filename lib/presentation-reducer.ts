import { PresentationState, PresentationAction } from '@/contexts/presentation-context';
import { DirectorMessage, ChatData } from '@/lib/types/websocket-types';
import { 
  isStructureMessage, 
  isProgressUpdate,
  PresentationPhase,
  AgentStatus
} from '@/lib/types/director-messages';

// Round 21: Backend-approved helper function for content format compatibility
const processChatContent = (content: any) => {
  // Handle edge cases
  if (!content) {
    console.warn('[Round 21 Backend Coordination] Received null/undefined content, using empty message');
    return {
      message: '',
      context: null,
      options: null,
      question_id: null
    };
  }
  
  // Handle both string and object formats as approved by backend team
  if (typeof content === 'string') {
    return {
      message: content,
      context: null,
      options: null,
      question_id: null
    };
  }
  
  // Already object format - ensure it has required properties
  return {
    message: content.message || '',
    context: content.context || null,
    options: content.options || null,
    question_id: content.question_id || null
  };
};

// Helper functions for processing director messages
export function processDirectorMessage(
  state: PresentationState,
  message: DirectorMessage
): Partial<PresentationState> {
  const updates: Partial<PresentationState> = {};
  // Round 14 fix: chat_data and slide_data are directly on the message, not wrapped in 'data'

  // Process slide data
  if (message.slide_data) {
    updates.slides = message.slide_data.slides;
    updates.presentationMetadata = message.slide_data.presentation_metadata;
  }

  // Process chat data
  if (message.chat_data) {
    updates.chatMessages = [...state.chatMessages, message.chat_data];

    // Handle progress updates
    if (message.chat_data.progress) {
      updates.progress = message.chat_data.progress;
      
      // Extract agent statuses from progress
      if (message.chat_data.progress.agentStatuses) {
        updates.agentStatuses = message.chat_data.progress.agentStatuses;
      }
    }

    // Handle phase changes
    if (message.chat_data.type === 'progress' && message.chat_data.content.message.includes('Phase')) {
      updates.phase = extractPhaseFromMessage(message.chat_data.content.message);
    }
  }

  return updates;
}

// Extract phase information from message content
function extractPhaseFromMessage(message: string): PresentationPhase | null {
  const phaseMap: Record<string, PresentationPhase['current']> = {
    'gathering requirements': 'gathering_requirements',
    'creating structure': 'creating_structure',
    'awaiting approval': 'awaiting_approval',
    'enhancing': 'enhancing',
    'complete': 'complete'
  };

  const lowerMessage = message.toLowerCase();
  
  for (const [key, value] of Object.entries(phaseMap)) {
    if (lowerMessage.includes(key)) {
      return {
        current: value,
        progress: extractProgressPercentage(message)
      };
    }
  }

  return null;
}

// Extract progress percentage from message
function extractProgressPercentage(message: string): number {
  const match = message.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) : 0;
}

// Create action creators for common operations
export const presentationActions = {
  // Session management
  setSession: (sessionId: string, presentationId?: string): PresentationAction => ({
    type: 'SET_SESSION',
    payload: { sessionId, presentationId }
  }),

  // Message handling
  processDirectorMessage: (message: DirectorMessage): PresentationAction[] => {
    const actions: PresentationAction[] = [
      { type: 'ADD_DIRECTOR_MESSAGE', payload: message }
    ];

    // Round 14 fix: chat_data and slide_data are directly on the message, not wrapped in 'data'
    // Process slide updates
    if (message.slide_data) {
      actions.push({
        type: 'UPDATE_SLIDES',
        payload: {
          slides: message.slide_data.slides,
          metadata: message.slide_data.presentation_metadata
        }
      });
    }

    // Process chat data
    if (message.chat_data) {
      // Round 21 Phase 1.1: Backend-approved compatibility layer for string/object content
      const processedContent = processChatContent(message.chat_data.content);
      const processedChatData = {
        ...message.chat_data,
        content: processedContent
      };
      
      // Round 21 Phase 1.2: Enhanced logging requested by backend team
      console.log('[Round 21 Backend Coordination] Message received:', {
        contentType: typeof message.chat_data.content,
        contentFormat: typeof message.chat_data.content === 'string' ? 'string' : 'object',
        hasMessage: typeof message.chat_data.content === 'object' ? 
          !!message.chat_data.content?.message : 'N/A',
        messageLength: typeof message.chat_data.content === 'string' ? 
          message.chat_data.content.length : 
          message.chat_data.content?.message?.length || 0,
        convertedContent: processedContent,
        messageType: message.chat_data.type
      });
      
      actions.push({
        type: 'ADD_CHAT_MESSAGE',
        payload: processedChatData
      });

      // Process progress
      if (message.chat_data.progress) {
        actions.push({
          type: 'UPDATE_PROGRESS',
          payload: message.chat_data.progress
        });
      }
    }

    return actions;
  },

  // Slide operations
  updateSlide: (slideId: string, updates: any): PresentationAction => ({
    type: 'UPDATE_SLIDE',
    payload: { slideId, updates }
  }),

  selectSlide: (slideId: string | null): PresentationAction => ({
    type: 'SELECT_SLIDE',
    payload: slideId
  }),

  editSlide: (slideId: string | null): PresentationAction => ({
    type: 'EDIT_SLIDE',
    payload: slideId
  }),

  navigateToSlide: (index: number): PresentationAction => ({
    type: 'SET_CURRENT_SLIDE',
    payload: index
  }),

  // State management
  setProcessing: (isProcessing: boolean): PresentationAction => ({
    type: 'SET_PROCESSING',
    payload: isProcessing
  }),

  setError: (error: string | null): PresentationAction => ({
    type: 'SET_ERROR',
    payload: error
  }),

  markDirty: (): PresentationAction => ({
    type: 'SET_DIRTY',
    payload: true
  }),

  markClean: (): PresentationAction => ({
    type: 'SET_DIRTY',
    payload: false
  }),

  reset: (): PresentationAction => ({
    type: 'RESET_STATE'
  })
};

// Middleware for persisting state
export function createPresentationMiddleware() {
  return (dispatch: React.Dispatch<PresentationAction>) => {
    return (action: PresentationAction) => {
      // Pre-process actions if needed
      switch (action.type) {
        case 'UPDATE_SLIDES':
          // Auto-save to localStorage
          if (typeof window !== 'undefined') {
            const saveData = {
              slides: action.payload.slides,
              metadata: action.payload.metadata,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem('presentation_autosave', JSON.stringify(saveData));
          }
          break;
      }

      // Dispatch the action
      dispatch(action);

      // Post-process actions if needed
      switch (action.type) {
        case 'SET_SESSION':
          // Initialize WebSocket connection if needed
          break;
      }
    };
  };
}

// Selectors for computed state
export const presentationSelectors = {
  // Get slide by ID
  getSlideById: (state: PresentationState, slideId: string) => 
    state.slides.find(slide => slide.slide_id === slideId),

  // Get total duration
  getTotalDuration: (state: PresentationState) => 
    state.presentationMetadata?.estimated_duration_minutes || 0,

  // Check if presentation is ready
  isPresentationReady: (state: PresentationState) => 
    state.slides.length > 0 && state.presentationMetadata !== null,

  // Get current phase percentage
  getPhaseProgress: (state: PresentationState) => 
    state.phase?.progress || state.progress?.percentage || 0,

  // Get active agents
  getActiveAgents: (state: PresentationState) => 
    state.agentStatuses.filter(agent => agent.status === 'working'),

  // Check if any agent is working
  isAnyAgentWorking: (state: PresentationState) => 
    state.agentStatuses.some(agent => agent.status === 'working'),

  // Get last chat message
  getLastChatMessage: (state: PresentationState) => 
    state.chatMessages[state.chatMessages.length - 1] || null,

  // Check if waiting for user input
  isWaitingForInput: (state: PresentationState) => {
    const lastMessage = state.chatMessages[state.chatMessages.length - 1];
    return lastMessage?.type === 'question' || lastMessage?.type === 'action_required';
  }
};