/**
 * Authentication helper for quick testing and development
 */

export class AuthHelper {
  static async getDevToken(userId: string = 'test_user'): Promise<string> {
    const httpUrl = process.env.NEXT_PUBLIC_API_HTTP_URL || 'https://deckster-production.up.railway.app';
    
    try {
      const response = await fetch(`${httpUrl}/api/dev/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Got authentication token');
      
      // Store token for future use
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_expiry', (Date.now() + ((data.expires_in || 3600) * 1000)).toString());
      localStorage.setItem('user_id', userId);
      
      return data.access_token;
    } catch (error) {
      console.error('❌ Failed to get token:', error);
      throw error;
    }
  }

  static async quickAuth(): Promise<void> {
    try {
      const token = await this.getDevToken();
      console.log('✅ Authentication successful!');
      console.log('Token stored in localStorage');
      console.log('Reload the page to connect with the new token');
      return token;
    } catch (error) {
      console.error('❌ Quick auth failed:', error);
      throw error;
    }
  }

  static clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('mockUser');
    console.log('✅ Authentication cleared');
  }

  static checkAuth(): void {
    const token = localStorage.getItem('access_token');
    const expiry = localStorage.getItem('token_expiry');
    const userId = localStorage.getItem('user_id');
    
    if (!token) {
      console.log('❌ No authentication token found');
      console.log('Run AuthHelper.quickAuth() to authenticate');
      return;
    }
    
    const expiryTime = expiry ? parseInt(expiry) : 0;
    const isExpired = expiryTime < Date.now();
    
    console.log('Authentication Status:');
    console.log('- User ID:', userId || 'unknown');
    console.log('- Token exists:', !!token);
    console.log('- Token expired:', isExpired);
    
    if (isExpired) {
      console.log('⚠️  Token is expired. Run AuthHelper.quickAuth() to get a new token');
    } else {
      const remainingTime = Math.floor((expiryTime - Date.now()) / 1000 / 60);
      console.log(`✅ Token is valid for ${remainingTime} more minutes`);
    }
  }
}

// Export for browser console
if (typeof window !== 'undefined') {
  (window as any).AuthHelper = AuthHelper;
  console.log('🔐 AuthHelper loaded. Available commands:');
  console.log('- AuthHelper.quickAuth() - Get a development token');
  console.log('- AuthHelper.checkAuth() - Check authentication status');
  console.log('- AuthHelper.clearAuth() - Clear stored authentication');
}