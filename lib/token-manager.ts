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
      // First try to get the session from NextAuth
      const session = await getSession();
      
      if (!session?.accessToken) {
        // If no session, check localStorage for mock auth
        const mockUser = localStorage.getItem('mockUser');
        if (mockUser) {
          const userData = JSON.parse(mockUser);
          // Generate a mock JWT token
          const mockToken = btoa(JSON.stringify({
            sub: userData.id,
            email: userData.email,
            exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
          }));
          
          this.token = mockToken;
          this.expiryTime = Date.now() + 3600000; // 1 hour
          return mockToken;
        }
        
        throw new Error('No authentication token available');
      }

      // If we have a refresh token, use it
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

        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        this.token = data.access_token;
        this.expiryTime = Date.now() + (data.expires_in * 1000);
        
        if (data.refresh_token) {
          this.refreshToken = data.refresh_token;
        }

        return data.access_token;
      }

      // Use the session access token directly
      this.token = session.accessToken as string;
      // Assume 1 hour expiry if not specified
      this.expiryTime = Date.now() + 3600000;
      
      return this.token;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  setTokens(accessToken: string, refreshToken?: string, expiresIn?: number): void {
    this.token = accessToken;
    this.refreshToken = refreshToken || null;
    this.expiryTime = expiresIn ? Date.now() + (expiresIn * 1000) : Date.now() + 3600000;
  }

  clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    this.expiryTime = null;
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