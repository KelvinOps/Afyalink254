// src/app/api/dispatch/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { auditLog } from '@/app/lib/audit'
import { verifyToken, createUserObject, ensureBasicPermissions, hasPermission } from '@/app/lib/auth'

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
  { params }: { params: { id: string } }
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

    const { id } = params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['RECEIVED', 'DISPATCHED', 'ON_SCENE', 'TRANSPORTING', 'AT_HOSPITAL', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update dispatch log
    const updatedDispatch = await prisma.dispatchLog.update({
      where: { id },
      data: { status }
    })

    // Log the action
    await auditLog({
      action: 'UPDATE',
      entityType: 'DISPATCH',
      entityId: updatedDispatch.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Updated dispatch ${updatedDispatch.dispatchNumber} status to ${status}`,
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
  { params }: { params: { id: string } }
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

    const { id } = params

    const dispatch = await prisma.dispatchLog.findUnique({
      where: { id },
      include: {
        ambulance: {
          select: { registrationNumber: true }
        },
        countyAmbulance: {
          select: { registrationNumber: true }
        },
        dispatchCenter: {
          select: { name: true, code: true }
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