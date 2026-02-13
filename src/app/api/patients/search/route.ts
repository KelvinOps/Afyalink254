import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { Prisma, PatientStatus, Gender } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const gender = searchParams.get('gender') || ''
    const hospital = searchParams.get('hospital') || ''

    // Early return for empty queries with better validation
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        patients: [],
        message: 'Query too short',
        count: 0
      })
    }

    // Validate and sanitize limit
    const safeLimit = Math.min(Math.max(limit, 1), 50)

    // Build where clause with proper typing
    const where: Prisma.PatientWhereInput = {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { patientNumber: { contains: query, mode: 'insensitive' } },
        { nationalId: { contains: query, mode: 'insensitive' } },
        { shaNumber: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ]
    }

    // Add filters with proper enum validation
    if (status) {
      // Check if the status string is a valid PatientStatus enum value
      if (Object.values(PatientStatus).includes(status as PatientStatus)) {
        where.currentStatus = status as PatientStatus
      }
    }
    
    if (gender) {
      // Check if the gender string is a valid Gender enum value
      if (Object.values(Gender).includes(gender as Gender)) {
        where.gender = gender as Gender
      }
    }
    
    if (hospital) {
      where.currentHospitalId = hospital
    }

    const patients = await prisma.patient.findMany({
      where,
      select: {
        id: true,
        patientNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        nationalId: true,
        shaNumber: true,
        currentStatus: true,
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
      take: safeLimit,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ 
      patients,
      count: patients.length
    })

  } catch (error) {
    console.error('Error searching patients:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search patients',
        patients: [],
        count: 0
      },
      { status: 500 }
    )
  }
}