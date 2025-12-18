// src/app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const hospitalId = searchParams.get('hospitalId') || ''
    
    // Validate and sanitize inputs
    const safePage = Math.max(page, 1)
    const safeLimit = Math.min(Math.max(limit, 1), 100) // Limit between 1-100
    const skip = (safePage - 1) * safeLimit

    const where: any = {}

    if (search && search.trim().length > 0) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { patientNumber: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { shaNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.currentStatus = status
    }

    if (hospitalId) {
      where.currentHospitalId = hospitalId
    }

    const [patients, totalCount] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          currentHospital: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          triageEntries: {
            take: 1,
            orderBy: { arrivalTime: 'desc' },
            select: {
              triageLevel: true,
              status: true,
              arrivalTime: true
            }
          }
        },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ])

    return NextResponse.json({
      patients,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / safeLimit)
      }
    })

  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        patients: [], // Prevent frontend crashes
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 0
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate patient number
    const patientCount = await prisma.patient.count()
    const patientNumber = `PAT-${String(patientCount + 1).padStart(6, '0')}`

    // Use Prisma's PatientStatus enum for currentStatus
    const patientData = {
      patientNumber,
      firstName: body.firstName,
      lastName: body.lastName,
      otherNames: body.otherNames,
      dateOfBirth: new Date(body.dateOfBirth),
      gender: body.gender,
      phone: body.phone,
      alternatePhone: body.alternatePhone,
      email: body.email,
      nationalId: body.nationalId,
      passportNumber: body.passportNumber,
      birthCertNumber: body.birthCertNumber,
      countyOfResidence: body.countyOfResidence,
      subCounty: body.subCounty,
      ward: body.ward,
      village: body.village,
      landmark: body.landmark,
      what3words: body.what3words,
      nextOfKinName: body.nextOfKinName,
      nextOfKinPhone: body.nextOfKinPhone,
      nextOfKinRelation: body.nextOfKinRelation,
      bloodType: body.bloodType,
      allergies: body.allergies || [],
      chronicConditions: body.chronicConditions || [],
      disabilities: body.disabilities || [],
      shaNumber: body.shaNumber,
      shaStatus: body.shaStatus || 'NOT_REGISTERED',
      contributionStatus: body.contributionStatus || 'UNKNOWN',
      currentHospitalId: body.currentHospitalId,
      currentStatus: 'REGISTERED' as const // ✅ Fixed: Use const assertion for enum value
    }

    const patient = await prisma.patient.create({
      data: patientData,
      include: {
        currentHospital: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: 'system', // In real app, get from session
        userRole: 'SYSTEM',
        userName: 'System',
        action: 'CREATE',
        entityType: 'PATIENT',
        entityId: patient.id,
        description: `New patient registered: ${patient.firstName} ${patient.lastName} (${patient.patientNumber})`,
        success: true
      }
    })

    return NextResponse.json(patient)

  } catch (error) {
    console.error('Error creating patient:', error)
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Patient with similar identification already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}