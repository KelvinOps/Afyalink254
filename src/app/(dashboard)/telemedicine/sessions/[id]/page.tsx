// src/app/(dashboard)/telemedicine/sessions/[id]/page.tsx

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { 
  ArrowLeft, 
  Video, 
  Calendar, 
  User, 
  Stethoscope, 
  FileText, 
  Clock,
  MapPin
} from 'lucide-react'
import { SessionDetails } from '@/app/components/telemedicine/SessionDetails'
import { SessionNotes } from '@/app/components/telemedicine/SessionNotes'
import { SessionPrescriptions } from '@/app/components/telemedicine/SessionPrescriptions'
import { getTelemedicineSession } from '@/app/services/telemedicine.service'
import { getCurrentUser } from '@/app/lib/get-current-user'
import { canAccessModule } from '@/app/lib/auth'
import { redirect } from 'next/navigation'

// CORRECT TYPE DEFINITION FOR NEXT.JS 15
// The params prop is a Promise in Next.js 15
interface TelemedicineSessionPageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

// Optional: Generate metadata
export async function generateMetadata(props: TelemedicineSessionPageProps) {
  const params = await props.params
  return {
    title: `Telemedicine Session ${params.id}`,
    description: 'Telemedicine session details',
  }
}

export default async function TelemedicineSessionPage(props: TelemedicineSessionPageProps) {
  // Await the params promise
  const params = await props.params
  const user = await getCurrentUser()
  
  if (!user || !canAccessModule(user, 'telemedicine')) {
    redirect('/unauthorized')
  }

  const session = await getTelemedicineSession(params.id)

  if (!session) {
    notFound()
  }

  // Check if user has access to this specific session
  const hasAccess = session.specialistId === user.id || 
                   session.patientId === user.id ||
                   user.role === 'SUPER_ADMIN' ||
                   user.role === 'HOSPITAL_ADMIN' ||
                   user.role === 'COUNTY_ADMIN'

  if (!hasAccess) {
    redirect('/unauthorized')
  }

  const canJoinCall = (session.status === 'SCHEDULED' || session.status === 'IN_PROGRESS') && 
                     (session.specialistId === user.id || user.role === 'SUPER_ADMIN')
  const isCompleted = session.status === 'COMPLETED'
  const isCancelled = session.status === 'CANCELLED'
  const isNoShow = session.status === 'NO_SHOW'

  const getStatusBadgeVariant = () => {
    switch (session.status) {
      case 'COMPLETED':
        return 'default'
      case 'IN_PROGRESS':
        return 'secondary'
      case 'SCHEDULED':
        return 'outline'
      case 'CANCELLED':
      case 'NO_SHOW':
      case 'TECHNICAL_FAILURE':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatSessionTime = (date: Date | null) => {
    if (!date) return 'Not scheduled'
    return new Date(date).toLocaleString('en-KE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Nairobi'
    })
  }

  const formatDuration = (duration: number | null) => {
    if (!duration) return 'Not started'
    if (duration < 60) return `${duration} minutes`
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/telemedicine/sessions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Session {session.sessionNumber}
              </h1>
              <Badge variant={getStatusBadgeVariant()}>
                {session.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Telemedicine consultation with {session.patient.firstName} {session.patient.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canJoinCall && (
            <Link href={`/telemedicine/sessions/${session.id}/call`}>
              <Button>
                <Video className="h-4 w-4 mr-2" />
                {session.status === 'SCHEDULED' ? 'Start Call' : 'Join Call'}
              </Button>
            </Link>
          )}
          {(isCompleted || isCancelled || isNoShow) && (
            <Button variant="outline" disabled>
              <Video className="h-4 w-4 mr-2" />
              {isCompleted ? 'Session Completed' : 
               isCancelled ? 'Session Cancelled' : 'No Show'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Session Details</TabsTrigger>
              <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="records">Medical Records</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <SessionDetails session={session} currentUser={user} />
            </TabsContent>

            <TabsContent value="notes">
              <SessionNotes session={session} currentUser={user} />
            </TabsContent>

            <TabsContent value="prescriptions">
              <SessionPrescriptions session={session} currentUser={user} />
            </TabsContent>

            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Records</CardTitle>
                  <CardDescription>
                    Patient's relevant medical history and records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Allergies</h4>
                        <div className="space-y-1">
                          {session.patient.allergies && session.patient.allergies.length > 0 ? (
                            session.patient.allergies.map((allergy, index) => (
                              <Badge key={index} variant="outline" className="mr-1 mb-1">
                                {allergy}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No known allergies</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Chronic Conditions</h4>
                        <div className="space-y-1">
                          {session.patient.chronicConditions && session.patient.chronicConditions.length > 0 ? (
                            session.patient.chronicConditions.map((condition, index) => (
                              <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                {condition}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No chronic conditions</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">Patient Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Blood Type:</span>
                          <span className="ml-2 font-medium">
                            {session.patient.bloodType || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date of Birth:</span>
                          <span className="ml-2 font-medium">
                            {session.patient.dateOfBirth ? 
                              new Date(session.patient.dateOfBirth).toLocaleDateString('en-KE') : 
                              'Unknown'
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gender:</span>
                          <span className="ml-2 font-medium capitalize">
                            {session.patient.gender?.toLowerCase() || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="ml-2 font-medium">
                            {session.patient.phone || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {session.imagesShared && session.imagesShared.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Shared Images</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {session.imagesShared.map((image, index) => (
                            <div key={index} className="border rounded-lg p-2 text-center">
                              <FileText className="h-8 w-8 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground truncate">
                                Image {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {session.documentsShared && session.documentsShared.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Shared Documents</h4>
                        <div className="space-y-2">
                          {session.documentsShared.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{doc}</span>
                              </div>
                              <Button variant="ghost" size="sm">
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Scheduled Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSessionTime(session.scheduledTime)}
                  </p>
                </div>
              </div>

              {session.startTime && (
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Start Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatSessionTime(session.startTime)}
                    </p>
                  </div>
                </div>
              )}

              {session.endTime && (
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">End Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatSessionTime(session.endTime)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(session.duration)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-indigo-100 p-2">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Specialist</p>
                  <p className="text-sm text-muted-foreground">
                    Dr. {session.specialist.firstName} {session.specialist.lastName}
                  </p>
                  {session.specialist.specialization && (
                    <p className="text-xs text-muted-foreground">
                      {session.specialist.specialization}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <MapPin className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Provider Hospital</p>
                  <p className="text-sm text-muted-foreground">
                    {session.providerHospital.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.providerHospital.code}
                  </p>
                </div>
              </div>

              {session.connectionQuality && (
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-cyan-100 p-2">
                    <Video className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Connection Quality</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        session.connectionQuality === 'EXCELLENT' ? 'default' :
                        session.connectionQuality === 'GOOD' ? 'secondary' :
                        session.connectionQuality === 'FAIR' ? 'outline' :
                        'destructive'
                      }>
                        {session.connectionQuality}
                      </Badge>
                      {session.audioQuality && (
                        <span className="text-xs text-muted-foreground">
                          Audio: {session.audioQuality}/5
                        </span>
                      )}
                      {session.videoQuality && (
                        <span className="text-xs text-muted-foreground">
                          Video: {session.videoQuality}/5
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canJoinCall && (
                <Link href={`/telemedicine/sessions/${session.id}/call`} className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="h-4 w-4 mr-2" />
                    {session.status === 'SCHEDULED' ? 'Start Call' : 'Join Call'}
                  </Button>
                </Link>
              )}
              
              {session.specialistId === user.id && (
                <>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Add Prescription
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Update Notes
                  </Button>
                </>
              )}

              {(user.role === 'SUPER_ADMIN' || user.role === 'HOSPITAL_ADMIN') && (
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Session Data
                </Button>
              )}

              {session.status === 'SCHEDULED' && session.specialistId === user.id && (
                <Button variant="outline" className="w-full justify-start text-destructive">
                  <Calendar className="h-4 w-4 mr-2" />
                  Cancel Session
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Session Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <Calendar className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSessionTime(session.createdAt)}
                    </p>
                  </div>
                </div>

                {session.scheduledTime && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Clock className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Scheduled</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSessionTime(session.scheduledTime)}
                      </p>
                    </div>
                  </div>
                )}

                {session.startTime && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-100 p-2">
                      <Video className="h-3 w-3 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Call Started</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSessionTime(session.startTime)}
                      </p>
                    </div>
                  </div>
                )}

                {session.endTime && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Clock className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Call Ended</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSessionTime(session.endTime)}
                      </p>
                    </div>
                  </div>
                )}

                {session.updatedAt && session.updatedAt !== session.createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gray-100 p-2">
                      <FileText className="h-3 w-3 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSessionTime(session.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}