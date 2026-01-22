'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { 
  User, 
  Calendar, 
  Heart, 
  Activity,
  MapPin,
  Phone,
  Mail,
  Clock
} from 'lucide-react'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  bloodGroup?: string
  address?: string
}

interface Session {
  id: string
  sessionNumber: string
  patient: Patient
  scheduledAt: string
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  chiefComplaint?: string
  duration?: number
}

interface PatientInfoPanelProps {
  session: Session
}

export function PatientInfoPanel({ session }: PatientInfoPanelProps) {
  const patient = session.patient
  const getInitials = () => {
    return `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase()
  }

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Patient Profile */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.id}`} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{patient.firstName} {patient.lastName}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {patient.gender}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {calculateAge(patient.dateOfBirth)} years
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Contact
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span>{patient.email}</span>
            </div>
            {patient.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                <span className="line-clamp-2">{patient.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Medical
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>DOB: {formatDate(patient.dateOfBirth)}</span>
            </div>
            {patient.bloodGroup && (
              <div className="flex items-center gap-2 text-sm">
                <Heart className="h-3 w-3 text-muted-foreground" />
                <span>Blood Group: {patient.bloodGroup}</span>
              </div>
            )}
          </div>
        </div>

        {/* Session Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Session Details
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>Scheduled: {formatTime(session.scheduledAt)}</span>
            </div>
            {session.duration && (
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span>Duration: {session.duration} mins</span>
              </div>
            )}
            {session.chiefComplaint && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Chief Complaint:</p>
                <p className="text-sm bg-muted/50 p-2 rounded">{session.chiefComplaint}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}