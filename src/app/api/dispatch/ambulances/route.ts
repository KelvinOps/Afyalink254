// src/app/api/dispatch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { auditLog } from '@/app/lib/audit'
import { verifyToken, createUserObject, ensureBasicPermissions, hasPermission } from '@/app/lib/auth'

// Helper function to get user from request
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

// Helper function to check permissions
function checkPermission(user: any, permission: string) {
  if (!hasPermission(user, permission)) {
    throw new Error('Insufficient permissions')
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view dispatch data
    checkPermission(user, 'dispatch.read')

    const { searchParams } = new URL(request.url)
    const logs = searchParams.get('logs')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (logs) {
      // Get historical dispatch logs
      const dispatchLogs = await prisma.dispatchLog.findMany({
        take: limit,
        orderBy: { callReceived: 'desc' },
        include: {
          ambulance: {
            select: { registrationNumber: true }
          },
          countyAmbulance: {
            select: { registrationNumber: true }
          }
        }
      })

      return NextResponse.json({ logs: dispatchLogs })
    } else {
      // Get active emergency calls
      const activeCalls = await prisma.dispatchLog.findMany({
        where: {
          status: {
            in: ['RECEIVED', 'DISPATCHED', 'ON_SCENE', 'TRANSPORTING']
          }
        },
        orderBy: { callReceived: 'desc' },
        include: {
          ambulance: {
            select: { registrationNumber: true }
          },
          countyAmbulance: {
            select: { registrationNumber: true }
          }
        }
      })

      return NextResponse.json({ calls: activeCalls })
    }
  } catch (error) {
    console.error('Error fetching dispatch data:', error)
    
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Insufficient permissions to access dispatch data' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create dispatch
    checkPermission(user, 'dispatch.write')

    const body = await request.json()
    const {
      callerPhone,
      callerName,
      location,
      emergencyType,
      severity,
      description,
      patientCount = 1
    } = body

    // Validate required fields
    if (!callerPhone || !callerName || !location || !emergencyType || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create dispatch data object with correct field names from your Prisma schema
    const dispatchData: any = {
      dispatchNumber: `DISP-${Date.now()}`,
      callerPhone,
      callerName,
      callerLocation: location, // Correct field name from Prisma schema
      emergencyType: emergencyType,
      severity: severity,
      description: description || '',
      patientCount: parseInt(patientCount) || 1,
      status: 'RECEIVED',
      callReceived: new Date(),
    }

    // Add user context if available
    if (user.id) {
      dispatchData.dispatcherId = user.id
    }
    if (user.countyId) {
      dispatchData.countyId = user.countyId
    }
    if (user.facilityId) {
      dispatchData.facilityId = user.facilityId
    }

    // Create new dispatch log
    const dispatchLog = await prisma.dispatchLog.create({
      data: dispatchData
    })

    // Log the action - remove unsupported fields from auditLog
    await auditLog({
      action: 'CREATE',
      entityType: 'DISPATCH',
      entityId: dispatchLog.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Created new emergency dispatch: ${emergencyType} at ${location}`,
      // Remove userCountyId and userFacilityId as they don't exist in AuditLog model
      facilityId: user.facilityId // Use facilityId instead of userFacilityId
    })

    return NextResponse.json({ 
      success: true,
      dispatchLog 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating dispatch:', error)
    
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create dispatch' },
        { status: 403 }
      )
    }
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Dispatch number already exists' },
          { status: 409 }
        )
      }
      
      // Handle field validation errors
      if (error.message.includes('Unknown argument') || error.message.includes('Field')) {
        console.error('Prisma schema field mismatch:', error.message)
        return NextResponse.json(
          { error: 'Schema configuration error. Check field names.' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update dispatch
    if (!hasPermission(user, 'dispatch.write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Dispatch ID required' }, { status: 400 })
    }

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