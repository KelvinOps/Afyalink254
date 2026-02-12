'use client'

import { useRef, useEffect } from 'react'
import { Badge } from '@/app/components/ui/badge'
import { Video, VideoOff, MicOff } from 'lucide-react'

interface VideoCallInterfaceProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isVideoOff: boolean
  isMuted: boolean
  connectionQuality?: 'poor' | 'fair' | 'good' | 'excellent'
}

export function VideoCallInterface({
  localStream,
  remoteStream,
  isVideoOff,
  isMuted,
  connectionQuality
}: VideoCallInterfaceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'poor': return 'bg-red-500'
      case 'fair': return 'bg-yellow-500'
      case 'good': return 'bg-green-500'
      case 'excellent': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="relative h-full bg-black rounded-lg overflow-hidden">
      {/* Main Remote Video */}
      <div className="absolute inset-0 flex items-center justify-center">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="h-full w-full object-cover"
          />
        ) : isVideoOff ? (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <VideoOff className="h-16 w-16 text-gray-600" />
            </div>
            <p className="text-gray-400">Video is turned off</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Video className="h-16 w-16 text-gray-600" />
            </div>
            <p className="text-gray-400">Waiting for connection...</p>
          </div>
        )}
      </div>

      {/* Local Video Picture-in-Picture */}
      <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white">
        {localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : isVideoOff ? (
          <div className="h-full w-full bg-gray-800 flex items-center justify-center">
            <VideoOff className="h-8 w-8 text-gray-600" />
          </div>
        ) : (
          <div className="h-full w-full bg-gray-800 flex items-center justify-center">
            <Video className="h-8 w-8 text-gray-600" />
          </div>
        )}
      </div>

      {/* Connection Status Overlay */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getQualityColor()} animate-pulse`} />
          <Badge variant="secondary" className="bg-black/50 text-white border-none">
            {connectionQuality ? `${connectionQuality.toUpperCase()} CONNECTION` : 'CONNECTING...'}
          </Badge>
        </div>
      </div>

      {/* Audio/Video Status Overlay */}
      <div className="absolute top-4 right-4 flex gap-2">
        {isMuted && (
          <div className="bg-black/50 rounded-full p-2">
            <MicOff className="h-4 w-4 text-white" />
          </div>
        )}
        {isVideoOff && (
          <div className="bg-black/50 rounded-full p-2">
            <VideoOff className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-black/50 px-3 py-1 rounded-full">
          <span className="text-white font-mono text-sm">
            {localStream ? '00:00' : '--:--'}
          </span>
        </div>
      </div>
    </div>
  )
}