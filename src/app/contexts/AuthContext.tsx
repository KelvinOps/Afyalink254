// src/app/contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, canAccessModule, ROLE_PERMISSIONS, ensureBasicPermissions } from '../lib/auth'

// Extend the User type to include all possible role formats
type ExtendedUser = User & { 
  role: 'SUPER_ADMIN' | 'COUNTY_ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'NURSE' | 'TRIAGE_OFFICER' | 'DISPATCHER' | 'AMBULANCE_DRIVER' | 'FINANCE_OFFICER' | 'LAB_TECHNICIAN' | 'PHARMACIST' | string 
}

interface AuthContextType {
  user: ExtendedUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isInitialized: boolean
  hasPermission: (permission: string) => boolean
  canAccess: (module: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Enhanced helper function to check if user is super admin
const isSuperAdmin = (user: ExtendedUser | null): boolean => {
  if (!user) return false
  const normalizedRole = normalizeRole(user.role)
  console.log('🔍 Checking super admin for role:', user.role, '->', normalizedRole)
  return normalizedRole === 'SUPER_ADMIN'
}

// Enhanced helper to normalize any role string to our UserRole type
const normalizeRole = (role: string): string => {
  console.log('🔄 Normalizing role:', role)
  
  const roleMap: Record<string, string> = {
    // Handle case variations and database-specific values
    'super_admin': 'SUPER_ADMIN',
    'superadmin': 'SUPER_ADMIN',
    'SUPERADMIN': 'SUPER_ADMIN',
    'administrator': 'SUPER_ADMIN',
    'ADMINISTRATOR': 'SUPER_ADMIN',
    
    'county_admin': 'COUNTY_ADMIN',
    'countyadmin': 'COUNTY_ADMIN',
    'COUNTYADMIN': 'COUNTY_ADMIN',
    
    'hospital_admin': 'HOSPITAL_ADMIN',
    'hospitaladmin': 'HOSPITAL_ADMIN',
    'HOSPITALADMIN': 'HOSPITAL_ADMIN',
    
    'doctor': 'DOCTOR',
    'DOCTOR': 'DOCTOR',
    'medical_officer': 'DOCTOR',
    'MEDICAL_OFFICER': 'DOCTOR',
    
    'nurse': 'NURSE',
    'NURSE': 'NURSE',
    
    'triage_officer': 'TRIAGE_OFFICER',
    'triageofficer': 'TRIAGE_OFFICER',
    'TRIAGE_OFFICER': 'TRIAGE_OFFICER',
    'TRIAGEOFFICER': 'TRIAGE_OFFICER',
    'triage_nurse': 'TRIAGE_OFFICER',
    'TRIAGE_NURSE': 'TRIAGE_OFFICER',
    
    'dispatcher': 'DISPATCHER',
    'DISPATCHER': 'DISPATCHER',
    
    'ambulance_driver': 'AMBULANCE_DRIVER',
    'ambulancedriver': 'AMBULANCE_DRIVER',
    'AMBULANCE_DRIVER': 'AMBULANCE_DRIVER',
    'AMBULANCEDRIVER': 'AMBULANCE_DRIVER',
    
    'finance_officer': 'FINANCE_OFFICER',
    'financeofficer': 'FINANCE_OFFICER',
    'FINANCE_OFFICER': 'FINANCE_OFFICER',
    'FINANCEOFFICER': 'FINANCE_OFFICER',
    
    'lab_technician': 'LAB_TECHNICIAN',
    'labtechnician': 'LAB_TECHNICIAN',
    'LAB_TECHNICIAN': 'LAB_TECHNICIAN',
    'LABTECHNICIAN': 'LAB_TECHNICIAN',
    
    'pharmacist': 'PHARMACIST',
    'PHARMACIST': 'PHARMACIST'
  }

  const normalized = roleMap[role.toLowerCase()] || role.toUpperCase()
  console.log('🎯 Final normalized role:', normalized)
  return normalized
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔄 AuthContext checking authentication...')
        
        const token = localStorage.getItem('accessToken')
        const userData = localStorage.getItem('user')
        
        console.log('📦 Storage check:', { 
          token: !!token, 
          userData: !!userData 
        })
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          console.log('👤 Raw user from storage:', parsedUser)
          
          // Ensure the user has basic permissions with enhanced debugging
          const userWithPermissions = ensureBasicPermissions(parsedUser)
          console.log('✅ User with permissions:', userWithPermissions)
          
          // Normalize the user role
          const normalizedUser = {
            ...userWithPermissions,
            role: normalizeRole(userWithPermissions.role)
          } as ExtendedUser
          
          console.log('🎯 Final normalized user:', normalizedUser)
          setUser(normalizedUser)
        } else {
          console.log('❌ No token or user data found in storage')
          setUser(null)
        }
      } catch (error) {
        console.error('💥 Auth check failed:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    checkAuth()

    // Listen for storage changes to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const parsedUser = JSON.parse(e.newValue)
          const normalizedUser = {
            ...ensureBasicPermissions(parsedUser),
            role: normalizeRole(parsedUser.role)
          } as ExtendedUser
          setUser(normalizedUser)
        } catch (error) {
          console.error('Error parsing storage user data:', error)
        }
      } else if (e.key === 'user' && e.newValue === null) {
        setUser(null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

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

      const data = await response.json()

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Ensure permissions and update context state with normalized role
        const userWithPermissions = ensureBasicPermissions(data.user)
        const normalizedUser = {
          ...userWithPermissions,
          role: normalizeRole(userWithPermissions.role)
        } as ExtendedUser
        
        console.log('✅ Login successful, normalized user set:', normalizedUser)
        setUser(normalizedUser)
        setIsInitialized(true)
        
        // Navigate to dashboard - the dashboard layout will handle the redirect
        router.push('/dashboard')
      } else {
        throw new Error(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('💥 Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    console.log('🚪 Logging out user...')
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) {
      console.log('🚫 No user for permission check')
      return false
    }
    
    console.log('🔐 Checking permission:', {
      permission,
      userRole: user.role,
      userPermissions: user.permissions,
      isSuperAdmin: isSuperAdmin(user)
    })
    
    // SUPER_ADMIN always has all permissions
    if (isSuperAdmin(user)) {
      console.log(`✅ SUPER_ADMIN access granted for permission: ${permission}`)
      return true
    }
    
    const hasPerm = user.permissions?.includes(permission) || user.permissions?.includes('*')
    console.log(`📋 Permission check for ${permission}: ${hasPerm}`)
    return hasPerm
  }

  const canAccess = (module: string): boolean => {
    if (!user) return false
    
    // SUPER_ADMIN always has access to all modules
    if (isSuperAdmin(user)) {
      console.log(`✅ SUPER_ADMIN access granted for module: ${module}`)
      return true
    }
    
    return canAccessModule(user, module)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading,
      isInitialized,
      hasPermission,
      canAccess
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