'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { 
  ArrowLeft, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Users,
  MessageSquare,
  FileText,
  Settings
} from 'lucide-react'
import { VideoCallInterface } from '@/app/components/telemedicine/VideoCallInterface'
import { CallControls } from '@/app/components/telemedicine/CallControls'
import { PatientInfoPanel } from '@/app/components/telemedicine/PatientInfoPanel'
import { ConsultationNotes } from '@/app/components/telemedicine/ConsultationNotes'
import { useTelemedicineCall } from '@/app/hooks/useTelemedicineCall'
import Link from 'next/link'

interface VideoCallPageProps {
  params: Promise<{
    id: string
  }>
}

// Helper function to transform session data
function transformSessionData(session: any) {
  if (!session) return session

  // First get the scheduledAt value with fallback
  const scheduledAtValue = session.scheduledAt || session.scheduledTime || session.startTime || new Date()
  
  // Then transform it to string if it's a Date
  const scheduledAt = scheduledAtValue instanceof Date ? scheduledAtValue.toISOString() : scheduledAtValue

  return {
    ...session,
    // Add the transformed scheduledAt
    scheduledAt,
    // Transform other date fields to strings if needed
    startTime: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
    endTime: session.endTime instanceof Date ? session.endTime.toISOString() : session.endTime,
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : session.createdAt,
    updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : session.updatedAt,
  }
}

// Wrapper component that extracts params from Promise
function VideoCallPageContent({ params }: VideoCallPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  // Show loading state while resolving params
  if (!resolvedParams) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Preparing video call</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <VideoCallPageInner params={resolvedParams} />
}

// Your original component logic
function VideoCallPageInner({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('call')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  
  const {
    session: rawSession,
    isConnected,
    localStream,
    remoteStream,
    connectionQuality,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    isStarting,
    error
  } = useTelemedicineCall(params.id)

  // Transform the session data to include required fields
  const session = transformSessionData(rawSession)

  useEffect(() => {
    if (session?.status === 'SCHEDULED') {
      startCall()
    }
  }, [session, startCall])

  const handleEndCall = () => {
    endCall()
    router.push(`/telemedicine/sessions/${params.id}`)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/telemedicine/sessions/${params.id}`)}>
              Return to Session
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/telemedicine/sessions/${params.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">
                Telemedicine Call - {session?.sessionNumber}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </Badge>
                {connectionQuality && (
                  <Badge variant="outline">
                    {connectionQuality} Quality
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="icon"
              onClick={() => {
                toggleAudio()
                setIsMuted(!isMuted)
              }}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              variant={isVideoOff ? "destructive" : "outline"}
              size="icon"
              onClick={() => {
                toggleVideo()
                setIsVideoOff(!isVideoOff)
              }}
            >
              {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Video Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                <VideoCallInterface
                  localStream={localStream}
                  remoteStream={remoteStream}
                  isVideoOff={isVideoOff}
                  isMuted={isMuted}
                  connectionQuality={connectionQuality}
                />
              </CardContent>
            </Card>

            {/* Call Controls */}
            <div className="mt-4">
              <CallControls
                isConnected={isConnected}
                isStarting={isStarting}
                onEndCall={handleEndCall}
                onToggleAudio={() => {
                  toggleAudio()
                  setIsMuted(!isMuted)
                }}
                onToggleVideo={() => {
                  toggleVideo()
                  setIsVideoOff(!isVideoOff)
                }}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
              />
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="patient" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="hidden sm:inline">Patient</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span className="hidden sm:inline">Notes</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="patient" className="mt-2">
                {session && <PatientInfoPanel session={session} />}
              </TabsContent>

              <TabsContent value="notes" className="mt-2">
                {session && (
                  <ConsultationNotes 
                    session={session} 
                    isCallActive={isConnected}
                  />
                )}
              </TabsContent>

              <TabsContent value="chat" className="mt-2">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">Call Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chat feature coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Prescribe Medication
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Request Specialist
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Share Screen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCallPageContent