import { NextRequest, NextResponse } from 'next/server'
import { getHospitals, createHospital } from '@/app/services/hospital.service'
import { verifyToken, hasPermission, createUserObject, ensureBasicPermissions } from '@/app/lib/auth'
import type { User } from '@/app/lib/auth'
import { z } from 'zod'

const createHospitalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  mflCode: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'FAITH_BASED', 'MISSION', 'MILITARY', 'SPECIALIZED', 'NGO']),
  level: z.enum(['LEVEL_4', 'LEVEL_5', 'LEVEL_6']),
  ownership: z.enum(['COUNTY_GOVERNMENT', 'NATIONAL_GOVERNMENT', 'PRIVATE', 'FAITH_BASED', 'NGO', 'COMMUNITY']),
  countyId: z.string().min(1, 'County is required'),
  subCounty: z.string().min(1, 'Sub-county is required'),
  ward: z.string().min(1, 'Ward is required'),
  address: z.string().min(1, 'Address is required'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  phone: z.string().min(1, 'Phone is required'),
  emergencyPhone: z.string().optional(),
  email: z.string().email().optional(),
  totalBeds: z.number().min(0),
  functionalBeds: z.number().min(0),
  icuBeds: z.number().min(0),
  hdUnitBeds: z.number().min(0), // ADDED: Missing required field
  maternityBeds: z.number().min(0),
  pediatricBeds: z.number().min(0),
  emergencyBeds: z.number().min(0),
  isolationBeds: z.number().min(0), // ADDED: Missing required field
})

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

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read hospitals
    if (!hasPermission(user, 'hospitals.read') && !hasPermission(user, '*')) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    const hospitals = await getHospitals({
      county: searchParams.get('county') || undefined,
      level: searchParams.get('level') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    })

    return NextResponse.json(hospitals)
  } catch (error) {
    console.error('Error fetching hospitals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    // Check permissions for creating hospitals
    const canCreateHospitals = hasPermission(user, 'hospitals.write') || 
                              hasPermission(user, '*') ||
                              user.role === 'SUPER_ADMIN' ||
                              user.role === 'COUNTY_ADMIN'

    if (!canCreateHospitals) {
      return NextResponse.json({ 
        error: 'Forbidden - You do not have permission to create hospitals' 
      }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = createHospitalSchema.parse(body)

    const hospital = await createHospital(validatedData, user)

    return NextResponse.json(hospital, { status: 201 })
  } catch (error) {
    console.error('Error creating hospital:', error)
    
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