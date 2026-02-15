import { NextRequest, NextResponse } from 'next/server'
import { updateHospitalCapacity, getHospitalCapacity } from '@/app/services/hospital.service'
import { verifyToken, createUserObject } from '@/app/lib/auth'
import { z } from 'zod'

const capacityUpdateSchema = z.object({
  availableBeds: z.number().min(0),
  availableIcuBeds: z.number().min(0),
  availableEmergencyBeds: z.number().min(0),
  availableMaternityBeds: z.number().min(0).optional(),
  availablePediatricBeds: z.number().min(0).optional(),
  availableHdUnitBeds: z.number().min(0).optional(),
  availableIsolationBeds: z.number().min(0).optional(),
  occupancyRate: z.number().min(0).max(100).optional(),
  lastBedUpdate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Helper function to get user from request
async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
               request.cookies.get('token')?.value

  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return null
  }

  return createUserObject({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    facilityId: payload.facilityId,
    countyId: payload.countyId
  })
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await the params
    const { id } = await params

    const capacity = await getHospitalCapacity(id)

    if (!capacity) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    return NextResponse.json(capacity)
  } catch (error) {
    console.error('Error fetching hospital capacity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions using your existing auth system
    const canUpdate = user.permissions.includes('hospitals.write') || 
                     user.permissions.includes('*') ||
                     user.role === 'HOSPITAL_ADMIN' ||
                     user.role === 'DOCTOR' ||
                     user.role === 'NURSE'

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Await the params
    const { id } = await params

    const body = await request.json()
    
    // Validate input
    const validatedData = capacityUpdateSchema.parse(body)

    const capacity = await updateHospitalCapacity(id, validatedData, user)

    return NextResponse.json(capacity)
  } catch (error) {
    console.error('Error updating hospital capacity:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}