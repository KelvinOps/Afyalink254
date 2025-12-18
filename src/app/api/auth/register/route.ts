import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { signToken, createUserObject, UserRole } from '@/app/lib/auth'

// Map UserRole to Prisma StaffRole
function mapUserRoleToStaffRole(userRole: UserRole): any {
  const roleMap: Record<UserRole, any> = {
    'SUPER_ADMIN': 'ADMINISTRATOR',
    'COUNTY_ADMIN': 'ADMINISTRATOR', 
    'HOSPITAL_ADMIN': 'HOSPITAL_DIRECTOR',
    'DOCTOR': 'MEDICAL_OFFICER',
    'NURSE': 'NURSE',
    'TRIAGE_OFFICER': 'TRIAGE_NURSE',
    'DISPATCHER': 'DISPATCHER',
    'AMBULANCE_DRIVER': 'AMBULANCE_DRIVER',
    'FINANCE_OFFICER': 'ADMINISTRATOR',
    'LAB_TECHNICIAN': 'LAB_TECHNICIAN',
    'PHARMACIST': 'PHARMACIST'
  }
  return roleMap[userRole] || 'SUPPORT_STAFF'
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

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.staff.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    // Generate staff number - FIXED SYNTAX
    const staffCount = await prisma.staff.count()
    const staffNumber = `STAFF${String(staffCount + 1).padStart(6, '0')}`

    // Map UserRole to Prisma StaffRole
    const staffRole = mapUserRoleToStaffRole(role as UserRole)

    // Create user
    const user = await prisma.staff.create({
      data: {
        userId: email,
        staffNumber,
        email,
        firstName,
        lastName,
        phone,
        role: staffRole, // Use mapped role
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
      },
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

    // Determine facility and county
    let facilityId = null
    let countyId = null
    let facilityTypeName = null
    let facilityName = null

    if (user.hospital) {
      facilityId = user.hospital.id
      countyId = user.hospital.county.id
      facilityTypeName = 'HOSPITAL'
      facilityName = user.hospital.name
    } else if (user.healthCenter) {
      facilityId = user.healthCenter.id
      countyId = user.healthCenter.county.id
      facilityTypeName = 'HEALTH_CENTER'
      facilityName = user.healthCenter.name
    } else if (user.dispensary) {
      facilityId = user.dispensary.id
      countyId = user.dispensary.county.id
      facilityTypeName = 'DISPENSARY'
      facilityName = user.dispensary.name
    }

    // Create user object with permissions
    const userObj = createUserObject({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: role as UserRole, // Keep original UserRole for frontend
      facilityId,
      countyId
    })

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: userObj.role, // Use the UserRole from userObj
      facilityId,
      countyId,
      permissions: userObj.permissions
    }

    const accessToken = await signToken(tokenPayload)

    // Create response
    const response = NextResponse.json({
      user: userObj,
      accessToken,
    })

    // Set refresh token as httpOnly cookie
    response.cookies.set('refreshToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}