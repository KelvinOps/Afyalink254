import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { 
  getTelemedicineSessions,
  createTelemedicineSession,
  updateTelemedicineSession 
} from '@/app/services/telemedicine.service'
import { auditLog } from '@/app/lib/audit'
import { authOptions } from '@/app/lib/auth-options'

const createSessionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  specialistId: z.string().min(1, 'Specialist ID is required'),
  providerHospitalId: z.string().min(1, 'Provider hospital ID is required'),
  requestingFacilityType: z.enum(['HOSPITAL', 'HEALTH_CENTER', 'DISPENSARY']),
  requestingHospitalId: z.string().optional(),
  requestingHealthCenterId: z.string().optional(),
  requestingDispensaryId: z.string().optional(),
  consultationType: z.enum(['EMERGENCY', 'SPECIALIST', 'SECOND_OPINION', 'FOLLOW_UP', 'DIAGNOSTIC_REVIEW']),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  presentingHistory: z.string().optional(),
  scheduledTime: z.string().optional(),
  vitalSigns: z.record(z.any()).optional(),
})

const updateSessionSchema = z.object({
  diagnosis: z.string().optional(),
  recommendations: z.string().optional(),
  prescriptions: z.array(z.any()).optional(),
  requiresInPersonVisit: z.boolean().optional(),
  requiresReferral: z.boolean().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'TECHNICAL_FAILURE']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  connectionQuality: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'FAILED']).optional(),
  audioQuality: z.number().min(1).max(5).optional(),
  videoQuality: z.number().min(1).max(5).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const sessions = await getTelemedicineSessions({
      status: status === 'all' ? undefined : status,
      page,
      limit,
      search,
      userId: session.user.id
    })

    // Audit log
    await auditLog({
      action: 'READ',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: 'multiple',
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Fetched telemedicine sessions with filters: status=${status}, page=${page}`,
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching telemedicine sessions:', error)
    
    await auditLog({
      action: 'READ',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: 'multiple',
      userId: 'unknown',
      userRole: 'SYSTEM',
      userName: 'API',
      description: `Failed to fetch telemedicine sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Failed to fetch telemedicine sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)

    const telemedicineSession = await createTelemedicineSession({
      ...validatedData,
      createdBy: session.user.id,
    })

    // Audit log
    await auditLog({
      action: 'CREATE',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: telemedicineSession.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Created new telemedicine session: ${telemedicineSession.sessionNumber}`,
      changes: validatedData,
    })

    return NextResponse.json(telemedicineSession, { status: 201 })
  } catch (error) {
    console.error('Error creating telemedicine session:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    await auditLog({
      action: 'CREATE',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: 'new',
      userId: 'unknown',
      userRole: 'SYSTEM',
      userName: 'API',
      description: `Failed to create telemedicine session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Failed to create telemedicine session' },
      { status: 500 }
    )
  }
}