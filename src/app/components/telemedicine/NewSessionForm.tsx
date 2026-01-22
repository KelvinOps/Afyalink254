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
  Calendar,
  Clock,
  User,
  Stethoscope,
  AlertCircle,
  Search,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Card, CardContent } from '@/app/components/ui/card'
import { Calendar as CalendarComponent } from '@/app/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { cn } from '@/app/lib/utils'
import { format } from 'date-fns'

interface NewSessionFormProps {
  onSuccess: (sessionId: string) => void
}

interface Patient {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
}

export function NewSessionForm({ onSuccess }: NewSessionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  
  const [formData, setFormData] = useState({
    patientId: '',
    chiefComplaint: '',
    notes: '',
    duration: '30',
    sessionType: 'CONSULTATION',
  })

  // Mock patients data
  const patients: Patient[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+254712345678', dateOfBirth: '1985-05-15' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+254723456789', dateOfBirth: '1990-08-22' },
    { id: '3', name: 'Michael Johnson', email: 'michael@example.com', phone: '+254734567890', dateOfBirth: '1978-12-10' },
    { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', phone: '+254745678901', dateOfBirth: '1995-03-30' },
  ]

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const results = patients.filter(patient =>
        patient.name.toLowerCase().includes(query.toLowerCase()) ||
        patient.email.toLowerCase().includes(query.toLowerCase()) ||
        patient.phone.includes(query)
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData(prev => ({ ...prev, patientId: patient.id }))
    setSearchQuery(patient.name)
    setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatient) {
      setError('Please select a patient')
      return
    }

    if (!date) {
      setError('Please select a date')
      return
    }

    if (!formData.chiefComplaint.trim()) {
      setError('Please enter chief complaint')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // In a real app, you would make an API call here
      const sessionData = {
        ...formData,
        patientId: selectedPatient.id,
        scheduledDate: date.toISOString(),
        scheduledTime: format(new Date(), 'HH:mm'),
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock session ID
      const mockSessionId = `session-${Date.now()}`
      onSuccess(mockSessionId)
      
    } catch (err) {
      setError('Failed to create session. Please try again.')
      console.error('Error creating session:', err)
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

      {/* Patient Search */}
      <div className="space-y-2">
        <Label htmlFor="patient-search">Select Patient</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="patient-search"
            placeholder="Search patient by name, email, or phone..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        {searchResults.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.email}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedPatient && (
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedPatient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.phone} • DOB: {selectedPatient.dateOfBirth}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPatient(null)
                  setSearchQuery('')
                  setFormData(prev => ({ ...prev, patientId: '' }))
                }}
              >
                Change
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Date and Time Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Time</Label>
          <Select defaultValue="09:00">
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const hour = 9 + i
                const time = `${hour.toString().padStart(2, '0')}:00`
                return (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {time}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Session Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Select
            value={formData.duration}
            onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
          >
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="session-type">Session Type</Label>
          <Select
            value={formData.sessionType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, sessionType: value }))}
          >
            <SelectTrigger id="session-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONSULTATION">Consultation</SelectItem>
              <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
              <SelectItem value="EMERGENCY">Emergency</SelectItem>
              <SelectItem value="SPECIALIST">Specialist Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chief Complaint */}
      <div className="space-y-2">
        <Label htmlFor="chief-complaint">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Chief Complaint
          </div>
        </Label>
        <Textarea
          id="chief-complaint"
          placeholder="Describe the patient's main concern..."
          value={formData.chiefComplaint}
          onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
          rows={3}
          required
        />
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any additional information..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading || !selectedPatient}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Creating Session...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Session
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}