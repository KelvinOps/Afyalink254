// app/api/dispatch/ambulances/[id]/route.ts 

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'
import { auditLog, AuditAction } from '@/app/lib/audit'
import { AmbulanceStatus } from '@prisma/client'

// Define proper types for ambulance update data with Prisma-compatible types
interface AmbulanceUpdateData {
  status?: AmbulanceStatus
  currentLocation?: object | string
  fuelLevel?: number
  isOperational?: boolean
  driverName?: string
  driverPhone?: string
  paramedicName?: string
  mileage?: number
  odometerReading?: number
}

interface CountyAmbulanceUpdateData {
  status?: AmbulanceStatus
  currentLocation?: object | string
  fuelLevel?: number
  isOperational?: boolean
  driverName?: string
  driverPhone?: string
  mileage?: number
}

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await the params
    const { id } = await params

    // Try to find in hospital ambulances first
    const ambulance = await prisma.ambulance.findUnique({
      where: { id },
      include: {
        hospital: {
          select: {
            name: true,
            county: {
              select: {
                name: true
              }
            }
          }
        },
        dispatchLogs: {
          take: 10,
          orderBy: { callReceived: 'desc' },
          select: {
            id: true,
            dispatchNumber: true,
            emergencyType: true,
            status: true,
            callReceived: true,
            severity: true
          }
        }
      }
    })

    let ambulanceType: 'HOSPITAL' | 'COUNTY' = 'HOSPITAL'
    let responseAmbulance = ambulance
    let countyIdForAccess: string | undefined
    
    // If not found in hospital ambulances, try county ambulances
    if (!ambulance) {
      const countyAmbulance = await prisma.countyAmbulance.findUnique({
        where: { id },
        include: {
          county: {
            select: {
              name: true
            }
          },
          dispatchLogs: {
            take: 10,
            orderBy: { callReceived: 'desc' },
            select: {
              id: true,
              dispatchNumber: true,
              emergencyType: true,
              status: true,
              callReceived: true,
              severity: true
            }
          }
        }
      })
      
      if (countyAmbulance) {
        // Use a properly typed variable instead of casting
        responseAmbulance = countyAmbulance as unknown as typeof ambulance
        ambulanceType = 'COUNTY'
        countyIdForAccess = countyAmbulance.countyId
      }
    }

    if (!responseAmbulance) {
      return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
    }

    // Check access permissions
    if (ambulanceType === 'HOSPITAL') {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.hospitalId !== responseAmbulance.hospitalId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (ambulanceType === 'COUNTY') {
      // For county ambulances, check countyId
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.countyId !== countyIdForAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Mock maintenance records (should come from separate table in real app)
    const maintenanceRecords = [
      {
        id: '1',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Regular Service',
        description: 'Oil change, brake inspection, tire rotation, engine check',
        cost: 15000,
        performedBy: 'Kenya Vehicle Services',
        nextServiceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Medical Equipment Check',
        description: 'Defibrillator testing, oxygen system inspection, ventilator calibration',
        cost: 25000,
        performedBy: 'MedTech Solutions',
        nextServiceDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    // Format dates for frontend
    const formattedAmbulance = {
      ...responseAmbulance,
      ambulanceType,
      lastServiceDate: responseAmbulance.lastServiceDate?.toISOString(),
      nextServiceDate: responseAmbulance.nextServiceDate?.toISOString(),
      createdAt: responseAmbulance.createdAt.toISOString(),
      updatedAt: responseAmbulance.updatedAt.toISOString()
    }

    return NextResponse.json({ 
      ambulance: formattedAmbulance,
      maintenanceRecords,
      ambulanceType
    })
  } catch (error) {
    console.error('Error fetching ambulance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await the params
    const { id } = await params

    const body = await request.json()
    const { 
      status, 
      currentLocation, 
      fuelLevel, 
      isOperational,
      driverName,
      driverPhone,
      paramedicName,
      mileage,
      odometerReading
    } = body

    // Try to update hospital ambulance first
    const ambulance = await prisma.ambulance.findUnique({
      where: { id }
    })

    let ambulanceType: 'HOSPITAL' | 'COUNTY' = 'HOSPITAL'
    let updatedAmbulance
    
    if (ambulance) {
      // Check permissions for hospital ambulance
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.hospitalId !== ambulance.hospitalId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      
      // Build update data with proper typing
      const updateData: AmbulanceUpdateData = {}
      if (status) updateData.status = status as AmbulanceStatus
      if (currentLocation !== undefined) updateData.currentLocation = currentLocation
      if (fuelLevel !== undefined) updateData.fuelLevel = fuelLevel
      if (isOperational !== undefined) updateData.isOperational = isOperational
      if (driverName !== undefined) updateData.driverName = driverName
      if (driverPhone !== undefined) updateData.driverPhone = driverPhone
      if (paramedicName !== undefined) updateData.paramedicName = paramedicName
      if (mileage !== undefined) updateData.mileage = mileage
      if (odometerReading !== undefined) updateData.odometerReading = odometerReading
      
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
      }

      updatedAmbulance = await prisma.ambulance.update({
        where: { id },
        data: updateData
      })
    } else {
      // Try county ambulance
      const countyAmbulance = await prisma.countyAmbulance.findUnique({
        where: { id }
      })
      
      if (countyAmbulance) {
        ambulanceType = 'COUNTY'
        
        // Check permissions for county ambulance
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.countyId !== countyAmbulance.countyId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        
        // Build update data for county ambulance with proper typing
        const countyUpdateData: CountyAmbulanceUpdateData = {}
        if (status) countyUpdateData.status = status as AmbulanceStatus
        if (currentLocation !== undefined) countyUpdateData.currentLocation = currentLocation
        if (fuelLevel !== undefined) countyUpdateData.fuelLevel = fuelLevel
        if (isOperational !== undefined) countyUpdateData.isOperational = isOperational
        if (driverName !== undefined) countyUpdateData.driverName = driverName
        if (driverPhone !== undefined) countyUpdateData.driverPhone = driverPhone
        if (mileage !== undefined) countyUpdateData.mileage = mileage
        
        if (Object.keys(countyUpdateData).length === 0) {
          return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        updatedAmbulance = await prisma.countyAmbulance.update({
          where: { id },
          data: countyUpdateData
        })
      } else {
        return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
      }
    }

    // Ensure we have an updated ambulance before proceeding
    if (!updatedAmbulance) {
      return NextResponse.json({ error: 'Failed to update ambulance' }, { status: 500 })
    }

    // Log the action with proper AuditAction enum
    await auditLog({
      action: AuditAction.UPDATE,
      entityType: ambulanceType === 'HOSPITAL' ? 'AMBULANCE' : 'COUNTY_AMBULANCE',
      entityId: id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Updated ambulance ${updatedAmbulance.registrationNumber} status to ${status || 'other fields'}`,
      facilityId: user.facilityId || user.hospitalId
    })

    return NextResponse.json({ 
      ambulance: updatedAmbulance,
      ambulanceType
    })
  } catch (error) {
    console.error('Error updating ambulance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}