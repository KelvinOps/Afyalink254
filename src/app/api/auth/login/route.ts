// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { signToken, createUserObject, UserRole } from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('🔐 Login attempt for email:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.staff.findUnique({
      where: { email },
      include: {
        hospital: {
          include: {
            county: true
          }
        },
        healthCenter: {
          include: {
            county: true
          }
        },
        dispensary: {
          include: {
            county: true
          }
        },
        department: true,
      },
    })

    console.log('👤 User found:', user ? `Yes (${user.firstName} ${user.lastName})` : 'No')

    if (!user) {
      console.log('❌ No user found with email:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      console.log('❌ User account inactive:', email)
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact administrator.' },
        { status: 401 }
      )
    }

    // Verify password - for demo purposes, using simple check
    // In production, you should use proper password hashing
    const isValidPassword = password === 'demo123'

    console.log('🔑 Password valid:', isValidPassword)

    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Determine facility and county
    let facilityId = null
    let countyId = null
    let facilityType = null
    let facilityName = null

    if (user.hospital) {
      facilityId = user.hospital.id
      countyId = user.hospital.county?.id || null
      facilityType = 'HOSPITAL'
      facilityName = user.hospital.name
      console.log('🏥 User belongs to hospital:', facilityName)
    } else if (user.healthCenter) {
      facilityId = user.healthCenter.id
      countyId = user.healthCenter.county?.id || null
      facilityType = 'HEALTH_CENTER'
      facilityName = user.healthCenter.name
      console.log('🏥 User belongs to health center:', facilityName)
    } else if (user.dispensary) {
      facilityId = user.dispensary.id
      countyId = user.dispensary.county?.id || null
      facilityType = 'DISPENSARY'
      facilityName = user.dispensary.name
      console.log('🏥 User belongs to dispensary:', facilityName)
    } else {
      console.log('🏥 User has no facility assignment')
    }

    // Create user object with permissions using your existing auth structure
    const userObj = createUserObject({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      facilityId,
      countyId
    })

    console.log('✅ User object created with permissions:', userObj.permissions)

    // Generate tokens using your existing auth structure
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      facilityId,
      countyId,
      permissions: userObj.permissions
    }

    const accessToken = await signToken(tokenPayload)
    console.log('🔐 Token generated successfully')

    // Create response
    const response = NextResponse.json({
      user: userObj,
      accessToken,
      message: 'Login successful'
    })

    // Set refresh token as httpOnly cookie
    response.cookies.set('refreshToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    console.log('🎉 Login successful for:', email)
    return response

  } catch (error) {
    console.error('💥 Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}