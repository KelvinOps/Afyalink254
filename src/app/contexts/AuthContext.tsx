// /app/contexts/AuthContext.tsx - CORRECTED VERSION
'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserToken } from '@/app/lib/auth'

interface AuthContextType {
  user: UserToken | null
  isLoading: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserToken | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Try to get auth status from /api/auth/me
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // IMPORTANT: Include cookies
      })
      
      if (response.ok) {
        const userData = await response.json()
        console.log('✅ Auth check successful:', userData.email)
        setUser(userData)
      } else {
        console.log('❌ Auth check failed:', response.status)
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Handle redirection
  useEffect(() => {
    if (!isInitialized || isLoading) return

    const publicPaths = ['/', '/login', '/register', '/forgot-password']
    const isPublicPath = publicPaths.includes(pathname) || 
                        pathname?.startsWith('/api/auth/') ||
                        pathname?.includes('.') // Skip files

    if (!user && !isPublicPath && pathname !== '/login') {
      console.log('🔒 Redirecting to login from:', pathname)
      // Add small delay to ensure any pending state updates complete
      setTimeout(() => {
        router.push('/login')
      }, 100)
    } else if (user && (pathname === '/login' || pathname === '/register')) {
      console.log('🔀 Redirecting to dashboard from auth page')
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    }
  }, [user, isLoading, isInitialized, pathname, router])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      
      console.log('🔐 Attempting login for:', email)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // IMPORTANT: This ensures cookies are sent/received
      })

      if (!response.ok) {
        const error = await response.json()
        console.log('❌ Login failed:', error)
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      console.log('✅ Login successful for:', data.user.email)
      
      // Update user state immediately
      setUser(data.user)
      
      // Wait a moment for cookies to be properly set
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Force a page refresh to ensure all cookies are loaded
      // This is more reliable than client-side redirect for auth state
      window.location.href = '/dashboard'
      
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Logging out...')
      
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      
      // Clear local state
      setUser(null)
      
      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect to login even if API call fails
      setUser(null)
      window.location.href = '/login'
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const value = {
    user,
    isLoading,
    isInitialized,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}