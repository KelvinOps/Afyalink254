// src/app/api/resources/critical-shortages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/prisma'
import { authOptions } from '@/app/lib/auth-options' // Changed from '@/app/lib/auth'
import { Prisma } from '@prisma/client'

// GET /api/resources/critical-shortages - Get critical resource shortages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')

    // Build where clause for critical shortages with proper typing
    const where: Prisma.ResourceWhereInput = {
      hospitalId: session.user.facilityId,
      OR: [
        // Operational status issues
        {
          isOperational: false
        },
        // Maintenance overdue
        {
          nextMaintenance: {
            lte: new Date()
          }
        },
        // Supplies expiring soon (within 30 days)
        {
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        }
      ]
    }

    if (type) {
      where.type = type as Prisma.EnumResourceTypeFilter
    }

    // Get critical resources
    const allResources = await prisma.resource.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { isCritical: 'desc' },
        { availableCapacity: 'asc' },
        { updatedAt: 'desc' }
      ]
    })

    // Filter for critical level in JavaScript (more reliable than SQL comparison)
    const criticalResources = allResources.filter(resource => 
      resource.availableCapacity <= (resource.criticalLevel || 0) ||
      resource.availableCapacity <= (resource.reorderLevel || 0) ||
      !resource.isOperational ||
      (resource.nextMaintenance && resource.nextMaintenance <= new Date()) ||
      (resource.expiryDate && resource.expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    )

    // Transform and categorize shortages
    const shortages = criticalResources.map(resource => {
      let shortageType = 'OTHER'
      let shortageSeverity = 'MEDIUM'
      let message = ''

      // Determine shortage type and severity
      if (resource.availableCapacity <= (resource.criticalLevel || 0)) {
        shortageType = 'STOCK_CRITICAL'
        shortageSeverity = 'CRITICAL'
        message = `Critical stock level: ${resource.availableCapacity} ${resource.unit} remaining`
      } else if (resource.availableCapacity <= (resource.reorderLevel || 0)) {
        shortageType = 'STOCK_LOW'
        shortageSeverity = 'HIGH'
        message = `Low stock level: ${resource.availableCapacity} ${resource.unit} remaining`
      } else if (!resource.isOperational) {
        shortageType = 'EQUIPMENT_DOWN'
        shortageSeverity = 'HIGH'
        message = 'Equipment is not operational'
      } else if (resource.nextMaintenance && resource.nextMaintenance <= new Date()) {
        shortageType = 'MAINTENANCE_OVERDUE'
        shortageSeverity = 'MEDIUM'
        message = 'Maintenance is overdue'
      } else if (resource.expiryDate && resource.expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
        shortageType = 'EXPIRING_SOON'
        shortageSeverity = 'MEDIUM'
        message = 'Item expiring within 7 days'
      }

      return {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        category: resource.category,
        department: resource.department?.name || 'Unknown',
        availableCapacity: resource.availableCapacity,
        totalCapacity: resource.totalCapacity,
        unit: resource.unit,
        criticalLevel: resource.criticalLevel,
        reorderLevel: resource.reorderLevel,
        shortageType,
        severity: shortageSeverity,
        message,
        isOperational: resource.isOperational,
        nextMaintenance: resource.nextMaintenance?.toISOString(),
        expiryDate: resource.expiryDate?.toISOString(),
        lastUpdated: resource.updatedAt.toISOString()
      }
    })

    // Filter by severity if specified
    let filteredShortages = shortages
    if (severity) {
      filteredShortages = shortages.filter(shortage => 
        shortage.severity === severity
      )
    }

    // Get statistics
    const stats = {
      total: filteredShortages.length,
      critical: filteredShortages.filter(s => s.severity === 'CRITICAL').length,
      high: filteredShortages.filter(s => s.severity === 'HIGH').length,
      medium: filteredShortages.filter(s => s.severity === 'MEDIUM').length,
      byType: filteredShortages.reduce((acc, shortage) => {
        acc[shortage.shortageType] = (acc[shortage.shortageType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      shortages: filteredShortages,
      statistics: stats,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching critical shortages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/resources/critical-shortages - Acknowledge shortage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { resourceId, action, notes } = data

    if (!resourceId || !action) {
      return NextResponse.json(
        { error: 'Resource ID and action are required' },
        { status: 400 }
      )
    }

    // Verify resource exists and belongs to user's facility
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        hospitalId: session.user.facilityId
      }
    })

    if (!existingResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Create system alert for the acknowledged shortage
    const alert = await prisma.systemAlert.create({
      data: {
        alertNumber: `SA-${Date.now()}`,
        alertType: 'RESOURCE_SHORTAGE',
        severity: 'WARNING',
        title: `Shortage Acknowledged: ${existingResource.name}`,
        message: `Shortage acknowledged by ${session.user.name}. Action: ${action}. ${notes || ''}`,
        sourceType: 'RESOURCE',
        sourceId: resourceId,
        hospitalId: session.user.facilityId!,
        audienceType: 'SPECIFIC_HOSPITAL',
        targetRoles: ['HOSPITAL_ADMIN', 'COUNTY_ADMIN'],
        requiresAction: false,
        actionTaken: `${action} - ${notes || 'No additional notes'}`,
        priority: 3
      }
    })

    // Log the shortage acknowledgment
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name || 'Unknown',
        action: 'UPDATE',
        entityType: 'RESOURCE',
        entityId: resourceId,
        description: `Acknowledged resource shortage: ${existingResource.name}. Action: ${action}`,
        changes: {
          action,
          notes,
          alertId: alert.id
        },
        facilityId: session.user.facilityId
      }
    })

    return NextResponse.json({ 
      message: 'Shortage acknowledged successfully',
      alert 
    })

  } catch (error) {
    console.error('Error acknowledging shortage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}