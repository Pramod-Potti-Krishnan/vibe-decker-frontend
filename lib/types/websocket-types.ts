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

export interface PongMessage {
  type: 'pong';
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

// Connection status message
export interface ConnectionMessage extends BaseMessage {
  type: 'connection';
  status: 'connected' | 'disconnected';
  user_id: string;
  metadata?: {
    server_time: string;
    version: string;
  };
}

// System messages (errors, warnings, info)
export interface SystemMessage extends BaseMessage {
  type: 'system';
  level: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  details?: any;
}

export interface DirectorMessage extends BaseMessage {
  type: 'director_message';  // Backend sends 'director_message' - Round 12 change was incorrect
  source: 'director_inbound' | 'director_outbound';
  // Round 14 fix: chat_data and slide_data are at root level, not wrapped in 'data'
  chat_data?: ChatData;
  slide_data?: SlideData;
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
  type: 'question' | 'summary' | 'progress' | 'action_required' | 'info' | 'user_input';
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
  // Round 19 fix: agentStatuses is an object, not array (backend confirmed)
  agentStatuses?: {
    director: AgentStatus;
    researcher: AgentStatus;
    ux_architect: AgentStatus;
    visual_designer: AgentStatus;
    data_analyst: AgentStatus;
    ux_analyst: AgentStatus;
  };
}

type AgentStatus = 'active' | 'pending' | 'completed' | 'error';

// Type Guards
export function isUserInputMessage(msg: any): msg is UserInputMessage {
  return msg?.type === 'user_input';
}

export function isDirectorMessage(msg: any): msg is DirectorMessage {
  // Support both variations temporarily - backend sends 'director_message'
  return msg?.type === 'director_message' || msg?.type === 'director';
}

export function isConnectionMessage(msg: any): msg is ConnectionMessage {
  return msg?.type === 'connection';
}

export function isSystemMessage(msg: any): msg is SystemMessage {
  return msg?.type === 'system';
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
  | 'system_message'
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
  | ConnectionMessage
  | SystemMessage
  | AuthResponseMessage
  | ErrorMessage
  | PongMessage;