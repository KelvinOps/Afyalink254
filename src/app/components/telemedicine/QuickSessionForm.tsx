'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import {
  User,
  Phone,
  Mail,
  Calendar,
  Stethoscope,
  AlertCircle,
  Video,
  Zap,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface QuickSessionFormProps {
  onSuccess: (sessionId: string) => void
}

interface PatientFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
}

export function QuickSessionForm({ onSuccess }: QuickSessionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useExistingPatient, setUseExistingPatient] = useState(true)
  
  const [patientData, setPatientData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
  })
  
  const [sessionData, setSessionData] = useState({
    chiefComplaint: '',
    urgency: 'MEDIUM',
    sessionType: 'CONSULTATION',
  })

  const handlePatientChange = (field: keyof PatientFormData, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }))
  }

  const handleSessionChange = (field: keyof typeof sessionData, value: string) => {
    setSessionData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!useExistingPatient) {
      if (!patientData.firstName.trim()) {
        setError('First name is required')
        return false
      }
      if (!patientData.lastName.trim()) {
        setError('Last name is required')
        return false
      }
      if (!patientData.phone.trim()) {
        setError('Phone number is required')
        return false
      }
      if (!patientData.email.trim()) {
        setError('Email is required')
        return false
      }
    }
    
    if (!sessionData.chiefComplaint.trim()) {
      setError('Chief complaint is required')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // In a real app, you would make an API call here
      const formData = {
        patient: useExistingPatient ? null : patientData,
        session: sessionData,
        isQuickSession: true,
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Mock session ID
      const mockSessionId = `quick-session-${Date.now()}`
      onSuccess(mockSessionId)
      
    } catch (err) {
      setError('Failed to start quick session. Please try again.')
      console.error('Error starting session:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Start Notice */}
      <Alert className="bg-blue-50 border-blue-200">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          Quick sessions are perfect for urgent cases. The patient will be notified immediately to join the call.
        </AlertDescription>
      </Alert>

      {/* Patient Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Patient Information</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={useExistingPatient ? "default" : "outline"}
              size="sm"
              onClick={() => setUseExistingPatient(true)}
            >
              Existing Patient
            </Button>
            <Button
              type="button"
              variant={!useExistingPatient ? "default" : "outline"}
              size="sm"
              onClick={() => setUseExistingPatient(false)}
            >
              New Patient
            </Button>
          </div>
        </div>

        {useExistingPatient ? (
          <div className="space-y-2">
            <Label htmlFor="existing-patient">Select Patient</Label>
            <Select>
              <SelectTrigger id="existing-patient">
                <SelectValue placeholder="Search for existing patient..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">John Doe (john@example.com)</SelectItem>
                <SelectItem value="2">Jane Smith (jane@example.com)</SelectItem>
                <SelectItem value="3">Michael Johnson (michael@example.com)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                placeholder="Enter first name"
                value={patientData.firstName}
                onChange={(e) => handlePatientChange('firstName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                placeholder="Enter last name"
                value={patientData.lastName}
                onChange={(e) => handlePatientChange('lastName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </div>
              </Label>
              <Input
                id="phone"
                placeholder="+254712345678"
                value={patientData.phone}
                onChange={(e) => handlePatientChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Email Address
                </div>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="patient@example.com"
                value={patientData.email}
                onChange={(e) => handlePatientChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-of-birth">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Date of Birth
                </div>
              </Label>
              <Input
                id="date-of-birth"
                type="date"
                value={patientData.dateOfBirth}
                onChange={(e) => handlePatientChange('dateOfBirth', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={patientData.gender}
                onValueChange={(value) => handlePatientChange('gender', value)}
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Session Details */}
      <div className="space-y-4">
        <Label className="text-base">Session Details</Label>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select
              value={sessionData.urgency}
              onValueChange={(value) => handleSessionChange('urgency', value)}
            >
              <SelectTrigger id="urgency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low - Routine</SelectItem>
                <SelectItem value="MEDIUM">Medium - Within 1 hour</SelectItem>
                <SelectItem value="HIGH">High - Immediate</SelectItem>
                <SelectItem value="EMERGENCY">Emergency - Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-type">Session Type</Label>
            <Select
              value={sessionData.sessionType}
              onValueChange={(value) => handleSessionChange('sessionType', value)}
            >
              <SelectTrigger id="session-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONSULTATION">General Consultation</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                <SelectItem value="MENTAL_HEALTH">Mental Health</SelectItem>
                <SelectItem value="PEDIATRIC">Pediatric</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chief-complaint">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Chief Complaint
            </div>
          </Label>
          <Textarea
            id="chief-complaint"
            placeholder="Briefly describe the patient's main concern..."
            value={sessionData.chiefComplaint}
            onChange={(e) => handleSessionChange('chiefComplaint', e.target.value)}
            rows={3}
            required
          />
          <p className="text-xs text-muted-foreground">
            This information helps prepare for the consultation
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Starting Session...
            </>
          ) : (
            <>
              <Video className="mr-2 h-5 w-5" />
              Start Video Call Now
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}