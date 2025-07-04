import { EventEmitter } from 'events';
import { 
  ClientMessage, 
  ServerMessage, 
  DirectorMessage,
  AuthResponseMessage,
  ErrorMessage,
  WebSocketEventType,
  isDirectorMessage,
  isAuthResponseMessage,
  isErrorMessage
} from './types/websocket-types';

export interface DecksterClientConfig {
  url?: string;
  httpUrl?: string;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageTimeout?: number;
}

export class DecksterClient extends EventEmitter {
  private config: Required<DecksterClientConfig>;
  private ws: WebSocket | null = null;
  private connected = false;
  private isInitialized = false;
  private isConnecting = false;
  private sessionId: string | null = null;
  private token: string | null = null;
  private pendingMessages = new Map<string, {
    resolve: (response: any) => void;
    reject: (error: Error) => void;
    responseType: string;
    timer: NodeJS.Timeout;
  }>();
  private messageQueue: ClientMessage[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config: DecksterClientConfig = {}) {
    super();
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_WS_URL || 'wss://deckster-production.up.railway.app',
      httpUrl: config.httpUrl || process.env.NEXT_PUBLIC_API_HTTP_URL || 'https://deckster-production.up.railway.app',
      reconnectDelay: config.reconnectDelay || 1000,
      maxReconnectDelay: config.maxReconnectDelay || 30000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageTimeout: config.messageTimeout || 30000,
    };
  }

  async connect(token: string): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('🔄 Connection already in progress, skipping...');
      return;
    }

    if (this.isInitialized && this.connected) {
      console.log('✅ Already connected, skipping...');
      return;
    }

    console.log('🔌 Starting WebSocket connection...');
    this.isConnecting = true;
    this.token = token;

    return new Promise((resolve, reject) => {
      try {
        // Include JWT in connection URL as recommended in the guide
        this.ws = new WebSocket(`${this.config.url}/ws?token=${encodeURIComponent(token)}`);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.connected = true;
          this.isInitialized = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.emit('error', new Error('Invalid message format'));
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(message: any): void {
    // Handle connection success message
    if (message.type === 'connection' && message.status === 'connected') {
      this.sessionId = message.session_id;
      console.log('✅ Session established:', this.sessionId);
      this.emit('authenticated', { session_id: message.session_id });
      this.processMessageQueue();
      return;
    }

    // Handle auth responses (legacy format)
    if (isAuthResponseMessage(message)) {
      this.handleAuthResponse(message);
      return;
    }

    // Handle pending message responses
    const pending = this.pendingMessages.get(message.response_to);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingMessages.delete(message.response_to);
      
      if (isErrorMessage(message)) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message);
      }
      return;
    }

    // Handle director messages
    if (isDirectorMessage(message)) {
      this.handleDirectorMessage(message);
    }

    // Handle error messages
    if (isErrorMessage(message)) {
      this.emit('error', new Error(message.error.message));
    }

    // Emit raw message event
    this.emit('message', message);
  }

  private handleAuthResponse(message: AuthResponseMessage): void {
    if (message.type === 'auth_success' || (message.type === 'auth_response' && message.success)) {
      this.sessionId = message.session_id || null;
      this.emit('authenticated', message);
      this.processMessageQueue();
    } else {
      this.emit('auth_failed', message);
      this.disconnect();
    }
  }

  private handleDirectorMessage(message: DirectorMessage): void {
    this.emit('director_message', message);

    const { data } = message;

    // Emit chat-specific events
    if (data.chat_data) {
      const chatType = data.chat_data.type;
      this.emit(`chat_${chatType}` as WebSocketEventType, message);
    }

    // Emit slide update events
    if (data.slide_data?.slides && data.slide_data.slides.length > 0) {
      this.emit('slides_update', message);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('🔌 WebSocket closed:', event.code, event.reason);
    this.connected = false;
    this.isInitialized = false;
    this.isConnecting = false;
    this.stopHeartbeat();
    this.emit('disconnected', event);

    // Clear pending messages
    this.pendingMessages.forEach(pending => {
      clearTimeout(pending.timer);
      pending.reject(new Error('Connection closed'));
    });
    this.pendingMessages.clear();

    // Handle authentication failures
    if (event.code === 1008) {
      console.error('❌ Authentication failed - WebSocket closed with policy violation');
      this.emit('auth_failed', { reason: event.reason || 'Missing or invalid authentication token' });
      return;
    }

    // Attempt reconnection if not a normal closure
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        if (this.token) {
          await this.connect(this.token);
          
          // Restore session if available
          if (this.sessionId) {
            await this.send({
              type: 'restore_session',
              session_id: this.sessionId
            } as any);
          }
        }
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' } as any);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  async send(message: Omit<ClientMessage, 'message_id' | 'timestamp' | 'session_id'>): Promise<ClientMessage | null> {
    if (!this.isInitialized || !this.ws) {
      console.warn('⚠️ WebSocket not initialized - message queued');
      const fullMessage: ClientMessage = {
        ...message,
        message_id: this.generateMessageId(),
        timestamp: new Date().toISOString(),
        session_id: this.sessionId || '',
      } as ClientMessage;
      this.messageQueue.push(fullMessage);
      return fullMessage;
    }

    const fullMessage: ClientMessage = {
      ...message,
      message_id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      session_id: this.sessionId || '',
    } as ClientMessage;

    if (!this.connected || this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected - message queued');
      this.messageQueue.push(fullMessage);
      return fullMessage;
    }

    try {
      this.ws.send(JSON.stringify(fullMessage));
      console.log('📤 Sent:', fullMessage);
      return fullMessage;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      this.messageQueue.push(fullMessage);
      return null;
    }
  }

  async sendWithResponse<T = any>(
    message: Omit<ClientMessage, 'message_id' | 'timestamp' | 'session_id'>,
    responseType: string,
    timeout = this.config.messageTimeout
  ): Promise<T> {
    const fullMessage = await this.send(message);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingMessages.delete(fullMessage.message_id);
        reject(new Error(`Message timeout: ${responseType}`));
      }, timeout);

      this.pendingMessages.set(fullMessage.message_id, {
        resolve,
        reject,
        responseType,
        timer
      });
    });
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  disconnect(): void {
    console.log('🔌 Manually disconnecting WebSocket...');
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.connected = false;
    this.isInitialized = false;
    this.isConnecting = false;
    this.pendingMessages.forEach(pending => {
      clearTimeout(pending.timer);
      pending.reject(new Error('Client disconnected'));
    });
    this.pendingMessages.clear();
    this.messageQueue = [];
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  isConnected(): boolean {
    return this.connected;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  getIsConnecting(): boolean {
    return this.isConnecting;
  }

  getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (this.connected && this.isInitialized) return 'connected';
    if (this.ws?.readyState === WebSocket.CLOSED && this.reconnectAttempts > 0) return 'error';
    return 'disconnected';
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  // Convenience methods
  on(event: WebSocketEventType, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  off(event: WebSocketEventType, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }

  emit(event: WebSocketEventType, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
}