// src/lib/get-current-user.ts
import { cookies } from 'next/headers'
import { verifyToken, createUserObject, ensureBasicPermissions, User } from './auth'

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return null
    }

    // Create user object from token payload
    const user = createUserObject(payload)
    
    // Ensure basic permissions are set
    return ensureBasicPermissions(user)
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}