'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { 
  ArrowLeft,
  User,
  Search,
  Loader2,
  AlertTriangle,
  Heart,
  Thermometer,
  Gauge
} from 'lucide-react'
import Link from 'next/link'

interface Patient {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  bloodType: string
  allergies: string[]
  chronicConditions: string[]
}

export default function NewTriagePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  
  const [formData, setFormData] = useState({
    patientId: '',
    chiefComplaint: '',
    triageLevel: '',
    arrivalMode: 'WALK_IN',
    departmentId: '',
    vitalSigns: {
      bp: '',
      pulse: '',
      temp: '',
      respRate: '',
      o2Sat: '',
      painScale: ''
    },
    notes: ''
  })

  const searchPatients = async (query: string) => {
    if (query.length < 2) {
      setPatients([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (response.ok) {
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Error searching patients:', error)
    } finally {
      setSearching(false)
    }
  }

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData(prev => ({ ...prev, patientId: patient.id }))
    setSearchQuery(`${patient.firstName} ${patient.lastName} (${patient.patientNumber})`)
    setPatients([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/triage')
      } else {
        alert(data.error || 'Error creating triage entry')
      }
    } catch (error) {
      console.error('Error creating triage:', error)
      alert('Error creating triage entry')
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/triage">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Triage Entry</h1>
          <p className="text-muted-foreground">
            Create a new triage assessment for a patient
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information
              </CardTitle>
              <CardDescription>
                Search and select patient for triage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientSearch">Search Patient</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="patientSearch"
                    placeholder="Search by name or patient number..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchPatients(e.target.value)
                    }}
                    className="pl-9"
                  />
                </div>
                {searching && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </div>
                )}
                {patients.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {patients.map(patient => (
                      <div
                        key={patient.id}
                        className="p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {patient.patientNumber} • {calculateAge(patient.dateOfBirth)} years • {patient.gender}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Selected Patient</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</div>
                    <div><strong>Patient Number:</strong> {selectedPatient.patientNumber}</div>
                    <div><strong>Age:</strong> {calculateAge(selectedPatient.dateOfBirth)} years</div>
                    <div><strong>Gender:</strong> {selectedPatient.gender}</div>
                    {selectedPatient.bloodType && (
                      <div><strong>Blood Type:</strong> {selectedPatient.bloodType}</div>
                    )}
                    {selectedPatient.allergies.length > 0 && (
                      <div><strong>Allergies:</strong> {selectedPatient.allergies.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Triage Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Triage Assessment
              </CardTitle>
              <CardDescription>
                Assess patient condition and priority
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                <Textarea
                  id="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                  placeholder="Describe the main reason for visit..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="triageLevel">Triage Level *</Label>
                <Select
                  value={formData.triageLevel}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, triageLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select triage level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMMEDIATE">Immediate (Red)</SelectItem>
                    <SelectItem value="URGENT">Urgent (Orange)</SelectItem>
                    <SelectItem value="LESS_URGENT">Less Urgent (Yellow)</SelectItem>
                    <SelectItem value="NON_URGENT">Non-Urgent (Green)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrivalMode">Arrival Mode</Label>
                <Select
                  value={formData.arrivalMode}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, arrivalMode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WALK_IN">Walk-in</SelectItem>
                    <SelectItem value="AMBULANCE">Ambulance</SelectItem>
                    <SelectItem value="REFERRAL">Referral</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency Department</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Vital Signs
              </CardTitle>
              <CardDescription>
                Record patient vital signs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bp">Blood Pressure</Label>
                  <Input
                    id="bp"
                    value={formData.vitalSigns.bp}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, bp: e.target.value }
                    }))}
                    placeholder="120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pulse">Pulse (BPM)</Label>
                  <Input
                    id="pulse"
                    type="number"
                    value={formData.vitalSigns.pulse}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, pulse: e.target.value }
                    }))}
                    placeholder="72"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temp">Temperature (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    step="0.1"
                    value={formData.vitalSigns.temp}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, temp: e.target.value }
                    }))}
                    placeholder="37.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="respRate">Respiratory Rate</Label>
                  <Input
                    id="respRate"
                    type="number"
                    value={formData.vitalSigns.respRate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, respRate: e.target.value }
                    }))}
                    placeholder="16"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="o2Sat">O2 Saturation (%)</Label>
                  <Input
                    id="o2Sat"
                    type="number"
                    value={formData.vitalSigns.o2Sat}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, o2Sat: e.target.value }
                    }))}
                    placeholder="98"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="painScale">Pain Scale (0-10)</Label>
                  <Input
                    id="painScale"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.vitalSigns.painScale}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, painScale: e.target.value }
                    }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Any additional observations or information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional observations, medical history notes, or special considerations..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" type="button" asChild>
            <Link href="/triage">
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={loading || !formData.patientId || !formData.chiefComplaint || !formData.triageLevel}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Triage Entry'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}