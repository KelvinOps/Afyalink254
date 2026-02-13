// src/app/(dashboard)/patients/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'

import { 
  ArrowLeft,
  User,
  Phone,
  Shield,
  AlertTriangle,
  Save,
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
  currentStatus: string
  currentHospital?: {
    id: string
    name: string
    code: string
  }
}

export default function EditPatientPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [patient, setPatient] = useState<Patient | null>(null)
  
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    otherNames: '',
    dateOfBirth: '',
    gender: '',
    nationalId: '',
    passportNumber: '',
    birthCertNumber: '',

    // Contact Information
    phone: '',
    alternatePhone: '',
    email: '',
    countyOfResidence: '',
    subCounty: '',
    ward: '',
    village: '',
    landmark: '',
    what3words: '',

    // Next of Kin
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRelation: '',

    // Medical Information
    bloodType: '',
    allergies: [] as string[],
    chronicConditions: [] as string[],
    disabilities: [] as string[],

    // SHA Information
    shaNumber: '',
    shaStatus: 'NOT_REGISTERED',
    contributionStatus: 'UNKNOWN',

    // Current Status
    currentStatus: 'REGISTERED',
    currentHospitalId: ''
  })

  const [allergyInput, setAllergyInput] = useState('')
  const [chronicConditionInput, setChronicConditionInput] = useState('')
  const [disabilityInput, setDisabilityInput] = useState('')

  const patientId = params.id as string

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/patients/${patientId}`)
        const data = await response.json()

        if (response.ok) {
          setPatient(data)
          setFormData({
            firstName: data.firstName,
            lastName: data.lastName,
            otherNames: data.otherNames || '',
            dateOfBirth: data.dateOfBirth.split('T')[0],
            gender: data.gender,
            nationalId: data.nationalId || '',
            passportNumber: data.passportNumber || '',
            birthCertNumber: data.birthCertNumber || '',
            phone: data.phone || '',
            alternatePhone: data.alternatePhone || '',
            email: data.email || '',
            countyOfResidence: data.countyOfResidence || '',
            subCounty: data.subCounty || '',
            ward: data.ward || '',
            village: data.village || '',
            landmark: data.landmark || '',
            what3words: data.what3words || '',
            nextOfKinName: data.nextOfKinName || '',
            nextOfKinPhone: data.nextOfKinPhone || '',
            nextOfKinRelation: data.nextOfKinRelation || '',
            bloodType: data.bloodType || '',
            allergies: data.allergies || [],
            chronicConditions: data.chronicConditions || [],
            disabilities: data.disabilities || [],
            shaNumber: data.shaNumber || '',
            shaStatus: data.shaStatus || 'NOT_REGISTERED',
            contributionStatus: data.contributionStatus || 'UNKNOWN',
            currentStatus: data.currentStatus,
            currentHospitalId: data.currentHospital?.id || user?.facilityId || ''
          })
        } else {
          console.error('Error fetching patient:', data.error)
          router.push('/patients')
        }
      } catch (error) {
        console.error('Error fetching patient:', error)
        router.push('/patients')
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      fetchPatient()
    }
  }, [patientId, router, user?.facilityId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/patients/${patientId}`)
      } else {
        alert(data.error || 'Error updating patient')
      }
    } catch (error) {
      console.error('Error updating patient:', error)
      alert('Error updating patient')
    } finally {
      setSaving(false)
    }
  }

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !formData.allergies.includes(allergyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()]
      }))
      setAllergyInput('')
    }
  }

  const handleRemoveAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }))
  }

  const handleAddChronicCondition = () => {
    if (chronicConditionInput.trim() && !formData.chronicConditions.includes(chronicConditionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        chronicConditions: [...prev.chronicConditions, chronicConditionInput.trim()]
      }))
      setChronicConditionInput('')
    }
  }

  const handleRemoveChronicCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter(c => c !== condition)
    }))
  }

  const handleAddDisability = () => {
    if (disabilityInput.trim() && !formData.disabilities.includes(disabilityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        disabilities: [...prev.disabilities, disabilityInput.trim()]
      }))
      setDisabilityInput('')
    }
  }

  const handleRemoveDisability = (disability: string) => {
    setFormData(prev => ({
      ...prev,
      disabilities: prev.disabilities.filter(d => d !== disability)
    }))
  }

  const bloodTypes = [
    'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
    'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN'
  ]

  const shaStatuses = [
    'REGISTERED', 'NOT_REGISTERED', 'PENDING', 'SUSPENDED', 'INACTIVE'
  ]

  const contributionStatuses = [
    'UP_TO_DATE', 'ARREARS', 'GRACE_PERIOD', 'DEFAULTED', 'UNKNOWN'
  ]

  const patientStatuses = [
    'REGISTERED', 'IN_TRIAGE', 'IN_TREATMENT', 'IN_SURGERY', 
    'ADMITTED', 'IN_ICU', 'IN_TRANSFER', 'DISCHARGED', 'DECEASED', 'ABSCONDED'
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Patient not found</h3>
        <p className="text-muted-foreground">
          The patient you're trying to edit doesn't exist.
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
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/patients/${patientId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Patient: {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted-foreground">
            Update patient information and medical details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Basic identification and demographic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherNames">Other Names</Label>
                <Input
                  id="otherNames"
                  value={formData.otherNames}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherNames: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                      <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    value={formData.passportNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, passportNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthCertNumber">Birth Certificate</Label>
                  <Input
                    id="birthCertNumber"
                    value={formData.birthCertNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthCertNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentStatus">Current Status</Label>
                <Select
                  value={formData.currentStatus}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {patientStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Patient contact details and location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, alternatePhone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="countyOfResidence">County</Label>
                  <Input
                    id="countyOfResidence"
                    value={formData.countyOfResidence}
                    onChange={(e) => setFormData(prev => ({ ...prev, countyOfResidence: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subCounty">Sub-County</Label>
                  <Input
                    id="subCounty"
                    value={formData.subCounty}
                    onChange={(e) => setFormData(prev => ({ ...prev, subCounty: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ward">Ward</Label>
                  <Input
                    id="ward"
                    value={formData.ward}
                    onChange={(e) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark</Label>
                <Input
                  id="landmark"
                  value={formData.landmark}
                  onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="what3words">What3Words Location</Label>
                <Input
                  id="what3words"
                  value={formData.what3words}
                  onChange={(e) => setFormData(prev => ({ ...prev, what3words: e.target.value }))}
                  placeholder="e.g., table.chair.spoon"
                />
              </div>
            </CardContent>
          </Card>

          {/* Next of Kin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Next of Kin
              </CardTitle>
              <CardDescription>
                Emergency contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nextOfKinName">Full Name</Label>
                <Input
                  id="nextOfKinName"
                  value={formData.nextOfKinName}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextOfKinName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextOfKinPhone">Phone Number</Label>
                <Input
                  id="nextOfKinPhone"
                  value={formData.nextOfKinPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextOfKinPhone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextOfKinRelation">Relationship</Label>
                <Input
                  id="nextOfKinRelation"
                  value={formData.nextOfKinRelation}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextOfKinRelation: e.target.value }))}
                  placeholder="e.g., Spouse, Parent, Child"
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Medical Information
              </CardTitle>
              <CardDescription>
                Medical history and conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select
                  value={formData.bloodType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bloodType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Allergies</Label>
                <div className="flex gap-2">
                  <Input
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    placeholder="Add allergy"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                  />
                  <Button type="button" onClick={handleAddAllergy}>
                    Add
                  </Button>
                </div>
                {formData.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.allergies.map(allergy => (
                      <div
                        key={allergy}
                        className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(allergy)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Chronic Conditions</Label>
                <div className="flex gap-2">
                  <Input
                    value={chronicConditionInput}
                    onChange={(e) => setChronicConditionInput(e.target.value)}
                    placeholder="Add chronic condition"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChronicCondition())}
                  />
                  <Button type="button" onClick={handleAddChronicCondition}>
                    Add
                  </Button>
                </div>
                {formData.chronicConditions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.chronicConditions.map(condition => (
                      <div
                        key={condition}
                        className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                      >
                        {condition}
                        <button
                          type="button"
                          onClick={() => handleRemoveChronicCondition(condition)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Disabilities</Label>
                <div className="flex gap-2">
                  <Input
                    value={disabilityInput}
                    onChange={(e) => setDisabilityInput(e.target.value)}
                    placeholder="Add disability"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDisability())}
                  />
                  <Button type="button" onClick={handleAddDisability}>
                    Add
                  </Button>
                </div>
                {formData.disabilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.disabilities.map(disability => (
                      <div
                        key={disability}
                        className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                      >
                        {disability}
                        <button
                          type="button"
                          onClick={() => handleRemoveDisability(disability)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SHA Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                SHA Insurance
              </CardTitle>
              <CardDescription>
                Social Health Authority coverage details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shaNumber">SHA Number</Label>
                <Input
                  id="shaNumber"
                  value={formData.shaNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, shaNumber: e.target.value }))}
                  placeholder="SHA membership number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shaStatus">SHA Status</Label>
                  <Select
                    value={formData.shaStatus}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, shaStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {shaStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contributionStatus">Contribution Status</Label>
                  <Select
                    value={formData.contributionStatus}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contributionStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contributionStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" type="button" asChild>
            <Link href={`/patients/${patientId}`}>
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