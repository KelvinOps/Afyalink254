'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Plus, FileText, Pill, AlertTriangle } from 'lucide-react'
import { NewPrescriptionForm } from './NewPrescriptionForm'
import { useToast } from '@/app/hooks/use-toast'

interface Medication {
  id: string
  name: string
  genericName?: string
  brandName?: string
  form: string
  strength?: string
}

interface Prescription {
  id: string
  prescriptionNumber: string
  medication: Medication
  dosage: string
  frequency: string
  route: string
  duration?: string
  quantity?: number
  unit?: string
  instructions?: string
  specialInstructions?: string
  startDate?: Date
  endDate?: Date
  asNeeded: boolean
  prnIndication?: string
  status: string
  isDispensed: boolean
  dispensedAt?: Date
  refillsAllowed: number
  refillsUsed: number
  requiresReview: boolean
  reviewDate?: Date
  cost?: number
  shaCovered: boolean
  prescribedBy: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  createdAt: Date
}

interface TelemedicineSession {
  id: string
  sessionNumber: string
  patient: {
    id: string
    firstName: string
    lastName: string
    patientNumber: string
    allergies: string[]
  }
  specialist: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  prescriptions?: Prescription[]
}

interface CurrentUser {
  id: string
  role: 'DOCTOR' | 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'NURSE' | 'PHARMACIST' | string
  firstName?: string
  lastName?: string
  email?: string
  facilityId?: string
}

interface SessionPrescriptionsProps {
  session: TelemedicineSession
  currentUser: CurrentUser
}

export function SessionPrescriptions({ session, currentUser }: SessionPrescriptionsProps) {
  const { toast } = useToast()
  const [showNewPrescription, setShowNewPrescription] = useState(false)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(session.prescriptions || [])

  const canPrescribe = currentUser.role === 'DOCTOR' || 
                      currentUser.role === 'SUPER_ADMIN' ||
                      currentUser.role === 'HOSPITAL_ADMIN'

  const isSpecialist = currentUser.id === session.specialist.id

  const handleNewPrescription = (prescription: Prescription) => {
    setPrescriptions(prev => [prescription, ...prev])
    setShowNewPrescription(false)
    
    toast({
      title: "Prescription Created",
      description: "New prescription has been added successfully.",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'COMPLETED':
        return 'secondary'
      case 'CANCELLED':
        return 'destructive'
      case 'EXPIRED':
        return 'outline'
      case 'DISCONTINUED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Nairobi'
    })
  }

  const checkAllergyConflict = (medicationName: string) => {
    return session.patient.allergies.some(allergy => 
      medicationName.toLowerCase().includes(allergy.toLowerCase()) ||
      allergy.toLowerCase().includes(medicationName.toLowerCase())
    )
  }

  const activePrescriptions = prescriptions.filter(p => p.status === 'ACTIVE')
  const completedPrescriptions = prescriptions.filter(p => p.status === 'COMPLETED')
  const otherPrescriptions = prescriptions.filter(p => !['ACTIVE', 'COMPLETED'].includes(p.status))

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prescriptions</h2>
          <p className="text-muted-foreground">
            Manage medications and prescriptions for {session.patient.firstName} {session.patient.lastName}
          </p>
        </div>
        
        {canPrescribe && isSpecialist && (
          <Button onClick={() => setShowNewPrescription(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prescription
          </Button>
        )}
      </div>

      {/* Allergy Warning */}
      {session.patient.allergies.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Patient Allergies</h4>
                <p className="text-sm text-amber-700 mt-1">
                  This patient has known allergies: {session.patient.allergies.join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Prescription Form */}
      {showNewPrescription && (
        <NewPrescriptionForm
          session={session}
          currentUser={currentUser}
          onSave={handleNewPrescription}
          onCancel={() => setShowNewPrescription(false)}
        />
      )}

      {/* Active Prescriptions */}
      {activePrescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-600" />
              Active Prescriptions
            </CardTitle>
            <CardDescription>
              Currently active medications for this patient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePrescriptions.map((prescription) => {
                    const hasAllergyConflict = checkAllergyConflict(prescription.medication.name)
                    
                    return (
                      <TableRow key={prescription.id} className={hasAllergyConflict ? 'bg-red-50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">{prescription.medication.name}</div>
                              {prescription.medication.genericName && (
                                <div className="text-sm text-muted-foreground">
                                  {prescription.medication.genericName}
                                </div>
                              )}
                            </div>
                            {hasAllergyConflict && (
                              <Badge variant="destructive" className="text-xs">
                                Allergy Risk
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{prescription.dosage}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {prescription.route.toLowerCase()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{prescription.frequency}</div>
                            {prescription.asNeeded && (
                              <Badge variant="outline" className="text-xs">
                                PRN
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {prescription.duration || 'Until review'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(prescription.status)}>
                            {prescription.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            {canPrescribe && isSpecialist && (
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Completed Prescriptions */}
      {completedPrescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Completed Prescriptions
            </CardTitle>
            <CardDescription>
              Previously completed medication courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        <div className="font-medium">{prescription.medication.name}</div>
                        {prescription.medication.genericName && (
                          <div className="text-sm text-muted-foreground">
                            {prescription.medication.genericName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{prescription.dosage}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {prescription.route.toLowerCase()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {prescription.duration || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {prescription.endDate ? formatDate(prescription.endDate) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Other Prescriptions */}
      {otherPrescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Prescriptions</CardTitle>
            <CardDescription>
              Cancelled, expired, or discontinued medications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        <div className="font-medium">{prescription.medication.name}</div>
                      </TableCell>
                      <TableCell>
                        {prescription.dosage}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {prescription.status === 'CANCELLED' && 'Prescription cancelled'}
                          {prescription.status === 'EXPIRED' && 'Prescription expired'}
                          {prescription.status === 'DISCONTINUED' && 'Medication discontinued'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(prescription.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {prescriptions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Prescriptions</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              {canPrescribe && isSpecialist
                ? "No prescriptions have been created for this session yet. Start by adding a new prescription."
                : "No prescriptions have been created for this session."
              }
            </p>
            {canPrescribe && isSpecialist && (
              <Button onClick={() => setShowNewPrescription(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Prescription
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prescription Summary */}
      {prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prescription Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{prescriptions.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{activePrescriptions.length}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{completedPrescriptions.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  {prescriptions.filter(p => p.shaCovered).length}
                </div>
                <div className="text-sm text-muted-foreground">SHA Covered</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}