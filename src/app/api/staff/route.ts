import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken, hasPermission, createUserObject } from '@/app/lib/auth'
import { auditLog, auditActions } from '@/app/lib/audit'
import { StaffSearchParams } from '@/app/types/staff.types'

// Helper function to get session from your JWT token
async function getSession(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)
  
  if (!payload) {
    return null
  }

  return createUserObject(payload)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(session, 'staff.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const role = searchParams.get('role') as any
    const facilityType = searchParams.get('facilityType') as any
    const hospitalId = searchParams.get('hospitalId')
    const departmentId = searchParams.get('departmentId')
    const isActive = searchParams.get('isActive')
    const isOnDuty = searchParams.get('isOnDuty')

    const skip = (page - 1) * limit

    // Build where clause based on user's access level
    let where: any = {}

    // County admin can only see staff in their county
    if (session.role === 'COUNTY_ADMIN' && session.countyId) {
      where.OR = [
        { hospital: { countyId: session.countyId } },
        { healthCenter: { countyId: session.countyId } },
        { dispensary: { countyId: session.countyId } }
      ]
    }

    // Hospital admin can only see staff in their hospital
    if (session.role === 'HOSPITAL_ADMIN' && session.facilityId) {
      where.hospitalId = session.facilityId
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { staffNumber: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) where.role = role
    if (facilityType) where.facilityType = facilityType
    if (hospitalId) where.hospitalId = hospitalId
    if (departmentId) where.departmentId = departmentId
    if (isActive !== null) where.isActive = isActive === 'true'
    if (isOnDuty !== null) where.isOnDuty = isOnDuty === 'true'

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          healthCenter: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          dispensary: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
        skip,
        take: limit,
      }),
      prisma.staff.count({ where })
    ])

    // Log the audit
    await auditLog({
      action: 'READ',
      entityType: 'STAFF',
      entityId: 'list',
      userId: session.id,
      userRole: session.role,
      userName: session.name,
      description: `Viewed staff list with ${staff.length} records`,
      facilityId: session.facilityId
    })

    return NextResponse.json({
      staff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(session, 'staff.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'employmentType', 'contractType', 'facilityType', 'hireDate']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Check if email already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { email: body.email }
    })

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Staff member with this email already exists' },
        { status: 409 }
      )
    }

    // Generate staff number
    const staffCount = await prisma.staff.count()
    const staffNumber = `STAFF-${String(staffCount + 1).padStart(6, '0')}`

    // Create staff record
    const staff = await prisma.staff.create({
      data: {
        ...body,
        staffNumber,
        userId: body.email, // Using email as userId for now, can be changed to auth system ID
        hireDate: new Date(body.hireDate),
        isActive: body.isActive !== undefined ? body.isActive : true,
        telemedicineEnabled: body.telemedicineEnabled || false,
        canGiveRemoteConsultations: body.canGiveRemoteConsultations || false,
        currentCaseload: 0,
        maxCaseload: body.maxCaseload || 10,
        pendingSalaryMonths: 0
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        healthCenter: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        dispensary: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    // Log the audit
    await auditActions.logStaffCreation(staff.id, session.id, session.role, session.name, session.facilityId)

    return NextResponse.json(staff, { status: 201 })

  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}