//api/dispatch/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'
import { auditLog, AuditLogData } from '@/app/lib/audit'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
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

    // Get active calls (not completed or cancelled)
    const activeCalls = await prisma.dispatchLog.findMany({
      where: {
        status: {
          notIn: ['COMPLETED', 'CANCELLED']
        }
      },
      take: 20,
      orderBy: {
        callReceived: 'desc'
      },
      select: {
        id: true,
        dispatchNumber: true,
        emergencyType: true,
        severity: true,
        callerPhone: true,
        callerLocation: true,
        status: true,
        callReceived: true
      }
    })

    // Get recent dispatches (last 50)
    const recentDispatches = await prisma.dispatchLog.findMany({
      take: 50,
      orderBy: {
        callReceived: 'desc'
      },
      select: {
        id: true,
        dispatchNumber: true,
        emergencyType: true,
        severity: true,
        callerPhone: true,
        callerLocation: true,
        status: true,
        callReceived: true,
        ambulance: {
          select: {
            registrationNumber: true,
            type: true
          }
        },
        dispatcher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Format dispatcher names
    const formattedDispatches = recentDispatches.map(dispatch => ({
      ...dispatch,
      dispatcher: dispatch.dispatcher ? {
        ...dispatch.dispatcher,
        name: `${dispatch.dispatcher.firstName} ${dispatch.dispatcher.lastName}`.trim()
      } : null
    }))

    return NextResponse.json({
      activeCalls,
      recentDispatches: formattedDispatches
    })
  } catch (error) {
    console.error('Error fetching dispatch data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      callerPhone, 
      callerName, 
      callerLocation, 
      emergencyType, 
      severity, 
      description, 
      patientCount,
      coordinates,
      landmark,
      what3words
    } = body

    // Validate required fields
    if (!callerPhone || !callerLocation || !emergencyType || !severity || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate dispatch number
    const dispatchCount = await prisma.dispatchLog.count({
      where: {
        callReceived: {
          gte: new Date(new Date().getFullYear(), 0, 1), // From start of year
          lte: new Date(new Date().getFullYear(), 11, 31) // To end of year
        }
      }
    })

    const dispatchNumber = `DISP-${new Date().getFullYear()}-${String(dispatchCount + 1).padStart(6, '0')}`

    // Prepare data for creation with proper typing
    const dispatchData: Prisma.DispatchLogCreateInput = {
      dispatchNumber,
      callerPhone,
      callerName: callerName || null,
      callerLocation,
      emergencyType,
      severity,
      description,
      patientCount: patientCount || 1,
      status: 'RECEIVED',
      callReceived: new Date(),
      dispatcher: {
        connect: { id: user.id }
      },
      // Add optional location data
      coordinates: coordinates || undefined,
      landmark: landmark || undefined,
      what3words: what3words || undefined
    }

    // Create dispatch log
    const dispatch = await prisma.dispatchLog.create({
      data: dispatchData,
      include: {
        dispatcher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Format dispatcher name
    const formattedDispatch = {
      ...dispatch,
      dispatcher: dispatch.dispatcher ? {
        ...dispatch.dispatcher,
        name: `${dispatch.dispatcher.firstName} ${dispatch.dispatcher.lastName}`.trim()
      } : null
    }

    // Log the action with proper typing
    const auditData: AuditLogData = {
      action: 'CREATE',
      entityType: 'DISPATCH',
      entityId: dispatch.id,
      userId: user.id,
      userRole: user.role,
      // Use firstName + lastName or fallback
      userName: user.firstName && user.lastName ? 
        `${user.firstName} ${user.lastName}` : 
        user.name || user.email || 'Unknown',
      description: `Created new dispatch ${dispatchNumber} for ${emergencyType}`,
      // Use changes field for additional details
      changes: {
        callerPhone,
        callerLocation,
        emergencyType,
        severity,
        patientCount: patientCount || 1
      }
    }

    await auditLog(auditData)

    return NextResponse.json({ 
      success: true,
      dispatch: formattedDispatch,
      dispatchNumber
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating dispatch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}