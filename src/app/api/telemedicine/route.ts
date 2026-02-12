// src/app/api/telemedicine/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
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
  vitalSigns: z.record(z.unknown()).optional(),
})

const updateSessionSchema = z.object({
  diagnosis: z.string().optional(),
  recommendations: z.string().optional(),
  prescriptions: z.array(z.unknown()).optional(),
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

// ── Shared types ────────────────────────────────────────────────────────────

type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'TECHNICAL_FAILURE'

interface TelemedicineSession {
  id: string
  sessionNumber: string
  patientId: string
  specialistId: string
  patientName?: string
  specialistName?: string
  status: SessionStatus
  scheduledTime: string
  createdAt: string
  updatedAt?: string
}

interface SessionListResult {
  sessions: TelemedicineSession[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface SessionQueryOptions {
  status?: string
  page: number
  limit: number
  search: string
  userId: string
}

interface AuditLogData {
  action: string
  entityType: string
  entityId: string
  userId: string
  userRole?: string
  userName?: string | null
  description: string
  changes?: Record<string, unknown>
  success?: boolean
  errorMessage?: string
}

// ── Mock service ─────────────────────────────────────────────────────────────

const mockTelemedicineService = {
  async getTelemedicineSessions(_options: SessionQueryOptions): Promise<SessionListResult> {
    return {
      sessions: [
        {
          id: '1',
          sessionNumber: 'TM-2024-001',
          patientId: 'patient-1',
          specialistId: 'doctor-1',
          patientName: 'John Doe',
          specialistName: 'Dr. Smith',
          status: 'COMPLETED',
          scheduledTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    }
  },

  async createTelemedicineSession(
    data: z.infer<typeof createSessionSchema> & { createdBy: string }
  ): Promise<TelemedicineSession> {
    return {
      id: `session-${Date.now()}`,
      sessionNumber: `TM-${Date.now().toString().slice(-6)}`,
      ...data,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  async getTelemedicineSession(sessionId: string): Promise<TelemedicineSession> {
    return {
      id: sessionId,
      sessionNumber: 'TM-2024-001',
      patientId: 'patient-1',
      specialistId: 'doctor-1',
      patientName: 'John Doe',
      specialistName: 'Dr. Smith',
      status: 'SCHEDULED',
      scheduledTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
  },

  async updateTelemedicineSession(
    sessionId: string,
    data: z.infer<typeof updateSessionSchema>
  ): Promise<Partial<TelemedicineSession>> {
    return {
      id: sessionId,
      ...data,
      updatedAt: new Date().toISOString(),
    }
  },
}

// ── Audit log helper ──────────────────────────────────────────────────────────

async function auditLog(data: AuditLogData): Promise<boolean> {
  console.log('Audit log:', data)
  return true
}

// ── Route handlers ────────────────────────────────────────────────────────────

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

    const sessions = await mockTelemedicineService.getTelemedicineSessions({
      status: status === 'all' ? undefined : status,
      page,
      limit,
      search,
      userId: session.user.id,
    })

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

    const body: unknown = await request.json()
    const validatedData = createSessionSchema.parse(body)

    const telemedicineSession = await mockTelemedicineService.createTelemedicineSession({
      ...validatedData,
      createdBy: session.user.id,
    })

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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const validatedData = updateSessionSchema.parse(body)

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const telemedicineSession = await mockTelemedicineService.updateTelemedicineSession(
      sessionId,
      validatedData
    )

    await auditLog({
      action: 'UPDATE',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: sessionId,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Updated telemedicine session: ${sessionId}`,
      changes: validatedData,
    })

    return NextResponse.json(telemedicineSession)
  } catch (error) {
    console.error('Error updating telemedicine session:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    await auditLog({
      action: 'UPDATE',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: 'unknown',
      userId: 'unknown',
      userRole: 'SYSTEM',
      userName: 'API',
      description: `Failed to update telemedicine session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Failed to update telemedicine session' },
      { status: 500 }
    )
  }
}