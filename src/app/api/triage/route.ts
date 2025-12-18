import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    
    // Build where conditionally without explicit typing
    const whereConditions: Record<string, any> = {}
    
    if (status && status !== 'all') {
      whereConditions.status = status
    }
    
    if (department && department !== 'all') {
      whereConditions.department = {
        type: department
      }
    }

    const triageEntries = await prisma.triageEntry.findMany({
      where: whereConditions,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
            dateOfBirth: true,
            gender: true
          }
        },
        department: {
          select: {
            name: true,
            type: true
          }
        },
        assessedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        arrivalTime: 'desc'
      }
    })

    // Calculate waiting time for each entry
    const entriesWithWaitTime = triageEntries.map(entry => {
      const arrivalTime = new Date(entry.arrivalTime)
      const now = new Date()
      const waitingTime = Math.floor((now.getTime() - arrivalTime.getTime()) / (1000 * 60)) // minutes
      
      return {
        ...entry,
        waitingTime
      }
    })

    return NextResponse.json({
      triageEntries: entriesWithWaitTime
    })

  } catch (error) {
    console.error('Error fetching triage entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      chiefComplaint,
      triageLevel,
      arrivalMode,
      departmentId,
      vitalSigns,
      notes
    } = body

    // Validate required fields
    if (!patientId || !chiefComplaint || !triageLevel) {
      return NextResponse.json(
        { error: 'Patient ID, chief complaint, and triage level are required' },
        { status: 400 }
      )
    }

    // Generate triage number
    const triageCount = await prisma.triageEntry.count()
    const triageNumber = `TRI-${String(triageCount + 1).padStart(6, '0')}`

    // Build data object conditionally
    const baseData = {
      triageNumber,
      patientId,
      chiefComplaint,
      triageLevel,
      arrivalMode: arrivalMode || 'WALK_IN',
      vitalSigns: vitalSigns || {},
      status: 'WAITING' as const,
      assessedById: 'system',
      arrivalTime: new Date(),
    }

    // Add optional fields conditionally
    const dataWithOptionalFields = {
      ...baseData,
      ...(departmentId && { departmentId }),
      ...(notes && { notes })
    }

    const triageEntry = await prisma.triageEntry.create({
      data: dataWithOptionalFields,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true
          }
        },
        department: {
          select: {
            name: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        userRole: 'SYSTEM',
        userName: 'Triage System',
        action: 'CREATE',
        entityType: 'TRIAGE',
        entityId: triageEntry.id,
        description: `Triage entry created: ${triageEntry.triageNumber} for ${triageEntry.patient.firstName} ${triageEntry.patient.lastName}`,
        success: true
      }
    })

    return NextResponse.json(triageEntry)

  } catch (error) {
    console.error('Error creating triage entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}