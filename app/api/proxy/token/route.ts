import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get backend URL from environment or use default
    const backendUrl = process.env.BACKEND_API_URL || 'https://deckster-production.up.railway.app';
    
    // Make server-side request to backend (bypasses CORS)
    const response = await fetch(`${backendUrl}/api/dev/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: body.user_id || 'test_user'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend token request failed:', response.status, errorText);
      
      return NextResponse.json(
        { error: 'Failed to get authentication token', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the token data
    return NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type || 'Bearer',
      expires_in: data.expires_in || 3600,
    });
    
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