import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { auditLog } from '@/app/lib/audit'
import { verifyToken, createUserObject, ensureBasicPermissions, hasPermission } from '@/app/lib/auth'

// Define params type
type RouteParams = {
  params: Promise<{ id: string }>
}

async function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    
    if (!payload) {
      return null
    }

    const user = createUserObject(payload)
    return ensureBasicPermissions(user)
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update dispatch
    if (!hasPermission(user, 'dispatch.write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['RECEIVED', 'ASSESSING', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING', 'AT_HOSPITAL', 'COMPLETED', 'CANCELLED', 'NO_AMBULANCE_AVAILABLE']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get current dispatch to check status transition
    const currentDispatch = await prisma.dispatchLog.findUnique({
      where: { id },
      select: { status: true }
    })

    if (!currentDispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    // Update dispatch log
    const updatedDispatch = await prisma.dispatchLog.update({
      where: { id },
      data: { 
        status,
        // Update relevant timestamps based on status
        ...(status === 'DISPATCHED' && { dispatched: new Date() }),
        ...(status === 'ON_SCENE' && { arrivedOnScene: new Date() }),
        ...(status === 'TRANSPORTING' && { departedScene: new Date() }),
        ...(status === 'AT_HOSPITAL' && { arrivedHospital: new Date() }),
        ...(status === 'COMPLETED' && { handoverCompleted: new Date() }),
        ...(status === 'CANCELLED' && { cleared: new Date() })
      }
    })

    // Log the action
    await auditLog({
      action: 'UPDATE',
      entityType: 'DISPATCH',
      entityId: updatedDispatch.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Updated dispatch ${updatedDispatch.dispatchNumber} status from ${currentDispatch.status} to ${status}`,
      facilityId: user.facilityId
    })

    return NextResponse.json({ 
      success: true,
      dispatch: updatedDispatch 
    })
  } catch (error) {
    console.error('Error updating dispatch:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view dispatch
    if (!hasPermission(user, 'dispatch.read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await context.params

    const dispatch = await prisma.dispatchLog.findUnique({
      where: { id },
      include: {
        ambulance: {
          select: { 
            registrationNumber: true,
            type: true,
            equipmentLevel: true
          }
        },
        countyAmbulance: {
          select: { 
            registrationNumber: true,
            type: true,
            equipmentLevel: true
          }
        },
        dispatchCenter: {
          select: { name: true, code: true, phone: true }
        },
        dispatcher: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    if (!dispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    return NextResponse.json({ dispatch })
  } catch (error) {
    console.error('Error fetching dispatch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete dispatch logs
    if (!hasPermission(user, 'dispatch.write') || !['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await context.params

    // Check if dispatch exists
    const dispatch = await prisma.dispatchLog.findUnique({
      where: { id }
    })

    if (!dispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    // Delete the dispatch
    await prisma.dispatchLog.delete({
      where: { id }
    })

    // Log the action
    await auditLog({
      action: 'DELETE',
      entityType: 'DISPATCH',
      entityId: id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Deleted dispatch log ${dispatch.dispatchNumber}`,
      facilityId: user.facilityId
    })

    return NextResponse.json({ 
      success: true,
      message: 'Dispatch deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting dispatch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}