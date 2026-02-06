// api/auth/register/route.ts 
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { createToken } from '@/app/lib/auth'
import { normalizeRole, getPermissionsForRole, UserRole } from '@/app/lib/auth'
import bcrypt from 'bcryptjs'

// Map UserRole to Prisma StaffRole
function mapUserRoleToStaffRole(userRole: UserRole): any {
  const roleMap: Record<UserRole, any> = {
    'SUPER_ADMIN': 'ADMINISTRATOR',
    'ADMIN': 'ADMINISTRATOR',
    'COUNTY_ADMIN': 'ADMINISTRATOR', 
    'COUNTY_HEALTH_OFFICER': 'HEALTH_OFFICER',
    'HOSPITAL_ADMIN': 'ADMINISTRATOR',
    'FACILITY_MANAGER': 'MANAGER',
    'DOCTOR': 'MEDICAL_OFFICER',
    'NURSE': 'NURSE',
    'TRIAGE_OFFICER': 'TRIAGE_NURSE',
    'DISPATCHER': 'DISPATCHER',
    'DISPATCH_COORDINATOR': 'DISPATCHER',
    'AMBULANCE_DRIVER': 'AMBULANCE_DRIVER',
    'AMBULANCE_CREW': 'AMBULANCE_CREW',
    'EMERGENCY_MANAGER': 'EMERGENCY_MANAGER',
    'FINANCE_OFFICER': 'ADMINISTRATOR',
    'LAB_TECHNICIAN': 'LAB_TECHNICIAN',
    'PHARMACIST': 'PHARMACIST',
    'MEDICAL_SUPERINTENDENT': 'MEDICAL_SUPERINTENDENT',
    'HOSPITAL_DIRECTOR': 'ADMINISTRATOR'
  }
  return roleMap[userRole] || 'SUPPORT_STAFF'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
    } = body

    console.log('📝 Registration attempt for:', email)
    console.log('📋 Registration data:', { email, firstName, lastName, role, facilityType })

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: email, password, firstName, lastName, and role are required' },
        { status: 400 }
      )
    }

    // Validate role is a valid UserRole
    const validRoles: UserRole[] = [
      'SUPER_ADMIN', 'ADMIN', 'COUNTY_ADMIN', 'COUNTY_HEALTH_OFFICER',
      'HOSPITAL_ADMIN', 'FACILITY_MANAGER', 'DOCTOR', 'NURSE',
      'TRIAGE_OFFICER', 'DISPATCHER', 'DISPATCH_COORDINATOR',
      'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'EMERGENCY_MANAGER',
      'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST',
      'MEDICAL_SUPERINTENDENT', 'HOSPITAL_DIRECTOR'
    ]

    if (!validRoles.includes(role as UserRole)) {
      console.log('❌ Invalid role:', role)
      return NextResponse.json(
        { error: `Invalid role specified. Must be one of: ${validRoles.join(', ')}` },
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

    // Get default hospital for assignment
    let defaultHospitalId = hospitalId
    let defaultCountyId = null

    if (!defaultHospitalId) {
      // Try to find a default hospital
      const defaultHospital = await prisma.hospital.findFirst({
        where: { isActive: true },
        include: { county: true }
      })

      if (defaultHospital) {
        defaultHospitalId = defaultHospital.id
        defaultCountyId = defaultHospital.countyId
        console.log('🏥 Assigned to default hospital:', defaultHospital.name)
      } else {
        console.log('⚠️ No hospitals found in database')
      }
    }

    // Generate staff number
    const staffCount = await prisma.staff.count()
    const staffNumber = `STAFF${String(staffCount + 1).padStart(6, '0')}`

    // Map UserRole to Prisma StaffRole
    const staffRole = mapUserRoleToStaffRole(role as UserRole)
    console.log('🎯 Mapped role:', role, '->', staffRole)

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('🔒 Password hashed successfully')

    // Create user with hashed password
    const user = await prisma.staff.create({
      data: {
        userId: email, // Using email as userId
        staffNumber,
        email,
        firstName,
        lastName,
        phone: phone || null,
        role: staffRole,
        facilityType: facilityType || 'HOSPITAL',
        hospitalId: facilityType === 'HOSPITAL' ? defaultHospitalId : null,
        healthCenterId: facilityType === 'HEALTH_CENTER' ? healthCenterId : null,
        dispensaryId: facilityType === 'DISPENSARY' ? dispensaryId : null,
        departmentId: departmentId || null,
        employmentType: 'PERMANENT',
        contractType: 'COUNTY',
        hireDate: new Date(),
        isActive: true,
        isOnDuty: false,
        passwordHash: hashedPassword, // ✅ STORE THE HASHED PASSWORD
      },
    })

    console.log('✅ User created:', user.id, user.email)
    console.log('✅ Password hash stored successfully')

    // Fetch user with relations
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
    })

    if (!userWithFacilities) {
      throw new Error('Failed to fetch created user')
    }

    // Determine facility and county
    let facilityId: string | undefined = undefined
    let countyId: string | undefined = undefined
    let facilityTypeName: string | undefined = undefined
    let facilityName: string | undefined = undefined

    // Check hospital relation
    if (userWithFacilities.hospitalId && userWithFacilities.hospital) {
      facilityId = userWithFacilities.hospital.id
      countyId = userWithFacilities.hospital.county?.id || undefined
      facilityTypeName = 'HOSPITAL'
      facilityName = userWithFacilities.hospital.name
      console.log('🏥 User assigned to hospital:', facilityName)
    } 
    // Check health center relation
    else if (userWithFacilities.healthCenterId && userWithFacilities.healthCenter) {
      facilityId = userWithFacilities.healthCenter.id
      countyId = userWithFacilities.healthCenter.county?.id || undefined
      facilityTypeName = 'HEALTH_CENTER'
      facilityName = userWithFacilities.healthCenter.name
      console.log('🏥 User assigned to health center:', facilityName)
    } 
    // Check dispensary relation
    else if (userWithFacilities.dispensaryId && userWithFacilities.dispensary) {
      facilityId = userWithFacilities.dispensary.id
      countyId = userWithFacilities.dispensary.county?.id || undefined
      facilityTypeName = 'DISPENSARY'
      facilityName = userWithFacilities.dispensary.name
      console.log('🏥 User assigned to dispensary:', facilityName)
    } 
    else {
      console.log('⚠️ No facility assignment for user')
      facilityTypeName = facilityType || 'HOSPITAL'
    }

    // Get normalized role and permissions
    const normalizedRole = normalizeRole(role as string)
    const permissions = getPermissionsForRole(normalizedRole)
    console.log('🔑 User permissions:', permissions.length, 'permissions')

    // Create user object with permissions
    const userObj = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      role: normalizedRole,
      hospitalId: facilityId,
      facilityId: facilityId,
      countyId: countyId,
      facilityType: facilityTypeName,
      permissions
    }

    // Generate token
    const accessToken = await createToken(userObj)
    console.log('🔐 Token generated successfully')

    // Create response
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        role: normalizedRole,
        facilityId: facilityId,
        countyId: countyId,
        facilityName: facilityName,
        facilityType: facilityTypeName,
        permissions
      },
      accessToken,
      message: 'Registration successful! Welcome to the National Emergency Healthcare System.'
    }, { status: 201 })

    // Set cookies
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    response.cookies.set('refreshToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
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

    console.log('🎉 Registration successful for:', email)
    console.log('🍪 Cookies set:', {
      auth_token: '✓',
      user_role: normalizedRole,
      user_permissions: permissions.length,
      user_id: user.id,
      facility_id: facilityId || 'none',
      county_id: countyId || 'none'
    })

    return response

  } catch (error: any) {
    console.error('💥 Registration error:', error)
    console.error('💥 Error stack:', error.stack)
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this email or staff number already exists' },
        { status: 409 }
      )
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid facility reference. Please select a valid facility.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Registration failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}