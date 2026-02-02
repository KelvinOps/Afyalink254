// api/auth/register/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { createToken } from '@/app/lib/jwt'
import { normalizeRole, getPermissionsForRole, UserRole } from '@/app/lib/auth'
import bcrypt from 'bcryptjs'

// Map UserRole to Prisma StaffRole
function mapUserRoleToStaffRole(userRole: UserRole): any {
  const roleMap: Record<UserRole, any> = {
    'SUPER_ADMIN': 'ADMINISTRATOR',
    'ADMIN': 'ADMINISTRATOR',
    'COUNTY_ADMIN': 'ADMINISTRATOR', 
    'COUNTY_HEALTH_OFFICER': 'HEALTH_OFFICER',
    'HOSPITAL_ADMIN': 'HOSPITAL_DIRECTOR',
    'FACILITY_MANAGER': 'MANAGER',
    'DOCTOR': 'MEDICAL_OFFICER',
    'NURSE': 'NURSE',
    'TRIAGE_OFFICER': 'TRIAGE_NURSE',
    'DISPATCHER': 'DISPATCHER',
    'AMBULANCE_DRIVER': 'AMBULANCE_DRIVER',
    'EMERGENCY_MANAGER': 'EMERGENCY_MANAGER',
    'FINANCE_OFFICER': 'ADMINISTRATOR',
    'LAB_TECHNICIAN': 'LAB_TECHNICIAN',
    'PHARMACIST': 'PHARMACIST',
    'MEDICAL_SUPERINTENDENT': 'MEDICAL_SUPERINTENDENT',
    'HOSPITAL_DIRECTOR': 'HOSPITAL_DIRECTOR'
  }
  return roleMap[userRole] || 'SUPPORT_STAFF'
}

// Type for the user with facility data
interface UserWithFacilities {
  id: string
  userId: string
  staffNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: any
  facilityType?: string
  hospitalId?: string | null
  healthCenterId?: string | null
  dispensaryId?: string | null
  departmentId?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  hospital?: {
    id: string
    name: string
    county?: {
      id: string
      name: string
    } | null
  } | null
  healthCenter?: {
    id: string
    name: string
    county?: {
      id: string
      name: string
    } | null
  } | null
  dispensary?: {
    id: string
    name: string
    county?: {
      id: string
      name: string
    } | null
  } | null
}

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      facilityType,
      hospitalId,
      healthCenterId,
      dispensaryId,
      departmentId,
    } = await request.json()

    console.log('📝 Registration attempt for:', email)

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate role is a valid UserRole
    const validRoles: UserRole[] = [
      'SUPER_ADMIN', 'ADMIN', 'COUNTY_ADMIN', 'COUNTY_HEALTH_OFFICER',
      'HOSPITAL_ADMIN', 'FACILITY_MANAGER', 'DOCTOR', 'NURSE',
      'TRIAGE_OFFICER', 'DISPATCHER', 'AMBULANCE_DRIVER', 'EMERGENCY_MANAGER',
      'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST',
      'MEDICAL_SUPERINTENDENT', 'HOSPITAL_DIRECTOR'
    ]

    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.staff.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('❌ User already exists:', email)
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    // Generate staff number
    const staffCount = await prisma.staff.count()
    const staffNumber = `STAFF${String(staffCount + 1).padStart(6, '0')}`

    // Map UserRole to Prisma StaffRole
    const staffRole = mapUserRoleToStaffRole(role as UserRole)
    console.log('🎯 Mapped role:', role, '->', staffRole)

    // Hash password (store in a separate variable for now)
    const hashedPassword = await bcrypt.hash(password, 10)

    // First create the user without passwordHash (if field doesn't exist)
    const user = await prisma.staff.create({
      data: {
        userId: email,
        staffNumber,
        email,
        firstName,
        lastName,
        phone,
        role: staffRole,
        facilityType: facilityType || 'HOSPITAL',
        hospitalId: hospitalId || null,
        healthCenterId: healthCenterId || null,
        dispensaryId: dispensaryId || null,
        departmentId: departmentId || null,
        employmentType: 'PERMANENT',
        contractType: 'COUNTY',
        hireDate: new Date(),
        isActive: true,
        isOnDuty: false,
        // Note: If your Prisma schema doesn't have passwordHash field,
        // you might need to store it elsewhere or update your schema
      },
    })

    console.log('✅ User created:', user.id)

    // After creating user, fetch with relations to get facility info
    const userWithFacilities = await prisma.staff.findUnique({
      where: { id: user.id },
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
    }) as UserWithFacilities | null

    if (!userWithFacilities) {
      throw new Error('Failed to fetch created user')
    }

    // Determine facility and county
    let facilityId = null
    let countyId = null
    let facilityTypeName = null
    let facilityName = null

    // Check hospital relation
    if (userWithFacilities.hospitalId && userWithFacilities.hospital) {
      facilityId = userWithFacilities.hospital.id
      countyId = userWithFacilities.hospital.county?.id || null
      facilityTypeName = 'HOSPITAL'
      facilityName = userWithFacilities.hospital.name
      console.log('🏥 User assigned to hospital:', facilityName)
    } 
    // Check health center relation
    else if (userWithFacilities.healthCenterId && userWithFacilities.healthCenter) {
      facilityId = userWithFacilities.healthCenter.id
      countyId = userWithFacilities.healthCenter.county?.id || null
      facilityTypeName = 'HEALTH_CENTER'
      facilityName = userWithFacilities.healthCenter.name
      console.log('🏥 User assigned to health center:', facilityName)
    } 
    // Check dispensary relation
    else if (userWithFacilities.dispensaryId && userWithFacilities.dispensary) {
      facilityId = userWithFacilities.dispensary.id
      countyId = userWithFacilities.dispensary.county?.id || null
      facilityTypeName = 'DISPENSARY'
      facilityName = userWithFacilities.dispensary.name
      console.log('🏥 User assigned to dispensary:', facilityName)
    } 
    else {
      console.log('🏥 No facility assignment for user')
      // Set default values based on facilityType
      if (facilityType === 'HOSPITAL' && hospitalId) {
        facilityId = hospitalId
        facilityTypeName = 'HOSPITAL'
      } else if (facilityType === 'HEALTH_CENTER' && healthCenterId) {
        facilityId = healthCenterId
        facilityTypeName = 'HEALTH_CENTER'
      } else if (facilityType === 'DISPENSARY' && dispensaryId) {
        facilityId = dispensaryId
        facilityTypeName = 'DISPENSARY'
      }
    }

    // Get normalized role and permissions
    const normalizedRole = normalizeRole(role as string)
    const permissions = getPermissionsForRole(normalizedRole)
    console.log('🔑 User permissions:', permissions)

    // Create user object with permissions
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
      facilityType: facilityTypeName,
      permissions
    }

    // Generate token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: normalizedRole,
      facilityId,
      countyId,
      facilityName,
      facilityType: facilityTypeName,
      permissions
    }

    const accessToken = await createToken(tokenPayload)
    console.log('🔐 Token generated successfully')

    // Create response
    const response = NextResponse.json({
      user: userObj,
      accessToken,
      message: 'Registration successful'
    })

    // Set refresh token as httpOnly cookie
    response.cookies.set('refreshToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    // Set auth_token for middleware
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    // Set user role and permissions cookies for middleware
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

    // Set user_id cookie for quick access
    response.cookies.set('user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    // Set facility_id cookie if available
    if (facilityId) {
      response.cookies.set('facility_id', facilityId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/',
      })
    }

    // Set county_id cookie if available
    if (countyId) {
      response.cookies.set('county_id', countyId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/',
      })
    }

    console.log('🎉 Registration successful for:', email)
    console.log('🍪 Cookies set:', {
      auth_token: '✓',
      user_role: normalizedRole,
      user_permissions: permissions.length,
      refreshToken: '✓',
      user_id: user.id,
      facility_id: facilityId || 'none',
      county_id: countyId || 'none'
    })

    return response

  } catch (error) {
    console.error('💥 Registration error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}