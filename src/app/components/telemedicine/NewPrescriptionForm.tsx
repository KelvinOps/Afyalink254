'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { Badge } from '@/app/components/ui/badge'
import { X, Search, AlertTriangle } from 'lucide-react'

interface Medication {
  id: string
  name: string
  genericName?: string
  brandName?: string
  form: string
  strength?: string
  category: string
}

interface Patient {
  firstName: string
  lastName: string
  allergies: string[]
}

interface Session {
  patient: Patient
}

interface CurrentUser {
  id: string
  name: string
  role: string
}

interface Prescription {
  id: string
  prescriptionNumber: string
  medication: Medication
  dosage: string
  frequency: string
  route: string
  duration: string
  quantity?: number
  unit: string
  instructions: string
  specialInstructions: string
  asNeeded: boolean
  prnIndication: string
  startDate: string
  refillsAllowed: number
  requiresReview: boolean
  reviewDate: string
  shaCovered: boolean
  status: string
  isDispensed: boolean
  refillsUsed: number
  prescribedBy: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  createdAt: Date
}

interface NewPrescriptionFormProps {
  session: Session
  currentUser: CurrentUser
  onSave: (prescription: Prescription) => void
  onCancel: () => void
}

// Mock medication data - in real app, this would come from an API
const mockMedications: Medication[] = [
  {
    id: '1',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    form: 'CAPSULE',
    strength: '500mg',
    category: 'ANTIBIOTIC'
  },
  {
    id: '2',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    brandName: 'Panadol',
    form: 'TABLET',
    strength: '500mg',
    category: 'ANALGESIC'
  },
  {
    id: '3',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    brandName: 'Advil',
    form: 'TABLET',
    strength: '400mg',
    category: 'NSAID'
  },
  {
    id: '4',
    name: 'Ventolin',
    genericName: 'Salbutamol',
    form: 'INHALER',
    strength: '100mcg',
    category: 'BRONCHODILATOR'
  }
]

const frequencyOptions = [
  'ONCE daily',
  'TWICE daily',
  'THREE times daily',
  'FOUR times daily',
  'EVERY 6 hours',
  'EVERY 8 hours',
  'EVERY 12 hours',
  'EVERY WEEK',
  'AS NEEDED'
]

const routeOptions = [
  'ORAL',
  'TOPICAL',
  'INHALATION',
  'INJECTION',
  'RECTAL',
  'SUBLINGUAL'
]

const durationOptions = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '21 days',
  '28 days',
  '30 days',
  'Until finished',
  'Until review'
]

export function NewPrescriptionForm({ session, currentUser, onSave, onCancel }: NewPrescriptionFormProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [formData, setFormData] = useState({
    dosage: '',
    frequency: '',
    route: 'ORAL',
    duration: '',
    quantity: '',
    unit: 'tablets',
    instructions: '',
    specialInstructions: '',
    asNeeded: false,
    prnIndication: '',
    startDate: new Date().toISOString().split('T')[0],
    refillsAllowed: 0,
    requiresReview: false,
    reviewDate: '',
    shaCovered: true
  })

  const filteredMedications = mockMedications.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    if (!selectedMedication) {
      alert('Please select a medication')
      return
    }

    const prescription: Prescription = {
      id: `prescription-${Date.now()}`,
      prescriptionNumber: `RX${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      medication: selectedMedication,
      ...formData,
      quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
      refillsAllowed: parseInt(formData.refillsAllowed.toString()),
      status: 'ACTIVE',
      isDispensed: false,
      refillsUsed: 0,
      prescribedBy: {
        id: currentUser.id,
        firstName: currentUser.name.split(' ')[0],
        lastName: currentUser.name.split(' ')[1] || '',
        role: currentUser.role
      },
      createdAt: new Date()
    }

    onSave(prescription)
  }

  const checkAllergyConflict = (medicationName: string) => {
    return session.patient.allergies.some((allergy: string) => 
      medicationName.toLowerCase().includes(allergy.toLowerCase()) ||
      allergy.toLowerCase().includes(medicationName.toLowerCase())
    )
  }

  const hasAllergyConflict = selectedMedication ? checkAllergyConflict(selectedMedication.name) : false

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>New Prescription</CardTitle>
            <CardDescription>
              Prescribe medication for {session.patient.firstName} {session.patient.lastName}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Medication Search and Selection */}
        <div className="space-y-4">
          <Label htmlFor="medicationSearch">Select Medication</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="medicationSearch"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchTerm && (
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {filteredMedications.map(medication => (
                <div
                  key={medication.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted ${
                    selectedMedication?.id === medication.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedMedication(medication)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{medication.name}</div>
                      {medication.genericName && (
                        <div className="text-sm text-muted-foreground">
                          {medication.genericName}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{medication.strength}</div>
                      <Badge variant="outline" className="text-xs">
                        {medication.form}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {filteredMedications.length === 0 && (
                <div className="p-3 text-center text-muted-foreground">
                  No medications found
                </div>
              )}
            </div>
          )}

          {selectedMedication && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedMedication.name}</div>
                  {selectedMedication.genericName && (
                    <div className="text-sm text-muted-foreground">
                      Generic: {selectedMedication.genericName}
                    </div>
                  )}
                  <div className="text-sm">
                    {selectedMedication.strength} • {selectedMedication.form}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMedication(null)}
                >
                  Change
                </Button>
              </div>
              
              {hasAllergyConflict && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">
                    Warning: Potential allergy conflict with patient's known allergies
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prescription Details */}
        {selectedMedication && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  placeholder="e.g., 500mg, 10mL"
                />
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => handleInputChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map(freq => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="route">Route</Label>
                <Select
                  value={formData.route}
                  onValueChange={(value) => handleInputChange('route', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routeOptions.map(route => (
                      <SelectItem key={route} value={route}>
                        {route}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => handleInputChange('duration', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map(duration => (
                      <SelectItem key={duration} value={duration}>
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  placeholder="e.g., tablets, bottles"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Specific instructions for taking the medication..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="asNeeded" className="text-base">
                  As Needed (PRN)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Medication to be taken only when needed
                </p>
              </div>
              <Switch
                id="asNeeded"
                checked={formData.asNeeded}
                onCheckedChange={(checked) => handleInputChange('asNeeded', checked)}
              />
            </div>

            {formData.asNeeded && (
              <div>
                <Label htmlFor="prnIndication">PRN Indication</Label>
                <Input
                  id="prnIndication"
                  value={formData.prnIndication}
                  onChange={(e) => handleInputChange('prnIndication', e.target.value)}
                  placeholder="e.g., For pain, when needed"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="shaCovered" className="text-base">
                  SHA Covered
                </Label>
                <p className="text-sm text-muted-foreground">
                  This prescription is covered by SHA insurance
                </p>
              </div>
              <Switch
                id="shaCovered"
                checked={formData.shaCovered}
                onCheckedChange={(checked) => handleInputChange('shaCovered', checked)}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Save Prescription
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}