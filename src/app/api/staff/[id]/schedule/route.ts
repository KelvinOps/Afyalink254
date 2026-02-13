import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken, hasPermission, createUserObject } from '@/app/lib/auth'
import { auditLog, AuditAction } from '@/app/lib/audit'
import { ShiftType, Prisma } from '@prisma/client'
import { nanoid } from 'nanoid' // You'll need to install this: npm install nanoid

interface RouteParams {
  params: {
    id: string
  }
}

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

// Helper function to generate unique schedule number
function generateScheduleNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = nanoid(8)
  return `SCH-${timestamp}-${random}`.toUpperCase()
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const staff = await prisma.staff.findUnique({
      where: { id: params.id }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Check access permissions
    if (session.role === 'HOSPITAL_ADMIN' && session.facilityId) {
      if (staff.hospitalId !== session.facilityId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check county admin access
    if (session.role === 'COUNTY_ADMIN' && session.countyId) {
      let staffCountyId: string | null = null
      
      if (staff.hospitalId) {
        const hospital = await prisma.hospital.findUnique({
          where: { id: staff.hospitalId },
          select: { countyId: true }
        })
        staffCountyId = hospital?.countyId || null
      } else if (staff.healthCenterId) {
        const healthCenter = await prisma.healthCenter.findUnique({
          where: { id: staff.healthCenterId },
          select: { countyId: true }
        })
        staffCountyId = healthCenter?.countyId || null
      } else if (staff.dispensaryId) {
        const dispensary = await prisma.dispensary.findUnique({
          where: { id: staff.dispensaryId },
          select: { countyId: true }
        })
        staffCountyId = dispensary?.countyId || null
      }

      if (staffCountyId !== session.countyId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Build the where clause with proper typing
    const where: Prisma.StaffScheduleWhereInput = {
      staffId: params.id,
      isActive: true,
      ...(startDate && endDate && {
        OR: [
          {
            startTime: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          },
          {
            endTime: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          }
        ]
      })
    }

    const schedules = await prisma.staffSchedule.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffNumber: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json(schedules)

  } catch (error) {
    console.error('Error fetching staff schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(session, 'staff.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const staff = await prisma.staff.findUnique({
      where: { id: params.id }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Check access permissions
    if (session.role === 'HOSPITAL_ADMIN' && session.facilityId) {
      if (staff.hospitalId !== session.facilityId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check county admin access
    if (session.role === 'COUNTY_ADMIN' && session.countyId) {
      let staffCountyId: string | null = null
      
      if (staff.hospitalId) {
        const hospital = await prisma.hospital.findUnique({
          where: { id: staff.hospitalId },
          select: { countyId: true }
        })
        staffCountyId = hospital?.countyId || null
      } else if (staff.healthCenterId) {
        const healthCenter = await prisma.healthCenter.findUnique({
          where: { id: staff.healthCenterId },
          select: { countyId: true }
        })
        staffCountyId = healthCenter?.countyId || null
      } else if (staff.dispensaryId) {
        const dispensary = await prisma.dispensary.findUnique({
          where: { id: staff.dispensaryId },
          select: { countyId: true }
        })
        staffCountyId = dispensary?.countyId || null
      }

      if (staffCountyId !== session.countyId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()

    // Validate required fields
    if (!body.startTime || !body.endTime || !body.shiftType) {
      return NextResponse.json(
        { error: 'Missing required fields: startTime, endTime, shiftType' },
        { status: 400 }
      )
    }

    // Validate shiftType is a valid enum value
    if (!Object.values(ShiftType).includes(body.shiftType)) {
      return NextResponse.json(
        { error: 'Invalid shift type' },
        { status: 400 }
      )
    }

    // Check for schedule conflicts
    const conflictingSchedule = await prisma.staffSchedule.findFirst({
      where: {
        staffId: params.id,
        isActive: true,
        OR: [
          {
            startTime: { lt: new Date(body.endTime) },
            endTime: { gt: new Date(body.startTime) }
          }
        ]
      }
    })

    if (conflictingSchedule) {
      return NextResponse.json(
        { error: 'Schedule conflict: Staff already has a shift during this time' },
        { status: 409 }
      )
    }

    const schedule = await prisma.staffSchedule.create({
      data: {
        scheduleNumber: generateScheduleNumber(), // Generate unique schedule number
        staffId: params.id,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        shiftType: body.shiftType,
        facilityType: staff.facilityType, // Use staff's facility type
        departmentId: body.departmentId,
        hospitalId: staff.hospitalId,
        healthCenterId: staff.healthCenterId,
        dispensaryId: staff.dispensaryId,
        notes: body.notes,
        isActive: true,
        createdById: session.id // Track who created the schedule
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffNumber: true
          }
        }
      }
    })

    // Log the audit
    await auditLog({
      action: AuditAction.CREATE,
      entityType: 'STAFF_SCHEDULE',
      entityId: schedule.id,
      userId: session.id,
      userRole: session.role,
      userName: session.name,
      description: `Created schedule for staff ${staff.firstName} ${staff.lastName}`,
      facilityId: session.facilityId
    })

    return NextResponse.json(schedule, { status: 201 })

  } catch (error) {
    console.error('Error creating staff schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}