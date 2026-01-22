'use client'

import { Button } from '@/app/components/ui/button'
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  MessageSquare,
  Share2,
  Users,
  Settings
} from 'lucide-react'

interface CallControlsProps {
  isConnected: boolean
  isStarting: boolean
  isMuted: boolean
  isVideoOff: boolean
  onEndCall: () => void
  onToggleAudio: () => void
  onToggleVideo: () => void
}

export function CallControls({
  isConnected,
  isStarting,
  isMuted,
  isVideoOff,
  onEndCall,
  onToggleAudio,
  onToggleVideo
}: CallControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Primary Call Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Audio Toggle */}
        <Button
          size="lg"
          variant={isMuted ? "destructive" : "secondary"}
          className="rounded-full w-16 h-16"
          onClick={onToggleAudio}
          disabled={isStarting}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        {/* End Call */}
        <Button
          size="lg"
          variant="destructive"
          className="rounded-full w-20 h-20"
          onClick={onEndCall}
          disabled={isStarting}
        >
          {isConnected ? (
            <PhoneOff className="h-8 w-8" />
          ) : (
            <Phone className="h-8 w-8" />
          )}
        </Button>

        {/* Video Toggle */}
        <Button
          size="lg"
          variant={isVideoOff ? "destructive" : "secondary"}
          className="rounded-full w-16 h-16"
          onClick={onToggleVideo}
          disabled={isStarting}
        >
          {isVideoOff ? (
            <VideoOff className="h-6 w-6" />
          ) : (
            <Video className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={!isConnected || isStarting}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={!isConnected || isStarting}
        >
          <Share2 className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={!isConnected || isStarting}
        >
          <Users className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={!isConnected || isStarting}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Status Message */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {isStarting ? 'Starting call...' : 
           isConnected ? 'Call in progress' : 
           'Ready to connect'}
        </p>
      </div>
    </div>
  )
}