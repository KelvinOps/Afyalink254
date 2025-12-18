// app/components/hospitals/HospitalList.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/components/ui/pagination'
import { Building, MapPin, Phone, Users, Eye, Edit } from 'lucide-react'
import type { Hospital } from '@/app/lib/types'

// Define User type locally to match your auth system
interface User {
  id: string
  email: string
  name: string
  role: string
  facilityId?: string
  countyId?: string
  permissions: string[]
}

interface HospitalListProps {
  hospitals: Hospital[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  }
  user?: User | null
}

export function HospitalList({ hospitals, pagination, user }: HospitalListProps) {
  const [currentPage, setCurrentPage] = useState(pagination.currentPage)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return 'bg-green-100 text-green-800 border-green-200'
      case 'LIMITED_CAPACITY': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'OVERWHELMED': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'CLOSED': return 'bg-red-100 text-red-800 border-red-200'
      case 'EMERGENCY_ONLY': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'LEVEL_6': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'LEVEL_5': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'LEVEL_4': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canManageHospitals = user?.permissions?.includes('hospitals.write') || 
                            user?.permissions?.includes('*') ||
                            user?.role === 'SUPER_ADMIN' ||
                            user?.role === 'COUNTY_ADMIN'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hospitals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hospitals.map((hospital) => (
                <TableRow key={hospital.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{hospital.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {hospital.type.replace(/_/g, ' ')} • {hospital.ownership.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{hospital.county?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {hospital.subCounty}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getLevelColor(hospital.level)}>
                      {hospital.level.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(hospital.operationalStatus)}>
                      {hospital.operationalStatus.replace(/_/g, ' ')}
                    </Badge>
                    {hospital.acceptingPatients && (
                      <Badge className="ml-1 bg-green-100 text-green-800 border-green-200">
                        Accepting
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{hospital.availableBeds}/{hospital.totalBeds}</div>
                        <div className="text-xs text-muted-foreground">available</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">{hospital.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/hospitals/${hospital.id}/overview`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {canManageHospitals && (
                        <Link href={`/hospitals/${hospital.id}/settings`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {hospitals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hospitals found matching your criteria.
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href={pagination.hasPrev ? `?page=${currentPage - 1}` : '#'}
                    className={!pagination.hasPrev ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href={`?page=${page}`}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    href={pagination.hasNext ? `?page=${currentPage + 1}` : '#'}
                    className={!pagination.hasNext ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  )
}