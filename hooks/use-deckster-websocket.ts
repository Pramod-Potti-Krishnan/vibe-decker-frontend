import { useEffect, useState, useCallback, useRef } from 'react';
import { DecksterClient } from '@/lib/websocket-client';
import { 
  DirectorMessage, 
  SystemMessage,
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
  connecting: boolean;
  initialized: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
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
    connecting: false,
    initialized: false,
    connectionState: 'disconnected',
    sessionId: null,
    error: null,
    messages: [],
    slides: null,  // Round 16: This should match SlideData | null type
    chatMessages: [],
    progress: null
  });
  
  // Round 16 Debug: Log initial state
  console.log('[Round 16 Debug] Initial state.slides:', state.slides);

  const clientRef = useRef<DecksterClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const initializationRef = useRef<boolean>(false);

  // Initialize WebSocket client
  useEffect(() => {
    if (!options.autoConnect && options.autoConnect !== undefined) {
      return;
    }

    // Prevent multiple initialization attempts
    if (initializationRef.current || clientRef.current?.getIsInitialized()) {
      console.log('🔄 WebSocket already initialized, skipping...');
      return;
    }

    const initializeClient = async () => {
      try {
        initializationRef.current = true;
        
        setState(prev => ({ 
          ...prev, 
          connecting: true, 
          connectionState: 'connecting',
          error: null 
        }));

        const token = await getToken();
        if (!token) {
          setState(prev => ({ 
            ...prev, 
            error: new Error('No authentication token available'),
            connecting: false,
            connectionState: 'error'
          }));
          initializationRef.current = false;
          return;
        }

        // Only create new client if we don't have one
        if (!clientRef.current) {
          const client = new DecksterClient({
            url: process.env.NEXT_PUBLIC_WS_URL,
            reconnectDelay: 1000,
            maxReconnectDelay: 30000,
            maxReconnectAttempts: options.reconnectOnError ? 10 : 3
          });

          clientRef.current = client;
        }

        const client = clientRef.current;

        // Setup event handlers
        client.on('connected', () => {
          setState(prev => ({ 
            ...prev, 
            connected: true, 
            connecting: false,
            initialized: true,
            connectionState: 'connected',
            error: null 
          }));
        });

        client.on('authenticated', (message) => {
          setState(prev => ({ 
            ...prev, 
            authenticated: true,
            sessionId: message.session_id || null
          }));
        });

        client.on('disconnected', () => {
          setState(prev => ({ 
            ...prev, 
            connected: false, 
            authenticated: false,
            connecting: false,
            initialized: false,
            connectionState: 'disconnected'
          }));
          initializationRef.current = false;
        });

        client.on('error', (error) => {
          setState(prev => ({ 
            ...prev, 
            error,
            connecting: false,
            connectionState: 'error'
          }));
          initializationRef.current = false;
          if (options.onError) {
            options.onError(error);
          }
        });

        client.on('director_message', (message: DirectorMessage) => {
          console.log('[Round 16 Debug] Received director_message:', message);
          
          setState(prev => {
            console.log('[Round 16 Debug] Previous state.slides:', prev.slides);
            console.log('[Round 16 Debug] Is prev.slides an array?', Array.isArray(prev.slides));
            
            const newState = { 
              ...prev, 
              messages: [...prev.messages, message] 
            };

            // Round 14 fix: chat_data and slide_data are directly on the message, not wrapped in 'data'
            // Round 15 fix: Extract slides array from slide_data object
            // Round 17 fix: Ensure slides is always an array, handle chat-only messages
            if (message.slide_data?.slides) {
              console.log('[Round 16 Debug] message.slide_data:', message.slide_data);
              console.log('[Round 16 Debug] message.slide_data.slides:', message.slide_data.slides);
              console.log('[Round 16 Debug] Is message.slide_data.slides an array?', Array.isArray(message.slide_data.slides));
              newState.slides = message.slide_data;
            } else {
              // Chat-only message (analysis phase) - preserve existing slides or initialize as null
              console.log('[Round 17 Debug] No slide_data, keeping existing slides');
              newState.slides = prev.slides; // Keep existing SlideData or null
            }

            // Update chat messages if present
            if (message.chat_data) {
              console.log('[Round 16 Debug] message.chat_data:', message.chat_data);
              newState.chatMessages = [...prev.chatMessages, message.chat_data];
              
              // Update progress if present
              if (message.chat_data.progress) {
                console.log('[Round 16 Debug] message.chat_data.progress:', message.chat_data.progress);
                newState.progress = message.chat_data.progress;
              }
            }

            console.log('[Round 16 Debug] New state.slides:', newState.slides);
            console.log('[Round 16 Debug] Is newState.slides an array?', Array.isArray(newState.slides));
            
            return newState;
          });
        });

        client.on('system_message', (message: any) => {
          // Handle system messages (especially errors)
          if (message.level === 'error') {
            setState(prev => ({ 
              ...prev, 
              error: new Error(`System Error: ${message.message} (${message.code})`),
              connectionState: 'error'
            }));
          }
          console.log(`[System ${message.level}] ${message.message}`);
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
          error: error instanceof Error ? error : new Error('Failed to connect'),
          connecting: false,
          connectionState: 'error'
        }));
        initializationRef.current = false;
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
      initializationRef.current = false;
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
    if (!clientRef.current || !state.initialized || !state.connected) {
      const statusMsg = !clientRef.current ? 'WebSocket not initialized' : 
                       !state.initialized ? 'WebSocket not ready' : 
                       'WebSocket not connected';
      console.warn(`⚠️ Cannot send message: ${statusMsg}`);
      throw new Error(statusMsg);
    }

    try {
      const result = await clientRef.current.send({
        type: 'user_input',
        data: {
          text,
          response_to: options?.responseTo || null,
          attachments: options?.attachments || [],
          ui_references: options?.uiReferences || [],
          frontend_actions: options?.actions || []
        }
      });
      
      if (!result) {
        throw new Error('Failed to send message - client returned null');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [state.connected, state.initialized]);

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
    isReady: state.connected && state.authenticated && state.initialized
  };
}