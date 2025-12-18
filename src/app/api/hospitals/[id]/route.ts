import { NextRequest, NextResponse } from 'next/server'
import { getHospitalById, updateHospital, deleteHospital } from '@/app/services/hospital.service'
import { verifyToken, hasPermission, createUserObject, ensureBasicPermissions } from '@/app/lib/auth'
import type { User } from '@/app/lib/auth'
import { z } from 'zod'

const updateHospitalSchema = z.object({
  name: z.string().min(1).optional(),
  mflCode: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'FAITH_BASED', 'MISSION', 'MILITARY', 'SPECIALIZED', 'NGO']).optional(),
  level: z.enum(['LEVEL_4', 'LEVEL_5', 'LEVEL_6']).optional(),
  ownership: z.enum(['COUNTY_GOVERNMENT', 'NATIONAL_GOVERNMENT', 'PRIVATE', 'FAITH_BASED', 'NGO', 'COMMUNITY']).optional(),
  subCounty: z.string().min(1).optional(),
  ward: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  phone: z.string().min(1).optional(),
  emergencyPhone: z.string().optional(),
  email: z.string().email().optional(),
  totalBeds: z.number().min(0).optional(),
  functionalBeds: z.number().min(0).optional(),
  icuBeds: z.number().min(0).optional(),
  hdUnitBeds: z.number().min(0).optional(), // Added missing field
  maternityBeds: z.number().min(0).optional(),
  pediatricBeds: z.number().min(0).optional(),
  emergencyBeds: z.number().min(0).optional(),
  isolationBeds: z.number().min(0).optional(), // Added missing field
  powerStatus: z.enum(['GRID', 'GENERATOR', 'SOLAR', 'HYBRID', 'NONE', 'UNSTABLE']).optional(),
  waterStatus: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE', 'RATIONED']).optional(),
  oxygenStatus: z.enum(['AVAILABLE', 'LIMITED', 'CRITICAL', 'UNAVAILABLE']).optional(),
  internetStatus: z.enum(['AVAILABLE', 'INTERMITTENT', 'UNAVAILABLE', 'SLOW']).optional(),
  operationalStatus: z.enum(['OPERATIONAL', 'LIMITED_CAPACITY', 'OVERWHELMED', 'CLOSED', 'EMERGENCY_ONLY', 'MAINTENANCE']).optional(),
  acceptingPatients: z.boolean().optional(),
  isActive: z.boolean().optional(),
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

    // Check if user has permission to read hospitals
    if (!hasPermission(user, 'hospitals.read') && !hasPermission(user, '*')) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 })
    }

    const hospital = await getHospitalById(params.id)

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    return NextResponse.json(hospital)
  } catch (error) {
    console.error('Error fetching hospital:', error)
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

    // Check permissions for updating hospitals
    const canUpdateHospitals = hasPermission(user, 'hospitals.write') || 
                              hasPermission(user, '*') ||
                              user.role === 'SUPER_ADMIN' ||
                              user.role === 'COUNTY_ADMIN' ||
                              user.role === 'HOSPITAL_ADMIN'

    if (!canUpdateHospitals) {
      return NextResponse.json({ 
        error: 'Forbidden - You do not have permission to update hospitals' 
      }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = updateHospitalSchema.parse(body)

    const hospital = await updateHospital(params.id, validatedData, user)

    return NextResponse.json(hospital)
  } catch (error) {
    console.error('Error updating hospital:', error)
    
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can delete hospitals
    if (user.role !== 'SUPER_ADMIN' && !hasPermission(user, '*')) {
      return NextResponse.json({ 
        error: 'Forbidden - Only SUPER_ADMIN can delete hospitals' 
      }, { status: 403 })
    }

    await deleteHospital(params.id, user)

    return NextResponse.json({ message: 'Hospital deleted successfully' })
  } catch (error) {
    console.error('Error deleting hospital:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}