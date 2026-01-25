// src/app/lib/auth-options.ts
import { NextAuthOptions, DefaultSession, DefaultUser } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getPermissionsForRole, normalizeRole } from './auth'

// Define the User type from your existing auth system
export interface AppUser {
  id: string
  email: string
  name: string
  role: string
  facilityId?: string
  countyId?: string
  permissions: string[]
}

// Extend the default types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      facilityId?: string
      countyId?: string
      permissions: string[]
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    facilityId?: string
    countyId?: string
    permissions: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email?: string
    name?: string
    role: string
    facilityId?: string
    countyId?: string
    permissions: string[]
  }
}

// Mock user for development - remove when connecting to real auth
function getMockUser(): AppUser {
  return {
    id: '1',
    email: 'doctor@example.com',
    name: 'Dr. John Smith',
    role: 'DOCTOR',
    facilityId: 'hospital-1',
    countyId: 'county-1',
    permissions: getPermissionsForRole('DOCTOR')
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<AppUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Mock authentication - replace with real database check
          if (credentials.email === 'doctor@example.com' && credentials.password === 'password123') {
            return getMockUser()
          }

          if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
            return {
              id: '2',
              email: credentials.email,
              name: 'Admin User',
              role: 'SUPER_ADMIN',
              facilityId: 'main-hospital',
              countyId: 'county-1',
              permissions: ['*']
            }
          }

          // Return null if credentials are invalid
          return null
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const appUser = user as AppUser
        token.id = appUser.id
        token.email = appUser.email
        token.name = appUser.name
        token.role = appUser.role
        token.facilityId = appUser.facilityId
        token.countyId = appUser.countyId
        token.permissions = appUser.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.facilityId = token.facilityId as string | undefined
        session.user.countyId = token.countyId as string | undefined
        session.user.permissions = token.permissions as string[]
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signIn({ user }) {
      console.log('User signed in:', user.email)
    },
    async signOut() {
      console.log('User signed out')
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
}