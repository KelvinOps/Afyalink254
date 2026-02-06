// /app/api/auth/me/route.ts 
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, ensureBasicPermissions, normalizeRole } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      console.log('❌ /api/auth/me: No auth token found')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token
    const user = await verifyToken(token)
    
    if (!user) {
      console.log('❌ /api/auth/me: Token verification failed')
      // Clear invalid cookies
      const response = NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
      response.cookies.delete('auth_token')
      response.cookies.delete('user_role')
      return response
    }

    console.log('✅ /api/auth/me: Token verified for user:', user.email, 'Role:', user.role)
    console.log('📦 User from token:', {
      email: user.email,
      role: user.role,
      permissionsCount: user.permissions?.length || 0
    })
    
    // Ensure user has proper permissions based on role
    const userWithPermissions = ensureBasicPermissions(user)
    
    console.log('🔐 /api/auth/me: After ensureBasicPermissions:')
    console.log('   - Role:', userWithPermissions.role)
    console.log('   - Permissions count:', userWithPermissions.permissions?.length || 0)
    console.log('   - Sample permissions:', userWithPermissions.permissions?.slice(0, 5))

    return NextResponse.json(userWithPermissions)
    
  } catch (error) {
    console.error('❌ Error in auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}