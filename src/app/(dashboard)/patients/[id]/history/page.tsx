// src/app/(dashboard)/patients/[id]/history/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { Input } from '@/app/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  AlertCircle,
  Heart,
  Thermometer,
  Activity,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Printer,
  Phone,
  Droplets,
  Loader2,
  Search,
  Plus,
  Edit,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import type { Patient, TriageEntry, PaginationInfo } from '@/app/types/patient.types'

interface MedicalRecord {
  id: string
  type: string
  title: string
  description: string
  date: string
  createdBy: string
  status: string
  attachments?: string[]
}

export default function PatientHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [triageEntries, setTriageEntries] = useState<TriageEntry[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('triage')

  // Safely get patientId from params
  const getPatientId = useCallback(() => {
    if (!params || typeof params !== 'object') return null
    const id = params.id
    return Array.isArray(id) ? id[0] : id
  }, [params])

  const patientId = getPatientId()

  const fetchPatientData = useCallback(async () => {
    const currentPatientId = getPatientId()
    if (!currentPatientId) {
      setError('Patient ID is required')
      setInitialLoading(false)
      return
    }

    try {
      setInitialLoading(true)
      setError(null)
      
      console.log('Fetching data for patient:', currentPatientId)
      
      // Fetch patient info and history in parallel - using correct API routes
      const [patientResponse, historyResponse, recordsResponse] = await Promise.allSettled([
        fetch(`/api/patients/${currentPatientId}`),
        fetch(`/api/patients/${currentPatientId}/history`), // ✅ Fixed: Use correct route
        fetch(`/api/patients/${currentPatientId}/medical-records`)
      ])

      console.log('API responses:', {
        patientResponse: patientResponse.status,
        historyResponse: historyResponse.status,
        recordsResponse: recordsResponse.status
      })

      // Handle patient info response
      if (patientResponse.status === 'fulfilled' && patientResponse.value.ok) {
        const patientData = await patientResponse.value.json()
        console.log('Patient data received:', patientData)
        setPatient(patientData)
      } else {
        const errorText = patientResponse.status === 'rejected' 
          ? patientResponse.reason?.message || 'Network error'
          : `HTTP ${patientResponse.value?.status}: ${patientResponse.value?.statusText}`
        console.error('Failed to fetch patient info:', errorText)
        setError(`Failed to load patient information: ${errorText}`)
      }

      // Handle history response
      if (historyResponse.status === 'fulfilled' && historyResponse.value.ok) {
        const historyData = await historyResponse.value.json()
        console.log('History data received:', historyData)
        setTriageEntries(historyData.triageEntries || [])
        setPagination(historyData.pagination || {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
      } else {
        const errorText = historyResponse.status === 'rejected' 
          ? historyResponse.reason?.message || 'Network error'
          : `HTTP ${historyResponse.value?.status}: ${historyResponse.value?.statusText}`
        console.error('Failed to fetch patient history:', errorText)
        
        // Set empty data if history fails but patient info succeeded
        setTriageEntries([])
        setPagination({
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
      }

      // Handle medical records response
      if (recordsResponse.status === 'fulfilled' && recordsResponse.value.ok) {
        const recordsData = await recordsResponse.value.json()
        console.log('Medical records received:', recordsData)
        setMedicalRecords(recordsData.records || [])
      } else {
        const errorText = recordsResponse.status === 'rejected' 
          ? recordsResponse.reason?.message || 'Network error'
          : `HTTP ${recordsResponse.value?.status}: ${recordsResponse.value?.statusText}`
        console.error('Failed to fetch medical records:', errorText)
        setMedicalRecords([])
      }
      
    } catch (error) {
      console.error('Error fetching patient data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load patient data')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [getPatientId])

  useEffect(() => {
    console.log('Patient ID from params:', patientId)
    console.log('Params object:', params)
    
    if (!patientId) {
      console.error('No patient ID found in params')
      setError('Patient ID is required')
      setLoading(false)
      setInitialLoading(false)
      return
    }
    
    fetchPatientData()
  }, [patientId, params, fetchPatientData])

  const fetchPatientHistory = async (page = 1) => {
    const currentPatientId = getPatientId()
    if (!currentPatientId) {
      setError('Patient ID is required')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${currentPatientId}/history?page=${page}&limit=20`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch history')
      }

      const data = await response.json()
      setTriageEntries(data.triageEntries || [])
      setPagination(data.pagination || {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      })
      setError(null)
    } catch (error) {
      console.error('Error fetching patient history:', error)
      setError(error instanceof Error ? error.message : 'Failed to load patient history')
    } finally {
      setLoading(false)
    }
  }

  const searchMedicalRecords = async () => {
    const currentPatientId = getPatientId()
    if (!currentPatientId || !searchQuery.trim()) return

    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${currentPatientId}/medical-records/search?query=${encodeURIComponent(searchQuery)}`)
      
      if (response.ok) {
        const data = await response.json()
        setMedicalRecords(data.records || [])
      }
    } catch (error) {
      console.error('Error searching medical records:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTriageBadge = (triageLevel: string) => {
    const triageConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      IMMEDIATE: { variant: 'destructive', label: 'Immediate' },
      URGENT: { variant: 'default', label: 'Urgent' },
      LESS_URGENT: { variant: 'secondary', label: 'Less Urgent' },
      NON_URGENT: { variant: 'outline', label: 'Non-Urgent' },
      DECEASED: { variant: 'destructive', label: 'Deceased' }
    }

    const config = triageConfig[triageLevel] || { variant: 'outline', label: triageLevel }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      REGISTERED: { variant: 'outline', label: 'Registered' },
      IN_TRIAGE: { variant: 'secondary', label: 'In Triage' },
      IN_TREATMENT: { variant: 'default', label: 'In Treatment' },
      IN_SURGERY: { variant: 'default', label: 'In Surgery' },
      ADMITTED: { variant: 'secondary', label: 'Admitted' },
      IN_ICU: { variant: 'destructive', label: 'In ICU' },
      IN_TRANSFER: { variant: 'outline', label: 'In Transfer' },
      DISCHARGED: { variant: 'outline', label: 'Discharged' },
      DECEASED: { variant: 'destructive', label: 'Deceased' },
      ABSCONDED: { variant: 'outline', label: 'Absconded' }
    }

    const config = statusConfig[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getRecordTypeBadge = (type: string) => {
    const typeConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      DIAGNOSIS: { variant: 'destructive', label: 'Diagnosis' },
      TREATMENT: { variant: 'default', label: 'Treatment' },
      LAB_RESULT: { variant: 'secondary', label: 'Lab Result' },
      PRESCRIPTION: { variant: 'outline', label: 'Prescription' },
      IMAGING: { variant: 'secondary', label: 'Imaging' },
      SURGERY: { variant: 'destructive', label: 'Surgery' },
      FOLLOW_UP: { variant: 'outline', label: 'Follow-up' }
    }

    const config = typeConfig[type] || { variant: 'outline', label: type }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

  const handlePrint = () => {
    window.print()
  }

  const handleExport = async () => {
    const currentPatientId = getPatientId()
    if (!currentPatientId) {
      alert('Patient ID is required')
      return
    }

    try {
      const response = await fetch(`/api/patients/${currentPatientId}/history/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `patient_history_${patient?.patientNumber || currentPatientId}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export history')
      }
    } catch (error) {
      console.error('Error exporting history:', error)
      alert(`Failed to export patient history: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCreateRecord = () => {
    const currentPatientId = getPatientId()
    if (!currentPatientId) {
      alert('Patient ID is required')
      return
    }
    router.push(`/patients/${currentPatientId}/medical-records/create`)
  }

  // Show loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl font-bold">Loading patient data...</h2>
              <p className="text-muted-foreground">Please wait while we fetch the patient information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Unable to load patient</h2>
              <p className="text-muted-foreground">{error}</p>
              <div className="flex gap-4 justify-center pt-4">
                {patientId ? (
                  <Button onClick={() => fetchPatientData()}>
                    Try Again
                  </Button>
                ) : (
                  <Button onClick={() => router.back()}>
                    Go Back
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href="/patients">
                    Back to Patients
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredTriageEntries = triageEntries.filter(entry => 
    entry.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.triageLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.department?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  const filteredMedicalRecords = medicalRecords.filter(record =>
    record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/patients/${patientId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patient Medical History</h1>
            <p className="text-muted-foreground">
              {patient ? (
                <>
                  {patient.firstName} {patient.lastName} • {patient.patientNumber}
                  {patient.currentHospital && ` • ${patient.currentHospital.name}`}
                </>
              ) : 'Loading patient information...'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={!patient}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!patient}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleCreateRecord} disabled={!patient}>
            <Plus className="w-4 h-4 mr-2" />
            Create Record
          </Button>
        </div>
      </div>

      {/* Patient Summary */}
      {patient && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Demographic and medical summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Patient Details</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {patient.firstName} {patient.lastName}</p>
                  <p><span className="text-muted-foreground">Age:</span> {calculateAge(patient.dateOfBirth)} years</p>
                  <p><span className="text-muted-foreground">Gender:</span> {patient.gender}</p>
                  <p><span className="text-muted-foreground">DOB:</span> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Contact & IDs</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Patient #:</span> {patient.patientNumber}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {patient.phone || 'N/A'}</p>
                  <p><span className="text-muted-foreground">National ID:</span> {patient.nationalId || 'N/A'}</p>
                  <p><span className="text-muted-foreground">County:</span> {patient.countyOfResidence || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Medical Information</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Blood Type:</span> {patient.bloodType || 'Unknown'}</p>
                  <p><span className="text-muted-foreground">Allergies:</span> {patient.allergies?.join(', ') || 'None'}</p>
                  <p><span className="text-muted-foreground">Chronic:</span> {patient.chronicConditions?.join(', ') || 'None'}</p>
                  <p><span className="text-muted-foreground">SHA Status:</span> {patient.shaStatus || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Current Status</span>
                </div>
                <div className="space-y-2">
                  {getStatusBadge(patient.currentStatus)}
                  {patient.currentHospital && (
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Facility:</span> {patient.currentHospital.name}</p>
                      <p><span className="text-muted-foreground">Code:</span> {patient.currentHospital.code}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search medical history..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchMedicalRecords()}
          />
        </div>
        <Button variant="outline" onClick={searchMedicalRecords}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
        <Button variant="outline" onClick={() => setSearchQuery('')}>
          Clear
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="triage">
            <Activity className="w-4 h-4 mr-2" />
            Triage History
          </TabsTrigger>
          <TabsTrigger value="records">
            <FileText className="w-4 h-4 mr-2" />
            Medical Records
          </TabsTrigger>
        </TabsList>

        {/* Triage History Tab */}
        <TabsContent value="triage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Triage History</CardTitle>
              <CardDescription>
                {pagination.totalCount} total entries • {filteredTriageEntries.length} filtered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredTriageEntries.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="mt-4 text-lg font-semibold">
                    {searchQuery ? 'No matching triage entries found' : 'No triage history found'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try a different search term' : 'This patient has no recorded triage visits.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTriageEntries.map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div 
                          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-center">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">
                                  {new Date(entry.arrivalTime).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{entry.chiefComplaint}</h3>
                                  {getTriageBadge(entry.triageLevel)}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(entry.arrivalTime).toLocaleTimeString()}
                                  </span>
                                  {entry.department && (
                                    <span>{entry.department.name} ({entry.department.type})</span>
                                  )}
                                  {entry.hospital && (
                                    <span>{entry.hospital.name}</span>
                                  )}
                                  {entry.assessedBy && (
                                    <span>
                                      Assessed by: {entry.assessedBy.firstName} {entry.assessedBy.lastName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div>
                              {expandedEntry === entry.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {expandedEntry === entry.id && (
                          <>
                            <Separator />
                            <div className="p-4 space-y-4">
                              {/* Vital Signs */}
                              {entry.vitalSigns && (
                                <div>
                                  <h4 className="font-medium mb-2">Vital Signs</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-red-500" />
                                        <span className="text-sm font-medium">Heart Rate</span>
                                      </div>
                                      <p className="text-2xl font-bold">{entry.vitalSigns.heartRate}</p>
                                      <p className="text-xs text-muted-foreground">bpm</p>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">Blood Pressure</span>
                                      </div>
                                      <p className="text-2xl font-bold">{entry.vitalSigns.bloodPressure}</p>
                                      <p className="text-xs text-muted-foreground">mmHg</p>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-green-500" />
                                        <span className="text-sm font-medium">Respiratory</span>
                                      </div>
                                      <p className="text-2xl font-bold">{entry.vitalSigns.respiratoryRate}</p>
                                      <p className="text-xs text-muted-foreground">breaths/min</p>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Thermometer className="h-4 w-4 text-orange-500" />
                                        <span className="text-sm font-medium">Temperature</span>
                                      </div>
                                      <p className="text-2xl font-bold">{entry.vitalSigns.temperature}</p>
                                      <p className="text-xs text-muted-foreground">°C</p>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-cyan-500" />
                                        <span className="text-sm font-medium">O₂ Saturation</span>
                                      </div>
                                      <p className="text-2xl font-bold">{entry.vitalSigns.oxygenSaturation}</p>
                                      <p className="text-xs text-muted-foreground">%</p>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                                        <span className="text-sm font-medium">Pain Level</span>
                                      </div>
                                      <p className="text-2xl font-bold">{entry.vitalSigns.painLevel}</p>
                                      <p className="text-xs text-muted-foreground">/10</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Additional Vital Signs if available */}
                              {entry.vitalSigns && (entry.vitalSigns.bloodSugar || entry.vitalSigns.weight || entry.vitalSigns.height || entry.vitalSigns.bmi) && (
                                <div>
                                  <h4 className="font-medium mb-2">Additional Measurements</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {entry.vitalSigns.bloodSugar !== undefined && (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Droplets className="h-4 w-4 text-purple-500" />
                                          <span className="text-sm font-medium">Blood Sugar</span>
                                        </div>
                                        <p className="text-2xl font-bold">{entry.vitalSigns.bloodSugar}</p>
                                        <p className="text-xs text-muted-foreground">mg/dL</p>
                                      </div>
                                    )}
                                    {entry.vitalSigns.weight !== undefined && (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Activity className="h-4 w-4 text-indigo-500" />
                                          <span className="text-sm font-medium">Weight</span>
                                        </div>
                                        <p className="text-2xl font-bold">{entry.vitalSigns.weight}</p>
                                        <p className="text-xs text-muted-foreground">kg</p>
                                      </div>
                                    )}
                                    {entry.vitalSigns.height !== undefined && (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Activity className="h-4 w-4 text-pink-500" />
                                          <span className="text-sm font-medium">Height</span>
                                        </div>
                                        <p className="text-2xl font-bold">{entry.vitalSigns.height}</p>
                                        <p className="text-xs text-muted-foreground">cm</p>
                                      </div>
                                    )}
                                    {entry.vitalSigns.bmi !== undefined && (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Activity className="h-4 w-4 text-teal-500" />
                                          <span className="text-sm font-medium">BMI</span>
                                        </div>
                                        <p className="text-2xl font-bold">{entry.vitalSigns.bmi}</p>
                                        <p className="text-xs text-muted-foreground">kg/m²</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Additional Info */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Entry ID:</span>
                                  <p className="font-mono">{entry.id.substring(0, 8)}...</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Status:</span>
                                  <p>{entry.status}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Created:</span>
                                  <p>{formatDateTime(entry.createdAt)}</p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-4">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/triage/${entry.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/triage/${entry.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage || loading}
                      onClick={() => fetchPatientHistory(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage || loading}
                      onClick={() => fetchPatientHistory(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Records</CardTitle>
              <CardDescription>
                Comprehensive medical records including diagnoses, treatments, lab results, and prescriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredMedicalRecords.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="mt-4 text-lg font-semibold">
                    {searchQuery ? 'No matching medical records found' : 'No medical records found'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try a different search term' : 'No medical records have been created for this patient.'}
                  </p>
                  <Button onClick={handleCreateRecord} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Record
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMedicalRecords.map((record) => (
                    <Card key={record.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {getRecordTypeBadge(record.type)}
                              <Badge variant="outline">{record.status}</Badge>
                            </div>
                            <h3 className="text-lg font-semibold">{record.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Created by {record.createdBy} • {formatDate(record.date)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-4">{record.description}</p>
                        
                        {record.attachments && record.attachments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Attachments</h4>
                            <div className="flex flex-wrap gap-2">
                              {record.attachments.map((attachment, index) => (
                                <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                                  File {index + 1}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Create Record Button */}
              <div className="mt-6 flex justify-center">
                <Button onClick={handleCreateRecord} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Medical Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}