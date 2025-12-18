import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/prisma'
import { authOptions } from '@/app/lib/auth'

// GET /api/resources - Get all resources with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const critical = searchParams.get('critical')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause based on filters
    const where: any = {
      hospitalId: session.user.facilityId
    }

    if (type) {
      const types = type.split(',')
      where.type = { in: types }
    }

    if (status) {
      where.status = status
    }

    if (department) {
      where.departmentId = department
    }

    if (critical) {
      where.isCritical = critical === 'true'
    }

    // Get resources with pagination
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
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
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.resource.count({ where })
    ])

    // Transform data for frontend
    const transformedResources = resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      category: resource.category,
      department: resource.department?.name || 'Unknown',
      totalCapacity: resource.totalCapacity,
      availableCapacity: resource.availableCapacity,
      reservedCapacity: resource.reservedCapacity,
      inUseCapacity: resource.inUseCapacity,
      unit: resource.unit,
      status: resource.status,
      isCritical: resource.isCritical,
      isOperational: resource.isOperational,
      lastMaintenance: resource.lastMaintenance?.toISOString(),
      nextMaintenance: resource.nextMaintenance?.toISOString(),
      expiryDate: resource.expiryDate?.toISOString(),
      lastRestock: resource.lastRestock?.toISOString(),
      supplier: resource.supplier,
      specifications: resource.specifications,
      lastUpdated: resource.updatedAt.toISOString()
    }))

    return NextResponse.json({
      resources: transformedResources,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/resources - Create a new resource
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'type', 'category', 'totalCapacity', 'unit']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create resource
    const resource = await prisma.resource.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        hospitalId: session.user.facilityId!,
        departmentId: data.departmentId,
        totalCapacity: data.totalCapacity,
        availableCapacity: data.availableCapacity || data.totalCapacity,
        reservedCapacity: data.reservedCapacity || 0,
        inUseCapacity: data.inUseCapacity || 0,
        unit: data.unit,
        minimumLevel: data.minimumLevel,
        criticalLevel: data.criticalLevel,
        reorderLevel: data.reorderLevel,
        maxCapacity: data.maxCapacity,
        status: data.status || 'AVAILABLE',
        isOperational: data.isOperational !== undefined ? data.isOperational : true,
        isCritical: data.isCritical || false,
        isShared: data.isShared || false,
        lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : undefined,
        nextMaintenance: data.nextMaintenance ? new Date(data.nextMaintenance) : undefined,
        maintenanceSchedule: data.maintenanceSchedule,
        maintenanceNotes: data.maintenanceNotes,
        supplier: data.supplier,
        supplierContact: data.supplierContact,
        lastRestock: data.lastRestock ? new Date(data.lastRestock) : undefined,
        lastRestockQuantity: data.lastRestockQuantity,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        batchNumber: data.batchNumber,
        unitCost: data.unitCost,
        totalValue: data.totalValue,
        specifications: data.specifications,
        notes: data.notes
      }
    })

    // Log the resource creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name || 'Unknown',
        action: 'CREATE',
        entityType: 'RESOURCE',
        entityId: resource.id,
        description: `Created new resource: ${resource.name}`,
        facilityId: session.user.facilityId
      }
    })

    return NextResponse.json({ resource })

  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}