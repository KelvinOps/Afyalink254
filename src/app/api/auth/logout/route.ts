// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auditLog, AuditAction } from '@/app/lib/audit'

export async function POST(request: NextRequest) {
  try {
    // Get user from token before clearing cookies
    const token = request.cookies.get('auth_token')?.value
    let userName = 'Unknown'
    
    if (token) {
      try {
        const { verifyToken } = await import('@/app/lib/auth')
        const user = await verifyToken(token)
        if (user) {
          userName = user.name
          
          // Log logout action
          await auditLog({
            action: AuditAction.LOGOUT,
            entityType: 'USER',
            entityId: user.id,
            userId: user.id,
            userRole: user.role,
            userName: user.name,
            description: 'User logged out from the system',
            success: true
          })
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