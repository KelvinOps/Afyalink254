// app/api/dispatch/[id]/route.ts 

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'
import { auditLog } from '@/app/lib/audit'
import { AmbulanceStatus } from '@prisma/client'

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

// ── Types ────────────────────────────────────────────────────────────────────

/** All scalar values that can appear in a Prisma dispatchLog update payload */
type DispatchUpdateValue =
  | string
  | number
  | Date
  | null
  | undefined

/** Strongly-typed shape for the mutable update accumulator */
interface DispatchUpdateData {
  status?: string
  ambulanceId?: string
  countyAmbulanceId?: string
  destinationHospitalId?: string
  instructionsGiven?: string
  outcome?: string
  notes?: string
  responseTime?: number
  transportTime?: number
  updatedAt?: Date
  // timeline timestamps
  dispatched?: Date
  arrivedOnScene?: Date
  departedScene?: Date
  arrivedHospital?: Date
  cleared?: Date
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

// ── PATCH ────────────────────────────────────────────────────────────────────

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
      where: { id: params.id }
    })

    if (!currentDispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    // Build update data object - only include fields that are actually being updated
    const updateData: DispatchUpdateData = {}
    const timelineUpdates: Partial<DispatchUpdateData> = {}

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

    // Only add fields if they are provided
    if (ambulanceId !== undefined) updateData.ambulanceId = ambulanceId as string
    if (countyAmbulanceId !== undefined) updateData.countyAmbulanceId = countyAmbulanceId as string
    
    // Handle hospitalId - assuming it's for destinationHospitalId
    if (hospitalId !== undefined) updateData.destinationHospitalId = hospitalId as string
    
    if (instructions !== undefined) updateData.instructionsGiven = instructions as string
    if (outcome !== undefined) updateData.outcome = outcome as string
    if (notes !== undefined) updateData.notes = notes as string

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

    // Update ambulance status if assigned and status is a valid AmbulanceStatus enum value
    const ambulanceStatus = toAmbulanceStatus(status)
    if (ambulanceId && ambulanceStatus) {
      await prisma.ambulance.update({
        where: { id: ambulanceId as string },
        data: { status: ambulanceStatus }
      })
    }

    // Update county ambulance status if assigned and status is a valid AmbulanceStatus enum value
    if (countyAmbulanceId && ambulanceStatus) {
      await prisma.countyAmbulance.update({
        where: { id: countyAmbulanceId as string },
        data: { status: ambulanceStatus }
      })
    }

    // Log the action
    await auditLog({
      action: 'UPDATE',
      entityType: 'DISPATCH',
      entityId: params.id,
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