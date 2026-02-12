'use client'

import { StaffRole, EmploymentType, ContractType, FacilityType, Gender } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Separator } from '@/app/components/ui/separator'
import { Calendar, Mail, Phone, MapPin, Edit, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

// Define the actual structure returned by StaffService.getStaffById()
interface StaffWithRelations {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  nationalId: string | null
  gender: Gender | null // Make gender optional since it might not be in the service response
  staffNumber: string
  role: StaffRole
  facilityType: FacilityType | null
  employmentType: EmploymentType
  contractType: ContractType
  specialization: string | null
  licenseNumber: string | null
  licensingBody: string | null
  yearsOfExperience: number | null
  monthlySalary: number | null
  hireDate: Date
  currentCaseload: number
  maxCaseload: number
  isActive: boolean
  isOnDuty: boolean
  telemedicineEnabled: boolean
  canGiveRemoteConsultations: boolean
  hospitalId: string | null
  healthCenterId: string | null
  dispensaryId: string | null
  departmentId: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
  hospital: {
    id: string
    name: string
    code: string
    countyId: string
  } | null
  healthCenter: {
    id: string
    name: string
    code: string
    countyId: string
  } | null
  dispensary: {
    id: string
    name: string
    code: string
    countyId: string
  } | null
  department: {
    id: string
    name: string
    type: string
  } | null
}

interface StaffProfileProps {
  staff: StaffWithRelations & {
    triageEntries?: Array<{
      id: string
      triageNumber: string
      createdAt: Date
      triageLevel: string
    }>
    treatments?: Array<{
      id: string
      treatmentNumber: string
      procedureName: string
      treatmentDate: Date
    }>
    diagnoses?: Array<{
      id: string
      diagnosisNumber: string
      condition: string
      diagnosedAt: Date
    }>
  }
}

export function StaffProfile({ staff }: StaffProfileProps) {
  const router = useRouter()

  const getRoleBadgeVariant = (role: StaffRole) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      SUPER_ADMIN: 'destructive',
      COUNTY_ADMIN: 'destructive',
      HOSPITAL_ADMIN: 'default',
      DOCTOR: 'default',
      NURSE: 'secondary',
      TRIAGE_OFFICER: 'secondary',
      DISPATCHER: 'outline',
      AMBULANCE_DRIVER: 'outline',
      FINANCE_OFFICER: 'outline',
      LAB_TECHNICIAN: 'outline',
      PHARMACIST: 'outline'
    }
    return variants[role] || 'outline'
  }

  const getStatusBadge = () => {
    if (!staff.isActive) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    if (staff.isOnDuty) {
      return <Badge variant="default">On Duty</Badge>
    }
    return <Badge variant="outline">Off Duty</Badge>
  }

  const getFacilityName = () => {
    if (staff.hospital) return staff.hospital.name
    if (staff.healthCenter) return staff.healthCenter.name
    if (staff.dispensary) return staff.dispensary.name
    return 'No facility assigned'
  }

  const getFacilityTypeDisplay = () => {
    return staff.facilityType ? staff.facilityType.toLowerCase().replace(/_/g, ' ') : 'Not assigned'
  }

  // Safe format date function
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not specified'
    try {
      return format(new Date(date), 'PPP')
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {staff.firstName} {staff.lastName}
          </h1>
          <p className="text-muted-foreground">
            Staff ID: {staff.staffNumber}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/staff/${staff.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={() => router.push(`/staff/${staff.id}/schedule`)}
          >
            <Clock className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <p className="text-lg">{staff.firstName} {staff.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Gender
                </label>
                <p className="text-lg capitalize">{staff.gender ? staff.gender.toLowerCase() : 'Not specified'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <p className="text-lg">{staff.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone
                </label>
                <p className="text-lg">{staff.phone || 'Not specified'}</p>
              </div>
            </div>

            {staff.nationalId && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  National ID
                </label>
                <p className="text-lg">{staff.nationalId}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-muted-foreground">
                Role
              </label>
              <Badge variant={getRoleBadgeVariant(staff.role)}>
                {staff.role.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              {getStatusBadge()}
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Employment Type
              </label>
              <p className="text-lg capitalize">{staff.employmentType.toLowerCase()}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Contract Type
              </label>
              <p className="text-lg capitalize">{staff.contractType.toLowerCase()}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                <Calendar className="w-4 h-4 inline mr-2" />
                Hire Date
              </label>
              <p className="text-lg">{formatDate(staff.hireDate)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Facility & Department */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                <MapPin className="w-4 h-4 inline mr-2" />
                Facility
              </label>
              <p className="text-lg">{getFacilityName()}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {getFacilityTypeDisplay()}
              </p>
            </div>

            {staff.department && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Department
                </label>
                <p className="text-lg">{staff.department.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {staff.department.type?.toLowerCase().replace(/_/g, ' ') || 'No type specified'}
                </p>
              </div>
            )}

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Caseload
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min((staff.currentCaseload / (staff.maxCaseload || 1)) * 100, 100)}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {staff.currentCaseload}/{staff.maxCaseload || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle>Qualifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {staff.specialization && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Specialization
                </label>
                <p className="text-lg">{staff.specialization}</p>
              </div>
            )}

            {staff.licenseNumber && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  License Number
                </label>
                <p className="text-lg">{staff.licenseNumber}</p>
              </div>
            )}

            {staff.licensingBody && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Licensing Body
                </label>
                <p className="text-lg">{staff.licensingBody}</p>
              </div>
            )}

            {staff.yearsOfExperience !== undefined && staff.yearsOfExperience !== null && staff.yearsOfExperience > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Years of Experience
                </label>
                <p className="text-lg">{staff.yearsOfExperience} years</p>
              </div>
            )}

            {staff.monthlySalary && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Monthly Salary
                </label>
                <p className="text-lg">KES {staff.monthlySalary.toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Telemedicine Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Telemedicine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-muted-foreground">
                Telemedicine Enabled
              </label>
              <Badge variant={staff.telemedicineEnabled ? 'default' : 'outline'}>
                {staff.telemedicineEnabled ? 'Yes' : 'No'}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-muted-foreground">
                Remote Consultations
              </label>
              <Badge variant={staff.canGiveRemoteConsultations ? 'default' : 'outline'}>
                {staff.canGiveRemoteConsultations ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {(staff.triageEntries?.length || staff.treatments?.length || staff.diagnoses?.length) ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Last 10 activities across different modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staff.triageEntries?.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Triage Assessment</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.triageNumber} • {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {entry.triageLevel}
                    </Badge>
                  </div>
                ))}

                {staff.treatments?.map((treatment) => (
                  <div key={treatment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Treatment</p>
                      <p className="text-sm text-muted-foreground">
                        {treatment.treatmentNumber} • {formatDate(treatment.treatmentDate)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {treatment.procedureName}
                    </Badge>
                  </div>
                ))}

                {staff.diagnoses?.map((diagnosis) => (
                  <div key={diagnosis.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Diagnosis</p>
                      <p className="text-sm text-muted-foreground">
                        {diagnosis.diagnosisNumber} • {formatDate(diagnosis.diagnosedAt)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {diagnosis.condition}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                No recent activity recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This staff member has no recent activities in the system.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}