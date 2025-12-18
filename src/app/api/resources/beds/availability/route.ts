// app/api/resources/beds/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { AuditAction, AlertType, AlertSeverity, AudienceType, AlertStatus } from '@prisma/client' 


// Define types for bed resources
type BedType = 'BED' | 'ICU_BED'

interface BedResource {
  id: string
  name: string
  type: BedType
  totalCapacity: number
  availableCapacity: number
  inUseCapacity: number
  reservedCapacity: number
  status: string
  isCritical: boolean
  department?: {
    id: string
    name: string
    type: string
  }
  hospital?: {
    id: string
    name: string
    code: string
  }
}

interface HospitalDepartment {
  hospital: string
  department: string
  departmentType: string
  totalBeds: number
  availableBeds: number
  inUseBeds: number
  reservedBeds: number
  utilization: number
  resources: BedResource[]
}

// GET /api/resources/beds/availability - Get bed availability across departments
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to access resources
    if (!user.permissions?.includes('resources.read') && 
        !user.permissions?.includes('*')) {
      return NextResponse.json({ error: 'Forbidden - No permission' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const typeParam = searchParams.get('type')

    // Parse bed types from query parameter
    let bedTypes: BedType[] = ['BED', 'ICU_BED']
    if (typeParam) {
      const requestedTypes = typeParam.split(',')
      bedTypes = requestedTypes.filter((type): type is BedType => 
        type === 'BED' || type === 'ICU_BED'
      )
    }

    // Build where clause based on user role
    const where: any = {
      type: { in: bedTypes }
    }

    // Filter by hospital for hospital-level roles
    if (user.facilityId && user.role !== 'COUNTY_ADMIN' && user.role !== 'SUPER_ADMIN') {
      where.hospitalId = user.facilityId
    }
    // COUNTY_ADMIN can see all hospitals in their county
    else if (user.countyId && user.role === 'COUNTY_ADMIN') {
      const countyHospitals = await prisma.hospital.findMany({
        where: { countyId: user.countyId },
        select: { id: true }
      })
      const hospitalIds = countyHospitals.map((h: { id: string }) => h.id)
      where.hospitalId = { in: hospitalIds }
    }
    // SUPER_ADMIN can see all - no hospital filter needed

    if (departmentId) {
      where.departmentId = departmentId
    }

    // Get bed resources grouped by department
    const bedResources = await prisma.resource.findMany({
      where,
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
      },
      orderBy: [
        {
          hospital: {
            name: 'asc'
          }
        },
        {
          department: {
            name: 'asc'
          }
        }
      ]
    })

    // Aggregate data by department and hospital
    const statsByHospitalDept: Record<string, HospitalDepartment> = {}

    bedResources.forEach((resource: any) => {
      const hospitalName = resource.hospital?.name || 'Unknown Hospital'
      const deptName = resource.department?.name || 'Unknown Department'
      const key = `${hospitalName}|${deptName}`
      
      if (!statsByHospitalDept[key]) {
        statsByHospitalDept[key] = {
          hospital: hospitalName,
          department: deptName,
          departmentType: resource.department?.type || 'UNKNOWN',
          totalBeds: 0,
          availableBeds: 0,
          inUseBeds: 0,
          reservedBeds: 0,
          utilization: 0,
          resources: []
        }
      }

      const stats = statsByHospitalDept[key]
      stats.totalBeds += resource.totalCapacity
      stats.availableBeds += resource.availableCapacity
      stats.inUseBeds += resource.inUseCapacity
      stats.reservedBeds += resource.reservedCapacity
      
      stats.resources.push({
        id: resource.id,
        name: resource.name,
        type: resource.type as BedType,
        totalCapacity: resource.totalCapacity,
        availableCapacity: resource.availableCapacity,
        inUseCapacity: resource.inUseCapacity,
        reservedCapacity: resource.reservedCapacity,
        status: resource.status,
        isCritical: resource.isCritical,
        department: resource.department,
        hospital: resource.hospital
      })
    })

    // Calculate utilization for each department
    Object.keys(statsByHospitalDept).forEach(key => {
      const stats = statsByHospitalDept[key]
      if (stats.totalBeds > 0) {
        stats.utilization = ((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100
      }
    })

    const result = Object.values(statsByHospitalDept)

    // Get overall statistics
    const overallStats = {
      totalBeds: result.reduce((sum, dept) => sum + dept.totalBeds, 0),
      availableBeds: result.reduce((sum, dept) => sum + dept.availableBeds, 0),
      inUseBeds: result.reduce((sum, dept) => sum + dept.inUseBeds, 0),
      reservedBeds: result.reduce((sum, dept) => sum + dept.reservedBeds, 0),
      utilization: 0,
      hospitalCount: new Set(result.map(dept => dept.hospital)).size,
      departmentCount: new Set(result.map(dept => dept.department)).size
    }

    if (overallStats.totalBeds > 0) {
      overallStats.utilization = ((overallStats.totalBeds - overallStats.availableBeds) / overallStats.totalBeds) * 100
    }

    return NextResponse.json({
      data: {
        departments: result,
        overall: overallStats,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching bed availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/resources/beds/availability - Update bed availability
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update resources
    if (!user.permissions?.includes('resources.write') && 
        !user.permissions?.includes('*')) {
      return NextResponse.json({ error: 'Forbidden - No permission' }, { status: 403 })
    }

    const data = await request.json()
    const { resourceId, availableCapacity, inUseCapacity, reservedCapacity, status } = data

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    // Build where clause for resource verification
    const where: any = {
      id: resourceId,
      type: { in: ['BED', 'ICU_BED'] as BedType[] }
    }

    // Hospital-level users can only update their own hospital's resources
    if (user.facilityId && user.role !== 'COUNTY_ADMIN' && user.role !== 'SUPER_ADMIN') {
      where.hospitalId = user.facilityId
    }
    // COUNTY_ADMIN can update resources in their county
    else if (user.countyId && user.role === 'COUNTY_ADMIN') {
      const countyHospitals = await prisma.hospital.findMany({
        where: { countyId: user.countyId },
        select: { id: true }
      })
      const hospitalIds = countyHospitals.map((h: { id: string }) => h.id)
      where.hospitalId = { in: hospitalIds }
    }

    // Verify resource exists and user has access
    const existingResource = await prisma.resource.findFirst({
      where,
      include: {
        hospital: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!existingResource) {
      return NextResponse.json(
        { error: 'Bed resource not found or access denied' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (availableCapacity !== undefined) {
      if (availableCapacity < 0 || availableCapacity > existingResource.totalCapacity) {
        return NextResponse.json(
          { error: 'Available capacity must be between 0 and total capacity' },
          { status: 400 }
        )
      }
      updateData.availableCapacity = availableCapacity
    }

    if (inUseCapacity !== undefined) {
      if (inUseCapacity < 0 || inUseCapacity > existingResource.totalCapacity) {
        return NextResponse.json(
          { error: 'In-use capacity must be between 0 and total capacity' },
          { status: 400 }
        )
      }
      updateData.inUseCapacity = inUseCapacity
    }

    if (reservedCapacity !== undefined) {
      if (reservedCapacity < 0 || reservedCapacity > existingResource.totalCapacity) {
        return NextResponse.json(
          { error: 'Reserved capacity must be between 0 and total capacity' },
          { status: 400 }
        )
      }
      updateData.reservedCapacity = reservedCapacity
    }

    if (status !== undefined) {
      const validStatuses = ['AVAILABLE', 'IN_USE', 'RESERVED', 'MAINTENANCE', 'OUT_OF_ORDER']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    // Validate capacity constraints
    const totalUsed = (updateData.inUseCapacity || existingResource.inUseCapacity) + 
                     (updateData.reservedCapacity || existingResource.reservedCapacity)
    const totalAvailable = updateData.availableCapacity !== undefined ? 
                          updateData.availableCapacity : existingResource.availableCapacity

    if (totalUsed + totalAvailable > existingResource.totalCapacity) {
      return NextResponse.json(
        { error: 'Total capacity exceeded. Check in-use + reserved + available <= total capacity' },
        { status: 400 }
      )
    }

    // Ensure at least one capacity field is updated
    if (Object.keys(updateData).length === 1) { // only updatedAt
      return NextResponse.json(
        { error: 'No capacity fields provided for update' },
        { status: 400 }
      )
    }

    // Update resource
    const resource = await prisma.resource.update({
      where: { id: resourceId },
      data: updateData,
      include: {
        department: {
          select: {
            name: true
          }
        }
      }
    })

    // Log the bed availability update
    const auditData = {
      userId: user.id,
      userRole: user.role,
      userName: user.name || 'Unknown',
      action: 'UPDATE' as AuditAction,
      entityType: 'RESOURCE',
      entityId: resource.id,
      description: `Updated bed availability: ${resource.name} in ${resource.department?.name || 'Unknown'}`,
      changes: {
        before: {
          availableCapacity: existingResource.availableCapacity,
          inUseCapacity: existingResource.inUseCapacity,
          reservedCapacity: existingResource.reservedCapacity,
          status: existingResource.status
        },
        after: {
          availableCapacity: resource.availableCapacity,
          inUseCapacity: resource.inUseCapacity,
          reservedCapacity: resource.reservedCapacity,
          status: resource.status
        }
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      facilityId: user.facilityId,
      success: true
    }

    await prisma.auditLog.create({
      data: auditData
    })

    // Send notification if bed status becomes critical
    if (resource.availableCapacity <= (resource.criticalLevel || 0)) {
      try {
        // Create a SystemAlert with proper enum values
        await prisma.systemAlert.create({
          data: {
            alertType: 'RESOURCE_SHORTAGE' as AlertType,
            severity: 'CRITICAL' as AlertSeverity,
            title: 'Critical Bed Alert',
            message: `${resource.name} in ${resource.department?.name || 'Unknown'} has reached critical level. Available: ${resource.availableCapacity}`,
            sourceType: 'RESOURCE',
            sourceId: resource.id,
            hospitalId: existingResource.hospitalId,
            audienceType: 'SPECIFIC_HOSPITAL' as AudienceType,
            targetRoles: ['HOSPITAL_ADMIN', 'DOCTOR'],
            priority: 1, // Highest priority
            requiresAction: true,
            status: 'ACTIVE' as AlertStatus
          }
        })
      } catch (alertError) {
        console.warn('SystemAlert creation failed:', alertError)
        // Fallback: Create another audit log for the critical alert
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            userRole: user.role,
            userName: user.name || 'Unknown',
            action: 'UPDATE' as AuditAction, 
            entityType: 'RESOURCE',
            entityId: resource.id,
            description: `CRITICAL BED ALERT: ${resource.name} available capacity (${resource.availableCapacity}) reached critical level ${resource.criticalLevel}`,
            changes: {
              level: 'CRITICAL',
              availableCapacity: resource.availableCapacity,
              criticalLevel: resource.criticalLevel
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            facilityId: user.facilityId,
            success: true
          }
        })
      }
    }

    return NextResponse.json({
      data: {
        message: 'Bed availability updated successfully',
        resource 
      }
    })

  } catch (error) {
    console.error('Error updating bed availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}