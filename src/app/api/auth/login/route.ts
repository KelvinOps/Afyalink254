// api/auth/login/route.ts 
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { createToken } from '@/app/lib/jwt'
import { normalizeRole, getPermissionsForRole } from '@/app/lib/auth'
import bcrypt from 'bcryptjs'
import { auditLog, AuditAction } from '@/app/lib/audit'

// Helper function to get client IP address
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',')
    return ips[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return '127.0.0.1'
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    console.log('🔐 Login attempt for:', email)
    console.log('📱 Client details:', { ipAddress, userAgent })

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
      await auditLog({
        action: AuditAction.LOGIN,
        entityType: 'USER',
        entityId: email,
        userId: 'unknown',
        userRole: 'unknown',
        userName: 'Unknown',
        description: `Failed login attempt - user not found`,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'User not found'
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      console.log('❌ User account inactive:', email)
      await auditLog({
        action: AuditAction.LOGIN,
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        userRole: user.role,
        userName: `${user.firstName} ${user.lastName}`,
        description: `Failed login attempt - account inactive`,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Account inactive'
      })
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact administrator.' },
        { status: 401 }
      )
    }

    // ============================================
    // IMPROVED PASSWORD VALIDATION LOGIC
    // ============================================
    const isDemoUser = email.includes('@health.go.ke')
    let isValidPassword = false

    console.log('🔍 Password validation details:', {
      email,
      isDemoUser,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash?.length || 0,
      passwordLength: password?.length || 0
    })

    // Case 1: Demo users with standard demo password
    if (isDemoUser && password === 'demo123') {
      console.log('🔑 Demo user login with demo123 password')
      isValidPassword = true
    }
    // Case 2: Regular users with hashed passwords
    else if (user.passwordHash && user.passwordHash.length > 0) {
      console.log('🔑 Using bcrypt validation for registered user')
      console.log('   - Hash starts with:', user.passwordHash.substring(0, 10))
      console.log('   - Password to verify:', password)
      
      try {
        // Validate the hash format
        const isBcryptHash = user.passwordHash.startsWith('$2a$') || 
                            user.passwordHash.startsWith('$2b$') || 
                            user.passwordHash.startsWith('$2y$')
        
        if (!isBcryptHash) {
          console.error('❌ Invalid bcrypt hash format!')
          console.error('   Hash:', user.passwordHash.substring(0, 20))
          isValidPassword = false
        } else {
          // Perform bcrypt comparison
          isValidPassword = await bcrypt.compare(password, user.passwordHash)
          console.log('🔑 Bcrypt comparison result:', isValidPassword)
          
          // Additional debug info if failed
          if (!isValidPassword) {
            console.log('❌ Password mismatch details:')
            console.log('   - Provided password length:', password.length)
            console.log('   - Hash format looks valid:', isBcryptHash)
            
            // Test with a fresh hash of the same password (for debugging only)
            const testHash = await bcrypt.hash(password, 10)
            const testResult = await bcrypt.compare(password, testHash)
            console.log('   - Test hash comparison (should be true):', testResult)
          }
        }
      } catch (bcryptError: any) {
        console.error('❌ Bcrypt comparison error:', bcryptError.message)
        console.error('   Stack:', bcryptError.stack)
        isValidPassword = false
      }
    }
    // Case 3: User without password hash (shouldn't happen for registered users)
    else {
      console.log('⚠️ User has no passwordHash stored')
      // For demo users only, allow demo123
      if (isDemoUser && password === 'demo123') {
        isValidPassword = true
        console.log('🔑 Demo user allowed with demo123 despite missing hash')
      } else {
        isValidPassword = false
      }
    }

    console.log('🔑 Final password validation result:', isValidPassword)

    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email)
      await auditLog({
        action: AuditAction.LOGIN,
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        userRole: user.role,
        userName: `${user.firstName} ${user.lastName}`,
        description: `Failed login attempt - invalid password`,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Invalid password'
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ============================================
    // DETERMINE FACILITY AND COUNTY
    // ============================================
    let facilityId: string | undefined = undefined
    let countyId: string | undefined = undefined
    let facilityType: string | undefined = undefined
    let facilityName: string | undefined = undefined

    if (user.hospital) {
      facilityId = user.hospital.id
      countyId = user.hospital.county?.id || undefined
      facilityType = 'HOSPITAL'
      facilityName = user.hospital.name
      console.log('🏥 User belongs to hospital:', facilityName)
    } else if (user.healthCenter) {
      facilityId = user.healthCenter.id
      countyId = user.healthCenter.county?.id || undefined
      facilityType = 'HEALTH_CENTER'
      facilityName = user.healthCenter.name
      console.log('🏥 User belongs to health center:', facilityName)
    } else if (user.dispensary) {
      facilityId = user.dispensary.id
      countyId = user.dispensary.county?.id || undefined
      facilityType = 'DISPENSARY'
      facilityName = user.dispensary.name
      console.log('🏥 User belongs to dispensary:', facilityName)
    } else {
      console.log('🏥 User has no facility assignment')
    }

    // Get normalized role and permissions
    const normalizedRole = normalizeRole(user.role)
    const permissions = getPermissionsForRole(normalizedRole)

    // Create user object
    const userObj = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      role: normalizedRole,
      facilityId,
      countyId,
      facilityName,
      facilityType,
      permissions
    }

    console.log('✅ User object created with permissions:', userObj.permissions.length)

    // Generate token with all necessary user data
    const tokenPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      name: userObj.name,
      role: normalizedRole,
      facilityId,
      countyId,
      facilityName,
      facilityType,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions
    }

    const accessToken = await createToken(tokenPayload)
    console.log('🔐 Token generated successfully')

    // Create response
    const response = NextResponse.json({
      user: userObj,
      accessToken,
      message: 'Login successful'
    })

    // Set all cookies
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('user_role', normalizedRole, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('user_permissions', permissions.join(','), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('refreshToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    if (facilityId) {
      response.cookies.set('facility_id', facilityId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/',
      })
    }

    if (countyId) {
      response.cookies.set('county_id', countyId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/',
      })
    }

    // Log successful login
    await auditLog({
      action: AuditAction.LOGIN,
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      userRole: normalizedRole,
      userName: userObj.name,
      description: `User logged into the system`,
      ipAddress,
      userAgent,
      facilityId: facilityId || undefined,
      success: true
    })

    // Update last login time
    try {
      await prisma.staff.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
      console.log('📝 Updated last login time for user')
    } catch (error) {
      console.log('⚠️ Could not update lastLoginAt (field might not exist in schema)')
    }

    console.log('🎉 Login successful for:', email)
    console.log('🍪 Cookies set:', {
      auth_token: '✓',
      user_role: normalizedRole,
      user_permissions: permissions.length,
      user_id: user.id,
      facility_id: facilityId || 'none',
      county_id: countyId || 'none'
    })

    return response

  } catch (error) {
    console.error('💥 Login error:', error)
    
    // Log error
    try {
      await auditLog({
        action: AuditAction.LOGIN,
        entityType: 'USER',
        entityId: 'unknown',
        userId: 'system',
        userRole: 'SYSTEM',
        userName: 'Login System',
        description: `Login system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError)
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}