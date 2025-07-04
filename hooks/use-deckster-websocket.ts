import { useEffect, useState, useCallback, useRef } from 'react';
import { DecksterClient } from '@/lib/websocket-client';
import { 
  DirectorMessage, 
  UserInputMessage,
  ChatData,
  SlideData,
  Attachment,
  UIReference,
  FrontendAction,
  WebSocketEventType
} from '@/lib/types/websocket-types';
import { useAuth } from './use-auth';

export interface UseDecksterWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnError?: boolean;
  onError?: (error: Error) => void;
}

export interface DecksterWebSocketState {
  connected: boolean;
  authenticated: boolean;
  sessionId: string | null;
  error: Error | null;
  messages: DirectorMessage[];
  slides: SlideData | null;
  chatMessages: ChatData[];
  progress: {
    percentage: number;
    currentStep: string;
    stepsCompleted: string[];
    estimatedTimeRemaining?: number;
  } | null;
}

export function useDecksterWebSocket(options: UseDecksterWebSocketOptions = {}) {
  const { getToken, isAuthenticated } = useAuth();
  const [state, setState] = useState<DecksterWebSocketState>({
    connected: false,
    authenticated: false,
    sessionId: null,
    error: null,
    messages: [],
    slides: null,
    chatMessages: [],
    progress: null
  });

  const clientRef = useRef<DecksterClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize WebSocket client
  useEffect(() => {
    if (!options.autoConnect && options.autoConnect !== undefined) {
      return;
    }

    const initializeClient = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setState(prev => ({ ...prev, error: new Error('No authentication token available') }));
          return;
        }

        const client = new DecksterClient({
          url: process.env.NEXT_PUBLIC_WS_URL,
          reconnectDelay: 1000,
          maxReconnectDelay: 30000,
          maxReconnectAttempts: options.reconnectOnError ? 10 : 3
        });

        clientRef.current = client;

        // Setup event handlers
        client.on('connected', () => {
          setState(prev => ({ ...prev, connected: true, error: null }));
        });

        client.on('authenticated', (message) => {
          setState(prev => ({ 
            ...prev, 
            authenticated: true,
            sessionId: message.session_id || null
          }));
        });

        client.on('disconnected', () => {
          setState(prev => ({ ...prev, connected: false, authenticated: false }));
        });

        client.on('error', (error) => {
          setState(prev => ({ ...prev, error }));
          if (options.onError) {
            options.onError(error);
          }
        });

        client.on('director_message', (message: DirectorMessage) => {
          setState(prev => {
            const newState = { 
              ...prev, 
              messages: [...prev.messages, message] 
            };

            // Update slides if present
            if (message.data.slide_data) {
              newState.slides = message.data.slide_data;
            }

            // Update chat messages if present
            if (message.data.chat_data) {
              newState.chatMessages = [...prev.chatMessages, message.data.chat_data];
              
              // Update progress if present
              if (message.data.chat_data.progress) {
                newState.progress = message.data.chat_data.progress;
              }
            }

            return newState;
          });
        });

        client.on('auth_failed', () => {
          setState(prev => ({ 
            ...prev, 
            error: new Error('Authentication failed'),
            authenticated: false 
          }));
        });

        // Connect to WebSocket
        await client.connect(token);
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error : new Error('Failed to connect') 
        }));
      }
    };

    if (isAuthenticated || localStorage.getItem('mockUser')) {
      initializeClient();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [isAuthenticated, options.autoConnect, options.reconnectOnError, options.onError, getToken]);

  // Send message function
  const sendMessage = useCallback(async (
    text: string,
    options?: {
      responseTo?: string;
      attachments?: Attachment[];
      uiReferences?: UIReference[];
      actions?: FrontendAction[];
    }
  ): Promise<void> => {
    if (!clientRef.current || !state.connected) {
      throw new Error('WebSocket not connected');
    }

    try {
      await clientRef.current.send({
        type: 'user_input',
        data: {
          text,
          response_to: options?.responseTo || null,
          attachments: options?.attachments || [],
          ui_references: options?.uiReferences || [],
          frontend_actions: options?.actions || []
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [state.connected]);

  // Upload file function
  const uploadFile = useCallback(async (file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    
    return {
      type: 'file',
      file_id: data.file_id,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      upload_url: data.upload_url
    };
  }, [getToken]);

  // Send file with message
  const sendFileWithMessage = useCallback(async (
    file: File, 
    text: string = ''
  ): Promise<void> => {
    try {
      const attachment = await uploadFile(file);
      await sendMessage(text, { attachments: [attachment] });
    } catch (error) {
      console.error('Failed to send file:', error);
      throw error;
    }
  }, [uploadFile, sendMessage]);

  // Reference slide element
  const referenceSlideElement = useCallback(async (
    slideId: string,
    elementId: string,
    text: string
  ): Promise<void> => {
    const element = document.querySelector(
      `[data-slide-id="${slideId}"] [data-element-id="${elementId}"]`
    ) as HTMLElement;

    if (!element) {
      throw new Error('Element not found');
    }

    const uiReference: UIReference = {
      reference_type: 'element',
      slide_id: slideId,
      element_id: elementId,
      css_selector: `#${elementId}`,
      html_context: element.outerHTML
    };

    await sendMessage(text, { uiReferences: [uiReference] });
  }, [sendMessage]);

  // Perform action
  const performAction = useCallback(async (
    actionId: string,
    actionType: string,
    data?: any
  ): Promise<void> => {
    const action: FrontendAction = {
      action_id: actionId,
      action_type: actionType as any,
      context: data
    };

    await sendMessage('', { actions: [action] });
  }, [sendMessage]);

  // Subscribe to events
  const subscribe = useCallback((
    event: WebSocketEventType,
    handler: (...args: any[]) => void
  ): (() => void) => {
    if (!clientRef.current) {
      console.warn('WebSocket client not initialized');
      return () => {};
    }

    clientRef.current.on(event, handler);
    
    return () => {
      if (clientRef.current) {
        clientRef.current.off(event, handler);
      }
    };
  }, []);

  // Reconnect function
  const reconnect = useCallback(async (): Promise<void> => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    setState(prev => ({ 
      ...prev, 
      connected: false, 
      authenticated: false,
      error: null 
    }));

    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const client = new DecksterClient();
    clientRef.current = client;
    
    await client.connect(token);
  }, [getToken]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      chatMessages: []
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    sendMessage,
    uploadFile,
    sendFileWithMessage,
    referenceSlideElement,
    performAction,
    subscribe,
    reconnect,
    clearMessages,
    
    // Utility
    isReady: state.connected && state.authenticated
  };
}