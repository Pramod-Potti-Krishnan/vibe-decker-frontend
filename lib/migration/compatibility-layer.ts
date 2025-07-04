import { 
  ServerMessage as LegacyServerMessage,
  ClientMessage as LegacyClientMessage,
  StrawmanStructure,
  AgentActivity
} from '@/lib/types/vibe-decker-api';
import {
  DirectorMessage,
  UserInputMessage,
  SlideData,
  ChatData,
  Slide
} from '@/lib/types/websocket-types';
import { PresentationStructure } from '@/lib/types/director-messages';

/**
 * Compatibility layer for migrating from old to new WebSocket message formats
 */
export class MessageCompatibilityLayer {
  /**
   * Convert legacy client message to new format
   */
  static convertClientMessage(legacy: LegacyClientMessage): UserInputMessage {
    return {
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      session_id: '', // Will be filled by WebSocket client
      type: 'user_input',
      data: {
        text: legacy.content || legacy.command || '',
        response_to: null,
        attachments: [],
        ui_references: [],
        frontend_actions: []
      }
    };
  }

  /**
   * Convert new director message to legacy format
   */
  static convertDirectorMessage(message: DirectorMessage): LegacyServerMessage | null {
    const { data } = message;

    // Handle chat messages
    if (data.chat_data) {
      return this.convertChatToLegacy(data.chat_data, message);
    }

    // Handle slide data
    if (data.slide_data) {
      return this.convertSlidesToLegacy(data.slide_data, message);
    }

    return null;
  }

  /**
   * Convert chat data to legacy message
   */
  private static convertChatToLegacy(
    chatData: ChatData, 
    message: DirectorMessage
  ): LegacyServerMessage {
    switch (chatData.type) {
      case 'question':
        return {
          type: 'assistant_message',
          content: chatData.content.message,
          timestamp: message.timestamp,
          phase: this.getCurrentPhase(chatData)
        };

      case 'progress':
        return {
          type: 'status',
          status: chatData.content.message,
          message: chatData.content.message,
          timestamp: message.timestamp,
          phase: this.getCurrentPhase(chatData)
        };

      case 'summary':
      case 'action_required':
      default:
        return {
          type: 'assistant_message',
          content: chatData.content.message,
          timestamp: message.timestamp
        };
    }
  }

  /**
   * Convert slide data to legacy structure
   */
  private static convertSlidesToLegacy(
    slideData: SlideData,
    message: DirectorMessage
  ): LegacyServerMessage {
    const structure: StrawmanStructure = {
      title: slideData.presentation_metadata.title,
      total_slides: slideData.presentation_metadata.total_slides,
      estimated_duration: `${slideData.presentation_metadata.estimated_duration_minutes} minutes`,
      target_audience: '', // Not available in new format
      presentation_goal: slideData.presentation_metadata.description || '',
      slides: slideData.slides.map(this.convertSlideToLegacy)
    };

    return {
      type: 'structure_generated',
      structure,
      timestamp: message.timestamp,
      presentation_id: message.session_id
    };
  }

  /**
   * Convert single slide to legacy format
   */
  private static convertSlideToLegacy(slide: Slide, index: number): StrawmanStructure['slides'][0] {
    return {
      id: parseInt(slide.slide_id.replace(/\D/g, '')) || index + 1,
      title: slide.title,
      description: slide.speaker_notes || '',
      narrative_purpose: slide.narrative_purpose,
      engagement_hook: slide.engagement_hook,
      suggested_visuals: slide.visual_suggestions,
      speaker_notes_outline: slide.speaker_notes?.split('\n').filter(Boolean) || [],
      slide_type: 'content'
    };
  }

  /**
   * Extract phase from chat data
   */
  private static getCurrentPhase(chatData: ChatData): number {
    if (chatData.progress) {
      // Map progress percentage to phase (0, 1, or 2)
      if (chatData.progress.percentage < 33) return 0;
      if (chatData.progress.percentage < 66) return 1;
      return 2;
    }
    return 0;
  }

  /**
   * Convert agent status from new to legacy format
   */
  static convertAgentStatus(
    agentName: string,
    status: 'idle' | 'working' | 'completed' | 'error',
    currentTask?: string,
    progress?: number
  ): AgentActivity {
    const legacyStatus = status === 'working' ? 'working' : 
                        status === 'completed' ? 'completed' : 
                        status === 'error' ? 'idle' : 'idle';

    return {
      agent: this.mapAgentName(agentName),
      status: legacyStatus,
      message: currentTask || 'Idle',
      progress: progress || 0
    };
  }

  /**
   * Map agent names between formats
   */
  private static mapAgentName(name: string): AgentActivity['agent'] {
    const normalized = name.toLowerCase().replace(/\s+/g, '-');
    switch (normalized) {
      case 'director':
        return 'director';
      case 'scripter':
      case 'script-writer':
        return 'scripter';
      case 'graphic-artist':
      case 'visual-designer':
        return 'graphic-artist';
      case 'data-visualizer':
      case 'data-analyst':
        return 'data-visualizer';
      default:
        return 'director';
    }
  }

  /**
   * Check if a message is in legacy format
   */
  static isLegacyMessage(message: any): message is LegacyServerMessage {
    return message && typeof message.type === 'string' && 
           ['connected', 'assistant_message', 'status', 'structure_generated', 'error'].includes(message.type);
  }

  /**
   * Check if a message is in new format
   */
  static isNewMessage(message: any): message is DirectorMessage {
    return message && message.type === 'director_message' && 
           typeof message.data === 'object';
  }

  /**
   * Create a wrapper that automatically converts messages
   */
  static createCompatibilityWrapper(
    onMessage: (message: LegacyServerMessage) => void
  ): (message: DirectorMessage) => void {
    return (message: DirectorMessage) => {
      const legacyMessage = this.convertDirectorMessage(message);
      if (legacyMessage) {
        onMessage(legacyMessage);
      }
    };
  }
}

// Export convenience functions
export const convertToLegacyMessage = MessageCompatibilityLayer.convertDirectorMessage;
export const convertFromLegacyMessage = MessageCompatibilityLayer.convertClientMessage;
export const isLegacyFormat = MessageCompatibilityLayer.isLegacyMessage;
export const isNewFormat = MessageCompatibilityLayer.isNewMessage;