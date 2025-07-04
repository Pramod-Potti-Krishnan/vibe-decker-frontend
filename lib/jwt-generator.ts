import jwt from 'jsonwebtoken';

export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name?: string;
  exp?: number;
  iat?: number;
}

export class JWTGenerator {
  private secret: string;
  private issuer: string;
  private audience: string;
  private expiresIn: string | number;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.issuer = process.env.JWT_ISSUER || 'vibe-deck-frontend';
    this.audience = process.env.JWT_AUDIENCE || 'vibe-deck-api';
    this.expiresIn = process.env.JWT_EXPIRY ? parseInt(process.env.JWT_EXPIRY) : 3600;
  }

  generateToken(payload: Omit<JWTPayload, 'exp' | 'iat'>): string {
    return jwt.sign(payload, this.secret, {
      issuer: this.issuer,
      audience: this.audience,
      expiresIn: this.expiresIn,
      algorithm: 'HS256'
    });
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      }) as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  // Generate a mock token for development
  generateMockToken(userId: string = 'test-user', email: string = 'test@example.com'): string {
    return this.generateToken({
      sub: userId,
      email: email,
      name: 'Test User'
    });
  }
}

// Singleton instance
export const jwtGenerator = new JWTGenerator();

// Helper to get a valid token for development
export function getDevToken(): string {
  // First check if there's a mock token in env
  if (process.env.NEXT_PUBLIC_MOCK_JWT_TOKEN) {
    return process.env.NEXT_PUBLIC_MOCK_JWT_TOKEN;
  }

  // Otherwise generate one on the fly
  return jwtGenerator.generateMockToken();
}