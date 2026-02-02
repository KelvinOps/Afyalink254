//api/queue/route.ts


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const queueEntries = await prisma.triageEntry.findMany({
      where: {
        status: {
          in: ['WAITING', 'IN_ASSESSMENT']
        }
      },
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
      },
      orderBy: [
        {
          triageLevel: 'asc' // Immediate first
        },
        {
          arrivalTime: 'asc' // Then by arrival time
        }
      ]
    })

    // Calculate waiting times and enhance data
    const enhancedEntries = queueEntries.map(entry => {
      const arrivalTime = new Date(entry.arrivalTime)
      const now = new Date()
      const waitingTime = Math.floor((now.getTime() - arrivalTime.getTime()) / (1000 * 60))
      
      return {
        ...entry,
        waitingTime
      }
    })

    return NextResponse.json({
      queueEntries: enhancedEntries
    })

  } catch (error) {
    console.error('Error fetching queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}