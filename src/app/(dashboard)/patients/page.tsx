// src/app/(dashboard)/patients/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { 
  Search, 
  Plus, 
  Users, 
  Filter, 
  Download,
  MoreHorizontal,
  Phone,
  IdCard,
  Shield,
  ChevronDown,
  FileText,
  Table,
  Database,
  File
} from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'

interface Patient {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone: string
  nationalId: string
  shaNumber: string
  currentStatus: string
  currentHospital?: {
    id: string
    name: string
    code: string
  }
  triageEntries: Array<{
    triageLevel: string
    status: string
    arrivalTime: string
  }>
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export default function PatientsPage() {
  const { user, hasPermission } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  })

  const fetchPatients = useCallback(async (page = 1, search = '', status = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status && { status }),
        ...(user?.facilityId && { hospitalId: user.facilityId })
      })

      const response = await fetch(`/api/patients?${params}`)
      const data = await response.json()

      if (response.ok) {
        setPatients(data.patients)
        setPagination(data.pagination)
      } else {
        console.error('Error fetching patients:', data.error)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.facilityId])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPatients(1, searchTerm, statusFilter)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    fetchPatients(1, searchTerm, status)
  }

  const handleExport = async (format: 'csv' | 'xlsx' | 'json' | 'pdf') => {
    try {
      setExportLoading(true)
      
      // Build query parameters matching current filters
      const params = new URLSearchParams({
        format,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(user?.facilityId && { hospitalId: user.facilityId })
      })

      const response = await fetch(`/api/patients/export?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(errorData.error || 'Export failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Set filename based on format
      const timestamp = new Date().toISOString().split('T')[0]
      const filters = []
      if (searchTerm) filters.push(`search-${searchTerm.substring(0, 10)}`)
      if (statusFilter) filters.push(`status-${statusFilter}`)
      const filterSuffix = filters.length > 0 ? `_${filters.join('-')}` : ''
      
      let filename = `patients_${timestamp}${filterSuffix}`
      if (format === 'csv') filename += '.csv'
      else if (format === 'xlsx') filename += '.xlsx'
      else if (format === 'json') filename += '.json'
      else if (format === 'pdf') filename += '.pdf'
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)

    } catch (error) {
      console.error('Export error:', error)
      alert(error instanceof Error ? error.message : 'Failed to export data. Please try again.')
    } finally {
      setExportLoading(false)
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Management</h1>
          <p className="text-muted-foreground">
            Manage patient records and medical information
          </p>
        </div>
        {hasPermission('patients.write') && (
          <Button asChild>
            <Link href="/patients/new">
              <Plus className="w-4 h-4 mr-2" />
              New Patient
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all facilities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => 
                ['IN_TRIAGE', 'IN_TREATMENT', 'IN_SURGERY', 'ADMITTED', 'IN_ICU'].includes(p.currentStatus)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently receiving care
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SHA Registered</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => p.shaNumber).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Covered by SHA insurance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => {
                const created = new Date(p.triageEntries[0]?.arrivalTime || p.dateOfBirth)
                const now = new Date()
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              New registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
          <CardDescription>
            Search patients by name, ID, phone number, or patient number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit">
                Search
              </Button>
              
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={exportLoading || loading}>
                    {exportLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleExport('csv')}
                    className="cursor-pointer"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export as CSV
                    <span className="ml-auto text-xs text-muted-foreground">
                      Excel compatible
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport('xlsx')}
                    className="cursor-pointer"
                  >
                    <Table className="w-4 h-4 mr-2" />
                    Export as Excel
                    <span className="ml-auto text-xs text-muted-foreground">
                      .xlsx format
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport('pdf')}
                    className="cursor-pointer"
                  >
                    <File className="w-4 h-4 mr-2" />
                    Export as PDF
                    <span className="ml-auto text-xs text-muted-foreground">
                      Print ready
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport('json')}
                    className="cursor-pointer"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Export as JSON
                    <span className="ml-auto text-xs text-muted-foreground">
                      Raw data
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Exports {pagination.totalCount} filtered records
                    {searchTerm && ` • Search: "${searchTerm.substring(0, 20)}${searchTerm.length > 20 ? '...' : ''}"`}
                    {statusFilter && ` • Status: ${statusFilter}`}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('')}
              >
                All
              </Button>
              {['REGISTERED', 'IN_TRIAGE', 'IN_TREATMENT', 'ADMITTED', 'DISCHARGED'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                >
                  {status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                </Button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
          <CardDescription>
            {pagination.totalCount} patients found
            {searchTerm && ` • Search: "${searchTerm}"`}
            {statusFilter && ` • Status: ${statusFilter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No patients found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter ? 'Try adjusting your search criteria' : 'No patients have been registered yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          href={`/patients/${patient.id}`}
                          className="font-semibold hover:underline truncate"
                        >
                          {patient.firstName} {patient.lastName}
                        </Link>
                        {getStatusBadge(patient.currentStatus)}
                        {patient.triageEntries[0] && getTriageBadge(patient.triageEntries[0].triageLevel)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <IdCard className="w-3 h-3" />
                          <span>{patient.patientNumber}</span>
                        </div>
                        {patient.nationalId && (
                          <div className="flex items-center gap-1">
                            <span>ID: {patient.nationalId}</span>
                          </div>
                        )}
                        {patient.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{patient.phone}</span>
                          </div>
                        )}
                        <span>Age: {calculateAge(patient.dateOfBirth)}</span>
                        <span className="capitalize">{patient.gender.toLowerCase()}</span>
                      </div>

                      {patient.currentHospital && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Facility: {patient.currentHospital.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/patients/${patient.id}`}>
                        View
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} patients
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => fetchPatients(pagination.page - 1, searchTerm, statusFilter)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchPatients(pagination.page + 1, searchTerm, statusFilter)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}