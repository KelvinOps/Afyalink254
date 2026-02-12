import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  getTelemedicineSession,
  updateTelemedicineSession,
  // Remove the unused deleteTelemedicineSession import
} from '@/app/services/telemedicine.service'
import { auditLog } from '@/app/lib/audit'
import { getCurrentUser } from '@/app/lib/get-current-user'

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
  imagesShared: z.array(z.string()).optional(),
  documentsShared: z.array(z.string()).optional(),
  cancellationReason: z.string().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const telemedicineSession = await getTelemedicineSession(params.id)

    if (!telemedicineSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if user has access to this session
    const hasAccess = telemedicineSession.specialistId === user.id || 
                     telemedicineSession.patientId === user.id ||
                     user.role === 'SUPER_ADMIN' ||
                     user.role === 'HOSPITAL_ADMIN'

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Audit log
    await auditLog({
      action: 'READ',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: params.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Viewed telemedicine session: ${telemedicineSession.sessionNumber}`,
    })

    return NextResponse.json(telemedicineSession)
  } catch (error) {
    console.error('Error fetching telemedicine session:', error)
    
    await auditLog({
      action: 'READ',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: params.id,
      userId: 'unknown',
      userRole: 'SYSTEM',
      userName: 'API',
      description: `Failed to fetch telemedicine session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Failed to fetch telemedicine session' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateSessionSchema.parse(body)

    const existingSession = await getTelemedicineSession(params.id)
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if user has access to update this session
    const canUpdate = existingSession.specialistId === user.id || 
                     user.role === 'SUPER_ADMIN' ||
                     user.role === 'HOSPITAL_ADMIN'

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const updatedSession = await updateTelemedicineSession(params.id, validatedData)

    // Audit log
    await auditLog({
      action: 'UPDATE',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: params.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Updated telemedicine session: ${updatedSession.sessionNumber}`,
      changes: validatedData,
    })

    return NextResponse.json(updatedSession)
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
      entityId: params.id,
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingSession = await getTelemedicineSession(params.id)
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if user can cancel this session
    const canCancel = existingSession.specialistId === user.id || 
                     user.role === 'SUPER_ADMIN' ||
                     user.role === 'HOSPITAL_ADMIN'

    if (!canCancel) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only allow cancellation, not hard deletion
    const cancelledSession = await updateTelemedicineSession(params.id, {
      status: 'CANCELLED',
      cancellationReason: 'Cancelled by user'
    })

    // Audit log
    await auditLog({
      action: 'CANCEL',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: params.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Cancelled telemedicine session: ${cancelledSession.sessionNumber}`,
    })

    return NextResponse.json(cancelledSession)
  } catch (error) {
    console.error('Error cancelling telemedicine session:', error)
    
    await auditLog({
      action: 'CANCEL',
      entityType: 'TELEMEDICINE_SESSION',
      entityId: params.id,
      userId: 'unknown',
      userRole: 'SYSTEM',
      userName: 'API',
      description: `Failed to cancel telemedicine session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Failed to cancel telemedicine session' },
      { status: 500 }
    )
  }
}