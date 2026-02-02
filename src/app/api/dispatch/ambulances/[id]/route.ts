// app/api/dispatch/ambulances/[id]/route.ts 

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'
import { auditLog } from '@/app/lib/audit'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Try to find in hospital ambulances first
    let ambulance = await prisma.ambulance.findUnique({
      where: { id: params.id },
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
    
    // If not found in hospital ambulances, try county ambulances
    if (!ambulance) {
      ambulance = await prisma.countyAmbulance.findUnique({
        where: { id: params.id },
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
      }) as any
      ambulanceType = 'COUNTY'
    }

    if (!ambulance) {
      return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
    }

    // Check access permissions
    if (ambulanceType === 'HOSPITAL') {
      if (user.role !== 'ADMIN' && user.hospitalId !== ambulance.hospitalId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (ambulanceType === 'COUNTY') {
      if (user.role !== 'ADMIN' && user.countyId !== ambulance.countyId) {
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
      ...ambulance,
      ambulanceType,
      lastServiceDate: ambulance.lastServiceDate?.toISOString(),
      nextServiceDate: ambulance.nextServiceDate?.toISOString(),
      createdAt: ambulance.createdAt.toISOString(),
      updatedAt: ambulance.updatedAt.toISOString()
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
  { params }: { params: { id: string } }
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
    let ambulance = await prisma.ambulance.findUnique({
      where: { id: params.id }
    })

    let ambulanceType: 'HOSPITAL' | 'COUNTY' = 'HOSPITAL'
    let updateData: any = {}
    
    if (ambulance) {
      // Check permissions for hospital ambulance
      if (user.role !== 'ADMIN' && user.hospitalId !== ambulance.hospitalId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      
      // Build update data
      if (status) updateData.status = status
      if (currentLocation) updateData.currentLocation = currentLocation
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

      ambulance = await prisma.ambulance.update({
        where: { id: params.id },
        data: updateData
      })
    } else {
      // Try county ambulance
      ambulance = await prisma.countyAmbulance.findUnique({
        where: { id: params.id }
      })
      
      if (ambulance) {
        ambulanceType = 'COUNTY'
        
        // Check permissions for county ambulance
        if (user.role !== 'ADMIN' && user.countyId !== ambulance.countyId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        
        // Build update data for county ambulance
        const countyUpdateData: any = {}
        if (status) countyUpdateData.status = status
        if (currentLocation) countyUpdateData.currentLocation = currentLocation
        if (fuelLevel !== undefined) countyUpdateData.fuelLevel = fuelLevel
        if (isOperational !== undefined) countyUpdateData.isOperational = isOperational
        if (driverName !== undefined) countyUpdateData.driverName = driverName
        if (driverPhone !== undefined) countyUpdateData.driverPhone = driverPhone
        if (mileage !== undefined) countyUpdateData.mileage = mileage
        if (Object.keys(countyUpdateData).length === 0) {
          return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        ambulance = await prisma.countyAmbulance.update({
          where: { id: params.id },
          data: countyUpdateData
        })
      } else {
        return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
      }
    }

    // Log the action
    await auditLog({
      action: 'UPDATE',
      entityType: ambulanceType === 'HOSPITAL' ? 'AMBULANCE' : 'COUNTY_AMBULANCE',
      entityId: params.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Updated ambulance ${ambulance.registrationNumber} status to ${status || 'other fields'}`,
      facilityId: user.facilityId || user.hospitalId
    })

    return NextResponse.json({ 
      ambulance,
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