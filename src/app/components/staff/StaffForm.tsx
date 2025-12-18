'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StaffFormData, Staff } from '@/app/types/staff.types'
import { StaffRole, EmploymentType, ContractType, FacilityType, Gender } from '@prisma/client'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { Calendar } from '@/app/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Save, ArrowLeft } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from '@/app/hooks/use-toast'

interface StaffFormProps {
  staff?: Staff
  hospitals?: any[]
  departments?: any[]
  healthCenters?: any[]
  dispensaries?: any[]
}

export function StaffForm({ staff, hospitals, departments, healthCenters, dispensaries }: StaffFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: staff?.firstName || '',
    lastName: staff?.lastName || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    nationalId: staff?.nationalId || '',
    gender: staff?.gender || Gender.MALE,
    role: staff?.role || StaffRole.NURSE,
    specialization: staff?.specialization || '',
    licenseNumber: staff?.licenseNumber || '',
    licensingBody: staff?.licensingBody || '',
    yearsOfExperience: staff?.yearsOfExperience || 0,
    employmentType: staff?.employmentType || EmploymentType.PERMANENT,
    contractType: staff?.contractType || ContractType.COUNTY,
    monthlySalary: staff?.monthlySalary || 0,
    facilityType: staff?.facilityType || FacilityType.HOSPITAL,
    hospitalId: staff?.hospitalId || '',
    healthCenterId: staff?.healthCenterId || '',
    dispensaryId: staff?.dispensaryId || '',
    departmentId: staff?.departmentId || '',
    hireDate: staff?.hireDate || new Date(),
    isActive: staff?.isActive !== undefined ? staff.isActive : true,
    telemedicineEnabled: staff?.telemedicineEnabled || false,
    canGiveRemoteConsultations: staff?.canGiveRemoteConsultations || false
  })

  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType>(
    staff?.facilityType || FacilityType.HOSPITAL
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = staff ? `/api/staff/${staff.id}` : '/api/staff'
      const method = staff ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save staff')
      }

      const savedStaff = await response.json()

      toast({
        title: staff ? 'Staff updated' : 'Staff created',
        description: staff 
          ? `${savedStaff.firstName} ${savedStaff.lastName} has been updated successfully.`
          : `${savedStaff.firstName} ${savedStaff.lastName} has been created successfully.`,
      })

      router.push('/staff')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save staff',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof StaffFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFacilityTypeChange = (value: string) => {
    const facilityType = value as FacilityType
    setSelectedFacilityType(facilityType)
    setFormData(prev => ({
      ...prev,
      facilityType: facilityType,
      hospitalId: facilityType === FacilityType.HOSPITAL ? prev.hospitalId : undefined,
      healthCenterId: facilityType === FacilityType.HEALTH_CENTER ? prev.healthCenterId : undefined,
      dispensaryId: facilityType === FacilityType.DISPENSARY ? prev.dispensaryId : undefined
    }))
  }

  // Helper functions to handle enum conversions
  const handleGenderChange = (value: string) => {
    handleInputChange('gender', value as Gender)
  }

  const handleRoleChange = (value: string) => {
    handleInputChange('role', value as StaffRole)
  }

  const handleEmploymentTypeChange = (value: string) => {
    handleInputChange('employmentType', value as EmploymentType)
  }

  const handleContractTypeChange = (value: string) => {
    handleInputChange('contractType', value as ContractType)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h1>
          <p className="text-muted-foreground">
            {staff 
              ? `Update ${staff.firstName} ${staff.lastName}'s information`
              : 'Create a new staff member record'
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Basic personal and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={handleGenderChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Gender).map(gender => (
                        <SelectItem key={gender} value={gender}>
                          {gender.charAt(0) + gender.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>
                Role and employment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(StaffRole).map(role => (
                      <SelectItem key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>
                Contract and facility information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={handleEmploymentTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EmploymentType).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractType">Contract Type *</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={handleContractTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ContractType).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlySalary">Monthly Salary (KES)</Label>
                <Input
                  id="monthlySalary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlySalary}
                  onChange={(e) => handleInputChange('monthlySalary', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.hireDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.hireDate ? format(formData.hireDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.hireDate}
                      onSelect={(date) => handleInputChange('hireDate', date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Facility Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Facility Assignment</CardTitle>
              <CardDescription>
                Assign staff to a facility and department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facilityType">Facility Type *</Label>
                <Select
                  value={selectedFacilityType}
                  onValueChange={handleFacilityTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FacilityType).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFacilityType === FacilityType.HOSPITAL && (
                <div className="space-y-2">
                  <Label htmlFor="hospitalId">Hospital</Label>
                  <Select
                    value={formData.hospitalId}
                    onValueChange={(value) => handleInputChange('hospitalId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals?.map(hospital => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          {hospital.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedFacilityType === FacilityType.HEALTH_CENTER && (
                <div className="space-y-2">
                  <Label htmlFor="healthCenterId">Health Center</Label>
                  <Select
                    value={formData.healthCenterId}
                    onValueChange={(value) => handleInputChange('healthCenterId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select health center" />
                    </SelectTrigger>
                    <SelectContent>
                      {healthCenters?.map(center => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedFacilityType === FacilityType.DISPENSARY && (
                <div className="space-y-2">
                  <Label htmlFor="dispensaryId">Dispensary</Label>
                  <Select
                    value={formData.dispensaryId}
                    onValueChange={(value) => handleInputChange('dispensaryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dispensary" />
                    </SelectTrigger>
                    <SelectContent>
                      {dispensaries?.map(dispensary => (
                        <SelectItem key={dispensary.id} value={dispensary.id}>
                          {dispensary.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => handleInputChange('departmentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Additional settings and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="flex flex-col space-y-1">
                  <span>Active Status</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Staff member is active in the system
                  </span>
                </Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="telemedicineEnabled" className="flex flex-col space-y-1">
                  <span>Telemedicine Enabled</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Can participate in telemedicine sessions
                  </span>
                </Label>
                <Switch
                  id="telemedicineEnabled"
                  checked={formData.telemedicineEnabled}
                  onCheckedChange={(checked) => handleInputChange('telemedicineEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="canGiveRemoteConsultations" className="flex flex-col space-y-1">
                  <span>Remote Consultations</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Can give remote consultations
                  </span>
                </Label>
                <Switch
                  id="canGiveRemoteConsultations"
                  checked={formData.canGiveRemoteConsultations}
                  onCheckedChange={(checked) => handleInputChange('canGiveRemoteConsultations', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : staff ? 'Update Staff' : 'Create Staff'}
          </Button>
        </div>
      </form>
    </div>
  )
}