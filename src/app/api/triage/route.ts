import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'

interface VitalSigns {
  bp?: string | number
  pulse?: string | number
  temp?: string | number
  respRate?: string | number
  o2Sat?: string | number
  painScale?: string | number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const hospitalId = searchParams.get('hospitalId')
    
    const whereConditions: Record<string, unknown> = {}
    
    if (status && status !== 'all') {
      whereConditions.status = status
    }
    
    if (department && department !== 'all') {
      whereConditions.department = {
        type: department
      }
    }

    if (hospitalId) {
      whereConditions.hospitalId = hospitalId
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
            id: true,
            name: true,
            type: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            code: true
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

    const entriesWithWaitTime = triageEntries.map(entry => {
      const arrivalTime = new Date(entry.arrivalTime)
      const now = new Date()
      const waitingTime = Math.floor((now.getTime() - arrivalTime.getTime()) / (1000 * 60))
      
      return {
        ...entry,
        waitingTime
      }
    })

    return NextResponse.json({
      success: true,
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
      hospitalId,
      vitalSigns,
      notes
    } = body

    // Validate required fields
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    if (!chiefComplaint || chiefComplaint.trim().length === 0) {
      return NextResponse.json(
        { error: 'Chief complaint is required' },
        { status: 400 }
      )
    }

    if (!triageLevel || !['IMMEDIATE', 'URGENT', 'LESS_URGENT', 'NON_URGENT'].includes(triageLevel)) {
      return NextResponse.json(
        { error: 'Valid triage level is required' },
        { status: 400 }
      )
    }

    // Validate hospitalId exists
    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID is required' },
        { status: 400 }
      )
    }

    // Validate departmentId exists
    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      )
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Verify hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    // Verify department exists in this hospital
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        hospitalId: hospitalId
      }
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found or does not belong to the specified hospital' },
        { status: 404 }
      )
    }

    // Get or create a default system user for triage
    let systemStaff = await prisma.staff.findFirst({
      where: {
        staffNumber: 'SYS-TRIAGE-001'
      }
    })

    if (!systemStaff) {
      // Create a system triage user if it doesn't exist
      systemStaff = await prisma.staff.create({
        data: {
          staffNumber: 'SYS-TRIAGE-001',
          firstName: 'System',
          lastName: 'Triage',
          email: 'triage@system.local',
          phone: '0000000000',
          role: 'TRIAGE_NURSE',
          facilityType: 'HOSPITAL',
          hospitalId: hospitalId,
          employmentType: 'PERMANENT',
          contractType: 'NATIONAL',
          hireDate: new Date(),
          isActive: true,
          isOnDuty: true,
          userId: 'system-triage-user'
        }
      })
    }

    // Generate triage number
    const triageCount = await prisma.triageEntry.count({
      where: {
        hospitalId: hospitalId
      }
    })
    const hospitalCode = hospital.code || 'HOSP'
    const triageNumber = `TRI-${hospitalCode}-${String(triageCount + 1).padStart(6, '0')}`

    // Determine ESI level based on triage level
    const getEsiLevel = (level: string): number => {
      switch (level) {
        case 'IMMEDIATE': return 1
        case 'URGENT': return 2
        case 'LESS_URGENT': return 3
        case 'NON_URGENT': return 4
        default: return 5
      }
    }

    // Parse vital signs with validation
    const parseVitalSigns = (vitals: VitalSigns | null | undefined): Prisma.InputJsonValue => {
      if (!vitals) {
        return {
          bp: '',
          pulse: 0,
          temp: 0,
          respRate: 0,
          o2Sat: 0,
          painScale: 0
        }
      }

      return {
        bp: vitals.bp && typeof vitals.bp === 'string' ? vitals.bp : '',
        pulse: vitals.pulse ? parseInt(String(vitals.pulse)) || 0 : 0,
        temp: vitals.temp ? parseFloat(String(vitals.temp)) || 0 : 0,
        respRate: vitals.respRate ? parseInt(String(vitals.respRate)) || 0 : 0,
        o2Sat: vitals.o2Sat ? parseInt(String(vitals.o2Sat)) || 0 : 0,
        painScale: vitals.painScale ? parseInt(String(vitals.painScale)) || 0 : 0
      }
    }

    // Determine if resuscitation or immediate intervention is required
    const requiresResuscitation = triageLevel === 'IMMEDIATE'
    const requiresImmediateIntervention = triageLevel === 'IMMEDIATE' || triageLevel === 'URGENT'

    // Build data object with safe defaults
    const baseData = {
      triageNumber,
      patientId,
      chiefComplaint: chiefComplaint.trim(),
      triageLevel,
      esiLevel: getEsiLevel(triageLevel),
      requiresResuscitation,
      requiresImmediateIntervention,
      arrivalMode: arrivalMode || 'WALK_IN',
      vitalSigns: parseVitalSigns(vitalSigns),
      status: 'WAITING' as const,
      assessedById: systemStaff.id,
      arrivalTime: new Date(),
      triageTime: new Date(),
      hospitalId,
      departmentId,
      assessmentNotes: '',
      presentingSymptoms: [],
      icd10Codes: [],
      notes: notes ? notes.trim() : ''
    }

    console.log('Creating triage with data:', JSON.stringify(baseData, null, 2))

    const triageEntry = await prisma.triageEntry.create({
      data: baseData,
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
            name: true,
            type: true
          }
        },
        hospital: {
          select: {
            name: true,
            code: true
          }
        },
        assessedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    // Update patient's current status
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        currentStatus: 'IN_TRIAGE',
        currentHospitalId: hospitalId
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: systemStaff.id,
        userRole: systemStaff.role,
        userName: `${systemStaff.firstName} ${systemStaff.lastName}`,
        action: 'CREATE',
        entityType: 'TRIAGE',
        entityId: triageEntry.id,
        description: `Triage entry created for patient ${patient.firstName} ${patient.lastName}`,
        success: true
      }
    })

    return NextResponse.json({
      success: true,
      triageEntry,
      message: 'Triage entry created successfully'
    })

  } catch (error) {
    console.error('Error creating triage entry:', error)
    
    // Type guard for Prisma errors
    interface PrismaError extends Error {
      code?: string
      meta?: {
        field_name?: string
      }
    }
    
    const isPrismaError = (err: unknown): err is PrismaError => {
      return typeof err === 'object' && err !== null && 'code' in err
    }
    
    // Provide more specific error message
    if (isPrismaError(error) && error.code === 'P2003') {
      const fieldName = error.meta?.field_name || 'Unknown field'
      return NextResponse.json(
        { 
          success: false,
          error: 'Foreign key constraint failed',
          details: `The referenced ${fieldName} does not exist. Please check your data.`,
          field: fieldName
        },
        { status: 400 }
      )
    }
    
    if (isPrismaError(error) && error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Duplicate entry',
          details: 'A triage entry with similar data already exists'
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}