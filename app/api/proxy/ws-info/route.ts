import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get WebSocket URL from environment or use default
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://deckster-production.up.railway.app';
    const backendUrl = process.env.BACKEND_API_URL || 'https://deckster-production.up.railway.app';
    
    return NextResponse.json({
      ws_url: wsUrl,
      backend_url: backendUrl,
      auth_required: true,
      auth_type: 'jwt',
      connection_info: {
        reconnect_delay: 1000,
        max_reconnect_attempts: 5,
        heartbeat_interval: 30000,
      }
    });
    
  } catch (error) {
    console.error('WebSocket info error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get WebSocket information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}