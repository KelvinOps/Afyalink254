import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    })

    // Clear the refresh token cookie
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}