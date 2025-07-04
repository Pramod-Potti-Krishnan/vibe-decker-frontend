import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"

// For now, we'll use in-memory storage until Prisma is set up
// This will be replaced with PrismaAdapter once database is configured
const users: any[] = []

// Helper function to get session duration based on user preference
function getSessionMaxAge(req?: any): number {
  // Default to 24 hours
  const defaultMaxAge = 24 * 60 * 60;
  // Extended to 30 days
  const extendedMaxAge = 30 * 24 * 60 * 60;
  
  // Check if we can access the preference from the request
  // This will be set during the sign-in process
  if (req?.cookies?.staySignedIn === 'true') {
    return extendedMaxAge;
  }
  
  return defaultMaxAge;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  // Temporarily use JWT strategy until database is set up
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Max 30 days, will be adjusted per user preference
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: "/", // Direct to landing page for sign in
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (account && user) {
        // Check for stay signed in preference from browser storage
        const staySignedIn = trigger === "signIn" ? true : false;
        
        return {
          ...token,
          id: user.id,
          tier: "free", // Default tier for new users
          subscriptionStatus: null,
          staySignedIn,
          // Set custom expiry based on preference
          exp: staySignedIn 
            ? Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
            : Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.tier = token.tier as "free" | "pro" | "enterprise"
        session.user.subscriptionStatus = token.subscriptionStatus as string | null
      }
      return session
    },
    async signIn({ user, account }) {
      // Check if this is a new user by looking for them in our temporary storage
      const existingUser = users.find(u => u.email === user.email)
      
      if (!existingUser && user.email) {
        // New user - they'll need onboarding
        users.push({
          id: user.id || `user_${Date.now()}`,
          email: user.email,
          name: user.name,
          isNew: true,
        })
        
        // Redirect new users to builder with new=true parameter
        return '/builder?new=true'
      }
      
      // Existing users go directly to builder
      return '/builder'
    },
  },
  debug: process.env.NODE_ENV === "development",
}