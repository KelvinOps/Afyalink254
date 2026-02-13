// src/app/api/telemedicine/token/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'

// Mock service functions
const mockTelemedicineService = {
  async getTelemedicineSession(sessionId: string) {
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
  }
}

// Define proper type for audit log data
interface AuditLogData {
  action: string
  entityType: string
  entityId: string
  userId: string
  userRole: string
  userName: string
  description: string
  success?: boolean
  errorMessage?: string
}

// Mock audit log function
async function auditLog(data: AuditLogData) {
  console.log('Audit log:', data)
  return true
}

// Simple token generator (replace with your actual video provider)
function generateVideoToken(identity: string, roomName: string) {
  // This is a mock token generator
  // Replace with Twilio, Agora, or your preferred video service
  const mockToken = {
    token: `video-token-${identity}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    roomName,
    identity,
    expiresAt: Date.now() + 3600000, // 1 hour
    serverUrl: process.env.VIDEO_SERVER_URL || 'wss://localhost:3001',
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  return mockToken
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    
    if (!user) {
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
    const telemedicineSession = await mockTelemedicineService.getTelemedicineSession(sessionId)
    if (!telemedicineSession) {
      return NextResponse.json(
        { error: 'Telemedicine session not found' },
        { status: 404 }
      )
    }

    // Check if user is participant in the session
    const isParticipant = 
      telemedicineSession.specialistId === user.id ||
      telemedicineSession.patientId === user.id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied to this session' },
        { status: 403 }
      )
    }

    // Create a unique room name based on session ID
    const roomName = `telemedicine-session-${sessionId}`

    // Generate video call token
    const videoToken = generateVideoToken(user.id, roomName)

    // Audit log
    await auditLog({
      action: 'CREATE',
      entityType: 'VIDEO_TOKEN',
      entityId: sessionId,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Generated video token for telemedicine session: ${telemedicineSession.sessionNumber}`,
    })

    return NextResponse.json({
      ...videoToken,
      sessionId,
    })
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
      { error: 'Failed to generate video call token' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    
    if (!user) {
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
    const telemedicineSession = await mockTelemedicineService.getTelemedicineSession(sessionId)
    if (!telemedicineSession) {
      return NextResponse.json(
        { error: 'Telemedicine session not found' },
        { status: 404 }
      )
    }

    // Check if user is participant in the session
    const isParticipant = 
      telemedicineSession.specialistId === user.id ||
      telemedicineSession.patientId === user.id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied to this session' },
        { status: 403 }
      )
    }

    // Create a unique room name based on session ID
    const roomName = `telemedicine-session-${sessionId}`

    // Generate video call token
    const videoToken = generateVideoToken(user.id, roomName)

    // Audit log
    await auditLog({
      action: 'CREATE',
      entityType: 'VIDEO_TOKEN',
      entityId: sessionId,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Generated video token for telemedicine session: ${telemedicineSession.sessionNumber}`,
    })

    return NextResponse.json({
      ...videoToken,
      sessionId,
    })
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