// src/app/api/patients/[id]/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patientId } = await params

    console.log('Fetching patient history for:', patientId)

    if (!patientId) {
      return NextResponse.json(
        { 
          error: 'Patient ID is required',
          triageEntries: [],
          pagination: {
            page: 1,
            limit: 20,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        },
        { status: 400 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

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
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
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

    const totalPages = Math.ceil(totalCount / safeLimit)

    console.log(`Found ${triageEntries.length} entries out of ${totalCount} total`)

    return NextResponse.json({
      triageEntries,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalCount,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1
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
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      },
      { status: 500 }
    )
  }
}