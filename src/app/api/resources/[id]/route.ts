// src/app/api/resources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/prisma'
import { authOptions } from '@/app/lib/auth-options'
import { Prisma } from '@prisma/client'

// GET /api/resources/[id] - Get specific resource
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        hospitalId: session.user.facilityId
      },
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
            code: true
          }
        }
      }
    })

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Transform data for frontend
    const transformedResource = {
      id: resource.id,
      name: resource.name,
      type: resource.type,
      category: resource.category,
      department: resource.department ? {
        id: resource.department.id,
        name: resource.department.name,
        type: resource.department.type
      } : null,
      hospital: {
        id: resource.hospital.id,
        name: resource.hospital.name,
        code: resource.hospital.code
      },
      totalCapacity: resource.totalCapacity,
      availableCapacity: resource.availableCapacity,
      reservedCapacity: resource.reservedCapacity,
      inUseCapacity: resource.inUseCapacity,
      unit: resource.unit,
      minimumLevel: resource.minimumLevel,
      criticalLevel: resource.criticalLevel,
      reorderLevel: resource.reorderLevel,
      maxCapacity: resource.maxCapacity,
      status: resource.status,
      isCritical: resource.isCritical,
      isOperational: resource.isOperational,
      isShared: resource.isShared,
      lastMaintenance: resource.lastMaintenance?.toISOString(),
      nextMaintenance: resource.nextMaintenance?.toISOString(),
      maintenanceSchedule: resource.maintenanceSchedule,
      maintenanceNotes: resource.maintenanceNotes,
      supplier: resource.supplier,
      supplierContact: resource.supplierContact,
      lastRestock: resource.lastRestock?.toISOString(),
      lastRestockQuantity: resource.lastRestockQuantity,
      expiryDate: resource.expiryDate?.toISOString(),
      batchNumber: resource.batchNumber,
      unitCost: resource.unitCost,
      totalValue: resource.totalValue,
      specifications: resource.specifications,
      notes: resource.notes,
      usageHistory: resource.usageHistory,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString()
    }

    return NextResponse.json({ resource: transformedResource })

  } catch (error) {
    console.error('Error fetching resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/resources/[id] - Update resource
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Check if resource exists and belongs to user's facility
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        hospitalId: session.user.facilityId
      }
    })

    if (!existingResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Prepare update data with proper typing
    const updateData: Prisma.ResourceUpdateInput = {}

    // Only include fields that are provided
    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.category !== undefined) updateData.category = data.category
    // Fix: Use department connect instead of direct departmentId
    if (data.departmentId !== undefined) {
      updateData.department = data.departmentId 
        ? { connect: { id: data.departmentId } }
        : { disconnect: true }
    }
    if (data.totalCapacity !== undefined) updateData.totalCapacity = data.totalCapacity
    if (data.availableCapacity !== undefined) updateData.availableCapacity = data.availableCapacity
    if (data.reservedCapacity !== undefined) updateData.reservedCapacity = data.reservedCapacity
    if (data.inUseCapacity !== undefined) updateData.inUseCapacity = data.inUseCapacity
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.minimumLevel !== undefined) updateData.minimumLevel = data.minimumLevel
    if (data.criticalLevel !== undefined) updateData.criticalLevel = data.criticalLevel
    if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel
    if (data.maxCapacity !== undefined) updateData.maxCapacity = data.maxCapacity
    if (data.status !== undefined) updateData.status = data.status
    if (data.isOperational !== undefined) updateData.isOperational = data.isOperational
    if (data.isCritical !== undefined) updateData.isCritical = data.isCritical
    if (data.isShared !== undefined) updateData.isShared = data.isShared
    if (data.lastMaintenance !== undefined) updateData.lastMaintenance = data.lastMaintenance ? new Date(data.lastMaintenance) : null
    if (data.nextMaintenance !== undefined) updateData.nextMaintenance = data.nextMaintenance ? new Date(data.nextMaintenance) : null
    if (data.maintenanceSchedule !== undefined) updateData.maintenanceSchedule = data.maintenanceSchedule
    if (data.maintenanceNotes !== undefined) updateData.maintenanceNotes = data.maintenanceNotes
    if (data.supplier !== undefined) updateData.supplier = data.supplier
    if (data.supplierContact !== undefined) updateData.supplierContact = data.supplierContact
    if (data.lastRestock !== undefined) updateData.lastRestock = data.lastRestock ? new Date(data.lastRestock) : null
    if (data.lastRestockQuantity !== undefined) updateData.lastRestockQuantity = data.lastRestockQuantity
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null
    if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber
    if (data.unitCost !== undefined) updateData.unitCost = data.unitCost
    if (data.totalValue !== undefined) updateData.totalValue = data.totalValue
    if (data.specifications !== undefined) updateData.specifications = data.specifications
    if (data.notes !== undefined) updateData.notes = data.notes

    // Update resource
    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: updateData
    })

    // Log the resource update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name || 'Unknown',
        action: 'UPDATE',
        entityType: 'RESOURCE',
        entityId: resource.id,
        description: `Updated resource: ${resource.name}`,
        changes: data,
        facilityId: session.user.facilityId
      }
    })

    return NextResponse.json({ resource })

  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/[id] - Delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if resource exists and belongs to user's facility
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        hospitalId: session.user.facilityId
      }
    })

    if (!existingResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Delete resource
    await prisma.resource.delete({
      where: { id: params.id }
    })

    // Log the resource deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name || 'Unknown',
        action: 'DELETE',
        entityType: 'RESOURCE',
        entityId: params.id,
        description: `Deleted resource: ${existingResource.name}`,
        facilityId: session.user.facilityId
      }
    })

    return NextResponse.json({ message: 'Resource deleted successfully' })

  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}