// src/app/api/patients/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    console.log('Fetching patient history for:', { patientId, page, limit })
    
    if (!patientId) {
      return NextResponse.json(
        { 
          error: 'Patient ID is required',
          triageEntries: [],
          pagination: {
            page: 1,
            limit: 20,
            totalCount: 0,
            totalPages: 0
          }
        },
        { status: 400 }
      )
    }

    // Verify patient exists
    const patientExists = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true }
    })

    if (!patientExists) {
      return NextResponse.json(
        { 
          error: 'Patient not found',
          triageEntries: [],
          pagination: {
            page: 1,
            limit: 20,
            totalCount: 0,
            totalPages: 0
          }
        },
        { status: 404 }
      )
    }

    const safePage = Math.max(page, 1)
    const safeLimit = Math.min(Math.max(limit, 1), 100)
    const skip = (safePage - 1) * safeLimit

    console.log('Fetching triage entries...')
    
    // Fetch patient's complete medical history
    const [triageEntries, totalCount] = await Promise.all([
      prisma.triageEntry.findMany({
        where: { patientId },
        include: {
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
              code: true,
              mflCode: true
            }
          },
          assessedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        skip,
        take: safeLimit,
        orderBy: { arrivalTime: 'desc' }
      }),
      prisma.triageEntry.count({
        where: { patientId }
      })
    ])

    console.log(`Found ${triageEntries.length} entries out of ${totalCount} total`)

    return NextResponse.json({
      triageEntries,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / safeLimit)
      }
    })

  } catch (error) {
    console.error('Error fetching patient history:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        triageEntries: [],
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