import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get backend URL from environment or use default
    const backendUrl = process.env.BACKEND_API_URL || 'https://deckster-production.up.railway.app';
    
    // First try the new production-ready demo endpoint
    try {
      const response = await fetch(`${backendUrl}/api/auth/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: body.user_id || `test_user_${Date.now()}`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully got token from /api/auth/demo endpoint');
        
        // Return the token data in consistent format
        return NextResponse.json({
          access_token: data.access_token,
          token_type: data.token_type || 'bearer',
          expires_in: data.expires_in || 86400,
          user_id: data.user_id,
          source: 'demo_endpoint'
        });
      }
    } catch (demoError) {
      console.log('Demo endpoint failed, trying dev endpoint...');
    }
    
    // Fallback to dev endpoint (with query parameter format)
    try {
      const userId = body.user_id || 'test_user';
      const response = await fetch(`${backendUrl}/api/dev/token?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully got token from /api/dev/token endpoint');
        
        // Return the token data
        return NextResponse.json({
          access_token: data.access_token,
          token_type: data.token_type || 'bearer',
          expires_in: data.expires_in || 3600,
          user_id: userId,
          source: 'dev_endpoint'
        });
      }

      const errorText = await response.text();
      console.error('Backend token request failed:', response.status, errorText);
      
      return NextResponse.json(
        { error: 'Failed to get authentication token', details: errorText },
        { status: response.status }
      );
    } catch (devError) {
      throw devError;
    }
    
  } catch (error) {
    console.error('Proxy token error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}