'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Staff, StaffSearchParams } from '@/app/types/staff.types'
import { StaffRole, EmploymentType, FacilityType } from '@prisma/client'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Search, Plus, Edit, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu'
import { Pagination } from '@/app/components/shared/Pagination'
import { LoadingSpinner } from '@/app/components/shared/LoadingSpinner'
import { EmptyState } from '@/app/components/shared/EmptyState'

interface StaffListProps {
  initialStaff?: Staff[]
  initialPagination?: any
  hospitalId?: string
}

export function StaffList({ initialStaff, initialPagination, hospitalId }: StaffListProps) {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff[]>(initialStaff || [])
  const [loading, setLoading] = useState(!initialStaff)
  const [searchParams, setSearchParams] = useState<StaffSearchParams>({
    page: 1,
    limit: 50,
    hospitalId
  })
  const [pagination, setPagination] = useState(initialPagination)

  const fetchStaff = async (params: StaffSearchParams) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })

      const response = await fetch(`/api/staff?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch staff')
      
      const data = await response.json()
      setStaff(data.staff || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching staff:', error)
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialStaff) {
      fetchStaff(searchParams)
    }
  }, [])

  const handleSearch = (field: keyof StaffSearchParams, value: any) => {
    const newParams = { ...searchParams, [field]: value, page: 1 }
    setSearchParams(newParams)
    fetchStaff(newParams)
  }

  const handlePageChange = (page: number) => {
    const newParams = { ...searchParams, page }
    setSearchParams(newParams)
    fetchStaff(newParams)
  }

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

  const getStatusBadge = (staff: Staff) => {
    if (!staff.isActive) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    if (staff.isOnDuty) {
      return <Badge variant="default">On Duty</Badge>
    }
    return <Badge variant="outline">Off Duty</Badge>
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage hospital staff, schedules, and assignments
          </p>
        </div>
        <Button onClick={() => router.push('/staff/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search staff..."
                value={searchParams.search || ''}
                onChange={(e) => handleSearch('search', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={searchParams.role || ''}
                onValueChange={(value) => handleSearch('role', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  {Object.values(StaffRole).map(role => (
                    <SelectItem key={role} value={role}>
                      {role.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={searchParams.isActive?.toString() || ''}
                onValueChange={(value) => handleSearch('isActive', value === '' ? undefined : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duty Status</label>
              <Select
                value={searchParams.isOnDuty?.toString() || ''}
                onValueChange={(value) => handleSearch('isOnDuty', value === '' ? undefined : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All duty status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All duty status</SelectItem>
                  <SelectItem value="true">On Duty</SelectItem>
                  <SelectItem value="false">Off Duty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            {pagination?.total || 0} staff members found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <EmptyState
              title="No staff members found"
              description="Try adjusting your search filters or add new staff members."
              action={
                <Button onClick={() => router.push('/staff/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Caseload</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((staffMember) => (
                    <TableRow key={staffMember.id}>
                      <TableCell className="font-mono text-sm">
                        {staffMember.staffNumber}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {staffMember.firstName} {staffMember.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {staffMember.employmentType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(staffMember.role)}>
                          {staffMember.role.replace(/_/g, ' ')}
                        </Badge>
                        {staffMember.specialization && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {staffMember.specialization}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {staffMember.department?.name || 'No Department'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{staffMember.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {staffMember.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(staffMember)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(staffMember.currentCaseload / staffMember.maxCaseload) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm">
                            {staffMember.currentCaseload}/{staffMember.maxCaseload}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/staff/${staffMember.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/staff/${staffMember.id}/edit`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/staff/${staffMember.id}/schedule`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Schedule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.pages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}