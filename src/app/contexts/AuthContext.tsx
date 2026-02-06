// app/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserToken, hasPermission as checkHasPermission, ensureBasicPermissions, normalizeRole } from '@/app/lib/auth'

interface AuthContextType {
  user: UserToken | null
  isLoading: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (permission: string) => boolean
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

  // Check authentication status
  const checkAuth = useCallback(async (force = false) => {
    // Prevent duplicate checks unless forced
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
        console.log('✅ User authenticated:', userData.email, 'Role:', userData.role)
        console.log('📦 Raw user data from API:', userData)
        
        // Ensure user has proper permissions
        const userWithPermissions = ensureBasicPermissions(userData)
        
        console.log('🔐 User after ensureBasicPermissions:')
        console.log('   - Email:', userWithPermissions.email)
        console.log('   - Role:', userWithPermissions.role)
        console.log('   - Permissions count:', userWithPermissions.permissions?.length || 0)
        console.log('   - First 10 permissions:', userWithPermissions.permissions?.slice(0, 10))
        
        setUser(userWithPermissions)
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

  // Initial auth check on mount
  useEffect(() => {
    if (!isInitialized) {
      checkAuth()
    }
  }, [checkAuth, isInitialized])

  // Redirect logic for protected routes
  useEffect(() => {
    if (!isInitialized || isLoading) return

    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/unauthorized']
    const isPublicPath = publicPaths.includes(pathname || '') || 
                        pathname?.startsWith('/api/') ||
                        pathname?.includes('.')

    // Redirect to login if accessing protected route without authentication
    if (pathname && !isPublicPath && !user && isInitialized && !isLoading) {
      console.log('🔒 Redirecting to login from protected route:', pathname)
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [user, isLoading, isInitialized, pathname, router])

  // Login function
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
      console.log('✅ Login successful for:', data.user?.email)
      console.log('📦 Raw login response:', data.user)
      
      // Ensure user has proper permissions
      const userWithPermissions = ensureBasicPermissions(data.user)
      
      console.log('🔐 User after login ensureBasicPermissions:')
      console.log('   - Email:', userWithPermissions.email)
      console.log('   - Role:', userWithPermissions.role)
      console.log('   - Permissions count:', userWithPermissions.permissions?.length || 0)
      console.log('   - Sample permissions:', userWithPermissions.permissions?.slice(0, 10))
      
      setUser(userWithPermissions)
      
      // Redirect to dashboard
      window.location.href = '/dashboard'
      
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
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

  // Refresh user data
  const refreshUser = async () => {
    await checkAuth(true)
  }

  // hasPermission function using your auth.ts utility
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) {
      console.log('❌ hasPermission check: No user logged in')
      return false
    }
    
    const normalizedRole = normalizeRole(user.role)
    console.log(`🔑 Checking permission "${permission}" for user ${user.email} (role: ${normalizedRole})`)
    console.log(`📊 User has ${user.permissions?.length || 0} permissions`)
    
    const result = checkHasPermission(user, permission)
    
    return result
  }, [user])

  const value: AuthContextType = {
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

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}