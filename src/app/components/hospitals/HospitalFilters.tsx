// app/components/hospitals/HospitalFilters.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Search, Filter, X } from 'lucide-react'

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale'
]

const HOSPITAL_LEVELS = ['LEVEL_6', 'LEVEL_5', 'LEVEL_4', 'LEVEL_3']

const HOSPITAL_TYPES = ['PUBLIC', 'PRIVATE', 'MISSION', 'NGO']

const STATUS_OPTIONS = ['OPERATIONAL', 'LIMITED_CAPACITY', 'OVERWHELMED', 'CLOSED']

export function HospitalFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    county: searchParams.get('county') || '',
    level: searchParams.get('level') || '',
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    
    router.push(`/hospitals?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      county: '',
      level: '',
      type: '',
      status: '',
    })
    router.push('/hospitals')
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hospitals..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filters.county} onValueChange={(value) => handleFilterChange('county', value)}>
            <SelectTrigger>
              <SelectValue placeholder="County" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Counties</SelectItem>
              {COUNTIES.map(county => (
                <SelectItem key={county} value={county}>{county}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              {HOSPITAL_LEVELS.map(level => (
                <SelectItem key={level} value={level}>{level.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              {STATUS_OPTIONS.map(status => (
                <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}