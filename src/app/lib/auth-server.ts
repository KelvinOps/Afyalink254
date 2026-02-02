// src/app/lib/auth-server.ts
// This file contains server-only authentication utilities

import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { 
  User, 
  UserRole, 
  createUserObject, 
  ensureBasicPermissions,
  JWT_SECRET 
} from './auth'

// Server-only function to sign tokens
export async function signToken(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

// Server-only function to verify tokens
export async function verifyToken(token: string): Promise<any> {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '')
    const { payload } = await jwtVerify(cleanToken, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

// Server-only function to get current user from cookies
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Get the auth cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }
    
    // Verify the token
    const payload = await verifyToken(token)
    if (!payload) {
      return null
    }
    
    // Create user object from payload
    const user = createUserObject(payload)
    
    // Ensure basic permissions
    return ensureBasicPermissions(user)
    
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Server-only function to require authentication
export async function requireAuth(redirectTo: string = '/login'): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect(redirectTo)
  }
  
  return user
}

// Server-only function to check module access
export async function checkModuleAccess(module: string, redirectTo: string = '/unauthorized'): Promise<User> {
  const user = await requireAuth('/login')
  
  const { canAccessModule } = await import('./auth')
  if (!canAccessModule(user, module)) {
    redirect(redirectTo)
  }
  
  return user
}