'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { User, Stethoscope, AlertTriangle } from 'lucide-react'
import { updateTelemedicineSession, type UpdateTelemedicineSessionData } from '@/app/services/telemedicine.service'
import { useToast } from '@/app/hooks/use-toast'

// Define proper TypeScript types that match the service
type TelemedicineStatus = 
  | 'SCHEDULED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW' 
  | 'TECHNICAL_FAILURE'

type ConsultationType = 
  | 'EMERGENCY' 
  | 'SPECIALIST' 
  | 'SECOND_OPINION' 
  | 'FOLLOW_UP' 
  | 'DIAGNOSTIC_REVIEW'

type ConnectionQuality = 
  | 'EXCELLENT' 
  | 'GOOD' 
  | 'FAIR' 
  | 'POOR' 
  | 'FAILED'

interface Patient {
  id: string
  firstName: string
  lastName: string
  patientNumber: string
  dateOfBirth: Date
  gender: string
  phone?: string
  bloodType?: string
  allergies: string[]
  chronicConditions: string[]
}

interface Specialist {
  id: string
  firstName: string
  lastName: string
  role: string
  specialization?: string
}

interface Hospital {
  id: string
  name: string
  code: string
}

interface TelemedicineSession {
  id: string
  sessionNumber: string
  patient: Patient
  specialist: Specialist
  providerHospital: Hospital
  requestingHospital?: Hospital
  requestingHealthCenter?: Hospital
  requestingDispensary?: Hospital
  consultationType: ConsultationType
  chiefComplaint: string
  presentingHistory?: string
  scheduledTime?: Date
  startTime?: Date
  endTime?: Date
  duration?: number
  status: TelemedicineStatus
  diagnosis?: string
  recommendations?: string
  requiresInPersonVisit: boolean
  requiresReferral: boolean
  connectionQuality?: ConnectionQuality
  audioQuality?: number
  videoQuality?: number
  createdAt: Date
  updatedAt: Date
}

interface CurrentUser {
  id: string
  role: string
}

interface SessionDetailsProps {
  session: TelemedicineSession
  currentUser: CurrentUser
}

// Use the exact same type as the service expects
type SessionFormData = UpdateTelemedicineSessionData

export function SessionDetails({ session, currentUser }: SessionDetailsProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialize formData with proper typing that matches UpdateTelemedicineSessionData
  const [formData, setFormData] = useState<SessionFormData>({
    diagnosis: session.diagnosis || undefined,
    recommendations: session.recommendations || undefined,
    requiresInPersonVisit: session.requiresInPersonVisit,
    requiresReferral: session.requiresReferral,
    status: session.status
  })

  const canEdit = currentUser.id === session.specialist.id || 
                 currentUser.role === 'SUPER_ADMIN' ||
                 currentUser.role === 'HOSPITAL_ADMIN'

  const handleInputChange = <K extends keyof SessionFormData>(
    field: K, 
    value: SessionFormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!canEdit) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit this session.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Create update data with only the fields that have changed
      const updateData: SessionFormData = {}
      
      if (formData.diagnosis !== session.diagnosis) {
        updateData.diagnosis = formData.diagnosis
      }
      if (formData.recommendations !== session.recommendations) {
        updateData.recommendations = formData.recommendations
      }
      if (formData.requiresInPersonVisit !== session.requiresInPersonVisit) {
        updateData.requiresInPersonVisit = formData.requiresInPersonVisit
      }
      if (formData.requiresReferral !== session.requiresReferral) {
        updateData.requiresReferral = formData.requiresReferral
      }
      if (formData.status !== session.status) {
        updateData.status = formData.status
      }

      // Only call update if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateTelemedicineSession(session.id, updateData)
        
        toast({
          title: "Session Updated",
          description: "Session details have been successfully updated.",
        })
      } else {
        toast({
          title: "No Changes",
          description: "No changes were made to the session details.",
        })
      }
      
      setIsEditing(false)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error updating session:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update session details. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      diagnosis: session.diagnosis || undefined,
      recommendations: session.recommendations || undefined,
      requiresInPersonVisit: session.requiresInPersonVisit,
      requiresReferral: session.requiresReferral,
      status: session.status
    })
    setIsEditing(false)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Nairobi'
    })
  }

  const getConsultationTypeColor = (type: ConsultationType) => {
    switch (type) {
      case 'EMERGENCY':
        return 'destructive'
      case 'SPECIALIST':
        return 'default'
      case 'FOLLOW_UP':
        return 'secondary'
      case 'SECOND_OPINION':
        return 'outline'
      case 'DIAGNOSTIC_REVIEW':
        return 'default'
      default:
        return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: TelemedicineStatus) => {
    switch (status) {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Session Overview</CardTitle>
              <CardDescription>
                Detailed information about the telemedicine consultation
              </CardDescription>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Details
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sessionNumber">Session Number</Label>
                <div className="text-sm font-medium mt-1">{session.sessionNumber}</div>
              </div>
              
              <div>
                <Label htmlFor="consultationType">Consultation Type</Label>
                <div className="mt-1">
                  <Badge variant={getConsultationTypeColor(session.consultationType)}>
                    {session.consultationType.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                {isEditing ? (
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange('status', value as TelemedicineStatus)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="NO_SHOW">No Show</SelectItem>
                      <SelectItem value="TECHNICAL_FAILURE">Technical Failure</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(session.status)}>
                      {session.status.replace('_', ' ')}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Created</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatDate(session.createdAt)}
                </div>
              </div>
              
              <div>
                <Label>Last Updated</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatDate(session.updatedAt)}
                </div>
              </div>

              {session.scheduledTime && (
                <div>
                  <Label>Scheduled Time</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatDate(session.scheduledTime)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Patient Name</Label>
                <div className="text-sm font-medium mt-1">
                  {session.patient.firstName} {session.patient.lastName}
                </div>
              </div>
              <div>
                <Label>Patient Number</Label>
                <div className="text-sm font-medium mt-1">{session.patient.patientNumber}</div>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(session.patient.dateOfBirth).toLocaleDateString('en-KE')}
                </div>
              </div>
              <div>
                <Label>Gender</Label>
                <div className="text-sm text-muted-foreground mt-1 capitalize">
                  {session.patient.gender?.toLowerCase()}
                </div>
              </div>
              {session.patient.bloodType && (
                <div>
                  <Label>Blood Type</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {session.patient.bloodType}
                  </div>
                </div>
              )}
              {session.patient.phone && (
                <div>
                  <Label>Phone</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {session.patient.phone}
                  </div>
                </div>
              )}
            </div>

            {/* Allergies and Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <Label>Allergies</Label>
                <div className="mt-2 space-y-1">
                  {session.patient.allergies.length > 0 ? (
                    session.patient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="mr-1">
                        {allergy}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No known allergies</span>
                  )}
                </div>
              </div>
              <div>
                <Label>Chronic Conditions</Label>
                <div className="mt-2 space-y-1">
                  {session.patient.chronicConditions.length > 0 ? (
                    session.patient.chronicConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="mr-1">
                        {condition}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No chronic conditions</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Medical Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                  {session.chiefComplaint}
                </div>
              </div>

              {session.presentingHistory && (
                <div>
                  <Label>Presenting History</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {session.presentingHistory}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                {isEditing ? (
                  <Textarea
                    id="diagnosis"
                    value={formData.diagnosis || ''}
                    onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                    placeholder="Enter diagnosis..."
                    className="mt-1 min-h-[100px]"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm min-h-[100px]">
                    {session.diagnosis || 'No diagnosis recorded'}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="recommendations">Recommendations & Treatment Plan</Label>
                {isEditing ? (
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations || ''}
                    onChange={(e) => handleInputChange('recommendations', e.target.value)}
                    placeholder="Enter recommendations and treatment plan..."
                    className="mt-1 min-h-[120px]"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm min-h-[120px]">
                    {session.recommendations || 'No recommendations recorded'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Follow-up Requirements */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Follow-up Requirements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="requiresInPersonVisit" className="text-base">
                    Requires In-person Visit
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Patient needs to visit a physical facility
                  </p>
                </div>
                {isEditing ? (
                  <Switch
                    id="requiresInPersonVisit"
                    checked={formData.requiresInPersonVisit || false}
                    onCheckedChange={(checked) => handleInputChange('requiresInPersonVisit', checked)}
                  />
                ) : (
                  <Badge variant={session.requiresInPersonVisit ? 'destructive' : 'outline'}>
                    {session.requiresInPersonVisit ? 'Required' : 'Not Required'}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="requiresReferral" className="text-base">
                    Requires Referral
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Patient needs referral to another specialist
                  </p>
                </div>
                {isEditing ? (
                  <Switch
                    id="requiresReferral"
                    checked={formData.requiresReferral || false}
                    onCheckedChange={(checked) => handleInputChange('requiresReferral', checked)}
                  />
                ) : (
                  <Badge variant={session.requiresReferral ? 'destructive' : 'outline'}>
                    {session.requiresReferral ? 'Required' : 'Not Required'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Technical Information */}
          {session.connectionQuality && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Technical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Label>Connection Quality</Label>
                  <div className="mt-2">
                    <Badge variant={
                      session.connectionQuality === 'EXCELLENT' ? 'default' :
                      session.connectionQuality === 'GOOD' ? 'secondary' :
                      session.connectionQuality === 'FAIR' ? 'outline' :
                      'destructive'
                    }>
                      {session.connectionQuality}
                    </Badge>
                  </div>
                </div>
                {session.audioQuality && (
                  <div className="text-center p-4 border rounded-lg">
                    <Label>Audio Quality</Label>
                    <div className="mt-2 text-2xl font-bold text-muted-foreground">
                      {session.audioQuality}/5
                    </div>
                  </div>
                )}
                {session.videoQuality && (
                  <div className="text-center p-4 border rounded-lg">
                    <Label>Video Quality</Label>
                    <div className="mt-2 text-2xl font-bold text-muted-foreground">
                      {session.videoQuality}/5
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}