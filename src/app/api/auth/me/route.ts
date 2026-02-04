// /app/api/auth/me/route.ts - ADD THIS FILE
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token
    const user = await verifyToken(token)
    
    if (!user) {
      // Clear invalid cookies
      const response = NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
      response.cookies.delete('auth_token')
      response.cookies.delete('user_role')
      return response
    }

    return NextResponse.json(user)
    
  } catch (error) {
    console.error('Error in auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}