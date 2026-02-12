//(dashboard)/triage/[id]/edit/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { 
  ArrowLeft,
  Loader2,
  Save
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
  }
  triageLevel: string
  status: string
  chiefComplaint: string
  arrivalMode: string
  departmentId: string
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

export default function EditTriagePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [triageEntry, setTriageEntry] = useState<TriageEntry | null>(null)
  
  const [formData, setFormData] = useState({
    triageLevel: '',
    status: '',
    chiefComplaint: '',
    arrivalMode: '',
    departmentId: '',
    vitalSigns: {
      bp: '',
      pulse: '',
      temp: '',
      respRate: '',
      o2Sat: '',
      painScale: ''
    },
    notes: '',
    disposition: '',
    diagnosis: '',
    treatmentGiven: ''
  })

  const triageId = params.id as string

  // Wrapped in useCallback so the function reference is stable across renders.
  // triageId is the only external value it closes over, so it is the only dep.
  const fetchTriageEntry = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/triage/${triageId}`)
      const data = await response.json()

      if (response.ok) {
        setTriageEntry(data)
        setFormData({
          triageLevel: data.triageLevel,
          status: data.status,
          chiefComplaint: data.chiefComplaint,
          arrivalMode: data.arrivalMode,
          departmentId: data.departmentId,
          vitalSigns: {
            bp: data.vitalSigns.bp || '',
            pulse: data.vitalSigns.pulse?.toString() || '',
            temp: data.vitalSigns.temp?.toString() || '',
            respRate: data.vitalSigns.respRate?.toString() || '',
            o2Sat: data.vitalSigns.o2Sat?.toString() || '',
            painScale: data.vitalSigns.painScale?.toString() || ''
          },
          notes: data.notes || '',
          disposition: data.disposition || '',
          diagnosis: data.diagnosis || '',
          treatmentGiven: data.treatmentGiven || ''
        })
      } else {
        console.error('Error fetching triage entry:', data.error)
      }
    } catch (error) {
      console.error('Error fetching triage entry:', error)
    } finally {
      setLoading(false)
    }
  }, [triageId])

  // fetchTriageEntry is now stable (only changes if triageId changes),
  // so including it here satisfies the exhaustive-deps rule without
  // causing infinite re-fetch loops.
  useEffect(() => {
    fetchTriageEntry()
  }, [fetchTriageEntry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/triage/${triageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/triage/${triageId}`)
      } else {
        alert(data.error || 'Error updating triage entry')
      }
    } catch (error) {
      console.error('Error updating triage:', error)
      alert('Error updating triage entry')
    } finally {
      setSaving(false)
    }
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
        <h3 className="text-lg font-semibold">Triage entry not found</h3>
        <p className="text-muted-foreground">
          The triage entry you're trying to edit doesn't exist.
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
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/triage/${triageId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Triage: {triageEntry.triageNumber}
          </h1>
          <p className="text-muted-foreground">
            {triageEntry.patient.firstName} {triageEntry.patient.lastName} ({triageEntry.patient.patientNumber})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Triage Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Triage Assessment</CardTitle>
              <CardDescription>
                Update patient assessment and priority
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                <Textarea
                  id="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="triageLevel">Triage Level</Label>
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WAITING">Waiting</SelectItem>
                    <SelectItem value="IN_ASSESSMENT">In Assessment</SelectItem>
                    <SelectItem value="IN_TREATMENT">In Treatment</SelectItem>
                    <SelectItem value="AWAITING_ADMISSION">Awaiting Admission</SelectItem>
                    <SelectItem value="DISCHARGED">Discharged</SelectItem>
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
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs</CardTitle>
              <CardDescription>
                Update patient vital signs
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
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Details</CardTitle>
              <CardDescription>
                Diagnosis and treatment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatmentGiven">Treatment Given</Label>
                <Textarea
                  id="treatmentGiven"
                  value={formData.treatmentGiven}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatmentGiven: e.target.value }))}
                  placeholder="Describe treatment provided..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disposition">Disposition</Label>
                <Select
                  value={formData.disposition}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, disposition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select disposition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCHARGED_HOME">Discharged Home</SelectItem>
                    <SelectItem value="ADMITTED">Admitted</SelectItem>
                    <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                    <SelectItem value="REFERRED">Referred</SelectItem>
                    <SelectItem value="LEFT_AMA">Left AMA</SelectItem>
                  </SelectContent>
                </Select>
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
                placeholder="Additional observations or notes..."
                rows={6}
              />
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" type="button" asChild>
            <Link href={`/triage/${triageId}`}>
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}