// WebSocket message types matching the new backend API specification

export interface BaseMessage {
  message_id: string;
  timestamp: string;
  session_id: string;
}

// Client to Server Messages
export interface UserInputMessage extends BaseMessage {
  type: 'user_input';
  data: {
    text: string;
    response_to: string | null;
    attachments: Attachment[];
    ui_references: UIReference[];
    frontend_actions: FrontendAction[];
  };
}

export interface AuthMessage {
  type: 'auth';
  token: string;
}

export interface PingMessage {
  type: 'ping';
}

export interface RestoreSessionMessage {
  type: 'restore_session';
  session_id: string;
}

// Server to Client Messages
export interface AuthResponseMessage {
  type: 'auth_response' | 'auth_success' | 'auth_failed';
  success?: boolean;
  session_id?: string;
  reason?: string;
}

export interface DirectorMessage extends BaseMessage {
  type: 'director_message';
  source: 'director_inbound' | 'director_outbound';
  data: {
    slide_data?: SlideData;
    chat_data?: ChatData;
  };
}

export interface ErrorMessage {
  type: 'error';
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Supporting Types
export interface Attachment {
  type: 'file';
  file_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  upload_url: string;
}

export interface UIReference {
  reference_type: 'element' | 'slide' | 'selection';
  slide_id?: string;
  element_id?: string;
  css_selector?: string;
  html_context?: string;
}

export interface FrontendAction {
  action_id: string;
  action_type: 'button_click' | 'form_submit' | 'navigation';
  button_id?: string;
  context?: Record<string, any>;
}

export interface SlideData {
  slides: Slide[];
  presentation_metadata: PresentationMetadata;
}

export interface Slide {
  slide_id: string;
  slide_number: number;
  title: string;
  html_content: string;
  speaker_notes?: string;
  narrative_purpose?: string;
  engagement_hook?: string;
  visual_suggestions?: string[];
  assets: SlideAsset[];
  metadata: SlideMetadata;
}

export interface SlideAsset {
  asset_id: string;
  type: 'image' | 'video' | 'chart' | 'icon';
  url: string;
  alt_text?: string;
  metadata?: Record<string, any>;
}

export interface SlideMetadata {
  created_at: string;
  updated_at: string;
  speaking_time_seconds?: number;
  content_depth?: 'surface' | 'moderate' | 'detailed';
  keywords?: string[];
}

export interface PresentationMetadata {
  title: string;
  description?: string;
  total_slides: number;
  estimated_duration_minutes: number;
  theme?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatData {
  type: 'question' | 'summary' | 'progress' | 'action_required';
  content: ChatContent;
  actions?: Action[];
  progress?: ProgressInfo;
}

export interface ChatContent {
  message: string;
  context?: string;
  options?: string[];
  question_id?: string;
  required?: boolean;
}

export interface Action {
  action_id: string;
  label: string;
  type: 'button' | 'link' | 'form';
  primary?: boolean;
  data?: Record<string, any>;
}

export interface ProgressInfo {
  percentage: number;
  current_step: string;
  steps_completed: string[];
  estimated_time_remaining?: number;
}

// Type Guards
export function isUserInputMessage(msg: any): msg is UserInputMessage {
  return msg?.type === 'user_input';
}

export function isDirectorMessage(msg: any): msg is DirectorMessage {
  return msg?.type === 'director_message';
}

export function isAuthResponseMessage(msg: any): msg is AuthResponseMessage {
  return msg?.type === 'auth_response' || msg?.type === 'auth_success' || msg?.type === 'auth_failed';
}

export function isErrorMessage(msg: any): msg is ErrorMessage {
  return msg?.type === 'error';
}

// WebSocket Event Types
export type WebSocketEventType = 
  | 'connected'
  | 'authenticated'
  | 'disconnected'
  | 'error'
  | 'message'
  | 'director_message'
  | 'chat_question'
  | 'chat_summary'
  | 'chat_progress'
  | 'chat_action_required'
  | 'slides_update'
  | 'auth_failed';

// Client Message Types
export type ClientMessage = 
  | UserInputMessage
  | AuthMessage
  | PingMessage
  | RestoreSessionMessage;

// Server Message Types
export type ServerMessage = 
  | DirectorMessage
  | AuthResponseMessage
  | ErrorMessage;