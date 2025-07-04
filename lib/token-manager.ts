import { getSession } from 'next-auth/react';

export interface TokenInfo {
  token: string;
  expiryTime: number;
}

export class TokenManager {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private expiryTime: number | null = null;
  private refreshPromise: Promise<string> | null = null;

  async getValidToken(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.token && this.expiryTime && this.expiryTime > Date.now() + 300000) {
      return this.token;
    }

    // If already refreshing, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Refresh token
    this.refreshPromise = this.refreshAccessToken();
    
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async refreshAccessToken(): Promise<string> {
    try {
      // First, try to get token from backend dev endpoint
      const httpUrl = process.env.NEXT_PUBLIC_API_HTTP_URL || 'https://deckster-production.up.railway.app';
      
      try {
        // Try the dev token endpoint first (for development)
        const response = await fetch(`${httpUrl}/api/dev/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            user_id: this.getUserId() 
          })
        });

        if (response.ok) {
          const data = await response.json();
          this.token = data.access_token;
          // Set expiry to 1 hour from now (or use expires_in if provided)
          this.expiryTime = Date.now() + ((data.expires_in || 3600) * 1000);
          console.log('✅ Got authentication token from backend');
          return data.access_token;
        }
      } catch (error) {
        console.log('Dev token endpoint not available, trying other methods...');
      }

      // Fallback to NextAuth session if available
      const session = await getSession();
      
      if (session?.accessToken) {
        // If we have a refresh token, try to refresh
        if (this.refreshToken || session.refreshToken) {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              refresh_token: this.refreshToken || session.refreshToken
            })
          });

          if (response.ok) {
            const data = await response.json();
            this.token = data.access_token;
            this.expiryTime = Date.now() + (data.expires_in * 1000);
            
            if (data.refresh_token) {
              this.refreshToken = data.refresh_token;
            }

            return data.access_token;
          }
        }

        // Use the session access token directly
        this.token = session.accessToken as string;
        this.expiryTime = Date.now() + 3600000; // 1 hour
        return this.token;
      }

      // If no session, check for stored token
      const storedToken = localStorage.getItem('access_token');
      const tokenExpiry = localStorage.getItem('token_expiry');
      
      if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        this.token = storedToken;
        this.expiryTime = parseInt(tokenExpiry);
        return storedToken;
      }

      // If all else fails, throw error
      throw new Error('No authentication token available. Please sign in.');
      
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  private getUserId(): string {
    // Try to get user ID from various sources
    
    // 1. From NextAuth session
    const session = (window as any).__NEXT_AUTH_SESSION__;
    if (session?.user?.id) {
      return session.user.id;
    }

    // 2. From mock user
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
      try {
        const userData = JSON.parse(mockUser);
        return userData.id || 'test_user';
      } catch {
        // Ignore parse error
      }
    }

    // 3. From stored user ID
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      return storedUserId;
    }

    // 4. Default test user
    return 'test_user';
  }

  setTokens(accessToken: string, refreshToken?: string, expiresIn?: number): void {
    this.token = accessToken;
    this.refreshToken = refreshToken || null;
    this.expiryTime = expiresIn ? Date.now() + (expiresIn * 1000) : Date.now() + 3600000;
    
    // Store in localStorage for persistence
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('token_expiry', this.expiryTime.toString());
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    this.expiryTime = null;
    
    // Clear from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.expiryTime && this.expiryTime > Date.now();
  }

  getExpiryTime(): number | null {
    return this.expiryTime;
  }
}

// Singleton instance
export const tokenManager = new TokenManager();