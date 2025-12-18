import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Twilio } from 'twilio'
import { getTelemedicineSession } from '@/app/services/telemedicine.service'
import { auditLog } from '@/app/lib/audit'
import { authOptions } from '@/app/lib/auth-options'

// Initialize Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Verify the session exists and user has access
    const telemedicineSession = await getTelemedicineSession(sessionId)
    if (!telemedicineSession) {
      return NextResponse.json(
        { error: 'Telemedicine session not found' },
        { status: 404 }
      )
    }

    // Check if user is participant in the session
    const isParticipant = 
      telemedicineSession.specialistId === session.user.id ||
      telemedicineSession.patientId === session.user.id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied to this session' },
        { status: 403 }
      )
    }

    // Create a unique room name based on session ID
    const roomName = `telemedicine-session-${sessionId}`

    // Generate access token for Twilio Video
    const token = new Twilio.jwt.AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY!,
      process.env.TWILIO_API_SECRET!,
      {
        identity: session.user.id,
        ttl: 3600, // 1 hour
      }
    )

    // Grant video capabilities
    const videoGrant = new Twilio.jwt.AccessToken.VideoGrant({
      room: roomName,
    })
    token.addGrant(videoGrant)

    // Audit log
    await auditLog({
      action: 'CREATE',
      entityType: 'VIDEO_TOKEN',
      entityId: sessionId,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Generated WebRTC token for telemedicine session: ${telemedicineSession.sessionNumber}`,
    })

    return NextResponse.json({
      token: token.toJwt(),
      roomName,
      sessionId,
      identity: session.user.id
    })
  } catch (error) {
    console.error('Error generating WebRTC token:', error)
    
    await auditLog({
      action: 'CREATE',
      entityType: 'VIDEO_TOKEN',
      entityId: 'unknown',
      userId: 'unknown',
      userRole: 'SYSTEM',
      userName: 'API',
      description: `Failed to generate WebRTC token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Failed to generate video call token' },
      { status: 500 }
    )
  }
}

// Alternative implementation using simple UUID for non-Twilio setups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Verify the session exists and user has access
    const telemedicineSession = await getTelemedicineSession(sessionId)
    if (!telemedicineSession) {
      return NextResponse.json(
        { error: 'Telemedicine session not found' },
        { status: 404 }
      )
    }

    // Check if user is participant in the session
    const isParticipant = 
      telemedicineSession.specialistId === session.user.id ||
      telemedicineSession.patientId === session.user.id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied to this session' },
        { status: 403 }
      )
    }

    // Generate simple token for non-Twilio video solutions
    const token = {
      token: `video-token-${sessionId}-${Date.now()}`,
      roomName: `session-${sessionId}`,
      sessionId,
      identity: session.user.id,
      expiresAt: Date.now() + 3600000, // 1 hour
      serverUrl: process.env.VIDEO_SERVER_URL || 'wss://localhost:3001'
    }

    // Audit log
    await auditLog({
      action: 'CREATE',
      entityType: 'VIDEO_TOKEN',
      entityId: sessionId,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Generated video token for telemedicine session: ${telemedicineSession.sessionNumber}`,
    })

    return NextResponse.json(token)
  } catch (error) {
    console.error('Error generating video token:', error)
    
    await auditLog({
      action: 'CREATE',
      entityType: 'VIDEO_TOKEN',
      entityId: 'unknown',
      userId: 'unknown',
      userRole: 'SYSTEM',
      userName: 'API',
      description: `Failed to generate video token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Failed to generate video token' },
      { status: 500 }
    )
  }
}