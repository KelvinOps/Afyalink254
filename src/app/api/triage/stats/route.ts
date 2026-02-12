import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// Type definitions
interface DateFilter {
  gte?: Date
  lt?: Date
  lte?: Date
}

interface WhereConditions {
  arrivalTime: DateFilter
  hospitalId?: string
}

interface HourMapEntry {
  hour: number
  total: number
  immediate: number
  urgent: number
}

interface PriorityStats {
  total: number
  byStatus: Record<string, number>
}

// Dashboard API endpoint for triage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'
    const hospitalId = searchParams.get('hospitalId') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const now = new Date()
    let dateFilter: DateFilter = {}

    // Set date range based on period
    switch (period) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        dateFilter = {
          gte: todayStart,
          lt: todayEnd
        }
        break
      
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - 7))
        dateFilter = {
          gte: weekStart
        }
        break
      
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        dateFilter = {
          gte: monthStart
        }
        break
      
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
        break
      
      default:
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
    }

    // Build where conditions for triage entries
    const whereConditions: WhereConditions = {
      arrivalTime: dateFilter
    }

    if (hospitalId && hospitalId !== 'all') {
      whereConditions.hospitalId = hospitalId
    }

    // 1. Get overall triage statistics
    const triageStats = await prisma.triageEntry.groupBy({
      by: ['triageLevel', 'status'],
      where: whereConditions,
      _count: {
        id: true
      }
    })

    // 2. Get department-wise statistics
    const departmentStats = await prisma.triageEntry.groupBy({
      by: ['departmentId', 'triageLevel', 'status'],
      where: whereConditions,
      _count: {
        id: true
      }
    })

    // 3. Get departments with their bed information
    const departments = await prisma.department.findMany({
      where: hospitalId && hospitalId !== 'all' ? { hospitalId } : {},
      select: {
        id: true,
        name: true,
        type: true,
        totalBeds: true,
        availableBeds: true,
        hospitalId: true
      }
    })

    // 4. Get peak hours (group by hour)
    const rawPeakHours = await prisma.triageEntry.groupBy({
      by: ['arrivalTime'],
      where: whereConditions,
      _count: {
        id: true
      }
    })

    // Process peak hours data
    const hourMap: Record<number, HourMapEntry> = {}
    rawPeakHours.forEach(entry => {
      const hour = new Date(entry.arrivalTime).getHours()
      if (!hourMap[hour]) {
        hourMap[hour] = {
          hour,
          total: 0,
          immediate: 0,
          urgent: 0
        }
      }
      hourMap[hour].total += entry._count.id
    })

    // Add immediate/urgent counts
    const immediateStats = await prisma.triageEntry.groupBy({
      by: ['arrivalTime'],
      where: {
        ...whereConditions,
        triageLevel: 'IMMEDIATE'
      },
      _count: {
        id: true
      }
    })

    immediateStats.forEach(entry => {
      const hour = new Date(entry.arrivalTime).getHours()
      if (hourMap[hour]) {
        hourMap[hour].immediate += entry._count.id
      }
    })

    const urgentStats = await prisma.triageEntry.groupBy({
      by: ['arrivalTime'],
      where: {
        ...whereConditions,
        triageLevel: 'URGENT'
      },
      _count: {
        id: true
      }
    })

    urgentStats.forEach(entry => {
      const hour = new Date(entry.arrivalTime).getHours()
      if (hourMap[hour]) {
        hourMap[hour].urgent += entry._count.id
      }
    })

    const peakHours = Object.values(hourMap)
      .sort((a, b) => a.hour - b.hour)
      .slice(0, 24) // Limit to 24 hours

    // 5. Get top complaints
    const topComplaints = await prisma.triageEntry.groupBy({
      by: ['chiefComplaint'],
      where: whereConditions,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // 6. Get arrival mode statistics
    const arrivalModeStats = await prisma.triageEntry.groupBy({
      by: ['arrivalMode'],
      where: whereConditions,
      _count: {
        id: true
      }
    })

    // Process overall stats
    const processedOverallStats = {
      total: triageStats.reduce((acc, curr) => acc + curr._count.id, 0),
      byPriority: {} as Record<string, PriorityStats>,
      byStatus: {} as Record<string, number>
    }

    triageStats.forEach(stat => {
      if (!processedOverallStats.byPriority[stat.triageLevel]) {
        processedOverallStats.byPriority[stat.triageLevel] = { 
          total: 0, 
          byStatus: {} 
        }
      }
      processedOverallStats.byPriority[stat.triageLevel].total += stat._count.id
      processedOverallStats.byPriority[stat.triageLevel].byStatus[stat.status] = stat._count.id
      
      // Also populate byStatus
      processedOverallStats.byStatus[stat.status] = 
        (processedOverallStats.byStatus[stat.status] || 0) + stat._count.id
    })

    // Process department stats
    const processedDeptStats = departments.map(dept => {
      const deptEntries = departmentStats.filter(stat => stat.departmentId === dept.id)
      
      const byPriority: Record<string, PriorityStats> = {}
      deptEntries.forEach(entry => {
        if (!byPriority[entry.triageLevel]) {
          byPriority[entry.triageLevel] = { total: 0, byStatus: {} }
        }
        byPriority[entry.triageLevel].total += entry._count.id
        byPriority[entry.triageLevel].byStatus[entry.status] = entry._count.id
      })

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentType: dept.type,
        total: deptEntries.reduce((acc, curr) => acc + curr._count.id, 0),
        byPriority,
        bedUtilization: {
          totalBeds: dept.totalBeds,
          availableBeds: dept.availableBeds,
          occupancyRate: dept.totalBeds > 0 ? 
            ((dept.totalBeds - dept.availableBeds) / dept.totalBeds) * 100 : 0
        }
      }
    })

    // Process arrival modes
    const arrivalMode: Record<string, number> = {}
    arrivalModeStats.forEach(stat => {
      arrivalMode[stat.arrivalMode] = stat._count.id
    })

    // Create sample KPIs (you should calculate these based on your actual data)
    const totalPatients = processedOverallStats.total
    const kpis = {
      averageWaitTime: Math.floor(Math.random() * 60) + 15, // Sample: 15-75 minutes
      longestWaitTime: Math.floor(Math.random() * 120) + 60, // Sample: 60-180 minutes
      shortestWaitTime: Math.floor(Math.random() * 10) + 5, // Sample: 5-15 minutes
      averageTreatmentTime: Math.floor(Math.random() * 90) + 30, // Sample: 30-120 minutes
      leftWithoutTreatment: Math.floor(totalPatients * 0.02), // ~2% of patients
      readmissionRate: 2.5, // Sample percentage
      patientSatisfaction: 85 // Sample percentage
    }

    const result = {
      success: true,
      data: {
        period,
        dateRange: {
          start: dateFilter.gte || new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: dateFilter.lt || now
        },
        summary: processedOverallStats,
        departments: processedDeptStats,
        kpis,
        trends: {
          peakHours,
          topComplaints: topComplaints.map(c => ({
            complaint: c.chiefComplaint,
            count: c._count.id
          })).filter(c => c.complaint), // Filter out null/undefined complaints
          arrivalMode
        }
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching triage dashboard data:', error)
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