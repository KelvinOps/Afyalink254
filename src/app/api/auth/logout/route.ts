// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auditActions } from '@/app/lib/audit'

export async function POST(request: NextRequest) {
  try {
    // Get user from token before clearing cookies
    const token = request.cookies.get('auth_token')?.value
    let userName = 'Unknown'
    let userId = 'unknown'
    let userRole = 'unknown'
    
    if (token) {
      try {
        const { verifyToken } = await import('@/app/lib/auth')
        const user = await verifyToken(token)
        if (user) {
          userName = user.name
          userId = user.id
          userRole = user.role
          
          // Get IP and user agent
          const ipAddress = request.headers.get('x-forwarded-for') || 
                           request.headers.get('x-real-ip') || 
                           'unknown'
          const userAgent = request.headers.get('user-agent') || undefined
          
          // Log logout action using queue (non-blocking)
          auditActions.logLogout(
            user.id,
            user.role,
            user.name,
            ipAddress,
            userAgent
          )
          
          console.log('✅ Logout audit queued for:', user.email)
        }
      } catch (error) {
        console.log('Unable to verify token during logout:', error)
      }
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logout successful',
      user: userName
    })

    // Clear all auth cookies
    const cookiesToClear = [
      'auth_token',
      'user_role', 
      'user_permissions',
      'refreshToken',
      'user_id',
      'facility_id',
      'county_id',
      'redirect_url'
    ]

    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName)
    })

    console.log('✅ User logged out:', userName)

    return response

  } catch (error) {
    console.error('💥 Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}