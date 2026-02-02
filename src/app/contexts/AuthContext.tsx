// app/contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: string
  firstName: string
  lastName: string
  facilityId?: string
  countyId?: string
  facilityName?: string
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for token in localStorage
        const token = localStorage.getItem('accessToken')
        
        if (token) {
          try {
            // Verify token with API
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (response.ok) {
              const userData = await response.json()
              setUser(userData)
              localStorage.setItem('user', JSON.stringify(userData))
            } else {
              // Token is invalid, clear it
              clearAuthData()
            }
          } catch (error) {
            console.error('Token validation error:', error)
            clearAuthData()
          }
        } else {
          // Check for auth_token cookie (set by middleware)
          // This is a fallback for when localStorage is cleared but cookies remain
          const checkCookieAuth = async () => {
            try {
              const response = await fetch('/api/auth/me')
              if (response.ok) {
                const userData = await response.json()
                setUser(userData)
                localStorage.setItem('user', JSON.stringify(userData))
              }
            } catch (error) {
              console.error('Cookie auth check failed:', error)
            }
          }
          await checkCookieAuth()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        clearAuthData()
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  const clearAuthData = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      
      // Store token and user data in localStorage
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      
      // Force a page reload to trigger middleware and load dashboard
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
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthData()
      // Force page reload to clear all state
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      isInitialized,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}