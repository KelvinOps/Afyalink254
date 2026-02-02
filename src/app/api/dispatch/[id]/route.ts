// app/api/dispatch/[id]/route.ts 

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

    // First get the dispatch with basic info
    const dispatch = await prisma.dispatchLog.findUnique({
      where: { id: params.id },
      include: {
        ambulance: {
          select: {
            id: true,
            registrationNumber: true,
            type: true,
            equipmentLevel: true,
            driverName: true,
            driverPhone: true
          }
        },
        countyAmbulance: {
          select: {
            id: true,
            registrationNumber: true,
            type: true,
            driverName: true,
            driverPhone: true
          }
        }
      }
    })

    if (!dispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    // Fetch related data separately
    let dispatcher = null
    let hospital = null
    let nearestHospital = null
    let destinationHospital = null

    if (dispatch.dispatcherId) {
      dispatcher = await prisma.staff.findUnique({
        where: { id: dispatch.dispatcherId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      })
    }

    // Check both hospital fields
    if (dispatch.nearestHospitalId) {
      nearestHospital = await prisma.hospital.findUnique({
        where: { id: dispatch.nearestHospitalId },
        select: {
          name: true,
          address: true,
          emergencyPhone: true
        }
      })
    }

    if (dispatch.destinationHospitalId) {
      destinationHospital = await prisma.hospital.findUnique({
        where: { id: dispatch.destinationHospitalId },
        select: {
          name: true,
          address: true,
          emergencyPhone: true
        }
      })
    }

    // Format dispatcher name
    const dispatcherWithName = dispatcher ? {
      ...dispatcher,
      name: `${dispatcher.firstName} ${dispatcher.lastName}`.trim()
    } : null

    return NextResponse.json({ 
      dispatch: {
        ...dispatch,
        dispatcher: dispatcherWithName,
        nearestHospital,
        destinationHospital,
        // Use destinationHospital as hospital for backward compatibility
        hospital: destinationHospital || nearestHospital
      }
    })
  } catch (error) {
    console.error('Error fetching dispatch:', error)
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

    if (!['ADMIN', 'DISPATCHER', 'EMERGENCY_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      status, 
      ambulanceId, 
      countyAmbulanceId,
      hospitalId,
      instructions,
      outcome,
      notes 
    } = body

    // Get current dispatch
    const currentDispatch = await prisma.dispatchLog.findUnique({
      where: { id: params.id }
    })

    if (!currentDispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    const updateData: any = {}
    const timelineUpdates: any = {}

    // Update status with timeline tracking
    if (status) {
      updateData.status = status
      
      // Set timeline dates based on status
      switch (status) {
        case 'DISPATCHED':
          timelineUpdates.dispatched = new Date()
          break
        case 'ON_SCENE':
          timelineUpdates.arrivedOnScene = new Date()
          if (!currentDispatch.dispatched) {
            timelineUpdates.dispatched = new Date()
          }
          break
        case 'TRANSPORTING':
          timelineUpdates.departedScene = new Date()
          break
        case 'AT_HOSPITAL':
          timelineUpdates.arrivedHospital = new Date()
          break
        case 'COMPLETED':
          timelineUpdates.cleared = new Date()
          break
      }
    }

    if (ambulanceId) updateData.ambulanceId = ambulanceId
    if (countyAmbulanceId) updateData.countyAmbulanceId = countyAmbulanceId
    
    // Handle hospitalId - assuming it's for destinationHospitalId
    if (hospitalId) updateData.destinationHospitalId = hospitalId
    
    if (instructions) updateData.instructionsGiven = instructions
    if (outcome) updateData.outcome = outcome
    if (notes) updateData.notes = notes

    // Calculate response times if we have timeline data
    if (timelineUpdates.arrivedOnScene && currentDispatch.dispatched) {
      const dispatched = currentDispatch.dispatched instanceof Date ? 
        currentDispatch.dispatched : new Date(currentDispatch.dispatched)
      const arrived = timelineUpdates.arrivedOnScene instanceof Date ? 
        timelineUpdates.arrivedOnScene : new Date(timelineUpdates.arrivedOnScene)
      updateData.responseTime = Math.floor((arrived.getTime() - dispatched.getTime()) / 1000)
    }

    if (timelineUpdates.arrivedHospital && timelineUpdates.departedScene) {
      const departed = timelineUpdates.departedScene instanceof Date ? 
        timelineUpdates.departedScene : new Date(timelineUpdates.departedScene)
      const arrived = timelineUpdates.arrivedHospital instanceof Date ? 
        timelineUpdates.arrivedHospital : new Date(timelineUpdates.arrivedHospital)
      updateData.transportTime = Math.floor((arrived.getTime() - departed.getTime()) / 1000)
    }

    const dispatch = await prisma.dispatchLog.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...timelineUpdates,
        updatedAt: new Date()
      },
      include: {
        ambulance: {
          select: {
            registrationNumber: true
          }
        }
      }
    })

    // Update ambulance status if assigned
    if (ambulanceId && status) {
      await prisma.ambulance.update({
        where: { id: ambulanceId },
        data: { status }
      })
    }

    // Update county ambulance status if assigned
    if (countyAmbulanceId && status) {
      await prisma.countyAmbulance.update({
        where: { id: countyAmbulanceId },
        data: { status }
      })
    }

    // Log the action - remove the details field if auditLog doesn't accept it
    const auditData: any = {
      action: 'UPDATE',
      entityType: 'DISPATCH',
      entityId: params.id,
      userId: user.id,
      userRole: user.role,
      // Use firstName + lastName since your Staff model doesn't have a name field
      userName: user.firstName && user.lastName ? 
        `${user.firstName} ${user.lastName}` : 
        user.name || user.email || 'Unknown',
      description: `Updated dispatch ${dispatch.dispatchNumber} to ${status}`,
    }

    // Only add details if the auditLog function accepts it
    // Check your auditLog function signature to see if it has a details parameter
    // For now, we'll use changes field instead if details doesn't exist
    const changes = {
      status: status || null,
      ambulanceId: ambulanceId || null,
      countyAmbulanceId: countyAmbulanceId || null,
      destinationHospitalId: hospitalId || null,
      outcome: outcome || null
    }
    
    auditData.changes = changes

    await auditLog(auditData)

    return NextResponse.json({ 
      success: true,
      dispatch
    })
  } catch (error) {
    console.error('Error updating dispatch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
