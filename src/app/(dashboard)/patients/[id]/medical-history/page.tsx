'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface MedicalHistory {
  id: string
  firstName: string
  lastName: string
  patientNumber: string
  dateOfBirth: string
  gender: string
  bloodType: string | null
  allergies: string[]
  chronicConditions: string[]
  treatments: any[]
  labTests: any[]
  diagnoses: any[]
  prescriptions: any[]
  visits: any[]
}

export default function MedicalHistoryPage() {
  const params = useParams()
  const patientId = params.id as string
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (patientId) {
      fetchMedicalHistory()
    } else {
      setError('Patient ID is required')
      setLoading(false)
    }
  }, [patientId])

  const fetchMedicalHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/patients/${patientId}/medical-history`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.medicalHistory) {
        setMedicalHistory(data.medicalHistory)
      } else {
        setError(data.error || 'Failed to fetch medical history')
      }
    } catch (error) {
      console.error('Error fetching medical history:', error)
      setError('Network error: Unable to fetch medical history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Unable to load medical history</h3>
          <p>{error}</p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={fetchMedicalHistory}>
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/patients/${patientId}`}>
              Back to Patient
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!medicalHistory) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold">Medical history not found</h3>
        <p className="text-muted-foreground">
          No medical history records found for this patient.
        </p>
        <Button asChild className="mt-4">
          <Link href={`/patients/${patientId}`}>
            Back to Patient
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/patients/${patientId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Medical History: {medicalHistory.firstName} {medicalHistory.lastName}
          </h1>
          <p className="text-muted-foreground">
            {medicalHistory.patientNumber} • {calculateAge(medicalHistory.dateOfBirth)} years • {medicalHistory.gender.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'treatments', label: 'Treatments' },
            { id: 'tests', label: 'Lab Tests' },
            { id: 'diagnoses', label: 'Diagnoses' },
            { id: 'medications', label: 'Medications' },
            { id: 'visits', label: 'Visits' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'overview' && <OverviewTab medicalHistory={medicalHistory} />}
        {activeTab === 'treatments' && <TreatmentsTab treatments={medicalHistory.treatments} />}
        {activeTab === 'tests' && <TestsTab labTests={medicalHistory.labTests} />}
        {activeTab === 'diagnoses' && <DiagnosesTab diagnoses={medicalHistory.diagnoses} />}
        {activeTab === 'medications' && <MedicationsTab prescriptions={medicalHistory.prescriptions} />}
        {activeTab === 'visits' && <VisitsTab visits={medicalHistory.visits} />}
      </div>

      {/* Add New Record Button */}
      <div className="flex justify-end">
        <Button>
          + Add New Medical Record
        </Button>
      </div>
    </div>
  )
}

// Tab Components
function OverviewTab({ medicalHistory }: { medicalHistory: MedicalHistory }) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Blood Type</label>
              <p className="text-base">{medicalHistory.bloodType || 'Not recorded'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Age</label>
              <p className="text-base">{calculateAge(medicalHistory.dateOfBirth)} years</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gender</label>
              <p className="text-base capitalize">{medicalHistory.gender.toLowerCase()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Health Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Allergies</label>
              <p className="text-base">{medicalHistory.allergies.length > 0 ? medicalHistory.allergies.join(', ') : 'None recorded'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Chronic Conditions</label>
              <p className="text-base">{medicalHistory.chronicConditions.length > 0 ? medicalHistory.chronicConditions.join(', ') : 'None recorded'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Treatments" value={medicalHistory.treatments.length} />
        <StatCard title="Lab Tests" value={medicalHistory.labTests.length} />
        <StatCard title="Diagnoses" value={medicalHistory.diagnoses.length} />
        <StatCard title="Medications" value={medicalHistory.prescriptions.length} />
      </div>
    </div>
  )
}

function TreatmentsTab({ treatments }: { treatments: any[] }) {
  return (
    <div className="p-6">
      <CardHeader>
        <CardTitle>Treatment History</CardTitle>
        <CardDescription>
          {treatments.length} treatment records found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {treatments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No treatment records found.</p>
        ) : (
          <div className="space-y-4">
            {treatments.map((treatment) => (
              <Card key={treatment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{treatment.procedureName}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{treatment.description}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Dr. {treatment.doctor.firstName} {treatment.doctor.lastName}</span>
                        <span>{new Date(treatment.createdAt).toLocaleDateString()}</span>
                        {treatment.hospital && (
                          <span>{treatment.hospital.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  )
}

function TestsTab({ labTests }: { labTests: any[] }) {
  return (
    <div className="p-6">
      <CardHeader>
        <CardTitle>Laboratory Tests</CardTitle>
        <CardDescription>
          {labTests.length} lab test records found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {labTests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No lab test records found.</p>
        ) : (
          <div className="space-y-4">
            {labTests.map((test) => (
              <Card key={test.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{test.testName}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Result:</span>
                          <p>{test.result || 'Pending'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className="capitalize">{test.status.toLowerCase()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ordered by:</span>
                          <p>Dr. {test.orderedBy.firstName} {test.orderedBy.lastName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p>{new Date(test.testDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  )
}

function DiagnosesTab({ diagnoses }: { diagnoses: any[] }) {
  return (
    <div className="p-6">
      <CardHeader>
        <CardTitle>Diagnosis History</CardTitle>
        <CardDescription>
          {diagnoses.length} diagnosis records found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {diagnoses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No diagnosis records found.</p>
        ) : (
          <div className="space-y-4">
            {diagnoses.map((diagnosis) => (
              <Card key={diagnosis.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{diagnosis.condition}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{diagnosis.notes}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Dr. {diagnosis.diagnosedBy.firstName} {diagnosis.diagnosedBy.lastName}</span>
                        <span>{new Date(diagnosis.diagnosedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  )
}

function MedicationsTab({ prescriptions }: { prescriptions: any[] }) {
  return (
    <div className="p-6">
      <CardHeader>
        <CardTitle>Medication History</CardTitle>
        <CardDescription>
          {prescriptions.length} prescription records found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No prescription records found.</p>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{prescription.medication.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Dosage:</span>
                          <p>{prescription.medication.dosage}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Instructions:</span>
                          <p>{prescription.instructions}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prescribed by:</span>
                          <p>Dr. {prescription.prescribedBy.firstName} {prescription.prescribedBy.lastName}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span>Prescribed: {new Date(prescription.prescribedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  )
}

function VisitsTab({ visits }: { visits: any[] }) {
  return (
    <div className="p-6">
      <CardHeader>
        <CardTitle>Visit History</CardTitle>
        <CardDescription>
          {visits.length} visit records found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No visit records found.</p>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <Card key={visit.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold capitalize">{visit.visitType.toLowerCase()} Visit</h4>
                      <p className="text-sm text-muted-foreground mt-1">{visit.reason}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Dr. {visit.doctor.firstName} {visit.doctor.lastName}</span>
                        <span>{visit.hospital?.name}</span>
                        <span>{new Date(visit.visitDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  )
}

// Helper Components
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="text-2xl font-bold text-primary">{value}</div>
        <div className="text-sm text-muted-foreground mt-1">{title}</div>
      </CardContent>
    </Card>
  )
}

function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}