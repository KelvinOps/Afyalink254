import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { auditLog } from '@/app/lib/audit'
import { verifyToken, User } from '@/app/lib/auth' // Import from your custom auth

interface RouteParams {
  params: {
    id: string
  }
}

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.slice(7) // Remove 'Bearer ' prefix
    const payload = await verifyToken(token)
    
    if (!payload) {
      return null
    }

    return payload as User
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ambulance = await prisma.ambulance.findUnique({
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
            callReceived: true
          }
        }
      }
    })

    if (!ambulance) {
      return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
    }

    // Mock maintenance records (in real app, this would come from a maintenance table)
    const maintenanceRecords = [
      {
        id: '1',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Regular Service',
        description: 'Oil change, brake inspection, tire rotation',
        cost: 15000,
        performedBy: 'Kenya Vehicle Services'
      },
      {
        id: '2',
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Medical Equipment Check',
        description: 'Defibrillator testing, oxygen system inspection',
        cost: 8000,
        performedBy: 'MedTech Solutions'
      }
    ]

    return NextResponse.json({ 
      ambulance,
      maintenanceRecords 
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
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      currentLocation,
      fuelLevel,
      isOperational
    } = body

    const ambulance = await prisma.ambulance.findUnique({
      where: { id: params.id }
    })

    if (!ambulance) {
      return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
    }

    const updatedAmbulance = await prisma.ambulance.update({
      where: { id: params.id },
      data: {
        ...(status && { status: status as any }),
        ...(currentLocation && { currentLocation }),
        ...(fuelLevel && { fuelLevel }),
        ...(isOperational !== undefined && { isOperational })
      }
    })

    // Log the action
    await auditLog({
      action: 'UPDATE',
      entityType: 'AMBULANCE',
      entityId: params.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Updated ambulance ${ambulance.registrationNumber} status to ${status}`
    })

    return NextResponse.json({ ambulance: updatedAmbulance })
  } catch (error) {
    console.error('Error updating ambulance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}