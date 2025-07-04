// Director-specific message types for the presentation generation flow

import { 
  Slide, 
  PresentationMetadata, 
  ChatData, 
  Action,
  Attachment,
  UIReference,
  FrontendAction
} from './websocket-types';

// Enhanced types for director communication
export interface DirectorChatMessage {
  role: 'director' | 'user';
  content: string;
  timestamp: string;
  metadata?: {
    phase?: PresentationPhase;
    questionId?: string;
    actions?: Action[];
    progress?: ProgressInfo;
  };
}

export interface PresentationPhase {
  current: 'gathering_requirements' | 'creating_structure' | 'awaiting_approval' | 'enhancing' | 'complete';
  subPhase?: string;
  progress: number;
}

export interface ProgressInfo {
  percentage: number;
  currentStep: string;
  stepsCompleted: string[];
  estimatedTimeRemaining?: number;
  agentStatuses?: AgentStatus[];
}

export interface AgentStatus {
  agentId: string;
  agentName: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  currentTask?: string;
  progress?: number;
}

export interface PresentationStructure {
  title: string;
  description: string;
  targetAudience: string;
  presentationType: string;
  estimatedDuration: number;
  slides: SlideStructure[];
}

export interface SlideStructure {
  slideNumber: number;
  title: string;
  purpose: string;
  contentOutline: string[];
  visualSuggestions: string[];
  speakerNotesOutline: string[];
  estimatedDuration: number;
}

// User input types for director
export interface UserInputData {
  text: string;
  responseTo?: string;
  attachments?: Attachment[];
  uiReferences?: UIReference[];
  frontendActions?: FrontendAction[];
}

export interface ClarificationQuestion {
  questionId: string;
  question: string;
  context?: string;
  options?: string[];
  required: boolean;
  category: 'audience' | 'content' | 'style' | 'technical' | 'other';
}

// Response types from director
export interface DirectorResponse {
  type: 'chat' | 'structure' | 'slides' | 'question' | 'action' | 'progress' | 'error';
  data: any;
  metadata?: {
    phase?: PresentationPhase;
    timestamp: string;
    messageId: string;
  };
}

// Slide enhancement data
export interface SlideEnhancement {
  slideId: string;
  enhancements: {
    narrativePurpose?: string;
    engagementHook?: string;
    visualSuggestions?: string[];
    contentDepth?: 'surface' | 'moderate' | 'detailed';
    speakingPoints?: string[];
  };
}

// Presentation approval data
export interface PresentationApproval {
  approved: boolean;
  feedback?: string;
  requestedChanges?: {
    slideId: string;
    changeType: 'content' | 'visual' | 'structure' | 'remove';
    description: string;
  }[];
}

// File upload handling
export interface FileUploadRequest {
  fileId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  purpose: 'brand_guidelines' | 'data' | 'reference' | 'template' | 'other';
  metadata?: Record<string, any>;
}

// Action types for user interactions
export interface DirectorAction {
  actionId: string;
  type: 'approve_structure' | 'request_changes' | 'generate_slides' | 'regenerate_slide' | 'export' | 'save_draft';
  label: string;
  primary?: boolean;
  data?: any;
  enabled?: boolean;
}

// Type guards for director messages
export function isStructureMessage(data: any): data is PresentationStructure {
  return data && typeof data.title === 'string' && Array.isArray(data.slides);
}

export function isClarificationQuestion(data: any): data is ClarificationQuestion {
  return data && typeof data.questionId === 'string' && typeof data.question === 'string';
}

export function isProgressUpdate(data: any): data is ProgressInfo {
  return data && typeof data.percentage === 'number' && typeof data.currentStep === 'string';
}

export function isSlideEnhancement(data: any): data is SlideEnhancement {
  return data && typeof data.slideId === 'string' && data.enhancements;
}

// Message formatting helpers
export function formatUserInput(text: string, options?: Partial<UserInputData>): UserInputData {
  return {
    text,
    responseTo: options?.responseTo,
    attachments: options?.attachments || [],
    uiReferences: options?.uiReferences || [],
    frontendActions: options?.frontendActions || []
  };
}

export function createUIReference(
  slideId: string,
  elementId?: string,
  context?: string
): UIReference {
  return {
    reference_type: elementId ? 'element' : 'slide',
    slide_id: slideId,
    element_id: elementId,
    css_selector: elementId ? `#${elementId}` : undefined,
    html_context: context
  };
}

export function createAction(
  actionId: string,
  actionType: string,
  data?: any
): FrontendAction {
  return {
    action_id: actionId,
    action_type: actionType as any,
    context: data
  };
}