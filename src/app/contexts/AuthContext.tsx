// /app/contexts/AuthContext.tsx 
'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserToken, hasPermission as checkHasPermission } from '@/app/lib/auth'

interface AuthContextType {
  user: UserToken | null
  isLoading: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (permission: string) => boolean  // Add this
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
  const authCheckRef = useRef(false)

  const checkAuth = useCallback(async (force = false) => {
    if ((authCheckRef.current && !force) || (!force && isInitialized)) {
      return
    }

    try {
      authCheckRef.current = true
      setIsLoading(true)
      
      console.log('🔍 Checking authentication status...')
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      })
      
      if (response.ok) {
        const userData = await response.json()
        console.log('✅ User authenticated:', userData.email)
        setUser(userData)
      } else {
        console.log('❌ No valid session found')
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
      authCheckRef.current = false
    }
  }, [isInitialized])

  useEffect(() => {
    if (!isInitialized) {
      checkAuth()
    }
  }, [checkAuth, isInitialized])

  useEffect(() => {
    if (!isInitialized || isLoading) return

    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/unauthorized']
    const isPublicPath = publicPaths.includes(pathname || '') || 
                        pathname?.startsWith('/api/') ||
                        pathname?.includes('.')

    if (pathname && !isPublicPath && !user && isInitialized && !isLoading) {
      console.log('🔒 Redirecting to login from protected route:', pathname)
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [user, isLoading, isInitialized, pathname, router])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      
      console.log('🔐 Logging in:', email)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      console.log('✅ Login successful')
      
      setUser(data.user)
      
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
      
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      setUser(null)
      window.location.href = '/'
    }
  }

  const refreshUser = async () => {
    await checkAuth(true)
  }

  // CRITICAL FIX: Add hasPermission function to context
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    return checkHasPermission(user, permission)
  }, [user])

  const value = {
    user,
    isLoading,
    isInitialized,
    login,
    logout,
    refreshUser,
    hasPermission,  
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