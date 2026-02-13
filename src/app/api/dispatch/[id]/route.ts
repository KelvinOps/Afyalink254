// app/api/dispatch/[id]/route.ts 

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'
import { auditLog } from '@/app/lib/audit'
import { AmbulanceStatus } from '@prisma/client'

// ── Types ────────────────────────────────────────────────────────────────────

/** All scalar values that can appear in a Prisma dispatchLog update payload */
type DispatchUpdateValue =
  | string
  | number
  | Date
  | null
  | undefined

// Define the Prisma DispatchLog update input type
type DispatchLogUpdateInput = {
  status?: string
  ambulanceId?: string | null
  countyAmbulanceId?: string | null
  destinationHospitalId?: string | null
  instructionsGiven?: string | null
  outcome?: string | null
  notes?: string | null
  responseTime?: number | null
  transportTime?: number | null
  dispatched?: Date | null
  arrivedOnScene?: Date | null
  departedScene?: Date | null
  arrivedHospital?: Date | null
  cleared?: Date | null
  updatedAt?: Date
}

// ── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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

    const body = await request.json() as Record<string, DispatchUpdateValue>
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
      where: { id }
    })

    if (!currentDispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    // Build update data object - only include fields that are actually being updated
    const updateData: DispatchLogUpdateInput = {}
    const timelineUpdates: DispatchLogUpdateInput = {}

    // Update status with timeline tracking
    if (typeof status === 'string') {
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

    // Only add fields if they are explicitly provided in the request
    // Use null to clear a field, omit if undefined (not sent)
    if (ambulanceId !== undefined) {
      updateData.ambulanceId = ambulanceId as string | null
    }
    
    if (countyAmbulanceId !== undefined) {
      updateData.countyAmbulanceId = countyAmbulanceId as string | null
    }
    
    // Handle hospitalId - assuming it's for destinationHospitalId
    if (hospitalId !== undefined) {
      updateData.destinationHospitalId = hospitalId as string | null
    }
    
    if (instructions !== undefined) {
      updateData.instructionsGiven = instructions as string | null
    }
    if (outcome !== undefined) {
      updateData.outcome = outcome as string | null
    }
    if (notes !== undefined) {
      updateData.notes = notes as string | null
    }

    // Calculate response times if we have timeline data
    if (timelineUpdates.arrivedOnScene && currentDispatch.dispatched) {
      const dispatched = currentDispatch.dispatched instanceof Date ? 
        currentDispatch.dispatched : new Date(currentDispatch.dispatched)
      const arrived = timelineUpdates.arrivedOnScene instanceof Date ? 
        timelineUpdates.arrivedOnScene : new Date(timelineUpdates.arrivedOnScene)
      updateData.responseTime = Math.floor((arrived.getTime() - dispatched.getTime()) / 1000)
    }

    if (timelineUpdates.arrivedHospital && 
        (timelineUpdates.departedScene || currentDispatch.departedScene)) {
      const departed = timelineUpdates.departedScene || currentDispatch.departedScene
      const arrived = timelineUpdates.arrivedHospital
      if (departed && arrived) {
        const departedDate = departed instanceof Date ? departed : new Date(departed)
        const arrivedDate = arrived instanceof Date ? arrived : new Date(arrived)
        updateData.transportTime = Math.floor((arrivedDate.getTime() - departedDate.getTime()) / 1000)
      }
    }

    // Combine all updates
    const finalUpdateData: DispatchLogUpdateInput = {
      ...updateData,
      ...timelineUpdates,
      updatedAt: new Date()
    }

    const dispatch = await prisma.dispatchLog.update({
      where: { id },
      data: finalUpdateData,
      include: {
        ambulance: {
          select: {
            id: true,
            registrationNumber: true
          }
        },
        countyAmbulance: {
          select: {
            id: true,
            registrationNumber: true
          }
        }
      }
    })

    // Update ambulance status if assigned and status is a valid AmbulanceStatus enum value
    const ambulanceStatus = toAmbulanceStatus(status)
    if (ambulanceId && ambulanceStatus && typeof ambulanceId === 'string') {
      await prisma.ambulance.update({
        where: { id: ambulanceId },
        data: { status: ambulanceStatus }
      }).catch(err => {
        console.error('Error updating ambulance status:', err)
      })
    }

    // Update county ambulance status if assigned and status is a valid AmbulanceStatus enum value
    if (countyAmbulanceId && ambulanceStatus && typeof countyAmbulanceId === 'string') {
      await prisma.countyAmbulance.update({
        where: { id: countyAmbulanceId },
        data: { status: ambulanceStatus }
      }).catch(err => {
        console.error('Error updating county ambulance status:', err)
      })
    }

    // Log the action
    await auditLog({
      action: 'UPDATE',
      entityType: 'DISPATCH',
      entityId: id,
      userId: user.id,
      userRole: user.role,
      userName: user.firstName && user.lastName ? 
        `${user.firstName} ${user.lastName}` : 
        user.name || user.email || 'Unknown',
      description: `Updated dispatch ${dispatch.dispatchNumber} to ${status}`,
      changes: {
        status: status ?? null,
        ambulanceId: ambulanceId ?? null,
        countyAmbulanceId: countyAmbulanceId ?? null,
        destinationHospitalId: hospitalId ?? null,
        outcome: outcome ?? null
      }
    })

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

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
      where: { id },
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

/**
 * Safely casts a DispatchUpdateValue to an AmbulanceStatus enum member.
 * Returns undefined if the value is not a valid AmbulanceStatus key,
 * preventing a runtime Prisma error from a bad enum value.
 */
function toAmbulanceStatus(value: DispatchUpdateValue): AmbulanceStatus | undefined {
  if (typeof value !== 'string') return undefined
  if (Object.values(AmbulanceStatus).includes(value as AmbulanceStatus)) {
    return value as AmbulanceStatus
  }
  return undefined
}