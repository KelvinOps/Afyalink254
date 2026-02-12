// src/app/(dashboard)/patients/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { 
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Shield,
  AlertTriangle,
  Ambulance,
  Activity,
  Edit,
  Download,
  RefreshCw,
  Stethoscope,
  Pill,
  TestTube,
  ClipboardList,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface Patient {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  otherNames: string
  dateOfBirth: string
  gender: string
  phone: string
  alternatePhone: string
  email: string
  nationalId: string
  passportNumber: string
  birthCertNumber: string
  countyOfResidence: string
  subCounty: string
  ward: string
  village: string
  landmark: string
  what3words: string
  nextOfKinName: string
  nextOfKinPhone: string
  nextOfKinRelation: string
  bloodType: string
  allergies: string[]
  chronicConditions: string[]
  disabilities: string[]
  shaNumber: string
  shaStatus: string
  contributionStatus: string
  shaRegistrationDate: string
  currentStatus: string
  currentHospital?: {
    id: string
    name: string
    code: string
    phone: string
    address: string
  }
  triageEntries: Array<{
    id: string
    triageNumber: string
    triageLevel: string
    status: string
    arrivalTime: string
    chiefComplaint: string
    department: {
      id: string
      name: string
      type: string
    }
    assessedBy: {
      id: string
      firstName: string
      lastName: string
      role: string
    }
  }>
  transfers: Array<{
    id: string
    transferNumber: string
    status: string
    urgency: string
    reason: string
    requestedAt: string
    originHospital: {
      id: string
      name: string
      code: string
    }
    destinationHospital: {
      id: string
      name: string
      code: string
    }
    ambulance: {
      id: string
      registrationNumber: string
      type: string
    }
  }>
  referrals: Array<{
    id: string
    referralNumber: string
    status: string
    urgency: string
    reason: string
    referredAt: string
    originHospital: {
      id: string
      name: string
      code: string
    }
    destinationHospital: {
      id: string
      name: string
      code: string
    }
  }>
  shaClaims: Array<{
    id: string
    claimNumber: string
    serviceDate: string
    serviceType: string
    totalAmount: number
    shaApprovedAmount: number
    status: string
    hospital: {
      id: string
      name: string
      code: string
    }
  }>
  emergencies: Array<{
    id: string
    emergencyNumber: string
    type: string
    severity: string
    reportedAt: string
    county: {
      id: string
      name: string
      code: string
    }
  }>
}

interface MedicalHistoryData {
  id: string
  firstName: string
  lastName: string
  patientNumber: string
  dateOfBirth: string
  gender: string
  bloodType: string | null
  allergies: string[]
  chronicConditions: string[]
  treatments: Array<{
    id: string
    procedureName: string
    description: string
    createdAt: string
    doctor: {
      firstName: string
      lastName: string
      specialization: string
    }
    hospital: {
      name: string
    }
  }>
  labTests: Array<{
    id: string
    testName: string
    result: string
    status: string
    testDate: string
    orderedBy: {
      firstName: string
      lastName: string
    }
  }>
  diagnoses: Array<{
    id: string
    condition: string
    notes: string
    diagnosedAt: string
    diagnosedBy: {
      firstName: string
      lastName: string
      specialization: string
    }
  }>
  prescriptions: Array<{
    id: string
    instructions: string
    prescribedAt: string
    prescribedBy: {
      firstName: string
      lastName: string
    }
    medication: {
      name: string
      dosage: string
    }
  }>
  visits: Array<{
    id: string
    visitType: string
    reason: string
    visitDate: string
    doctor: {
      firstName: string
      lastName: string
    }
    hospital: {
      name: string
    }
  }>
}

export default function PatientDetailPage() {
  const { hasPermission } = useAuth()
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryData | null>(null)
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(false)

  const patientId = params.id as string

  const fetchPatient = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/patients/${patientId}`)
      const data = await response.json()

      if (response.ok) {
        setPatient(data)
      } else {
        setError(data.error || 'Failed to fetch patient')
        console.error('Error fetching patient:', data.error)
      }
    } catch (error) {
      setError('Network error: Unable to fetch patient data')
      console.error('Error fetching patient:', error)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  // Add this function to fetch medical history
  const fetchMedicalHistory = async () => {
    try {
      setMedicalHistoryLoading(true)
      const response = await fetch(`/api/patients/${patientId}/medical-history`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch medical history')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setMedicalHistory(data.medicalHistory)
      } else {
        console.error('Error fetching medical history:', data.error)
      }
    } catch (error) {
      console.error('Error fetching medical history:', error)
    } finally {
      setMedicalHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (patientId) {
      fetchPatient()
    } else {
      setError('Patient ID is required')
      setLoading(false)
    }
  }, [patientId, fetchPatient])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  // Medical History Components
  // Update the MedicalHistoryOverview component to handle loading states
  const MedicalHistoryOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Treatments" 
          value={medicalHistory?.treatments?.length || 0} 
          icon={<Stethoscope className="w-4 h-4" />}
        />
        <StatCard 
          title="Lab Tests" 
          value={medicalHistory?.labTests?.length || 0} 
          icon={<TestTube className="w-4 h-4" />}
        />
        <StatCard 
          title="Diagnoses" 
          value={medicalHistory?.diagnoses?.length || 0} 
          icon={<ClipboardList className="w-4 h-4" />}
        />
        <StatCard 
          title="Medications" 
          value={medicalHistory?.prescriptions?.length || 0} 
          icon={<Pill className="w-4 h-4" />}
        />
      </div>

      {/* Add loading state for medical history cards */}
      {medicalHistoryLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Treatments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Recent Treatments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicalHistory?.treatments && medicalHistory.treatments.length > 0 ? (
              <div className="space-y-3">
                {medicalHistory.treatments.slice(0, 3).map((treatment) => (
                  <div key={treatment.id} className="border rounded-lg p-3">
                    <div className="font-medium">{treatment.procedureName}</div>
                    <div className="text-sm text-muted-foreground">
                      {treatment.doctor.firstName} {treatment.doctor.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(treatment.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No treatment records</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Lab Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Recent Lab Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicalHistory?.labTests && medicalHistory.labTests.length > 0 ? (
              <div className="space-y-3">
                {medicalHistory.labTests.slice(0, 3).map((test) => (
                  <div key={test.id} className="border rounded-lg p-3">
                    <div className="font-medium">{test.testName}</div>
                    <div className="text-sm text-muted-foreground">
                      Result: {test.result || 'Pending'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(test.testDate)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No lab test records</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Recent Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicalHistory?.diagnoses && medicalHistory.diagnoses.length > 0 ? (
              <div className="space-y-3">
                {medicalHistory.diagnoses.slice(0, 3).map((diagnosis) => (
                  <div key={diagnosis.id} className="border rounded-lg p-3">
                    <div className="font-medium">{diagnosis.condition}</div>
                    <div className="text-sm text-muted-foreground">
                      {diagnosis.diagnosedBy.firstName} {diagnosis.diagnosedBy.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(diagnosis.diagnosedAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No diagnosis records</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Recent Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicalHistory?.prescriptions && medicalHistory.prescriptions.length > 0 ? (
              <div className="space-y-3">
                {medicalHistory.prescriptions.slice(0, 3).map((prescription) => (
                  <div key={prescription.id} className="border rounded-lg p-3">
                    <div className="font-medium">{prescription.medication.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {prescription.medication.dosage}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(prescription.prescribedAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No prescription records</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
          </div>
          <div className="text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-semibold">Unable to load patient</h3>
        <p className="text-muted-foreground mt-2">
          {error}
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          <Button onClick={fetchPatient}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/patients">
              Back to Patients
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Patient not found</h3>
        <p className="text-muted-foreground">
          The patient you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/patients">
            Back to Patients
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/patients">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {patient.firstName} {patient.lastName}
              </h1>
              {getStatusBadge(patient.currentStatus)}
            </div>
            <p className="text-muted-foreground">
              {patient.patientNumber} • {calculateAge(patient.dateOfBirth)} years • {patient.gender.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasPermission('patients.write') && (
            <Button variant="outline" asChild>
              <Link href={`/patients/${patient.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger 
            value="medical" 
            onClick={fetchMedicalHistory}
          >
            Medical History
          </TabsTrigger>
          <TabsTrigger value="triage">Triage Records</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="claims">SHA Claims</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                  <div>{patient.firstName} {patient.lastName} {patient.otherNames && `(${patient.otherNames})`}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
                  <div>{formatDate(patient.dateOfBirth)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Age</div>
                  <div>{calculateAge(patient.dateOfBirth)} years</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Gender</div>
                  <div className="capitalize">{patient.gender.toLowerCase()}</div>
                </div>
                {patient.nationalId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">National ID</div>
                    <div>{patient.nationalId}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.phone && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div>{patient.phone}</div>
                  </div>
                )}
                {patient.alternatePhone && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Alternate Phone</div>
                    <div>{patient.alternatePhone}</div>
                  </div>
                )}
                {patient.email && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div>{patient.email}</div>
                  </div>
                )}
                {(patient.countyOfResidence || patient.subCounty) && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Location</div>
                    <div>
                      {[patient.countyOfResidence, patient.subCounty, patient.ward, patient.village]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                )}
                {patient.landmark && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Landmark</div>
                    <div>{patient.landmark}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next of Kin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Next of Kin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.nextOfKinName && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div>{patient.nextOfKinName}</div>
                  </div>
                )}
                {patient.nextOfKinPhone && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div>{patient.nextOfKinPhone}</div>
                  </div>
                )}
                {patient.nextOfKinRelation && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Relationship</div>
                    <div>{patient.nextOfKinRelation}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SHA Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  SHA Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.shaNumber ? (
                  <>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">SHA Number</div>
                      <div>{patient.shaNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <Badge variant={patient.shaStatus === 'REGISTERED' ? 'default' : 'outline'}>
                        {patient.shaStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Contribution</div>
                      <Badge variant={patient.contributionStatus === 'UP_TO_DATE' ? 'default' : 'outline'}>
                        {patient.contributionStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    {patient.shaRegistrationDate && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Registered</div>
                        <div>{formatDate(patient.shaRegistrationDate)}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground">Not registered with SHA</div>
                )}
              </CardContent>
            </Card>

            {/* Current Facility */}
            {patient.currentHospital && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Current Facility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Hospital</div>
                    <div>{patient.currentHospital.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Code</div>
                    <div>{patient.currentHospital.code}</div>
                  </div>
                  {patient.currentHospital.phone && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Phone</div>
                      <div>{patient.currentHospital.phone}</div>
                    </div>
                  )}
                  {patient.currentHospital.address && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Address</div>
                      <div>{patient.currentHospital.address}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="medical" className="space-y-6">
          {medicalHistoryLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <MedicalHistoryOverview />
          )}
        </TabsContent>

        {/* Triage Records Tab */}
        <TabsContent value="triage">
          <Card>
            <CardHeader>
              <CardTitle>Triage History</CardTitle>
              <CardDescription>
                Complete history of patient triage visits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patient.triageEntries.length > 0 ? (
                <div className="space-y-4">
                  {patient.triageEntries.map(entry => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold">{entry.triageNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.department.name} • {entry.department.type.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {getTriageBadge(entry.triageLevel)}
                          {getStatusBadge(entry.status)}
                        </div>
                      </div>
                      
                      <div className="grid gap-2 text-sm">
                        <div>
                          <span className="font-medium">Chief Complaint:</span> {entry.chiefComplaint}
                        </div>
                        <div>
                          <span className="font-medium">Assessed by:</span> {entry.assessedBy.firstName} {entry.assessedBy.lastName} ({entry.assessedBy.role})
                        </div>
                        <div>
                          <span className="font-medium">Arrival Time:</span> {formatDate(entry.arrivalTime)}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No triage records</h3>
                  <p className="text-muted-foreground">
                    This patient has no recorded triage visits.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Patient Transfers</CardTitle>
              <CardDescription>
                Inter-facility transfer history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patient.transfers.length > 0 ? (
                <div className="space-y-4">
                  {patient.transfers.map(transfer => (
                    <div key={transfer.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold">{transfer.transferNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transfer.requestedAt)}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {transfer.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">From</div>
                          <div>{transfer.originHospital.name}</div>
                          <div className="text-muted-foreground">{transfer.originHospital.code}</div>
                        </div>
                        <div>
                          <div className="font-medium">To</div>
                          <div>{transfer.destinationHospital.name}</div>
                          <div className="text-muted-foreground">{transfer.destinationHospital.code}</div>
                        </div>
                      </div>

                      <div className="mt-3 text-sm">
                        <div className="font-medium">Reason</div>
                        <div className="text-muted-foreground">{transfer.reason}</div>
                      </div>

                      {transfer.ambulance && (
                        <div className="mt-2 text-sm">
                          <div className="font-medium">Ambulance</div>
                          <div className="text-muted-foreground">
                            {transfer.ambulance.registrationNumber} • {transfer.ambulance.type.replace('_', ' ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ambulance className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No transfer records</h3>
                  <p className="text-muted-foreground">
                    This patient has no recorded transfers.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHA Claims Tab */}
        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>SHA Claims History</CardTitle>
              <CardDescription>
                Social Health Authority insurance claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patient.shaClaims.length > 0 ? (
                <div className="space-y-4">
                  {patient.shaClaims.map(claim => (
                    <div key={claim.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold">{claim.claimNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {claim.hospital.name} • {formatDate(claim.serviceDate)}
                          </div>
                        </div>
                        <Badge variant={
                          claim.status === 'PAID' ? 'default' :
                          claim.status === 'APPROVED' ? 'secondary' :
                          claim.status === 'REJECTED' ? 'destructive' : 'outline'
                        }>
                          {claim.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Service Type</div>
                          <div>{claim.serviceType.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <div className="font-medium">Total Amount</div>
                          <div>{formatCurrency(claim.totalAmount)}</div>
                        </div>
                        <div>
                          <div className="font-medium">SHA Approved</div>
                          <div>{formatCurrency(claim.shaApprovedAmount || 0)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No SHA claims</h3>
                  <p className="text-muted-foreground">
                    This patient has no recorded SHA claims.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}