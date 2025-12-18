import { NextRequest, NextResponse } from 'next/server'
import { updateHospitalStatus, getHospitalStatus } from '@/app/services/hospital.service'
import { verifyToken, hasPermission, createUserObject, ensureBasicPermissions } from '@/app/lib/auth'
import type { User } from '@/app/lib/auth'
import { z } from 'zod'

const statusUpdateSchema = z.object({
  operationalStatus: z.enum(['OPERATIONAL', 'LIMITED_CAPACITY', 'OVERWHELMED', 'CLOSED', 'EMERGENCY_ONLY', 'MAINTENANCE']),
  acceptingPatients: z.boolean(),
  emergencyOnlyMode: z.boolean().optional(),
  availableBeds: z.number().min(0),
  availableIcuBeds: z.number().min(0),
  availableEmergencyBeds: z.number().min(0),
  powerStatus: z.enum(['GRID', 'GENERATOR', 'SOLAR', 'HYBRID', 'NONE', 'UNSTABLE']).optional(),
  waterStatus: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE', 'RATIONED']).optional(),
  oxygenStatus: z.enum(['AVAILABLE', 'LIMITED', 'CRITICAL', 'UNAVAILABLE']).optional(),
  internetStatus: z.enum(['AVAILABLE', 'INTERMITTENT', 'UNAVAILABLE', 'SLOW']).optional(),
  notes: z.string().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// Helper function to authenticate requests
async function authenticateRequest(request: NextRequest): Promise<{ user: User | null; error: string | null }> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    const payload = await verifyToken(token)
    
    if (!payload) {
      return { user: null, error: 'Invalid or expired token' }
    }

    // Create user object from token payload
    const user = createUserObject(payload)
    const userWithPermissions = ensureBasicPermissions(user)
    
    return { user: userWithPermissions, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read hospital status
    if (!hasPermission(user, 'hospitals.read') && !hasPermission(user, '*')) {
      return NextResponse.json({ 
        error: 'Forbidden - Insufficient permissions to view hospital status' 
      }, { status: 403 })
    }

    const status = await getHospitalStatus(params.id)

    if (!status) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching hospital status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    // Check permissions for updating hospital status
    const canUpdateStatus = hasPermission(user, 'hospitals.write') || 
                           hasPermission(user, '*') ||
                           user.role === 'SUPER_ADMIN' ||
                           user.role === 'COUNTY_ADMIN' ||
                           user.role === 'HOSPITAL_ADMIN'

    if (!canUpdateStatus) {
      return NextResponse.json({ 
        error: 'Forbidden - You do not have permission to update hospital status' 
      }, { status: 403 })
    }

    // Additional check: Hospital admins can only update their own hospital
    if (user.role === 'HOSPITAL_ADMIN' && user.facilityId !== params.id) {
      return NextResponse.json({ 
        error: 'Forbidden - You can only update the status of your own hospital' 
      }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = statusUpdateSchema.parse(body)

    const status = await updateHospitalStatus(params.id, validatedData, user)

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error updating hospital status:', error)
    
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