// app/components/hospitals/HospitalDepartments.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import { Plus, Search, Users, Stethoscope, Building, Phone, Edit, Trash2 } from 'lucide-react'
import type { Hospital } from '@/app/lib/types'

// Define User type locally since it's not exported from your types
interface User {
  id: string
  email: string
  name: string
  role: string
  facilityId?: string
  countyId?: string
  permissions: string[]
}

interface Department {
  id: string
  name: string
  type: 'CLINICAL' | 'NON_CLINICAL' | 'SUPPORT_SERVICES'
  headOfDepartment?: string
  contactEmail?: string
  contactPhone?: string
  totalStaff: number
  availableStaff: number
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE'
  description?: string
  services: string[]
  createdAt: string
  updatedAt: string
}

interface HospitalDepartmentsProps {
  hospital: Hospital
  user?: User | null
}

// Mock data - replace with actual API calls
const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Emergency Department',
    type: 'CLINICAL',
    headOfDepartment: 'Dr. Sarah Kimani',
    contactEmail: 'emergency@hospital.co.ke',
    contactPhone: '+254712345678',
    totalStaff: 25,
    availableStaff: 18,
    status: 'ACTIVE',
    description: '24/7 emergency medical services and trauma care',
    services: ['Trauma Care', 'Emergency Medicine', 'Triage', 'Resuscitation'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Surgery',
    type: 'CLINICAL',
    headOfDepartment: 'Dr. James Omondi',
    contactEmail: 'surgery@hospital.co.ke',
    contactPhone: '+254712345679',
    totalStaff: 18,
    availableStaff: 12,
    status: 'ACTIVE',
    description: 'General and specialized surgical procedures',
    services: ['General Surgery', 'Orthopedics', 'Neurosurgery', 'Cardiac Surgery'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Pediatrics',
    type: 'CLINICAL',
    headOfDepartment: 'Dr. Grace Wambui',
    contactEmail: 'pediatrics@hospital.co.ke',
    contactPhone: '+254712345680',
    totalStaff: 15,
    availableStaff: 10,
    status: 'ACTIVE',
    description: 'Medical care for infants, children, and adolescents',
    services: ['Child Health', 'Vaccinations', 'Growth Monitoring', 'Pediatric Emergency'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '4',
    name: 'Radiology',
    type: 'CLINICAL',
    headOfDepartment: 'Dr. Peter Maina',
    contactEmail: 'radiology@hospital.co.ke',
    contactPhone: '+254712345681',
    totalStaff: 8,
    availableStaff: 6,
    status: 'ACTIVE',
    description: 'Medical imaging and diagnostic services',
    services: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '5',
    name: 'Laboratory',
    type: 'CLINICAL',
    headOfDepartment: 'Dr. Susan Akinyi',
    contactEmail: 'lab@hospital.co.ke',
    contactPhone: '+254712345682',
    totalStaff: 12,
    availableStaff: 8,
    status: 'ACTIVE',
    description: 'Clinical laboratory testing and analysis',
    services: ['Blood Tests', 'Microbiology', 'Pathology', 'Biochemistry'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
]

export function HospitalDepartments({ hospital, user }: HospitalDepartmentsProps) {
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dept.headOfDepartment?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'ALL' || dept.type === selectedType
    return matchesSearch && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200'
      case 'INACTIVE': return 'bg-red-100 text-red-800 border-red-200'
      case 'UNDER_MAINTENANCE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CLINICAL': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'NON_CLINICAL': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SUPPORT_SERVICES': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canManageDepartments = user?.permissions?.includes('hospitals.write') || 
                              user?.permissions?.includes('*') ||
                              user?.role === 'HOSPITAL_ADMIN'

  const handleAddDepartment = (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDepartment: Department = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setDepartments(prev => [...prev, newDepartment])
    setIsAddDialogOpen(false)
  }

  const handleEditDepartment = (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingDepartment) return
    
    setDepartments(prev => prev.map(dept => 
      dept.id === editingDepartment.id 
        ? { ...data, id: dept.id, createdAt: dept.createdAt, updatedAt: new Date().toISOString() }
        : dept
    ))
    setEditingDepartment(null)
  }

  const handleDeleteDepartment = (id: string) => {
    setDepartments(prev => prev.filter(dept => dept.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Total Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              {departments.filter(d => d.status === 'ACTIVE').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => sum + dept.totalStaff, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {departments.reduce((sum, dept) => sum + dept.availableStaff, 0)} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Clinical Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter(d => d.type === 'CLINICAL').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Patient care services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Hospital Departments</CardTitle>
              <CardDescription>
                Manage departments and staff at {hospital.name}
              </CardDescription>
            </div>
            {canManageDepartments && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <AddEditDepartmentDialog
                  hospital={hospital}
                  onSave={handleAddDepartment}
                  onCancel={() => setIsAddDialogOpen(false)}
                />
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="CLINICAL">Clinical</SelectItem>
                <SelectItem value="NON_CLINICAL">Non-Clinical</SelectItem>
                <SelectItem value="SUPPORT_SERVICES">Support Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Departments Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Head of Department</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Services</TableHead>
                  {canManageDepartments && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <div className="font-medium">{department.name}</div>
                      {department.description && (
                        <div className="text-sm text-muted-foreground">
                          {department.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getTypeColor(department.type)}>
                        {department.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{department.headOfDepartment || 'Not assigned'}</div>
                      {department.contactPhone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {department.contactPhone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {department.availableStaff}/{department.totalStaff}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((department.availableStaff / department.totalStaff) * 100)}% available
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(department.status)}>
                        {department.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {department.services.slice(0, 3).map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {department.services.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{department.services.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {canManageDepartments && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingDepartment(department)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <AddEditDepartmentDialog
                              hospital={hospital}
                              department={department}
                              onSave={handleEditDepartment}
                              onCancel={() => setEditingDepartment(null)}
                            />
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDepartment(department.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDepartments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No departments found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Add/Edit Department Dialog Component
interface AddEditDepartmentDialogProps {
  hospital: Hospital
  department?: Department
  onSave: (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

function AddEditDepartmentDialog({ hospital, department, onSave, onCancel }: AddEditDepartmentDialogProps) {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    type: department?.type || 'CLINICAL' as Department['type'],
    headOfDepartment: department?.headOfDepartment || '',
    contactEmail: department?.contactEmail || '',
    contactPhone: department?.contactPhone || '',
    totalStaff: department?.totalStaff || 0,
    availableStaff: department?.availableStaff || 0,
    status: department?.status || 'ACTIVE' as Department['status'],
    description: department?.description || '',
    services: department?.services || [] as string[]
  })

  const [newService, setNewService] = useState('')

  const handleAddService = () => {
    if (newService.trim() && !formData.services.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, newService.trim()]
      }))
      setNewService('')
    }
  }

  const handleRemoveService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  // ── Fix: shadcn Select onValueChange always passes `string`.
  // Accept string and cast to the narrower union type inside the handler.
  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value as Department['type'] }))
  }

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as Department['status'] }))
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {department ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogDescription>
          {department 
            ? `Update department details for ${hospital.name}`
            : `Create a new department for ${hospital.name}`
          }
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Emergency Department"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Department Type *</Label>
            {/* onValueChange receives string — use handleTypeChange to cast safely */}
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLINICAL">Clinical</SelectItem>
                <SelectItem value="NON_CLINICAL">Non-Clinical</SelectItem>
                <SelectItem value="SUPPORT_SERVICES">Support Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headOfDepartment">Head of Department</Label>
            <Input
              id="headOfDepartment"
              value={formData.headOfDepartment}
              onChange={(e) => setFormData(prev => ({ ...prev, headOfDepartment: e.target.value }))}
              placeholder="e.g., Dr. John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            {/* onValueChange receives string — use handleStatusChange to cast safely */}
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              placeholder="+254712345678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="department@hospital.co.ke"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalStaff">Total Staff *</Label>
            <Input
              id="totalStaff"
              type="number"
              value={formData.totalStaff}
              onChange={(e) => setFormData(prev => ({ ...prev, totalStaff: parseInt(e.target.value) || 0 }))}
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availableStaff">Available Staff *</Label>
            <Input
              id="availableStaff"
              type="number"
              value={formData.availableStaff}
              onChange={(e) => setFormData(prev => ({ ...prev, availableStaff: parseInt(e.target.value) || 0 }))}
              min="0"
              max={formData.totalStaff}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the department's services and functions..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Services Offered</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Add a service..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
            />
            <Button type="button" onClick={handleAddService}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.services.map((service, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {service}
                <button
                  type="button"
                  onClick={() => handleRemoveService(service)}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {department ? 'Update Department' : 'Create Department'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}