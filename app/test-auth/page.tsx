'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestAuthPage() {
  const [status, setStatus] = useState<string[]>([]);
  const [token, setToken] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState('Not connected');
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const API_HTTP_URL = process.env.NEXT_PUBLIC_API_HTTP_URL || 'https://deckster-production.up.railway.app';
  const API_WS_URL = process.env.NEXT_PUBLIC_API_URL || 'wss://deckster-production.up.railway.app';

  const log = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setStatus(prev => [...prev, `[${new Date().toTimeString().split(' ')[0]}] ${message}`]);
  };

  const testAuth = async () => {
    try {
      log('Testing authentication...', 'info');
      
      const response = await fetch(`${API_HTTP_URL}/api/dev/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'test_user_' + Date.now() })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setToken(data);
      
      log('✅ Authentication successful!', 'success');
      
      // Store in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_expiry', (Date.now() + ((data.expires_in || 3600) * 1000)).toString());
      
    } catch (error: any) {
      log(`❌ Authentication failed: ${error.message}`, 'error');
      console.error(error);
    }
  };

  const connectWebSocket = async () => {
    if (!token?.access_token) {
      log('❌ No token available. Please authenticate first.', 'error');
      return;
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      log('Already connected', 'info');
      return;
    }
    
    try {
      log('Connecting to WebSocket...', 'info');
      setWsStatus('Connecting...');
      
      const websocket = new WebSocket(`${API_WS_URL}/ws?token=${encodeURIComponent(token.access_token)}`);
      
      websocket.onopen = () => {
        log('✅ WebSocket connected!', 'success');
        setWsStatus('Connected');
      };
      
      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          log(`📥 Received: ${message.type}`, 'info');
          setMessages(prev => [...prev, message]);
          
          if (message.type === 'connection' && message.status === 'connected') {
            setSessionId(message.session_id);
            log(`✅ Session established: ${message.session_id}`, 'success');
          }
        } catch (error: any) {
          log(`❌ Failed to parse message: ${error.message}`, 'error');
        }
      };
      
      websocket.onerror = (error) => {
        log(`❌ WebSocket error occurred`, 'error');
        setWsStatus('Error');
      };
      
      websocket.onclose = (event) => {
        log(`🔌 WebSocket closed: ${event.code} - ${event.reason || 'No reason'}`, 'info');
        setWsStatus(`Closed (${event.code})`);
        
        if (event.code === 1008) {
          log('❌ Authentication failed - Policy violation', 'error');
        }
      };
      
      setWs(websocket);
      
    } catch (error: any) {
      log(`❌ Connection failed: ${error.message}`, 'error');
      setWsStatus('Failed');
    }
  };

  const sendTestMessage = async () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      log('❌ WebSocket not connected', 'error');
      return;
    }
    
    const message = {
      type: 'director_request',
      message_id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      session_id: sessionId || '',
      data: {
        prompt: 'Create a simple presentation about cats',
        context: {
          subject: 'cats',
          audience: 'general',
          tone: 'informative'
        }
      }
    };
    
    ws.send(JSON.stringify(message));
    log(`📤 Sent test message: ${message.type}`, 'success');
    setMessages(prev => [...prev, message]);
  };

  const disconnect = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'User disconnect');
      log('Disconnected', 'info');
    } else {
      log('Not connected', 'info');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Vibe Deck Authentication Test</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded max-h-48 overflow-y-auto">
        <h3 className="font-semibold mb-2">Status Log:</h3>
        {status.map((msg, i) => (
          <div key={i} className="text-sm font-mono">{msg}</div>
        ))}
      </div>
      
      <div className="flex gap-4 mb-6">
        <Button onClick={testAuth}>1. Test Authentication</Button>
        <Button onClick={connectWebSocket}>2. Connect WebSocket</Button>
        <Button onClick={sendTestMessage}>3. Send Test Message</Button>
        <Button onClick={disconnect}>4. Disconnect</Button>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Token Info:</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
            {token ? JSON.stringify(token, null, 2) : 'No token yet'}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">WebSocket Status:</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs">
            {wsStatus}
          </pre>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Messages:</h3>
        <pre className="bg-gray-100 p-4 rounded text-xs max-h-96 overflow-y-auto">
          {messages.map((msg, i) => JSON.stringify(msg, null, 2)).join('\n\n')}
        </pre>
      </div>
    </div>
  );
}