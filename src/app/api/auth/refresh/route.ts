//api/auth/refresh/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken } from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      )
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Generate new access token
    const newAccessToken = await signToken({
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      hospitalId: payload.hospitalId,
      facilityId: payload.facilityId,
      countyId: payload.countyId,
      facilityType: payload.facilityType,
      firstName: payload.firstName,
      lastName: payload.lastName,
      permissions: payload.permissions
    })

    return NextResponse.json({
      accessToken: newAccessToken,
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    
    // Clear invalid refresh token
    const response = NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    )
    
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    })

    return response
  }
}