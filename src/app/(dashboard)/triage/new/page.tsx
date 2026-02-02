'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Building,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

interface Patient {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone?: string
  nationalId?: string
  shaNumber?: string
  currentStatus?: string
  currentHospital?: {
    id: string
    name: string
    code: string
  }
}

interface Department {
  id: string
  name: string
  type: string
}

export default function NewTriagePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [departmentError, setDepartmentError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    patientId: '',
    chiefComplaint: '',
    triageLevel: '',
    arrivalMode: 'WALK_IN',
    departmentId: '',
    hospitalId: '',
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

  const [formErrors, setFormErrors] = useState<{
    patient?: string
    chiefComplaint?: string
    triageLevel?: string
    department?: string
    hospital?: string
  }>({})

  // Fetch departments when hospital is selected
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!formData.hospitalId) {
        setDepartments([])
        return
      }

      setLoadingDepartments(true)
      setDepartmentError(null)
      try {
        const response = await fetch(`/api/departments?hospitalId=${formData.hospitalId}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch departments: ${response.status}`)
        }
        
        const data = await response.json()
        setDepartments(data.departments || [])
      } catch (error) {
        console.error('Error fetching departments:', error)
        setDepartmentError(error instanceof Error ? error.message : 'Failed to load departments')
      } finally {
        setLoadingDepartments(false)
      }
    }

    fetchDepartments()
  }, [formData.hospitalId])

  // Search patients
  const searchPatients = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setPatients([])
      setSearchError(null)
      return
    }

    setSearching(true)
    setSearchError(null)
    
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}&limit=10`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Search failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data && Array.isArray(data.patients)) {
        setPatients(data.patients)
      } else {
        setPatients([])
        setSearchError('No patients found')
      }
    } catch (error) {
      console.error('Error searching patients:', error)
      setSearchError(error instanceof Error ? error.message : 'Failed to search patients. Please try again.')
      setPatients([])
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPatients(searchQuery)
      } else {
        setPatients([])
        setSearchError(null)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchPatients])

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData(prev => ({ 
      ...prev, 
      patientId: patient.id,
      hospitalId: patient.currentHospital?.id || '',
      departmentId: '' // Reset department when patient changes
    }))
    setSearchQuery(`${patient.firstName} ${patient.lastName} (${patient.patientNumber})`)
    setPatients([])
    setSearchError(null)
    setFormErrors(prev => ({ 
      ...prev, 
      patient: undefined, 
      hospital: undefined,
      department: undefined 
    }))
  }

  const validateForm = () => {
    const errors: typeof formErrors = {}
    
    if (!formData.patientId) {
      errors.patient = 'Please select a patient'
    }
    
    if (!formData.chiefComplaint.trim()) {
      errors.chiefComplaint = 'Please enter chief complaint'
    }
    
    if (!formData.triageLevel) {
      errors.triageLevel = 'Please select triage level'
    }

    if (!formData.hospitalId) {
      errors.hospital = 'Patient must be associated with a hospital'
    }

    if (!formData.departmentId) {
      errors.department = 'Please select a department'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset messages
    setSubmitError(null)
    setSubmitSuccess(null)
    
    // Validate form
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Parse vital signs to ensure proper types with validation
      const parseVitalSign = (value: string, type: 'int' | 'float' = 'int') => {
        if (!value) return 0
        const parsed = type === 'float' ? parseFloat(value) : parseInt(value)
        return isNaN(parsed) ? 0 : parsed
      }

      const parsedVitalSigns = {
        bp: formData.vitalSigns.bp || '',
        pulse: parseVitalSign(formData.vitalSigns.pulse),
        temp: parseVitalSign(formData.vitalSigns.temp, 'float'),
        respRate: parseVitalSign(formData.vitalSigns.respRate),
        o2Sat: parseVitalSign(formData.vitalSigns.o2Sat),
        painScale: parseVitalSign(formData.vitalSigns.painScale)
      }

      // Validate vital signs ranges
      const validateVitals = () => {
        const warnings = []
        if (parsedVitalSigns.pulse < 30 || parsedVitalSigns.pulse > 250) {
          warnings.push(`Pulse rate (${parsedVitalSigns.pulse} BPM) is outside normal range (30-250 BPM)`)
        }
        if (parsedVitalSigns.temp < 30 || parsedVitalSigns.temp > 45) {
          warnings.push(`Temperature (${parsedVitalSigns.temp}°C) is outside normal range (30-45°C)`)
        }
        if (parsedVitalSigns.respRate < 5 || parsedVitalSigns.respRate > 60) {
          warnings.push(`Respiratory rate (${parsedVitalSigns.respRate}) is outside normal range (5-60)`)
        }
        if (parsedVitalSigns.o2Sat < 50 || parsedVitalSigns.o2Sat > 100) {
          warnings.push(`O2 saturation (${parsedVitalSigns.o2Sat}%) is outside normal range (50-100%)`)
        }
        if (parsedVitalSigns.painScale < 0 || parsedVitalSigns.painScale > 10) {
          warnings.push(`Pain scale (${parsedVitalSigns.painScale}) is outside valid range (0-10)`)
        }
        return warnings
      }

      const vitalsWarnings = validateVitals()
      if (vitalsWarnings.length > 0) {
        if (!confirm(`Warning: ${vitalsWarnings.join('\n')}\n\nDo you want to proceed anyway?`)) {
          setLoading(false)
          return
        }
      }

      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          vitalSigns: parsedVitalSigns
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Show success message
        setSubmitSuccess(data.message || 'Triage entry created successfully!')
        
        // Reset form
        setSelectedPatient(null)
        setSearchQuery('')
        setFormData({
          patientId: '',
          chiefComplaint: '',
          triageLevel: '',
          arrivalMode: 'WALK_IN',
          departmentId: '',
          hospitalId: '',
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
        setFormErrors({})

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/triage')
        }, 2000)
      } else {
        // Handle different error types
        let errorMessage = data.error || data.details || 'Error creating triage entry'
        
        if (data.code === 'P2003') {
          const field = data.field || 'unknown field'
          errorMessage = `Database error: The referenced ${field} does not exist. Please ensure all selected data is valid.`
        } else if (data.code === 'P2002') {
          errorMessage = 'A triage entry with similar data already exists.'
        } else if (response.status === 400) {
          errorMessage = `Validation error: ${errorMessage}`
        } else if (response.status === 404) {
          errorMessage = `Resource not found: ${errorMessage}`
        } else if (response.status === 409) {
          errorMessage = `Conflict: ${errorMessage}`
        }

        setSubmitError(errorMessage)
        
        // Scroll to error message
        setTimeout(() => {
          const errorElement = document.querySelector('[data-error="true"]')
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    } catch (error: any) {
      console.error('Error creating triage:', error)
      setSubmitError(error.message || 'Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    try {
      const birthDate = new Date(dateOfBirth)
      if (isNaN(birthDate.getTime())) return 'Unknown'
      
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    } catch (error) {
      console.error('Error calculating age:', error)
      return 'Unknown'
    }
  }

  const handleCancel = () => {
    if (formData.chiefComplaint.trim() || formData.patientId) {
      if (!confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
        return
      }
    }
    router.push('/triage')
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

      {/* Success Message */}
      {submitSuccess && (
        <div 
          data-error="true"
          className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold">Success!</strong>
            <p className="mt-1">{submitSuccess}</p>
            <p className="text-sm mt-2 text-green-700">
              Redirecting to triage list...
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSubmitSuccess(null)}
            className="text-green-700 hover:text-green-800 hover:bg-green-100"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div 
          data-error="true"
          className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold">Error</strong>
            <p className="mt-1 whitespace-pre-wrap">{submitError}</p>
            {submitError.includes('does not exist') && (
              <p className="text-sm mt-2">
                Please ensure the patient, hospital, and department exist in the system.
              </p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSubmitError(null)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

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
                <Label htmlFor="patientSearch">Search Patient *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="patientSearch"
                    placeholder="Search by name, patient number, or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (!e.target.value.trim()) {
                        setSelectedPatient(null)
                        setFormData(prev => ({ 
                          ...prev, 
                          patientId: '',
                          hospitalId: '',
                          departmentId: ''
                        }))
                        setFormErrors(prev => ({ 
                          ...prev, 
                          patient: undefined, 
                          hospital: undefined,
                          department: undefined 
                        }))
                      }
                    }}
                    className="pl-9"
                  />
                </div>
                {formErrors.patient && (
                  <div className="text-sm text-destructive">
                    {formErrors.patient}
                  </div>
                )}
                {formErrors.hospital && (
                  <div className="text-sm text-destructive">
                    {formErrors.hospital}
                  </div>
                )}
                {searching && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </div>
                )}
                {searchError && (
                  <div className="text-sm text-destructive">
                    {searchError}
                  </div>
                )}
                {patients.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {patients.map(patient => (
                      <div
                        key={patient.id}
                        className="p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {patient.patientNumber} • {calculateAge(patient.dateOfBirth)} years • {patient.gender}
                        </div>
                        {patient.phone && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Phone: {patient.phone}
                          </div>
                        )}
                        {patient.currentHospital && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            Hospital: {patient.currentHospital.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <h4 className="font-semibold mb-2">Selected Patient</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>Name:</strong></div>
                      <div>{selectedPatient.firstName} {selectedPatient.lastName}</div>
                      
                      <div><strong>Patient Number:</strong></div>
                      <div>{selectedPatient.patientNumber}</div>
                      
                      <div><strong>Age:</strong></div>
                      <div>{calculateAge(selectedPatient.dateOfBirth)} years</div>
                      
                      <div><strong>Gender:</strong></div>
                      <div>{selectedPatient.gender}</div>
                      
                      {selectedPatient.phone && (
                        <>
                          <div><strong>Phone:</strong></div>
                          <div>{selectedPatient.phone}</div>
                        </>
                      )}
                      
                      {selectedPatient.nationalId && (
                        <>
                          <div><strong>National ID:</strong></div>
                          <div>{selectedPatient.nationalId}</div>
                        </>
                      )}
                      
                      {selectedPatient.shaNumber && (
                        <>
                          <div><strong>SHA Number:</strong></div>
                          <div>{selectedPatient.shaNumber}</div>
                        </>
                      )}
                    </div>
                    
                    {selectedPatient.currentHospital && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <div><strong>Current Hospital:</strong> {selectedPatient.currentHospital.name}</div>
                        </div>
                      </div>
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))
                    setFormErrors(prev => ({ ...prev, chiefComplaint: undefined }))
                  }}
                  placeholder="Describe the main reason for visit..."
                  rows={3}
                  className={formErrors.chiefComplaint ? "border-destructive" : ""}
                />
                {formErrors.chiefComplaint && (
                  <div className="text-sm text-destructive">
                    {formErrors.chiefComplaint}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="triageLevel">Triage Level *</Label>
                <Select
                  value={formData.triageLevel}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, triageLevel: value }))
                    setFormErrors(prev => ({ ...prev, triageLevel: undefined }))
                  }}
                >
                  <SelectTrigger className={formErrors.triageLevel ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select triage level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMMEDIATE">Immediate (Red) - Life-threatening</SelectItem>
                    <SelectItem value="URGENT">Urgent (Orange) - Potentially life-threatening</SelectItem>
                    <SelectItem value="LESS_URGENT">Less Urgent (Yellow) - Urgent but stable</SelectItem>
                    <SelectItem value="NON_URGENT">Non-Urgent (Green) - Minor illness/injury</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.triageLevel && (
                  <div className="text-sm text-destructive">
                    {formErrors.triageLevel}
                  </div>
                )}
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
                    <SelectItem value="PRIVATE_VEHICLE">Private Vehicle</SelectItem>
                    <SelectItem value="REFERRAL">Referral</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, departmentId: value }))
                      setFormErrors(prev => ({ ...prev, department: undefined }))
                    }}
                    disabled={!formData.hospitalId || loadingDepartments}
                  >
                    <SelectTrigger className={formErrors.department ? "border-destructive" : ""}>
                      <SelectValue placeholder={formData.hospitalId ? "Select department" : "Select patient first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length === 0 ? (
                        <SelectItem value="" disabled>
                          No departments found for this hospital
                        </SelectItem>
                      ) : (
                        departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.type})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {loadingDepartments && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </div>
                {formErrors.department && (
                  <div className="text-sm text-destructive">
                    {formErrors.department}
                  </div>
                )}
                {departmentError && (
                  <div className="text-sm text-destructive">
                    {departmentError}
                  </div>
                )}
                {formData.hospitalId && !loadingDepartments && departments.length === 0 && (
                  <div className="text-sm text-amber-600">
                    No departments configured for this hospital. Please contact administration.
                  </div>
                )}
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
                Record patient vital signs (optional)
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
                    min="30"
                    max="250"
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
                    min="30"
                    max="45"
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
                    min="5"
                    max="60"
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
                    min="50"
                    max="100"
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
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="min-w-[150px]"
          >
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