'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Session {
  id: string
  sessionNumber: string
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  patient: {
    id: string
    firstName: string
    lastName: string
  }
}

interface UseTelemedicineCallReturn {
  session: Session | null
  isConnected: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent'
  startCall: () => Promise<void>
  endCall: () => void
  toggleAudio: () => void
  toggleVideo: () => void
  isStarting: boolean
  error: string | null
  isAudioEnabled: boolean
  isVideoEnabled: boolean
}

export function useTelemedicineCall(sessionId: string): UseTelemedicineCallReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionQuality, setConnectionQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good')
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  // Refs for streams
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // In a real app, fetch from your API
        const mockSession: Session = {
          id: sessionId,
          sessionNumber: `TM-${sessionId.slice(0, 8)}`,
          status: 'SCHEDULED',
          patient: {
            id: 'patient-123',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
        setSession(mockSession)
      } catch (err) {
        setError('Failed to load session')
        console.error('Error fetching session:', err)
      }
    }

    fetchSession()
  }, [sessionId])

  // Initialize local media
  const initializeLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      })
      
      localStreamRef.current = stream
      setLocalStream(stream)
      
      // Create a mock remote stream for demonstration
      // In a real app, this would come from WebRTC
      setTimeout(() => {
        setRemoteStream(new MediaStream())
        setIsConnected(true)
        setIsStarting(false)
      }, 2000)

    } catch (err) {
      setError('Failed to access camera/microphone. Please check permissions.')
      setIsStarting(false)
      console.error('Error accessing media devices:', err)
    }
  }, [])

  const startCall = useCallback(async () => {
    if (isStarting || isConnected) return

    setIsStarting(true)
    setError(null)

    try {
      await initializeLocalMedia()
      
      // In a real app, you would:
      // 1. Create peer connection
      // 2. Set up signaling
      // 3. Connect to WebRTC server
      // 4. Handle ICE candidates
      
    } catch (err) {
      setError('Failed to start call')
      setIsStarting(false)
      console.error('Error starting call:', err)
    }
  }, [isStarting, isConnected, initializeLocalMedia])

  const endCall = useCallback(() => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Reset state
    setLocalStream(null)
    setRemoteStream(null)
    setIsConnected(false)
    setIsStarting(false)
    setIsAudioEnabled(true)
    setIsVideoEnabled(true)

    // In a real app, you would update session status
    if (session) {
      const updatedSession = { ...session, status: 'COMPLETED' as const }
      setSession(updatedSession)
    }
  }, [session])

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }, [])

  // Simulate connection quality changes
  useEffect(() => {
    if (!isConnected) return

    const qualities: Array<'poor' | 'fair' | 'good' | 'excellent'> = ['poor', 'fair', 'good', 'excellent']
    const interval = setInterval(() => {
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)]
      setConnectionQuality(randomQuality)
    }, 10000)

    return () => clearInterval(interval)
  }, [isConnected])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
    }
  }, [])

  return {
    session,
    isConnected,
    localStream,
    remoteStream,
    connectionQuality,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    isStarting,
    error,
    isAudioEnabled,
    isVideoEnabled
  }
}