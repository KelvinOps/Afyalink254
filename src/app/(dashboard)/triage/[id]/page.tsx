'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { 
  ArrowLeft,
  User,
  Stethoscope,
  Heart,
  AlertTriangle,
  Edit,
  Download,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface TriageEntry {
  id: string
  triageNumber: string
  patient: {
    id: string
    firstName: string
    lastName: string
    patientNumber: string
    dateOfBirth: string
    gender: string
    bloodType: string
    allergies: string[]
    chronicConditions: string[]
    phone: string
  }
  triageLevel: string
  status: string
  chiefComplaint: string
  arrivalTime: string
  arrivalMode: string
  waitingTime: number
  department: {
    name: string
    type: string
  }
  assessedBy: {
    firstName: string
    lastName: string
    role: string
  }
  vitalSigns: {
    bp?: string
    pulse?: number
    temp?: number
    respRate?: number
    o2Sat?: number
    painScale?: number
  }
  notes: string
  disposition: string
  diagnosis: string
  treatmentGiven: string
}

export default function TriageDetailPage() {
  const params = useParams()
  const [triageEntry, setTriageEntry] = useState<TriageEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const triageId = params.id as string

  const fetchTriageEntry = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/triage/${triageId}`)
      const data = await response.json()

      if (response.ok) {
        setTriageEntry(data)
      } else {
        console.error('Error fetching triage entry:', data.error)
      }
    } catch (error) {
      console.error('Error fetching triage entry:', error)
    } finally {
      setLoading(false)
    }
  }, [triageId])

  useEffect(() => {
    fetchTriageEntry()
  }, [fetchTriageEntry])

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/triage/${triageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTriageEntry() // Refresh data
      } else {
        alert('Error updating status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      WAITING: { variant: 'outline', label: 'Waiting' },
      IN_ASSESSMENT: { variant: 'secondary', label: 'In Assessment' },
      IN_TREATMENT: { variant: 'default', label: 'In Treatment' },
      AWAITING_ADMISSION: { variant: 'secondary', label: 'Awaiting Admission' },
      DISCHARGED: { variant: 'outline', label: 'Discharged' }
    }
    const config = statusConfig[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTriageBadge = (triageLevel: string) => {
    const triageConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      IMMEDIATE: { variant: 'destructive', label: 'Immediate' },
      URGENT: { variant: 'default', label: 'Urgent' },
      LESS_URGENT: { variant: 'secondary', label: 'Less Urgent' },
      NON_URGENT: { variant: 'outline', label: 'Non-Urgent' }
    }
    const config = triageConfig[triageLevel] || { variant: 'outline' as const, label: triageLevel }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!triageEntry) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Triage entry not found</h3>
        <p className="text-muted-foreground">
          The triage entry you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/triage">
            Back to Triage
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
            <Link href="/triage">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Triage: {triageEntry.triageNumber}
              </h1>
              {getTriageBadge(triageEntry.triageLevel)}
              {getStatusBadge(triageEntry.status)}
            </div>
            <p className="text-muted-foreground">
              {triageEntry.patient.firstName} {triageEntry.patient.lastName} • 
              {calculateAge(triageEntry.patient.dateOfBirth)} years • 
              {triageEntry.patient.gender.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/triage/${triageId}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Full Name</div>
              <div className="flex items-center gap-2">
                <div>{triageEntry.patient.firstName} {triageEntry.patient.lastName}</div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/patients/${triageEntry.patient.id}`}>
                    View Patient
                  </Link>
                </Button>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Patient Number</div>
              <div>{triageEntry.patient.patientNumber}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Age & Gender</div>
              <div>{calculateAge(triageEntry.patient.dateOfBirth)} years • {triageEntry.patient.gender.toLowerCase()}</div>
            </div>
            {triageEntry.patient.bloodType && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Blood Type</div>
                <div>{triageEntry.patient.bloodType}</div>
              </div>
            )}
            {triageEntry.patient.allergies.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Allergies</div>
                <div>{triageEntry.patient.allergies.join(', ')}</div>
              </div>
            )}
            {triageEntry.patient.chronicConditions.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Chronic Conditions</div>
                <div>{triageEntry.patient.chronicConditions.join(', ')}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Triage Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Triage Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Chief Complaint</div>
              <div>{triageEntry.chiefComplaint}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Department</div>
              <div>{triageEntry.department.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Arrival Mode</div>
              <div className="capitalize">{triageEntry.arrivalMode.toLowerCase().replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Assessed By</div>
              <div>{triageEntry.assessedBy.firstName} {triageEntry.assessedBy.lastName} ({triageEntry.assessedBy.role})</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Arrival Time</div>
              <div>{new Date(triageEntry.arrivalTime).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Waiting Time</div>
              <div>{formatWaitingTime(triageEntry.waitingTime)}</div>
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
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {triageEntry.vitalSigns.bp && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Blood Pressure</div>
                  <div>{triageEntry.vitalSigns.bp}</div>
                </div>
              )}
              {triageEntry.vitalSigns.pulse && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Pulse</div>
                  <div>{triageEntry.vitalSigns.pulse} BPM</div>
                </div>
              )}
              {triageEntry.vitalSigns.temp && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Temperature</div>
                  <div>{triageEntry.vitalSigns.temp}°C</div>
                </div>
              )}
              {triageEntry.vitalSigns.respRate && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Respiratory Rate</div>
                  <div>{triageEntry.vitalSigns.respRate} /min</div>
                </div>
              )}
              {triageEntry.vitalSigns.o2Sat && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">O2 Saturation</div>
                  <div>{triageEntry.vitalSigns.o2Sat}%</div>
                </div>
              )}
              {triageEntry.vitalSigns.painScale !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Pain Scale</div>
                  <div>{triageEntry.vitalSigns.painScale}/10</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Management */}
        <Card>
          <CardHeader>
            <CardTitle>Status Management</CardTitle>
            <CardDescription>
              Update patient status and disposition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['WAITING', 'IN_ASSESSMENT', 'IN_TREATMENT', 'AWAITING_ADMISSION', 'DISCHARGED'].map(status => (
                <Button
                  key={status}
                  variant={triageEntry.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus(status)}
                  disabled={updating || triageEntry.status === status}
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : status.replace('_', ' ')}
                </Button>
              ))}
            </div>

            {triageEntry.notes && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Notes</div>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {triageEntry.notes}
                </div>
              </div>
            )}

            {triageEntry.diagnosis && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Diagnosis</div>
                <div>{triageEntry.diagnosis}</div>
              </div>
            )}

            {triageEntry.treatmentGiven && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Treatment Given</div>
                <div>{triageEntry.treatmentGiven}</div>
              </div>
            )}

            {triageEntry.disposition && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Disposition</div>
                <div className="capitalize">{triageEntry.disposition.toLowerCase().replace('_', ' ')}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}