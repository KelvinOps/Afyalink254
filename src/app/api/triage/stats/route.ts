import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // Today's statistics
    const todayStats = await prisma.triageEntry.groupBy({
      by: ['triageLevel', 'status'],
      where: {
        arrivalTime: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      _count: {
        id: true
      }
    })

    // Wait time statistics
    const waitTimeStats = await prisma.triageEntry.aggregate({
      where: {
        status: 'WAITING',
        arrivalTime: {
          gte: todayStart
        }
      },
      _avg: {
        // This would need to be calculated based on current time vs arrival time
      }
    })

    // Department-wise statistics
    const departmentStats = await prisma.triageEntry.groupBy({
      by: ['departmentId'],
      where: {
        arrivalTime: {
          gte: todayStart
        }
      },
      _count: {
        id: true
      }
    })

    const stats = {
      today: {
        total: todayStats.reduce((acc, curr) => acc + curr._count.id, 0),
        byPriority: todayStats.reduce((acc, curr) => {
          acc[curr.triageLevel] = (acc[curr.triageLevel] || 0) + curr._count.id
          return acc
        }, {} as Record<string, number>),
        byStatus: todayStats.reduce((acc, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + curr._count.id
          return acc
        }, {} as Record<string, number>)
      },
      departments: departmentStats,
      updatedAt: now.toISOString()
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching triage stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}